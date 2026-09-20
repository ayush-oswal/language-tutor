import { storyExerciseSubmissionSchema } from "@lt/core/dist/generation/schemas/storyExercise.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitStoryExercise(server: McpServer): void {
  server.registerTool(
    "submitStoryExercise",
    {
      description:
        "Submit the story you generated after calling generateStory. The backend validates that every word " +
        "referenced belongs to the learner's vocabulary, then creates the STORY exercise.",
      inputSchema: {
        languageId: z.string().min(1),
        submission: storyExerciseSubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitStoryExercise(args.languageId, args.submission)),
  );
}
