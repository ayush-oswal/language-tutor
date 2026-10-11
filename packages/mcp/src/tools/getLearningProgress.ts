import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetLearningProgress(server: McpServer): void {
  server.registerTool(
    "getLearningProgress",
    {
      description:
        "Get the learner's current progress summary for a language session: vocabulary stats, weakest words, " +
        "overdue-for-review words, and recently practiced words. Pure read — does not change anything.",
      inputSchema: { sessionId: sessionIdSchema },
    },
    (args) => wrapTool(() => mcpApi.getLearningProgress(args.sessionId)),
  );
}
