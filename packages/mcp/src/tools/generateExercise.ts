import { EXERCISE_CANDIDATE_LIMIT } from "@lt/core/dist/config.js";
import { NATURAL_SENTENCE_RULES } from "@lt/core/dist/generation/prompts.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

const exerciseTypeSchema = z.enum(["MATCHING", "MULTIPLE_CHOICE", "TRANSLATION", "FILL_BLANK", "STORY"]);

export function registerGenerateExercise(server: McpServer): void {
  server.registerTool(
    "generateExercise",
    {
      description:
        "Start a practice exercise using words the learner already knows (never brand-new vocabulary — use " +
        "requestNewWords for that).\n\n" +
        "IMPORTANT — before calling this tool, ALWAYS ask the user what kind of exercise they want, offering " +
        "ALL FIVE options every time: matching, multiple choice, translation, fill-in-the-blank, or a story. " +
        "Pass their choice as `type`. If they pick a story, also ask what it should be about (e.g. travel, a " +
        "restaurant, family, a mystery) and pass it as `topic`; if they have no preference, omit `topic` and " +
        "invent a fresh setting yourself.\n\n" +
        `Returns up to ${EXERCISE_CANDIDATE_LIMIT} of the learner's known words (at or below their current ` +
        "level), with translations, ordered by how much each word needs practice — overdue, weak, and " +
        "often-missed words come first. Build the exercise from these words only, focusing on the top of the " +
        "list, then call submitExercise with the same `type`. If `words` is empty, the learner hasn't been " +
        "taught any words yet — follow the returned `instructions` (call requestNewWords) instead.\n\n" +
        NATURAL_SENTENCE_RULES +
        "\n\n" +
        "How the learner answers (also inside stories): multiple-choice options are read aloud when selected, " +
        "so set each question's `optionLanguage`. Translations into the target language (TO_TARGET) and " +
        "fill-in-the-blank questions are answered by tapping word tiles, so give each one a `wordBank`: one " +
        "tile per word of the answer plus 3-5 plausible distractors. Translations into English (TO_NATIVE) are " +
        "typed and take no wordBank.\n\n" +
        "For a STORY: write a short, coherent narrative in the target language at the learner's level — a " +
        "realistic everyday scene with natural dialogue, where events follow logically. Use listed words only " +
        "where they fit naturally; a story that reads like real life matters more than covering many words. " +
        "Include 3-6 embedded questions. MIX the question mechanics " +
        "(some MULTIPLE_CHOICE, FILL_BLANK, TRANSLATION, and MATCHING with 2-4 pairs) rather than making every " +
        "question the same type. Each question must grow directly out of the narrative right before it — write " +
        "that narrative so it sets up the word/event/detail being tested, and phrase the question so it " +
        "clearly refers back to the scene, rather than dropping in a generic vocabulary quiz question. Vary " +
        "the protagonist's name, gender, and setting every time; don't default to the same stock character.",
      inputSchema: {
        sessionId: sessionIdSchema,
        type: exerciseTypeSchema.describe("The exercise type the user asked for."),
        topic: z.string().optional().describe("STORY only: a theme/setting, only if the user specified one."),
      },
    },
    (args) => wrapTool(() => mcpApi.generateExercise(args.sessionId, args.type, args.topic)),
  );
}
