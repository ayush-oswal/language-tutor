import { getSession, listWords } from "@lt/core";
import { CEFRLevel, WordStatus } from "@lt/db";
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { queryEnum } from "../middleware/validate.js";

export const vocabularyRouter = Router();

vocabularyRouter.get(
  "/sessions/:sessionId/vocabulary",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId, { userId: req.user!.id });
    const search = typeof req.query.search === "string" && req.query.search ? req.query.search : undefined;
    const status = queryEnum(req.query.status, WordStatus);
    const level = queryEnum(req.query.level, CEFRLevel);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
    res.json(await listWords(session.id, session.currentLevel, { search, status, level, page, pageSize }));
  }),
);
