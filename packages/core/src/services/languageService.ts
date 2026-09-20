import { Prisma, prisma } from "@lt/db";
import { DuplicateLanguageError, NotFoundError } from "../errors.js";
import type { CEFRLevel, LanguageDetail, LanguageSummary, NewWordInput } from "../types.js";
import { bulkInsertWords, getVocabularyStats } from "./vocabularyService.js";

export async function createLanguage(
  userId: string,
  input: {
    name: string;
    languageCode: string;
    currentLevel: CEFRLevel;
  },
): Promise<LanguageDetail> {
  try {
    const language = await prisma.language.create({ data: { ...input, userId } });
    return toLanguageDetail(language, { total: 0, new: 0, learning: 0, familiar: 0, mastered: 0 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateLanguageError(input.name, input.languageCode);
    }
    throw err;
  }
}

export async function addInitialVocabulary(languageId: string, words: NewWordInput[]): Promise<LanguageDetail> {
  await getLanguage(languageId); // throws NotFoundError if missing
  await bulkInsertWords(languageId, words);
  return getLanguage(languageId);
}

export async function listLanguages(userId: string): Promise<LanguageSummary[]> {
  const languages = await prisma.language.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { words: true } } },
  });
  return languages.map((l) => ({
    id: l.id,
    name: l.name,
    languageCode: l.languageCode,
    currentLevel: l.currentLevel,
    wordCount: l._count.words,
    createdAt: l.createdAt,
  }));
}

export async function getLanguage(languageId: string, opts?: { userId?: string }): Promise<LanguageDetail> {
  const language = await prisma.language.findUnique({ where: { id: languageId } });
  if (!language || (opts?.userId !== undefined && language.userId !== opts.userId)) {
    throw new NotFoundError("Language", languageId);
  }
  const stats = await getVocabularyStats(languageId);
  return toLanguageDetail(language, stats);
}

function toLanguageDetail(
  language: { id: string; name: string; languageCode: string; currentLevel: CEFRLevel; createdAt: Date; updatedAt: Date },
  stats: LanguageDetail["vocabularyStats"],
): LanguageDetail {
  return {
    id: language.id,
    name: language.name,
    languageCode: language.languageCode,
    currentLevel: language.currentLevel,
    wordCount: stats.total,
    createdAt: language.createdAt,
    updatedAt: language.updatedAt,
    vocabularyStats: stats,
  };
}
