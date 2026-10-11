import { prisma, type CEFRLevel } from "@lt/db";
import { CEFR_LEVELS } from "../config.js";
import type { LanguageSummary } from "../types.js";

export async function listLanguages(): Promise<LanguageSummary[]> {
  const [languages, counts] = await Promise.all([
    prisma.language.findMany({ orderBy: { name: "asc" } }),
    prisma.word.groupBy({ by: ["languageId", "level"], _count: { _all: true } }),
  ]);

  return languages.map((l) => {
    const wordCountByLevel = Object.fromEntries(CEFR_LEVELS.map((level) => [level, 0])) as Record<CEFRLevel, number>;
    for (const c of counts) {
      if (c.languageId === l.id) wordCountByLevel[c.level] = c._count._all;
    }
    return {
      id: l.id,
      name: l.name,
      code: l.code,
      wordCountByLevel,
      totalWords: Object.values(wordCountByLevel).reduce((sum, n) => sum + n, 0),
    };
  });
}
