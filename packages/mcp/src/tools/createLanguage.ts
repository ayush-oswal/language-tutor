import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { cefrLevelSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerCreateLanguage(server: McpServer): void {
  server.registerTool(
    "createLanguage",
    {
      description:
        "Create a new language for the learner to study, at a starting CEFR level. This ONLY creates the " +
        "language record — it does NOT add any vocabulary yet. The result tells you the REQUIRED initial " +
        "vocabulary size for this level (hundreds of words, not a small sample — do not treat a short list as " +
        "sufficient). Generate common, everyday words (word + translation, optionally partOfSpeech/metadata) " +
        "covering a broad spread of topics (greetings, numbers, family, food, time, common verbs/adjectives, " +
        "home, work, travel, etc.) and call submitInitialVocabulary. Prefer generating the FULL target in one " +
        "call; only split into multiple submitInitialVocabulary calls (each still at least 50 words) if you're " +
        "at genuine risk of truncating your own response. Each call tells you how many words remain — keep " +
        "calling until that reaches zero. Do not stop early or tell the user vocabulary is ready until it does.",
      inputSchema: {
        userId: z
          .string()
          .min(1)
          .describe(
            "The learner's User ID, shown on their dashboard after signing in. Ask for it if you don't already " +
              "have it in this conversation, and reuse it any time you need to create or list this user's languages.",
          ),
        name: z.string().min(1).describe("The language's common name, e.g. 'Spanish'."),
        languageCode: z.string().min(2).max(10).describe("A short language code, e.g. 'es'."),
        currentLevel: cefrLevelSchema.describe("The learner's starting CEFR level."),
      },
    },
    (args) =>
      wrapTool(() =>
        mcpApi.createLanguage(args.userId, {
          name: args.name,
          languageCode: args.languageCode,
          currentLevel: args.currentLevel,
        }),
      ),
  );
}
