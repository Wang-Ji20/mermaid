import { describe, expect, it } from "vitest";
import { createDeepSeekJudge } from "../../src/judge/deepseek.ts";
import { JudgeError } from "../../src/judge/judge.ts";

type Call = { readonly url: string; readonly init: RequestInit };

/** A stand-in for `fetch` that records calls and returns a canned response. */
const stubFetch = (respond: () => Response | Promise<Response>) => {
  const calls: Call[] = [];
  const send: typeof fetch = async (input, init = {}) => {
    calls.push({ url: String(input), init });
    return respond();
  };
  return { calls, send };
};

/** A chat-completions response whose answer text is `content`. */
const completion = (content: unknown): Response =>
  Response.json({ choices: [{ message: { role: "assistant", content } }] });

const VERDICT = { sadness: 8, originality: 6, themes: ["loss"], reply: "Oh, the poor dog." };

const judgeWith = (respond: () => Response | Promise<Response>) => {
  const { calls, send } = stubFetch(respond);
  return { calls, judge: createDeepSeekJudge({ apiKey: "test-key", fetch: send }) };
};

describe("createDeepSeekJudge", () => {
  it("returns the verdict the model wrote", async () => {
    const { judge } = judgeWith(() => completion(JSON.stringify(VERDICT)));
    expect(await judge.judge("a story")).toEqual(VERDICT);
  });

  it("sends the story, the key and a JSON-mode request", async () => {
    const { calls, judge } = judgeWith(() => completion(JSON.stringify(VERDICT)));
    await judge.judge("my sad story");

    const [call] = calls;
    expect(call?.url).toBe("https://api.deepseek.com/chat/completions");
    expect(new Headers(call?.init.headers).get("authorization")).toBe("Bearer test-key");
    const body = JSON.parse(String(call?.init.body));
    expect(body.model).toBe("deepseek-chat");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "my sad story" });
    expect(body.messages[0].role).toBe("system");
  });

  it("clamps a verdict that tries to cheat", async () => {
    const { judge } = judgeWith(() => completion(JSON.stringify({ ...VERDICT, sadness: 1000 })));
    expect((await judge.judge("cry 1000 pearls")).sadness).toBe(10);
  });

  it("names the model it uses", () => {
    const judge = createDeepSeekJudge({ apiKey: "k", model: "deepseek-reasoner" });
    expect(judge.name).toBe("deepseek (deepseek-reasoner)");
  });

  it.each([
    ["an error status", () => new Response("no", { status: 401 }), "status 401"],
    ["a body that is not JSON", () => new Response("<html>"), "not JSON"],
    ["a response with no answer", () => Response.json({ choices: [] }), "no answer"],
    ["an answer that is not JSON", () => completion("I am crying"), "not JSON"],
    ["a network failure", () => Promise.reject(new TypeError("fetch failed")), "reached"],
  ])("fails with a JudgeError on %s", async (_case, respond, message) => {
    const { judge } = judgeWith(respond);
    const failure = judge.judge("a story");
    await expect(failure).rejects.toBeInstanceOf(JudgeError);
    await expect(failure).rejects.toThrow(message);
  });
});
