import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newGame } from "../../src/core/game.ts";
import { SAVE_VERSION, createFileSaves, parseSaves } from "../../src/web/saves.ts";

const GAMES = [
  { id: "first-game", state: newGame(1) },
  { id: "second-game", state: { ...newGame(2), coins: 75 } },
];

describe("parseSaves", () => {
  it("reads the games in order", () => {
    expect(parseSaves({ version: SAVE_VERSION, games: GAMES })).toEqual(GAMES);
  });

  it("leaves out a damaged game and keeps the rest", () => {
    const damaged = { id: "broken", state: { ...newGame(), coins: -5 } };
    expect(parseSaves({ version: SAVE_VERSION, games: [damaged, ...GAMES] })).toEqual(GAMES);
  });

  it.each([
    ["an id that could not be in an address", "../etc"],
    ["an id that is not text", 7],
  ])("leaves out a game with %s", (_case, id) => {
    expect(parseSaves({ version: SAVE_VERSION, games: [{ id, state: newGame() }] })).toEqual([]);
  });

  it.each([
    ["nothing", undefined],
    ["a file of another version", { version: SAVE_VERSION + 1, games: GAMES }],
    ["games that are not a list", { version: SAVE_VERSION, games: "many" }],
  ])("finds no games in %s", (_case, raw) => {
    expect(parseSaves(raw)).toEqual([]);
  });
});

describe("createFileSaves", () => {
  let folder = "";
  let logged: unknown[] = [];
  const log = (error: unknown): void => void logged.push(error);

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), "mermaid-saves-"));
    logged = [];
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it("loads what it saved", () => {
    const file = join(folder, "games.json");
    createFileSaves(file, log).save(GAMES);
    expect(createFileSaves(file, log).load()).toEqual(GAMES);
    expect(logged).toEqual([]);
  });

  it("creates the folder and leaves no draft behind", () => {
    const file = join(folder, "deep", "games.json");
    createFileSaves(file, log).save(GAMES);
    expect(readdirSync(join(folder, "deep"))).toEqual(["games.json"]);
  });

  it("starts empty and quiet when there is no file yet", () => {
    expect(createFileSaves(join(folder, "games.json"), log).load()).toEqual([]);
    expect(logged).toEqual([]);
  });

  it("starts empty and reports a file that is not JSON", () => {
    const file = join(folder, "games.json");
    writeFileSync(file, '{"version": 1, "games": [');
    expect(createFileSaves(file, log).load()).toEqual([]);
    expect(logged).toHaveLength(1);
  });

  it("reports a failed save and carries on", () => {
    // A file where the folder should be, so the folder cannot be made.
    writeFileSync(join(folder, "blocked"), "");
    const saves = createFileSaves(join(folder, "blocked", "games.json"), log);
    expect(() => saves.save(GAMES)).not.toThrow();
    expect(logged).toHaveLength(1);
  });
});
