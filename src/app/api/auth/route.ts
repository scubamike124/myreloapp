import { cookies } from "next/headers";
import { clientId, createDailyLimiter } from "@/lib/api-guard";
import { dbConfigured } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  authenticate,
  createUser,
  currentUser,
  endSession,
  passwordProblem,
  startSession,
  validEmail,
} from "@/lib/accounts";
import { balanceOf, historyOf } from "@/lib/tokens";

export const runtime = "nodejs";

// Sign-up, sign-in and sign-out in one route: they share the same cookie
// handling, and keeping them together makes it obvious that all three set the
// session the same way.
//
// POST /api/auth  { action: "signup" | "login" | "logout", ... }
// GET  /api/auth  -> the current user and balance

// Brute-force guard. Per IP rather than per email, so someone cannot lock
// another person out by guessing at their address.
const attempts = createDailyLimiter(Number(process.env.AUTH_ATTEMPTS_PER_DAY ?? 60));

function sessionCookie(id: string) {
  return {
    name: SESSION_COOKIE,
    value: id,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

export async function GET() {
  if (!dbConfigured()) {
    return Response.json({ ok: true, configured: false, user: null, balance: 0 });
  }
  const user = await currentUser();
  return Response.json({
    ok: true,
    configured: true,
    user,
    balance: user ? await balanceOf(user.id) : 0,
    history: user ? await historyOf(user.id, 20) : [],
  });
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return Response.json(
      { error: "Accounts aren't set up yet — DATABASE_URL is not configured on the server." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = String(body.action ?? "");
  const store = await cookies();

  if (action === "logout") {
    const sid = store.get(SESSION_COOKIE)?.value;
    if (sid) await endSession(sid);
    store.set({ ...sessionCookie(""), maxAge: 0 });
    return Response.json({ ok: true });
  }

  if (attempts.consume(clientId(req)) === null) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!validEmail(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  if (action === "signup") {
    const problem = passwordProblem(password);
    if (problem) return Response.json({ error: problem }, { status: 400 });

    const result = await createUser(email, password, String(body.name ?? ""));
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });

    const sid = await startSession(result.id);
    if (!sid) return Response.json({ error: "Could not start a session." }, { status: 500 });
    store.set(sessionCookie(sid));
    return Response.json({ ok: true, user: result, balance: await balanceOf(result.id) });
  }

  if (action === "login") {
    const user = await authenticate(email, password);
    // One message for both cases: which half was wrong is not the user's
    // business, and telling them reveals whether an account exists.
    if (!user) return Response.json({ error: "That email and password don't match." }, { status: 401 });

    const sid = await startSession(user.id);
    if (!sid) return Response.json({ error: "Could not start a session." }, { status: 500 });
    store.set(sessionCookie(sid));
    return Response.json({ ok: true, user, balance: await balanceOf(user.id) });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}
