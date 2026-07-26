import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { decryptToken } from "@/lib/social/tokens";
import { publishToProvider } from "@/lib/social/publish";
import type { SocialProvider } from "@/lib/social/providers";
import { requireAmberAutonomous, logAmberAction } from "@/lib/amber-autonomous";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const scheduleId = str(body.scheduleId, 80);
  if (!scheduleId) return Response.json({ ok: false, error: "Missing scheduleId." }, { status: 400 });

  const items = (await q`
    SELECT id, title, caption, hashtags, creation_id AS "creationId", approval_status AS "approvalStatus", status
    FROM schedule_items WHERE id = ${scheduleId} AND user_id = ${user.id} LIMIT 1
  `) as Record<string, unknown>[];
  const item = items[0];
  if (!item) return Response.json({ ok: false, error: "Not found." }, { status: 404 });

  const profile = (await q`
    SELECT approval_mode AS "approvalMode" FROM business_profiles WHERE user_id = ${user.id} LIMIT 1
  `) as { approvalMode: string }[];
  const mode = profile[0]?.approvalMode === "auto" ? "auto" : "require";
  if (mode === "require" && item.approvalStatus !== "approved") {
    return Response.json({
      ok: false,
      error: "Owner approval required before Amber can publish.",
      approvalStatus: item.approvalStatus,
    }, { status: 403 });
  }

  const targets = (await q`
    SELECT sa.id, sa.provider, sa.handle, sa.access_token_enc AS "accessTokenEnc"
    FROM schedule_account_targets t
    JOIN social_accounts sa ON sa.id = t.social_account_id
    WHERE t.schedule_item_id = ${scheduleId} AND sa.user_id = ${user.id} AND sa.status = 'connected'
  `) as { id: string; provider: string; handle: string; accessTokenEnc: string | null }[];

  if (targets.length === 0) {
    return Response.json({
      ok: false,
      error: "No connected social accounts assigned to this calendar item.",
    }, { status: 400 });
  }

  let mediaUrl: string | null = null;
  if (item.creationId) {
    const cr = (await q`
      SELECT media_url AS "mediaUrl" FROM creations WHERE id = ${String(item.creationId)} AND user_id = ${user.id} LIMIT 1
    `) as { mediaUrl: string | null }[];
    mediaUrl = cr[0]?.mediaUrl ?? null;
  }

  const caption = [String(item.caption || item.title || ""), String(item.hashtags || "")]
    .filter(Boolean)
    .join("\n\n");

  await q`UPDATE schedule_items SET approval_status = 'publishing' WHERE id = ${scheduleId}`;

  const results: { accountId: string; handle: string; provider: string; ok: boolean; error?: string; code?: string }[] = [];
  let anyOk = false;

  for (const t of targets) {
    const token = decryptToken(t.accessTokenEnc);
    if (!token) {
      results.push({
        accountId: t.id,
        handle: t.handle,
        provider: t.provider,
        ok: false,
        code: "no_token",
        error: "Token missing or could not be decrypted.",
      });
      continue;
    }
    const out = await publishToProvider({
      provider: t.provider as SocialProvider,
      accessToken: token,
      mediaUrl: mediaUrl || "",
      caption,
      title: String(item.title || ""),
      handle: t.handle,
    });
    if (out.ok) {
      anyOk = true;
      results.push({ accountId: t.id, handle: t.handle, provider: t.provider, ok: true });
    } else {
      results.push({
        accountId: t.id,
        handle: t.handle,
        provider: t.provider,
        ok: false,
        code: out.code,
        error: out.error,
      });
    }
  }

  const resultJson = JSON.stringify({ at: new Date().toISOString(), results });
  // Never mark published unless at least one adapter succeeded.
  if (anyOk) {
    await q`
      UPDATE schedule_items
      SET approval_status = 'published', status = 'done', publish_result = ${resultJson}
      WHERE id = ${scheduleId}`;
  } else {
    await q`
      UPDATE schedule_items
      SET approval_status = 'failed', publish_result = ${resultJson}
      WHERE id = ${scheduleId}`;
  }

  await logAmberAction({
    actorUserId: user.id,
    actorEmail: user.email,
    kind: anyOk ? "publish_ok" : "publish_fail",
    title: anyOk ? `Publish succeeded for ${scheduleId}` : `Publish failed for ${scheduleId}`,
    detail: { scheduleId, results },
  });

  return Response.json({
    ok: anyOk,
    published: anyOk,
    note: anyOk
      ? "At least one platform accepted the post."
      : "No platform accepted the post. Status is failed — not marked Published. Use Export or fix API/keys.",
    results,
  });
}
