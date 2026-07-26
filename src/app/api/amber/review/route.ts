import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser } from "@/lib/workspace-api";
import { asRecord, errorMessage, geminiParts } from "@/lib/json";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, logAmberAction } from "@/lib/amber-autonomous";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

async function snapshot(userId: string, q: NonNullable<Awaited<ReturnType<typeof sqlAsync>>>) {
  const creations = (await q`
    SELECT COUNT(*) AS c FROM creations WHERE user_id = ${userId}
  `) as { c: number | string }[];
  const scheduled = (await q`
    SELECT COUNT(*) AS c FROM schedule_items WHERE user_id = ${userId} AND status IN ('planned','due')
  `) as { c: number | string }[];
  const pending = (await q`
    SELECT COUNT(*) AS c FROM schedule_items WHERE user_id = ${userId} AND approval_status = 'pending_approval'
  `) as { c: number | string }[];
  const accounts = (await q`
    SELECT provider, handle, display_name AS "displayName" FROM social_accounts
    WHERE user_id = ${userId} AND status = 'connected'
  `) as { provider: string; handle: string; displayName: string }[];
  const recent = (await q`
    SELECT title, status, approval_status AS "approvalStatus", scheduled_at AS "scheduledAt", amber_placed AS "amberPlaced"
    FROM schedule_items WHERE user_id = ${userId}
    ORDER BY scheduled_at DESC LIMIT 10
  `) as Record<string, unknown>[];

  return {
    libraryCount: Number(creations[0]?.c ?? 0),
    scheduledCount: Number(scheduled[0]?.c ?? 0),
    pendingApproval: Number(pending[0]?.c ?? 0),
    accounts,
    recent,
  };
}

export async function GET() {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  if (!dbConfigured()) return Response.json({ ok: true, configured: false, review: null });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, review: null });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, review: null });
  }
  const snap = await snapshot(user.id, q);
  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    note: "Workspace review only — not platform follower/view metrics.",
    review: snap,
  });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  try {
    await readJsonLimited(req, 8_000);
  } catch (e) {
    if (e instanceof PayloadTooLarge) {
      return Response.json({ ok: false, error: "Payload too large." }, { status: 413 });
    }
  }

  const snap = await snapshot(user.id, q);
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({
      ok: true,
      review: snap,
      recommendations: {
        summary: "Connect GEMINI_API_KEY for Amber written recommendations. Counts above are from your Reelo workspace.",
        nextActions: [
          snap.accounts.length === 0 ? "Connect an existing TikTok, Instagram, or YouTube account." : null,
          snap.pendingApproval > 0 ? `Approve ${snap.pendingApproval} calendar item(s).` : null,
          snap.libraryCount === 0 ? "Create a video in Create Studio so Amber can schedule it." : "Ask Amber to place Library items on the calendar.",
        ].filter(Boolean),
      },
    });
  }

  const prompt = `You are Amber, the owner's AI social media employee inside Reelo.
You manage EXISTING connected accounts only — never suggest opening new social accounts.
Workspace snapshot (Reelo data only, NOT platform analytics):
${JSON.stringify(snap)}

Return JSON:
{
  "summary": "short owner report",
  "scheduleHealth": "one sentence",
  "contentGaps": ["..."],
  "nextActions": ["owner or Amber action"],
  "whatToMakeNext": ["video ideas tied to Brand/Library"]
}
Do not invent views, followers, or engagement numbers.`;

  try {
    const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
      }),
    });
    const data = asRecord(await res.json());
    if (!res.ok) throw new Error(errorMessage(data, "Gemini error"));
    const text = geminiParts(data)
      .map((p) => (typeof p === "object" && p && "text" in p ? String((p as { text?: string }).text || "") : ""))
      .join("\n")
      .trim();
    const recommendations = asRecord(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")));
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "review",
      title: "Amber continuous review",
      detail: { summary: recommendations.summary },
    });
    return Response.json({ ok: true, review: snap, recommendations });
  } catch (e) {
    return Response.json({
      ok: true,
      review: snap,
      recommendations: {
        summary: e instanceof Error ? e.message : "Could not generate narrative review.",
        nextActions: ["Check GEMINI_API_KEY", "Review calendar approvals"],
      },
    });
  }
}
