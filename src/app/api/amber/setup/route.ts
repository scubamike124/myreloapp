import { randomUUID } from "node:crypto";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, logAmberAction, isSuperAdminSession } from "@/lib/amber-autonomous";
import { geminiJson } from "@/lib/amber-weekly";
import { asRecord } from "@/lib/json";

export const runtime = "nodejs";
export const maxDuration = 60;

async function resolveTargetUserId(
  bodyUserId: string | undefined,
  sessionUserId: string,
): Promise<string> {
  if (!bodyUserId || bodyUserId === sessionUserId) return sessionUserId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionUserId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  const url = new URL(req.url);
  const targetUserId = await resolveTargetUserId(url.searchParams.get("userId") || undefined, user.id);

  const emails = (await q`
    SELECT id, email, role, notes, created_at AS "createdAt"
    FROM amber_infra_emails WHERE user_id = ${targetUserId}
    ORDER BY created_at ASC
  `) as Record<string, unknown>[];

  const services = (await q`
    SELECT id, service, status, meta, created_at AS "createdAt"
    FROM amber_service_links WHERE user_id = ${targetUserId}
    ORDER BY created_at ASC
  `) as Record<string, unknown>[];

  const maps = (await q`
    SELECT m.social_account_id AS "socialAccountId", m.infra_role AS "infraRole", m.notes,
           a.provider, a.handle, a.display_name AS "displayName", a.status
    FROM amber_account_map m
    JOIN social_accounts a ON a.id = m.social_account_id
    WHERE m.user_id = ${targetUserId}
  `) as Record<string, unknown>[];

  const accounts = (await q`
    SELECT id, provider, handle, display_name AS "displayName", status
    FROM social_accounts WHERE user_id = ${targetUserId} AND status != 'revoked'
  `) as Record<string, unknown>[];

  const profile = (await q`
    SELECT company, industry, audience, goals, brand_rules AS "brandRules"
    FROM business_profiles WHERE user_id = ${targetUserId} LIMIT 1
  `) as Record<string, unknown>[];

  const kit = (await q`
    SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${targetUserId} LIMIT 1
  `) as Record<string, unknown>[];

  return Response.json({
    ok: true,
    userId: targetUserId,
    profile: profile[0] || null,
    brandKit: kit[0] || null,
    emails,
    services: services.map((s) => ({
      ...s,
      meta: (() => {
        try {
          return typeof s.meta === "string" ? JSON.parse(s.meta) : s.meta;
        } catch {
          return {};
        }
      })(),
    })),
    accountMap: maps,
    accounts,
    note: "Plan + track only — Amber does not provision Google Workspace or Microsoft 365 mailboxes.",
  });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const action = str(body.action, 40) || "generate";

  if (action === "generate") {
    const profile = (await q`
      SELECT company, industry, audience, goals, brand_rules AS "brandRules"
      FROM business_profiles WHERE user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    const kit = (await q`
      SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    const company = String(kit[0]?.brandName || profile[0]?.company || "the business");
    const domainGuess = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "company";

    let plan: Record<string, unknown>;
    try {
      plan = await geminiJson(`You are Amber planning business email/account infrastructure (plan only — do not claim accounts are created).
Brand: ${company}
Industry: ${profile[0]?.industry || ""}
Audience: ${profile[0]?.audience || ""}
Goals: ${profile[0]?.goals || ""}
Brand rules: ${profile[0]?.brandRules || ""}
Extra: ${kit[0]?.extra || ""}

Return JSON:
{
  "summary": "2 sentences",
  "emails": [{"email":"role@${domainGuess}.com","role":"admin|marketing|social|content|other","notes":"..."}],
  "services": [{"service":"google_workspace|microsoft365|other","status":"planned","notes":"..."}],
  "socialMappingHints": [{"provider":"tiktok|instagram|youtube","infraRole":"social","notes":"..."}]
}
Include admin, marketing, social, content emails. Honest: status planned only.`);
    } catch {
      plan = {
        summary: `Recommended mailbox plan for ${company} (tracking only — not provisioned).`,
        emails: [
          { email: `admin@${domainGuess}.com`, role: "admin", notes: "Owner / billing" },
          { email: `marketing@${domainGuess}.com`, role: "marketing", notes: "Campaigns" },
          { email: `social@${domainGuess}.com`, role: "social", notes: "Social ops" },
          { email: `content@${domainGuess}.com`, role: "content", notes: "Creators" },
        ],
        services: [
          { service: "google_workspace", status: "planned", notes: "Owner connects manually" },
          { service: "microsoft365", status: "n/a", notes: "Optional" },
        ],
        socialMappingHints: [
          { provider: "tiktok", infraRole: "social", notes: "Map connected TikTok to social@" },
          { provider: "instagram", infraRole: "social", notes: "Map connected IG to social@" },
          { provider: "youtube", infraRole: "content", notes: "Map connected YT to content@" },
        ],
      };
    }

    const now = new Date().toISOString();
    await q`DELETE FROM amber_infra_emails WHERE user_id = ${targetUserId}`;
    await q`DELETE FROM amber_service_links WHERE user_id = ${targetUserId}`;

    const emailsOut: Record<string, unknown>[] = [];
    const rawEmails = Array.isArray(plan.emails) ? plan.emails : [];
    for (const e of rawEmails.slice(0, 12)) {
      const row = asRecord(e);
      const id = randomUUID();
      const email = String(row.email || "").slice(0, 160);
      const role = String(row.role || "other").slice(0, 40);
      const notes = String(row.notes || "").slice(0, 500);
      if (!email) continue;
      await q`
        INSERT INTO amber_infra_emails (id, user_id, email, role, notes, created_at)
        VALUES (${id}, ${targetUserId}, ${email}, ${role}, ${notes}, ${now})`;
      emailsOut.push({ id, email, role, notes });
    }

    const servicesOut: Record<string, unknown>[] = [];
    const rawServices = Array.isArray(plan.services) ? plan.services : [];
    for (const s of rawServices.slice(0, 8)) {
      const row = asRecord(s);
      const id = randomUUID();
      const service = String(row.service || "other").slice(0, 60);
      const status = String(row.status || "planned").slice(0, 40);
      const meta = JSON.stringify({ notes: String(row.notes || "").slice(0, 500) });
      await q`
        INSERT INTO amber_service_links (id, user_id, service, status, meta, created_at)
        VALUES (${id}, ${targetUserId}, ${service}, ${status}, ${meta}, ${now})`;
      servicesOut.push({ id, service, status, meta: { notes: row.notes } });
    }

    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "setup_generate",
      title: "Amber business setup plan generated",
      detail: { userId: targetUserId, emails: emailsOut.length },
    });

    return Response.json({
      ok: true,
      action,
      summary: plan.summary,
      emails: emailsOut,
      services: servicesOut,
      socialMappingHints: plan.socialMappingHints,
      note: "Saved as plan + track only. No Google/M365 accounts were created.",
    });
  }

  if (action === "save_emails") {
    const list = Array.isArray(body.emails) ? body.emails : [];
    const now = new Date().toISOString();
    await q`DELETE FROM amber_infra_emails WHERE user_id = ${targetUserId}`;
    for (const e of list.slice(0, 20)) {
      const row = asRecord(e);
      const email = str(row.email, 160);
      if (!email) continue;
      await q`
        INSERT INTO amber_infra_emails (id, user_id, email, role, notes, created_at)
        VALUES (
          ${randomUUID()}, ${targetUserId}, ${email},
          ${str(row.role, 40) || "other"}, ${str(row.notes, 500)}, ${now}
        )`;
    }
    return Response.json({ ok: true, action });
  }

  if (action === "map_account") {
    const socialAccountId = str(body.socialAccountId, 80);
    const infraRole = str(body.infraRole, 40) || "social";
    const notes = str(body.notes, 500);
    if (!socialAccountId) {
      return Response.json({ ok: false, error: "socialAccountId required." }, { status: 400 });
    }
    const owns = (await q`
      SELECT id FROM social_accounts WHERE id = ${socialAccountId} AND user_id = ${targetUserId} LIMIT 1
    `) as { id: string }[];
    if (!owns[0]) {
      return Response.json({ ok: false, error: "Account not found for this user." }, { status: 404 });
    }
    await q`DELETE FROM amber_account_map WHERE social_account_id = ${socialAccountId}`;
    await q`
      INSERT INTO amber_account_map (social_account_id, user_id, infra_role, notes)
      VALUES (${socialAccountId}, ${targetUserId}, ${infraRole}, ${notes})`;
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "setup_map_account",
      title: "Mapped social account to infra role",
      detail: { socialAccountId, infraRole },
    });
    return Response.json({ ok: true, action, socialAccountId, infraRole });
  }

  if (action === "set_service_status") {
    const id = str(body.id, 80);
    const status = str(body.status, 40);
    if (!id || !status) {
      return Response.json({ ok: false, error: "id and status required." }, { status: 400 });
    }
    await q`
      UPDATE amber_service_links SET status = ${status}
      WHERE id = ${id} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, action, id, status });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
