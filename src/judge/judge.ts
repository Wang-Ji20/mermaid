import type { Verdict } from "../core/verdict.ts";

/** Reads a story and says how it moved the mermaid. */
export type Judge = {
  /** Shown to the player, so they know who is judging. */
  readonly name: string;
  readonly judge: (story: string) => Promise<Verdict>;
};

/** The judge could not produce a verdict. The story should not count. */
export class JudgeError extends Error {
  override readonly name = "JudgeError";
}
