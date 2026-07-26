import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

/**
 * Module 8 — intelligent scheduling: rebalance planned Amber calendar items.
 * Honest: uses Reelo learning + BI seasonal notes, not fabricated platform peak times.
 */
export async function rebalanceAmberCalendar(
  q: Sql,
  userId: string,
  actorEmail?: string | null,
): Promise<{ updated: number; plan: Record<string, unknown> }> {
  const bi = await loadBusinessIntelligence(q, userId);
  const learning = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];
  const items = (await q`
    SELECT id, title, scheduled_at AS "scheduledAt", platforms, approval_status AS "approvalStatus",
           amber_placed AS "amberPlaced"
    FROM schedule_items
    WHERE user_id = ${userId}
      AND approval_status IN ('pending_approval', 'approved', 'draft', 'planned')
    ORDER BY scheduled_at ASC LIMIT 60
  `) as Record<string, unknown>[];
  const amberItems = items.filter((i) => Boolean(i.amberPlaced)).slice(0, 40);

  if (amberItems.length === 0) {
    return { updated: 0, plan: { note: "No Amber calendar items to rebalance." } };
  }

  let plan: Record<string, unknown> = {};
  try {
    plan = await geminiJson(`Rebalance this content calendar as Amber (marketing ops).
Business:
${biPromptBlock(bi)}
Learning patterns: ${learning[0]?.patterns?.slice(0, 1200) || "{}"}
Items: ${JSON.stringify(amberItems.map((i) => ({ id: i.id, title: i.title, scheduledAt: i.scheduledAt, platforms: i.platforms })))}

Avoid duplicate topics on same day. Spread cadence. Apply seasonal/holiday sensitivity from BI when relevant.
Return JSON:
{
  "updates": [{"id":"...","scheduledAt":"ISO datetime","reason":"..."}],
  "frequency": "e.g. 3-5 posts/week",
  "platformPriority": ["tiktok","instagram","youtube"],
  "notes": "..."
}
Only include ids from the list. scheduledAt must be future ISO times over the next 14 days.`);
  } catch {
    plan = { updates: [], frequency: "keep current", notes: "Rebalance skipped (Gemini unavailable)." };
  }

  let updated = 0;
  const updates = Array.isArray(plan.updates) ? plan.updates : [];
  for (const u of updates.slice(0, 30)) {
    const row = asRecord(u);
    const id = String(row.id || "");
    const scheduledAt = String(row.scheduledAt || "");
    if (!id || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) continue;
    if (Date.parse(scheduledAt) < Date.now() - 60_000) continue;
    const owns = (await q`
      SELECT id FROM schedule_items WHERE id = ${id} AND user_id = ${userId} LIMIT 1
    `) as { id: string }[];
    if (!owns[0]) continue;
    await q`UPDATE schedule_items SET scheduled_at = ${new Date(scheduledAt).toISOString()} WHERE id = ${id}`;
    updated += 1;
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "schedule_rebalance",
    title: `Rebalanced ${updated} calendar item(s)`,
    detail: { updated, frequency: plan.frequency, platformPriority: plan.platformPriority },
  });

  return { updated, plan };
}

/** Detect near-duplicate schedule titles. */
export async function detectDuplicateScheduleTopics(
  q: Sql,
  userId: string,
): Promise<{ duplicates: { a: string; b: string; title: string }[] }> {
  const rows = (await q`
    SELECT id, title, amber_placed AS "amberPlaced" FROM schedule_items
    WHERE user_id = ${userId}
    ORDER BY scheduled_at DESC LIMIT 80
  `) as { id: string; title: string; amberPlaced: unknown }[];
  const amberRows = rows.filter((r) => Boolean(r.amberPlaced)).slice(0, 50);

  const duplicates: { a: string; b: string; title: string }[] = [];
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (let i = 0; i < amberRows.length; i++) {
    for (let j = i + 1; j < amberRows.length; j++) {
      if (norm(amberRows[i].title) && norm(amberRows[i].title) === norm(amberRows[j].title)) {
        duplicates.push({ a: amberRows[i].id, b: amberRows[j].id, title: amberRows[i].title });
      }
    }
  }
  return { duplicates };
}
