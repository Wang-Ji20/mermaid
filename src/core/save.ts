import { GOAL, type GameState, STORY_LIMIT } from "./game.ts";
import { MAX_PERCENT, MIN_PERCENT, type Market } from "./market.ts";
import { MEMORY_SPAN, type Memory } from "./numbness.ts";
import type { Grade } from "./pearls.ts";
import type { Purse } from "./purse.ts";
import { MAX_SEED } from "./random.ts";
import { isRecord } from "./record.ts";
import { type Theme, isTheme } from "./themes.ts";
import { MAX_THEMES } from "./verdict.ts";

/**
 * Reading a saved game back.
 *
 * A `GameState` is plain data, so saving one is just writing it out as
 * JSON. Loading is the careful part: a save file can be cut short, edited
 * by hand or left over from an older version.
 */

const isWholeBetween = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;

const isCount = (value: unknown): value is number =>
  isWholeBetween(value, 0, Number.MAX_SAFE_INTEGER);

type ByGrade = Readonly<Record<Grade, number>>;

/** One whole number per grade, each within the bounds. */
const parseByGrade = (raw: unknown, min: number, max: number): ByGrade | undefined => {
  if (!isRecord(raw)) return undefined;
  const { seed, round, black } = raw;
  const valid =
    isWholeBetween(seed, min, max) &&
    isWholeBetween(round, min, max) &&
    isWholeBetween(black, min, max);
  return valid ? { seed, round, black } : undefined;
};

const parseThemes = (raw: unknown): readonly Theme[] | undefined =>
  Array.isArray(raw) && raw.length <= MAX_THEMES && raw.every(isTheme) ? [...raw] : undefined;

const parseMemory = (raw: unknown): Memory | undefined => {
  if (!Array.isArray(raw) || raw.length > MEMORY_SPAN) return undefined;
  const stories = raw.map(parseThemes);
  return stories.every((themes) => themes !== undefined) ? stories : undefined;
};

const parseMarket = (raw: unknown): Market | undefined => {
  if (!isRecord(raw) || !isWholeBetween(raw["seed"], 0, MAX_SEED)) return undefined;
  const percent = parseByGrade(raw["percent"], MIN_PERCENT, MAX_PERCENT);
  return percent && { seed: raw["seed"], percent };
};

/**
 * Builds a game state from untrusted saved data.
 *
 * Never throws. Returns `undefined` unless every field is one a real game
 * could hold. A damaged save is refused whole and never repaired: a
 * guessed repair could hand out coins or change tomorrow's prices.
 */
export const parseGameState = (raw: unknown): GameState | undefined => {
  if (!isRecord(raw)) return undefined;
  const { coins, goal, storiesLeft } = raw;
  const memory = parseMemory(raw["memory"]);
  const purse: Purse | undefined = parseByGrade(raw["purse"], 0, Number.MAX_SAFE_INTEGER);
  const market = parseMarket(raw["market"]);
  if (!isCount(coins) || goal !== GOAL || !isWholeBetween(storiesLeft, 0, STORY_LIMIT)) {
    return undefined;
  }
  if (memory === undefined || purse === undefined || market === undefined) return undefined;
  return { coins, goal, storiesLeft, memory, purse, market };
};
