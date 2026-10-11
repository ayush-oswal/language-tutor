import { prisma, type Prisma, type Word, type WordProgress } from "@lt/db";
import { levelsUpTo, EXERCISE_CANDIDATE_LIMIT } from "../config.js";
import { shuffle } from "../shuffle.js";
import type { CEFRLevel, RevisionCandidate } from "../types.js";

export function toRevisionCandidate(word: Word, progress: WordProgress): RevisionCandidate {
  return {
    wordId: word.id,
    word: word.word,
    translation: word.translation,
    partOfSpeech: word.partOfSpeech,
    level: word.level,
    mastery: progress.mastery,
    status: progress.status,
    timesSeen: progress.timesSeen,
    timesCorrect: progress.timesCorrect,
    timesWrong: progress.timesWrong,
    lastSeenAt: progress.lastSeenAt,
    nextReviewAt: progress.nextReviewAt,
  };
}

/**
 * Words eligible for revision/story exercises: anything at or below the
 * session's current level that the learner already knows or has been taught.
 * NEW words (not yet introduced) are excluded; they come in through
 * new-word learning instead.
 */
export function revisableWordsWhere(sessionId: string, currentLevel: CEFRLevel): Prisma.WordProgressWhereInput {
  return {
    languageSessionId: sessionId,
    status: { not: "NEW" },
    word: { level: { in: levelsUpTo(currentLevel) } },
  };
}

export async function getRevisableWordIds(sessionId: string, currentLevel: CEFRLevel): Promise<Set<string>> {
  const rows = await prisma.wordProgress.findMany({
    where: revisableWordsWhere(sessionId, currentLevel),
    select: { wordId: true },
  });
  return new Set(rows.map((r) => r.wordId));
}

/** Ranks every revisable word in the session and returns the top `limit`, most in need of practice first. */
export async function selectRevisionCandidates(
  sessionId: string,
  currentLevel: CEFRLevel,
  opts: { limit?: number } = {},
): Promise<RevisionCandidate[]> {
  const limit = opts.limit ?? EXERCISE_CANDIDATE_LIMIT;
  const now = new Date();

  const rows = await prisma.wordProgress.findMany({
    where: revisableWordsWhere(sessionId, currentLevel),
    include: { word: true },
  });

  const scored = shuffle(rows)
    .map(({ word, ...p }) => {
      const overdue = p.nextReviewAt !== null && p.nextReviewAt <= now;
      const wrongRatio = p.timesWrong / Math.max(p.timesSeen, 1);
      // Days since the word entered the learner's deck, rounded to whole days so
      // rows created in the same batch don't produce razor-thin, permanently
      // stable score differences that always rank the same handful first.
      const daysSinceAdded = Math.floor((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = Math.max(0, 1 - daysSinceAdded / 30);
      const reviewedWithinLastDay =
        p.lastSeenAt !== null && now.getTime() - p.lastSeenAt.getTime() < 24 * 60 * 60 * 1000;

      const score =
        (overdue ? 2.0 : 0) +
        (1 - p.mastery) * 1.5 +
        (p.status === "LEARNING" ? 1.0 : 0) +
        wrongRatio * 1.0 +
        recencyBoost * 0.5 -
        (p.mastery > 0.85 && reviewedWithinLastDay ? 1.0 : 0) +
        // Small per-call jitter so genuinely close-scoring words rotate across
        // calls instead of the same subset winning every time — small enough
        // that it rarely reorders words with a real priority gap.
        Math.random() * 0.4;

      return { word, progress: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ word, progress }) => toRevisionCandidate(word, progress));
}
