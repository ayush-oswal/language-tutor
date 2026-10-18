import { Prisma, prisma, type Exercise } from "@lt/db";
import { NotFoundError } from "../errors.js";
import { scoreExercise } from "../scoring/index.js";
import type {
  CEFRLevel,
  ExerciseResult,
  ExerciseStatus,
  ExerciseSummary,
  ExerciseType,
  ExerciseWithAttempts,
} from "../types.js";
import { recordAnswer } from "./wordProgressService.js";

export async function createExerciseFromSubmission(
  languageSessionId: string,
  type: ExerciseType,
  /** The session's current level, recorded so the exercise keeps the level it was generated for. */
  level: CEFRLevel,
  payload: unknown,
  answerKey: unknown,
  generationContext?: unknown,
): Promise<Exercise> {
  return prisma.exercise.create({
    data: {
      languageSessionId,
      type,
      level,
      status: "NEW",
      payload: payload as Prisma.InputJsonValue,
      answerKey: answerKey as Prisma.InputJsonValue,
      generationContext: generationContext === undefined ? Prisma.JsonNull : (generationContext as Prisma.InputJsonValue),
    },
  });
}

export async function getExercise(exerciseId: string): Promise<ExerciseWithAttempts> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { attempts: { orderBy: { createdAt: "desc" } } },
  });
  if (!exercise) throw new NotFoundError("Exercise", exerciseId);
  if (exercise.status === "NEW") {
    return prisma.exercise.update({
      where: { id: exerciseId },
      data: { status: "IN_PROGRESS" },
      include: { attempts: { orderBy: { createdAt: "desc" } } },
    });
  }
  return exercise;
}

export async function listExercises(
  languageSessionId: string,
  opts: { type?: ExerciseType; status?: ExerciseStatus } = {},
): Promise<ExerciseSummary[]> {
  return prisma.exercise.findMany({
    where: {
      languageSessionId,
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, languageSessionId: true, type: true, level: true, status: true, createdAt: true, completedAt: true },
  });
}

export async function completeExercise(exerciseId: string, answers: unknown): Promise<ExerciseResult> {
  return prisma.$transaction(async (tx) => {
    const exercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundError("Exercise", exerciseId);

    const { score, percentage, questionResults } = scoreExercise(
      exercise.type,
      exercise.payload,
      exercise.answerKey,
      answers,
    );

    for (const result of questionResults) {
      for (const wordId of result.wordIds) {
        await recordAnswer(exercise.languageSessionId, wordId, result.correct, tx);
      }
    }

    const attempt = await tx.exerciseAttempt.create({
      data: {
        exerciseId,
        answers: answers as Prisma.InputJsonValue,
        score,
        percentage,
        questionResults: questionResults as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const updatedExercise = await tx.exercise.update({
      where: { id: exerciseId },
      data: {
        status: "COMPLETED",
        completedAt: exercise.completedAt ?? new Date(),
      },
    });

    return {
      exercise: updatedExercise,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        questionResults,
      },
    };
  });
}
