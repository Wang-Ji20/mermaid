import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MAX_PERCENT,
  MAX_SWING,
  MIN_PERCENT,
  MOODS,
  type Market,
  moodOf,
  nextDay,
  openMarket,
  priceOf,
  pricesOf,
} from "../../src/core/market.ts";
import { GRADES, PEARL_PRICE } from "../../src/core/pearls.ts";

const seed = fc.integer({ min: 0, max: 2 ** 32 - 1 });
const days = fc.integer({ min: 0, max: 40 });

const after = (market: Market, count: number): Market =>
  Array.from({ length: count }).reduce<Market>(nextDay, market);

describe("the pearl market", () => {
  it("opens at the standing prices", () => {
    expect(pricesOf(openMarket(1))).toEqual(PEARL_PRICE);
  });

  it("gives the same prices for the same seed", () => {
    fc.assert(
      fc.property(seed, days, (start, count) => {
        expect(after(openMarket(start), count)).toEqual(after(openMarket(start), count));
      }),
    );
  });

  it("moves the prices from day to day", () => {
    const week = Array.from({ length: 7 }, (_, day) => pricesOf(after(openMarket(1), day)));
    expect(new Set(week.map((prices) => JSON.stringify(prices))).size).toBeGreaterThan(3);
  });

  it("moves each grade on its own", () => {
    const { percent } = after(openMarket(1), 5);
    expect(new Set(GRADES.map((grade) => percent[grade])).size).toBeGreaterThan(1);
  });

  it("keeps every price within its bounds", () => {
    fc.assert(
      fc.property(seed, days, (start, count) => {
        const { percent } = after(openMarket(start), count);
        return GRADES.every((grade) => percent[grade] >= MIN_PERCENT && percent[grade] <= MAX_PERCENT);
      }),
    );
  });

  it("never moves a price far in one day", () => {
    // The pull toward the standing price is at most a quarter of the widest gap.
    const widestPull = Math.ceil((MAX_PERCENT - 100) / 4);
    fc.assert(
      fc.property(seed, days, (start, count) => {
        const today = after(openMarket(start), count);
        const tomorrow = nextDay(today);
        return GRADES.every(
          (grade) =>
            Math.abs(tomorrow.percent[grade] - today.percent[grade]) <= MAX_SWING + widestPull,
        );
      }),
    );
  });

  it("never prices a finer grade below a plainer one", () => {
    fc.assert(
      fc.property(seed, days, (start, count) => {
        const market = after(openMarket(start), count);
        return (
          priceOf(market, "seed") <= priceOf(market, "round") &&
          priceOf(market, "round") <= priceOf(market, "black")
        );
      }),
    );
  });

  it.each([
    ["fair", "every price is the usual one", { seed: 100, round: 100, black: 100 }],
    ["fair", "high and low prices balance", { seed: 150, round: 60, black: 90 }],
    ["generous", "prices are seven points up on average", { seed: 107, round: 107, black: 107 }],
    ["fair", "prices are just under seven points up", { seed: 107, round: 107, black: 106 }],
    ["tight", "prices are seven points down on average", { seed: 93, round: 93, black: 93 }],
    ["fair", "prices are just under seven points down", { seed: 93, round: 93, black: 94 }],
  ] as const)("finds the merchant %s when %s", (mood, _case, percent) => {
    expect(moodOf({ seed: 1, percent })).toBe(mood);
  });

  it("gives the merchant every mood sooner or later", () => {
    const seen = new Set(Array.from({ length: 60 }, (_, day) => moodOf(after(openMarket(1), day))));
    expect([...seen].sort()).toEqual([...MOODS].sort());
  });

  it("accepts any number as a seed", () => {
    for (const odd of [Number.NaN, -1, 1.5, Number.POSITIVE_INFINITY]) {
      expect(Number.isInteger(nextDay(openMarket(odd)).seed)).toBe(true);
    }
  });
});
