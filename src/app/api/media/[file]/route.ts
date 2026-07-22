import { readFile } from "node:fs/promises";
import path from "node:path";
import { mediaDir } from "@/lib/storage";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

// ---------------------------------------------------------------------------
// Serves a stored video or image.
//
// Files are served through a route rather than as static assets so retention is
// enforced on read as well as by the sweep: a creation past its expiry is gone
// the moment someone asks for it, even if the sweep has not run yet.
//
// The id is a UUID, so the URL is unguessable — but that is obscurity, not
// authorisation, and it is stated here rather than assumed. Anyone with the
// link can view it, which is what makes sharing a video with a grandparent
// work without an account.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

const TYPES: Record<string, string> = { mp4: "video/mp4", png: "image/png", webp: "image/webp", jpg: "image/jpeg" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // Only a bare "<uuid>.<ext>" is acceptable; anything with a separator could
  // walk out of the media directory.
  const match = /^([0-9a-f-]{36})\.(mp4|png|webp|jpg)$/i.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  const [, id, ext] = match;

  if (dbConfigured() && (await ensureSchema())) {
    const q = sql();
    if (q) {
      const rows = (await q`SELECT expires_at AS "expiresAt" FROM creations WHERE id = ${id}`) as {
        expiresAt: string | null;
      }[];
      const row = rows[0];
      if (row?.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
        return new Response("This video has expired.", { status: 410 });
      }
    }
  }

  try {
    const body = await readFile(path.join(mediaDir(), `${id}.${ext}`));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": TYPES[ext.toLowerCase()] ?? "application/octet-stream",
        "Content-Length": String(body.length),
        // Cached hard, because the URL is unique per creation and the content
        // never changes — only its existence does.
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
