// ---------------------------------------------------------------------------
// Amber trend briefs from LaunchReady (Super Administration).
//
// LaunchReady exposes GET/POST /api/public/amber/briefs so Reelo can feed
// live angle/keywords/hashtags/hook into creation prompts and the Trends UI.
// Both URL and apikey are optional — unset means Reelo keeps its static
// fallback and never calls out.
// ---------------------------------------------------------------------------

export type AmberBrief = {
  angle: string;
  keywords: string[];
  hashtags: string[];
  hook: string;
  sound: string;
  confidence: number;
  source_signal: string;
};

export type AmberBriefsResult = {
  ok: boolean;
  mode?: string;
  brand?: string;
  count?: number;
  briefs: AmberBrief[];
  error?: string;
  configured: boolean;
};

function config(): { baseUrl: string; apiKey: string; brand: string } | null {
  const baseUrl = (process.env.AMBER_BRIEFS_URL ?? "").replace(/\/$/, "");
  const apiKey = process.env.AMBER_BRIEFS_API_KEY ?? "";
  const brand = (process.env.AMBER_BRIEFS_BRAND ?? "reelo").trim().toLowerCase();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey, brand };
}

export function amberBriefsConfigured(): boolean {
  return config() !== null;
}

/** Latest cached briefs for the configured brand (no model call upstream). */
export async function fetchAmberBriefs(limit = 8): Promise<AmberBriefsResult> {
  const cfg = config();
  if (!cfg) {
    return { ok: false, briefs: [], configured: false, error: "not_configured" };
  }

  const url = new URL(`${cfg.baseUrl}/api/public/amber/briefs`);
  url.searchParams.set("brand", cfg.brand);
  url.searchParams.set("limit", String(Math.min(20, Math.max(1, limit))));

  try {
    const res = await fetch(url, {
      headers: { apikey: cfg.apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      // Briefs change on a cron; don't pin a stale edge cache forever.
      next: { revalidate: 300 },
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      mode?: string;
      brand?: string;
      count?: number;
      briefs?: AmberBrief[];
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        briefs: [],
        configured: true,
        error: data.error ?? `upstream_${res.status}`,
      };
    }
    return {
      ok: Boolean(data.ok),
      mode: data.mode,
      brand: data.brand ?? cfg.brand,
      count: data.count ?? data.briefs?.length ?? 0,
      briefs: Array.isArray(data.briefs) ? data.briefs : [],
      configured: true,
      error: data.error,
    };
  } catch (e) {
    return {
      ok: false,
      briefs: [],
      configured: true,
      error: e instanceof Error ? e.message : "briefs_fetch_failed",
    };
  }
}

/** Compact prompt fragment for video-generation routes. Empty when unset/empty. */
export function renderBriefPromptBlock(briefs: AmberBrief[], max = 3): string {
  const slice = briefs.filter((b) => b.angle).slice(0, max);
  if (!slice.length) return "";
  const lines = slice.map((b, i) => {
    const tags = (b.hashtags ?? []).slice(0, 6).map((h) => `#${h.replace(/^#/, "")}`).join(" ");
    const keys = (b.keywords ?? []).slice(0, 6).join(", ");
    return `${i + 1}. Angle: ${b.angle}
   Hook: ${b.hook || "(none)"}
   Keywords: ${keys || "(none)"}
   Hashtags: ${tags || "(none)"}
   Sound vibe: ${b.sound || "(none)"}`;
  });
  return `# CURRENT TREND BRIEFS (from Amber — prefer these angles/hooks when they fit)
${lines.join("\n")}`;
}

/**
 * Best-effort trend block for generation prompts. Never throws; returns "" when
 * briefs are unconfigured or the upstream call fails.
 */
export async function trendBriefPromptSuffix(max = 3): Promise<string> {
  try {
    const result = await fetchAmberBriefs(max);
    if (!result.ok || !result.briefs.length) return "";
    const block = renderBriefPromptBlock(result.briefs, max);
    return block ? `\n\n${block}\n` : "";
  } catch {
    return "";
  }
}
