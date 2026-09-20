import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAddWord } from "./tools/addWord.js";
import { registerCreateLanguage } from "./tools/createLanguage.js";
import { registerGenerateRevision } from "./tools/generateRevision.js";
import { registerGenerateStory } from "./tools/generateStory.js";
import { registerGetLanguage } from "./tools/getLanguage.js";
import { registerGetLearningProgress } from "./tools/getLearningProgress.js";
import { registerGetVocabulary } from "./tools/getVocabulary.js";
import { registerListLanguages } from "./tools/listLanguages.js";
import { registerRequestNewWords } from "./tools/requestNewWords.js";
import { registerSubmitInitialVocabulary } from "./tools/submitInitialVocabulary.js";
import { registerSubmitNewWordExercise } from "./tools/submitNewWordExercise.js";
import { registerSubmitRevisionExercise } from "./tools/submitRevisionExercise.js";
import { registerSubmitStoryExercise } from "./tools/submitStoryExercise.js";

/**
 * The LLM's role is scoped to generating vocabulary and exercise content
 * only. Viewing exercises and submitting answers are frontend -> API
 * concerns exclusively (see packages/api) — there is deliberately no
 * getExercise/completeExercise tool here.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "language-tutor-mcp", version: "0.1.0" });

  registerCreateLanguage(server);
  registerSubmitInitialVocabulary(server);
  registerListLanguages(server);
  registerGetLanguage(server);
  registerGetVocabulary(server);
  registerAddWord(server);
  registerGetLearningProgress(server);
  registerRequestNewWords(server);
  registerSubmitNewWordExercise(server);
  registerGenerateRevision(server);
  registerSubmitRevisionExercise(server);
  registerGenerateStory(server);
  registerSubmitStoryExercise(server);

  return server;
}
