// Usage: node packages/db/seed/seedWords.js <language> [jsonFile]
// e.g.   node packages/db/seed/seedWords.js spanish
//        node packages/db/seed/seedWords.js spanish packages/db/seed/languages/spanishA2.json
//
// Reads a JSON array of words (format: see PROMPT.md) and upserts them into the
// catalogue. Run seedTags.js first. The whole file is validated before anything
// is written; any invalid entry aborts the run.
//
// Re-running is safe. For a word already in the database (same word + part of speech):
// - file level same or lower → the file's entry overwrites it (use this to fix entries)
// - file level higher → the existing, easier-level entry is kept; only its rank can improve
// Within one file, duplicates are merged: lowest level and rank win, tags are combined.

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://tutor:tutor@localhost:5432/language_tutor";

const LANGUAGES = {
  spanish: { name: "Spanish", code: "es" },
};

import { CEFRLevel, PartOfSpeech, PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LEVELS = Object.values(CEFRLevel);
const PARTS_OF_SPEECH = Object.values(PartOfSpeech);

const [languageKey, fileArg] = process.argv.slice(2);
const language = LANGUAGES[languageKey];
if (!language) {
  console.error(`Usage: node seedWords.js <language> [jsonFile]\nKnown languages: ${Object.keys(LANGUAGES).join(", ")}`);
  process.exit(1);
}
const file = fileArg ?? fileURLToPath(new URL(`./languages/${languageKey}Words.json`, import.meta.url));

// Must match normalizeWord in @lt/core.
const normalizeWord = (raw) => raw.normalize("NFC").trim().toLowerCase();
const lowerLevel = (a, b) => (LEVELS.indexOf(a) <= LEVELS.indexOf(b) ? a : b);
const minRank = (a, b) => (a == null ? b : b == null ? a : Math.min(a, b));
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function validate(entry, knownTags) {
  const errors = [];
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return ["entry is not an object"];

  if (!isNonEmptyString(entry.word)) errors.push("word must be a non-empty string");
  if (!isNonEmptyString(entry.translation)) errors.push("translation must be a non-empty string");

  const pos = typeof entry.partOfSpeech === "string" ? entry.partOfSpeech.toUpperCase() : entry.partOfSpeech;
  if (!PARTS_OF_SPEECH.includes(pos)) errors.push(`partOfSpeech must be one of ${PARTS_OF_SPEECH.join(", ")}`);

  const level = typeof entry.level === "string" ? entry.level.toUpperCase() : entry.level;
  if (!LEVELS.includes(level)) errors.push(`level must be one of ${LEVELS.join(", ")}`);

  if (entry.gender != null && !isNonEmptyString(entry.gender)) errors.push("gender must be a non-empty string or null");

  if (entry.rank != null && !(Number.isInteger(entry.rank) && entry.rank >= 1)) {
    errors.push("rank must be a positive integer or null");
  }

  const tags = Array.isArray(entry.tags) ? entry.tags.map((t) => (typeof t === "string" ? t.trim().toLowerCase() : t)) : null;
  if (!tags) errors.push("tags must be an array");
  else {
    for (const t of tags) if (!knownTags.has(t)) errors.push(`unknown tag "${t}" (run seedTags.js, or fix the tag)`);
  }

  if (!Array.isArray(entry.sentences)) errors.push("sentences must be an array");
  else {
    entry.sentences.forEach((s, i) => {
      if (!s || !isNonEmptyString(s.sentence) || !isNonEmptyString(s.translation)) {
        errors.push(`sentences[${i}] must be { sentence, translation } with non-empty strings`);
      }
    });
  }

  if (errors.length > 0) return errors;
  return {
    word: entry.word.trim(),
    normalizedWord: normalizeWord(entry.word),
    translation: entry.translation.trim(),
    partOfSpeech: pos,
    level,
    gender: entry.gender == null ? null : entry.gender.trim().toLowerCase(),
    rank: entry.rank ?? null,
    tags: [...new Set(tags)],
    sentences: entry.sentences.map((s) => ({ sentence: s.sentence.trim(), translation: s.translation.trim() })),
  };
}

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

try {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`${file} must contain a JSON array`);

  const knownTags = new Set((await prisma.tag.findMany({ select: { name: true } })).map((t) => t.name));

  // Validate everything first, merging duplicates (same word + part of speech) within the file.
  const problems = [];
  const byKey = new Map();
  let merged = 0;
  raw.forEach((entry, i) => {
    const result = validate(entry, knownTags);
    if (Array.isArray(result)) {
      problems.push(`#${i} ${JSON.stringify(entry?.word ?? null)}: ${result.join("; ")}`);
      return;
    }
    const key = `${result.normalizedWord}|${result.partOfSpeech}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, result);
      return;
    }
    merged++;
    const keep = result.rank != null && (prev.rank == null || result.rank < prev.rank) ? result : prev;
    byKey.set(key, {
      ...keep,
      level: lowerLevel(prev.level, result.level),
      rank: minRank(prev.rank, result.rank),
      tags: [...new Set([...prev.tags, ...result.tags])],
    });
  });

  if (problems.length > 0) {
    console.error(`${problems.length} invalid entr${problems.length === 1 ? "y" : "ies"} in ${file}. Nothing was written.\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exitCode = 1;
  } else if (byKey.size === 0) {
    console.log(`No words in ${file}. Nothing was written.`);
  } else {
    const lang = await prisma.language.upsert({
      where: { code: language.code },
      update: {},
      create: { name: language.name, code: language.code },
    });

    let created = 0;
    let updated = 0;
    const keptLowerLevel = [];
    for (const w of byKey.values()) {
      const where = {
        languageId_normalizedWord_partOfSpeech: {
          languageId: lang.id,
          normalizedWord: w.normalizedWord,
          partOfSpeech: w.partOfSpeech,
        },
      };
      const existing = await prisma.word.findUnique({ where });
      const rank = existing ? minRank(existing.rank, w.rank) : w.rank;

      if (existing && LEVELS.indexOf(w.level) > LEVELS.indexOf(existing.level)) {
        // Already seeded at an easier level: keep that entry's content and sentences, only improve its rank.
        if (rank !== existing.rank) await prisma.word.update({ where, data: { rank } });
        keptLowerLevel.push(`${w.word} (${existing.level})`);
        continue;
      }

      const data = {
        word: w.word,
        translation: w.translation,
        gender: w.gender,
        sentences: w.sentences,
        level: w.level,
        rank,
      };
      if (existing) {
        await prisma.word.update({
          where,
          data: { ...data, tags: { set: w.tags.map((name) => ({ name })) } },
        });
        updated++;
      } else {
        await prisma.word.create({
          data: {
            ...data,
            languageId: lang.id,
            normalizedWord: w.normalizedWord,
            partOfSpeech: w.partOfSpeech,
            tags: { connect: w.tags.map((name) => ({ name })) },
          },
        });
        created++;
      }
    }

    if (keptLowerLevel.length > 0) {
      console.log(`Already seeded at a lower level, kept as-is: ${keptLowerLevel.join(", ")}`);
    }
    console.log(
      `${language.name}: ${created} created, ${updated} updated, ${keptLowerLevel.length} kept at a lower level` +
        (merged > 0 ? `, ${merged} duplicate entr${merged === 1 ? "y" : "ies"} merged within the file` : "") +
        ` (${raw.length} entries read from ${file}).`,
    );
  }
} finally {
  await prisma.$disconnect();
}
