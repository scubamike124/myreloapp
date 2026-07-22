import { TOOLS, LIVE_TOOLS, TOOL_SERVICE } from "@/lib/tools";

// ---------------------------------------------------------------------------
// The context Amber is grounded in. Assembled on the client (it needs the
// current route and the local workspace), validated and rendered to text on
// the server before being handed to the model.
// ---------------------------------------------------------------------------

export type AmberContext = {
  /** Current pathname, e.g. "/create/talking-photo". */
  path: string;
  /** Coarse area of the product, used to pick starter prompts and tone. */
  area: string;
  /** Slug of the tool being viewed, when on a tool page. */
  toolSlug?: string;
  /** BCP-47 tag from the browser, e.g. "en-AU". Used to localise trend advice. */
  locale?: string;
  /** IANA zone from the browser, e.g. "Australia/Sydney". */
  timeZone?: string;
  /** ISO-3166 country from the edge, when the host provides it. Server-set and
   *  therefore trusted over anything the browser claims. */
  country?: string;
  /** Compact workspace summary from lib/workspace `summarize()`. */
  workspace?: {
    total: number;
    completed: number;
    failed: number;
    toolsUsed: { tool: string; count: number }[];
    recent: { tool: string; title: string; status: string; createdAt: string; error?: string }[];
    lastFailure: { tool: string; error: string } | null;
  };
};

/** Map a pathname to a coarse product area. */
export function areaFromPath(path: string): string {
  if (path.startsWith("/create")) return "create";
  if (path.startsWith("/library")) return "library";
  if (path.startsWith("/business-center") || path.startsWith("/business-hub")) return "business";
  if (path.startsWith("/pricing") || path.startsWith("/add-ons")) return "pricing";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/dashboard") || path.startsWith("/account")) return "dashboard";
  return "marketing";
}

const AREA_LABEL: Record<string, string> = {
  create: "the Create area, browsing or using a video tool",
  library: "their Library of past creations",
  business: "the Business Center (publishing, scheduling, analytics, revenue)",
  pricing: "pricing and plans",
  admin: "the internal admin dashboard",
  dashboard: "their dashboard / account settings",
  marketing: "a public marketing page",
};

/** Turn a region code into a name, falling back to the raw code. */
function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * Describe where the user is, so trend answers can be local rather than
 * generic. "Trending on TikTok" differs enormously by country — sounds, formats
 * and hashtags are largely region-specific — so this is the difference between
 * a useful answer and a US-default one.
 */
function describeLocation(ctx: AmberContext): string | null {
  const parts: string[] = [];

  // Edge-provided country beats the browser's claim about itself.
  const iso = ctx.country ?? (ctx.locale?.includes("-") ? ctx.locale.split("-")[1] : undefined);
  if (iso && /^[A-Za-z]{2}$/.test(iso)) parts.push(`country: ${regionName(iso)} (${iso.toUpperCase()})`);
  if (ctx.timeZone) parts.push(`timezone: ${ctx.timeZone}`);
  if (ctx.locale) parts.push(`language: ${ctx.locale}`);

  if (parts.length === 0) return null;

  return (
    `User's location signals — ${parts.join(", ")}. When they ask what is trending, ` +
    `answer for THIS country first and say which country you are answering for. Trends, sounds ` +
    `and hashtags vary by region. If they ask about somewhere else, or say these signals are ` +
    `wrong, use what they tell you instead. Never state their location as a fact about them ` +
    `beyond this — it is inferred from their browser, not something they told you.`
  );
}

/**
 * Render the context into the plain-text block handed to the model.
 * Kept human-readable on purpose: it is far easier to debug a bad Amber answer
 * when the grounding block reads like a briefing note.
 */
export function renderContext(ctx: AmberContext): string {
  const lines: string[] = [];

  lines.push(`The user is currently on ${ctx.path} — ${AREA_LABEL[ctx.area] ?? "the platform"}.`);

  const where = describeLocation(ctx);
  if (where) lines.push(where);

  if (ctx.toolSlug) {
    const tool = TOOLS.find((t) => t.slug === ctx.toolSlug);
    if (tool) {
      const inputs = tool.fields.map((f) => f.label).join(", ");
      lines.push(
        `They are looking at the "${tool.title}" tool — ${tool.tagline} (${tool.credits}). Inputs it needs: ${inputs}.`,
      );
    }
  }

  lines.push("");
  lines.push("Tools that WORK right now (safe to recommend):");
  for (const t of TOOLS.filter((t) => LIVE_TOOLS.has(t.slug))) {
    lines.push(`- ${t.title} (/create/${t.slug}) — ${t.tagline} ${t.credits}.`);
  }

  const unavailable = TOOLS.filter((t) => !LIVE_TOOLS.has(t.slug));
  if (unavailable.length > 0) {
    lines.push("");
    lines.push(
      "Tools that are NOT built yet — their pages exist and show the inputs, but they cannot generate anything. Never tell the user to use these to make something; say they aren't available yet and offer a working tool instead:",
    );
    for (const t of unavailable) lines.push(`- ${t.title} (/create/${t.slug})`);
  }

  lines.push("");
  lines.push(
    "Also not built: user accounts/login, billing and checkout, social publishing, and the Business Center (publishing, scheduling, analytics, revenue, social) which shows example figures only. Do not claim any of these work.",
  );

  const ws = ctx.workspace;
  lines.push("");
  if (!ws || ws.total === 0) {
    lines.push("The user has not created anything yet. This is a good moment to suggest a concrete first video.");
  } else {
    lines.push(
      `Workspace: ${ws.total} creation(s) — ${ws.completed} completed, ${ws.failed} failed.`,
    );
    if (ws.toolsUsed.length > 0) {
      lines.push(`Tools they use most: ${ws.toolsUsed.map((t) => `${t.tool} (${t.count})`).join(", ")}.`);
    }
    if (ws.recent.length > 0) {
      lines.push("Recent activity (newest first):");
      for (const r of ws.recent) {
        lines.push(`- ${r.tool}: "${r.title}" — ${r.status}${r.error ? ` (${r.error})` : ""}`);
      }
    }
    if (ws.lastFailure) {
      lines.push(
        `Most recent failure was in ${ws.lastFailure.tool}: ${ws.lastFailure.error}. If they seem stuck, address this first.`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Which external services are configured. Computed on the SERVER only — the
 * client is never trusted for this, and only the booleans are used, never the
 * key values.
 *
 * This is what lets Amber say "video generation needs a HeyGen key, which isn't
 * set" instead of confidently telling someone to press a button that will fail.
 */
export function renderServiceState(): string {
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const heygen = Boolean(process.env.HEYGEN_API_KEY);

  const lines: string[] = ["", "Connected services (server-side truth):"];
  lines.push(`- Google Gemini: ${gemini ? "configured" : "NOT configured"}`);
  lines.push(`- HeyGen: ${heygen ? "configured" : "NOT configured"}`);

  const blocked = Object.entries(TOOL_SERVICE)
    .filter(([, svc]) => (svc === "gemini" ? !gemini : !heygen))
    .map(([slug]) => TOOLS.find((t) => t.slug === slug)?.title ?? slug);

  if (blocked.length > 0) {
    lines.push(
      `Because of the missing key(s), these otherwise-working tools will fail right now: ${blocked.join(", ")}. If the user tries one, explain the missing key and tell them an admin can add it at Admin → Key vault. Never ask the user to paste a key into the chat.`,
    );
  } else {
    lines.push("All required keys are set, so every working tool should run.");
  }

  return lines.join("\n");
}

/** Narrow and sanity-check untrusted context from the client. */
export function parseContext(raw: unknown): AmberContext {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = typeof o.path === "string" && o.path.startsWith("/") ? o.path.slice(0, 200) : "/";
  const toolSlug =
    typeof o.toolSlug === "string" && TOOLS.some((t) => t.slug === o.toolSlug) ? o.toolSlug : undefined;

  // Both go straight into the prompt, so they are shape-checked rather than
  // merely truncated — no free text from the browser reaches the model here.
  const locale =
    typeof o.locale === "string" && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(o.locale)
      ? o.locale.slice(0, 35)
      : undefined;
  const timeZone =
    typeof o.timeZone === "string" && /^[A-Za-z]+(?:[_/+-][A-Za-z0-9_+-]+)*$/.test(o.timeZone)
      ? o.timeZone.slice(0, 60)
      : undefined;

  let workspace: AmberContext["workspace"];
  const w = o.workspace as Record<string, unknown> | undefined;
  if (w && typeof w === "object") {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    workspace = {
      total: num(w.total),
      completed: num(w.completed),
      failed: num(w.failed),
      toolsUsed: Array.isArray(w.toolsUsed)
        ? (w.toolsUsed as { tool: string; count: number }[])
            .filter((t) => t && typeof t.tool === "string")
            .slice(0, 12)
            .map((t) => ({ tool: String(t.tool).slice(0, 60), count: num(t.count) }))
        : [],
      recent: Array.isArray(w.recent)
        ? (w.recent as Record<string, unknown>[])
            .filter((r) => r && typeof r === "object")
            .slice(0, 8)
            .map((r) => ({
              tool: String(r.tool ?? "").slice(0, 60),
              title: String(r.title ?? "").slice(0, 120),
              status: String(r.status ?? "").slice(0, 20),
              createdAt: String(r.createdAt ?? "").slice(0, 40),
              ...(r.error ? { error: String(r.error).slice(0, 200) } : {}),
            }))
        : [],
      lastFailure:
        w.lastFailure && typeof w.lastFailure === "object"
          ? {
              tool: String((w.lastFailure as Record<string, unknown>).tool ?? "").slice(0, 60),
              error: String((w.lastFailure as Record<string, unknown>).error ?? "").slice(0, 200),
            }
          : null,
    };
  }

  return { path, area: areaFromPath(path), toolSlug, locale, timeZone, workspace };
}
