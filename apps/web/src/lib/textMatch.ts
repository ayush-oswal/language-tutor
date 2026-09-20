/**
 * Mirrors packages/core/src/scoring/normalization.ts (answersMatch) — kept as a
 * small, dependency-free duplicate rather than importing @lt/core's runtime code,
 * since that package's barrel also pulls in Prisma-backed services that don't
 * belong in a browser bundle. Keep these two in sync if either changes.
 */
function normalizeAnswerText(raw: string): string {
  return raw
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(raw: string): string {
  return raw.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function answersMatch(submitted: string, accepted: string[]): boolean {
  const normalizedSubmitted = normalizeAnswerText(submitted);
  const strippedSubmitted = stripDiacritics(normalizedSubmitted);
  return accepted.some((candidate) => {
    const normalizedCandidate = normalizeAnswerText(candidate);
    return normalizedSubmitted === normalizedCandidate || strippedSubmitted === stripDiacritics(normalizedCandidate);
  });
}
