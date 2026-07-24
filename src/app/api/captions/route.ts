import { asRecord, asString, errorMessage, geminiParts } from "@/lib/json";
import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

// ---------------------------------------------------------------------------
// Captions and hashtags for a finished video.
//
// Reelo makes the video; until now the user was on their own for the caption
// and tags, which is the part that actually decides whether anyone sees it.
// Search grounding is on, so the hashtags reflect what is current in the
// user's country rather than a hardcoded list that rots.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_BODY = 16 * 1024;

const PLATFORMS = new Set(["tiktok", "reels", "shorts"]);
const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
};

const DAILY = Number(process.env.CAPTIONS_DAILY_LIMIT ?? 50);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 50);

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Caption generation is unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json({ error: "You've hit today's caption limit. Try again tomorrow." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ error: tooBig ? e.message : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const topic = str(body.topic, 400);
  if (!topic) {
    limiter.refund(id);
    return Response.json({ error: "Tell us what the video is about first." }, { status: 400 });
  }

  const platform = PLATFORMS.has(String(body.platform)) ? String(body.platform) : "tiktok";
  const toolTitle = str(body.toolTitle, 80);
  // Shape-checked, not just truncated — these land in the prompt.
  const rawCountry = str(body.country, 8);
  const country = /^[A-Za-z]{2}$/.test(rawCountry) ? rawCountry.toUpperCase() : "";

  const edgeCountry = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? "";
  const region = /^[A-Za-z]{2}$/.test(edgeCountry) ? edgeCountry.toUpperCase() : country;

  const prompt = `You are a short-form social strategist. A creator has made a video and needs a caption and hashtags for ${PLATFORM_LABEL[platform]}.

The video: ${topic}${toolTitle ? `\nMade with: ${toolTitle}` : ""}${region ? `\nAudience country: ${region}` : ""}

Search for what is genuinely working on ${PLATFORM_LABEL[platform]} right now${region ? ` in ${region}` : ""} before answering.

Return ONLY a JSON object, no markdown fence, with exactly these keys:
- "captions": array of exactly 3 caption options. Distinct angles — one hook-led, one story-led, one direct. Each under 150 characters. No hashtags inside the captions.
- "hashtags": array of 8-14 hashtags WITHOUT the # symbol. Mix broad-reach and niche tags relevant to this specific video. Real tags in current use, not invented ones.
- "note": one short sentence on posting this — timing, format, or what to pair it with. Under 140 characters.

No commentary outside the JSON.`;

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Search grounding and responseSchema are mutually exclusive on this
        // model, so the shape is requested in the prompt and validated below.
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.8,
          // Thinking tokens are billed against maxOutputTokens on 2.5 Flash, and
          // this model will happily spend 1300+ of them reasoning about a
          // caption — truncating the JSON before it writes any. Disabled here
          // because assembling captions from search results needs no deliberation.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    limiter.refund(id);
    return Response.json({ error: "Couldn't reach the caption service. Try again." }, { status: 502 });
  }

  if (!upstream.ok) {
    limiter.refund(id);
    let msg = `Caption generation failed (${upstream.status}).`;
    try {
      const data = asRecord(await upstream.json());
      const m = errorMessage(data, "");
      if (m) msg = m;
    } catch {
      /* keep the generic message */
    }
    return Response.json({ error: msg }, { status: 502 });
  }

  let text = "";
  try {
    const data = asRecord(await upstream.json());
    const parts = geminiParts(data);
    text = parts.map((p) => asString(asRecord(p).text)).join("");
  } catch {
    limiter.refund(id);
    return Response.json({ error: "Caption service returned something unreadable." }, { status: 502 });
  }

  // Grounded replies often wrap JSON in a fence despite being asked not to.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    limiter.refund(id);
    return Response.json({ error: "Couldn't read the generated captions. Try again." }, { status: 502 });
  }

  let parsed: { captions?: unknown; hashtags?: unknown; note?: unknown };
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    limiter.refund(id);
    return Response.json({ error: "Couldn't read the generated captions. Try again." }, { status: 502 });
  }

  const captions = Array.isArray(parsed.captions)
    ? parsed.captions.filter((c): c is string => typeof c === "string" && c.trim().length > 0).slice(0, 3).map((c) => c.trim())
    : [];

  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags
        .filter((h): h is string => typeof h === "string")
        // The model is told to omit "#", but strip it defensively so the UI
        // never renders "##travel".
        .map((h) => h.trim().replace(/^#+/, "").replace(/\s+/g, ""))
        .filter((h) => /^[\wÀ-ɏ]{2,40}$/.test(h))
        .slice(0, 14)
    : [];

  if (captions.length === 0) {
    limiter.refund(id);
    return Response.json({ error: "No captions came back. Try again." }, { status: 502 });
  }

  return Response.json(
    { ok: true, captions, hashtags, note: str(parsed.note, 200) || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
