// ---------------------------------------------------------------------------
// Stage 5 — turning a planned shot into a Veo prompt.
//
// This is where "cinematic" either means something or does not. The old Product
// Commercial prompt asked for "photoreal product commercial, smooth cinematic
// camera, high quality, 4k" — words that describe no particular film and so
// produce the same averaged look every time.
//
// A prompt here is assembled from decisions that were already made and already
// checked: the shot size and camera move from the board, the subject and action
// from the board, and the lens, light, grade and motion language from the
// visual system the brief committed to. Two scenes shot under different systems
// get materially different prompts because the systems differ in the things a
// camera actually does, not in adjectives.
//
// The negatives matter as much. Veo will happily burn in captions, invent a
// logo and hallucinate a watermark, all of which make a commercial look
// generated rather than filmed — and the on-screen text is drawn by us at
// assembly, where it can use the brand's own typeface.
// ---------------------------------------------------------------------------

import { visualSystem } from "./dna";
import type { Scene, Storyboard } from "./types";

/**
 * How long the hero clip is rendered for. Only one shot in the commercial is
 * generated video now, so this is the whole video bill: at $0.10 a second,
 * four seconds is forty cents and six would be sixty.
 *
 * Four is also the shortest Veo accepts, and it clears the hook beat's longest
 * permitted shot. Only EVEN values work — 4, 6 and 8. Veo rejects 5 and 7 with
 * "provide a value between 4 and 8, inclusive", which is not what it means.
 */
export const HERO_CLIP_SECONDS = 4;

/** Vertical by default: these are made to be posted, not broadcast. */
export const ASPECT_RATIOS: Record<string, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "16:9": "16:9",
};

const NEGATIVES =
  "No on-screen text, no captions, no subtitles, no title cards, no logos, no watermarks, no brand marks. " +
  "No distorted hands, no extra fingers, no warped faces, no morphing objects. " +
  "No slow-motion unless the shot calls for it. Nothing that looks computer generated.";

/**
 * A single scene's prompt. Written in the order a camera department would hear
 * it: what the shot is, what is in it, what happens, then how it is lit and
 * graded.
 */
export function scenePrompt(scene: Scene, board: Storyboard): string {
  const sys = visualSystem(board.visualSystem);

  const lines = [
    `${scene.shotSize} shot, camera ${scene.cameraMove}.`,
    `Subject: ${scene.subject}.`,
    `Action: ${scene.action}.`,
    scene.location ? `Location: ${scene.location}.` : "",
    sys
      ? `Lens: ${sys.lens}. Lighting: ${sys.light}. Colour: ${sys.palette}. Camera motion: ${sys.motion}.`
      : "",
    `Shot for a television commercial by a professional crew on a cinema camera. Photoreal, natural motion blur, ` +
      `real depth of field, believable physical detail. The people are real working people, not models.`,
    NEGATIVES,
  ];

  return lines.filter(Boolean).join("\n");
}

/** Every scene's prompt, in board order. */
export function shootList(board: Storyboard): { scene: Scene; prompt: string }[] {
  return board.scenes.map((scene) => ({ scene, prompt: scenePrompt(scene, board) }));
}
