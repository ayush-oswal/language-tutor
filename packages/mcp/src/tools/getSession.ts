import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetSession(server: McpServer): void {
  server.registerTool(
    "getSession",
    {
      description:
        "Get details for one language session: the language, the learner's current CEFR level, vocabulary " +
        "stats, progress per level, and `availableTags` — the topic tags (e.g. family, food, sports) that words " +
        "at the current level carry, which requestNewWords can filter by.",
      inputSchema: { sessionId: sessionIdSchema },
    },
    (args) => wrapTool(() => mcpApi.getSession(args.sessionId)),
  );
}
