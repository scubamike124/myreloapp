import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str, parsePlatforms, parseJsonArray } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

const STATUSES = new Set(["planned", "due", "done", "cancelled"]);

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    creationId: r.creationId ?? null,
    title: r.title,
    platforms: parseJsonArray(r.platforms),
    scheduledAt: r.scheduledAt,
    status: r.status,
    notes: r.notes ?? "",
    approvalStatus: r.approvalStatus ?? "draft",
    amberPlaced: Boolean(r.amberPlaced),
    caption: r.caption ?? "",
    hashtags: r.hashtags ?? "",
    publishResult: r.publishResult ?? null,
    createdAt: r.createdAt,
  };
}

async function maybeNotifyDue(userId: string, q: NonNullable<Awaited<ReturnType<typeof sqlAsync>>>) {
  const now = new Date().toISOString();
  const due = (await q`
    SELECT id, title FROM schedule_items
    WHERE user_id = ${userId} AND status = 'planned' AND scheduled_at <= ${now}
    LIMIT 20
  `) as { id: string; title: string }[];

  for (const item of due) {
    await q`UPDATE schedule_items SET status = 'due' WHERE id = ${item.id} AND user_id = ${userId}`;
    const exists = (await q`
      SELECT id FROM notifications
      WHERE user_id = ${userId} AND kind = 'schedule_due' AND href = ${`/business-center/scheduling#${item.id}`}
      LIMIT 1
    `) as { id: string }[];
    if (exists[0]) continue;
    const nid = randomUUID();
    await q`
      INSERT INTO notifications (id, user_id, kind, title, body, href, read_at, created_at)
      VALUES (
        ${nid}, ${userId}, ${"schedule_due"},
        ${"Scheduled item is due"},
        ${`“${item.title}” is due — export and post on the platform yourself.`},
        ${`/business-center/scheduling#${item.id}`},
        ${null}, ${now}
      )`;
  }
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, items: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, items: [] });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, items: [] });

  await maybeNotifyDue(user.id, q);

  const rows = (await q`
    SELECT id, creation_id AS "creationId", title, platforms, scheduled_at AS "scheduledAt",
           status, notes, created_at AS "createdAt",
           approval_status AS "approvalStatus", amber_placed AS "amberPlaced",
           caption, hashtags, publish_result AS "publishResult"
    FROM schedule_items
    WHERE user_id = ${user.id}
    ORDER BY scheduled_at ASC
    LIMIT 500
  `) as Record<string, unknown>[];

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    items: rows.map(mapRow),
    note: "Content calendar for your posting intent — Reelo does not auto-post to social platforms.",
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
  const notes = str(body.notes, 2000);
  const creationId = str(body.creationId, 80) || null;
  const platforms = parsePlatforms(body.platforms);
  const scheduledAt = str(body.scheduledAt, 40);
  if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
    return Response.json({ ok: false, error: "Pick a valid date and time." }, { status: 400 });
  }
  const status = STATUSES.has(str(body.status, 20)) ? str(body.status, 20) : "planned";
  const id = randomUUID();
  const now = new Date().toISOString();

  await q`
    INSERT INTO schedule_items (id, user_id, creation_id, title, platforms, scheduled_at, status, notes, created_at)
    VALUES (${id}, ${user.id}, ${creationId}, ${title}, ${JSON.stringify(platforms)}, ${scheduledAt}, ${status}, ${notes}, ${now})`;

  return Response.json({
    ok: true,
    item: { id, creationId, title, platforms, scheduledAt, status, notes, createdAt: now },
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
    SELECT id, creation_id AS "creationId", title, platforms, scheduled_at AS "scheduledAt", status, notes,
           approval_status AS "approvalStatus", caption, hashtags
    FROM schedule_items WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
  `) as Record<string, unknown>[];
  if (!existing[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });

  const cur = existing[0];
  const title = body.title !== undefined ? str(body.title, 160) || "Untitled" : String(cur.title);
  const notes = body.notes !== undefined ? str(body.notes, 2000) : String(cur.notes ?? "");
  const creationId =
    body.creationId !== undefined ? str(body.creationId, 80) || null : (cur.creationId as string | null);
  const platforms = body.platforms !== undefined ? parsePlatforms(body.platforms) : parseJsonArray(cur.platforms);
  let scheduledAt = String(cur.scheduledAt);
  if (body.scheduledAt !== undefined) {
    const next = str(body.scheduledAt, 40);
    if (!next || Number.isNaN(Date.parse(next))) {
      return Response.json({ ok: false, error: "Pick a valid date and time." }, { status: 400 });
    }
    scheduledAt = next;
  }
  const status =
    body.status !== undefined && STATUSES.has(str(body.status, 20)) ? str(body.status, 20) : String(cur.status);
  const APPROVAL = new Set(["draft", "pending_approval", "approved", "rejected", "publishing", "published", "failed"]);
  const approvalStatus =
    body.approvalStatus !== undefined && APPROVAL.has(str(body.approvalStatus, 40))
      ? str(body.approvalStatus, 40)
      : String(cur.approvalStatus ?? "draft");
  const caption = body.caption !== undefined ? str(body.caption, 4000) : String(cur.caption ?? "");
  const hashtags = body.hashtags !== undefined ? str(body.hashtags, 1000) : String(cur.hashtags ?? "");

  await q`
    UPDATE schedule_items
    SET title = ${title}, notes = ${notes}, creation_id = ${creationId},
        platforms = ${JSON.stringify(platforms)}, scheduled_at = ${scheduledAt}, status = ${status},
        approval_status = ${approvalStatus}, caption = ${caption}, hashtags = ${hashtags}
    WHERE id = ${id} AND user_id = ${user.id}`;

  return Response.json({
    ok: true,
    item: { id, creationId, title, platforms, scheduledAt, status, notes, approvalStatus, caption, hashtags },
  });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  await q`DELETE FROM schedule_items WHERE id = ${id} AND user_id = ${user.id}`;
  return Response.json({ ok: true });
}
