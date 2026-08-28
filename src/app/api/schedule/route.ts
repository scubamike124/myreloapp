import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str, parsePlatforms, parseJsonArray } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Command Center variant — a separate scheduled_posts table, not the
// schedule_items table the customer-facing handlers below use. Michael's
// Command Center session is not a customer workspace (see
// src/lib/ai/admin-account.ts's system-user pattern), so this is its own
// simple queue rather than reusing schedule_items's richer, workspace-scoped
// shape. No collision: scheduled_posts is a new table, created alongside
// schedule_items in db.ts's ensureWorkspaceTables().
// ---------------------------------------------------------------------------

const CC_PLATFORMS = ["tiktok", "instagram", "youtube", "facebook", "x"] as const;
type CcPlatform = (typeof CC_PLATFORMS)[number];

type ScheduledPostRow = {
  id: string;
  media_id: string | null;
  caption: string;
  platforms: string;
  scheduled_at: string;
  status: string;
  external_id: string | null;
  error: string | null;
  created_at: string;
};

const shapeScheduledPost = (r: ScheduledPostRow) => ({
  id: r.id,
  mediaId: r.media_id,
  caption: r.caption,
  platforms: r.platforms ? r.platforms.split(",").filter(Boolean) : [],
  scheduledAt: r.scheduled_at,
  status: r.status,
  externalId: r.external_id,
  error: r.error,
  createdAt: r.created_at,
});

export type ScheduledPost = ReturnType<typeof shapeScheduledPost>;

export async function listScheduledPostsFor(userId: string): Promise<ScheduledPost[]> {
  if (!dbConfigured()) return [];
  await ensureSchema();
  const q = await sqlAsync();
  if (!q) return [];
  const rows = (await q`
    SELECT id, media_id, caption, platforms, scheduled_at, status, external_id, error, created_at
    FROM scheduled_posts
    WHERE user_id = ${userId}
    ORDER BY scheduled_at ASC
    LIMIT 500
  `) as ScheduledPostRow[];
  return rows.map(shapeScheduledPost);
}

export type QueuePostInput = { userId: string; caption: string; mediaId: string | null; platforms: string[]; scheduledAt: string };
export type QueuePostResult =
  | { ok: true; id: string; scheduledAt: string; platforms: string[]; status: "queued"; note: string }
  | { ok: false; error: string };

export async function queuePostFor(input: QueuePostInput): Promise<QueuePostResult> {
  if (!dbConfigured()) return { ok: false, error: "No database is configured." };
  await ensureSchema();

  const platforms = [...new Set(input.platforms.map((p) => p.toLowerCase()))].filter((p): p is CcPlatform =>
    (CC_PLATFORMS as readonly string[]).includes(p),
  );
  if (platforms.length === 0) return { ok: false, error: `Choose at least one platform: ${CC_PLATFORMS.join(", ")}.` };
  if (!input.caption && !input.mediaId) return { ok: false, error: "Add a caption or a media id." };

  const at = new Date(input.scheduledAt);
  if (!input.scheduledAt || Number.isNaN(at.getTime())) return { ok: false, error: "That date and time could not be read." };
  if (at.getTime() < Date.now() - 60_000) return { ok: false, error: "That time is in the past." };

  const q = await sqlAsync();
  if (!q) return { ok: false, error: "No database is configured." };

  if (input.mediaId) {
    const owned = (await q`SELECT id FROM creations WHERE id = ${input.mediaId} AND user_id = ${input.userId}`) as { id: string }[];
    if (owned.length === 0) return { ok: false, error: "That media id is not in the Command Center's library." };
  }

  const id = randomUUID();
  const iso = at.toISOString();
  await q`
    INSERT INTO scheduled_posts (id, user_id, media_id, caption, platforms, scheduled_at, status)
    VALUES (${id}, ${input.userId}, ${input.mediaId}, ${input.caption}, ${platforms.join(",")}, ${iso}, 'queued')
  `;
  return { ok: true, id, scheduledAt: iso, platforms, status: "queued", note: "Queued. Connect the channel to publish automatically." };
}

export async function cancelScheduledPostFor(userId: string, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!dbConfigured()) return { ok: false, error: "No database is configured." };
  await ensureSchema();
  const q = await sqlAsync();
  if (!q) return { ok: false, error: "No database is configured." };
  await q`DELETE FROM scheduled_posts WHERE id = ${id} AND user_id = ${userId}`;
  return { ok: true };
}

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
