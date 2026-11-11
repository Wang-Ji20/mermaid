import { FALLBACK_THEME, type Theme } from "./themes.ts";

/** How many past stories the mermaid still has in mind. */
export const MEMORY_SPAN = 3;

/** Sadness points lost for each remembered story that shares a theme. */
export const NUMBNESS_PER_ECHO = 2;

/** The themes of the most recent stories, oldest first. */
export type Memory = readonly (readonly Theme[])[];

const sharesTheme = (past: readonly Theme[], themes: readonly Theme[]): boolean =>
  themes.some((theme) => theme !== FALLBACK_THEME && past.includes(theme));

/** The themes of this story that she has heard recently. */
export const echoedThemes = (memory: Memory, themes: readonly Theme[]): readonly Theme[] =>
  themes.filter((theme) => memory.some((past) => sharesTheme(past, [theme])));

/**
 * How many sadness points a story loses because its themes are familiar.
 * The fallback theme never counts: "other" stories have nothing in common.
 */
export const numbnessFor = (memory: Memory, themes: readonly Theme[]): number =>
  NUMBNESS_PER_ECHO * memory.filter((past) => sharesTheme(past, themes)).length;

export const remember = (memory: Memory, themes: readonly Theme[]): Memory =>
  [...memory, themes].slice(-MEMORY_SPAN);
