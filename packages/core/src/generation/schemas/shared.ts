import { z } from "zod";

export const optionSchema = z.object({
  id: z.string().min(1).describe("Stable id for this option, unique within its question/item."),
  text: z.string().min(1),
});

export const wordIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .describe("Real Word ids from the learner's vocabulary that this question tests.");

export const hintSchema = z
  .string()
  .min(1)
  .describe(
    "A short, helpful hint for this specific question (e.g. a cognate, a grammatical note, a memory aid, " +
      "or a partial clue) — never just a restatement of the answer. Every question must have one.",
  );

export const acceptedAnswersSchema = z
  .array(z.string().min(1))
  .min(1)
  .describe(
    "All correct spellings the learner might type. Matching is already case- and accent-insensitive, but " +
      "where the target language commonly uses accents/diacritics (e.g. Spanish 'cuándo'), still list the " +
      "unaccented spelling too (e.g. 'cuando') as an explicit alternative, since learners often can't type " +
      "accents easily.",
  );
