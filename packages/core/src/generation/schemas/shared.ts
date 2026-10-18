import { z } from "zod";

export const optionSchema = z.object({
  id: z.string().min(1).describe("Stable id for this option, unique within its question/item."),
  text: z.string().min(1),
});

export const wordIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .describe(
    "Real Word ids from the learner's vocabulary that this question tests — usually just one, two only when " +
      "they naturally belong together. Never cram several listed words into one sentence.",
  );

export const naturalSentenceSchema = (what: string) =>
  z
    .string()
    .min(1)
    .describe(
      `${what} Must be a grammatically correct, complete sentence a native speaker would really say in an ` +
        "everyday situation, at the learner's level — never abstract, odd or built just to contain a word.",
    );

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

export const optionLanguageSchema = z
  .enum(["TARGET", "NATIVE"])
  .describe(
    "The language every option is written in: TARGET (the language being learned) or NATIVE (English). The " +
      "app reads the option the learner selects aloud in this language.",
  );

const WORD_BANK_RULES =
  "Tiles are tapped one at a time, in order, to build the answer (the app shuffles them). Include one tile per " +
  "word of the first accepted answer, repeating a tile when a word appears twice, without punctuation; then add " +
  "3-5 distractor tiles in the same language that are plausible but do not belong in the answer. Avoid " +
  "distractors that allow another correct answer; if one does (e.g. an optional subject pronoun), list that " +
  "variant in the accepted answers too.";

export const translationWordBankSchema = z
  .array(z.string().min(1))
  .min(3)
  .describe(
    "REQUIRED when direction is TO_TARGET, omitted for TO_NATIVE (the learner types English answers). " +
      "Target-language word tiles for building the translation. " +
      WORD_BANK_RULES,
  );

export const fillBlankWordBankSchema = z
  .array(z.string().min(1))
  .min(3)
  .describe("Target-language word tiles for filling the blank. " + WORD_BANK_RULES);

export const MC_PROMPT_RULE =
  "The question. Build it around a natural everyday sentence that uses or needs the tested word (e.g. a line " +
  "someone would really say, with the word blanked or asked about), not a bare 'What does X mean?'. Any " +
  "sentence in it must be grammatically correct and something a native speaker would really say.";
