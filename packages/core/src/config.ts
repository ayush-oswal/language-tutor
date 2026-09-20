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

export const REVISION_DEFAULT_LIMIT = 8;
export const NEW_WORD_LEARNING_DEFAULT_COUNT = 10;

/**
 * How many of the learner's least-mastered words getVocabulary returns for an
 * unfiltered (context-gathering) call — capped rather than the full vocabulary
 * so the LLM isn't handed hundreds of words (up to INITIAL_VOCABULARY_TARGET_BY_LEVEL)
 * before generating an exercise, and so it naturally focuses on weak spots.
 */
export const GET_VOCABULARY_CONTEXT_LIMIT = 50;

export const LEARNER_CONTEXT_LIST_CAP = 10;

/**
 * Target size of the INITIAL vocabulary seeded when a language is created,
 * per CEFR level — a real starting vocabulary, not a token sample. Higher
 * levels get a larger target since they build on everything below them.
 * The LLM is instructed it can reach this across multiple
 * submitInitialVocabulary calls rather than one giant response.
 */
export const INITIAL_VOCABULARY_TARGET_BY_LEVEL: Record<CEFRLevel, number> = {
  A1: 300,
  A2: 400,
  B1: 500,
  B2: 600,
  C1: 700,
  C2: 800,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
