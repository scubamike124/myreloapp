import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";

// ---------------------------------------------------------------------------
// Story & Memory Generator — the writing half.
//
// The customer's own photographs, in their own order, with a title and a line
// of narration written for each ONE. The model is shown every photo, so the
// narration describes what is actually in them rather than generic sentiment.
//
// Deliberately no video rendering here. The film is assembled in the browser
// from the photos the customer already has (see MemoryFilm.tsx), which means:
//   - the photos never need storing or re-encoding server-side,
//   - the whole tool costs one cheap text call rather than $0.60 of Veo per
//     photograph, which for eight photos would be $4.80 a film,
//   - and the customer gets a real downloadable file, not a slideshow that
//     only exists while the tab is open.
//
// This is the tool for footage you already have. Story Maker invents a series;
// Bedtime Storybook draws one for a child. Nothing here is generated art.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 120;

const TEXT_MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_BODY = 40 * 1024 * 1024; // several phone photos, base64-encoded
const MAX_PHOTOS = 12;
const MIN_PHOTOS = 2;

const DAILY = Number(process.env.MEMORY_FILM_DAILY_LIMIT ?? 10);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 10);

/** How each story type should sound. Keeps "Tribute" from reading like "Kids". */
const TONES: Record<string, string> = {
  family: "warm, affectionate, everyday family life",
  pet: "playful and fond, from the humans who love this animal",
  fantasy: "lightly mythic, as though these were scenes from a legend",
  anime: "energetic and heartfelt, in the spirit of a coming-of-age series",
  kids: "simple, bright and playful, for a young child to follow",
  tribute: "tender and dignified, remembering someone who mattered — never maudlin",
  wedding: "romantic and celebratory, the joy of the day itself",
  vacation: "vivid and sunlit, the feeling of being somewhere new",
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Memory films are unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json({ error: "You've reached today's memory-film limit. Try again tomorrow." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json(
      { error: tooBig ? "Those photos are too large altogether. Try fewer, or smaller ones." : "Invalid request." },
      { status: tooBig ? 413 : 400 },
    );
  }

  const photos = (Array.isArray(body.photos) ? body.photos : [])
    .slice(0, MAX_PHOTOS)
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return { data: str(o.data, 12_000_000), mimeType: str(o.mimeType, 60) || "image/jpeg" };
    })
    .filter((p) => p.data);

  if (photos.length < MIN_PHOTOS) {
    limiter.refund(id);
    return Response.json(
      { error: `Add at least ${MIN_PHOTOS} photos — a film needs something to move between.` },
      { status: 400 },
    );
  }

  const type = str(body.type, 30).toLowerCase() || "family";
  const details = str(body.details, 800);
  const language = getLanguage(str(body.languageCode, 8));

  const charged = await chargeFor("story-memory-generator");
  if (!charged.ok) {
    limiter.refund(id);
    return Response.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  const prompt =
    `You are writing the narration for a short memory film made from the ${photos.length} attached ` +
    `photographs. They are in the order the film will show them.\n\n` +
    `Tone: ${TONES[type] ?? TONES.family}.\n` +
    (details ? `What the person who made this film told us about it: ${details}\n` : "") +
    `\nLanguage: write EVERY word in ${language.name} (${language.endonym}). ` +
    `Do not use English unless the language IS English.\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"title": "...", "opening": "...", "captions": ["...", "..."], "closing": "..."}\n\n` +
    `- "title": 2 to 6 words. The film's title card.\n` +
    `- "opening": one short line for under the title.\n` +
    `- "captions": EXACTLY ${photos.length} entries, one per photograph IN ORDER. One or two sentences ` +
    `each, about what is actually happening in THAT photograph. Look at it — mention what is really ` +
    `there. Never number them or write "photo 1".\n` +
    `- "closing": one line to end on.\n` +
    `- These are real people's real memories. Describe only what you can see and what you were told. ` +
    `Invent no names, no places, no relationships and no events.`;

  try {
    const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...photos.map((p) => ({ inline_data: { mime_type: p.mimeType, data: p.data } })),
            ],
          },
        ],
        // Thinking is billed against maxOutputTokens here and will consume the
        // whole budget before any JSON appears.
        generationConfig: { temperature: 0.85, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(100_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no narration returned");
    const parsed = JSON.parse(match[0]);

    const captions: string[] = (Array.isArray(parsed.captions) ? parsed.captions : [])
      .slice(0, photos.length)
      .map((c: unknown) => str(c, 400));
    if (captions.length === 0) throw new Error("narration had no captions");
    // A short answer must not silently drop the tail of someone's film.
    while (captions.length < photos.length) captions.push("");

    return Response.json(
      {
        ok: true,
        title: str(parsed.title, 120) || "A Memory",
        opening: str(parsed.opening, 300),
        closing: str(parsed.closing, 300),
        captions,
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
      { error: e instanceof Error ? `Couldn't write the narration: ${e.message}`.slice(0, 200) : "Couldn't write the narration." },
      { status: 502 },
    );
  }
}
