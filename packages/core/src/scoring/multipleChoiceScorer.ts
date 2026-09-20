import type {
  MultipleChoiceAnswerKey,
  MultipleChoicePayload,
  QuestionResult,
  ScoreResult,
} from "../types.js";

export interface MultipleChoiceAnswers {
  answers: Record<string, string>; // questionId -> selected optionId
}

export function scoreMultipleChoice(
  payload: MultipleChoicePayload,
  answerKey: MultipleChoiceAnswerKey,
  answers: MultipleChoiceAnswers,
): ScoreResult {
  const questionResults: QuestionResult[] = payload.questions.map((q) => {
    const submitted = answers.answers?.[q.id];
    const expected = answerKey.answers[q.id];
    return {
      questionId: q.id,
      wordIds: q.wordIds,
      correct: submitted === expected,
      submitted,
      expected,
    };
  });
  return buildScoreResult(questionResults);
}

export function buildScoreResult(questionResults: QuestionResult[]): ScoreResult {
  const score = questionResults.filter((r) => r.correct).length;
  const percentage = questionResults.length === 0 ? 0 : (score / questionResults.length) * 100;
  return { score, percentage, questionResults };
}
