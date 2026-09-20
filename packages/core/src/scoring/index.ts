import { ValidationError } from "../errors.js";
import type { ExerciseType, ScoreResult } from "../types.js";
import { scoreFillBlank } from "./fillBlankScorer.js";
import { scoreMatching } from "./matchingScorer.js";
import { scoreMultipleChoice } from "./multipleChoiceScorer.js";
import { scoreNewWordLearning } from "./newWordLearningScorer.js";
import { scoreStory } from "./storyScorer.js";
import { scoreTranslation } from "./translationScorer.js";

export function scoreExercise(
  type: ExerciseType,
  payload: unknown,
  answerKey: unknown,
  answers: unknown,
): ScoreResult {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return scoreMultipleChoice(payload as never, answerKey as never, answers as never);
    case "MATCHING":
      return scoreMatching(payload as never, answerKey as never, answers as never);
    case "TRANSLATION":
      return scoreTranslation(payload as never, answerKey as never, answers as never);
    case "FILL_BLANK":
      return scoreFillBlank(payload as never, answerKey as never, answers as never);
    case "STORY":
      return scoreStory(payload as never, answerKey as never, answers as never);
    case "NEW_WORD_LEARNING":
      return scoreNewWordLearning(payload as never, answerKey as never, answers as never);
    default:
      throw new ValidationError(`Unsupported exercise type for scoring: ${type}`);
  }
}

export * from "./fillBlankScorer.js";
export * from "./matchingScorer.js";
export * from "./multipleChoiceScorer.js";
export * from "./newWordLearningScorer.js";
export * from "./normalization.js";
export * from "./storyScorer.js";
export * from "./translationScorer.js";
