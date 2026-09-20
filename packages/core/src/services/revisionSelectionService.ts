import { prisma, type Word, type WordProgress } from "@lt/db";
import { REVISION_DEFAULT_LIMIT } from "../config.js";
import { shuffle } from "../shuffle.js";
import type { RevisionCandidate } from "../types.js";

export function toRevisionCandidate(word: Word, progress: WordProgress): RevisionCandidate {
  return {
    wordId: word.id,
    word: word.word,
    translation: word.translation,
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
 * Ranks every committed word in the learner's vocabulary for revision —
 * this deliberately includes never-yet-drilled words (timesSeen === 0),
 * since bulk-imported initial vocabulary starts at timesSeen 0 too and
 * should be immediately revisable, not stuck waiting for a first exposure
 * that revision itself is supposed to provide. Brand-new vocabulary is kept
 * out of revision structurally instead: NEW_WORD_LEARNING candidates aren't
 * real Word rows at all until the learner completes that exercise.
 */
export async function selectRevisionCandidates(
  languageId: string,
  opts: { limit?: number } = {},
): Promise<RevisionCandidate[]> {
  const limit = opts.limit ?? REVISION_DEFAULT_LIMIT;
  const now = new Date();

  const words = await prisma.word.findMany({
    where: { languageId },
    include: { progress: true },
  });

  const scored = shuffle(words)
    .filter((w): w is Word & { progress: WordProgress } => w.progress !== null)
    .map((w) => {
      const p = w.progress;
      const overdue = p.nextReviewAt !== null && p.nextReviewAt <= now;
      const wrongRatio = p.timesWrong / Math.max(p.timesSeen, 1);
      // Rounded to whole days so a same-batch bulk import (created seconds
      // apart) doesn't produce razor-thin, permanently-stable score
      // differences that always rank the same handful of words first.
      const daysSinceCreated = Math.floor((now.getTime() - w.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = Math.max(0, 1 - daysSinceCreated / 30);
      const reviewedWithinLastDay =
        p.lastSeenAt !== null && now.getTime() - p.lastSeenAt.getTime() < 24 * 60 * 60 * 1000;

      const score =
        (overdue ? 2.0 : 0) +
        (1 - p.mastery) * 1.5 +
        (p.status === "LEARNING" ? 1.0 : 0) +
        wrongRatio * 1.0 +
        recencyBoost * 0.5 -
        (p.mastery > 0.85 && reviewedWithinLastDay ? 1.0 : 0) +
        // Small per-call jitter so genuinely close-scoring words (e.g. a
        // whole freshly-imported vocabulary sharing the same score) rotate
        // across calls instead of the same subset winning every time —
        // small enough that it rarely reorders words with a real priority
        // gap (overdue, LEARNING status, wrong-answer history, etc).
        Math.random() * 0.4;

      return { word: w, progress: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    // Selection uses the composite score above; presentation order to the
    // LLM always starts with the least-mastered word first.
    .sort((a, b) => a.progress.mastery - b.progress.mastery);

  return scored.map(({ word, progress }) => toRevisionCandidate(word, progress));
}
