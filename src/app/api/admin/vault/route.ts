import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { canWrite, readStatuses, writeKeys } from "@/lib/env-vault";

export const runtime = "nodejs";

// IMPORTANT: middleware matches "/admin/:path*", which does NOT cover this route
// (it lives under /api). The session must be verified here, explicitly.
async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  return null;
}

/** GET — status of every known key. Never returns a secret value. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(
    { ok: true, canWrite: canWrite(), keys: await readStatuses() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** POST — merge `{ updates: { KEY: value } }` into .env.local. Dev only. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!canWrite()) {
    return NextResponse.json(
      {
        error:
          "Keys can't be edited on a deployed server — its filesystem is read-only. Set them in your host's environment settings instead.",
      },
      { status: 403 },
    );
  }

  let updates: Record<string, string>;
  try {
    const body = await req.json();
    updates = body?.updates;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) throw new Error("bad shape");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (Object.keys(updates).length > 50) {
    return NextResponse.json({ error: "Too many keys in one request." }, { status: 400 });
  }

  try {
    const result = await writeKeys(updates);
    return NextResponse.json({
      ok: result.errors.length === 0,
      written: result.written,
      errors: result.errors,
      warnings: result.warnings,
      keys: await readStatuses(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `Could not write .env.local: ${e.message}` : "Could not write .env.local." },
      { status: 500 },
    );
  }
}
