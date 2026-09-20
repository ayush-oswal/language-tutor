import type { MatchingAnswerKey, MatchingPayload, QuestionResult, ScoreResult } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";

export interface MatchingAnswers {
  pairs: Record<string, string>; // itemId -> selected optionId
}

export function scoreMatching(
  payload: MatchingPayload,
  answerKey: MatchingAnswerKey,
  answers: MatchingAnswers,
): ScoreResult {
  const questionResults: QuestionResult[] = payload.items.map((item) => {
    const submitted = answers.pairs?.[item.id];
    const expected = answerKey.correctPairs[item.id];
    return {
      questionId: item.id,
      wordIds: [item.wordId],
      correct: submitted === expected,
      submitted,
      expected,
    };
  });
  return buildScoreResult(questionResults);
}
