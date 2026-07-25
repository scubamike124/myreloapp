import { asRecord, asString, errorMessage, geminiParts, geminiText } from "@/lib/json";
import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";
import {
  buildIllustrationPrompt,
  buildStoryPrompt,
  looksAdultOriented,
  summarizeStorybookRequest,
} from "@/lib/storybook-prompts";

// ---------------------------------------------------------------------------
// Personalised storybook.
//
// Upload a photo of the main character + a custom story request. The user's
// "What should the story be about?" text is the PRIMARY plot instruction.
// Theme only affects costume/role. The photo is the visual identity reference
// on every illustrated page (age and features preserved).
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_BODY = 12 * 1024 * 1024;
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
    return Response.json({ error: "Upload a photo of the main character to start." }, { status: 400 });
  }

  // Accept legacy childName for older clients; prefer characterName.
  const characterName = str(body.characterName, 40) || str(body.childName, 40);
  const idea = str(body.idea, 800);
  const theme = str(body.theme, 60) || "Adventurer";
  const language = getLanguage(str(body.languageCode, 8));
  const pageCount = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Number(body.pages) || 6));
  const debug = body.debug === true || process.env.NODE_ENV !== "production";

  if (!idea) {
    limiter.refund(id);
    return Response.json(
      { error: "Tell us what the story should be about — your request becomes the plot." },
      { status: 400 },
    );
  }

  const promptInput = {
    characterName,
    idea,
    theme,
    languageName: language.name,
    languageEndonym: language.endonym,
    pageCount,
  };
  const summary = summarizeStorybookRequest(promptInput);
  const adultOriented = looksAdultOriented(idea, characterName);
  const storyPrompt = buildStoryPrompt(promptInput);

  if (debug) {
    console.info("[storybook] request", summary);
    console.info("[storybook] storyPrompt\n", storyPrompt);
  }

  const charged = await chargeFor("bedtime-storybook");
  if (!charged.ok) {
    limiter.refund(id);
    return Response.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  // --- 1. the story ---------------------------------------------------------
  let story: { title: string; dedication: string; pages: Page[] };
  try {
    const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: storyPrompt }] }],
        generationConfig: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const data = asRecord(await res.json());
    if (!res.ok) throw new Error(errorMessage(data, "") ?? `HTTP ${res.status}`);
    const text = geminiText(data) ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no story returned");
    const parsed = JSON.parse(match[0]);
    story = {
      title: str(parsed.title, 120) || "A Story",
      dedication: str(parsed.dedication, 200),
      pages: (Array.isArray(parsed.pages) ? parsed.pages : [])
        .slice(0, pageCount)
        .map((p: Record<string, unknown>) => ({ text: str(p.text, 600), illustration: str(p.illustration, 600) }))
        .filter((p: Page) => p.text),
    };
    if (story.pages.length === 0) throw new Error("story had no pages");
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge);
    return Response.json(
      {
        error:
          e instanceof Error ? `Couldn't write the story: ${e.message}`.slice(0, 200) : "Couldn't write the story.",
      },
      { status: 502 },
    );
  }

  // --- 2. the illustrations -------------------------------------------------
  const withRetry = async (fn: () => Promise<string>, attempts = 3): Promise<string> => {
    for (let i = 0; i < attempts; i++) {
      const out = await fn().catch(() => "");
      if (out) return out;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    }
    return "";
  };

  const imagePrompts: string[] = [];

  const illustrate = async (page: Page): Promise<string> => {
    const prompt = buildIllustrationPrompt({
      illustration: page.illustration,
      theme,
      pageText: page.text,
      adultOriented,
      characterName,
    });
    imagePrompts.push(prompt);
    if (debug) console.info("[storybook] imagePrompt", prompt.slice(0, 500));

    // Photo first so the model anchors identity before reading the scene text.
    const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: photo } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { temperature: 0.35 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return "";
    const data = asRecord(await res.json());
    const part = geminiParts(data).find((p) => {
      const rec = asRecord(p);
      return Boolean(rec.inlineData || rec.inline_data);
    });
    const payload = asRecord(asRecord(part).inlineData || asRecord(part).inline_data);
    return typeof payload.data === "string"
      ? `data:${asString(payload.mimeType, "image/png")};base64,${payload.data}`
      : "";
  };

  // Illustrate sequentially with retries — parallel bursts often 503 under load
  // and left books half-empty.
  const images: string[] = [];
  for (let i = 0; i < story.pages.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 400));
    images.push(await withRetry(() => illustrate(story.pages[i]), 4));
  }

  // Put metadata before huge page payloads so clients always receive personalization proof.
  return Response.json(
    {
      ok: true,
      title: story.title,
      dedication: story.dedication,
      language: { code: language.code, name: language.name, endonym: language.endonym, rtl: isRTL(language.code) },
      illustrated: images.filter(Boolean).length,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      submitted: {
        idea,
        theme,
        characterName: characterName || null,
        pages: pageCount,
        languageCode: language.code,
        adultOriented,
        photoBytesApprox: Math.floor(photo.length * 0.75),
        photoAttached: true,
      },
      ...(debug
        ? {
            debug: {
              summary,
              storyPrompt,
              imagePromptStructure:
                imagePrompts[0] ||
                buildIllustrationPrompt({
                  illustration: "(scene)",
                  theme,
                  pageText: "(page text)",
                  adultOriented,
                  characterName,
                }),
            },
          }
        : {}),
      pages: story.pages.map((p, i) => ({ text: p.text, image: images[i], illustration: p.illustration })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
