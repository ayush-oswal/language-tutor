import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetLearningProgress(server: McpServer): void {
  server.registerTool(
    "getLearningProgress",
    {
      description:
        "Get the learner's current progress summary for a language: vocabulary stats, weakest words, " +
        "overdue-for-review words, and recently practiced words. Pure read — does not change anything.",
      inputSchema: { languageId: z.string().min(1) },
    },
    (args) => wrapTool(() => mcpApi.getLearningProgress(args.languageId)),
  );
}
