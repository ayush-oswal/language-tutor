import { Prisma, prisma, type CEFRLevel, type Language, type LanguageSession } from "@lt/db";
import type { PrismaClientOrTx } from "@lt/db";
import { ASSUMED_KNOWN_MASTERY, ASSUMED_KNOWN_STATUS, CEFR_LEVELS, levelsBelow, levelsUpTo } from "../config.js";
import { AlreadyEnrolledError, NotFoundError } from "../errors.js";
import type { LevelProgress, SessionOverview, VocabularyStats } from "../types.js";

// A single enrollment/level change can touch thousands of progress rows on a large catalogue.
const SYNC_TRANSACTION_TIMEOUT_MS = 30_000;

export type SessionWithLanguage = LanguageSession & { language: Language };

export async function getSession(
  sessionId: string,
  opts?: { userId?: string },
  tx: PrismaClientOrTx = prisma,
): Promise<SessionWithLanguage> {
  const session = await tx.languageSession.findUnique({ where: { id: sessionId }, include: { language: true } });
  if (!session || (opts?.userId !== undefined && session.userId !== opts.userId)) {
    throw new NotFoundError("LanguageSession", sessionId);
  }
  return session;
}

/**
 * Brings a session's progress rows in line with `level`, as if the learner
 * had enrolled at that level, without touching anything they've actually
 * practiced (timesSeen > 0):
 * - every word at or below `level` gets a progress row
 * - untouched words below `level` are assumed known (FAMILIAR)
 * - untouched words at `level` are NEW, i.e. still to be introduced
 * Words above `level` are left alone and excluded from exercises.
 * Idempotent, so it is also safe to re-run after words are added to the catalogue.
 */
export async function syncProgressForLevel(
  sessionId: string,
  languageId: string,
  level: CEFRLevel,
  tx: PrismaClientOrTx,
): Promise<void> {
  const below = levelsBelow(level);
  const belowSet = new Set<CEFRLevel>(below);

  const words = await tx.word.findMany({
    where: { languageId, level: { in: levelsUpTo(level) } },
    select: { id: true, level: true },
  });
  if (words.length > 0) {
    await tx.wordProgress.createMany({
      data: words.map((w) =>
        belowSet.has(w.level)
          ? { languageSessionId: sessionId, wordId: w.id, status: ASSUMED_KNOWN_STATUS, mastery: ASSUMED_KNOWN_MASTERY }
          : { languageSessionId: sessionId, wordId: w.id, status: "NEW" as const, mastery: 0 },
      ),
      skipDuplicates: true,
    });
  }

  if (below.length > 0) {
    await tx.wordProgress.updateMany({
      where: { languageSessionId: sessionId, timesSeen: 0, status: "NEW", word: { level: { in: below } } },
      data: { status: ASSUMED_KNOWN_STATUS, mastery: ASSUMED_KNOWN_MASTERY },
    });
  }

  await tx.wordProgress.updateMany({
    where: { languageSessionId: sessionId, timesSeen: 0, status: { not: "NEW" }, word: { level } },
    data: { status: "NEW", mastery: 0 },
  });
}

export async function enroll(userId: string, languageId: string, level: CEFRLevel): Promise<SessionOverview> {
  const sessionId = await prisma.$transaction(
    async (tx) => {
      const language = await tx.language.findUnique({ where: { id: languageId } });
      if (!language) throw new NotFoundError("Language", languageId);

      const existing = await tx.languageSession.findUnique({ where: { userId_languageId: { userId, languageId } } });
      if (existing) throw new AlreadyEnrolledError(language.name);

      let session: LanguageSession;
      try {
        session = await tx.languageSession.create({ data: { userId, languageId, currentLevel: level } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          throw new AlreadyEnrolledError(language.name);
        }
        throw err;
      }

      await syncProgressForLevel(session.id, languageId, level, tx);
      return session.id;
    },
    { timeout: SYNC_TRANSACTION_TIMEOUT_MS },
  );
  return getSessionOverview(sessionId);
}

export async function changeLevel(
  sessionId: string,
  level: CEFRLevel,
  opts?: { userId?: string },
): Promise<SessionOverview> {
  await prisma.$transaction(
    async (tx) => {
      const session = await getSession(sessionId, opts, tx);
      await tx.languageSession.update({ where: { id: sessionId }, data: { currentLevel: level } });
      await syncProgressForLevel(sessionId, session.languageId, level, tx);
    },
    { timeout: SYNC_TRANSACTION_TIMEOUT_MS },
  );
  return getSessionOverview(sessionId);
}

export async function listSessions(userId: string): Promise<SessionOverview[]> {
  const sessions = await prisma.languageSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { language: true },
  });
  return Promise.all(sessions.map((s) => toSessionOverview(s)));
}

export async function getSessionOverview(sessionId: string, opts?: { userId?: string }): Promise<SessionOverview> {
  return toSessionOverview(await getSession(sessionId, opts));
}

async function toSessionOverview(session: SessionWithLanguage): Promise<SessionOverview> {
  const levelProgress = await computeLevelProgress(session.id, session.languageId);
  const included = new Set<CEFRLevel>(levelsUpTo(session.currentLevel));
  const vocabularyStats: VocabularyStats = { total: 0, new: 0, learning: 0, familiar: 0, mastered: 0 };
  for (const lp of levelProgress) {
    if (!included.has(lp.level)) continue;
    vocabularyStats.total += lp.total;
    vocabularyStats.new += lp.new;
    vocabularyStats.learning += lp.learning;
    vocabularyStats.familiar += lp.familiar;
    vocabularyStats.mastered += lp.mastered;
  }
  return {
    id: session.id,
    language: { id: session.language.id, name: session.language.name, code: session.language.code },
    currentLevel: session.currentLevel,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    vocabularyStats,
    levelProgress,
  };
}

/** Catalogue words without a progress row yet (e.g. above the learner's level) count as NEW. */
async function computeLevelProgress(sessionId: string, languageId: string): Promise<LevelProgress[]> {
  const [wordCounts, progress] = await Promise.all([
    prisma.word.groupBy({ by: ["level"], where: { languageId }, _count: { _all: true } }),
    prisma.wordProgress.findMany({
      where: { languageSessionId: sessionId },
      select: { status: true, word: { select: { level: true } } },
    }),
  ]);

  const byLevel = new Map<CEFRLevel, LevelProgress>(
    CEFR_LEVELS.map((level) => [level, { level, total: 0, new: 0, learning: 0, familiar: 0, mastered: 0 }]),
  );
  for (const wc of wordCounts) byLevel.get(wc.level)!.total = wc._count._all;
  for (const p of progress) {
    const lp = byLevel.get(p.word.level)!;
    if (p.status === "LEARNING") lp.learning++;
    else if (p.status === "FAMILIAR") lp.familiar++;
    else if (p.status === "MASTERED") lp.mastered++;
  }
  for (const lp of byLevel.values()) lp.new = lp.total - lp.learning - lp.familiar - lp.mastered;

  return CEFR_LEVELS.map((level) => byLevel.get(level)!);
}
