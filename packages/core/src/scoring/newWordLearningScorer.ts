import type { NewWordLearningAnswerKey, NewWordLearningPayload, QuestionResult, ScoreResult } from "../types.js";
import { buildScoreResult } from "./multipleChoiceScorer.js";

export interface NewWordLearningAnswers {
  stage2: { pairs: Record<string, string> }; // itemId -> optionId
  stage3: { answers: Record<string, string> }; // questionId -> optionId
}

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
      wordIds: [item.wordId],
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
      wordIds: [q.wordId],
      correct: submitted === expected,
      submitted,
      expected,
    };
  });

  return buildScoreResult([...stage2Results, ...stage3Results]);
}
