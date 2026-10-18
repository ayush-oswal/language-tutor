import { normalizeAnswerText, stripDiacritics } from "../scoring/normalization.js";
import type { ValidationResult } from "../types.js";
import type { NewWordExerciseSubmission } from "./schemas/newWordExercise.schema.js";
import type { RevisionExerciseSubmission } from "./schemas/revisionExercise.schema.js";
import type { StoryExerciseSubmission } from "./schemas/storyExercise.schema.js";
import type { ExerciseSubmission } from "./schemas/exercise.schema.js";

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

const MIN_WORD_BANK_DISTRACTORS = 2;

/** A word-bank answer is the tapped tiles joined by spaces and scored with answersMatch, so compare at that level. */
function bankTokens(text: string): string[] {
  return stripDiacritics(normalizeAnswerText(text)).split(" ").filter(Boolean);
}

/** Checks that some accepted answer can be built from the tiles, with enough distractors left over. */
function validateWordBank(label: string, wordBank: string[], acceptedAnswers: string[]): string[] {
  const errors: string[] = [];
  const available = new Map<string, number>();
  let tileTokenCount = 0;
  for (const tile of wordBank) {
    const tokens = bankTokens(tile);
    if (tokens.length === 0) errors.push(`${label}: word bank tile "${tile}" has no letters or digits`);
    for (const token of tokens) {
      available.set(token, (available.get(token) ?? 0) + 1);
      tileTokenCount++;
    }
  }

  const buildable = acceptedAnswers.map(bankTokens).filter((tokens) => {
    if (tokens.length === 0) return false;
    const remaining = new Map(available);
    return tokens.every((token) => {
      const left = remaining.get(token) ?? 0;
      remaining.set(token, left - 1);
      return left > 0;
    });
  });
  if (buildable.length === 0) {
    errors.push(
      `${label}: no accepted answer can be built from the word bank — include one tile per word of the answer`,
    );
  } else if (tileTokenCount - Math.max(...buildable.map((t) => t.length)) < MIN_WORD_BANK_DISTRACTORS) {
    errors.push(
      `${label}: the word bank needs at least ${MIN_WORD_BANK_DISTRACTORS} distractor tiles besides the answer's words`,
    );
  }
  return errors;
}

export function collectNewWordIds(submission: NewWordExerciseSubmission): string[] {
  return [
    ...new Set([...submission.stage2.items.map((i) => i.wordId), ...submission.stage3.questions.map((q) => q.wordId)]),
  ];
}

/** `allowedWordIds`: the learner's un-introduced (NEW) words at their current level. */
export function validateNewWordExerciseIntegrity(
  submission: NewWordExerciseSubmission,
  allowedWordIds: Set<string>,
): ValidationResult {
  const errors: string[] = [];
  const itemIds = new Set(submission.stage2.items.map((i) => i.id));
  const optionIds = new Set(submission.stage2.options.map((o) => o.id));

  for (const item of submission.stage2.items) {
    if (!allowedWordIds.has(item.wordId)) {
      errors.push(
        `stage2 item "${item.id}" references wordId "${item.wordId}", which is not a new word at the learner's current level`,
      );
    }
  }
  for (const item of submission.stage2.items) {
    if (!(item.id in submission.answerKey.stage2CorrectPairs)) {
      errors.push(`stage2 item "${item.id}" has no entry in answerKey.stage2CorrectPairs`);
    }
  }
  for (const [itemId, optionId] of Object.entries(submission.answerKey.stage2CorrectPairs)) {
    if (!itemIds.has(itemId)) errors.push(`answerKey.stage2CorrectPairs references unknown item "${itemId}"`);
    if (!optionIds.has(optionId)) errors.push(`answerKey.stage2CorrectPairs references unknown option "${optionId}"`);
  }

  for (const q of submission.stage3.questions) {
    if (!allowedWordIds.has(q.wordId)) {
      errors.push(
        `stage3 question "${q.id}" references wordId "${q.wordId}", which is not a new word at the learner's current level`,
      );
    }
    if ((q.sentence.match(/_{3,}/g) ?? []).length !== 1) {
      errors.push(`stage3 question "${q.id}": sentence must contain the blank "___" exactly once`);
    }
    const qOptionIds = new Set(q.options.map((o) => o.id));
    const answer = submission.answerKey.stage3Answers[q.id];
    if (answer === undefined) {
      errors.push(`stage3 question "${q.id}" has no entry in answerKey.stage3Answers`);
    } else if (!qOptionIds.has(answer)) {
      errors.push(`answerKey.stage3Answers["${q.id}"] is not one of that question's own options`);
    }
  }

  return errors.length === 0 ? ok() : fail(errors);
}

function collectWordIds(submission: RevisionExerciseSubmission): string[] {
  switch (submission.type) {
    case "MATCHING":
      return submission.payload.items.map((i) => i.wordId);
    case "MULTIPLE_CHOICE":
    case "TRANSLATION":
    case "FILL_BLANK":
      return submission.payload.questions.flatMap((q) => q.wordIds);
  }
}

export function validateRevisionExerciseIntegrity(
  submission: RevisionExerciseSubmission,
  allowedWordIds: Set<string>,
): ValidationResult {
  const errors: string[] = [];

  for (const wordId of collectWordIds(submission)) {
    if (!allowedWordIds.has(wordId)) {
      errors.push(`References wordId "${wordId}" which is not one of the learner's revisable words at their current level`);
    }
  }

  if (submission.type === "MATCHING") {
    const itemIds = new Set(submission.payload.items.map((i) => i.id));
    const optionIds = new Set(submission.payload.options.map((o) => o.id));
    for (const item of submission.payload.items) {
      if (!(item.id in submission.answerKey.correctPairs)) {
        errors.push(`item "${item.id}" has no entry in answerKey.correctPairs`);
      }
    }
    for (const [itemId, optionId] of Object.entries(submission.answerKey.correctPairs)) {
      if (!itemIds.has(itemId)) errors.push(`answerKey.correctPairs references unknown item "${itemId}"`);
      if (!optionIds.has(optionId)) errors.push(`answerKey.correctPairs references unknown option "${optionId}"`);
    }
  } else if (submission.type === "MULTIPLE_CHOICE") {
    for (const q of submission.payload.questions) {
      const optionIds = new Set(q.options.map((o) => o.id));
      const answer = submission.answerKey.answers[q.id];
      if (answer === undefined) errors.push(`question "${q.id}" has no entry in answerKey.answers`);
      else if (!optionIds.has(answer)) errors.push(`answerKey.answers["${q.id}"] is not one of that question's options`);
    }
  } else if (submission.type === "TRANSLATION") {
    for (const q of submission.payload.questions) {
      const accepted = submission.answerKey.answers[q.id];
      if (accepted === undefined) errors.push(`question "${q.id}" has no entry in answerKey.answers`);
      if (q.direction !== "TO_TARGET") continue;
      if (!q.wordBank) errors.push(`question "${q.id}" translates into the target language, so it needs a wordBank`);
      else if (accepted) errors.push(...validateWordBank(`question "${q.id}"`, q.wordBank, accepted));
    }
  } else {
    for (const q of submission.payload.questions) {
      const accepted = submission.answerKey.answers[q.id];
      if (accepted === undefined) errors.push(`question "${q.id}" has no entry in answerKey.answers`);
      else errors.push(...validateWordBank(`question "${q.id}"`, q.wordBank, accepted));
    }
  }

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateStoryExerciseIntegrity(
  submission: StoryExerciseSubmission,
  allowedWordIds: Set<string>,
): ValidationResult {
  const errors: string[] = [];

  for (const node of submission.payload.nodes) {
    if (node.kind === "narrative") {
      for (const wordId of node.wordIds ?? []) {
        if (!allowedWordIds.has(wordId)) {
          errors.push(`narrative node "${node.id}" references wordId "${wordId}" which is not one of the learner's revisable words at their current level`);
        }
      }
      continue;
    }
    if (node.questionType === "MATCHING") {
      for (const item of node.items) {
        if (!allowedWordIds.has(item.wordId)) {
          errors.push(`node "${node.id}" item "${item.id}" references wordId "${item.wordId}" which is not one of the learner's revisable words at their current level`);
        }
      }
    } else {
      for (const wordId of node.wordIds) {
        if (!allowedWordIds.has(wordId)) {
          errors.push(`node "${node.id}" references wordId "${wordId}" which is not one of the learner's revisable words at their current level`);
        }
      }
    }
  }

  for (const node of submission.payload.nodes) {
    if (node.kind !== "question") continue;
    const keyEntry = submission.answerKey.answers[node.id];
    if (!keyEntry) {
      errors.push(`question node "${node.id}" has no entry in answerKey.answers`);
      continue;
    }
    if (keyEntry.questionType !== node.questionType) {
      errors.push(
        `answerKey entry for node "${node.id}" has questionType "${keyEntry.questionType}" but the node itself is "${node.questionType}"`,
      );
      continue;
    }
    if (node.questionType === "MULTIPLE_CHOICE" && keyEntry.questionType === "MULTIPLE_CHOICE") {
      const optionIds = new Set(node.options.map((o) => o.id));
      if (!optionIds.has(keyEntry.correctOptionId)) {
        errors.push(`answerKey for node "${node.id}" references an option not in that node's own options`);
      }
    }
    if (node.questionType === "TRANSLATION" && keyEntry.questionType === "TRANSLATION" && node.direction === "TO_TARGET") {
      if (!node.wordBank) errors.push(`node "${node.id}" translates into the target language, so it needs a wordBank`);
      else errors.push(...validateWordBank(`node "${node.id}"`, node.wordBank, keyEntry.acceptedAnswers));
    }
    if (node.questionType === "FILL_BLANK" && keyEntry.questionType === "FILL_BLANK") {
      errors.push(...validateWordBank(`node "${node.id}"`, node.wordBank, keyEntry.acceptedAnswers));
    }
    if (node.questionType === "MATCHING" && keyEntry.questionType === "MATCHING") {
      const itemIds = new Set(node.items.map((i) => i.id));
      const optionIds = new Set(node.options.map((o) => o.id));
      for (const item of node.items) {
        if (!(item.id in keyEntry.correctPairs)) {
          errors.push(`node "${node.id}" item "${item.id}" has no entry in answerKey.correctPairs`);
        }
      }
      for (const [itemId, optionId] of Object.entries(keyEntry.correctPairs)) {
        if (!itemIds.has(itemId)) errors.push(`node "${node.id}" answerKey.correctPairs references unknown item "${itemId}"`);
        if (!optionIds.has(optionId)) errors.push(`node "${node.id}" answerKey.correctPairs references unknown option "${optionId}"`);
      }
    }
  }

  return errors.length === 0 ? ok() : fail(errors);
}

/** `allowedWordIds`: the learner's revisable words (known or already taught, at or below their current level). */
export function validateExerciseIntegrity(
  submission: ExerciseSubmission,
  allowedWordIds: Set<string>,
): ValidationResult {
  return submission.type === "STORY"
    ? validateStoryExerciseIntegrity(submission, allowedWordIds)
    : validateRevisionExerciseIntegrity(submission, allowedWordIds);
}
