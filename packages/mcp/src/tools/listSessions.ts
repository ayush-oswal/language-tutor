import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerListSessions(server: McpServer): void {
  server.registerTool(
    "listSessions",
    {
      description:
        "List the languages the learner is enrolled in (one session per language), each with its session id, " +
        "current CEFR level, and vocabulary progress. Every other tool takes a sessionId from here.\n\n" +
        "Learners enroll in a language and pick or change their level ONLY in the Language Tutor web app — " +
        "there is no tool for that. If this returns no sessions, or not the language the learner wants, tell " +
        "them to enroll in it on the web app first.",
      inputSchema: {
        userId: z
          .string()
          .min(1)
          .describe(
            "The learner's User ID, shown on their dashboard after signing in. Ask for it if you don't already " +
              "have it in this conversation, and reuse it any time you need to list this user's sessions.",
          ),
      },
    },
    (args) => wrapTool(() => mcpApi.listSessions(args.userId)),
  );
}
