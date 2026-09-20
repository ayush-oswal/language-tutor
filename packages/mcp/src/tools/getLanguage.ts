import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGetLanguage(server: McpServer): void {
  server.registerTool(
    "getLanguage",
    {
      description: "Get details (name, level, vocabulary stats) for a single language by id.",
      inputSchema: { languageId: z.string().min(1) },
    },
    (args) => wrapTool(() => mcpApi.getLanguage(args.languageId)),
  );
}
