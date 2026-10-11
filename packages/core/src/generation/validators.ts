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
  } else {
    // TRANSLATION / FILL_BLANK
    for (const q of submission.payload.questions) {
      if (!(q.id in submission.answerKey.answers)) {
        errors.push(`question "${q.id}" has no entry in answerKey.answers`);
      }
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
