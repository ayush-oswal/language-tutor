import type { CEFRLevel } from "@lt/db";

export const MASTERY_THRESHOLD_FAMILIAR = 0.5;
export const MASTERY_THRESHOLD_MASTERED = 0.85;

/**
 * Mastery update model (see wordProgressService.recordAnswer):
 * an exponential-moving-average pull toward 1 (correct) or 0 (incorrect),
 * with a learning rate that shrinks as the word is seen more (early answers
 * swing mastery a lot; a well-established word only gets nudged), plus a
 * small "forgetting" decay applied first if the word hasn't been seen in a
 * while.
 */
export const MASTERY_LEARNING_RATE_BASE = 0.35;
export const MASTERY_LEARNING_RATE_MIN = 0.08;
export const MASTERY_FORGETTING_PER_DAY = 0.02;
export const MASTERY_FORGETTING_CAP = 0.25;

/** How many prioritised known words generateExercise hands the LLM to build an exercise from. */
export const EXERCISE_CANDIDATE_LIMIT = 50;
export const NEW_WORD_LEARNING_DEFAULT_COUNT = 10;

/**
 * How many of the learner's least-mastered words getVocabulary returns for an
 * unfiltered (context-gathering) call — capped rather than the full vocabulary
 * so the LLM isn't handed hundreds of words before generating an exercise, and
 * so it naturally focuses on weak spots.
 */
export const GET_VOCABULARY_CONTEXT_LIMIT = 50;

export const LEARNER_CONTEXT_LIST_CAP = 10;

export const CEFR_LEVELS: readonly CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Untouched words below the learner's current level are treated as already
 * known — but not mastered, so revision still checks them occasionally.
 */
export const ASSUMED_KNOWN_MASTERY = 0.7;
export const ASSUMED_KNOWN_STATUS = "FAMILIAR" as const;

export function levelsBelow(level: CEFRLevel): CEFRLevel[] {
  return CEFR_LEVELS.slice(0, CEFR_LEVELS.indexOf(level));
}

export function levelsUpTo(level: CEFRLevel): CEFRLevel[] {
  return CEFR_LEVELS.slice(0, CEFR_LEVELS.indexOf(level) + 1);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
