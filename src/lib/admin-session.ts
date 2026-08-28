/**
 * Node-runtime admin session check for API route handlers.
 *
 * Deliberately NOT added to admin-auth.ts itself: that module is imported by
 * src/middleware.ts, which runs on the Edge runtime and reads the cookie
 * straight off the request rather than through next/headers. Keeping the
 * next/headers import here, in a Node-only module, means the Edge-compiled
 * middleware bundle never has to care that this exists.
 *
 * middleware.ts's matcher only covers /admin/:path* — it does not, and was
 * never going to, protect /api/command-center/* (those paths don't start
 * with /admin/). Every Command Center API route relied on a comment
 * asserting middleware protection that never actually applied to it; this
 * is the real, enforced check that comment described.
 */
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export async function isAdminSession(): Promise<boolean> {
  try {
    const store = await cookies();
    return await verifySessionToken(store.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized. Sign in to Headquarters and try again." }, { status: 401 });
}
