import { GRADES, type Grade, PEARL_PRICE } from "./pearls.ts";
import { drawInt, nextSeed, toSeed } from "./random.ts";

/** Prices are kept as a percentage of the standing price. */
export const STANDING_PERCENT = 100;
export const MIN_PERCENT = 60;
export const MAX_PERCENT = 150;

/** The most a price moves by chance in one day, in percentage points. */
export const MAX_SWING = 20;

/** Each day a price closes this share of its gap to the standing price. */
const PULL_BACK = 1 / 4;

export type Prices = Readonly<Record<Grade, number>>;

/** The pearl merchant's stall on one day. */
export type Market = {
  /** Decides tomorrow's prices. The player never sees it. */
  readonly seed: number;
  /** Today's price of each grade, as a percentage of its standing price. */
  readonly percent: Prices;
};

/** Day one: every grade sells at its standing price. */
export const openMarket = (seed: number): Market => ({
  seed: toSeed(seed),
  percent: { seed: STANDING_PERCENT, round: STANDING_PERCENT, black: STANDING_PERCENT },
});

const clampPercent = (percent: number): number =>
  Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent));

/** Drifts back toward the standing price, then swings by chance. */
const nextPercent = (percent: number, seed: number): number => {
  const pull = Math.round((STANDING_PERCENT - percent) * PULL_BACK);
  return clampPercent(percent + pull + drawInt(seed, -MAX_SWING, MAX_SWING));
};

/** Tomorrow's market. Each grade moves on its own. */
export const nextDay = (market: Market): Market =>
  GRADES.reduce<Market>(
    ({ seed, percent }, grade) => ({
      seed: nextSeed(seed),
      percent: { ...percent, [grade]: nextPercent(market.percent[grade], seed) },
    }),
    { seed: market.seed, percent: market.percent },
  );

/** Coins the merchant pays today for one pearl of this grade. */
export const priceOf = (market: Market, grade: Grade): number =>
  Math.round((PEARL_PRICE[grade] * market.percent[grade]) / STANDING_PERCENT);

/** Today's price of every grade, in coins. */
export const pricesOf = (market: Market): Prices => ({
  seed: priceOf(market, "seed"),
  round: priceOf(market, "round"),
  black: priceOf(market, "black"),
});

/** How freely the merchant pays today, all grades taken together. */
export const MOODS = ["generous", "fair", "tight"] as const;

export type Mood = (typeof MOODS)[number];

/** The average price must be this many points from standing to change his mood. */
export const MOOD_MARGIN = 7;

const averagePercent = ({ percent }: Market): number =>
  GRADES.reduce((sum, grade) => sum + percent[grade], 0) / GRADES.length;

/** The merchant's mood, from the average of today's prices. */
export const moodOf = (market: Market): Mood => {
  const average = averagePercent(market);
  if (average >= STANDING_PERCENT + MOOD_MARGIN) return "generous";
  return average <= STANDING_PERCENT - MOOD_MARGIN ? "tight" : "fair";
};
