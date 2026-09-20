import { z } from "zod";

export const newWordInputSchema = z.object({
  word: z.string().min(1).describe("The word or phrase in the target language."),
  translation: z.string().min(1).describe("Translation of the word (currently English)."),
  partOfSpeech: z.string().optional().describe("e.g. noun, verb, adjective."),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe("Optional extra linguistic info, e.g. { gender: 'masculine' }."),
});

export const initialVocabularySubmissionSchema = z.object({
  words: z
    .array(newWordInputSchema)
    .min(50)
    .describe(
      "The generated initial vocabulary list for this language/level. Must contain AT LEAST 50 words per " +
        "call — this is a real starting vocabulary (hundreds of words total), not a small sample. If you " +
        "haven't reached the target yet, call this tool again with another batch rather than stopping.",
    ),
});

export type InitialVocabularySubmission = z.infer<typeof initialVocabularySubmissionSchema>;
