import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerAddWord(server: McpServer): void {
  server.registerTool(
    "addWord",
    {
      description:
        "Manually add a single known word directly to the learner's vocabulary (no exercise involved). " +
        "Use this when the user explicitly asks to add a specific word, not for bulk vocabulary generation.",
      inputSchema: {
        languageId: z.string().min(1),
        word: z.string().min(1),
        translation: z.string().min(1),
        partOfSpeech: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      },
    },
    (args) =>
      wrapTool(() =>
        mcpApi.addWord(args.languageId, {
          word: args.word,
          translation: args.translation,
          partOfSpeech: args.partOfSpeech,
          metadata: args.metadata,
        }),
      ),
  );
}
