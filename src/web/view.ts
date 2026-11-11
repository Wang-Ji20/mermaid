import { type GameState, type GameStatus, type TurnOutcome, statusOf } from "../core/game.ts";
import type { Verdict } from "../core/verdict.ts";

/** What the page may know about a game. The memory stays on the server. */
export type GameView = {
  readonly coins: number;
  readonly goal: number;
  readonly storiesLeft: number;
  readonly status: GameStatus;
};

/** One told story: what the judge said and what it earned. */
export type TurnView = Verdict & TurnOutcome;

/** Answer to "start a game". */
export type NewGameResponse = {
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

export type ErrorResponse = {
  readonly error: string;
};

export const gameView = (state: GameState): GameView => ({
  coins: state.coins,
  goal: state.goal,
  storiesLeft: state.storiesLeft,
  status: statusOf(state),
});

export const turnView = (verdict: Verdict, outcome: TurnOutcome): TurnView => ({
  ...verdict,
  ...outcome,
});
