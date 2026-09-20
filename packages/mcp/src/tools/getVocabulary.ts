import { GET_VOCABULARY_CONTEXT_LIMIT } from "@lt/core/dist/config.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wordStatusSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetVocabulary(server: McpServer): void {
  server.registerTool(
    "getVocabulary",
    {
      description:
        "List the learner's vocabulary for a language, optionally filtered by search text or status. Call " +
        `this with no filters before generateRevision or generateStory — both REQUIRE having just called this ` +
        "tool for the same languageId (with no search/status filter) or they will fail with an error telling " +
        "you to call this first.\n\n" +
        `When called with no filters, this returns the learner's ${GET_VOCABULARY_CONTEXT_LIMIT} LEAST-MASTERED ` +
        "words only (weakest first), not their entire vocabulary — this is deliberate, so you build exercises " +
        "around their actual weak spots instead of a huge, unfocused word list. The response's `total` field " +
        "tells you the learner's real vocabulary size if you need it. Use `search` or `status` filters if you " +
        "need to check something specific outside this weakest-50 slice (e.g. whether a particular word is " +
        "already known).\n\n" +
        "Each entry is `{id, word, mastery, status, timesSeen}` — a lean check-in on which words are weak and " +
        "how familiar they are, not a source of translations. Use your own knowledge of the language for " +
        "meanings, or rely on generateRevision's/generateStory's returned candidates (which do include " +
        "translations) when actually building exercises.",
      inputSchema: {
        languageId: z.string().min(1),
        search: z.string().optional(),
        status: wordStatusSchema.optional(),
      },
    },
    (args) => wrapTool(() => mcpApi.getVocabulary(args.languageId, { search: args.search, status: args.status })),
  );
}
