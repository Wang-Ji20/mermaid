import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  GOAL,
  type GameState,
  STORY_LIMIT,
  newGame,
  playTurn,
  sellPearls,
  statusOf,
} from "../../src/core/game.ts";
import { nextDay, pricesOf } from "../../src/core/market.ts";
import { GRADES } from "../../src/core/pearls.ts";
import { EMPTY_PURSE, purseValue } from "../../src/core/purse.ts";
import { MEMORY_SPAN } from "../../src/core/numbness.ts";
import type { Verdict } from "../../src/core/verdict.ts";
import { move, playAll, score, seed, themes, verdict } from "./arbitraries.ts";

const story = (overrides: Partial<Verdict> = {}): Verdict => ({
  sadness: 7,
  originality: 5,
  themes: ["loss"],
  reply: "Oh...",
  ...overrides,
});

/** Coins in hand plus what the purse would fetch today. */
const wealth = (state: GameState): number =>
  state.coins + purseValue(state.purse, pricesOf(state.market));

const pearlsHeld = (state: GameState): number =>
  GRADES.reduce((count, grade) => count + state.purse[grade], 0);

describe("playTurn", () => {
  it("turns a sad story into pearls in the purse", () => {
    const { state, outcome } = playTurn(newGame(), story());
    expect(outcome.pearls).toEqual({ grade: "round", count: 5 });
    expect(outcome.closingSale).toBe(0);
    expect(state.purse).toEqual({ seed: 0, round: 5, black: 0 });
    expect(state.coins).toBe(0);
    expect(state.storiesLeft).toBe(STORY_LIMIT - 1);
  });

  it("gives no pearls for a story that does not move her", () => {
    const { state, outcome } = playTurn(newGame(), story({ sadness: 2 }));
    expect(outcome.pearls.count).toBe(0);
    expect(state.purse).toEqual(EMPTY_PURSE);
  });

  it("moves the market on to a new day", () => {
    const before = newGame(1);
    expect(playTurn(before, story()).state.market).toEqual(nextDay(before.market));
  });

  it("sells the whole purse after the last story", () => {
    const lastDay = { ...newGame(1), storiesLeft: 1, purse: { seed: 2, round: 0, black: 1 } };
    const { state, outcome } = playTurn(lastDay, story());
    const prices = pricesOf(nextDay(lastDay.market));
    const expected = 2 * prices.seed + 5 * prices.round + prices.black;
    expect(outcome.closingSale).toBe(expected);
    expect(state.coins).toBe(expected);
    expect(state.purse).toEqual(EMPTY_PURSE);
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
      fc.property(seed, fc.array(move, { maxLength: 12 }), verdict, (start, earlier, next) => {
        const before = playAll(earlier, newGame(start));
        fc.pre(statusOf(before) === "playing");
        const { state, outcome } = playTurn(before, next);
        return (
          outcome.closingSale >= 0 &&
          state.coins === before.coins + outcome.closingSale &&
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

  it("never gives less valuable pearls for a more original story", () => {
    fc.assert(
      fc.property(seed, score, score, score, (start, sadness, a, b) => {
        const worthFor = (originality: number): number =>
          wealth(playTurn(newGame(start), story({ sadness, originality })).state);
        return worthFor(Math.min(a, b)) <= worthFor(Math.max(a, b));
      }),
    );
  });

  it("keeps every pearl until it is sold", () => {
    fc.assert(
      fc.property(seed, fc.array(move, { maxLength: 12 }), verdict, (start, earlier, next) => {
        const before = playAll(earlier, newGame(start));
        fc.pre(before.storiesLeft > 1 && statusOf(before) === "playing");
        const { state, outcome } = playTurn(before, next);
        return pearlsHeld(state) === pearlsHeld(before) + outcome.pearls.count;
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

describe("sellPearls", () => {
  const holding = { ...newGame(1), purse: { seed: 4, round: 5, black: 1 } };

  it("sells every pearl of one grade at today's price", () => {
    const { state, sale } = sellPearls(holding, "round");
    expect(sale).toEqual({ grade: "round", count: 5, price: 15, coins: 75 });
    expect(state.coins).toBe(75);
    expect(state.purse).toEqual({ seed: 4, round: 0, black: 1 });
  });

  it("pays nothing when she holds none of that grade", () => {
    const { state, sale } = sellPearls(newGame(), "black");
    expect(sale.coins).toBe(0);
    expect(state).toEqual(newGame());
  });

  it("does not use up a story or move the market", () => {
    const { state } = sellPearls(holding, "seed");
    expect(state.storiesLeft).toBe(holding.storiesLeft);
    expect(state.market).toEqual(holding.market);
  });

  it("can win the game", () => {
    const rich = { ...holding, coins: GOAL - 75 };
    expect(statusOf(sellPearls(rich, "round").state)).toBe("won");
  });

  it("refuses to sell in a finished game", () => {
    expect(() => sellPearls({ ...holding, coins: GOAL }, "round")).toThrow("over");
  });

  it("swaps pearls for exactly their worth", () => {
    fc.assert(
      fc.property(
        seed,
        fc.array(move, { maxLength: 12 }),
        fc.constantFrom(...GRADES),
        (start, earlier, grade) => {
          const before = playAll(earlier, newGame(start));
          fc.pre(statusOf(before) === "playing");
          const { state, sale } = sellPearls(before, grade);
          return (
            sale.coins >= 0 &&
            state.coins === before.coins + sale.coins &&
            wealth(state) === wealth(before) &&
            state.purse[grade] === 0
          );
        },
      ),
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
        seed,
        fc.array(verdict, { minLength: STORY_LIMIT, maxLength: STORY_LIMIT }),
        (start, verdicts) => statusOf(playAll(verdicts, newGame(start))) !== "playing",
      ),
    );
  });

  it("leaves nothing unsold when the stories run out", () => {
    fc.assert(
      fc.property(
        seed,
        fc.array(verdict, { minLength: STORY_LIMIT, maxLength: STORY_LIMIT }),
        (start, verdicts) => {
          const end = playAll(verdicts, newGame(start));
          fc.pre(end.storiesLeft === 0);
          return pearlsHeld(end) === 0;
        },
      ),
    );
  });
});
