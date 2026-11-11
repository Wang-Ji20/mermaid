/**
 * The fixed list of story themes. The judge must pick from this list, so
 * "loss" in one story and "loss" in the next are the same label and the
 * mermaid can notice the repetition.
 */
export const THEMES = [
  "loss",
  "love",
  "loneliness",
  "family",
  "illness",
  "betrayal",
  "regret",
  "farewell",
  "poverty",
  "war",
  "animal",
  "other",
] as const;

export type Theme = (typeof THEMES)[number];

/** The label for a story that fits no listed theme. */
export const FALLBACK_THEME: Theme = "other";

const KNOWN_THEMES: ReadonlySet<string> = new Set(THEMES);

export const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && KNOWN_THEMES.has(value);
