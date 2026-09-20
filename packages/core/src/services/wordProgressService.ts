import { prisma, type WordProgress } from "@lt/db";
import type { PrismaClientOrTx } from "@lt/db";
import {
  MASTERY_FORGETTING_CAP,
  MASTERY_FORGETTING_PER_DAY,
  MASTERY_LEARNING_RATE_BASE,
  MASTERY_LEARNING_RATE_MIN,
  MASTERY_THRESHOLD_FAMILIAR,
  MASTERY_THRESHOLD_MASTERED,
  clamp,
} from "../config.js";
import type { WordStatus } from "../types.js";

export function deriveStatus(mastery: number, timesSeen: number): WordStatus {
  if (timesSeen === 0) return "NEW";
  if (mastery >= MASTERY_THRESHOLD_MASTERED) return "MASTERED";
  if (mastery >= MASTERY_THRESHOLD_FAMILIAR) return "FAMILIAR";
  return "LEARNING";
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

/**
 * Deliberately simple for MVP; isolated so a real SRS algorithm can replace
 * it later without touching any caller.
 */
export function computeNextReviewAt(status: WordStatus, wasCorrect: boolean, now: Date = new Date()): Date {
  if (!wasCorrect) return addHours(now, 4);
  switch (status) {
    case "NEW":
    case "LEARNING":
      return addDays(now, 1);
    case "FAMILIAR":
      return addDays(now, 3);
    case "MASTERED":
      return addDays(now, 14);
  }
}

export async function initializeProgress(
  wordId: string,
  tx: PrismaClientOrTx = prisma,
): Promise<WordProgress> {
  return tx.wordProgress.create({
    data: { wordId, status: "NEW", mastery: 0 },
  });
}

/**
 * Deterministic mastery update. Factors in:
 * - correctness (pulls mastery toward 1 or 0)
 * - timesSeen (a word seen many times already gets smaller nudges — it's
 *   already fairly well-calibrated, whereas an early answer swings mastery
 *   a lot since there's little signal yet)
 * - lastSeenAt (a "forgetting" decay is applied first if a lot of time has
 *   passed since the word was last reviewed, before the new answer's pull
 *   is applied — a stale word is treated as somewhat less known than its
 *   stored value suggests)
 */
export function computeMastery(
  current: { mastery: number; timesSeen: number; lastSeenAt: Date | null },
  correct: boolean,
  now: Date = new Date(),
): number {
  let mastery = current.mastery;

  if (current.lastSeenAt) {
    const daysSinceLastSeen = (now.getTime() - current.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.min(MASTERY_FORGETTING_CAP, Math.max(0, daysSinceLastSeen) * MASTERY_FORGETTING_PER_DAY);
    mastery = Math.max(0, mastery - decay);
  }

  const target = correct ? 1 : 0;
  const learningRate = Math.max(MASTERY_LEARNING_RATE_MIN, MASTERY_LEARNING_RATE_BASE / Math.sqrt(current.timesSeen + 1));
  mastery = mastery + learningRate * (target - mastery);

  return clamp(mastery, 0, 1);
}

export async function recordAnswer(
  wordId: string,
  correct: boolean,
  tx: PrismaClientOrTx = prisma,
  now: Date = new Date(),
): Promise<WordProgress> {
  const progress = await tx.wordProgress.findUniqueOrThrow({ where: { wordId } });

  const mastery = computeMastery(progress, correct, now);
  const timesSeen = progress.timesSeen + 1;
  const status = deriveStatus(mastery, timesSeen);

  return tx.wordProgress.update({
    where: { wordId },
    data: {
      mastery,
      status,
      timesSeen,
      timesCorrect: progress.timesCorrect + (correct ? 1 : 0),
      timesWrong: progress.timesWrong + (correct ? 0 : 1),
      lastSeenAt: now,
      nextReviewAt: computeNextReviewAt(status, correct, now),
    },
  });
}
