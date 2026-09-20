import { Prisma, prisma, type Word } from "@lt/db";
import type { PrismaClientOrTx } from "@lt/db";
import { DuplicateWordError } from "../errors.js";
import { shuffle } from "../shuffle.js";
import type {
  DedupWord,
  NewWordInput,
  PaginatedWords,
  VocabularyStats,
  WordStatus,
  WordWithProgress,
} from "../types.js";
import { initializeProgress } from "./wordProgressService.js";

export function normalizeWord(raw: string): string {
  return raw.normalize("NFC").trim().toLowerCase();
}

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function addWord(
  languageId: string,
  input: NewWordInput,
  tx: PrismaClientOrTx = prisma,
): Promise<WordWithProgress> {
  const normalizedWord = normalizeWord(input.word);
  try {
    const word = await tx.word.create({
      data: {
        languageId,
        word: input.word,
        normalizedWord,
        translation: input.translation,
        partOfSpeech: input.partOfSpeech,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    const progress = await initializeProgress(word.id, tx);
    return { ...word, progress };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new DuplicateWordError(input.word);
    }
    throw err;
  }
}

/**
 * Idempotent: words whose normalizedWord already exists for this language are
 * skipped rather than erroring, since generation flows re-check dedup
 * themselves but the DB constraint remains the final backstop.
 */
export async function bulkInsertWords(
  languageId: string,
  words: NewWordInput[],
  tx: PrismaClientOrTx = prisma,
): Promise<{ inserted: Word[]; skipped: string[] }> {
  const inserted: Word[] = [];
  const skipped: string[] = [];

  for (const input of words) {
    const normalizedWord = normalizeWord(input.word);
    const existing = await tx.word.findUnique({
      where: { languageId_normalizedWord: { languageId, normalizedWord } },
    });
    if (existing) {
      skipped.push(input.word);
      continue;
    }
    try {
      const word = await tx.word.create({
        data: {
          languageId,
          word: input.word,
          normalizedWord,
          translation: input.translation,
          partOfSpeech: input.partOfSpeech,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });
      await initializeProgress(word.id, tx);
      inserted.push(word);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        skipped.push(input.word);
        continue;
      }
      throw err;
    }
  }

  return { inserted, skipped };
}

/**
 * `page`/`pageSize` are both optional — omit either to get the full matching
 * list back (used by dedup-adjacent callers); the HTTP API always supplies
 * both so the frontend's vocabulary view is paginated. `sortBy: "mastery"`
 * (weakest first) is what the MCP getVocabulary tool uses to hand the LLM a
 * capped, focus-worthy slice instead of the entire vocabulary.
 */
export async function listWords(
  languageId: string,
  opts: { search?: string; status?: WordStatus; page?: number; pageSize?: number; sortBy?: "word" | "mastery" } = {},
  tx: PrismaClientOrTx = prisma,
): Promise<PaginatedWords> {
  const where = {
    languageId,
    ...(opts.search
      ? {
          OR: [
            { word: { contains: opts.search, mode: "insensitive" as const } },
            { translation: { contains: opts.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(opts.status ? { progress: { status: opts.status } } : {}),
  };

  const total = await tx.word.count({ where });

  if (opts.sortBy === "mastery") {
    // Most words share the same mastery (e.g. 0 before anything's been drilled),
    // so an alphabetical tiebreak would always surface the same words first —
    // shuffle within each mastery tier instead, for variety across calls.
    const all = await tx.word.findMany({
      where,
      include: { progress: true },
      orderBy: [{ progress: { mastery: "asc" } }],
    });
    const ordered = shuffleWithinMasteryTiers(all);
    const page = Math.max(opts.page ?? 1, 1);
    const words = opts.pageSize ? ordered.slice((page - 1) * opts.pageSize, page * opts.pageSize) : ordered;
    return { words, total, page, pageSize: opts.pageSize ?? total };
  }

  const words = await tx.word.findMany({
    where,
    include: { progress: true },
    orderBy: [{ word: "asc" }],
    ...(opts.pageSize ? { skip: (Math.max(opts.page ?? 1, 1) - 1) * opts.pageSize, take: opts.pageSize } : {}),
  });

  return { words, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? total };
}

function shuffleWithinMasteryTiers(words: WordWithProgress[]): WordWithProgress[] {
  const result: WordWithProgress[] = [];
  let tier: WordWithProgress[] = [];
  let tierMastery: number | null = null;

  for (const word of words) {
    const mastery = word.progress?.mastery ?? 0;
    if (tierMastery !== null && mastery !== tierMastery) {
      result.push(...shuffle(tier));
      tier = [];
    }
    tier.push(word);
    tierMastery = mastery;
  }
  result.push(...shuffle(tier));
  return result;
}

export async function getVocabularyForDedup(
  languageId: string,
  tx: PrismaClientOrTx = prisma,
): Promise<DedupWord[]> {
  const words = await tx.word.findMany({
    where: { languageId },
    select: { word: true, normalizedWord: true, translation: true },
  });
  return words;
}

export async function getVocabularyStats(
  languageId: string,
  tx: PrismaClientOrTx = prisma,
): Promise<VocabularyStats> {
  const words = await tx.word.findMany({
    where: { languageId },
    select: { progress: { select: { status: true } } },
  });
  const stats: VocabularyStats = { total: words.length, new: 0, learning: 0, familiar: 0, mastered: 0 };
  for (const w of words) {
    switch (w.progress?.status) {
      case "NEW":
        stats.new++;
        break;
      case "LEARNING":
        stats.learning++;
        break;
      case "FAMILIAR":
        stats.familiar++;
        break;
      case "MASTERED":
        stats.mastered++;
        break;
    }
  }
  return stats;
}
