import { randomUUID } from "node:crypto";
import { type GameState, newGame } from "../core/game.ts";

/** Games kept in memory. When full, the oldest game makes room. */
export const MAX_GAMES = 1000;

export type GameStore = {
  readonly create: () => string;
  readonly get: (id: string) => GameState | undefined;
  readonly set: (id: string, state: GameState) => void;
  /**
   * Marks a game as waiting for the judge. Returns false if it already
   * is, so one game cannot have two stories judged at once.
   */
  readonly lock: (id: string) => boolean;
  readonly unlock: (id: string) => void;
};

export const createGameStore = (maxGames: number = MAX_GAMES): GameStore => {
  // A Map lists its keys in insertion order, so the first key is the oldest.
  const games = new Map<string, GameState>();
  const locked = new Set<string>();

  const dropOldest = (): void => {
    const oldest = games.keys().next().value;
    if (oldest === undefined) return;
    games.delete(oldest);
    locked.delete(oldest);
  };

  return {
    create: () => {
      if (games.size >= maxGames) dropOldest();
      const id = randomUUID();
      games.set(id, newGame());
      return id;
    },
    get: (id) => games.get(id),
    set: (id, state) => {
      if (games.has(id)) games.set(id, state);
    },
    lock: (id) => {
      if (locked.has(id)) return false;
      locked.add(id);
      return true;
    },
    unlock: (id) => {
      locked.delete(id);
    },
  };
};
