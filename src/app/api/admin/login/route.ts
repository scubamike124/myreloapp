import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  adminConfigured,
  createSessionToken,
  verifyPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

// Best-effort brute-force damping. In-memory, so it resets on cold start and is
// per-instance — a durable store (Vercel KV / Redis) is the production answer,
// but this still blunts naive scripted guessing.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") || "local";
}

/** POST /api/admin/login — exchange the admin password for a signed session. */
export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set ADMIN_PASSWORD on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  const rec = attempts.get(id);
  if (rec && rec.count >= MAX_ATTEMPTS && Date.now() < rec.until) {
    const mins = Math.ceil((rec.until - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429 },
    );
  }

  let submitted = "";
  try {
    const body: unknown = await req.json();
    const password =
      typeof body === "object" && body !== null && "password" in body
        ? (body as { password: unknown }).password
        : undefined;
    submitted = typeof password === "string" ? password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyPassword(submitted)) {
    const next = !rec || Date.now() >= rec.until ? { count: 1, until: Date.now() + LOCKOUT_MS } : { count: rec.count + 1, until: rec.until };
    attempts.set(id, next);
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  attempts.delete(id);

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true, // invisible to document.cookie — no devtools self-grant
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** DELETE /api/admin/login — sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
