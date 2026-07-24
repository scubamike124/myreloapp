/**
 * Narrow unknown JSON values without using `any`.
 * Prefer these helpers over property access on `req.json()` / `res.json()` results.
 */

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** Read a request body as unknown (never assume shape). */
export async function readRequestJson(req: Request): Promise<unknown> {
  return req.json();
}

/** Parse a fetch Response body as a plain object. */
export async function readResponseRecord(res: Response): Promise<Record<string, unknown>> {
  try {
    return asRecord(await res.json());
  } catch {
    return {};
  }
}

export function errorMessage(data: Record<string, unknown>, fallback: string): string {
  const err = data.error;
  if (typeof err === "string" && err.trim()) return err;
  const nested = asRecord(err);
  if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

/** Gemini generateContent text part helper. */
export function geminiText(data: Record<string, unknown>): string | null {
  const parts = geminiParts(data);
  const texts = parts
    .map((p) => {
      const text = asRecord(p).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean);
  return texts.length ? texts.join("") : null;
}

export function geminiParts(data: Record<string, unknown>): unknown[] {
  return asArray(asRecord(asRecord(asArray(data.candidates)[0]).content).parts);
}

export function childRecord(data: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(data[key]);
}
