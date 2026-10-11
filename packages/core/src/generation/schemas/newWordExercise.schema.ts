import { z } from "zod";
import { hintSchema, optionSchema } from "./shared.js";

const newWordIdSchema = z
  .string()
  .min(1)
  .describe("The wordId of one of the words returned by requestNewWords.");

export const newWordExerciseSubmissionSchema = z.object({
  stage2: z
    .object({
      items: z
        .array(z.object({ id: z.string().min(1), wordId: newWordIdSchema, text: z.string().min(1), hint: hintSchema }))
        .min(1)
        .describe("Matching-exercise left column — one entry per new word."),
      options: z
        .array(optionSchema)
        .min(1)
        .describe(
          "Matching-exercise right column (translations), in SHUFFLED order — never in the same order as " +
            "`items` (item 1's translation must not be option 1, item 2's option 2, and so on).",
        ),
    })
    .describe("The matching stage that follows the word+meaning presentation."),
  stage3: z
    .object({
      questions: z
        .array(
          z.object({
            id: z.string().min(1),
            wordId: newWordIdSchema,
            prompt: z
              .string()
              .min(1)
              .describe('Short English instruction, e.g. "Choose the word that completes the sentence."'),
            sentence: z
              .string()
              .min(1)
              .describe(
                "One of this word's example sentences (from requestNewWords), in the target language, with the " +
                  'word replaced by "___" (exactly once). Keep the rest of the sentence unchanged.',
              ),
            sentenceTranslation: z
              .string()
              .min(1)
              .describe("The English translation of that full example sentence (as given by requestNewWords)."),
            options: z
              .array(optionSchema)
              .min(2)
              .describe(
                "Target-language options. The correct one is the exact form that was removed from the sentence " +
                  "(it may be inflected, e.g. 'tengo' for 'tener'); distractors are other words from this lesson. " +
                  "Put the correct option at a RANDOM position in each question, varying it across questions — " +
                  "never always first, and never following the question order (A for question 1, B for 2, ...).",
              ),
            hint: hintSchema,
          }),
        )
        .min(1)
        .describe("A fill-in-the-gap question per new word, built from one of its example sentences."),
    })
    .describe("The final recall stage: the new words in context."),
  answerKey: z.object({
    stage2CorrectPairs: z.record(z.string()).describe("stage2 item id -> correct option id"),
    stage3Answers: z.record(z.string()).describe("stage3 question id -> correct option id"),
  }),
  generationContext: z.unknown().optional(),
});

export type NewWordExerciseSubmission = z.infer<typeof newWordExerciseSubmissionSchema>;
