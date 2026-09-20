import { addWord, getLanguage, listWords, type WordStatus } from "@lt/core";
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { addWordBodySchema } from "../dto/vocabulary.dto.js";
import { validateBody } from "../middleware/validate.js";

export const vocabularyRouter = Router();

vocabularyRouter.get(
  "/languages/:languageId/vocabulary",
  asyncHandler(async (req, res) => {
    await getLanguage(req.params.languageId, { userId: req.user!.id });
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as WordStatus) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
    res.json(await listWords(req.params.languageId, { search, status, page, pageSize }));
  }),
);

vocabularyRouter.post(
  "/languages/:languageId/vocabulary",
  validateBody(addWordBodySchema),
  asyncHandler(async (req, res) => {
    await getLanguage(req.params.languageId, { userId: req.user!.id });
    const word = await addWord(req.params.languageId, req.body);
    res.status(201).json(word);
  }),
);
