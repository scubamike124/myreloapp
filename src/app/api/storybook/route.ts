import { asRecord, asString, errorMessage, geminiParts, geminiText } from "@/lib/json";
import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";
import { currentUser } from "@/lib/accounts";
import {
  buildIllustrationPrompt,
  buildStoryPrompt,
  looksAdultOriented,
  summarizeStorybookRequest,
} from "@/lib/storybook-prompts";
import { appearancePrompt, isUsable } from "@/lib/storybook/character-bible";
import { continuityPrompt } from "@/lib/storybook/story-memory";
import {
  episodeFor,
  getCharacter,
  getSeries,
  recordEpisode,
  saveStory,
  storeIllustrations,
} from "@/lib/storybook/store";

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

  /*
   * Who this is for.
   *
   * Anonymous generation still works — it always has, and requiring an account
   * to try the product once is a decision nobody made. What an anonymous
   * request cannot have is a library, a saved character or a sequel, because
   * there is no one to file them under. The response says so rather than
   * quietly dropping the book.
   */
  const user = await currentUser().catch(() => null);

  /*
   * A returning character.
   *
   * The directive: "Future stories should reuse this Character Bible
   * automatically. Parents should not need to upload another picture unless
   * they want to update it." So a stored bible substitutes for the photo — and
   * only a usable one does, since a half-filled bible would produce a
   * different-looking child, which is the failure it exists to prevent.
   */
  const characterId = str(body.characterId, 60);
  const bible = user && characterId ? await getCharacter(user.id, characterId) : null;
  const usableBible = bible && isUsable(bible) ? bible : null;

  if (!photo && !usableBible) {
    limiter.refund(id);
    return Response.json(
      {
        error: characterId
          ? "That saved character is missing its description — upload a photo to rebuild it."
          : "Upload a photo of the main character to start.",
      },
      { status: 400 },
    );
  }

  // Accept legacy childName for older clients; prefer characterName.
  const characterName = str(body.characterName, 40) || str(body.childName, 40) || usableBible?.name || "";
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

  /*
   * A sequel.
   *
   * The series is loaded before the story is written, because continuity is an
   * input to the writing rather than a label applied afterwards. A series the
   * signed-in user does not own simply does not load, and the story is written
   * as a standalone.
   */
  const seriesId = str(body.seriesId, 60);
  const series = user && seriesId ? await getSeries(user.id, seriesId) : null;
  const episode = episodeFor(series);
  const continuity = series ? continuityPrompt(series.memory, series.title) : "";

  const promptInput = {
    characterName,
    idea,
    theme,
    languageName: language.name,
    languageEndonym: language.endonym,
    pageCount,
    continuity,
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

  // The bible's appearance sentence, identical on every page and in every book
  // — that sameness is the whole point of storing it as words.
  const appearance = usableBible ? appearancePrompt(usableBible) : "";

  const illustrate = async (page: Page): Promise<string> => {
    const prompt = buildIllustrationPrompt({
      illustration: page.illustration,
      theme,
      pageText: page.text,
      adultOriented,
      characterName,
      appearance,
      hasPhoto: Boolean(photo),
    });
    imagePrompts.push(prompt);
    if (debug) console.info("[storybook] imagePrompt", prompt.slice(0, 500));

    // Photo first so the model anchors identity before reading the scene text.
    const parts = photo
      ? [{ inline_data: { mime_type: mimeType, data: photo } }, { text: prompt }]
      : [{ text: prompt }];
    const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
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

  // --- 3. keep it ------------------------------------------------------------
  /*
   * Persistence never fails the request.
   *
   * By this point the parent has spent tokens and waited a couple of minutes,
   * and the finished book is in the response below either way. A failure here
   * costs them the library entry, not the story — so the result is reported as
   * `saved` rather than thrown, and the UI can tell them to download it.
   */
  const responsePages = story.pages.map((p, i) => ({
    text: p.text,
    image: images[i],
    illustration: p.illustration,
  }));

  let storyId: string | null = null;
  let saved = false;
  if (user) {
    try {
      // Illustrations move to storage first: a story row carrying ten base64
      // images would be megabytes, and the library only ever wants the cover.
      const { pages: storedPages } = await storeIllustrations(responsePages);
      const record = await saveStory({
        userId: user.id,
        characterId: usableBible?.id ?? null,
        seriesId: series?.id ?? null,
        episode,
        title: story.title,
        dedication: story.dedication,
        theme,
        languageCode: language.code,
        request: idea,
        pages: storedPages,
        characterVersion: usableBible?.version ?? 1,
      });
      storyId = record?.id ?? null;
      saved = Boolean(record);

      // Only once the story is genuinely on disk does the series learn about
      // it. Recording an episode that failed to save would leave the memory
      // describing a book nobody can open.
      if (record && series) {
        await recordEpisode(
          series,
          { episode, title: story.title, summary: story.pages[0]?.text ?? "" },
          { characters: characterName ? [characterName] : [] },
        );
      }
    } catch {
      /* the book is still in the response */
    }
  }

  // Put metadata before huge page payloads so clients always receive personalization proof.
  return Response.json(
    {
      ok: true,
      storyId,
      saved,
      signedIn: Boolean(user),
      series: series ? { id: series.id, title: series.title, episode } : null,
      character: usableBible ? { id: usableBible.id, name: usableBible.name, version: usableBible.version } : null,
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
      pages: responsePages,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
