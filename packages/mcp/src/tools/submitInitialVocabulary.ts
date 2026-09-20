import { initialVocabularySubmissionSchema } from "@lt/core/dist/generation/schemas/initialVocabulary.schema.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerSubmitInitialVocabulary(server: McpServer): void {
  server.registerTool(
    "submitInitialVocabulary",
    {
      description:
        "Submit a batch of initial vocabulary for a newly created language (word + translation, optionally " +
        "partOfSpeech/metadata; at least 50 words per call). The backend validates and stores each word " +
        "(skipping any that already exist) and initializes learner-progress tracking. The response tells you " +
        "exactly how many words are still needed — if it's not zero, you are NOT done: generate another batch " +
        "of new words (avoiding ones already in the vocabulary) and call this tool again immediately. Do not " +
        "tell the user the vocabulary is ready until `remaining` is 0.",
      inputSchema: {
        languageId: z.string().min(1),
        submission: initialVocabularySubmissionSchema,
      },
    },
    (args) => wrapTool(() => mcpApi.submitInitialVocabulary(args.languageId, args.submission)),
  );
}
