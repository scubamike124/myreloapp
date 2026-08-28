// ---------------------------------------------------------------------------
// Stills — most of the commercial, at a twentieth of the price.
//
// Veo is $0.10 a second, so a ten-shot board is six dollars of footage. A
// generated frame is $0.039. The shots in a business commercial are mostly
// things that do not need to move — hands at work, a finished room, a shopfront
// at dusk — and those read better as a photograph with a camera move over them
// than as four seconds of an AI guessing at motion, which is where the warped
// hands and gliding faces come from.
//
// So the picture is generated as a still and the movement is added at assembly,
// where a push-in is arithmetic rather than a hallucination. The hook keeps a
// real Veo clip, because the first second is the one that has to move.
//
// The prompt is built from the same board and the same visual system as the
// video prompts in shoot.ts — a still and a clip of the same commercial have to
// look like they came off the same shoot.
// ---------------------------------------------------------------------------

import { visualSystem } from "./dna";
import type { Scene, Storyboard } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const IMAGE_MODEL = "gemini-2.5-flash-image";

/**
 * Frames are generated taller than they are shown so a push-in has somewhere to
 * go: zooming into a frame that is already the output size means throwing away
 * resolution. 768x1344 against a 720x1280 canvas leaves room to move.
 */
export const FRAME_ASPECT = "9:16";

// Written at length because the short version did not hold. Asked only for "no
// text, no logos", the model still produced an invented brand mark and the
// slogan "FIND YOUR FEAST" on a closing shot, and garbled lettering across an
// apron — a fabricated identity for a business that owns a real one, which is
// the single worst thing this can output. Every surface that tends to carry
// writing is now named individually.
const NEGATIVES =
  "Absolutely no text of any kind anywhere in the image: no words, no letters, no numbers, no captions, " +
  "no slogans, no taglines. No logos, brand marks, emblems, badges or watermarks — invented or otherwise. " +
  "No writing on aprons, uniforms, t-shirts, packaging, boxes, menus, chalkboards, shopfronts, signage, " +
  "posters or vehicles: those surfaces must be plain. " +
  "No extra fingers, no malformed hands, no distorted faces. Nothing illustrated, rendered or AI-generated.";

/** A still's prompt. The camera move is deliberately absent — it is added later. */
export function framePrompt(scene: Scene, board: Storyboard): string {
  const sys = visualSystem(board.visualSystem);

  // The closing beat is the one that asks for a brand mark, and a brand mark is
  // the one thing an image model must never be trusted to produce — it does not
  // know this business's logo, so it designs one. The card is drawn over the
  // picture at assembly, in real type, so what is wanted here is a clean plate
  // with somewhere for it to sit.
  const isEndPlate = scene.beat === "cta";

  return [
    `A single ${scene.shotSize} still frame from a professionally shot television commercial.`,
    isEndPlate
      ? `Subject: ${scene.subject}. Shot as a closing plate: calm, uncluttered, nothing important in the lower ` +
        `third of the frame, with clean empty space there for a title to be placed over afterwards.`
      : `Subject: ${scene.subject}.`,
    `The moment: ${scene.action}.`,
    scene.location ? `Location: ${scene.location}.` : "",
    sys ? `Lens: ${sys.lens}. Lighting: ${sys.light}. Colour grade: ${sys.palette}.` : "",
    // A still composed dead-centre has nowhere for a camera move to go and
    // reads as a stock photograph rather than a frame from a film.
    `Composed as a frame from a film, not a stock photograph: real working people, real wear on real surfaces, ` +
      `natural imperfection, depth in the frame with a clear foreground and background.`,
    `Photographed on a cinema camera. Photoreal.`,
    NEGATIVES,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The plate the presenter stands in front of.
 *
 * The stock avatars ship on a flat studio seamless, and cut against location
 * b-roll that reads as two different films — it was the single worst thing
 * about the finished commercial. HeyGen will composite the avatar over any
 * image, so the presenter gets a background generated from this business's own
 * setting, in the same visual system as every other shot.
 *
 * Composed as an empty room: whatever is generated in the middle of the frame
 * ends up behind the presenter's head.
 */
export function backgroundPrompt(board: Storyboard): string {
  const sys = visualSystem(board.visualSystem);
  // The working beat is where the business's real premises live, so its
  // location is the honest place to put the person who represents it.
  const setting =
    board.scenes.find((s) => s.beat === "solution")?.location ||
    board.scenes.find((s) => s.location)?.location ||
    "the business's own premises";

  return [
    `A wide, empty interior of ${setting}, photographed as the background plate of a television commercial.`,
    `Nobody is in the shot. The centre of the frame is open and uncluttered — a person will be composited`,
    `standing there — so keep the middle clear and put the interest at the edges and in the depth.`,
    sys ? `Lens: ${sys.lens}. Lighting: ${sys.light}. Colour grade: ${sys.palette}.` : "",
    `Shallow depth of field, background softly out of focus, warm and inviting, real wear on real surfaces.`,
    NEGATIVES,
  ]
    .filter(Boolean)
    .join("\n");
}

export class FrameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrameError";
  }
}

/**
 * Generate one still. Returns a data URL so it can go straight into `store`,
 * which is what turns it into a servable file.
 */
export async function renderFrame(key: string, prompt: string, tries = 3): Promise<string> {
  let lastError = "";

  for (let attempt = 1; attempt <= tries; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { imageConfig: { aspectRatio: FRAME_ASPECT } },
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      lastError = "the image model did not answer";
      continue;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastError = data?.error?.message ?? `HTTP ${res.status}`;
      // Image quota is far more generous than video's, but it is not infinite.
      if (res.status === 429 && attempt < tries) {
        await new Promise((r) => setTimeout(r, 4000 * attempt));
        continue;
      }
      if (attempt < tries) continue;
      break;
    }

    type Part = { inlineData?: { data: string; mimeType?: string }; inline_data?: { data: string; mimeType?: string } };
    const parts: Part[] = data?.candidates?.[0]?.content?.parts ?? [];
    const found = parts.map((p) => p.inlineData ?? p.inline_data).find((p) => p?.data);
    if (found?.data) return `data:${found.mimeType ?? "image/png"};base64,${found.data}`;

    // A refusal or a text-only answer is worth one more go with the same
    // prompt — the model is not deterministic and often obliges on a retry.
    lastError = "the model returned no image";
  }

  throw new FrameError(lastError || "the frame could not be generated");
}
