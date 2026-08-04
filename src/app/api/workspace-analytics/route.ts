import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { balanceOf } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET() {
  if (!dbConfigured()) {
    return Response.json({ ok: true, configured: false, analytics: null });
  }
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: true, configured: true, signedIn: false, analytics: null });
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, analytics: null });
  }

  const creations = (await q`
    SELECT tool_slug AS "toolSlug", tool_title AS "toolTitle", kind, created_at AS "createdAt"
    FROM creations
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 1000
  `) as { toolSlug: string; toolTitle: string; kind: string; createdAt: string }[];

  const ledger = (await q`
    SELECT delta, reason, created_at AS "createdAt"
    FROM token_ledger
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 500
  `) as { delta: number; reason: string; createdAt: string }[];

  const byDay: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  let videos = 0;
  let images = 0;
  for (const c of creations) {
    const day = String(c.createdAt).slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    const tool = c.toolTitle || c.toolSlug;
    byTool[tool] = (byTool[tool] ?? 0) + 1;
    if (c.kind === "video") videos++;
    else images++;
  }

  let spent = 0;
  let refunded = 0;
  let credited = 0;
  for (const row of ledger) {
    const d = Number(row.delta);
    if (d < 0) spent += -d;
    else if (String(row.reason).toLowerCase().includes("refund")) refunded += d;
    else credited += d;
  }

  const days = Object.keys(byDay).sort().slice(-30);
  const tools = Object.entries(byTool)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  const balance = await balanceOf(user.id);

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    note: "Workspace analytics from your creations and token ledger — not social reach.",
    analytics: {
      videos,
      images,
      total: creations.length,
      balance,
      spent,
      refunded,
      credited,
      byDay: days.map((day) => ({ day, count: byDay[day] })),
      byTool: tools,
    },
  });
}
