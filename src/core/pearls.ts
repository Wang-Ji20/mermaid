export const GRADES = ["seed", "round", "black"] as const;

/** Pearl quality, from tiny seed pearls to rare black pearls. */
export type Grade = (typeof GRADES)[number];

/** Coins the merchant pays for one pearl of each grade. */
export const PEARL_PRICE: Readonly<Record<Grade, number>> = {
  seed: 5,
  round: 15,
  black: 40,
};

/** The tears of one story: some number of pearls of one grade. */
export type Pearls = {
  readonly grade: Grade;
  readonly count: number;
};

/** Below this felt sadness she does not cry at all. */
export const FIRST_TEAR_AT = 3;

const ROUND_FROM_ORIGINALITY = 4;
const BLACK_FROM_ORIGINALITY = 8;

/** Fresh stories make finer pearls. */
export const gradeFor = (originality: number): Grade => {
  if (originality >= BLACK_FROM_ORIGINALITY) return "black";
  if (originality >= ROUND_FROM_ORIGINALITY) return "round";
  return "seed";
};

/** One pearl at the first-tear threshold, one more for each point above. */
export const pearlCountFor = (feltSadness: number): number =>
  Math.max(0, feltSadness - FIRST_TEAR_AT + 1);

export const pearlValue = (pearls: Pearls): number =>
  pearls.count * PEARL_PRICE[pearls.grade];
