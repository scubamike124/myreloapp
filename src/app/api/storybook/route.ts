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
import { categoryGuidance } from "@/lib/storybook/categories";
import {
  CHILD_IMAGE_CONSENT_TEXT,
  CHILD_IMAGE_CONSENT_VERSION,
  CONSENT_KIND,
  coversCurrentWording,
} from "@/lib/storybook/consent";
import { getStoryProduct } from "@/lib/storybook/products";
import { continuityPrompt } from "@/lib/storybook/story-memory";
import {
  consentsFor,
  episodeFor,
  getCharacter,
  getSeries,
  recordConsent,
  recordEpisode,
  saveCharacter,
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
  let usableBible = bible && isUsable(bible) ? bible : null;

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

  /*
   * A photograph of a person is not accepted without consent on record.
   *
   * This product makes books from pictures of children. The model that makes
   * that legitimate is a service sold to parents — an adult account holder,
   * their own child, and them saying so — and what turns that from a hope into a
   * model is a record: who agreed, to which wording, and when.
   *
   * Enforced here rather than in the browser, because a checkbox the server
   * does not verify is decoration. Enforced only when a photograph is actually
   * being sent: a sequel drawn from an existing description involves no new
   * image of anybody, and asking again would train people to click past it.
   *
   * Anonymous callers cannot reach this point — a paid action requires an
   * account — so there is always someone to attach the record to.
   */
  if (photo) {
    if (!user) {
      limiter.refund(id);
      return Response.json(
        { error: "Create a free account before uploading a photo, so we can record who consented." },
        { status: 401 },
      );
    }
    const already = coversCurrentWording(await consentsFor(user.id, CONSENT_KIND));
    if (!already) {
      if (body.childImageConsent !== true) {
        limiter.refund(id);
        return Response.json(
          {
            error: "Please confirm you are the parent or guardian before uploading a photo.",
            consentRequired: {
              kind: CONSENT_KIND,
              version: CHILD_IMAGE_CONSENT_VERSION,
              text: CHILD_IMAGE_CONSENT_TEXT,
            },
          },
          { status: 428 },
        );
      }
      // Recorded before the photo is used, and the request stops if it cannot
      // be written — proceeding would mean using the image with no record.
      const stored = await recordConsent(user.id, CONSENT_KIND, CHILD_IMAGE_CONSENT_VERSION);
      if (!stored) {
        limiter.refund(id);
        return Response.json(
          { error: "We could not record your consent, so we have not used the photo. Please try again." },
          { status: 503 },
        );
      }
    }
  }

  // Accept legacy childName for older clients; prefer characterName.
  const characterName = str(body.characterName, 40) || str(body.childName, 40) || usableBible?.name || "";
  const idea = str(body.idea, 800);
  const theme = str(body.theme, 60) || "Adventurer";
  const language = getLanguage(str(body.languageCode, 8));
  const pageCount = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Number(body.pages) || 6));
  /*
   * Debug is a development affordance, not a request option.
   *
   * It returns the full story and illustration prompts. Honouring `body.debug`
   * in production would let anyone with curl read the prompt engineering by
   * asking for it, so the request flag only applies where the prompts are not
   * a secret in the first place.
   */
  const debug = process.env.NODE_ENV !== "production" && body.debug !== false;

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

  // The adventure type and the occasion. Both optional: a parent who just types
  // what they want still gets exactly that, which is how this tool already
  // worked and is not something to take away.
  const categoryId = str(body.categoryId, 40);
  const seasonalId = str(body.seasonalId, 40);
  const guidance = categoryGuidance(categoryId, seasonalId || undefined);

  const promptInput = {
    characterName,
    idea,
    theme,
    languageName: language.name,
    languageEndonym: language.endonym,
    pageCount,
    guidance,
    continuity,
  };
  const summary = summarizeStorybookRequest(promptInput);
  const adultOriented = looksAdultOriented(idea, characterName);
  const storyPrompt = buildStoryPrompt(promptInput);

  if (debug) {
    console.info("[storybook] request", summary);
    console.info("[storybook] storyPrompt\n", storyPrompt);
  }

  /*
   * The character bible, written the first time we see the child.
   *
   * The directive says "every child receives a permanent Character Bible" and
   * that parents "should not need to upload another picture unless they want to
   * update it". Both sentences describe something automatic, and until now
   * nothing created one: the only writer was an endpoint no screen called, so
   * the reuse branch above could never fire, the library's Characters shelf was
   * permanently empty, and every book re-derived the child's appearance from a
   * fresh photograph — which is exactly the drift the bible exists to stop.
   *
   * It is derived here, before the illustrations, rather than after the story is
   * saved. Deriving it afterwards would leave the very first book drawn without
   * it, so book one would be the one that looks different.
   *
   * What is stored is the description, never the photograph. The storybook page
   * promises parents their photo "is not kept by Reelo", and that promise is
   * older than this feature.
   */
  const deriveBible = async (): Promise<void> => {
    if (!user || !photo || usableBible) return;
    try {
      const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: photo } },
                {
                  text:
                    `Describe the person in this photograph so an illustrator could draw them consistently ` +
                    `in a children's picture book, without seeing the photo.\n\n` +
                    `Return ONLY JSON, no markdown fence:\n` +
                    `{"face":"...","hair":"...","clothing":"...","bodyProportions":"...","ageBand":"3-5|6-8|9-12"}\n\n` +
                    `- "face": skin tone, face shape, eyes, and any distinctive features such as glasses, ` +
                    `freckles or facial hair. One sentence.\n` +
                    `- "hair": colour, length and style. One short phrase.\n` +
                    `- "clothing": what they are wearing, as a short phrase.\n` +
                    `- "bodyProportions": build and approximate height for their age. Short phrase.\n` +
                    `- "ageBand": the closest of 3-5, 6-8 or 9-12. Omit the field entirely if the subject ` +
                    `is clearly an adult.\n` +
                    `Be factual and neutral. Do not guess a name, a mood, or anything not visible.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) return;
      const data = asRecord(await res.json());
      const match = (geminiText(data) ?? "").match(/\{[\s\S]*\}/);
      if (!match) return;
      const parsed = asRecord(JSON.parse(match[0]));

      const band = str(parsed.ageBand, 8);
      const draft = {
        name: characterName || "the main character",
        ageBand: (["3-5", "6-8", "9-12"] as const).includes(band as "3-5") ? (band as "3-5") : undefined,
        face: str(parsed.face, 400),
        hair: str(parsed.hair, 200),
        clothing: str(parsed.clothing, 200),
        bodyProportions: str(parsed.bodyProportions, 200) || undefined,
        // Held so a whole series shares one look, not just one book.
        animationStyle: adultOriented ? "expressive cinematic storybook art" : "warm painterly storybook art",
        expressions: [] as string[],
        personality: [] as string[],
        voice: {},
      };

      // A half-filled bible would draw a different child every time, which is
      // worse than having none — so an incomplete description is discarded and
      // the photo carries this book on its own.
      if (!isUsable(draft)) return;
      usableBible = await saveCharacter(user.id, draft);
    } catch {
      /*
       * A failed derivation must never fail the book. The parent is about to be
       * charged for a story, not for a character record, and the photo still
       * carries this book exactly as it did before.
       */
    }
  };
  await deriveBible();

  /*
   * What is being bought.
   *
   * The charge follows the product rather than a fixed action, so a film is
   * billed as a film. The slug comes off the product record instead of being
   * built from the id, because an action the pricing table does not recognise
   * does not fail — `costOf` quietly bills one token, which on the film would
   * sell $40 of work for $10.
   *
   * Unknown or absent means the e-book, which is what this tool has always
   * produced; an older client that sends no product keeps working and keeps
   * paying the same price.
   */
  const product = getStoryProduct(str(body.productId, 20)) ?? getStoryProduct("ebook");
  const charged = await chargeFor(product?.chargeAction ?? "storybook-ebook");
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
    // The fallback goes to errorMessage, which returns "" rather than null when
    // there is no message — and `"" ?? x` is "", so a `??` here left the parent
    // reading "Couldn't write the story:" with nothing after the colon.
    if (!res.ok) throw new Error(errorMessage(data, `HTTP ${res.status}`));
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

  /*
   * A book with no pictures is not the book that was paid for.
   *
   * Every failure in the illustration loop is swallowed by design — `withRetry`
   * catches, and `illustrate` returns "" on a bad response — so that one dead
   * page does not lose the other nine. But the same silence turned a total
   * failure into a cheerful 200: when the image model is refusing every request,
   * which is the exact condition the sequential loop above exists to survive,
   * the parent was billed the full price and a daily-limit slot for a book of
   * text, and then told to regenerate at full price again.
   *
   * A partly-illustrated book is still a book and is still charged; the UI
   * already reports how many pages came out. None at all is a refund.
   */
  if (!images.some(Boolean)) {
    limiter.refund(id);
    await refundCharge(charged.charge);
    return Response.json(
      {
        error:
          "The story was written, but none of the pages could be illustrated — you have not been charged. Please try again in a few minutes.",
        refunded: true,
        title: story.title,
        dedication: story.dedication,
        // The words are still returned: the parent waited for them, and losing
        // the story as well as the pictures helps nobody.
        pages: story.pages.map((p) => ({ text: p.text, image: "", illustration: p.illustration })),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
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
        category: categoryId,
        theme,
        languageCode: language.code,
        request: idea,
        pages: storedPages,
        characterVersion: usableBible?.version ?? 1,
        product: product?.id ?? "ebook",
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
      // What was bought, so the screen that follows knows whether to offer the
      // film — and so a receipt can be checked against what was charged.
      product: product ? { id: product.id, name: product.name, tokens: product.tokens } : null,
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
        categoryId: categoryId || null,
        seasonalId: seasonalId || null,
        characterName: characterName || null,
        pages: pageCount,
        languageCode: language.code,
        adultOriented,
        photoBytesApprox: Math.floor(photo.length * 0.75),
        // This block exists to be proof of what was actually used, so it has to
        // be true: a sequel drawn from a stored bible attaches no photo, and
        // claiming otherwise would make the proof worthless.
        photoAttached: Boolean(photo),
        characterFromBible: usableBible ? usableBible.id : null,
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
