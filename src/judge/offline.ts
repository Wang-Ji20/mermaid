import { clampScore } from "../core/score.ts";
import type { Theme } from "../core/themes.ts";
import { type Verdict, parseVerdict } from "../core/verdict.ts";
import type { Judge } from "./judge.ts";

/**
 * A judge that needs no network. It scores by simple word rules, so the
 * game is playable without an API key. It is easy to fool; it only has to
 * be good enough to try the game.
 */

const THEME_WORDS: Readonly<Partial<Record<Theme, readonly string[]>>> = {
  loss: ["died", "death", "dead", "lost", "funeral", "grave", "gone", "passed"],
  love: ["love", "loved", "lover", "heart", "kiss", "wedding", "married"],
  loneliness: ["alone", "lonely", "nobody", "empty", "silence", "forgotten"],
  family: ["mother", "father", "mom", "dad", "sister", "brother", "grandmother", "grandfather", "child", "son", "daughter"],
  illness: ["sick", "ill", "hospital", "cancer", "disease", "doctor", "fever"],
  betrayal: ["betrayed", "lied", "cheated", "abandoned", "broke", "promise"],
  regret: ["regret", "sorry", "never", "wish", "should", "late"],
  farewell: ["goodbye", "farewell", "left", "leaving", "last", "letter"],
  poverty: ["poor", "hungry", "money", "debt", "cold", "homeless"],
  war: ["war", "soldier", "bomb", "battle", "army", "refugee"],
  animal: ["dog", "cat", "bird", "horse", "pet", "puppy", "kitten"],
};

const BASE_SADNESS = 1;
const SADNESS_PER_SAD_WORD = 1;
const WORDS_PER_LENGTH_POINT = 30;
const MAX_LENGTH_POINTS = 3;
const DISTINCT_WORDS_PER_ORIGINALITY_POINT = 6;
/** Fewer than the verdict allows: word matches are loose, and each extra theme adds numbness. */
const MAX_OFFLINE_THEMES = 2;

const REPLIES: readonly (readonly [minSadness: number, reply: string])[] = [
  [8, "Oh... I cannot stop. Look how they fall. Thank you, and I am sorry."],
  [5, "My eyes sting. That one will stay with me tonight."],
  [3, "A small ache. One tear, perhaps two."],
  [0, "I listened closely, but the sea has told me sadder things."],
];

const wordsOf = (story: string): readonly string[] =>
  story.toLowerCase().match(/[a-z']+/g) ?? [];

const hitsFor = (words: ReadonlySet<string>, theme: Theme): number =>
  (THEME_WORDS[theme] ?? []).filter((word) => words.has(word)).length;

type ThemeHits = readonly [theme: Theme, hits: number];

const rankThemes = (words: ReadonlySet<string>): readonly ThemeHits[] =>
  (Object.keys(THEME_WORDS) as Theme[])
    .map((theme): ThemeHits => [theme, hitsFor(words, theme)])
    .filter(([, hits]) => hits > 0)
    .sort(([, a], [, b]) => b - a);

const replyFor = (sadness: number): string =>
  REPLIES.find(([minSadness]) => sadness >= minSadness)?.[1] ?? "";

export const judgeOffline = (story: string): Verdict => {
  const words = wordsOf(story);
  const distinct = new Set(words);
  const ranked = rankThemes(distinct);
  const sadWords = ranked.reduce((total, [, hits]) => total + hits, 0);
  const lengthPoints = Math.min(MAX_LENGTH_POINTS, words.length / WORDS_PER_LENGTH_POINT);
  const sadness = clampScore(BASE_SADNESS + SADNESS_PER_SAD_WORD * sadWords + lengthPoints);
  return parseVerdict({
    sadness,
    originality: clampScore(distinct.size / DISTINCT_WORDS_PER_ORIGINALITY_POINT),
    themes: ranked.slice(0, MAX_OFFLINE_THEMES).map(([theme]) => theme),
    reply: replyFor(sadness),
  });
};

export const createOfflineJudge = (): Judge => ({
  name: "offline",
  judge: async (story) => judgeOffline(story),
});
