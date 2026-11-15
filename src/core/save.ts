import { BARGAIN_PRICE, BARGAIN_STORIES, GOAL, type GameState, STORY_LIMIT } from "./game.ts";
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

/** Saves from before the bargain existed have no such field: it was not taken. */
const parseBargained = (raw: unknown): boolean | undefined =>
  raw === undefined ? false : typeof raw === "boolean" ? raw : undefined;

/** The goal and the most stories a game can have left, with or without the bargain. */
const limitsFor = (bargained: boolean): { readonly goal: number; readonly stories: number } =>
  bargained
    ? { goal: GOAL + BARGAIN_PRICE, stories: STORY_LIMIT + BARGAIN_STORIES }
    : { goal: GOAL, stories: STORY_LIMIT };

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
  const bargained = parseBargained(raw["bargained"]);
  if (memory === undefined || purse === undefined || market === undefined) return undefined;
  if (bargained === undefined || !isCount(coins)) return undefined;
  const limits = limitsFor(bargained);
  if (goal !== limits.goal || !isWholeBetween(storiesLeft, 0, limits.stories)) return undefined;
  return { coins, goal, storiesLeft, memory, purse, market, bargained };
};
