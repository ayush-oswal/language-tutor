import { z } from "zod";
import {
  fillBlankRevisionSchema,
  matchingRevisionSchema,
  multipleChoiceRevisionSchema,
  translationRevisionSchema,
} from "./revisionExercise.schema.js";
import { storyExerciseSubmissionSchema } from "./storyExercise.schema.js";

/** Every exercise built from the learner's known words; `type` picks the shape. */
export const exerciseSubmissionSchema = z.discriminatedUnion("type", [
  matchingRevisionSchema,
  multipleChoiceRevisionSchema,
  translationRevisionSchema,
  fillBlankRevisionSchema,
  storyExerciseSubmissionSchema,
]);

export type ExerciseSubmission = z.infer<typeof exerciseSubmissionSchema>;
