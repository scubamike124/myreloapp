import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clientId, createDailyLimiter } from "@/lib/api-guard";
import { dbConfigured } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  authenticate,
  createPasswordResetToken,
  createUser,
  currentUser,
  endSession,
  passwordProblem,
  resetPasswordWithToken,
  startSession,
  validEmail,
} from "@/lib/accounts";
import { balanceOf, historyOf } from "@/lib/tokens";
import { mailConfigured, sendPasswordResetEmail } from "@/lib/mail";
import { BUSINESS } from "@/lib/legal";

export const runtime = "nodejs";

// Sign-up, sign-in and sign-out in one route: they share the same cookie
// handling, and keeping them together makes it obvious that all three set the
// session the same way.
//
// POST /api/auth  { action: "signup" | "login" | "logout", ... }
// GET  /api/auth  -> the current user and balance
//
// Cookies are set on the NextResponse (same pattern as /api/admin/login).
// Mutating cookies() from next/headers throws an empty 500 on OpenNext/Workers.

// Brute-force guard. Per IP rather than per email, so someone cannot lock
// another person out by guessing at their address.
const attempts = createDailyLimiter(Number(process.env.AUTH_ATTEMPTS_PER_DAY ?? 60));

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

    if (attempts.consume(clientId(req)) === null) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const password = String(body.password ?? "");

    // Token + password only — do not require a fake email from the client.
    if (action === "reset-password") {
      const token = String(body.token ?? "");
      const outcome = await resetPasswordWithToken(token, password);
      if ("error" in outcome) return NextResponse.json({ error: outcome.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    const email = String(body.email ?? "").trim();
    if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    if (action === "signup") {
      const problem = passwordProblem(password);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });

      let result: Awaited<ReturnType<typeof createUser>>;
      try {
        result = await createUser(email, password, String(body.name ?? ""));
      } catch (e) {
        return NextResponse.json(
          { error: `signup/createUser: ${e instanceof Error ? e.message : "failed"}` },
          { status: 500 },
        );
      }
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

      let sid: string | null;
      try {
        sid = await startSession(result.id);
      } catch (e) {
        return NextResponse.json(
          { error: `signup/startSession: ${e instanceof Error ? e.message : "failed"}` },
          { status: 500 },
        );
      }
      if (!sid) return NextResponse.json({ error: "Could not start a session." }, { status: 500 });

      let balance = 0;
      try {
        balance = await balanceOf(result.id);
      } catch (e) {
        return NextResponse.json(
          { error: `signup/balanceOf: ${e instanceof Error ? e.message : "failed"}` },
          { status: 500 },
        );
      }
      const res = NextResponse.json({ ok: true, user: result, balance });
      applySessionCookie(res, sid);
      return res;
    }

    if (action === "login") {
      let user: Awaited<ReturnType<typeof authenticate>>;
      try {
        user = await authenticate(email, password);
      } catch (e) {
        return NextResponse.json(
          { error: `login/authenticate: ${e instanceof Error ? e.message : "failed"}` },
          { status: 500 },
        );
      }
      // One message for both cases: which half was wrong is not the user's
      // business, and telling them reveals whether an account exists.
      if (!user) return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });

      let sid: string | null;
      try {
        sid = await startSession(user.id);
      } catch (e) {
        return NextResponse.json(
          { error: `login/startSession: ${e instanceof Error ? e.message : "failed"}` },
          { status: 500 },
        );
      }
      if (!sid) return NextResponse.json({ error: "Could not start a session." }, { status: 500 });
      const res = NextResponse.json({ ok: true, user, balance: await balanceOf(user.id) });
      applySessionCookie(res, sid);
      return res;
    }

    if (action === "request-reset") {
      const canMail = mailConfigured();
      let emailed = false;
      // Only mint a token when we can actually deliver it.
      if (canMail) {
        const result = await createPasswordResetToken(email);
        if (result.token && result.email) {
          const origin = new URL(req.url).origin;
          const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(result.token)}`;
          emailed = await sendPasswordResetEmail(result.email, resetUrl);
        }
      }
      // Never reveal whether the account exists.
      return NextResponse.json({
        ok: true,
        emailed,
        mailConfigured: canMail,
        supportEmail: BUSINESS.supportEmail,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Authentication failed." },
      { status: 500 },
    );
  }
}
