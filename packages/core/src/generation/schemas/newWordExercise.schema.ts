import { z } from "zod";
import { hintSchema, optionSchema } from "./shared.js";

export const newWordCandidateSchema = z.object({
  tempId: z
    .string()
    .min(1)
    .describe("A stable id you assign to this candidate word (e.g. 'w1'). Referenced by stage2/stage3."),
  word: z.string().min(1),
  translation: z.string().min(1),
  partOfSpeech: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const newWordExerciseSubmissionSchema = z.object({
  candidates: z
    .array(newWordCandidateSchema)
    .min(1)
    .describe("The newly generated words, none overlapping the existingVocabulary you were given."),
  stage2: z
    .object({
      items: z
        .array(z.object({ id: z.string().min(1), tempId: z.string().min(1), text: z.string().min(1), hint: hintSchema }))
        .min(1)
        .describe("Matching-exercise left column — one entry per candidate word."),
      options: z.array(optionSchema).min(1).describe("Matching-exercise right column (translations)."),
    })
    .describe("The matching stage that follows the word+meaning presentation."),
  stage3: z
    .object({
      questions: z
        .array(
          z.object({
            id: z.string().min(1),
            tempId: z.string().min(1),
            prompt: z.string().min(1),
            options: z.array(optionSchema).min(2),
            hint: hintSchema,
          }),
        )
        .min(1)
        .describe("A recall/multiple-choice question per candidate word."),
    })
    .describe("The final recall stage."),
  answerKey: z.object({
    stage2CorrectPairs: z.record(z.string()).describe("stage2 item id -> correct option id"),
    stage3Answers: z.record(z.string()).describe("stage3 question id -> correct option id"),
  }),
  generationContext: z.unknown().optional(),
});

export type NewWordExerciseSubmission = z.infer<typeof newWordExerciseSubmissionSchema>;
