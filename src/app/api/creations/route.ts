import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sql } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { store, remove, storageDriver, RETENTION_DAYS } from "@/lib/storage";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

// ---------------------------------------------------------------------------
// A signed-in user's finished work.
//
// Videos are kept for RETENTION_DAYS (30 by default) and then deleted. That
// window is what makes storing them practical without a storage bill that grows
// forever — and because it is a promise to the customer, it is enforced by an
// actual sweep and stated plainly in the UI, not left as small print.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BODY = 64 * 1024 * 1024;

/**
 * Delete anything past its retention date, files included.
 *
 * Run opportunistically on read rather than on a schedule: this app has no
 * cron, and a sweep that only happens when someone looks at their library is
 * far better than one that never happens. Throttled so a burst of requests
 * does not each trigger a scan.
 */
let lastSweep = 0;
async function sweep(): Promise<void> {
  if (Date.now() - lastSweep < 10 * 60_000) return;
  lastSweep = Date.now();

  const q = sql();
  if (!q) return;
  try {
    const now = new Date().toISOString();
    const expired = (await q`
      SELECT id, kind FROM creations WHERE expires_at IS NOT NULL AND expires_at < ${now} LIMIT 500
    `) as { id: string; kind: string }[];
    for (const row of expired) await remove(row.id, row.kind);
    if (expired.length > 0) {
      await q`DELETE FROM creations WHERE expires_at IS NOT NULL AND expires_at < ${now}`;
    }
  } catch {
    /* a failed sweep must never break someone's library */
  }
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, creations: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, creations: [] });

  const q = sql();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, creations: [] });

  await sweep();

  const rows = await q`
    SELECT id, tool_slug AS "toolSlug", tool_title AS "toolTitle", title, status, kind,
           media_url AS "mediaUrl", error, created_at AS "createdAt", expires_at AS "expiresAt"
    FROM creations
    WHERE user_id = ${user.id}
      AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
    ORDER BY created_at DESC
    LIMIT 200`;

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    storage: storageDriver(),
    retentionDays: RETENTION_DAYS,
    creations: rows,
  });
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return Response.json({ ok: false, error: "Accounts aren't set up yet." }, { status: 503 });
  }
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Sign in to keep your videos." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json(
      { ok: false, error: tooBig ? "That file is too large to store." : "Invalid request." },
      { status: tooBig ? 413 : 400 },
    );
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const id = randomUUID();
  const toolSlug = str(body.toolSlug, 60);
  const kind = str(body.kind, 20) === "image" ? "image" : "video";
  const source = str(body.mediaUrl, 90_000_000);

  if (!toolSlug) return Response.json({ ok: false, error: "Missing tool." }, { status: 400 });

  let mediaUrl: string | null = null;
  let bytes: number | null = null;
  if (source) {
    const stored = await store(source, id, kind);
    if (stored) {
      mediaUrl = stored.url;
      bytes = stored.bytes;
    } else if (!source.startsWith("data:")) {
      // No storage configured: keep the provider link rather than nothing,
      // while being clear it may expire sooner than we would.
      mediaUrl = source;
    }
  }

  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 86400_000).toISOString();

  const q = sql();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  await q`
    INSERT INTO creations (id, user_id, tool_slug, tool_title, title, status, kind, media_url, bytes, error, expires_at)
    VALUES (${id}, ${user.id}, ${toolSlug}, ${str(body.toolTitle, 80) || toolSlug},
            ${str(body.title, 200) || "Untitled"}, ${str(body.status, 20) || "completed"},
            ${kind}, ${mediaUrl}, ${bytes}, ${str(body.error, 300) || null}, ${expiresAt})`;

  return Response.json({
    ok: true,
    id,
    mediaUrl,
    expiresAt,
    retentionDays: RETENTION_DAYS,
    // Said plainly so the UI can tell the truth about how durable this is.
    durable: Boolean(bytes),
  });
}
