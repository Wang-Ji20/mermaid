import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createOfflineJudge, judgeOffline } from "../../src/judge/offline.ts";

const SAD_STORY =
  "My grandmother died in the hospital last winter. I was too late to say goodbye, " +
  "and her dog still waits alone by the door every evening for her to come home.";

describe("judgeOffline", () => {
  it("finds a sad story sadder than small talk", () => {
    expect(judgeOffline(SAD_STORY).sadness).toBeGreaterThan(judgeOffline("Nice weather.").sadness);
  });

  it("is not moved by small talk", () => {
    const verdict = judgeOffline("Nice weather.");
    expect(verdict.sadness).toBeLessThan(3);
    expect(verdict.themes).toEqual(["other"]);
  });

  it("recognises themes from their words", () => {
    expect(judgeOffline(SAD_STORY).themes).toContain("loss");
    expect(judgeOffline("The soldier went to war.").themes).toEqual(["war"]);
  });

  it("does not reward repeating one sad word", () => {
    expect(judgeOffline("died ".repeat(200)).originality).toBe(0);
  });

  it("gives the same verdict for the same story", () => {
    fc.assert(
      fc.property(fc.string(), (story) => {
        expect(judgeOffline(story)).toEqual(judgeOffline(story));
      }),
    );
  });
});

describe("createOfflineJudge", () => {
  it("wraps the rules as a judge", async () => {
    const judge = createOfflineJudge();
    expect(judge.name).toBe("offline");
    expect(await judge.judge(SAD_STORY)).toEqual(judgeOffline(SAD_STORY));
  });
});
