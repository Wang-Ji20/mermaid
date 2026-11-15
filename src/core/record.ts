/** True for any object that fields can be read from. Used on untrusted data. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
