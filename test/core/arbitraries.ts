import fc from "fast-check";
import { MAX_SCORE, MIN_SCORE } from "../../src/core/score.ts";
import { THEMES } from "../../src/core/themes.ts";
import { MAX_THEMES, type Verdict } from "../../src/core/verdict.ts";

/** Random generators shared by the property tests. */

export const score = fc.integer({ min: MIN_SCORE, max: MAX_SCORE });

export const themes = fc.uniqueArray(fc.constantFrom(...THEMES), {
  minLength: 1,
  maxLength: MAX_THEMES,
});

export const verdict: fc.Arbitrary<Verdict> = fc.record({
  sadness: score,
  originality: score,
  themes,
  reply: fc.string({ minLength: 1, maxLength: 40 }),
});
