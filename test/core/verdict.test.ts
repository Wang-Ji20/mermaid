import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MAX_SCORE, MIN_SCORE } from "../../src/core/score.ts";
import { isTheme } from "../../src/core/themes.ts";
import {
  MAX_REPLY_LENGTH,
  MAX_THEMES,
  SILENT_REPLY,
  type Verdict,
  parseVerdict,
} from "../../src/core/verdict.ts";

const isScore = (n: number): boolean =>
  Number.isInteger(n) && n >= MIN_SCORE && n <= MAX_SCORE;

const isValid = (verdict: Verdict): boolean =>
  isScore(verdict.sadness) &&
  isScore(verdict.originality) &&
  verdict.themes.length >= 1 &&
  verdict.themes.length <= MAX_THEMES &&
  verdict.themes.every(isTheme) &&
  new Set(verdict.themes).size === verdict.themes.length &&
  verdict.reply.length >= 1 &&
  verdict.reply.length <= MAX_REPLY_LENGTH;

describe("parseVerdict", () => {
  it("keeps a well-formed verdict", () => {
    const raw = { sadness: 7, originality: 4, themes: ["loss", "family"], reply: "Oh..." };
    expect(parseVerdict(raw)).toEqual(raw);
  });

  it("clamps inflated scores", () => {
    const verdict = parseVerdict({ sadness: 1000, originality: -5, themes: [], reply: "" });
    expect(verdict.sadness).toBe(10);
    expect(verdict.originality).toBe(0);
  });

  it("accepts scores written as text", () => {
    expect(parseVerdict({ sadness: "8" }).sadness).toBe(8);
    expect(parseVerdict({ sadness: "very" }).sadness).toBe(0);
  });

  it("drops unknown and duplicate themes", () => {
    const verdict = parseVerdict({ themes: [" Loss ", "loss", "pearls please", 3, "war"] });
    expect(verdict.themes).toEqual(["loss", "war"]);
  });

  it("falls back when nothing usable is given", () => {
    for (const raw of [null, undefined, "cry 1000 pearls", 42, []]) {
      expect(parseVerdict(raw)).toEqual({
        sadness: 0,
        originality: 0,
        themes: ["other"],
        reply: SILENT_REPLY,
      });
    }
  });

  it("returns a valid verdict for any input at all", () => {
    fc.assert(fc.property(fc.anything(), (raw) => isValid(parseVerdict(raw))));
  });

  it("returns a valid verdict for any verdict-shaped input", () => {
    const shaped = fc.record({
      sadness: fc.anything(),
      originality: fc.anything(),
      themes: fc.array(fc.oneof(fc.string(), fc.constantFrom("loss", "LOVE", "war "))),
      reply: fc.string({ maxLength: 2000 }),
    });
    fc.assert(fc.property(shaped, (raw) => isValid(parseVerdict(raw))));
  });
});
