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
  // Same Veo clip as Talking Photo, so the same price: the cost is the six
  // seconds of render, not what is in frame.
  "product-commercial": 4,
  "bedtime-storybook": 2,
  // Per EPISODE, not per series. Eight scenes of long narration plus eight
  // illustrations; at the ten-scene maximum this still holds 66% on the
  // cheapest tier, where 2 tokens would fall to 49% and break the floor.
  "ai-story-maker": 3,
  // One text call that reads every photo. The film itself is drawn in the
  // browser from photos the customer already has, so there is no render cost.
  "story-memory-generator": 1,
  "custom-avatar-creator": 1,
  // Free by design. All three are cheap text or transcription calls guarded by
  // their own daily caps, and charging for them would be worse than pointless:
  //   analyze    — Website Commercial calls it AND the video route, so billing
  //                it separately would charge twice for one commercial. The
  //                scan is already inside that tool's 3 tokens. Standalone, it
  //                costs $0.006 and is what convinces someone to buy.
  //   transcribe — voice input; charging to speak instead of type is hostile.
  //   captions   — a few cents, and it makes the video people already paid for
  //                actually usable.
  transcribe: 0,
  captions: 0,
  analyze: 0,
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
  "product-commercial": "commercial",
  "bedtime-storybook": "book",
  "ai-story-maker": "episode",
  "custom-avatar-creator": "avatar",
  "story-memory-generator": "film",
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
