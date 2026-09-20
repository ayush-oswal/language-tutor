import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerListLanguages(server: McpServer): void {
  server.registerTool(
    "listLanguages",
    {
      description: "List all languages the learner is currently studying, with level and vocabulary size.",
      inputSchema: {
        userId: z
          .string()
          .min(1)
          .describe(
            "The learner's User ID, shown on their dashboard after signing in. Ask for it if you don't already " +
              "have it in this conversation, and reuse it any time you need to create or list this user's languages.",
          ),
      },
    },
    (args) => wrapTool(() => mcpApi.listLanguages(args.userId)),
  );
}
