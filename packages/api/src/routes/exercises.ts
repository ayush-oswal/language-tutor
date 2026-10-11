import { completeExercise, getExercise, getSession, listExercises } from "@lt/core";
import { ExerciseStatus, ExerciseType } from "@lt/db";
import { Router } from "express";
import { completeExerciseBodySchema } from "../dto/exercises.dto.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { queryEnum, validateBody } from "../middleware/validate.js";

export const exercisesRouter = Router();

exercisesRouter.get(
  "/sessions/:sessionId/exercises",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId, { userId: req.user!.id });
    const type = queryEnum(req.query.type, ExerciseType);
    const status = queryEnum(req.query.status, ExerciseStatus);
    res.json(await listExercises(session.id, { type, status }));
  }),
);

exercisesRouter.get(
  "/exercises/:exerciseId",
  asyncHandler(async (req, res) => {
    const exercise = await getExercise(req.params.exerciseId);
    await getSession(exercise.languageSessionId, { userId: req.user!.id });
    res.json(exercise);
  }),
);

exercisesRouter.post(
  "/exercises/:exerciseId/complete",
  validateBody(completeExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const exercise = await getExercise(req.params.exerciseId);
    await getSession(exercise.languageSessionId, { userId: req.user!.id });
    res.json(await completeExercise(req.params.exerciseId, req.body.answers));
  }),
);
