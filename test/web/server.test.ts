import { afterEach, describe, expect, it } from "vitest";
import { GOAL, STORY_LIMIT } from "../../src/core/game.ts";
import { type Judge, JudgeError } from "../../src/judge/judge.ts";
import { MAX_BODY_BYTES } from "../../src/web/http.ts";
import { type AppConfig, MAX_STORY_LENGTH } from "../../src/web/server.ts";
import type { NewGameResponse, StoryResponse } from "../../src/web/view.ts";
import { type Running, SAD, fixedJudge, post, start } from "./harness.ts";

let running: Running | undefined;

const serve = async (config: Partial<AppConfig> = {}): Promise<string> => {
  running = await start(config);
  return running.url;
};

afterEach(async () => {
  await running?.close();
  running = undefined;
});

const newGame = async (url: string): Promise<NewGameResponse> =>
  (await (await post(`${url}/api/games`, {})).json()) as NewGameResponse;

const tell = (url: string, id: string, story: unknown = "A sad story."): Promise<Response> =>
  post(`${url}/api/games/${id}/stories`, { story });

const errorOf = async (response: Response): Promise<string> =>
  ((await response.json()) as { error: string }).error;

describe("starting a game", () => {
  it("returns a fresh game and the judge's name", async () => {
    const url = await serve();
    const response = await post(`${url}/api/games`, {});
    expect(response.status).toBe(201);
    const body = (await response.json()) as NewGameResponse;
    expect(body.judge).toBe("fixed");
    expect(body.maxStoryLength).toBe(MAX_STORY_LENGTH);
    expect(body.game).toEqual({ coins: 0, goal: GOAL, storiesLeft: STORY_LIMIT, status: "playing" });
  });

  it("gives every game its own id", async () => {
    const url = await serve();
    expect((await newGame(url)).id).not.toBe((await newGame(url)).id);
  });
});

describe("telling a story", () => {
  it("returns the mermaid's reply, the pearls and the new totals", async () => {
    const url = await serve();
    const { id } = await newGame(url);
    const response = await tell(url, id);
    expect(response.status).toBe(200);
    const { game, turn } = (await response.json()) as StoryResponse;
    expect(turn.reply).toBe(SAD.reply);
    expect(turn.pearls).toEqual({ grade: "round", count: 5 });
    expect(turn.coinsEarned).toBe(75);
    expect(game).toEqual({ coins: 75, goal: GOAL, storiesLeft: STORY_LIMIT - 1, status: "playing" });
  });

  it("keeps games apart", async () => {
    const url = await serve();
    const first = await newGame(url);
    const second = await newGame(url);
    await tell(url, first.id);
    const { game } = (await (await tell(url, second.id)).json()) as StoryResponse;
    expect(game.coins).toBe(75);
  });

  it("refuses stories once the game is won", async () => {
    const url = await serve({ judge: fixedJudge({ ...SAD, sadness: 10, originality: 10 }) });
    const { id } = await newGame(url);
    await tell(url, id);
    const second = (await (await tell(url, id)).json()) as StoryResponse;
    expect(second.game.status).toBe("won");
    const after = await tell(url, id);
    expect(after.status).toBe(409);
  });

  it.each([
    ["an empty story", "   "],
    ["a story that is not text", 42],
    ["a story that is too long", "x".repeat(MAX_STORY_LENGTH + 1)],
  ])("rejects %s without using up a story", async (_case, story) => {
    const url = await serve();
    const { id } = await newGame(url);
    expect((await tell(url, id, story)).status).toBe(400);
    const { game } = (await (await tell(url, id)).json()) as StoryResponse;
    expect(game.storiesLeft).toBe(STORY_LIMIT - 1);
  });

  it("answers 404 for an unknown game", async () => {
    const url = await serve();
    expect((await tell(url, "no-such-game")).status).toBe(404);
  });

  it("does not use up a story when the judge fails", async () => {
    let failing = true;
    const judge: Judge = {
      name: "flaky",
      judge: async () => {
        if (failing) throw new JudgeError("down");
        return SAD;
      },
    };
    const logged: unknown[] = [];
    const url = await serve({ judge, logError: (error) => logged.push(error) });
    const { id } = await newGame(url);

    const failed = await tell(url, id);
    expect(failed.status).toBe(502);
    expect(await errorOf(failed)).toContain("Try again");
    expect(logged).toHaveLength(1);

    failing = false;
    const { game } = (await (await tell(url, id)).json()) as StoryResponse;
    expect(game.storiesLeft).toBe(STORY_LIMIT - 1);
  });

  it("judges only one story per game at a time", async () => {
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const judge: Judge = { name: "slow", judge: () => gate.then(() => SAD) };
    const url = await serve({ judge });
    const { id } = await newGame(url);

    const first = tell(url, id);
    // Let the first request reach the judge before sending the second.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const second = await tell(url, id);
    release();

    expect(second.status).toBe(409);
    expect((await first).status).toBe(200);
  });
});

describe("request checks", () => {
  it("rejects a body that is not sent as JSON", async () => {
    const url = await serve();
    const response = await fetch(`${url}/api/games`, { method: "POST", body: "{}" });
    expect(response.status).toBe(415);
  });

  it("rejects malformed JSON", async () => {
    const url = await serve();
    const response = await fetch(`${url}/api/games`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{oops",
    });
    expect(response.status).toBe(400);
  });

  it("rejects an oversized body", async () => {
    const url = await serve();
    const { id } = await newGame(url);
    const response = await tell(url, id, "x".repeat(MAX_BODY_BYTES));
    expect(response.status).toBe(413);
  });

  it("answers 404 for unknown paths", async () => {
    const url = await serve();
    expect((await post(`${url}/api/pearls`, {})).status).toBe(404);
  });
});
