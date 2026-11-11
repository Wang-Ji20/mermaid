import { clampScore } from "./score.ts";
import { FALLBACK_THEME, type Theme, isTheme } from "./themes.ts";

/** What the judge says about one story. */
export type Verdict = {
  /** How sad the story is, 0 to 10. */
  readonly sadness: number;
  /** How fresh and personal the story is, 0 to 10. */
  readonly originality: number;
  /** One to three themes from the fixed list. */
  readonly themes: readonly Theme[];
  /** What the mermaid says back. */
  readonly reply: string;
};

export const MAX_THEMES = 3;
export const MAX_REPLY_LENGTH = 600;
export const SILENT_REPLY = "The little mermaid looks at you in silence.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseScore = (raw: unknown): number => {
  if (typeof raw === "number") return clampScore(raw);
  if (typeof raw === "string" && raw.trim() !== "") return clampScore(Number(raw));
  return clampScore(Number.NaN);
};

const normaliseTheme = (raw: unknown): unknown =>
  typeof raw === "string" ? raw.trim().toLowerCase() : raw;

const parseThemes = (raw: unknown): readonly Theme[] => {
  const candidates = Array.isArray(raw) ? raw.map(normaliseTheme).filter(isTheme) : [];
  const themes = [...new Set(candidates)].slice(0, MAX_THEMES);
  return themes.length > 0 ? themes : [FALLBACK_THEME];
};

const parseReply = (raw: unknown): string => {
  const reply = typeof raw === "string" ? raw.trim().slice(0, MAX_REPLY_LENGTH) : "";
  return reply === "" ? SILENT_REPLY : reply;
};

/**
 * Builds a valid verdict from untrusted data.
 *
 * Never throws. Every field that is missing or malformed gets its lowest
 * or emptiest value, so bad input can only make a story earn less.
 */
export const parseVerdict = (raw: unknown): Verdict => {
  const fields = isRecord(raw) ? raw : {};
  return {
    sadness: parseScore(fields["sadness"]),
    originality: parseScore(fields["originality"]),
    themes: parseThemes(fields["themes"]),
    reply: parseReply(fields["reply"]),
  };
};
