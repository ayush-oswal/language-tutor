import cors from "cors";
import express, { Router, type Express } from "express";
import { clerkAuth, resolveUser } from "./middleware/clerkAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { exercisesRouter } from "./routes/exercises.js";
import { languagesRouter } from "./routes/languages.js";
import { mcpRouter } from "./routes/mcp.js";
import { usersRouter } from "./routes/users.js";
import { vocabularyRouter } from "./routes/vocabulary.js";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/ping", (_req, res) => {
    res.json({ status: "ok" });
  });

  // MCP-facing routes — no Clerk session; languageId (and userId only for
  // listLanguages/createLanguage) is the trust boundary. See mcp.ts. Mounted
  // before the "/api" catch-all below so these requests never hit Clerk auth.
  app.use("/api/mcp", mcpRouter);

  // Web-facing routes — Clerk session required, all data scoped to req.user.
  const webRouter = Router();
  webRouter.use(clerkAuth, resolveUser);
  webRouter.use(languagesRouter);
  webRouter.use(vocabularyRouter);
  webRouter.use(exercisesRouter);
  webRouter.use(usersRouter);
  app.use("/api", webRouter);

  app.use(errorHandler);

  return app;
}
