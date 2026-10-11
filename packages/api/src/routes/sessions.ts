import { changeLevel, enroll, getSessionOverview, listSessions } from "@lt/core";
import { Router } from "express";
import type { z } from "zod";
import { changeLevelBodySchema, enrollBodySchema } from "../dto/sessions.dto.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const sessionsRouter = Router();

sessionsRouter.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    res.json(await listSessions(req.user!.id));
  }),
);

sessionsRouter.post(
  "/sessions",
  validateBody(enrollBodySchema),
  asyncHandler(async (req, res) => {
    const { languageId, level } = req.body as z.infer<typeof enrollBodySchema>;
    res.status(201).json(await enroll(req.user!.id, languageId, level));
  }),
);

sessionsRouter.get(
  "/sessions/:sessionId",
  asyncHandler(async (req, res) => {
    res.json(await getSessionOverview(req.params.sessionId, { userId: req.user!.id }));
  }),
);

sessionsRouter.patch(
  "/sessions/:sessionId",
  validateBody(changeLevelBodySchema),
  asyncHandler(async (req, res) => {
    const { level } = req.body as z.infer<typeof changeLevelBodySchema>;
    res.json(await changeLevel(req.params.sessionId, level, { userId: req.user!.id }));
  }),
);
