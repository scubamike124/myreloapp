import { ensureSchema, sqlAsync, dbConfigured } from "@/lib/db";
import { currentUser, type User } from "@/lib/accounts";

export type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

export async function requireUser(): Promise<
  | { ok: true; user: User; q: Sql }
  | { ok: false; response: Response }
> {
  if (!dbConfigured()) {
    return {
      ok: false,
      response: Response.json({ ok: false, error: "Accounts aren't set up yet." }, { status: 503 }),
    };
  }
  const user = await currentUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ ok: false, error: "Sign in required." }, { status: 401 }),
    };
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return {
      ok: false,
      response: Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 }),
    };
  }
  return { ok: true, user, q };
}

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export function parsePlatforms(v: unknown): string[] {
  const allowed = new Set(["TikTok", "Instagram", "YouTube", "Facebook", "X", "Other"]);
  const raw = Array.isArray(v) ? v : [];
  return raw
    .map((p) => str(p, 40))
    .filter((p) => allowed.has(p))
    .slice(0, 8);
}

export function parseJsonArray(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
