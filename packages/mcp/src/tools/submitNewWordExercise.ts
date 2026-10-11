import { newWordExerciseSubmissionSchema } from "@lt/core/dist/generation/schemas/newWordExercise.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApi } from "../apiClient.js";
import { sessionIdSchema } from "../shared.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitNewWordExercise(server: McpServer): void {
  server.registerTool(
    "submitNewWordExercise",
    {
      description:
        "Submit the new-word-learning exercise you built after calling requestNewWords. Every wordId must be " +
        "one of the words requestNewWords returned (words the learner hasn't been introduced to yet, at their " +
        "current level). The backend validates the references, attaches the words' details, and creates the " +
        "exercise; the learner's progress on these words is recorded once they complete it.",
      inputSchema: {
        sessionId: sessionIdSchema,
        submission: newWordExerciseSubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitNewWordExercise(args.sessionId, args.submission)),
  );
}
