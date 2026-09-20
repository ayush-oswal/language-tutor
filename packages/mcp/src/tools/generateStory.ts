import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpApi } from "../apiClient.js";
import { wrapTool } from "../toolHelpers.js";

export function registerGenerateStory(server: McpServer): void {
  server.registerTool(
    "generateStory",
    {
      description:
        "Start a story-mode revision session — use this when the user asks for a story, or picks it after being " +
        "asked. IMPORTANT — before calling this tool (or generateRevision), ALWAYS ask the user what kind of " +
        "exercise they want, offering ALL FIVE options every time: matching, multiple choice, translation, " +
        "fill-in-the-blank, or a story — story is a full exercise type, not a lesser/separate option, so never " +
        "omit it from the list you offer. If they pick one of the other four, use generateRevision instead of " +
        "this tool.\n\n" +
        "ALSO ASK — once they've picked story, ask what the story should be about (e.g. travel, a restaurant, " +
        "family, shopping, a mystery, sports) before calling this tool, the same way you'd ask about a topic " +
        "for new vocabulary. If they decline or have no preference, pass no `topic` and invent a fresh setting " +
        "yourself — see the variety note below.\n\n" +
        "REQUIRED FIRST STEP — call the getVocabulary tool for this languageId (no search/status filter) " +
        "before calling this tool, so you've seen the learner's weakest words and can weave more of them " +
        "naturally into the narrative (not just the tested words). This tool will fail with an error if you " +
        "haven't just done that.\n\n" +
        "Returns the learner's current vocabulary strengths/weaknesses and a set of known words, weakest " +
        "first, to build questions from. Write a short narrative in the target language — using vocabulary the " +
        "learner already knows (from your getVocabulary call) — interspersed with 3-6 embedded questions " +
        "testing the returned candidate words specifically. MIX the question mechanics rather than making " +
        "every one multiple-choice: some MULTIPLE_CHOICE, some FILL_BLANK, some TRANSLATION, and some MATCHING " +
        "(2-4 word/translation pairs at once).\n\n" +
        "VARIETY — vary the protagonist's name, gender, and setting every time; do not default to the same " +
        "stock character (e.g. always naming her 'Ana') just because it's a common example name for the " +
        "language. Pick names/settings that fit the requested topic (or a genuinely different one you invent " +
        "each time when no topic was given), so repeated stories don't feel like the same scene reskinned.\n\n" +
        "Each question must grow directly out of the narrative text right before it — write the preceding " +
        "narrative so it naturally sets up that question (mentions the word/event/detail being tested), then " +
        "phrase the question so it clearly refers back to the scene (e.g. what a character just did, said, or " +
        "had), rather than being a generic vocabulary-quiz question dropped in arbitrarily. Then call " +
        "submitStoryExercise.",
      inputSchema: {
        languageId: z.string().min(1),
        topic: z.string().optional().describe("A theme/setting to build the story around, only if the user specified one."),
      },
    },
    (args) => wrapTool(() => mcpApi.generateStory(args.languageId, args.topic)),
  );
}
