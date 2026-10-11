import { listLanguages } from "@lt/core";
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

export const languagesRouter = Router();

languagesRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    res.json(await listLanguages());
  }),
);
