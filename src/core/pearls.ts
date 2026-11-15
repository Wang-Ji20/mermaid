export const GRADES = ["seed", "round", "black"] as const;

/** Pearl quality, from tiny seed pearls to rare black pearls. */
export type Grade = (typeof GRADES)[number];

const KNOWN_GRADES: ReadonlySet<string> = new Set(GRADES);

export const isGrade = (value: unknown): value is Grade =>
  typeof value === "string" && KNOWN_GRADES.has(value);

/**
 * The standing price of one pearl of each grade, in coins. The market
 * price of the day moves around it: see `market.ts`.
 */
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
