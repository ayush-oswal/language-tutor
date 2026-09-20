import { newWordExerciseSubmissionSchema } from "@lt/core/dist/generation/schemas/newWordExercise.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitNewWordExercise(server: McpServer): void {
  server.registerTool(
    "submitNewWordExercise",
    {
      description:
        "Submit the new-word-learning exercise you generated after calling requestNewWords. The backend " +
        "validates the words (no duplicates, all references consistent) and creates the exercise — the words " +
        "themselves are NOT added to the learner's vocabulary yet, that only happens once they complete it.",
      inputSchema: {
        languageId: z.string().min(1),
        submission: newWordExerciseSubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitNewWordExercise(args.languageId, args.submission)),
  );
}
