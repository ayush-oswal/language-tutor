import { exerciseSubmissionSchema, newWordExerciseSubmissionSchema } from "@lt/core";
import { z } from "zod";

export const submitNewWordExerciseBodySchema = z.object({
  submission: newWordExerciseSubmissionSchema,
});

export const submitExerciseBodySchema = z.object({
  submission: exerciseSubmissionSchema,
});
