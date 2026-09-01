import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  startSession,
  upsertGoogleUser,
} from "@/lib/accounts";
import {
  exchangeGoogleLoginCode,
  verifyGoogleLoginState,
} from "@/lib/google-login";
import { ADMIN_COOKIE, SESSION_MAX_AGE } from "@/lib/admin-auth";
import { attachAdminSessionIfPrivileged, isPrivilegedRole } from "@/lib/roles";
import { appBaseUrl } from "@/lib/social/providers";

function failRedirect(message: string): NextResponse {
  const u = new URL("/login", appBaseUrl());
  u.searchParams.set("error", message);
  return NextResponse.redirect(u);
}

/** Finish Google Sign-In after OAuth code return (any registered redirect URI). */
export async function completeGoogleLogin(code: string, state: string): Promise<NextResponse> {
  const stateCheck = verifyGoogleLoginState(state);
  if (!stateCheck.ok) return failRedirect(stateCheck.error);

  let profile;
  try {
    profile = await exchangeGoogleLoginCode(code);
  } catch (e) {
    console.error("[google-login] token exchange:", e instanceof Error ? e.message : e);
    return failRedirect("Google sign-in failed. Try again.");
  }

  const result = await upsertGoogleUser(profile);
  if ("error" in result) return failRedirect(result.error);

  const sid = await startSession(result.user.id);
  if (!sid) return failRedirect("Could not start a session.");

  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: sid,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });

  if (isPrivilegedRole(result.user.role)) {
    const adminTok = await attachAdminSessionIfPrivileged(result.user.role);
    if (adminTok) {
      store.set({
        name: ADMIN_COOKIE,
        value: adminTok,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
  }

  let dest = stateCheck.next;
  if (result.claimedOwner || result.user.role === "OWNER") {
    if (dest === "/account" || dest === "/login" || dest === "/signup") {
      dest = "/admin";
    }
  }

  return NextResponse.redirect(new URL(dest, appBaseUrl()));
}
