import type { QuestionResult, ScoreResult, StoryAnswerKey, StoryPayload, StoryQuestionNode } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";
import { answersMatch } from "./normalization.js";

export interface StoryAnswers {
  // value shape depends on the node's questionType:
  //   MULTIPLE_CHOICE -> selected optionId (string)
  //   TRANSLATION / FILL_BLANK -> typed text (string)
  //   MATCHING -> { pairs: Record<itemId, optionId> }
  answers: Record<string, unknown>;
}

export function scoreStory(payload: StoryPayload, answerKey: StoryAnswerKey, answers: StoryAnswers): ScoreResult {
  const questionNodes = payload.nodes.filter((n): n is StoryQuestionNode => n.kind === "question");
  const questionResults: QuestionResult[] = [];

  for (const node of questionNodes) {
    const keyEntry = answerKey.answers[node.id];
    const submitted = answers.answers?.[node.id];

    if (node.questionType === "MATCHING") {
      const correctPairs = keyEntry?.questionType === "MATCHING" ? keyEntry.correctPairs : {};
      const submittedPairs = (submitted as { pairs?: Record<string, string> } | undefined)?.pairs ?? {};
      for (const item of node.items) {
        const submittedOption = submittedPairs[item.id];
        const expectedOption = correctPairs[item.id];
        questionResults.push({
          questionId: item.id,
          wordIds: [item.wordId],
          correct: submittedOption === expectedOption,
          submitted: submittedOption,
          expected: expectedOption,
        });
      }
      continue;
    }

    if (node.questionType === "MULTIPLE_CHOICE") {
      const expected = keyEntry?.questionType === "MULTIPLE_CHOICE" ? keyEntry.correctOptionId : undefined;
      questionResults.push({
        questionId: node.id,
        wordIds: node.wordIds,
        correct: submitted === expected,
        submitted,
        expected,
      });
      continue;
    }

    // TRANSLATION or FILL_BLANK: both scored by normalized text match
    const accepted = keyEntry?.questionType === "TRANSLATION" || keyEntry?.questionType === "FILL_BLANK" ? keyEntry.acceptedAnswers : [];
    questionResults.push({
      questionId: node.id,
      wordIds: node.wordIds,
      correct: answersMatch(String(submitted ?? ""), accepted),
      submitted,
      expected: accepted,
    });
  }

  return buildScoreResult(questionResults);
}
