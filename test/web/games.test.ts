import { describe, expect, it } from "vitest";
import { newGame } from "../../src/core/game.ts";
import { createGameStore } from "../../src/web/games.ts";
import type { SavedGame, Saves } from "../../src/web/saves.ts";

/** Saves kept in a list, so a second store can load what the first saved. */
const memorySaves = (start: readonly SavedGame[] = []): Saves => {
  let kept = start;
  return {
    load: () => kept,
    save: (games) => {
      kept = games;
    },
  };
};

describe("createGameStore", () => {
  it("creates a fresh game", () => {
    const store = createGameStore({ seedFor: () => 7 });
    expect(store.get(store.create())).toEqual(newGame(7));
  });

  it("gives each game its own market seed", () => {
    const store = createGameStore();
    const seeds = Array.from({ length: 5 }, () => store.get(store.create())?.market.seed);
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });

  it("saves a new state", () => {
    const store = createGameStore();
    const id = store.create();
    const richer = { ...newGame(), coins: 75 };
    store.set(id, richer);
    expect(store.get(id)).toEqual(richer);
  });

  it("drops the oldest game when full", () => {
    const store = createGameStore({ maxGames: 2 });
    const [first, second, third] = [store.create(), store.create(), store.create()];
    expect(store.get(first)).toBeUndefined();
    expect(store.get(second)).toBeDefined();
    expect(store.get(third)).toBeDefined();
  });

  it("does not bring back a dropped game on save", () => {
    const store = createGameStore({ maxGames: 1 });
    const first = store.create();
    store.create();
    store.set(first, newGame());
    expect(store.get(first)).toBeUndefined();
  });

  it("locks a game once until it is unlocked", () => {
    const store = createGameStore();
    const id = store.create();
    expect(store.isLocked(id)).toBe(false);
    expect(store.lock(id)).toBe(true);
    expect(store.isLocked(id)).toBe(true);
    expect(store.lock(id)).toBe(false);
    store.unlock(id);
    expect(store.lock(id)).toBe(true);
  });

  it("finds its games again after a restart", () => {
    const saves = memorySaves();
    const before = createGameStore({ saves });
    const [first, second] = [before.create(), before.create()];
    const richer = { ...newGame(3), coins: 75 };
    before.set(second, richer);

    const after = createGameStore({ saves });
    expect(after.get(first)).toEqual(before.get(first));
    expect(after.get(second)).toEqual(richer);
  });

  it("forgets a dropped game for good", () => {
    const saves = memorySaves();
    const before = createGameStore({ maxGames: 1, saves });
    const first = before.create();
    before.create();
    expect(createGameStore({ saves }).get(first)).toBeUndefined();
  });

  it("loads only the newest games when more were saved than it may hold", () => {
    const saved = ["old", "middle", "new"].map((id) => ({ id, state: newGame() }));
    const store = createGameStore({ maxGames: 2, saves: memorySaves(saved) });
    expect(store.get("old")).toBeUndefined();
    expect(store.get("middle")).toBeDefined();
    expect(store.get("new")).toBeDefined();
  });

  it("still drops the oldest game first after a restart", () => {
    const saved = ["old", "new"].map((id) => ({ id, state: newGame() }));
    const store = createGameStore({ maxGames: 2, saves: memorySaves(saved) });
    store.create();
    expect(store.get("old")).toBeUndefined();
    expect(store.get("new")).toBeDefined();
  });
});
