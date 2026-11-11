import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  GOAL,
  type GameState,
  STORY_LIMIT,
  newGame,
  playTurn,
  statusOf,
} from "../../src/core/game.ts";
import { MEMORY_SPAN } from "../../src/core/numbness.ts";
import type { Verdict } from "../../src/core/verdict.ts";
import { score, themes, verdict } from "./arbitraries.ts";

const story = (overrides: Partial<Verdict> = {}): Verdict => ({
  sadness: 7,
  originality: 5,
  themes: ["loss"],
  reply: "Oh...",
  ...overrides,
});

/** Plays verdicts in order and stops when the game ends. */
const playAll = (verdicts: readonly Verdict[]): GameState =>
  verdicts.reduce(
    (state, next) => (statusOf(state) === "playing" ? playTurn(state, next).state : state),
    newGame(),
  );

describe("playTurn", () => {
  it("turns a sad story into pearls and coins", () => {
    const { state, outcome } = playTurn(newGame(), story());
    expect(outcome.pearls).toEqual({ grade: "round", count: 5 });
    expect(outcome.coinsEarned).toBe(75);
    expect(state.coins).toBe(75);
    expect(state.storiesLeft).toBe(STORY_LIMIT - 1);
  });

  it("earns nothing for a story that does not move her", () => {
    const { outcome } = playTurn(newGame(), story({ sadness: 2 }));
    expect(outcome.pearls.count).toBe(0);
    expect(outcome.coinsEarned).toBe(0);
  });

  it("makes her numb to a theme she just heard", () => {
    const first = playTurn(newGame(), story());
    const second = playTurn(first.state, story({ themes: ["loss", "war"] }));
    expect(second.outcome.numbness).toBe(2);
    expect(second.outcome.echoed).toEqual(["loss"]);
    expect(second.outcome.feltSadness).toBe(5);
  });

  it("refuses to play a finished game", () => {
    const finished = { ...newGame(), coins: GOAL };
    expect(() => playTurn(finished, story())).toThrow("over");
  });

  it("never loses coins and always uses up one story", () => {
    fc.assert(
      fc.property(fc.array(verdict, { maxLength: 6 }), verdict, (earlier, next) => {
        const before = playAll(earlier);
        fc.pre(statusOf(before) === "playing");
        const { state, outcome } = playTurn(before, next);
        return (
          outcome.coinsEarned >= 0 &&
          state.coins === before.coins + outcome.coinsEarned &&
          state.storiesLeft === before.storiesLeft - 1
        );
      }),
    );
  });

  it("never gives fewer pearls for a sadder story", () => {
    fc.assert(
      fc.property(
        fc.array(verdict, { maxLength: 4 }),
        score,
        score,
        score,
        themes,
        (earlier, a, b, originality, storyThemes) => {
          const before = playAll(earlier);
          fc.pre(statusOf(before) === "playing");
          const pearlsFor = (sadness: number): number =>
            playTurn(before, story({ sadness, originality, themes: storyThemes })).outcome.pearls
              .count;
          return pearlsFor(Math.min(a, b)) <= pearlsFor(Math.max(a, b));
        },
      ),
    );
  });

  it("never pays less for a more original story", () => {
    fc.assert(
      fc.property(score, score, score, (sadness, a, b) => {
        const coinsFor = (originality: number): number =>
          playTurn(newGame(), story({ sadness, originality })).outcome.coinsEarned;
        return coinsFor(Math.min(a, b)) <= coinsFor(Math.max(a, b));
      }),
    );
  });

  it("remembers only the most recent stories", () => {
    fc.assert(
      fc.property(fc.array(verdict, { maxLength: STORY_LIMIT }), (verdicts) => {
        return playAll(verdicts).memory.length <= MEMORY_SPAN;
      }),
    );
  });
});

describe("statusOf", () => {
  it("starts in play", () => {
    expect(statusOf(newGame())).toBe("playing");
  });

  it("is won once the goal is reached", () => {
    expect(statusOf({ ...newGame(), coins: GOAL })).toBe("won");
  });

  it("is lost when the stories run out first", () => {
    expect(statusOf({ ...newGame(), storiesLeft: 0 })).toBe("lost");
  });

  it("counts a goal reached with the last story as won", () => {
    expect(statusOf({ ...newGame(), coins: GOAL, storiesLeft: 0 })).toBe("won");
  });

  it("always ends within the story limit", () => {
    fc.assert(
      fc.property(
        fc.array(verdict, { minLength: STORY_LIMIT, maxLength: STORY_LIMIT }),
        (verdicts) => statusOf(playAll(verdicts)) !== "playing",
      ),
    );
  });
});
