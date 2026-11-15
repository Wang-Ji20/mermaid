import { afterEach, describe, expect, it } from "vitest";
import { GOAL, STORY_LIMIT } from "../../src/core/game.ts";
import { type Judge, JudgeError } from "../../src/judge/judge.ts";
import { MAX_BODY_BYTES } from "../../src/web/http.ts";
import { type AppConfig, MAX_STORY_LENGTH } from "../../src/web/server.ts";
import { nextDay, openMarket, pricesOf } from "../../src/core/market.ts";
import type { Grade } from "../../src/core/pearls.ts";
import type {
  GameView,
  NewGameResponse,
  SaleResponse,
  StoryResponse,
} from "../../src/web/view.ts";
import { type Running, SAD, TEST_SEED, fixedJudge, post, start } from "./harness.ts";

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

const sell = (url: string, id: string, grade: unknown = "round"): Promise<Response> =>
  post(`${url}/api/games/${id}/sales`, { grade });

/** The market's prices once one story has been told. */
const DAY_TWO = pricesOf(nextDay(openMarket(TEST_SEED)));

const held = (game: GameView, grade: Grade): number | undefined =>
  game.stall.find((row) => row.grade === grade)?.held;

/** A judge whose stories never share a theme, so every one earns 8 black pearls. */
const heartbreaking = fixedJudge({ ...SAD, sadness: 10, originality: 10, themes: ["other"] });

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
    expect(body.game).toEqual({
      coins: 0,
      goal: GOAL,
      storiesLeft: STORY_LIMIT,
      status: "playing",
      stall: [
        { grade: "seed", price: 5, standingPrice: 5, held: 0 },
        { grade: "round", price: 15, standingPrice: 15, held: 0 },
        { grade: "black", price: 40, standingPrice: 40, held: 0 },
      ],
    });
  });

  it("gives every game its own id", async () => {
    const url = await serve();
    expect((await newGame(url)).id).not.toBe((await newGame(url)).id);
  });
});

describe("telling a story", () => {
  it("returns the mermaid's reply, the pearls and the new day's prices", async () => {
    const url = await serve();
    const { id } = await newGame(url);
    const response = await tell(url, id);
    expect(response.status).toBe(200);
    const { game, turn } = (await response.json()) as StoryResponse;
    expect(turn.reply).toBe(SAD.reply);
    expect(turn.pearls).toEqual({ grade: "round", count: 5 });
    expect(turn.closingSale).toBe(0);
    expect(game.coins).toBe(0);
    expect(game.storiesLeft).toBe(STORY_LIMIT - 1);
    expect(game.stall).toEqual([
      { grade: "seed", price: DAY_TWO.seed, standingPrice: 5, held: 0 },
      { grade: "round", price: DAY_TWO.round, standingPrice: 15, held: 5 },
      { grade: "black", price: DAY_TWO.black, standingPrice: 40, held: 0 },
    ]);
  });

  it("keeps games apart", async () => {
    const url = await serve();
    const first = await newGame(url);
    const second = await newGame(url);
    await tell(url, first.id);
    const { game } = (await (await tell(url, second.id)).json()) as StoryResponse;
    expect(held(game, "round")).toBe(5);
  });

  it("sells what is left after the last story", async () => {
    const url = await serve({ judge: fixedJudge({ ...SAD, themes: ["other"], originality: 0 }) });
    const { id } = await newGame(url);
    for (let told = 1; told < STORY_LIMIT; told++) await tell(url, id);
    const { game, turn } = (await (await tell(url, id)).json()) as StoryResponse;
    expect(turn.closingSale).toBeGreaterThan(0);
    expect(game.coins).toBe(turn.closingSale);
    expect(held(game, "seed")).toBe(0);
    expect(game.status).toBe("lost");
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

describe("selling pearls", () => {
  it("pays today's price for every pearl of the grade", async () => {
    const url = await serve();
    const { id } = await newGame(url);
    await tell(url, id);
    const response = await sell(url, id, "round");
    expect(response.status).toBe(200);
    const { game, sale } = (await response.json()) as SaleResponse;
    const coins = 5 * DAY_TWO.round;
    expect(sale).toEqual({ grade: "round", count: 5, price: DAY_TWO.round, coins });
    expect(game.coins).toBe(coins);
    expect(held(game, "round")).toBe(0);
    expect(game.storiesLeft).toBe(STORY_LIMIT - 1);
  });

  it("ends the game when the goal is reached, and then refuses everything", async () => {
    const url = await serve({ judge: heartbreaking });
    const { id } = await newGame(url);
    // 24 black pearls reach 500 coins even at the lowest price of 24.
    for (let told = 0; told < 3; told++) await tell(url, id);
    const { game } = (await (await sell(url, id, "black")).json()) as SaleResponse;
    expect(game.status).toBe("won");
    expect((await tell(url, id)).status).toBe(409);
    expect((await sell(url, id, "black")).status).toBe(409);
  });

  it("refuses a grade she holds none of", async () => {
    const url = await serve();
    const { id } = await newGame(url);
    const response = await sell(url, id, "black");
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toContain("no black pearls");
  });

  it.each([
    ["an unknown grade", "golden"],
    ["a grade that is not text", 3],
    ["no grade", null],
  ])("rejects %s", async (_case, grade) => {
    const url = await serve();
    const { id } = await newGame(url);
    expect((await sell(url, id, grade)).status).toBe(400);
  });

  it("answers 404 for an unknown game", async () => {
    const url = await serve();
    expect((await sell(url, "no-such-game")).status).toBe(404);
  });

  it("waits until the story being judged is done", async () => {
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let slow = false;
    const judge: Judge = { name: "slow", judge: () => (slow ? gate : Promise.resolve()).then(() => SAD) };
    const url = await serve({ judge });
    const { id } = await newGame(url);
    await tell(url, id);

    slow = true;
    const story = tell(url, id);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const during = await sell(url, id);
    release();

    expect(during.status).toBe(409);
    expect((await story).status).toBe(200);
    expect((await sell(url, id)).status).toBe(200);
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
