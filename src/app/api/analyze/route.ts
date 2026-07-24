import { asRecord, errorMessage, geminiText } from "@/lib/json";
import { NextResponse } from "next/server";
import { UnsafeUrlError, assertSafeUrl, clientId, createDailyLimiter } from "@/lib/api-guard";
import { scrapePage } from "@/lib/scrape";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash";

// Scanning a site costs a Gemini call, so cap it per user per day.
const limiter = createDailyLimiter(Number(process.env.ANALYZE_DAILY_LIMIT ?? 25));

const SCHEMA = {
  type: "object",
  properties: {
    businessName: { type: "string" },
    category: { type: "string" },
    about: { type: "string" },
    tone: { type: "string" },
    script: { type: "string" },
    ideas: { type: "array", items: { type: "string" } },
  },
  required: ["businessName", "about", "tone", "script", "ideas"],
};

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${limiter.limit} scans per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  // Validate BEFORE fetching: this URL is attacker-controlled and the fetch
  // runs from inside our network.
  let url: string;
  try {
    const body = asRecord(await req.json());
    url = await assertSafeUrl(String(body.url ?? ""));
  } catch (e) {
    limiter.refund(id);
    const msg = e instanceof UnsafeUrlError ? e.message : "Invalid URL.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let siteText = "";
  try {
    siteText = await scrapePage(url);
  } catch {
    siteText = `(Could not fetch the page. Infer the business from the domain name only.)`;
  }

  const prompt = `You are a senior brand & video-marketing strategist. Analyze the following website and return ONLY JSON matching the schema.
- businessName: the brand/company name.
- category: the industry/niche (2-4 words).
- about: 1-2 sentence summary of what the business does.
- tone: brand tone in 1-3 words (e.g. "Bold & premium").
- script: a punchy, CINEMATIC 30-second commercial voiceover script for this brand. Keep it under 90 words. No scene directions — just the spoken lines.
- ideas: EXACTLY 20 short, catchy short-form (TikTok/Reels) video idea titles for this brand.

Website: ${url}
--- WEBSITE CONTENT ---
${siteText}`;

  try {
    const gemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: "application/json", responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    const data = asRecord(await gemini.json());
    if (!gemini.ok) {
      const msg = errorMessage(data, `Gemini error ${gemini.status}`);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const text = geminiText(data);
    if (!text) return NextResponse.json({ error: "Gemini returned no content." }, { status: 502 });

    const parsed = JSON.parse(text);
    return NextResponse.json({ ok: true, url, ...parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed." }, { status: 502 });
  }
}
