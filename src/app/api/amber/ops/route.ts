import { randomUUID } from "node:crypto";
import { requireUser, str, parsePlatforms, type Sql } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { asRecord, errorMessage, geminiParts } from "@/lib/json";
import { requireAmberAutonomous, logAmberAction } from "@/lib/amber-autonomous";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

async function loadBrandAndAccounts(userId: string, q: Sql) {
  const kit = (await q`
    SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${userId} LIMIT 1
  `) as { brandName: string | null; extra: string | null }[];
  const profile = (await q`
    SELECT company, industry, audience, style, goals, brand_rules AS "brandRules",
           approval_mode AS "approvalMode"
    FROM business_profiles WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const accounts = (await q`
    SELECT id, provider, handle, display_name AS "displayName"
    FROM social_accounts WHERE user_id = ${userId} AND status = 'connected'
  `) as { id: string; provider: string; handle: string; displayName: string }[];
  return { kit: kit[0], profile: profile[0], accounts };
}

async function geminiJson(prompt: string): Promise<Record<string, unknown>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
    }),
  });
  const data = asRecord(await res.json());
  if (!res.ok) throw new Error(errorMessage(data, "Gemini error"));
  const text = geminiParts(data)
    .map((p) => (typeof p === "object" && p && "text" in p ? String((p as { text?: string }).text || "") : ""))
    .join("\n")
    .trim();
  const parsed = asRecord(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")));
  return parsed;
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
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const action = str(body.action, 40);
  const ctx = await loadBrandAndAccounts(user.id, q);
  const brandLine = [
    ctx.kit?.brandName,
    ctx.profile?.company,
    ctx.profile?.industry,
    ctx.profile?.audience,
    ctx.profile?.style,
    ctx.profile?.goals,
    ctx.profile?.brandRules,
    ctx.kit?.extra,
  ]
    .filter(Boolean)
    .join(" | ");
  const accountLine =
    ctx.accounts.length === 0
      ? "No social accounts connected yet (owner must connect existing accounts)."
      : ctx.accounts.map((a) => `${a.provider}:@${a.handle} (${a.id})`).join("; ");

  try {
    if (action === "ideas" || action === "strategy") {
      const data = await geminiJson(`You are Amber, an AI social media employee for Reelo.
Manage EXISTING social accounts only — never suggest creating new platform accounts or usernames to register.
Brand/business context: ${brandLine || "not set"}
Connected accounts: ${accountLine}

Return JSON:
{
  "strategySummary": "2-4 sentences",
  "pillars": ["..."],
  "ideas": [{"title":"...","format":"short|avatar|product","why":"...","suggestedAccounts":["provider:handle"]}],
  "postingPlan": [{"day":1,"theme":"...","hook":"..."}],
  "recommendedTimes": ["e.g. weekdays 11:00 local","..."]
}
postingPlan: 7 items. ideas: 5-8. Do not invent follower counts.`);
      await logAmberAction({
        actorUserId: user.id,
        actorEmail: user.email,
        kind: "strategy",
        title: "Amber strategy generated",
        detail: { action },
      });
      return Response.json({ ok: true, action, ...data });
    }

    if (action === "captions" || action === "hashtags") {
      const topic = str(body.topic, 400) || str(body.title, 160);
      if (!topic) return Response.json({ ok: false, error: "Need a topic or title." }, { status: 400 });
      const data = await geminiJson(`Write social captions/hashtags for an existing brand.
Topic: ${topic}
Brand: ${brandLine || "general"}
Accounts: ${accountLine}
Return JSON: { "captions": ["...","...","..."], "hashtags": ["tag","tag"] }
No # in hashtags. Never invent engagement metrics.`);
      await logAmberAction({
        actorUserId: user.id,
        actorEmail: user.email,
        kind: action,
        title: `Amber ${action} for “${topic.slice(0, 80)}”`,
        detail: { action },
      });
      return Response.json({ ok: true, action, captions: data.captions, hashtags: data.hashtags });
    }

    if (action === "recommend_times") {
      const data = await geminiJson(`Recommend posting times for short-form video.
Brand: ${brandLine}
Accounts: ${accountLine}
Return JSON: { "windows": [{"label":"...","reason":"..."}], "notes":"..." }
No fake analytics — general best-practice only.`);
      return Response.json({ ok: true, action, ...data });
    }

    if (action === "place_on_calendar" || action === "place_in_queue") {
      const title = str(body.title, 160) || "Amber draft";
      const caption = str(body.caption, 4000);
      const hashtags = Array.isArray(body.hashtags)
        ? body.hashtags.map((h) => str(h, 40)).filter(Boolean).slice(0, 20)
        : [];
      const creationId = str(body.creationId, 80) || null;
      const accountIds = (Array.isArray(body.accountIds) ? body.accountIds : [])
        .map((id) => str(id, 80))
        .filter(Boolean)
        .slice(0, 12);
      const platforms = parsePlatforms(body.platforms);
      const approvalMode = String(ctx.profile?.approvalMode || "require");
      const approvalStatus = approvalMode === "auto" ? "approved" : "pending_approval";
      const now = new Date().toISOString();

      if (action === "place_on_calendar") {
        const scheduledAt = str(body.scheduledAt, 40) || new Date(Date.now() + 86400_000).toISOString();
        if (Number.isNaN(Date.parse(scheduledAt))) {
          return Response.json({ ok: false, error: "Invalid scheduledAt." }, { status: 400 });
        }
        const id = randomUUID();
        await q`
          INSERT INTO schedule_items (
            id, user_id, creation_id, title, platforms, scheduled_at, status, notes,
            approval_status, amber_placed, caption, hashtags, created_at
          ) VALUES (
            ${id}, ${user.id}, ${creationId}, ${title}, ${JSON.stringify(platforms)},
            ${scheduledAt}, ${"planned"}, ${"Placed by Amber"},
            ${approvalStatus}, ${true}, ${caption}, ${hashtags.join(" ")}, ${now}
          )`;
        for (const aid of accountIds) {
          const owns = (await q`
            SELECT id FROM social_accounts WHERE id = ${aid} AND user_id = ${user.id} AND status = 'connected' LIMIT 1
          `) as { id: string }[];
          if (owns[0]) {
            await q`
              INSERT INTO schedule_account_targets (schedule_item_id, social_account_id)
              VALUES (${id}, ${aid})
              ON CONFLICT DO NOTHING`;
          }
        }
        await q`
          INSERT INTO notifications (id, user_id, kind, title, body, href, read_at, created_at)
          VALUES (
            ${randomUUID()}, ${user.id}, ${"amber_schedule"},
            ${"Amber placed a post on your calendar"},
            ${`“${title}” is ${approvalStatus === "approved" ? "auto-approved" : "waiting for your approval"}.`},
            ${`/business-center/scheduling#${id}`}, ${null}, ${now}
          )`;
        await logAmberAction({
          actorUserId: user.id,
          actorEmail: user.email,
          kind: "place_on_calendar",
          title: `Amber placed “${title}” on calendar`,
          detail: { scheduleId: id, approvalStatus, accountIds },
          href: `/business-center/scheduling#${id}`,
        });
        return Response.json({ ok: true, action, scheduleId: id, approvalStatus });
      }

      const id = randomUUID();
      await q`
        INSERT INTO publish_items (
          id, user_id, creation_id, title, caption, platforms, status, updated_at, created_at,
          account_ids, approval_status
        ) VALUES (
          ${id}, ${user.id}, ${creationId}, ${title}, ${caption}, ${JSON.stringify(platforms)},
          ${approvalStatus === "approved" ? "ready" : "draft"}, ${now}, ${now},
          ${JSON.stringify(accountIds)}, ${approvalStatus}
        )`;
      for (const aid of accountIds) {
        const owns = (await q`
          SELECT id FROM social_accounts WHERE id = ${aid} AND user_id = ${user.id} AND status = 'connected' LIMIT 1
        `) as { id: string }[];
        if (owns[0]) {
          await q`
            INSERT INTO publish_account_targets (publish_item_id, social_account_id)
            VALUES (${id}, ${aid})
            ON CONFLICT DO NOTHING`;
        }
      }
      await logAmberAction({
        actorUserId: user.id,
        actorEmail: user.email,
        kind: "place_in_queue",
        title: `Amber placed “${title}” in publish queue`,
        detail: { publishId: id, approvalStatus, accountIds },
        href: `/business-center/publish#${id}`,
      });
      return Response.json({ ok: true, action, publishId: id, approvalStatus });
    }

    if (action === "assign_accounts") {
      const scheduleId = str(body.scheduleId, 80);
      const publishId = str(body.publishId, 80);
      const accountIds = (Array.isArray(body.accountIds) ? body.accountIds : [])
        .map((id) => str(id, 80))
        .filter(Boolean)
        .slice(0, 12);
      if (!scheduleId && !publishId) {
        return Response.json({ ok: false, error: "Need scheduleId or publishId." }, { status: 400 });
      }
      if (scheduleId) {
        await q`DELETE FROM schedule_account_targets WHERE schedule_item_id = ${scheduleId}`;
        for (const aid of accountIds) {
          const owns = (await q`
            SELECT id FROM social_accounts WHERE id = ${aid} AND user_id = ${user.id} LIMIT 1
          `) as { id: string }[];
          if (owns[0]) {
            await q`INSERT INTO schedule_account_targets (schedule_item_id, social_account_id) VALUES (${scheduleId}, ${aid}) ON CONFLICT DO NOTHING`;
          }
        }
      }
      if (publishId) {
        await q`UPDATE publish_items SET account_ids = ${JSON.stringify(accountIds)} WHERE id = ${publishId} AND user_id = ${user.id}`;
        await q`DELETE FROM publish_account_targets WHERE publish_item_id = ${publishId}`;
        for (const aid of accountIds) {
          await q`INSERT INTO publish_account_targets (publish_item_id, social_account_id) VALUES (${publishId}, ${aid}) ON CONFLICT DO NOTHING`;
        }
      }
      await logAmberAction({
        actorUserId: user.id,
        actorEmail: user.email,
        kind: "assign_accounts",
        title: "Amber assigned social accounts",
        detail: { scheduleId, publishId, accountIds },
      });
      return Response.json({ ok: true, action, accountIds });
    }

    return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Amber ops failed." }, { status: 500 });
  }
}
