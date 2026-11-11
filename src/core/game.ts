import { type Memory, echoedThemes, numbnessFor, remember } from "./numbness.ts";
import { type Pearls, gradeFor, pearlCountFor, pearlValue } from "./pearls.ts";
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
  readonly coinsEarned: number;
};

export type Turn = {
  readonly state: GameState;
  readonly outcome: TurnOutcome;
};

export const newGame = (): GameState => ({
  coins: 0,
  goal: GOAL,
  storiesLeft: STORY_LIMIT,
  memory: [],
});

export const statusOf = (state: GameState): GameStatus => {
  if (state.coins >= state.goal) return "won";
  return state.storiesLeft > 0 ? "playing" : "lost";
};

const outcomeOf = (memory: Memory, verdict: Verdict): TurnOutcome => {
  const numbness = numbnessFor(memory, verdict.themes);
  const feltSadness = Math.max(0, verdict.sadness - numbness);
  const pearls = { grade: gradeFor(verdict.originality), count: pearlCountFor(feltSadness) };
  return {
    feltSadness,
    numbness,
    echoed: echoedThemes(memory, verdict.themes),
    pearls,
    coinsEarned: pearlValue(pearls),
  };
};

/**
 * Applies one judged story to the game.
 *
 * Throws when the game is already over: callers must check `statusOf`
 * first, and a silent no-op would hide that bug.
 */
export const playTurn = (state: GameState, verdict: Verdict): Turn => {
  if (statusOf(state) !== "playing") throw new Error("The game is over.");
  const outcome = outcomeOf(state.memory, verdict);
  return {
    outcome,
    state: {
      ...state,
      coins: state.coins + outcome.coinsEarned,
      storiesLeft: state.storiesLeft - 1,
      memory: remember(state.memory, verdict.themes),
    },
  };
};
