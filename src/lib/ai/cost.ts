// ---------------------------------------------------------------------------
// Command Center cost tracking — real provider spend in USD.
//
// Deliberately not chargeFor/token_ledger (src/lib/charge.ts): that debits a
// signed-in *customer* account in Reelo's token currency, and the admin
// session (ADMIN_PASSWORD-gated, src/proxy.ts) isn't a customer account at
// all — chargeFor would silently no-op here. This is a different currency for
// a different purpose: what the owner is actually spending with OpenAI,
// Gemini and HeyGen to run the Command Center, with hard daily/monthly caps.
// ---------------------------------------------------------------------------

import { dbConfigured, ensureSchema, sql } from "@/lib/db";

async function q() {
  if (!dbConfigured()) return null;
  const query = sql();
  if (!query || !(await ensureSchema())) return null;
  return query;
}

export type UsageKind = "reasoning" | "tool";

/** $ per 1M tokens. Update alongside COMMAND_CENTER_MODEL in agent-chain.ts. */
const OPENAI_RATES: Record<string, { in: number; out: number }> = {
  "gpt-4.1": { in: 2.0, out: 8.0 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1-nano": { in: 0.1, out: 0.4 },
};

export function estimateReasoningCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const rate = OPENAI_RATES[model] ?? OPENAI_RATES["gpt-4.1"];
  return (tokensIn / 1_000_000) * rate.in + (tokensOut / 1_000_000) * rate.out;
}

/**
 * Flat per-call estimates for the generation tools — these aren't token-
 * metered, so an exact figure isn't available up front. Rough and
 * conservative on purpose: this gates spend, not accounting.
 */
const TOOL_COST_USD: Record<string, number> = {
  "bedtime-storybook": 0.35,
  "talking-photo": 0.5,
  "dancing-photo": 0.5,
  "ai-avatar-studio": 0.6,
  "custom-avatar-creator": 0.06,
  "website-commercial": 0.9,
  "commercial-director": 3.5,
  "shorts-20": 0.4,
  "product-commercial": 0.55,
  "ai-story-maker": 0.5,
  "story-memory-generator": 0.03,
};

export function estimateToolCostUsd(toolName: string): number {
  return TOOL_COST_USD[toolName] ?? 0.25;
}

export type UsageEntry = {
  conversationId: string | null;
  kind: UsageKind;
  provider: string;
  toolName?: string | null;
  estimatedCostUsd: number;
  tokensIn?: number;
  tokensOut?: number;
  ok: boolean;
};

export async function recordUsage(entry: UsageEntry): Promise<void> {
  const query = await q();
  if (!query) return;
  await query`
    INSERT INTO command_center_usage
      (conversation_id, kind, provider, tool_name, estimated_cost_usd, tokens_in, tokens_out, ok)
    VALUES (${entry.conversationId}, ${entry.kind}, ${entry.provider}, ${entry.toolName ?? null},
            ${entry.estimatedCostUsd}, ${entry.tokensIn ?? 0}, ${entry.tokensOut ?? 0}, ${entry.ok ? 1 : 0})`;
}

export type SpendSummary = { todayUsd: number; monthUsd: number };

export async function spendSummary(): Promise<SpendSummary> {
  const query = await q();
  if (!query) return { todayUsd: 0, monthUsd: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const rows = (await query`
    SELECT
      COALESCE(SUM(CASE WHEN created_at >= ${today} THEN estimated_cost_usd ELSE 0 END), 0) AS today_usd,
      COALESCE(SUM(CASE WHEN created_at >= ${monthStart} THEN estimated_cost_usd ELSE 0 END), 0) AS month_usd
    FROM command_center_usage
    WHERE ok = 1`) as unknown as { today_usd: number | string; month_usd: number | string }[];

  const row = rows[0];
  return { todayUsd: Number(row?.today_usd ?? 0), monthUsd: Number(row?.month_usd ?? 0) };
}

const DAILY_LIMIT_USD = Number(process.env.COMMAND_CENTER_DAILY_USD_LIMIT ?? 15);
const MONTHLY_LIMIT_USD = Number(process.env.COMMAND_CENTER_MONTHLY_USD_LIMIT ?? 200);

export type SpendCheck = { ok: true } | { ok: false; reason: string; summary: SpendSummary };

/** Called before a costly tool executes — refuses the call rather than the account. */
export async function checkSpendAllowed(nextCostUsd: number): Promise<SpendCheck> {
  const summary = await spendSummary();
  if (summary.todayUsd + nextCostUsd > DAILY_LIMIT_USD) {
    return {
      ok: false,
      reason: `Daily spend limit reached ($${summary.todayUsd.toFixed(2)} of $${DAILY_LIMIT_USD} used today). Raise COMMAND_CENTER_DAILY_USD_LIMIT to continue.`,
      summary,
    };
  }
  if (summary.monthUsd + nextCostUsd > MONTHLY_LIMIT_USD) {
    return {
      ok: false,
      reason: `Monthly spend limit reached ($${summary.monthUsd.toFixed(2)} of $${MONTHLY_LIMIT_USD} used this month). Raise COMMAND_CENTER_MONTHLY_USD_LIMIT to continue.`,
      summary,
    };
  }
  return { ok: true };
}

export function spendLimits() {
  return { dailyUsd: DAILY_LIMIT_USD, monthlyUsd: MONTHLY_LIMIT_USD };
}
