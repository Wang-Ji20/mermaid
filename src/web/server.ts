import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import { playTurn, statusOf } from "../core/game.ts";
import { type Judge, JudgeError } from "../judge/judge.ts";
import { type GameStore, createGameStore } from "./games.ts";
import { HttpError, readJson, sendJson } from "./http.ts";
import { DEFAULT_PUBLIC_DIR, serveStatic } from "./static.ts";
import { type NewGameResponse, type StoryResponse, gameView, turnView } from "./view.ts";

export const MAX_STORY_LENGTH = 2000;

export type AppConfig = {
  readonly judge: Judge;
  readonly store?: GameStore;
  /** Folder holding the page. Defaults to `public/`. */
  readonly publicDir?: string;
  /** Where unexpected failures are reported. Silent by default. */
  readonly logError?: (error: unknown) => void;
};

type Context = {
  readonly judge: Judge;
  readonly store: GameStore;
  readonly publicDir: string;
};

const STORY_ROUTE = /^\/api\/games\/([\w-]+)\/stories$/;

const storyFrom = (body: unknown): string => {
  const raw = typeof body === "object" && body !== null ? (body as { story?: unknown }).story : undefined;
  const story = typeof raw === "string" ? raw.trim() : "";
  if (story === "") throw new HttpError(400, "Tell her a story first.");
  if (story.length > MAX_STORY_LENGTH) {
    throw new HttpError(400, `Keep your story under ${MAX_STORY_LENGTH} characters.`);
  }
  return story;
};

const startGame = ({ judge, store }: Context): NewGameResponse => {
  const id = store.create();
  const state = store.get(id);
  if (state === undefined) throw new Error("A new game vanished from the store.");
  return { id, judge: judge.name, maxStoryLength: MAX_STORY_LENGTH, game: gameView(state) };
};

/** Judges one story and applies it. The caller holds the game's lock. */
const judgeStory = async (context: Context, id: string, story: string): Promise<StoryResponse> => {
  const verdict = await context.judge.judge(story);
  // Read the state after the wait, in case the game was dropped meanwhile.
  const state = context.store.get(id);
  if (state === undefined) throw new HttpError(404, "That game no longer exists.");
  const turn = playTurn(state, verdict);
  context.store.set(id, turn.state);
  return { game: gameView(turn.state), turn: turnView(verdict, turn.outcome) };
};

const tellStory = async (context: Context, id: string, body: unknown): Promise<StoryResponse> => {
  const state = context.store.get(id);
  if (state === undefined) throw new HttpError(404, "That game no longer exists.");
  if (statusOf(state) !== "playing") throw new HttpError(409, "This tale has ended.");
  const story = storyFrom(body);
  if (!context.store.lock(id)) throw new HttpError(409, "She is still listening to your last story.");
  try {
    return await judgeStory(context, id, story);
  } finally {
    context.store.unlock(id);
  }
};

const route = async (
  context: Context,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  if (request.method === "GET" && (await serveStatic(context.publicDir, pathname, response))) {
    return;
  }
  if (request.method === "POST" && pathname === "/api/games") {
    await readJson(request);
    return sendJson(response, 201, startGame(context));
  }
  const storyMatch = STORY_ROUTE.exec(pathname);
  if (request.method === "POST" && storyMatch?.[1] !== undefined) {
    const body = await readJson(request);
    return sendJson(response, 200, await tellStory(context, storyMatch[1], body));
  }
  throw new HttpError(404, "Nothing here but water.");
};

const JUDGE_FAILED = "The sea is too rough for her to hear you. Try again in a moment.";
const SERVER_FAILED = "Something went wrong beneath the waves.";

const sendFailure = (
  response: ServerResponse,
  error: unknown,
  logError: (error: unknown) => void,
): void => {
  if (error instanceof HttpError) return sendJson(response, error.status, { error: error.message });
  logError(error);
  const judgeFailed = error instanceof JudgeError;
  sendJson(response, judgeFailed ? 502 : 500, { error: judgeFailed ? JUDGE_FAILED : SERVER_FAILED });
};

/** Builds the game's HTTP server. Call `listen` on the result to start it. */
export const createApp = (config: AppConfig): Server => {
  const context: Context = {
    judge: config.judge,
    store: config.store ?? createGameStore(),
    publicDir: config.publicDir ?? DEFAULT_PUBLIC_DIR,
  };
  const logError = config.logError ?? (() => {});
  return createServer((request, response) => {
    route(context, request, response).catch((error: unknown) =>
      sendFailure(response, error, logError),
    );
  });
};
