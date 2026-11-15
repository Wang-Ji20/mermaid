import { randomInt, randomUUID } from "node:crypto";
import { type GameState, newGame } from "../core/game.ts";
import { NO_SAVES, type Saves } from "./saves.ts";

/** Games kept at once. When full, the oldest game makes room. */
export const MAX_GAMES = 1000;

const SEED_COUNT = 2 ** 32;

/** A fresh market seed, so every game sees different prices. */
export const randomSeed = (): number => randomInt(SEED_COUNT);

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
  readonly isLocked: (id: string) => boolean;
};

export type GameStoreConfig = {
  readonly maxGames?: number;
  /** Picks each new game's market seed; tests pass a fixed one. */
  readonly seedFor?: () => number;
  /** Where games are kept between runs. Nowhere by default. */
  readonly saves?: Saves;
};

export const createGameStore = ({
  maxGames = MAX_GAMES,
  seedFor = randomSeed,
  saves = NO_SAVES,
}: GameStoreConfig = {}): GameStore => {
  // A Map lists its keys in insertion order, so the first key is the oldest.
  // Of the saved games, the newest are kept if there are too many.
  const games = new Map<string, GameState>(
    saves
      .load()
      .slice(-maxGames)
      .map(({ id, state }) => [id, state]),
  );
  const locked = new Set<string>();

  const saveAll = (): void => saves.save(Array.from(games, ([id, state]) => ({ id, state })));

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
      games.set(id, newGame(seedFor()));
      saveAll();
      return id;
    },
    get: (id) => games.get(id),
    set: (id, state) => {
      if (!games.has(id)) return;
      games.set(id, state);
      saveAll();
    },
    lock: (id) => {
      if (locked.has(id)) return false;
      locked.add(id);
      return true;
    },
    unlock: (id) => {
      locked.delete(id);
    },
    isLocked: (id) => locked.has(id),
  };
};
