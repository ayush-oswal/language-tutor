import { prisma } from "@lt/db";
import { LEARNER_CONTEXT_LIST_CAP } from "../config.js";
import type { LearnerContext } from "../types.js";
import { revisableWordsWhere, selectRevisionCandidates, toRevisionCandidate } from "./revisionSelectionService.js";
import { getSessionOverview } from "./sessionService.js";

export async function buildLearnerContext(sessionId: string): Promise<LearnerContext> {
  const session = await getSessionOverview(sessionId);
  const where = revisableWordsWhere(sessionId, session.currentLevel);
  const now = new Date();

  const [weakWords, overdue, recentlyPracticed] = await Promise.all([
    selectRevisionCandidates(sessionId, session.currentLevel, { limit: 5 }),
    prisma.wordProgress.findMany({
      where: { ...where, nextReviewAt: { lte: now } },
      include: { word: true },
      orderBy: { nextReviewAt: "asc" },
      take: LEARNER_CONTEXT_LIST_CAP,
    }),
    prisma.wordProgress.findMany({
      where: { ...where, lastSeenAt: { not: null } },
      include: { word: true },
      orderBy: { lastSeenAt: "desc" },
      take: LEARNER_CONTEXT_LIST_CAP,
    }),
  ]);

  return {
    session: {
      id: session.id,
      languageName: session.language.name,
      languageCode: session.language.code,
      level: session.currentLevel,
    },
    vocabulary: session.vocabularyStats,
    weakWords,
    overdueWords: overdue.map(({ word, ...p }) => toRevisionCandidate(word, p)),
    recentlyPracticedWords: recentlyPracticed.map(({ word, ...p }) => toRevisionCandidate(word, p)),
  };
}
