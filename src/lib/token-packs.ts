import { PACK_SPECS } from "@/lib/plans";

/** Pack ids are `pack-{tokens}` e.g. pack-10. Browser-safe (no Stripe). */
export function packIdFromTokens(tokens: number): string {
  return `pack-${tokens}`;
}

export function packFromId(packId: string): { id: string; tokens: number; priceUsd: number } | null {
  const m = /^pack-(\d+)$/.exec(packId.trim());
  if (!m) return null;
  const tokens = Number(m[1]);
  const spec = PACK_SPECS.find((p) => p.tokens === tokens);
  if (!spec) return null;
  return { id: packIdFromTokens(tokens), tokens: spec.tokens, priceUsd: spec.price };
}

export function listTokenPacks() {
  return PACK_SPECS.map((p) => ({
    id: packIdFromTokens(p.tokens),
    tokens: p.tokens,
    priceUsd: p.price,
  }));
}
