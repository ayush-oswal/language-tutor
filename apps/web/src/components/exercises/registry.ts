import type { ComponentType } from "react";
import type { ExerciseType } from "@lt/core";
import { FillBlankExercise } from "./FillBlankExercise";
import { MatchingExercise } from "./MatchingExercise";
import { MultipleChoiceExercise } from "./MultipleChoiceExercise";
import { NewWordLearningExercise } from "./NewWordLearningExercise";
import { StoryExercise } from "./StoryExercise";
import { TranslationExercise } from "./TranslationExercise";
import type { ExerciseComponentProps } from "./types";

export const exerciseRegistry: Record<ExerciseType, ComponentType<ExerciseComponentProps>> = {
  NEW_WORD_LEARNING: NewWordLearningExercise,
  MATCHING: MatchingExercise,
  MULTIPLE_CHOICE: MultipleChoiceExercise,
  TRANSLATION: TranslationExercise,
  FILL_BLANK: FillBlankExercise,
  STORY: StoryExercise,
};

export type { ExerciseComponentProps };
