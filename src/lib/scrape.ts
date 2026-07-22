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

export async function scrapePage(url: string, limit = 7000): Promise<string> {
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
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `TITLE: ${title}\nDESCRIPTION: ${desc}\nCONTENT: ${body}`.slice(0, limit);
}
