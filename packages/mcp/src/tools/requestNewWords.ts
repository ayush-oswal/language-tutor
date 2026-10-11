import { NEW_WORD_LEARNING_DEFAULT_COUNT } from "@lt/core/dist/config.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerRequestNewWords(server: McpServer): void {
  server.registerTool(
    "requestNewWords",
    {
      description:
        "Start a new-word-learning session. Returns the next words from the curated catalogue that the " +
        "learner hasn't been introduced to yet, at their current CEFR level — each with its wordId, " +
        "translation, part of speech, gender (if any), example sentences, and tags. NEVER invent or add " +
        "words of your own: teach exactly the words returned.\n\n" +
        "IMPORTANT — before calling this tool, ask the user whether they want the new words to focus on a " +
        "specific topic. The topics available are the `availableTags` from getSession (e.g. family, food, " +
        "sports). If they pick one, pass it as `tag`. If they decline or don't specify one, call this tool " +
        "without `tag`. Never guess a topic on the user's behalf.\n\n" +
        "After calling this tool: build the 3-stage learning exercise for the returned words and call " +
        "submitNewWordExercise with it, referencing words by wordId:\n" +
        "- Stage 1 (automatic): the backend shows each word with its meaning and example sentences.\n" +
        "- Stage 2: a matching stage, one item per word (word -> English translation).\n" +
        "- Stage 3: one fill-in-the-gap question per word, built from one of that word's example sentences: " +
        'copy the sentence with the word replaced by "___" (exactly once), include the sentence\'s English ' +
        "translation, and offer the removed form (inflected as it appeared) plus distractors drawn from the " +
        "other words in the lesson.\n" +
        "- Shuffle answer options: in stage 2, list the translations in a random order (not the order of the " +
        "words); in stage 3, put the correct option at a random position in each question. The answer must " +
        "never be predictable from its position (e.g. A for the first question, B for the second).\n" +
        "If no words are returned, follow the returned `instructions`.",
      inputSchema: {
        sessionId: sessionIdSchema,
        count: z.number().int().min(1).max(30).optional().describe(`Defaults to ${NEW_WORD_LEARNING_DEFAULT_COUNT}.`),
        tag: z.string().optional().describe("A topic tag to focus on (one of getSession's availableTags), only if the user chose one."),
      },
    },
    (args) => wrapTool(() => mcpApi.requestNewWords(args.sessionId, { count: args.count, tag: args.tag })),
  );
}
