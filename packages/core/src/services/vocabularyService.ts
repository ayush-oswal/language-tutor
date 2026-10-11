import { prisma, type Prisma, type Tag, type Word, type WordProgress } from "@lt/db";
import type { PrismaClientOrTx } from "@lt/db";
import { levelsUpTo } from "../config.js";
import { shuffle } from "../shuffle.js";
import type {
  CEFRLevel,
  NewWordForLearning,
  NewWordLearningPayload,
  PaginatedWords,
  WordSentence,
  WordStatus,
  WordWithProgress,
} from "../types.js";

export function normalizeWord(raw: string): string {
  return raw.normalize("NFC").trim().toLowerCase();
}

type ProgressRowWithWord = WordProgress & { word: Word & { tags: Tag[] } };

function toWordWithProgress(row: ProgressRowWithWord): WordWithProgress {
  const { word, ...progress } = row;
  return { ...word, progress };
}

/**
 * Lists the session's words at or below its current level. `page`/`pageSize`
 * are both optional — omit either to get the full matching list back.
 * `sortBy: "mastery"` (weakest first) is what the MCP getVocabulary tool uses
 * to hand the LLM a capped, focus-worthy slice instead of the whole vocabulary.
 */
export async function listWords(
  sessionId: string,
  currentLevel: CEFRLevel,
  opts: {
    search?: string;
    status?: WordStatus;
    level?: CEFRLevel;
    excludeNew?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: "word" | "mastery";
  } = {},
  tx: PrismaClientOrTx = prisma,
): Promise<PaginatedWords> {
  const allowedLevels = levelsUpTo(currentLevel);
  const levels = opts.level ? allowedLevels.filter((l) => l === opts.level) : allowedLevels;

  const where: Prisma.WordProgressWhereInput = {
    languageSessionId: sessionId,
    ...(opts.status ? { status: opts.status } : opts.excludeNew ? { status: { not: "NEW" } } : {}),
    word: {
      level: { in: levels },
      ...(opts.search
        ? {
            OR: [
              { word: { contains: opts.search, mode: "insensitive" } },
              { translation: { contains: opts.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  };

  const total = await tx.wordProgress.count({ where });
  const include = { word: { include: { tags: true } } } as const;

  if (opts.sortBy === "mastery") {
    // Most words share the same mastery (e.g. every untouched word), so a fixed
    // tiebreak would always surface the same words first — shuffle within each
    // mastery tier instead, for variety across calls.
    const all = await tx.wordProgress.findMany({ where, include, orderBy: [{ mastery: "asc" }] });
    const ordered = shuffleWithinMasteryTiers(all.map(toWordWithProgress));
    const page = Math.max(opts.page ?? 1, 1);
    const words = opts.pageSize ? ordered.slice((page - 1) * opts.pageSize, page * opts.pageSize) : ordered;
    return { words, total, page, pageSize: opts.pageSize ?? total };
  }

  const rows = await tx.wordProgress.findMany({
    where,
    include,
    orderBy: [{ word: { level: "asc" } }, { word: { word: "asc" } }],
    ...(opts.pageSize ? { skip: (Math.max(opts.page ?? 1, 1) - 1) * opts.pageSize, take: opts.pageSize } : {}),
  });

  return { words: rows.map(toWordWithProgress), total, page: opts.page ?? 1, pageSize: opts.pageSize ?? total };
}

function shuffleWithinMasteryTiers(words: WordWithProgress[]): WordWithProgress[] {
  const result: WordWithProgress[] = [];
  let tier: WordWithProgress[] = [];
  let tierMastery: number | null = null;

  for (const word of words) {
    const mastery = word.progress.mastery;
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

export function parseSentences(value: Prisma.JsonValue): WordSentence[] {
  return Array.isArray(value) ? (value as unknown as WordSentence[]) : [];
}

export function toNewWordForLearning(word: Word & { tags: Tag[] }): NewWordForLearning {
  return {
    wordId: word.id,
    word: word.word,
    translation: word.translation,
    partOfSpeech: word.partOfSpeech,
    gender: word.gender,
    sentences: parseSentences(word.sentences),
    tags: word.tags.map((t) => t.name),
  };
}

/** Word ids already being taught by a not-yet-completed NEW_WORD_LEARNING exercise in this session. */
async function reservedNewWordIds(sessionId: string): Promise<Set<string>> {
  const pending = await prisma.exercise.findMany({
    where: { languageSessionId: sessionId, type: "NEW_WORD_LEARNING", status: { not: "COMPLETED" } },
    select: { payload: true },
  });
  return new Set(pending.flatMap((e) => (e.payload as unknown as NewWordLearningPayload).words.map((w) => w.wordId)));
}

/**
 * Picks words at the learner's current level they haven't been introduced to
 * yet (status NEW), skipping any already in a pending new-word lesson. Ranked
 * words go first (most common first); unranked ones follow in random order.
 */
export async function pickNewWords(
  sessionId: string,
  currentLevel: CEFRLevel,
  count: number,
  opts: { tag?: string } = {},
): Promise<{ words: NewWordForLearning[]; remaining: number }> {
  const [reserved, rows] = await Promise.all([
    reservedNewWordIds(sessionId),
    prisma.wordProgress.findMany({
      where: {
        languageSessionId: sessionId,
        status: "NEW",
        word: {
          level: currentLevel,
          ...(opts.tag ? { tags: { some: { name: { equals: opts.tag, mode: "insensitive" } } } } : {}),
        },
      },
      include: { word: { include: { tags: true } } },
    }),
  ]);

  const available = rows.filter((r) => !reserved.has(r.wordId)).map((r) => r.word);
  const ranked = available.filter((w) => w.rank !== null).sort((a, b) => a.rank! - b.rank!);
  const unranked = shuffle(available.filter((w) => w.rank === null));

  return {
    words: [...ranked, ...unranked].slice(0, count).map(toNewWordForLearning),
    remaining: available.length,
  };
}

/** The subset of `wordIds` that are un-introduced (NEW) words at the session's current level. */
export async function getNewWordsForLearning(
  sessionId: string,
  currentLevel: CEFRLevel,
  wordIds: string[],
): Promise<Map<string, NewWordForLearning>> {
  const rows = await prisma.wordProgress.findMany({
    where: { languageSessionId: sessionId, status: "NEW", wordId: { in: wordIds }, word: { level: currentLevel } },
    include: { word: { include: { tags: true } } },
  });
  return new Map(rows.map((r) => [r.wordId, toNewWordForLearning(r.word)]));
}

export async function listTagsForLevel(languageId: string, level: CEFRLevel): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    where: { words: { some: { languageId, level } } },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return tags.map((t) => t.name);
}
