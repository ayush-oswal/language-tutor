import { buildLearnerContext, getLanguage, listLanguages } from "@lt/core";
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

export const languagesRouter = Router();

languagesRouter.get(
  "/languages",
  asyncHandler(async (req, res) => {
    res.json(await listLanguages(req.user!.id));
  }),
);

languagesRouter.get(
  "/languages/:languageId",
  asyncHandler(async (req, res) => {
    res.json(await getLanguage(req.params.languageId, { userId: req.user!.id }));
  }),
);

languagesRouter.get(
  "/languages/:languageId/progress",
  asyncHandler(async (req, res) => {
    await getLanguage(req.params.languageId, { userId: req.user!.id });
    res.json(await buildLearnerContext(req.params.languageId));
  }),
);
