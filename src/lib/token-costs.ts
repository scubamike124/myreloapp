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
 * The label shown on a tool card. Generated rather than written by hand: the
 * hand-written strings had drifted badly — Talking Photo advertised 1 credit
 * while charging 4, and Website Commercial advertised 5 while charging 3.
 */
export function creditLabel(slug: string, suffix?: string): string {
  const n = TOKEN_COST[slug];
  if (n === undefined) return suffix ? `Free · ${suffix}` : "Pricing to be confirmed";
  if (n === 0) return suffix ? `Free · ${suffix}` : "Free";
  const base = `Uses ${n} ${n === 1 ? "token" : "tokens"}`;
  return suffix ? `${base} · ${suffix}` : base;
}
