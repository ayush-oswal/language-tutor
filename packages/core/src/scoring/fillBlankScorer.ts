import type { FillBlankAnswerKey, FillBlankPayload, QuestionResult, ScoreResult } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";
import { answersMatch } from "./normalization.js";

export interface FillBlankAnswers {
  answers: Record<string, string>; // questionId -> submitted text
}

export function scoreFillBlank(
  payload: FillBlankPayload,
  answerKey: FillBlankAnswerKey,
  answers: FillBlankAnswers,
): ScoreResult {
  const questionResults: QuestionResult[] = payload.questions.map((q) => {
    const submitted = answers.answers?.[q.id] ?? "";
    const expected = answerKey.answers[q.id] ?? q.acceptedAnswers;
    return {
      questionId: q.id,
      wordIds: q.wordIds,
      correct: answersMatch(submitted, expected),
      submitted,
      expected,
    };
  });
  return buildScoreResult(questionResults);
}
