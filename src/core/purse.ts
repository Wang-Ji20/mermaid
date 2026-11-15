import type { Prices } from "./market.ts";
import { GRADES, type Grade, type Pearls } from "./pearls.ts";

/** The pearls she is keeping, counted by grade. */
export type Purse = Readonly<Record<Grade, number>>;

export const EMPTY_PURSE: Purse = { seed: 0, round: 0, black: 0 };

export const addPearls = (purse: Purse, { grade, count }: Pearls): Purse => ({
  ...purse,
  [grade]: purse[grade] + count,
});

export const withoutGrade = (purse: Purse, grade: Grade): Purse => ({ ...purse, [grade]: 0 });

/** Coins the whole purse would fetch at these prices. */
export const purseValue = (purse: Purse, prices: Prices): number =>
  GRADES.reduce((coins, grade) => coins + purse[grade] * prices[grade], 0);
