import { listConversations } from "@/lib/ai/conversations";
import { spendSummary, spendLimits } from "@/lib/ai/cost";

export const runtime = "nodejs";

// GET /api/command-center/conversations?search=...
// Also carries the usage summary — one round trip for the whole sidebar/usage
// bar on load rather than three.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || undefined;
  const [conversations, summary] = await Promise.all([listConversations({ search }), spendSummary()]);
  return Response.json({ conversations, usage: { ...summary, limits: spendLimits() } });
}
