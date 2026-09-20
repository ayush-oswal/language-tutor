import type { NewWordLearningAnswerKey, NewWordLearningPayload, QuestionResult, ScoreResult } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";

export interface NewWordLearningAnswers {
  stage2: { pairs: Record<string, string> }; // itemId -> optionId
  stage3: { answers: Record<string, string> }; // questionId -> optionId
}

/**
 * Scores both stages keyed by tempId (the candidates don't exist as real
 * Word rows yet). exerciseService remaps tempId -> real wordId onto these
 * results immediately after inserting the words.
 */
export function scoreNewWordLearning(
  payload: NewWordLearningPayload,
  answerKey: NewWordLearningAnswerKey,
  answers: NewWordLearningAnswers,
): ScoreResult {
  const stage2Results: QuestionResult[] = payload.stage2.items.map((item) => {
    const submitted = answers.stage2?.pairs?.[item.id];
    const expected = answerKey.stage2CorrectPairs[item.id];
    return {
      questionId: item.id,
      wordIds: [item.tempId],
      correct: submitted === expected,
      submitted,
      expected,
    };
  });

  const stage3Results: QuestionResult[] = payload.stage3.questions.map((q) => {
    const submitted = answers.stage3?.answers?.[q.id];
    const expected = answerKey.stage3Answers[q.id];
    return {
      questionId: q.id,
      wordIds: [q.tempId],
      correct: submitted === expected,
      submitted,
      expected,
    };
  });

  return buildScoreResult([...stage2Results, ...stage3Results]);
}
