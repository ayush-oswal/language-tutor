import { GET_VOCABULARY_CONTEXT_LIMIT } from "@lt/core/dist/config.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema, wordStatusSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetVocabulary(server: McpServer): void {
  server.registerTool(
    "getVocabulary",
    {
      description:
        "List the learner's vocabulary for a language session (words at or below their current level), " +
        "optionally filtered by search text or status. Use it to answer questions about what the learner " +
        "knows (e.g. whether a particular word is known, or how many words are still new) — you do NOT need " +
        "it to build exercises: generateExercise already returns the words to use.\n\n" +
        `With no filters, this returns the learner's ${GET_VOCABULARY_CONTEXT_LIMIT} LEAST-MASTERED known ` +
        "words (weakest first); words they haven't been introduced to yet (status NEW) are left out. The " +
        "response's `total` field tells you how many known words they have. Use `search` or `status` to check " +
        "something specific outside this slice.\n\n" +
        "Each entry is `{id, word, level, mastery, status, timesSeen}`.\n\n" +
        "If the response includes a `message`, the learner hasn't been taught any words yet: follow it (call " +
        "requestNewWords to give them a new-word lesson) instead of starting a practice exercise.",
      inputSchema: {
        sessionId: sessionIdSchema,
        search: z.string().optional(),
        status: wordStatusSchema.optional(),
      },
    },
    (args) => wrapTool(() => mcpApi.getVocabulary(args.sessionId, { search: args.search, status: args.status })),
  );
}
