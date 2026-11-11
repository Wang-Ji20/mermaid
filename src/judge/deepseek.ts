import { type Verdict, parseVerdict } from "../core/verdict.ts";
import { type Judge, JudgeError } from "./judge.ts";
import { buildMessages } from "./prompt.ts";

export const DEFAULT_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REPLY_TOKENS = 400;
const TEMPERATURE = 0.7;

export type DeepSeekConfig = {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  /** Replaced in tests so they never touch the network. */
  readonly fetch?: typeof fetch;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Pulls the text of the first answer out of a chat-completions response. */
const contentOf = (body: unknown): string => {
  const choices = isRecord(body) ? body["choices"] : undefined;
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  const message = isRecord(first) ? first["message"] : undefined;
  const content = isRecord(message) ? message["content"] : undefined;
  if (typeof content !== "string") throw new JudgeError("DeepSeek sent no answer.");
  return content;
};

const parseJson = (text: string, what: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new JudgeError(`DeepSeek sent ${what} that is not JSON.`);
  }
};

const requestBody = (model: string, story: string): string =>
  JSON.stringify({
    model,
    messages: buildMessages(story),
    response_format: { type: "json_object" },
    temperature: TEMPERATURE,
    max_tokens: MAX_REPLY_TOKENS,
  });

export const createDeepSeekJudge = (config: DeepSeekConfig): Judge => {
  const send = config.fetch ?? fetch;
  const model = config.model ?? DEFAULT_MODEL;
  const url = `${config.baseUrl ?? DEFAULT_BASE_URL}/chat/completions`;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const ask = async (story: string): Promise<string> => {
    const response = await send(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: requestBody(model, story),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new JudgeError(`DeepSeek answered with status ${response.status}.`);
    return response.text();
  };

  const judge = async (story: string): Promise<Verdict> => {
    const text = await ask(story).catch((error: unknown) => {
      if (error instanceof JudgeError) throw error;
      throw new JudgeError("DeepSeek could not be reached.", { cause: error });
    });
    const answer = contentOf(parseJson(text, "a response"));
    return parseVerdict(parseJson(answer, "a verdict"));
  };

  return { name: `deepseek (${model})`, judge };
};
