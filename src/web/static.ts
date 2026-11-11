import { readFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import { join } from "node:path";

/** The folder that holds the page, next to `src/`. */
export const DEFAULT_PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");

type StaticFile = {
  readonly file: string;
  readonly type: string;
};

/**
 * Every file the server will hand out. Paths are looked up here and never
 * joined from the URL, so a request cannot reach outside the folder.
 */
const FILES: Readonly<Record<string, StaticFile>> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
};

const HEADERS = {
  // The page loads scripts and styles only from this server.
  "content-security-policy": "default-src 'self'",
  "x-content-type-options": "nosniff",
  // The files are tiny and local; always serving fresh ones keeps edits visible.
  "cache-control": "no-cache",
};

/** Sends the page file for `pathname`. Returns false if there is none. */
export const serveStatic = async (
  publicDir: string,
  pathname: string,
  response: ServerResponse,
): Promise<boolean> => {
  const entry = FILES[pathname];
  if (entry === undefined) return false;
  const content = await readFile(join(publicDir, entry.file));
  response.writeHead(200, { ...HEADERS, "content-type": entry.type });
  response.end(content);
  return true;
};
