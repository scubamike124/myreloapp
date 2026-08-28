// ---------------------------------------------------------------------------
// The presenter — the voice, and the human on camera.
//
// This is the piece that was missing from every version before it. The board
// always wrote a voiceover; nothing ever spoke it, so the commercial came out
// silent, and the only "motion" was a camera move over a photograph.
//
// HeyGen renders a photoreal person delivering a script, with natural gesture,
// and returns picture AND speech in one file. That single clip does three jobs
// at once: it is the voice for the whole commercial, it is the human presence,
// and — because one element plays start to finish while the canvas cuts away
// and back — it is the clock everything else is timed against, so the audio
// cannot drift out of sync with the lips.
//
// The economics are the other reason. The account already holds thousands of
// HeyGen credits, so the presenter costs nothing at the margin, where the same
// thirty seconds of generated video would be three dollars.
// ---------------------------------------------------------------------------

import { beat } from "./dna";
import { checkRender, isVideoId, startRender, uploadAsset, type RenderStatus } from "@/lib/heygen";
import type { BeatId, Scene, Storyboard } from "./types";

/**
 * HeyGen has no duration parameter — length is however long the words take to
 * say. The route caps the script at 81 words for a 30-second maximum, so the
 * script is built to sit just under that rather than being truncated blind
 * mid-sentence.
 */
export const MAX_SPOKEN_WORDS = 78;

/** Which beats the presenter is on camera for. */
export const PRESENTER_BEATS: BeatId[] = ["hook", "cta"];

export function isPresenterScene(scene: Scene): boolean {
  return PRESENTER_BEATS.includes(scene.beat);
}

const countWords = (text: string) => (text.match(/[\p{L}\p{N}']+/gu) ?? []).length;

/**
 * The whole commercial as one continuous read.
 *
 * Joined from the board's own voiceover lines, in order, so what is said still
 * follows the story that was written and reviewed. Scenes the board left silent
 * stay silent — those are the shots meant to carry themselves on picture, and
 * the presenter simply keeps talking over the cutaway.
 *
 * When the read runs long, whole lines are dropped from the middle rather than
 * the end: losing the call to action to a word limit would be the one cut that
 * breaks the commercial.
 */
export function spokenScript(board: Storyboard, businessName: string): string {
  const lines = board.scenes.map((s) => s.voiceover.trim()).filter(Boolean);

  // The closing line has to name the business and the next step. The board's
  // end card already says both; the read should not end without them.
  const closing = [board.endCard.line, board.endCard.cta].filter(Boolean).join(". ");
  const tail = closing && !lines.join(" ").toLowerCase().includes((businessName || "").toLowerCase()) && businessName
    ? `${businessName}. ${closing}`
    : closing;

  const kept = [...lines];
  if (tail) kept.push(tail);

  while (countWords(kept.join(" ")) > MAX_SPOKEN_WORDS && kept.length > 2) {
    // Drop from the middle: the opening earns the view and the close asks for
    // the call, so the interior is what can afford to lose a sentence.
    kept.splice(Math.floor(kept.length / 2), 1);
  }

  let script = kept.join(" ").replace(/\s+/g, " ").trim();

  // If two lines still will not fit, trim words off the front of the read
  // rather than the back, for the same reason.
  const words = script.split(" ");
  if (words.length > MAX_SPOKEN_WORDS) script = words.slice(words.length - MAX_SPOKEN_WORDS).join(" ");

  return script;
}

/**
 * How the finished commercial is laid out: which segments show the presenter
 * and which cut away to the business. Returned in board order, so the cut still
 * runs hook → problem → solution → result → call to action.
 */
export type Segment = {
  index: number;
  kind: "presenter" | "still";
  beat: BeatId;
  seconds: number;
  onScreenText: string;
  voiceover: string;
  cameraMove: string;
  transitionOut: string;
  subject: string;
};

export function planSegments(board: Storyboard): Segment[] {
  return board.scenes.map((scene, index) => ({
    index,
    kind: isPresenterScene(scene) ? "presenter" : "still",
    beat: scene.beat,
    seconds: scene.seconds,
    onScreenText: scene.onScreenText,
    voiceover: scene.voiceover,
    cameraMove: scene.cameraMove,
    transitionOut: scene.transitionOut,
    subject: scene.subject,
  }));
}

// --- HeyGen ----------------------------------------------------------------
//
// The API calls live in @/lib/heygen, which speaks v3. This module decides only
// WHAT to render — the voice, the framing, the background — and hands it over.
//
// The voice here is the one already verified to render against the stock
// avatars in this account. A "voice-design" preview voice has no VideoTTS
// mapping to an avatar and fails the render outright.

const VOICE_ID = process.env.DIRECTOR_VOICE_ID?.trim() || "f8c69e517f424cafaecde32dde57096b";

/**
 * The avatar used when matching finds nobody — an empty library, or a customer
 * who has blocked everything. A fallback, not a default: before the matcher
 * existed every commercial used this same person regardless of the business,
 * which is why a roofing firm and a law practice were both fronted by the same
 * woman in a blue t-shirt.
 */
const FALLBACK_AVATAR_ID = "Abigail_expressive_2024112501";

export class PresenterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresenterError";
  }
}

/** Put a generated background plate into HeyGen and return its asset id. */
export async function uploadBackground(dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!match) return null;
  const [, mimeType, base64] = match;
  return uploadAsset(new Uint8Array(Buffer.from(base64, "base64")), mimeType);
}

/** Queue the presenter's take. Returns the video id, to be polled. */
export async function startPresenter(
  script: string,
  aspectRatio: string,
  backgroundAssetId?: string | null,
  avatarId?: string | null,
): Promise<string> {
  if (!script.trim()) throw new PresenterError("there is nothing for the presenter to say");
  try {
    return await startRender({
      avatarId: avatarId || FALLBACK_AVATAR_ID,
      script,
      voiceId: VOICE_ID,
      aspectRatio,
      backgroundAssetId,
    });
  } catch (e) {
    throw new PresenterError(e instanceof Error ? e.message : "the presenter could not be filmed");
  }
}

export type PresenterStatus = RenderStatus;

/** Check the take once. */
export async function checkPresenter(videoId: string): Promise<PresenterStatus> {
  return checkRender(videoId);
}

/** HeyGen video ids are echoed back from the browser, so they are checked. */
export const isPresenterId = isVideoId;

/** A short description of the shape, for the progress line and the workings. */
export function describeCut(segments: Segment[]): string {
  const presenter = segments.filter((s) => s.kind === "presenter").length;
  const broll = segments.length - presenter;
  return `${presenter} on-camera ${presenter === 1 ? "segment" : "segments"} (${PRESENTER_BEATS.map((b) => beat(b).title.toLowerCase()).join(" and ")}), ${broll} cutaways`;
}
