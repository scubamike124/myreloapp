import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

// Next 16 renamed the `middleware` convention to `proxy`. It always runs on the
// Node.js runtime, so node:crypto (used by the session verifier) is available.
//
// This is what actually protects /admin — the gate now runs before the page is
// rendered, so admin data is never sent to an unauthenticated browser.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The login page itself must stay reachable.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (verifySessionToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  // Remember where they were headed so login can bounce them back.
  if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
