import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGenerateExercise } from "./tools/generateExercise.js";
import { registerGetLearningProgress } from "./tools/getLearningProgress.js";
import { registerGetSession } from "./tools/getSession.js";
import { registerGetVocabulary } from "./tools/getVocabulary.js";
import { registerListSessions } from "./tools/listSessions.js";
import { registerRequestNewWords } from "./tools/requestNewWords.js";
import { registerSubmitNewWordExercise } from "./tools/submitNewWordExercise.js";
import { registerSubmitExercise } from "./tools/submitExercise.js";

/**
 * Vocabulary comes from a curated catalogue in the backend — the LLM never
 * invents words. Its role is scoped to building exercise content around the
 * words the backend hands it. Enrolling in a language, changing level,
 * viewing exercises and submitting answers are frontend -> API concerns
 * exclusively (see packages/api), so there are deliberately no tools for them.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "language-tutor-mcp", version: "0.3.0" });

  registerListSessions(server);
  registerGetSession(server);
  registerGetVocabulary(server);
  registerGetLearningProgress(server);
  registerRequestNewWords(server);
  registerSubmitNewWordExercise(server);
  registerGenerateExercise(server);
  registerSubmitExercise(server);

  return server;
}
