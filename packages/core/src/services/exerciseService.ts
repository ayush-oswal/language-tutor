import { Prisma, prisma, type Exercise } from "@lt/db";
import type { PrismaClientOrTx } from "@lt/db";
import { NotFoundError } from "../errors.js";
import { scoreExercise } from "../scoring/index.js";
import type {
  ExerciseResult,
  ExerciseStatus,
  ExerciseSummary,
  ExerciseType,
  ExerciseWithAttempts,
  NewWordCandidate,
  NewWordLearningPayload,
} from "../types.js";
import { bulkInsertWords } from "./vocabularyService.js";
import { recordAnswer } from "./wordProgressService.js";

export async function createExerciseFromSubmission(
  languageId: string,
  type: ExerciseType,
  payload: unknown,
  answerKey: unknown,
  generationContext?: unknown,
): Promise<Exercise> {
  return prisma.exercise.create({
    data: {
      languageId,
      type,
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
  languageId: string,
  opts: { type?: ExerciseType; status?: ExerciseStatus } = {},
): Promise<ExerciseSummary[]> {
  return prisma.exercise.findMany({
    where: {
      languageId,
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, languageId: true, type: true, status: true, createdAt: true, completedAt: true },
  });
}

/**
 * Resolves NEW_WORD_LEARNING candidates (tempId-keyed) to real Word rows,
 * inserting any that don't exist yet. Idempotent — bulkInsertWords skips
 * words whose normalizedWord already exists, so this is safe to call on
 * every completion of the same exercise, not just the first.
 */
async function resolveNewWordCandidates(
  languageId: string,
  candidates: NewWordCandidate[],
  tx: PrismaClientOrTx,
): Promise<Map<string, string>> {
  const { inserted } = await bulkInsertWords(
    languageId,
    candidates.map((c) => ({
      word: c.word,
      translation: c.translation,
      partOfSpeech: c.partOfSpeech,
      metadata: c.metadata,
    })),
    tx,
  );
  const insertedByNormalized = new Map(inserted.map((w) => [w.normalizedWord, w.id]));

  const tempIdToWordId = new Map<string, string>();
  for (const c of candidates) {
    const wordId =
      insertedByNormalized.get(c.normalizedWord) ??
      (
        await tx.word.findUniqueOrThrow({
          where: { languageId_normalizedWord: { languageId, normalizedWord: c.normalizedWord } },
        })
      ).id;
    tempIdToWordId.set(c.tempId, wordId);
  }
  return tempIdToWordId;
}

export async function completeExercise(exerciseId: string, answers: unknown): Promise<ExerciseResult> {
  return prisma.$transaction(async (tx) => {
    const exercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundError("Exercise", exerciseId);

    const scoreResult = scoreExercise(exercise.type, exercise.payload, exercise.answerKey, answers);
    let questionResults = scoreResult.questionResults;

    if (exercise.type === "NEW_WORD_LEARNING") {
      const payload = exercise.payload as unknown as NewWordLearningPayload;
      const tempIdToWordId = await resolveNewWordCandidates(exercise.languageId, payload.candidates, tx);
      questionResults = questionResults.map((r) => ({
        ...r,
        wordIds: r.wordIds.map((tempId) => tempIdToWordId.get(tempId) ?? tempId),
      }));
    }

    for (const result of questionResults) {
      for (const wordId of result.wordIds) {
        await recordAnswer(wordId, result.correct, tx);
      }
    }

    const attempt = await tx.exerciseAttempt.create({
      data: {
        exerciseId,
        answers: answers as Prisma.InputJsonValue,
        score: scoreResult.score,
        percentage: scoreResult.percentage,
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
