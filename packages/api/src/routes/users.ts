import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

export const usersRouter = Router();

usersRouter.get(
  "/users/me",
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
);
