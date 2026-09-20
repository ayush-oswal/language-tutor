import { z } from "zod";
import { acceptedAnswersSchema, hintSchema, optionSchema, wordIdsSchema } from "./shared.js";

const matchingRevisionSchema = z.object({
  type: z.literal("MATCHING"),
  payload: z.object({
    items: z
      .array(z.object({ id: z.string().min(1), wordId: z.string().min(1), text: z.string().min(1), hint: hintSchema }))
      .min(1),
    options: z.array(optionSchema).min(1),
  }),
  answerKey: z.object({ correctPairs: z.record(z.string()) }),
  generationContext: z.unknown().optional(),
});

const multipleChoiceRevisionSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          prompt: z.string().min(1),
          options: z.array(optionSchema).min(2),
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(z.string()) }),
  generationContext: z.unknown().optional(),
});

const translationRevisionSchema = z.object({
  type: z.literal("TRANSLATION"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          prompt: z.string().min(1),
          direction: z.enum(["TO_TARGET", "TO_NATIVE"]),
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(acceptedAnswersSchema) }),
  generationContext: z.unknown().optional(),
});

const fillBlankRevisionSchema = z.object({
  type: z.literal("FILL_BLANK"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          sentence: z.string().min(1).describe("Use '___' (three underscores) to mark the blank to fill in."),
          translation: z.string().optional(),
          acceptedAnswers: acceptedAnswersSchema,
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(acceptedAnswersSchema) }),
  generationContext: z.unknown().optional(),
});

export const revisionExerciseSubmissionSchema = z.discriminatedUnion("type", [
  matchingRevisionSchema,
  multipleChoiceRevisionSchema,
  translationRevisionSchema,
  fillBlankRevisionSchema,
]);

export type RevisionExerciseSubmission = z.infer<typeof revisionExerciseSubmissionSchema>;
