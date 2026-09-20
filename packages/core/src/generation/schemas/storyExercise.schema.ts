import { z } from "zod";
import { acceptedAnswersSchema, hintSchema, optionSchema, wordIdsSchema } from "./shared.js";

const narrativeNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("narrative"),
  text: z.string().min(1),
  translation: z
    .string()
    .min(1)
    .describe(
      "English translation of `text`. The learner sees only `text` by default — this is revealed behind a " +
        "'Show Translation' toggle, for when they get stuck.",
    ),
  wordIds: z.array(z.string().min(1)).optional(),
});

const storyMatchingItemSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  text: z.string().min(1),
  hint: hintSchema,
});

const mcQuestionNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("question"),
  questionType: z.literal("MULTIPLE_CHOICE"),
  wordIds: wordIdsSchema,
  prompt: z.string().min(1),
  translation: z
    .string()
    .min(1)
    .describe(
      "English translation of `prompt`, shown only behind a 'Show Translation' toggle — never displayed by default.",
    ),
  options: z.array(optionSchema).min(2),
  hint: hintSchema,
});

const translationQuestionNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("question"),
  questionType: z.literal("TRANSLATION"),
  wordIds: wordIdsSchema,
  prompt: z.string().min(1),
  direction: z.enum(["TO_TARGET", "TO_NATIVE"]),
  hint: hintSchema,
});

const fillBlankQuestionNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("question"),
  questionType: z.literal("FILL_BLANK"),
  wordIds: wordIdsSchema,
  sentence: z.string().min(1).describe("Use '___' (three underscores) to mark the blank to fill in."),
  translation: z
    .string()
    .min(1)
    .describe(
      "English translation of the full sentence (with the blank filled in correctly), shown only behind a " +
        "'Show Translation' toggle — never displayed by default.",
    ),
  acceptedAnswers: acceptedAnswersSchema,
  hint: hintSchema,
});

const matchingQuestionNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("question"),
  questionType: z.literal("MATCHING"),
  items: z.array(storyMatchingItemSchema).min(2).max(4).describe("2-4 word/translation pairs to match at this point in the story."),
  options: z.array(optionSchema).min(2),
});

const questionNodeSchema = z.discriminatedUnion("questionType", [
  mcQuestionNodeSchema,
  translationQuestionNodeSchema,
  fillBlankQuestionNodeSchema,
  matchingQuestionNodeSchema,
]);

const storyAnswerKeyEntrySchema = z.discriminatedUnion("questionType", [
  z.object({ questionType: z.literal("MULTIPLE_CHOICE"), correctOptionId: z.string().min(1) }),
  z.object({ questionType: z.literal("TRANSLATION"), acceptedAnswers: acceptedAnswersSchema }),
  z.object({ questionType: z.literal("FILL_BLANK"), acceptedAnswers: acceptedAnswersSchema }),
  z.object({ questionType: z.literal("MATCHING"), correctPairs: z.record(z.string()) }),
]);

export const storyExerciseSubmissionSchema = z.object({
  payload: z.object({
    nodes: z
      .array(z.union([narrativeNodeSchema, questionNodeSchema]))
      .min(1)
      .describe(
        "Ordered narrative + question nodes, using only the given vocabulary. MIX question types across the " +
          "story — some MULTIPLE_CHOICE, some FILL_BLANK, some TRANSLATION, some MATCHING (2-4 pairs each). " +
          "Do not make every question node the same type.\n\n" +
          "Each question node MUST be about the narrative node(s) immediately before it — test a word, detail, " +
          "or event that was just used or described in that narrative text, phrased so it clearly connects to " +
          "what was just read (e.g. referencing what a character did/said/had). Do NOT insert a generic, " +
          "context-free vocabulary quiz question that could belong to any story — every question should read " +
          "as a natural continuation of the scene the learner just read.",
      ),
  }),
  answerKey: z.object({
    answers: z.record(storyAnswerKeyEntrySchema).describe("question node id -> type-specific answer key entry"),
  }),
  generationContext: z.unknown().optional(),
});

export type StoryExerciseSubmission = z.infer<typeof storyExerciseSubmissionSchema>;
