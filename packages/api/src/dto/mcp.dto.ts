import {
  initialVocabularySubmissionSchema,
  newWordExerciseSubmissionSchema,
  revisionExerciseSubmissionSchema,
  storyExerciseSubmissionSchema,
} from "@lt/core";
import { z } from "zod";

export const createLanguageBodySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  languageCode: z.string().min(2).max(10),
  currentLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export const submitInitialVocabularyBodySchema = z.object({
  submission: initialVocabularySubmissionSchema,
});

export const submitNewWordExerciseBodySchema = z.object({
  submission: newWordExerciseSubmissionSchema,
});

export const submitRevisionExerciseBodySchema = z.object({
  submission: revisionExerciseSubmissionSchema,
});

export const submitStoryExerciseBodySchema = z.object({
  submission: storyExerciseSubmissionSchema,
});
