/**
 * A tiny seeded random number generator (the "mulberry32" recipe).
 *
 * The core is pure, so it cannot call `Math.random`. Instead the game
 * state carries a seed: the same seed always gives the same numbers.
 */

const SEED_STEP = 0x6d2b79f5;

/** The largest seed. */
export const MAX_SEED = 2 ** 32 - 1;

/** Any number as a valid seed: a whole number from 0 to `MAX_SEED`. */
export const toSeed = (raw: number): number => (Number.isFinite(raw) ? raw >>> 0 : 0);

/** The seed to use for the draw after this one. */
export const nextSeed = (seed: number): number => (seed + SEED_STEP) >>> 0;

/** Scrambles a seed into a whole number from 0 to 2^32 - 1. */
const scramble = (seed: number): number => {
  let mixed = Math.imul(seed ^ (seed >>> 15), seed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return (mixed ^ (mixed >>> 14)) >>> 0;
};

/** A whole number from `min` to `max`, both included, decided by the seed. */
export const drawInt = (seed: number, min: number, max: number): number =>
  min + (scramble(nextSeed(seed)) % (max - min + 1));
