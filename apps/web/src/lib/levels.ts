import type { CEFRLevel, LevelProgress } from "@lt/core";

// Mirrors @lt/core's CEFR_LEVELS; importing runtime values from @lt/core would pull Prisma into the browser bundle.
export const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_NAMES: Record<CEFRLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

/** Share of a level's words the learner knows well (FAMILIAR or MASTERED), 0–100. */
export function knownPct(progress: LevelProgress | undefined): number {
  if (!progress || progress.total === 0) return 0;
  return Math.round(((progress.familiar + progress.mastered) / progress.total) * 100);
}
