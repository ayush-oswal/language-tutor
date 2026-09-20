import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

const revisionTypeSchema = z.enum(["MATCHING", "MULTIPLE_CHOICE", "TRANSLATION", "FILL_BLANK", "ANY"]);

export function registerGenerateRevision(server: McpServer): void {
  server.registerTool(
    "generateRevision",
    {
      description:
        "Start a revision session using words the learner already knows (never brand-new vocabulary). " +
        "IMPORTANT — before calling this tool (or generateStory), ALWAYS ask the user what kind of exercise " +
        "they want, offering ALL FIVE options every time: matching, multiple choice, translation, " +
        "fill-in-the-blank, or a story — story is a full exercise type, not a lesser/separate option, so never " +
        "omit it from the list you offer. If they want a story, use generateStory instead of this tool. " +
        "Otherwise pass their choice as `preferredType` (use 'ANY' only if they explicitly say they have no " +
        "preference — don't default to this without asking).\n\n" +
        "REQUIRED FIRST STEP — call the getVocabulary tool for this languageId (no search/status filter) " +
        "before calling this tool, so you've seen the learner's weakest words. This tool will fail with an " +
        "error if you haven't just done that.\n\n" +
        "The result returns the learner's weakest/most-overdue words, ranked so the weakest come first — " +
        "these are the ONLY words you should use. Write the full payload + answer key of the requested type " +
        "referencing exactly these word ids, and call submitRevisionExercise.",
      inputSchema: {
        languageId: z.string().min(1),
        preferredType: revisionTypeSchema.describe(
          "The exercise type the user asked for (or 'ANY' only if they said they have no preference).",
        ),
      },
    },
    (args) => wrapTool(() => mcpApi.generateRevision(args.languageId, args.preferredType)),
  );
}
