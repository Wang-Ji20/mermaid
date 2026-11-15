import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type GameState, newGame } from "../../src/core/game.ts";
import { parseGameState } from "../../src/core/save.ts";
import { move, playAll, seed } from "./arbitraries.ts";

/** What a save file holds: the state written as JSON and read back. */
const throughJson = (state: GameState): unknown => JSON.parse(JSON.stringify(state));

const saved = (changes: Record<string, unknown>): unknown => ({ ...newGame(1), ...changes });

describe("parseGameState", () => {
  it("reads back any game exactly as it was saved", () => {
    fc.assert(
      fc.property(seed, fc.array(move, { maxLength: 16 }), (start, moves) => {
        const state = playAll(moves, newGame(start));
        expect(parseGameState(throughJson(state))).toEqual(state);
      }),
    );
  });

  it("never throws, whatever it is given", () => {
    fc.assert(fc.property(fc.anything(), (raw) => void parseGameState(raw)));
  });

  it("drops fields a game does not have", () => {
    expect(parseGameState(saved({ cheat: true }))).toEqual(newGame(1));
  });

  it.each([
    ["nothing", undefined],
    ["text", "a game"],
    ["an empty object", {}],
    ["negative coins", saved({ coins: -1 })],
    ["fractional coins", saved({ coins: 1.5 })],
    ["coins as text", saved({ coins: "75" })],
    ["another goal", saved({ goal: 1 })],
    ["more stories than a game has", saved({ storiesLeft: 13 })],
    ["a memory that is too long", saved({ memory: [["loss"], ["war"], ["love"], ["family"]] })],
    ["an unknown theme", saved({ memory: [["dragons"]] })],
    ["a memory that is not a list", saved({ memory: "loss" })],
    ["a purse missing a grade", saved({ purse: { seed: 0, round: 0 } })],
    ["a negative purse", saved({ purse: { seed: 0, round: -3, black: 0 } })],
    ["no market", saved({ market: undefined })],
    ["a seed that is out of range", saved({ market: { ...newGame(1).market, seed: 2 ** 32 } })],
    [
      "a price outside the market's bounds",
      saved({ market: { seed: 1, percent: { seed: 100, round: 100, black: 500 } } }),
    ],
  ])("refuses %s", (_case, raw) => {
    expect(parseGameState(raw)).toBeUndefined();
  });
});
