import { ValidationError } from "../errors.js";

/**
 * Hard gate (not just a description hint): generateRevision/generateStory
 * refuse to run unless getVocabulary was called for that exact languageId
 * since the last time either of them ran. This is in-memory, per API
 * process — it doesn't need to persist across restarts, it just needs to
 * force a fresh look at the full vocabulary immediately before every
 * generation call.
 */
const vocabularyChecked = new Set<string>();

export function markVocabularyChecked(languageId: string): void {
  vocabularyChecked.add(languageId);
}

/** Throws a tool error (not a silent no-op) if the gate isn't satisfied. */
export function requireVocabularyChecked(languageId: string): void {
  if (!vocabularyChecked.has(languageId)) {
    throw new ValidationError(
      `You must call getVocabulary with languageId "${languageId}" first, so you have the learner's full ` +
        `vocabulary in view, then call this tool again.`,
    );
  }
}

/** Consumes the check so the next generation call requires a fresh getVocabulary call. */
export function consumeVocabularyChecked(languageId: string): void {
  vocabularyChecked.delete(languageId);
}
