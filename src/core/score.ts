/** Scores the judge gives a story run from 0 (unmoved) to 10 (heartbroken). */
export const MIN_SCORE = 0;
export const MAX_SCORE = 10;

/**
 * Turns any number into a valid whole score.
 *
 * The judge is an LLM, so its numbers are untrusted: they may be out of
 * range, fractional, or not numbers at all. Anything unusable counts as 0.
 */
export const clampScore = (raw: number): number => {
  if (Number.isNaN(raw)) return MIN_SCORE;
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(raw)));
};
