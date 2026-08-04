import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { remove, RETENTION_DAYS, storageDriver } from "@/lib/storage";
import { requireUser, str } from "@/lib/workspace-api";

export const runtime = "nodejs";

function formatBytes(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} GB`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} MB`;
  if (n >= 1000) return `${Math.round(n / 1000)} KB`;
  return `${n} B`;
}

export async function GET() {
  if (!dbConfigured()) {
    return Response.json({ ok: true, configured: false, items: [], summary: null });
  }
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: true, configured: true, signedIn: false, items: [], summary: null });
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, items: [], summary: null });
  }

  const rows = (await q`
    SELECT id, tool_title AS "toolTitle", title, status, kind, media_url AS "mediaUrl",
           bytes, created_at AS "createdAt", expires_at AS "expiresAt"
    FROM creations
    WHERE user_id = ${user.id}
      AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
    ORDER BY created_at DESC
    LIMIT 200
  `) as {
    id: string;
    toolTitle: string;
    title: string;
    status: string;
    kind: string;
    mediaUrl: string | null;
    bytes: number | null;
    createdAt: string;
    expiresAt: string | null;
  }[];

  let totalBytes = 0;
  let videos = 0;
  let images = 0;
  for (const r of rows) {
    totalBytes += Number(r.bytes ?? 0);
    if (r.kind === "video") videos++;
    else images++;
  }

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    storage: storageDriver(),
    retentionDays: RETENTION_DAYS,
    summary: {
      count: rows.length,
      videos,
      images,
      bytes: totalBytes,
      bytesLabel: formatBytes(totalBytes),
    },
    items: rows,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  const rows = (await q`
    SELECT id, kind FROM creations WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
  `) as { id: string; kind: string }[];
  if (!rows[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });

  await remove(rows[0].id, rows[0].kind);
  await q`DELETE FROM creations WHERE id = ${id} AND user_id = ${user.id}`;
  return Response.json({ ok: true });
}
