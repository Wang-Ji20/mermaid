import {
  BARGAIN_PRICE,
  BARGAIN_STORIES,
  type GameState,
  type GameStatus,
  type Sale,
  type TurnOutcome,
  canBargain,
  statusOf,
} from "../core/game.ts";
import { type Ending, endingOf } from "../core/ending.ts";
import { priceOf } from "../core/market.ts";
import { GRADES, type Grade, PEARL_PRICE } from "../core/pearls.ts";
import type { Verdict } from "../core/verdict.ts";

/** One grade at the merchant's stall: today's price and what she holds. */
export type StallRow = {
  readonly grade: Grade;
  /** Coins the merchant pays today for one pearl. */
  readonly price: number;
  /** The usual price, so the page can say whether today is a good day. */
  readonly standingPrice: number;
  /** Pearls of this grade in her purse. */
  readonly held: number;
};

/** What the sea witch offers: more stories, for a higher goal. */
export type BargainOffer = {
  readonly stories: number;
  readonly price: number;
};

/**
 * What the page may know about a game. Her memory and the market's seed
 * stay on the server: the page must not see tomorrow's prices.
 */
export type GameView = {
  readonly coins: number;
  readonly goal: number;
  readonly storiesLeft: number;
  readonly status: GameStatus;
  /** How the game ended; `null` while it is in play. */
  readonly ending: Ending | null;
  /** One row per grade, plainest first. */
  readonly stall: readonly StallRow[];
  /** The witch's offer; `null` once it is taken or the game is over. */
  readonly bargain: BargainOffer | null;
};

/** One told story: what the judge said and what it earned. */
export type TurnView = Verdict & TurnOutcome;

/** Answer to "start a game" and to "fetch a game". */
export type GameResponse = {
  readonly id: string;
  /** Name of the judge, so the page can say who is listening. */
  readonly judge: string;
  readonly maxStoryLength: number;
  readonly game: GameView;
};

/** Answer to "tell a story". */
export type StoryResponse = {
  readonly game: GameView;
  readonly turn: TurnView;
};

/** Answer to "take the bargain". */
export type BargainResponse = {
  readonly game: GameView;
};

/** Answer to "sell pearls". */
export type SaleResponse = {
  readonly game: GameView;
  readonly sale: Sale;
};

export type ErrorResponse = {
  readonly error: string;
};

const stallRow = (state: GameState, grade: Grade): StallRow => ({
  grade,
  price: priceOf(state.market, grade),
  standingPrice: PEARL_PRICE[grade],
  held: state.purse[grade],
});

export const gameView = (state: GameState): GameView => ({
  coins: state.coins,
  goal: state.goal,
  storiesLeft: state.storiesLeft,
  status: statusOf(state),
  ending: endingOf(state) ?? null,
  stall: GRADES.map((grade) => stallRow(state, grade)),
  bargain: canBargain(state) ? { stories: BARGAIN_STORIES, price: BARGAIN_PRICE } : null,
});

export const turnView = (verdict: Verdict, outcome: TurnOutcome): TurnView => ({
  ...verdict,
  ...outcome,
});
