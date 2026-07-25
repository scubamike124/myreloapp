// ---------------------------------------------------------------------------
// Reading a public web page as plain text.
//
// Shared by Website Commercial (which scans a whole site) and Product
// Commercial (which reads one product page), so the size caps and the
// content-type refusal are enforced the same way for both rather than being
// re-implemented per route.
//
// The URL must already have been through assertSafeUrl in @/lib/api-guard —
// this function fetches from inside our network and does no SSRF checking of
// its own.
// ---------------------------------------------------------------------------

/** Refuse to buffer an unbounded response from a hostile or huge page. */
const MAX_HTML_BYTES = 2 * 1024 * 1024;

export type ScrapeResult = { text: string; colors: string[] };

/** Pull brand-ish hex colors from theme-color, CSS vars, and inline styles. */
export function extractBrandColors(html: string, max = 6): string[] {
  const found = new Set<string>();
  const add = (raw: string) => {
    const hex = normalizeHex(raw);
    if (hex) found.add(hex);
  };

  const theme = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i)?.[1];
  if (theme) add(theme);

  const ms = html.match(/<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ms) add(ms);

  for (const m of html.matchAll(/--(?:brand|primary|accent|color)[^:;{]*:\s*(#[0-9a-fA-F]{3,8})\b/gi)) {
    add(m[1]);
  }
  for (const m of html.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    add(m[0]);
    if (found.size >= max * 3) break;
  }

  // Prefer saturated / mid-lightness colors over near-white/near-black chrome.
  return [...found]
    .filter((c) => !isNearNeutral(c))
    .slice(0, max);
}

function normalizeHex(raw: string): string | null {
  const s = raw.trim();
  const m3 = s.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const m6 = s.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (m6) return `#${m6[1]}`.toLowerCase();
  return null;
}

function isNearNeutral(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / (3 * 255);
  return sat < 0.12 || lum > 0.92 || lum < 0.08;
}

export async function scrapePageDetailed(url: string, limit = 7000): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; ReeloBot/1.0)" },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });

  const type = res.headers.get("content-type") ?? "";
  if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
    throw new Error("That URL isn't a web page.");
  }
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_HTML_BYTES) {
    throw new Error("That page is too large to scan.");
  }

  const buf = await res.arrayBuffer();
  const html = new TextDecoder().decode(buf.slice(0, MAX_HTML_BYTES));
  const colors = extractBrandColors(html);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    text: `TITLE: ${title}\nDESCRIPTION: ${desc}\nCONTENT: ${body}`.slice(0, limit),
    colors,
  };
}

export async function scrapePage(url: string, limit = 7000): Promise<string> {
  return (await scrapePageDetailed(url, limit)).text;
}
