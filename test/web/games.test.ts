import { describe, expect, it } from "vitest";
import { newGame } from "../../src/core/game.ts";
import { MAX_GAMES, createGameStore } from "../../src/web/games.ts";

describe("createGameStore", () => {
  it("creates a fresh game", () => {
    const store = createGameStore(MAX_GAMES, () => 7);
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
    const store = createGameStore(2);
    const [first, second, third] = [store.create(), store.create(), store.create()];
    expect(store.get(first)).toBeUndefined();
    expect(store.get(second)).toBeDefined();
    expect(store.get(third)).toBeDefined();
  });

  it("does not bring back a dropped game on save", () => {
    const store = createGameStore(1);
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
});
