import { UnsafeUrlError, assertSafeUrl, clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";
import { scrapePage } from "@/lib/scrape";

// ---------------------------------------------------------------------------
// 20 Shorts Generator — a month of short-form content, written.
//
// What this deliberately is NOT: twenty rendered videos. Twenty Veo clips cost
// about $12 in provider fees and take a quarter of an hour, which no request
// can wait for and no sane token price could cover. Promising that and
// delivering a spinner would be the dishonest version of this tool.
//
// What it is instead: twenty shorts planned properly — hook, spoken script,
// shot list, caption and hashtags — for a real month of posting, from one
// website or one sentence. The scripts are the hard part and the part a
// creator actually stares at a blank page over. Any one of them can then be
// handed to the tools that do render (Talking Photo, AI Avatar Studio,
// Product Commercial), which is where the video cost belongs: per video the
// customer chose, not twenty they did not.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXT_MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_BODY = 256 * 1024;
const MIN_COUNT = 5;
const MAX_COUNT = 30;

const DAILY = Number(process.env.SHORTS_DAILY_LIMIT ?? 10);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 10);

type Short = {
  hook: string;
  script: string;
  shots: string[];
  caption: string;
  hashtags: string[];
  bestFor: string;
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/**
 * Take hashtags out of a caption. The model puts them there anyway however
 * plainly it is told not to, and left in they render twice — once in the
 * caption and again from the hashtags field underneath it.
 */
function stripTags(caption: string): string {
  return caption
    .replace(/#[\p{L}\p{N}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Shorts are unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json({ error: "You've reached today's limit for shorts. Try again tomorrow." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ error: tooBig ? "That request is too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const topic = str(body.prompt, 800);
  const rawUrl = str(body.url, 500);
  const count = Math.max(MIN_COUNT, Math.min(MAX_COUNT, Number(body.count) || 20));
  const platform = str(body.platform, 30) || "All of them";
  const tone = str(body.tone, 30) || "Punchy";
  const language = getLanguage(str(body.languageCode, 8));

  if (!topic && !rawUrl) {
    limiter.refund(id);
    return Response.json({ error: "Paste a website address, or say what the shorts should be about." }, { status: 400 });
  }

  // Scanning the site is what makes these specific rather than generic, but a
  // page that will not load must not sink the whole batch — a topic alone is
  // enough to write from.
  let siteText = "";
  let scanned = false;
  if (rawUrl) {
    try {
      const safe = await assertSafeUrl(rawUrl);
      siteText = await scrapePage(safe, 6000);
      scanned = Boolean(siteText.trim());
    } catch (e) {
      if (e instanceof UnsafeUrlError) {
        limiter.refund(id);
        return Response.json({ error: e.message }, { status: 400 });
      }
      siteText = "";
    }
  }

  if (!topic && !scanned) {
    limiter.refund(id);
    return Response.json(
      { error: "That page could not be read. Try another address, or describe the shorts instead." },
      { status: 502 },
    );
  }

  const charged = await chargeFor("shorts-20");
  if (!charged.ok) {
    limiter.refund(id);
    return Response.json({ error: charged.error, needed: charged.needed, balance: charged.balance }, { status: 402 });
  }

  const prompt =
    `You are a short-form video strategist planning ${count} shorts — about a month of posting.\n\n` +
    (topic ? `The creator asked for: ${topic}\n` : "") +
    (scanned ? `\nFrom their website:\n${siteText}\n` : "") +
    `\nPlatform: ${platform}. Tone: ${tone}.\n` +
    `Language: write EVERY word in ${language.name} (${language.endonym}). ` +
    `Do not use English unless the language IS English.\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"brand": "...", "shorts": [{"hook": "...", "script": "...", "shots": ["..."], ` +
    `"caption": "...", "hashtags": ["..."], "bestFor": "..."}]}\n\n` +
    `- Exactly ${count} shorts, every one a DIFFERENT idea. No two may share a hook or an angle.\n` +
    `- "hook": the first line said on camera. Under 12 words. It has to stop the scroll.\n` +
    `- "script": what to say, 30 to 45 seconds spoken. Written to be read aloud, not read.\n` +
    `- "shots": 2 to 4 plain directions for what is on screen while that is said.\n` +
    `- "caption": the post caption. Put NO hashtags in it — they go in the field below.\n` +
    `- "hashtags": 3 to 6, without the # symbol.\n` +
    `- "bestFor": one of exactly "talking head", "product", "screen recording", "b-roll".\n` +
    `- "brand": whose shorts these are, from the website or the prompt.\n` +
    `- Claim nothing the website or the creator did not say. No invented offers, prices or statistics.`;

  try {
    const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Thirty shorts is a lot of output; thinking is billed against this
        // budget and would consume it before any JSON appeared.
        generationConfig: { temperature: 0.95, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 16384 },
      }),
      signal: AbortSignal.timeout(180_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no shorts returned");
    const parsed = JSON.parse(match[0]);

    const shorts: Short[] = (Array.isArray(parsed.shorts) ? parsed.shorts : [])
      .slice(0, count)
      .map((s: Record<string, unknown>) => ({
        hook: str(s.hook, 200),
        script: str(s.script, 2000),
        shots: (Array.isArray(s.shots) ? s.shots : []).slice(0, 6).map((x: unknown) => str(x, 300)).filter(Boolean),
        caption: stripTags(str(s.caption, 500)),
        hashtags: (Array.isArray(s.hashtags) ? s.hashtags : [])
          .slice(0, 8)
          .map((x: unknown) => str(x, 40).replace(/^#/, ""))
          .filter(Boolean),
        bestFor: str(s.bestFor, 40).toLowerCase() || "talking head",
      }))
      .filter((s: Short) => s.hook && s.script);

    if (shorts.length === 0) throw new Error("no usable shorts were written");

    return Response.json(
      {
        ok: true,
        brand: str(parsed.brand, 120),
        // Said plainly: a short answer must not look like a full month.
        requested: count,
        shorts,
        scanned,
        language: { code: language.code, name: language.name, endonym: language.endonym, rtl: isRTL(language.code) },
        tokensCharged: charged.charge.charged,
        balance: charged.charge.balance,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge); // nothing was written — do not charge
    return Response.json(
      { error: e instanceof Error ? `Couldn't write the shorts: ${e.message}`.slice(0, 200) : "Couldn't write the shorts." },
      { status: 502 },
    );
  }
}
