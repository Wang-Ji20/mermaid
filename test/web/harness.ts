import type { AddressInfo } from "node:net";
import type { Verdict } from "../../src/core/verdict.ts";
import type { Judge } from "../../src/judge/judge.ts";
import { createGameStore } from "../../src/web/games.ts";
import { type AppConfig, createApp } from "../../src/web/server.ts";

/** Helpers that run the real server on a free local port. */

/** Every test game gets this market seed, so its prices are known. */
export const TEST_SEED = 1;

export const SAD: Verdict = { sadness: 7, originality: 5, themes: ["loss"], reply: "Oh..." };

/** A judge that returns the same verdict for every story. */
export const fixedJudge = (verdict: Verdict = SAD): Judge => ({
  name: "fixed",
  judge: async () => verdict,
});

export type Running = {
  readonly url: string;
  readonly close: () => Promise<void>;
};

export const start = async (config: Partial<AppConfig> = {}): Promise<Running> => {
  const store = createGameStore({ seedFor: () => TEST_SEED });
  const app = createApp({ judge: fixedJudge(), store, ...config });
  await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
  const { port } = app.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => app.close(() => resolve())),
  };
};

export const post = (url: string, body: unknown): Promise<Response> =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
