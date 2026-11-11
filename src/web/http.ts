import type { IncomingMessage, ServerResponse } from "node:http";

/** Largest request body accepted, in bytes. A story is far smaller. */
export const MAX_BODY_BYTES = 16 * 1024;

/** A failure that should reach the browser with this status and message. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const sendJson = (response: ServerResponse, status: number, body: unknown): void => {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
};

const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "That is too long.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

/**
 * Reads a JSON request body.
 *
 * Insists on the JSON content type. A web page on another site cannot
 * send that type to this server without asking permission first, and the
 * server never grants it. So other sites cannot spend the player's LLM
 * credit behind their back.
 */
export const readJson = async (request: IncomingMessage): Promise<unknown> => {
  const type = request.headers["content-type"] ?? "";
  if (!type.startsWith("application/json")) throw new HttpError(415, "Send JSON.");
  const text = await readBody(request);
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "That is not valid JSON.");
  }
};
