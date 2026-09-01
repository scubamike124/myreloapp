import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, currentUser, endSession } from "@/lib/accounts";
import { balanceOf, historyOf } from "@/lib/tokens";

export const runtime = "nodejs";

// Sign-out and session lookup only. Password sign-up/sign-in/reset used to
// live here too -- removed with no customers ever on a password account,
// so there is nothing to migrate. Google Sign-In (/api/auth/google/start,
// completeGoogleLogin) is the only way to establish a new session now; this
// route only ever tears one down or reports on the one already there.
//
// POST /api/auth  { action: "logout" }
// GET  /api/auth  -> the current user and balance
//
// Cookies are set on the NextResponse (same pattern as /api/admin/login).
// Mutating cookies() from next/headers throws an empty 500 on OpenNext/Workers.

function applySessionCookie(res: NextResponse, id: string, maxAge = SESSION_DAYS * 86400) {
  res.cookies.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: true, configured: false, user: null, balance: 0 });
  }
  try {
    const user = await currentUser();
    return NextResponse.json({
      ok: true,
      configured: true,
      user,
      balance: user ? await balanceOf(user.id) : 0,
      history: user ? await historyOf(user.id, 20) : [],
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, configured: true, user: null, balance: 0, error: e instanceof Error ? e.message : "Auth lookup failed." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "Accounts aren't set up yet — DATABASE_URL is not configured on the server." },
      { status: 503 },
    );
  }

  // Capture Hyperdrive before cookies() — cookies can drop OpenNext ALS.
  const { sqlAsync } = await import("@/lib/db");
  await sqlAsync();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = String(body.action ?? "");

  try {
    if (action === "logout") {
      const store = await cookies();
      const sid = store.get(SESSION_COOKIE)?.value;
      if (sid) await endSession(sid);
      const res = NextResponse.json({ ok: true });
      applySessionCookie(res, "", 0);
      return res;
    }

    if (action === "signup" || action === "login" || action === "reset-password" || action === "request-reset") {
      return NextResponse.json(
        { error: "Password sign-in has been removed. Use Continue with Google on the sign-in page." },
        { status: 410 },
      );
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Authentication failed." },
      { status: 500 },
    );
  }
}
