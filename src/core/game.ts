import { type Memory, echoedThemes, numbnessFor, remember } from "./numbness.ts";
import { type Market, nextDay, openMarket, priceOf, pricesOf } from "./market.ts";
import { type Grade, type Pearls, gradeFor, pearlCountFor } from "./pearls.ts";
import { EMPTY_PURSE, type Purse, addPearls, purseValue, withoutGrade } from "./purse.ts";
import type { Theme } from "./themes.ts";
import type { Verdict } from "./verdict.ts";

/** Coins the sea witch asks for the mermaid's voice. */
export const GOAL = 500;

/** Stories the player may tell before the witch's offer ends. */
export const STORY_LIMIT = 12;

export type GameState = {
  readonly coins: number;
  readonly goal: number;
  readonly storiesLeft: number;
  readonly memory: Memory;
  /** Pearls cried but not yet sold. */
  readonly purse: Purse;
  /** The merchant's prices today. They change after every story. */
  readonly market: Market;
};

export type GameStatus = "playing" | "won" | "lost";

/** What one story did, in the terms the player sees. */
export type TurnOutcome = {
  /** Sadness after numbness is taken off. */
  readonly feltSadness: number;
  /** Sadness points lost to familiar themes. */
  readonly numbness: number;
  /** The themes she has heard recently. */
  readonly echoed: readonly Theme[];
  readonly pearls: Pearls;
  /**
   * Coins from selling the whole purse after the last story, when the
   * witch's offer ends. 0 after any other story.
   */
  readonly closingSale: number;
};

export type Turn = {
  readonly state: GameState;
  readonly outcome: TurnOutcome;
};

/** One grade of pearls sold to the merchant. */
export type Sale = {
  readonly grade: Grade;
  readonly count: number;
  /** Coins paid for each pearl. */
  readonly price: number;
  readonly coins: number;
};

export type Sold = {
  readonly state: GameState;
  readonly sale: Sale;
};

/** A fresh game. The seed decides how the market's prices will move. */
export const newGame = (seed = 0): GameState => ({
  coins: 0,
  goal: GOAL,
  storiesLeft: STORY_LIMIT,
  memory: [],
  purse: EMPTY_PURSE,
  market: openMarket(seed),
});

export const statusOf = (state: GameState): GameStatus => {
  if (state.coins >= state.goal) return "won";
  return state.storiesLeft > 0 ? "playing" : "lost";
};

type Tears = Omit<TurnOutcome, "closingSale">;

const tearsFor = (memory: Memory, verdict: Verdict): Tears => {
  const numbness = numbnessFor(memory, verdict.themes);
  const feltSadness = Math.max(0, verdict.sadness - numbness);
  return {
    feltSadness,
    numbness,
    echoed: echoedThemes(memory, verdict.themes),
    pearls: { grade: gradeFor(verdict.originality), count: pearlCountFor(feltSadness) },
  };
};

const assertPlaying = (state: GameState): void => {
  if (statusOf(state) !== "playing") throw new Error("The game is over.");
};

/** After the last story nothing can be sold later, so everything is sold now. */
const closeOut = (state: GameState): { readonly state: GameState; readonly closingSale: number } => {
  if (state.storiesLeft > 0) return { state, closingSale: 0 };
  const closingSale = purseValue(state.purse, pricesOf(state.market));
  return {
    closingSale,
    state: { ...state, coins: state.coins + closingSale, purse: EMPTY_PURSE },
  };
};

/**
 * Applies one judged story to the game: the pearls go into the purse and
 * the market moves on to a new day.
 *
 * Throws when the game is already over: callers must check `statusOf`
 * first, and a silent no-op would hide that bug.
 */
export const playTurn = (state: GameState, verdict: Verdict): Turn => {
  assertPlaying(state);
  const tears = tearsFor(state.memory, verdict);
  const { state: next, closingSale } = closeOut({
    ...state,
    storiesLeft: state.storiesLeft - 1,
    memory: remember(state.memory, verdict.themes),
    purse: addPearls(state.purse, tears.pearls),
    market: nextDay(state.market),
  });
  return { state: next, outcome: { ...tears, closingSale } };
};

/**
 * Sells every pearl of one grade at today's price. Selling none is
 * allowed and pays nothing. Throws when the game is over, like `playTurn`.
 */
export const sellPearls = (state: GameState, grade: Grade): Sold => {
  assertPlaying(state);
  const count = state.purse[grade];
  const price = priceOf(state.market, grade);
  const coins = count * price;
  return {
    sale: { grade, count, price, coins },
    state: { ...state, coins: state.coins + coins, purse: withoutGrade(state.purse, grade) },
  };
};
