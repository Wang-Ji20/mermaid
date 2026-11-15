import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ENDINGS, SWIFT_STORIES_LEFT, endingOf } from "../../src/core/ending.ts";
import { GOAL, type GameState, newGame, statusOf, takeBargain } from "../../src/core/game.ts";
import { move, playAll, seed } from "./arbitraries.ts";

const game = (changes: Partial<GameState>): GameState => ({ ...newGame(), ...changes });

describe("endingOf", () => {
  it("has no ending while the game is in play", () => {
    expect(endingOf(newGame())).toBeUndefined();
  });

  it.each([
    ["swift", "won with many stories untold", { coins: GOAL, storiesLeft: SWIFT_STORIES_LEFT }],
    ["won", "won with few stories untold", { coins: GOAL, storiesLeft: SWIFT_STORIES_LEFT - 1 }],
    ["won", "won on the last story", { coins: GOAL + 40, storiesLeft: 0 }],
    ["near", "lost with four fifths of the goal", { coins: (GOAL * 4) / 5, storiesLeft: 0 }],
    ["lost", "lost just short of four fifths", { coins: (GOAL * 4) / 5 - 1, storiesLeft: 0 }],
    ["lost", "lost with nothing", { coins: 0, storiesLeft: 0 }],
  ] as const)("is %s when %s", (ending, _case, changes) => {
    expect(endingOf(game(changes))).toBe(ending);
  });

  it("is the bargain ending for any win after the witch's bargain, however fast", () => {
    const bargained = takeBargain(newGame());
    expect(endingOf({ ...bargained, coins: bargained.goal })).toBe("bargain");
    expect(endingOf({ ...bargained, coins: bargained.goal, storiesLeft: 0 })).toBe("bargain");
  });

  it("measures a near loss against the raised goal", () => {
    const bargained = { ...takeBargain(newGame()), storiesLeft: 0 };
    expect(endingOf({ ...bargained, coins: (GOAL * 4) / 5 })).toBe("lost");
    expect(endingOf({ ...bargained, coins: (bargained.goal * 4) / 5 })).toBe("near");
  });

  it("gives every finished game an ending that fits its status, and no other game one", () => {
    fc.assert(
      fc.property(seed, fc.array(move, { maxLength: 30 }), (start, moves) => {
        const state = playAll(moves, newGame(start));
        const ending = endingOf(state);
        const status = statusOf(state);
        if (status === "playing") return ending === undefined;
        const happy = ending === "swift" || ending === "won" || ending === "bargain";
        return ending !== undefined && ENDINGS.includes(ending) && happy === (status === "won");
      }),
    );
  });
});
