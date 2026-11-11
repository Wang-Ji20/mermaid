import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MAX_SCORE, MIN_SCORE, clampScore } from "../../src/core/score.ts";

describe("clampScore", () => {
  it("keeps valid scores unchanged", () => {
    expect(clampScore(0)).toBe(0);
    expect(clampScore(7)).toBe(7);
    expect(clampScore(10)).toBe(10);
  });

  it("treats unusable input as the lowest score", () => {
    expect(clampScore(Number.NaN)).toBe(MIN_SCORE);
    expect(clampScore(Number.NEGATIVE_INFINITY)).toBe(MIN_SCORE);
  });

  it("caps inflated scores", () => {
    expect(clampScore(1000)).toBe(MAX_SCORE);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(MAX_SCORE);
  });

  it("always returns a whole number in range", () => {
    fc.assert(
      fc.property(fc.double(), (raw) => {
        const score = clampScore(raw);
        return Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE;
      }),
    );
  });

  it("never ranks a higher raw score below a lower one", () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), (a, b) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return clampScore(low) <= clampScore(high);
      }),
    );
  });
});
