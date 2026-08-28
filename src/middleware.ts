import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "@/lib/admin-auth";

/**
 * Edge Middleware — required for @opennextjs/cloudflare.
 * Next.js 16 `proxy.ts` is Node-only and is not supported on Workers yet.
 * Protects /admin before any admin page is rendered.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    const res = NextResponse.next();
    // Sliding renewal: every valid page load re-mints a fresh token rather
    // than letting the original one just count down. An actively-used
    // session then never hits its own expiry — only real inactivity does.
    const renewed = await createSessionToken();
    if (renewed) {
      res.cookies.set(ADMIN_COOKIE, renewed, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
    return res;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
