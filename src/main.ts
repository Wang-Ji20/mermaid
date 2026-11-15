import { createDeepSeekJudge } from "./judge/deepseek.ts";
import type { Judge } from "./judge/judge.ts";
import { createOfflineJudge } from "./judge/offline.ts";
import { join } from "node:path";
import { createGameStore } from "./web/games.ts";
import { NO_SAVES, type Saves, createFileSaves } from "./web/saves.ts";
import { createApp } from "./web/server.ts";

const DEFAULT_PORT = 3000;
/** Local only by default: the server has no accounts and no rate limit. */
const DEFAULT_HOST = "127.0.0.1";
/** In the project folder, whatever folder the server is started from. */
const DEFAULT_SAVE_FILE = join(import.meta.dirname, "..", "saves", "games.json");

type Env = Readonly<Record<string, string | undefined>>;

/** Picks the DeepSeek judge when a key is set, the offline judge otherwise. */
const chooseJudge = (env: Env): Judge => {
  const apiKey = env["DEEPSEEK_API_KEY"];
  if (!apiKey) return createOfflineJudge();
  const model = env["DEEPSEEK_MODEL"];
  const baseUrl = env["DEEPSEEK_BASE_URL"];
  return createDeepSeekJudge({
    apiKey,
    ...(model ? { model } : {}),
    ...(baseUrl ? { baseUrl } : {}),
  });
};

const logError = (error: unknown): void => console.error(error);

/** The file games are saved in. An empty `SAVE_FILE` turns saving off. */
const saveFileFrom = (env: Env): string => env["SAVE_FILE"] ?? DEFAULT_SAVE_FILE;

const chooseSaves = (file: string): Saves =>
  file === "" ? NO_SAVES : createFileSaves(file, logError);

const main = (env: Env): void => {
  const judge = chooseJudge(env);
  const saveFile = saveFileFrom(env);
  const store = createGameStore({ saves: chooseSaves(saveFile) });
  const port = Number(env["PORT"] ?? DEFAULT_PORT);
  const host = env["HOST"] ?? DEFAULT_HOST;
  const app = createApp({ judge, store, logError });
  app.listen(port, host, () => {
    console.log(`The little mermaid is waiting at http://${host}:${port}`);
    console.log(`Judge: ${judge.name}`);
    console.log(saveFile === "" ? "Games are not saved." : `Games are saved in ${saveFile}`);
    if (judge.name === "offline") {
      console.log("Set DEEPSEEK_API_KEY to let the DeepSeek LLM judge your stories.");
    }
  });
};

main(process.env);
