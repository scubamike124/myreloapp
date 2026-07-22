import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sql } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { store, storageConfigured } from "@/lib/storage";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

// ---------------------------------------------------------------------------
// A signed-in user's finished work, kept server-side.
//
// The Library has always lived in localStorage, which means a customer loses
// everything by clearing their browser or picking up a different device. This
// stores the record — and, when blob storage is configured, the file itself —
// so what they paid for survives.
//
// Signed out, or with no database, this reports unavailable and the browser
// copy remains the only one. Nothing regresses; it simply is not durable.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

// A base64 video can be large; the cap protects the function's memory.
const MAX_BODY = 64 * 1024 * 1024;

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, creations: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, creations: [] });

  const q = sql();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, creations: [] });

  const rows = await q`
    SELECT id, tool_slug AS "toolSlug", tool_title AS "toolTitle", title, status, kind,
           media_url AS "mediaUrl", error, created_at AS "createdAt"
    FROM creations
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 200`;

  return Response.json({ ok: true, configured: true, signedIn: true, durable: storageConfigured(), creations: rows });
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
  const source = str(body.mediaUrl, 90_000_000);

  if (!toolSlug) return Response.json({ ok: false, error: "Missing tool." }, { status: 400 });

  // Move the bytes somewhere permanent. The key includes a UUID so a public
  // blob URL cannot be guessed from another user's.
  let mediaUrl: string | null = null;
  let bytes: number | null = null;
  if (source) {
    const ext = str(body.kind, 10) === "image" ? "png" : "mp4";
    const stored = await store(source, `creations/${user.id}/${id}.${ext}`);
    if (stored) {
      mediaUrl = stored.url;
      bytes = stored.bytes;
    } else if (!source.startsWith("data:")) {
      // No blob storage configured: keep a provider link rather than nothing,
      // while being clear it may expire.
      mediaUrl = source;
    }
  }

  const q = sql();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  await q`
    INSERT INTO creations (id, user_id, tool_slug, tool_title, title, status, kind, media_url, bytes, error)
    VALUES (${id}, ${user.id}, ${toolSlug}, ${str(body.toolTitle, 80) || toolSlug},
            ${str(body.title, 200) || "Untitled"}, ${str(body.status, 20) || "completed"},
            ${str(body.kind, 20) || "video"}, ${mediaUrl}, ${bytes}, ${str(body.error, 300) || null})`;

  return Response.json({
    ok: true,
    id,
    mediaUrl,
    // Said plainly so the UI can tell the user whether this will actually last.
    durable: Boolean(bytes),
  });
}
