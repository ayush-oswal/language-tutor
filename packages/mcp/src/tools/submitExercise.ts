import { exerciseSubmissionSchema } from "@lt/core/dist/generation/schemas/exercise.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitExercise(server: McpServer): void {
  server.registerTool(
    "submitExercise",
    {
      description:
        "Submit the practice exercise you built after calling generateExercise (MATCHING, MULTIPLE_CHOICE, " +
        "TRANSLATION, FILL_BLANK or STORY — set `type` to match). The backend validates that every word " +
        "referenced is one the learner already knows at or below their current level, then creates the " +
        "exercise. Scoring is fully deterministic once the learner completes it.",
      inputSchema: {
        sessionId: sessionIdSchema,
        submission: exerciseSubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitExercise(args.sessionId, args.submission)),
  );
}
