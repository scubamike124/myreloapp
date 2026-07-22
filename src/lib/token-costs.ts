// ---------------------------------------------------------------------------
// What each generation costs in tokens.
//
// Its own module, with no server imports, so the UI can display the real price
// without pulling the database driver into the browser bundle. Everything that
// mentions a price — the ledger, the cost model, the tool cards — reads from
// here, so the number a customer is shown is the number they are charged.
//
// Set to hold ~50-70% margin at EVERY tier. See src/lib/costs.ts for the
// workings before changing any of them.
// ---------------------------------------------------------------------------

export const TOKEN_COST: Record<string, number> = {
  "talking-photo": 4,
  "dancing-photo": 4,
  "ai-avatar-studio": 3,
  "website-commercial": 3,
  "bedtime-storybook": 2,
  "custom-avatar-creator": 1,
  transcribe: 0,
  captions: 0,
  analyze: 1,
};

export function costOf(action: string): number {
  return TOKEN_COST[action] ?? 1;
}

/**
 * What one charge buys. "Uses 4 tokens" is ambiguous when a tool can produce
 * more than one thing — it reads as though it might cover the whole batch — so
 * every price states its unit.
 */
export const TOKEN_UNIT: Record<string, string> = {
  "talking-photo": "video",
  "dancing-photo": "video",
  "ai-avatar-studio": "video",
  "website-commercial": "commercial",
  "bedtime-storybook": "book",
  "custom-avatar-creator": "avatar",
  analyze: "scan",
};

/**
 * The price label shown wherever a tool is offered. Generated rather than
 * written by hand: the hand-written strings had drifted badly — Talking Photo
 * advertised 1 credit while charging 4, and Website Commercial advertised 5
 * while charging 3.
 */
export function creditLabel(slug: string, suffix?: string): string {
  const n = TOKEN_COST[slug];
  if (n === undefined) return suffix ? `Pricing to be confirmed · ${suffix}` : "Pricing to be confirmed";

  const unit = TOKEN_UNIT[slug] ?? "generation";
  const base = n === 0 ? `Free per ${unit}` : `${n} ${n === 1 ? "token" : "tokens"} per ${unit}`;
  return suffix ? `${base} · ${suffix}` : base;
}
