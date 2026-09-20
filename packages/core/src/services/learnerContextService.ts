import { prisma } from "@lt/db";
import { LEARNER_CONTEXT_LIST_CAP } from "../config.js";
import type { LearnerContext } from "../types.js";
import { getLanguage } from "./languageService.js";
import { toRevisionCandidate, selectRevisionCandidates } from "./revisionSelectionService.js";
import { getVocabularyStats } from "./vocabularyService.js";

export async function buildLearnerContext(languageId: string): Promise<LearnerContext> {
  const language = await getLanguage(languageId);
  const vocabulary = await getVocabularyStats(languageId);
  const weakWords = await selectRevisionCandidates(languageId, { limit: 5 });

  const now = new Date();
  const overdue = await prisma.word.findMany({
    where: { languageId, progress: { nextReviewAt: { lte: now } } },
    include: { progress: true },
    orderBy: { progress: { nextReviewAt: "asc" } },
    take: LEARNER_CONTEXT_LIST_CAP,
  });
  const recentlyPracticed = await prisma.word.findMany({
    where: { languageId, progress: { lastSeenAt: { not: null } } },
    include: { progress: true },
    orderBy: { progress: { lastSeenAt: "desc" } },
    take: LEARNER_CONTEXT_LIST_CAP,
  });

  return {
    language: {
      id: language.id,
      name: language.name,
      languageCode: language.languageCode,
      level: language.currentLevel,
    },
    vocabulary,
    weakWords,
    overdueWords: overdue.map((w) => toRevisionCandidate(w, w.progress!)),
    recentlyPracticedWords: recentlyPracticed.map((w) => toRevisionCandidate(w, w.progress!)),
  };
}
