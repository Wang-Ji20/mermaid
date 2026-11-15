import { type GameState, statusOf } from "./game.ts";

/**
 * How a finished game ended. Winning and losing each come in shades, so
 * the last page of the tale fits how it was played.
 */
export const ENDINGS = ["swift", "won", "near", "lost"] as const;

export type Ending = (typeof ENDINGS)[number];

/** A win with at least this many stories untold is a swift one. */
export const SWIFT_STORIES_LEFT = 6;

/** A loss with at least this share of the goal in hand is a near one. */
const NEAR_SHARE = { coins: 4, of: 5 };

const isNear = ({ coins, goal }: GameState): boolean =>
  coins * NEAR_SHARE.of >= goal * NEAR_SHARE.coins;

/** The ending of a finished game, or `undefined` while it is in play. */
export const endingOf = (state: GameState): Ending | undefined => {
  const status = statusOf(state);
  if (status === "playing") return undefined;
  if (status === "won") return state.storiesLeft >= SWIFT_STORIES_LEFT ? "swift" : "won";
  return isNear(state) ? "near" : "lost";
};
