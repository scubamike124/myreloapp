import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

const MAX_PENDING = 10;

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    memberEmail: r.memberEmail,
    memberUserId: r.memberUserId ?? null,
    role: r.role,
    status: r.status,
    createdAt: r.createdAt,
  };
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, members: [] });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, members: [] });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return Response.json({ ok: true, configured: false, members: [] });

  const rows = (await q`
    SELECT id, member_email AS "memberEmail", member_user_id AS "memberUserId",
           role, status, created_at AS "createdAt"
    FROM team_members
    WHERE owner_user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 100
  `) as Record<string, unknown>[];

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    members: rows.map(mapRow),
    note: "In-app roster only — invitees must already have a Reelo account. No invite email and no billed seats yet.",
  });
}

export async function POST(req: Request) {
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

  const email = str(body.email, 200).toLowerCase();
  if (!email.includes("@") || email.length < 5) {
    return Response.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }
  if (email === user.email.toLowerCase()) {
    return Response.json({ ok: false, error: "You already own this workspace." }, { status: 400 });
  }

  const pending = (await q`
    SELECT COUNT(*) AS c FROM team_members
    WHERE owner_user_id = ${user.id} AND status = 'pending'
  `) as { c: number | string }[];
  if (Number(pending[0]?.c ?? 0) >= MAX_PENDING) {
    return Response.json({ ok: false, error: `At most ${MAX_PENDING} pending invites.` }, { status: 400 });
  }

  const dup = (await q`
    SELECT id FROM team_members
    WHERE owner_user_id = ${user.id} AND lower(member_email) = ${email}
    LIMIT 1
  `) as { id: string }[];
  if (dup[0]) {
    return Response.json({ ok: false, error: "That email is already invited." }, { status: 400 });
  }

  const match = (await q`
    SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1
  `) as { id: string }[];
  const memberUserId = match[0]?.id ?? null;
  if (!memberUserId) {
    return Response.json(
      {
        ok: false,
        error: "That person needs a Reelo account first. Invite emails are not sent yet.",
      },
      { status: 400 },
    );
  }
  const status = "active";
  const id = randomUUID();
  const now = new Date().toISOString();

  await q`
    INSERT INTO team_members (id, owner_user_id, member_email, member_user_id, role, status, created_at)
    VALUES (${id}, ${user.id}, ${email}, ${memberUserId}, ${"member"}, ${status}, ${now})`;

  const nid = randomUUID();
  await q`
    INSERT INTO notifications (id, user_id, kind, title, body, href, read_at, created_at)
    VALUES (
      ${nid}, ${memberUserId}, ${"team_invite"},
      ${"Workspace invite"},
      ${`${user.email} added you to their Business Center workspace.`},
      ${"/business-center/team"},
      ${null}, ${now}
    )`;

  return Response.json({
    ok: true,
    member: { id, memberEmail: email, memberUserId, role: "member", status, createdAt: now },
  });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  await q`DELETE FROM team_members WHERE id = ${id} AND owner_user_id = ${user.id}`;
  return Response.json({ ok: true });
}
