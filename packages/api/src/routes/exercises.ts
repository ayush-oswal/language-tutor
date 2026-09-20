import {
  completeExercise,
  getExercise,
  getLanguage,
  listExercises,
  type ExerciseStatus,
  type ExerciseType,
} from "@lt/core";
import { Router } from "express";
import { completeExerciseBodySchema } from "../dto/exercises.dto.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const exercisesRouter = Router();

exercisesRouter.get(
  "/languages/:languageId/exercises",
  asyncHandler(async (req, res) => {
    await getLanguage(req.params.languageId, { userId: req.user!.id });
    const type = typeof req.query.type === "string" ? (req.query.type as ExerciseType) : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as ExerciseStatus) : undefined;
    res.json(await listExercises(req.params.languageId, { type, status }));
  }),
);

exercisesRouter.get(
  "/exercises/:exerciseId",
  asyncHandler(async (req, res) => {
    const exercise = await getExercise(req.params.exerciseId);
    await getLanguage(exercise.languageId, { userId: req.user!.id });
    res.json(exercise);
  }),
);

exercisesRouter.post(
  "/exercises/:exerciseId/complete",
  validateBody(completeExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const exercise = await getExercise(req.params.exerciseId);
    await getLanguage(exercise.languageId, { userId: req.user!.id });
    res.json(await completeExercise(req.params.exerciseId, req.body.answers));
  }),
);
