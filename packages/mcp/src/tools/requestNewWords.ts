import { NEW_WORD_LEARNING_DEFAULT_COUNT } from "@lt/core/dist/config.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerRequestNewWords(server: McpServer): void {
  server.registerTool(
    "requestNewWords",
    {
      description:
        "Start a new-word-learning session. This tool does NOT return words — it returns the context you need " +
        "(the learner's level and their FULL existing vocabulary, so you never regenerate a word they already " +
        "know) and expects you to generate the words yourself, then call submitNewWordExercise with the full " +
        "exercise content.\n\n" +
        "IMPORTANT — before calling this tool, ask the user whether they want the new words to focus on a " +
        "specific topic (e.g. work, restaurants, travel, family, shopping). If they name one, pass it as `topic`. " +
        "If they decline or don't specify one, call this tool without `topic` and generate general " +
        "level-appropriate vocabulary instead. Never guess a topic on the user's behalf.\n\n" +
        "After calling this tool: generate exactly `count` NEW words (none overlapping the returned " +
        "existingVocabulary — compare by meaning, not just spelling) appropriate for the learner's level and " +
        "topic, build the 3-stage learning exercise (word+meaning presentations, a matching stage, a " +
        "recall/multiple-choice stage), and call submitNewWordExercise with it.",
      inputSchema: {
        languageId: z.string().min(1),
        count: z.number().int().min(1).max(30).optional().describe(`Defaults to ${NEW_WORD_LEARNING_DEFAULT_COUNT}.`),
        topic: z.string().optional().describe("A theme to focus vocabulary on, only if the user specified one."),
      },
    },
    (args) => wrapTool(() => mcpApi.requestNewWords(args.languageId, { count: args.count, topic: args.topic })),
  );
}
