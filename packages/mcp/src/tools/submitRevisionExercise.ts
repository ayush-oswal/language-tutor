import { revisionExerciseSubmissionSchema } from "@lt/core/dist/generation/schemas/revisionExercise.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitRevisionExercise(server: McpServer): void {
  server.registerTool(
    "submitRevisionExercise",
    {
      description:
        "Submit the revision exercise you generated after calling generateRevision. The backend validates that " +
        "every word referenced actually belongs to the learner's vocabulary for this language, then creates " +
        "the exercise. Scoring will be fully deterministic once the learner completes it.",
      inputSchema: {
        languageId: z.string().min(1),
        submission: revisionExerciseSubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitRevisionExercise(args.languageId, args.submission)),
  );
}
