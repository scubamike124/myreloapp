import { readFile } from "node:fs/promises";
import path from "node:path";
import { clientId, createDailyLimiter, readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { getLanguage, isRTL } from "@/lib/languages";
import { chargeFor, refundCharge } from "@/lib/charge";
import { CATALOG } from "@/lib/avatar-catalog";

// ---------------------------------------------------------------------------
// AI Story Maker — an ongoing illustrated series.
//
// Deliberately NOT the Bedtime Storybook, which the two tools had drifted into
// describing identically. The difference that matters:
//
//   Bedtime Storybook  one short book, finished in one go, a child's own photo,
//                      gentle and age 3-7. You read it tonight.
//   AI Story Maker     a cast member — an uploaded photo OR any Reelo character
//                      (the banana, a dragon, a warlord) — starring in long
//                      episodes that keep going, each one remembering the last.
//
// One episode per request. That is what makes "long" affordable: eight scenes
// of real narration comfortably fit the function's time limit, where a whole
// season in one call would not. Continuity comes from the client passing back
// the recaps of earlier episodes, so the series remembers itself without any
// server-side session to keep in step.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_BODY = 12 * 1024 * 1024;
const MIN_SCENES = 6;
const MAX_SCENES = 10;

const DAILY = Number(process.env.STORY_MAKER_DAILY_LIMIT ?? 5);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 5);

type Scene = { text: string; illustration: string };
type Episode = { title: string; synopsis: string; scenes: Scene[]; recap: string; cliffhanger: string };

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/**
 * The character's reference picture, as base64.
 *
 * An avatarId is resolved through the catalog rather than by trusting a path
 * from the request — the caller never names a file, so nothing can be read out
 * of the media directory.
 */
async function characterImage(
  avatarId: string,
  uploaded: string,
  uploadedMime: string,
): Promise<{ data: string; mimeType: string } | null> {
  if (uploaded) return { data: uploaded, mimeType: uploadedMime || "image/jpeg" };
  if (!avatarId) return null;

  const found = CATALOG.find((a) => a.avatarId === avatarId);
  if (!found?.image) return null;

  try {
    if (/^https?:\/\//i.test(found.image)) {
      const res = await fetch(found.image, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return { data: buf.toString("base64"), mimeType: res.headers.get("content-type") ?? "image/webp" };
    }
    // A Reelo character shipped in public/. found.image comes from the catalog,
    // not the request, so this join cannot be steered elsewhere.
    const file = path.join(process.cwd(), "public", found.image.replace(/^\//, ""));
    const buf = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { data: buf.toString("base64"), mimeType: mime };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Story Maker is unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json({ error: "You've reached today's episode limit. Try again tomorrow." }, { status: 429 });
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

  const avatarId = str(body.avatarId, 80);
  const uploaded = str(body.photo, 16_000_000);
  const character = await characterImage(avatarId, uploaded, str(body.mimeType, 60));
  if (!character) {
    limiter.refund(id);
    return Response.json(
      { error: "Pick a character or upload a photo to star in the series." },
      { status: 400 },
    );
  }

  const characterName = str(body.characterName, 60) || "the hero";
  const premise = str(body.premise, 600);
  const genre = str(body.genre, 40) || "Adventure";
  const language = getLanguage(str(body.languageCode, 8));
  const sceneCount = Math.max(MIN_SCENES, Math.min(MAX_SCENES, Number(body.scenes) || 8));
  const episodeNumber = Math.max(1, Math.min(50, Number(body.episodeNumber) || 1));

  // What happened so far, newest last. Only recaps travel, not whole episodes —
  // enough for continuity without spending the context on prose the model has
  // already written.
  const previously = (Array.isArray(body.previously) ? body.previously : [])
    .slice(-8)
    .map((p) => {
      const e = (p ?? {}) as Record<string, unknown>;
      return { number: Number(e.number) || 0, title: str(e.title, 120), recap: str(e.recap, 600) };
    })
    .filter((p) => p.recap);

  const charged = await chargeFor("ai-story-maker");
  if (!charged.ok) {
    limiter.refund(id);
    return Response.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  // --- 1. the episode -------------------------------------------------------

  const history = previously.length
    ? `THE STORY SO FAR — these episodes already happened, do not repeat them:\n` +
      previously.map((p) => `Episode ${p.number}${p.title ? ` "${p.title}"` : ""}: ${p.recap}`).join("\n") +
      `\n\nEpisode ${episodeNumber} must follow on directly from the end of episode ${previously[previously.length - 1].number}.\n\n`
    : "";

  const episodePrompt =
    `You are writing episode ${episodeNumber} of an ongoing ${genre.toLowerCase()} series.\n\n` +
    `The star of the series is ${characterName}.\n` +
    (premise ? `The series is about: ${premise}\n` : "") +
    `\n${history}` +
    `Language: write EVERY word of the narration in ${language.name} (${language.endonym}). ` +
    `Do not use English unless the language IS English.\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"title": "...", "synopsis": "...", "scenes": [{"text": "...", "illustration": "..."}], ` +
    `"recap": "...", "cliffhanger": "..."}\n\n` +
    `- Exactly ${sceneCount} scenes.\n` +
    `- "text": this is a LONG-form episode, so write 5 to 8 full sentences per scene in ${language.name}. ` +
    `Real storytelling — dialogue, what the character notices, what they feel. Not a caption.\n` +
    `- "title": the episode's own title, in ${language.name}.\n` +
    `- "synopsis": one or two sentences, in ${language.name}, describing this episode.\n` +
    `- "recap": 2 to 3 sentences IN ENGLISH summarising what happened and what changed, ` +
    `including anything a later episode must remember. This is the series memory.\n` +
    `- "cliffhanger": one sentence, in ${language.name}, setting up the next episode.\n` +
    `- "illustration": a description IN ENGLISH of what to draw for that scene — the setting, the ` +
    `action, the mood. Always call the star simply "the character". Never mention text or words.\n` +
    `- The episode must stand on its own AND move the larger story forward.`;

  // The text model answers "currently experiencing high demand" often enough
  // that a single attempt loses whole episodes to a spike that clears in
  // seconds. The illustrations already retried; the writing did not, which made
  // the one call the episode cannot survive losing also the most fragile.
  const writeOnce = async (): Promise<string> => {
    const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: episodePrompt }] }],
        // Thinking is billed against maxOutputTokens on this model and will eat
        // the whole budget before a single line of JSON appears.
        generationConfig: { temperature: 0.95, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
    return (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  };

  let episode: Episode;
  try {
    let text = "";
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        text = await writeOnce();
        if (text) break;
      } catch (e) {
        lastErr = e;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
    if (!text) throw lastErr ?? new Error("no episode returned");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no episode returned");
    const parsed = JSON.parse(match[0]);
    episode = {
      title: str(parsed.title, 140) || `Episode ${episodeNumber}`,
      synopsis: str(parsed.synopsis, 400),
      recap: str(parsed.recap, 600),
      cliffhanger: str(parsed.cliffhanger, 300),
      scenes: (Array.isArray(parsed.scenes) ? parsed.scenes : [])
        .slice(0, sceneCount)
        .map((s: Record<string, unknown>) => ({ text: str(s.text, 2500), illustration: str(s.illustration, 700) }))
        .filter((s: Scene) => s.text),
    };
    if (episode.scenes.length === 0) throw new Error("episode had no scenes");
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge); // nothing was written — do not charge for it
    return Response.json(
      { error: e instanceof Error ? `Couldn't write the episode: ${e.message}`.slice(0, 200) : "Couldn't write the episode." },
      { status: 502 },
    );
  }

  // --- 2. the artwork -------------------------------------------------------
  // The character's picture goes with every scene so the same face — or the
  // same banana — appears throughout the series, not just within one episode.

  const style =
    `Cinematic illustrated story art, ${genre.toLowerCase()} series, rich colour, dramatic lighting, ` +
    `detailed painterly rendering, widescreen composition, no text, no words, no letters, no watermark.`;

  const withRetry = async (fn: () => Promise<string>, attempts = 3): Promise<string> => {
    for (let i = 0; i < attempts; i++) {
      const out = await fn().catch(() => "");
      if (out) return out;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    }
    return "";
  };

  const illustrate = async (scene: Scene): Promise<string> => {
    const prompt =
      `${style}\n\n` +
      `Draw this scene: ${scene.illustration}\n\n` +
      `The subject in the attached picture is ${characterName}, the recurring star of this series. ` +
      `Render them as an illustrated character in the style above, keeping them instantly ` +
      `recognisable — same shape, colours and distinguishing features — so they look like the same ` +
      `character in every episode. If the subject is an object, an animal or a piece of fruit, give ` +
      `it life as a character with expression and personality rather than drawing a still life.`;
    const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }, { inline_data: { mime_type: character.mimeType, data: character.data } }] },
        ],
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
    episode.scenes.map((s, i) =>
      new Promise<string>((resolve) => setTimeout(() => resolve(withRetry(() => illustrate(s))), i * 700)),
    ),
  );

  return Response.json(
    {
      ok: true,
      episodeNumber,
      title: episode.title,
      synopsis: episode.synopsis,
      cliffhanger: episode.cliffhanger,
      // Sent back so the client can hand it to the next episode as memory.
      recap: episode.recap,
      language: { code: language.code, name: language.name, endonym: language.endonym, rtl: isRTL(language.code) },
      scenes: episode.scenes.map((s, i) => ({ text: s.text, image: images[i] })),
      illustrated: images.filter(Boolean).length,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
