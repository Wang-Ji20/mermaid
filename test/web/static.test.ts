import { afterEach, describe, expect, it } from "vitest";
import { type Running, start } from "./harness.ts";

let running: Running | undefined;

const serve = async (): Promise<string> => {
  running = await start();
  return running.url;
};

afterEach(async () => {
  await running?.close();
  running = undefined;
});

describe("the page", () => {
  it("is served at the root", async () => {
    const response = await fetch(await serve());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("<title>Mermaid Tears</title>");
  });

  it.each([
    ["/style.css", "text/css"],
    ["/app.js", "text/javascript"],
  ])("serves %s as %s", async (path, type) => {
    const response = await fetch(`${await serve()}${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(type);
  });

  it("only loads scripts and styles from the server itself", async () => {
    const response = await fetch(await serve());
    expect(response.headers.get("content-security-policy")).toBe("default-src 'self'");
  });

  it.each(["/package.json", "/../package.json", "/%2e%2e/package.json", "/src/main.ts"])(
    "does not serve %s",
    async (path) => {
      const response = await fetch(`${await serve()}${path}`);
      expect(response.status).toBe(404);
    },
  );
});
