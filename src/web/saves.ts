import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { GameState } from "../core/game.ts";
import { isRecord } from "../core/record.ts";
import { parseGameState } from "../core/save.ts";

/** A game with its id, as kept between runs of the server. */
export type SavedGame = {
  readonly id: string;
  readonly state: GameState;
};

/** Where the store keeps its games between runs. */
export type Saves = {
  /** The games saved earlier, oldest first. */
  readonly load: () => readonly SavedGame[];
  /** Replaces what was saved with these games. */
  readonly save: (games: readonly SavedGame[]) => void;
};

/** Saves nothing: games last only as long as the server runs. */
export const NO_SAVES: Saves = { load: () => [], save: () => {} };

/** Bumped when the file's shape changes, so an old file is not misread. */
export const SAVE_VERSION = 1;

const GAME_ID = /^[\w-]+$/;

const parseSavedGame = (raw: unknown): SavedGame | undefined => {
  if (!isRecord(raw)) return undefined;
  const { id } = raw;
  const state = parseGameState(raw["state"]);
  if (typeof id !== "string" || !GAME_ID.test(id) || state === undefined) return undefined;
  return { id, state };
};

/**
 * The games in a save file's content. Never throws. A file of another
 * version holds nothing; a damaged game is left out and the rest stay.
 */
export const parseSaves = (raw: unknown): readonly SavedGame[] => {
  if (!isRecord(raw) || raw["version"] !== SAVE_VERSION) return [];
  const games = raw["games"];
  if (!Array.isArray(games)) return [];
  return games.map(parseSavedGame).filter((game) => game !== undefined);
};

const isMissingFile = (error: unknown): boolean =>
  isRecord(error) && error["code"] === "ENOENT";

/**
 * Keeps the games in one JSON file.
 *
 * A failure to read or write is reported and then ignored: the game goes
 * on in memory. Losing a save is better than losing a story the judge has
 * already been paid for.
 */
export const createFileSaves = (file: string, logError: (error: unknown) => void): Saves => ({
  load: () => {
    try {
      return parseSaves(JSON.parse(readFileSync(file, "utf8")));
    } catch (error) {
      // No file yet is the normal first run, not a failure.
      if (!isMissingFile(error)) logError(error);
      return [];
    }
  },
  save: (games) => {
    try {
      mkdirSync(dirname(file), { recursive: true });
      // Write beside the file, then swap. A crash midway leaves the old file whole.
      const draft = `${file}.tmp`;
      writeFileSync(draft, JSON.stringify({ version: SAVE_VERSION, games }));
      renameSync(draft, file);
    } catch (error) {
      logError(error);
    }
  },
});
