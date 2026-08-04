import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { balanceOf } from "@/lib/tokens";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

async function seedLowBalance(userId: string, q: NonNullable<Awaited<ReturnType<typeof sqlAsync>>>) {
  const bal = await balanceOf(userId);
  if (bal > 5) return;
  const exists = (await q`
    SELECT id FROM notifications
    WHERE user_id = ${userId} AND kind = 'low_balance'
      AND created_at > ${new Date(Date.now() - 7 * 86400_000).toISOString()}
    LIMIT 1
  `) as { id: string }[];
  if (exists[0]) return;
  const nid = randomUUID();
  const now = new Date().toISOString();
  await q`
    INSERT INTO notifications (id, user_id, kind, title, body, href, read_at, created_at)
    VALUES (
      ${nid}, ${userId}, ${"low_balance"},
      ${"Low token balance"},
      ${`You have ${bal} tokens left. Top up to keep creating.`},
      ${"/pricing"},
      ${null}, ${now}
    )`;
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, notifications: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, notifications: [] });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, notifications: [] });

  await seedLowBalance(user.id, q);

  const rows = (await q`
    SELECT id, kind, title, body, href, read_at AS "readAt", created_at AS "createdAt"
    FROM notifications
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 100
  `) as Record<string, unknown>[];

  const unread = rows.filter((r) => !r.readAt).length;

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    unread,
    notifications: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body ?? "",
      href: r.href ?? null,
      readAt: r.readAt ?? null,
      createdAt: r.createdAt,
    })),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 8_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const now = new Date().toISOString();
  if (body.all === true) {
    await q`UPDATE notifications SET read_at = ${now} WHERE user_id = ${user.id} AND read_at IS NULL`;
    return Response.json({ ok: true });
  }

  const id = str(body.id, 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  await q`UPDATE notifications SET read_at = ${now} WHERE id = ${id} AND user_id = ${user.id}`;
  return Response.json({ ok: true });
}
