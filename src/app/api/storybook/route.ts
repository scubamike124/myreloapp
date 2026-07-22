import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";

// ---------------------------------------------------------------------------
// Personalised children's storybook.
//
// A parent uploads a photo of their child and a one-line idea ("a story about
// a red ball"). We write an age-appropriate story in their chosen language,
// then illustrate every page with the child as the hero — using their photo as
// the character reference so the same child appears on each page.
//
// Two model calls per book plus one image per page, so this is the most
// expensive thing in the product. It is capped per day accordingly.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_BODY = 12 * 1024 * 1024; // a phone photo, base64-encoded
const MIN_PAGES = 4;
const MAX_PAGES = 10;

const DAILY = Number(process.env.STORYBOOK_DAILY_LIMIT ?? 5);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 5);

type Page = { text: string; illustration: string };

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Storybooks are unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json({ error: "You've reached today's storybook limit. Try again tomorrow." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json(
      { error: tooBig ? "That photo is too large. Try one under about 8MB." : "Invalid request." },
      { status: tooBig ? 413 : 400 },
    );
  }

  const photo = str(body.photo, 16_000_000);
  const mimeType = str(body.mimeType, 60) || "image/jpeg";
  if (!photo) {
    limiter.refund(id);
    return Response.json({ error: "Upload a photo of your child to start." }, { status: 400 });
  }

  const childName = str(body.childName, 40);
  const idea = str(body.idea, 400);
  const theme = str(body.theme, 60) || "Superhero";
  const language = getLanguage(str(body.languageCode, 8));
  const pageCount = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Number(body.pages) || 6));

  const hero = childName || "the child";

  // Charged once the input is known to be usable, before any paid model call.
  const charged = await chargeFor("bedtime-storybook");
  if (!charged.ok) {
    limiter.refund(id);
    return Response.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  // --- 1. the story ---------------------------------------------------------
  const storyPrompt =
    `Write a gentle bedtime picture-book story for a child aged about 3 to 7.\n\n` +
    `Hero: ${hero}, who becomes a ${theme.toLowerCase()}.\n` +
    (idea ? `The parent asked for: ${idea}\n` : "") +
    `Language: write EVERY word of the story in ${language.name} (${language.endonym}). ` +
    `Do not use English unless the language IS English.\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"title": "...", "dedication": "...", "pages": [{"text": "...", "illustration": "..."}]}\n\n` +
    `- Exactly ${pageCount} pages.\n` +
    `- "text": 2 to 3 short sentences for that page, in ${language.name}. Warm, simple, read-aloud rhythm.\n` +
    `- "dedication": one short line, in ${language.name}, e.g. "For ${hero}, who is braver than they know."\n` +
    `- "illustration": a description IN ENGLISH of what to draw for that page. Describe the scene, ` +
    `the action and the mood. Always refer to the hero simply as "the child". Do not mention text or words.\n` +
    `- A complete arc: ordinary world, a problem, courage, resolution, a calm ending suitable for bedtime.\n` +
    `- Nothing frightening. No peril that is not resolved on the same page.`;

  let story: { title: string; dedication: string; pages: Page[] };
  try {
    const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: storyPrompt }] }],
        // Thinking tokens are billed against maxOutputTokens on this model and
        // will happily consume the whole budget before writing any JSON.
        generationConfig: { temperature: 0.9, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no story returned");
    const parsed = JSON.parse(match[0]);
    story = {
      title: str(parsed.title, 120) || "A Bedtime Story",
      dedication: str(parsed.dedication, 200),
      pages: (Array.isArray(parsed.pages) ? parsed.pages : [])
        .slice(0, pageCount)
        .map((p: Record<string, unknown>) => ({ text: str(p.text, 600), illustration: str(p.illustration, 600) }))
        .filter((p: Page) => p.text),
    };
    if (story.pages.length === 0) throw new Error("story had no pages");
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge); // no book was written — do not charge for one
    return Response.json(
      { error: e instanceof Error ? `Couldn't write the story: ${e.message}`.slice(0, 200) : "Couldn't write the story." },
      { status: 502 },
    );
  }

  // --- 2. the illustrations -------------------------------------------------
  // The child's photo is passed with every page so the same character appears
  // throughout. Generated in parallel — sequentially this would exceed the
  // function's time limit at 10 pages.
  const style =
    "Children's picture-book illustration, warm and friendly, soft rounded shapes, rich colour, " +
    "painterly storybook art, gentle lighting, cosy bedtime mood, no text, no words, no letters, " +
    "no watermark, full-bleed square composition.";

  // The image model returns 503 "high demand" under load, and firing every page
  // at once makes that more likely. Retried with backoff, and staggered, so a
  // book does not come back half-illustrated because of a momentary spike.
  const withRetry = async (fn: () => Promise<string>, attempts = 3): Promise<string> => {
    for (let i = 0; i < attempts; i++) {
      const out = await fn().catch(() => "");
      if (out) return out;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    }
    return "";
  };

  const illustrate = async (page: Page): Promise<string> => {
    const prompt =
      `${style}\n\n` +
      `Draw this scene: ${page.illustration}\n\n` +
      `The child in the attached photograph is the hero of the story. Render them as a friendly ` +
      `illustrated character — keep their recognisable features (face shape, hair, skin tone, glasses ` +
      `if present) but draw them in the picture-book style, NOT as a photograph. ` +
      `They are dressed as a ${theme.toLowerCase()}.`;
    const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: photo } }] }],
        generationConfig: { temperature: 0.8 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const part = (data?.candidates?.[0]?.content?.parts ?? []).find(
      (p: Record<string, unknown>) => p.inlineData || p.inline_data,
    );
    const payload = (part?.inlineData || part?.inline_data) as { data?: string; mimeType?: string } | undefined;
    return payload?.data ? `data:${payload.mimeType ?? "image/png"};base64,${payload.data}` : "";
  };

  const images = await Promise.all(
    story.pages.map((p, i) =>
      // Stagger the starts so ten pages do not hit the model in the same instant.
      new Promise<string>((resolve) =>
        setTimeout(() => resolve(withRetry(() => illustrate(p))), i * 700),
      ),
    ),
  );

  return Response.json(
    {
      ok: true,
      title: story.title,
      dedication: story.dedication,
      language: { code: language.code, name: language.name, endonym: language.endonym, rtl: isRTL(language.code) },
      pages: story.pages.map((p, i) => ({ text: p.text, image: images[i] })),
      // Told plainly rather than hidden: a page without art is still readable.
      illustrated: images.filter(Boolean).length,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
