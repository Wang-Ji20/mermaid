import { createDeepSeekJudge } from "./judge/deepseek.ts";
import type { Judge } from "./judge/judge.ts";
import { createOfflineJudge } from "./judge/offline.ts";
import { createApp } from "./web/server.ts";

const DEFAULT_PORT = 3000;
/** Local only by default: the server has no accounts and no rate limit. */
const DEFAULT_HOST = "127.0.0.1";

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

const main = (env: Env): void => {
  const judge = chooseJudge(env);
  const port = Number(env["PORT"] ?? DEFAULT_PORT);
  const host = env["HOST"] ?? DEFAULT_HOST;
  const app = createApp({ judge, logError: (error) => console.error(error) });
  app.listen(port, host, () => {
    console.log(`The little mermaid is waiting at http://${host}:${port}`);
    console.log(`Judge: ${judge.name}`);
    if (judge.name === "offline") {
      console.log("Set DEEPSEEK_API_KEY to let the DeepSeek LLM judge your stories.");
    }
  });
};

main(process.env);
