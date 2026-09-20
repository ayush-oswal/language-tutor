import type { QuestionResult, ScoreResult, TranslationAnswerKey, TranslationPayload } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";
import { answersMatch } from "./normalization.js";

export interface TranslationAnswers {
  answers: Record<string, string>; // questionId -> submitted text
}

export function scoreTranslation(
  payload: TranslationPayload,
  answerKey: TranslationAnswerKey,
  answers: TranslationAnswers,
): ScoreResult {
  const questionResults: QuestionResult[] = payload.questions.map((q) => {
    const submitted = answers.answers?.[q.id] ?? "";
    const expected = answerKey.answers[q.id] ?? [];
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
