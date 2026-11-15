import fc from "fast-check";
import { type GameState, newGame, playTurn, sellPearls, statusOf } from "../../src/core/game.ts";
import { GRADES, type Grade } from "../../src/core/pearls.ts";
import { MAX_SEED } from "../../src/core/random.ts";
import { MAX_SCORE, MIN_SCORE } from "../../src/core/score.ts";
import { THEMES } from "../../src/core/themes.ts";
import { MAX_THEMES, type Verdict } from "../../src/core/verdict.ts";

/** Random generators shared by the property tests. */

export const score = fc.integer({ min: MIN_SCORE, max: MAX_SCORE });

export const themes = fc.uniqueArray(fc.constantFrom(...THEMES), {
  minLength: 1,
  maxLength: MAX_THEMES,
});

export const verdict: fc.Arbitrary<Verdict> = fc.record({
  sadness: score,
  originality: score,
  themes,
  reply: fc.string({ minLength: 1, maxLength: 40 }),
});

export const seed = fc.integer({ min: 0, max: MAX_SEED });

/** One thing a player can do: tell a (judged) story or sell a grade. */
export type Move = Verdict | Grade;
export const move: fc.Arbitrary<Move> = fc.oneof(verdict, fc.constantFrom(...GRADES));

const play = (state: GameState, next: Move): GameState => {
  if (statusOf(state) !== "playing") return state;
  return typeof next === "string" ? sellPearls(state, next).state : playTurn(state, next).state;
};

/** Plays moves in order and stops when the game ends. */
export const playAll = (moves: readonly Move[], start: GameState = newGame()): GameState =>
  moves.reduce(play, start);
