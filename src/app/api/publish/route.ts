import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str, parsePlatforms, parseJsonArray } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

const STATUSES = new Set(["draft", "ready", "exported"]);

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    creationId: r.creationId ?? null,
    title: r.title,
    caption: r.caption ?? "",
    platforms: parseJsonArray(r.platforms),
    status: r.status,
    updatedAt: r.updatedAt,
    createdAt: r.createdAt,
  };
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, items: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, items: [] });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, items: [] });

  const rows = (await q`
    SELECT id, creation_id AS "creationId", title, caption, platforms, status,
           updated_at AS "updatedAt", created_at AS "createdAt"
    FROM publish_items
    WHERE user_id = ${user.id}
    ORDER BY updated_at DESC
    LIMIT 200
  `) as Record<string, unknown>[];

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    items: rows.map(mapRow),
    note: "Prepare captions and mark items exported after you download — platforms are not auto-posted.",
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const title = str(body.title, 160) || "Untitled";
  const caption = str(body.caption, 4000);
  const creationId = str(body.creationId, 80) || null;
  const platforms = parsePlatforms(body.platforms);
  const status = STATUSES.has(str(body.status, 20)) ? str(body.status, 20) : "draft";
  const id = randomUUID();
  const now = new Date().toISOString();

  await q`
    INSERT INTO publish_items (id, user_id, creation_id, title, caption, platforms, status, updated_at, created_at)
    VALUES (${id}, ${user.id}, ${creationId}, ${title}, ${caption}, ${JSON.stringify(platforms)}, ${status}, ${now}, ${now})`;

  return Response.json({
    ok: true,
    item: { id, creationId, title, caption, platforms, status, updatedAt: now, createdAt: now },
  });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const id = str(body.id, 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  const existing = (await q`
    SELECT id, creation_id AS "creationId", title, caption, platforms, status
    FROM publish_items WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
  `) as Record<string, unknown>[];
  if (!existing[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });

  const cur = existing[0];
  const title = body.title !== undefined ? str(body.title, 160) || "Untitled" : String(cur.title);
  const caption = body.caption !== undefined ? str(body.caption, 4000) : String(cur.caption ?? "");
  const creationId =
    body.creationId !== undefined ? str(body.creationId, 80) || null : (cur.creationId as string | null);
  const platforms = body.platforms !== undefined ? parsePlatforms(body.platforms) : parseJsonArray(cur.platforms);
  const status =
    body.status !== undefined && STATUSES.has(str(body.status, 20)) ? str(body.status, 20) : String(cur.status);
  const now = new Date().toISOString();

  await q`
    UPDATE publish_items
    SET title = ${title}, caption = ${caption}, creation_id = ${creationId},
        platforms = ${JSON.stringify(platforms)}, status = ${status}, updated_at = ${now}
    WHERE id = ${id} AND user_id = ${user.id}`;

  return Response.json({
    ok: true,
    item: { id, creationId, title, caption, platforms, status, updatedAt: now },
  });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  await q`DELETE FROM publish_items WHERE id = ${id} AND user_id = ${user.id}`;
  return Response.json({ ok: true });
}
