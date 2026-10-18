import { z } from "zod";
import {
  acceptedAnswersSchema,
  fillBlankWordBankSchema,
  hintSchema,
  MC_PROMPT_RULE,
  naturalSentenceSchema,
  optionLanguageSchema,
  optionSchema,
  translationWordBankSchema,
  wordIdsSchema,
} from "./shared.js";

export const matchingRevisionSchema = z.object({
  type: z.literal("MATCHING"),
  payload: z.object({
    items: z
      .array(z.object({ id: z.string().min(1), wordId: z.string().min(1), text: z.string().min(1), hint: hintSchema }))
      .min(1)
      .describe("Left column: each item's `text` is a target-language word."),
    options: z.array(optionSchema).min(1).describe("Right column: the English translations, in shuffled order."),
  }),
  answerKey: z.object({ correctPairs: z.record(z.string()) }),
  generationContext: z.unknown().optional(),
});

export const multipleChoiceRevisionSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          prompt: z.string().min(1).describe(MC_PROMPT_RULE),
          options: z.array(optionSchema).min(2),
          optionLanguage: optionLanguageSchema,
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(z.string()) }),
  generationContext: z.unknown().optional(),
});

export const translationRevisionSchema = z.object({
  type: z.literal("TRANSLATION"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          prompt: naturalSentenceSchema("The sentence to translate, in the source language for `direction`."),
          direction: z.enum(["TO_TARGET", "TO_NATIVE"]),
          wordBank: translationWordBankSchema.optional(),
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(acceptedAnswersSchema) }),
  generationContext: z.unknown().optional(),
});

export const fillBlankRevisionSchema = z.object({
  type: z.literal("FILL_BLANK"),
  payload: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          wordIds: wordIdsSchema,
          sentence: naturalSentenceSchema("Target-language sentence; use '___' (three underscores) to mark the blank."),
          translation: z.string().optional(),
          acceptedAnswers: acceptedAnswersSchema,
          wordBank: fillBlankWordBankSchema,
          hint: hintSchema,
        }),
      )
      .min(1),
  }),
  answerKey: z.object({ answers: z.record(acceptedAnswersSchema) }),
  generationContext: z.unknown().optional(),
});

export type RevisionExerciseSubmission =
  | z.infer<typeof matchingRevisionSchema>
  | z.infer<typeof multipleChoiceRevisionSchema>
  | z.infer<typeof translationRevisionSchema>
  | z.infer<typeof fillBlankRevisionSchema>;
