import { describe, expect, it } from "vitest";
import { type GameState, newGame, playTurn, statusOf } from "../../src/core/game.ts";
import { judgeOffline } from "../../src/judge/offline.ts";

/**
 * Regression test: the offline judge once scored so low that the goal
 * could not be reached. Ordinary, varied stories must be able to win.
 */

const VARIED_STORIES = [
  "My grandmother died in the hospital last winter. I was too late to say goodbye, and her old dog still waits by the door every evening, listening for her steps on the stairs.",
  "The soldier never came home from the war, and his mother kept the letter by the window for years, reading it alone each night.",
  "Our old cat was sick and hungry in the cold and we were too poor to pay the doctor, so I held her until morning.",
  "I lied to my brother and he left. I wish I had said sorry before it was too late, but I never did, and I regret it.",
  "She promised to wait for me, but when I came back from the sea she had married another and my heart broke on the quay.",
  "Nobody came to his birthday. He set the table for six, lit the candles, and ate in silence in the empty kitchen.",
  "My father worked two jobs to pay our debt and still came home with no money, cold hands and a smile he kept only for us.",
  "The puppy I found in the rain was sick. I kept her warm in my coat, but by morning she was gone and I buried her under the apple tree.",
];

const play = (state: GameState, story: string): GameState =>
  statusOf(state) === "playing" ? playTurn(state, judgeOffline(story)).state : state;

describe("a game with the offline judge", () => {
  it("can be won with varied sad stories", () => {
    expect(statusOf(VARIED_STORIES.reduce(play, newGame()))).toBe("won");
  });

  it("cannot be won by repeating one story", () => {
    const [story = ""] = VARIED_STORIES;
    const repeated = Array.from({ length: 12 }, () => story);
    expect(statusOf(repeated.reduce(play, newGame()))).toBe("lost");
  });
});
