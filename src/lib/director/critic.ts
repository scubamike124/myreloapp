// ---------------------------------------------------------------------------
// Stage 4 — the creative review.
//
// The pipeline already knows whether the board is well-formed; validateStoryboard
// measured that. Well-formed is not the same as good, and a system that treats
// "every stage completed" as success will happily ship thirty seconds of correct,
// professional, forgettable film.
//
// So this stage asks one question, in the voice of the only person whose opinion
// is worth anything: a potential customer who has never heard of this business
// and did not choose to watch. Would they keep watching, and would they trust
// the business afterwards. Both must be true. No score anywhere else can
// substitute — an average of 9 with wouldTrust false is a failed commercial.
//
// On failure the critic does not ask for a polish. It names what is wrong at the
// level of the idea, and that directive is what forces the next attempt onto a
// genuinely different direction rather than a rewrite of this one.
// ---------------------------------------------------------------------------

import { boardAsText } from "./storyboard";
import { askJson, num, str, strList, type JsonSchema } from "./gemini";
import { intelBriefing } from "./intel";
import type { BusinessIntel, CreativeBrief, Review, Storyboard } from "./types";

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    wouldWatch: { type: "boolean" },
    wouldTrust: { type: "boolean" },
    trust: { type: "number" },
    professionalism: { type: "number" },
    storyClarity: { type: "number" },
    visualStorytelling: { type: "number" },
    persuasion: { type: "number" },
    strengths: { type: "array", items: { type: "string" } },
    failures: { type: "array", items: { type: "string" } },
    directive: { type: "string" },
  },
  required: [
    "wouldWatch",
    "wouldTrust",
    "trust",
    "professionalism",
    "storyClarity",
    "visualStorytelling",
    "persuasion",
    "strengths",
    "failures",
    "directive",
  ],
};

/** No dimension may fall below this, however strong the others are. */
const FLOOR = 6;
/** And the weighted result has to clear this. */
const BAR = 7.5;

/**
 * Weighted because the dimensions are not equal. A commercial that is trusted
 * and understood but merely competent-looking still works; a beautiful one that
 * earns no trust is decoration a business paid for.
 */
const WEIGHTS = {
  trust: 0.3,
  persuasion: 0.25,
  visualStorytelling: 0.2,
  storyClarity: 0.15,
  professionalism: 0.1,
} as const;

export async function reviewStoryboard(opts: {
  key: string;
  intel: BusinessIntel;
  brief: CreativeBrief;
  board: Storyboard;
  /** Structural failures found in code that survived the repair pass. */
  violations: string[];
}): Promise<Review> {
  const { key, intel, brief, board, violations } = opts;

  const prompt =
    `You are not a producer and you do not work for this company. You are the customer this commercial\n` +
    `is aimed at — ${brief.audience || intel.customer} — and it just interrupted something you were\n` +
    `enjoying. You did not choose to watch it.\n\n` +
    `Judge it on that basis alone. Ignore whether it was difficult to make, whether the pipeline ran\n` +
    `correctly, and whether it follows the brief. Those are our problems, not yours.\n\n` +
    `${intelBriefing(intel)}\n\n` +
    `THE BOARD\n${boardAsText(board)}\n\n` +
    (violations.length
      ? `Known structural problems that could not be fixed:\n${violations.map((x) => `  - ${x}`).join("\n")}\n\n`
      : "") +
    `Answer honestly. Most commercials are bad; a board that is merely competent should not pass.\n\n` +
    `- wouldWatch: would you still be watching at second 10, with your thumb on the screen? Be strict.\n` +
    `- wouldTrust: after watching, would you believe this business is competent enough to call?\n` +
    `- trust (0-10): does this feel like a real business with real premises and real people, or like\n` +
    `  stock footage assembled around a script? Does anything feel invented?\n` +
    `- professionalism (0-10): does it look like an advertising agency made it, or like software\n` +
    `  generated it? Generated-looking is the failure state — say so if you see it.\n` +
    `- storyClarity (0-10): is there a story — someone with a problem, a business that solves it, a\n` +
    `  result — or is it unrelated shots with narration laid over them?\n` +
    `- visualStorytelling (0-10): with the sound off, would you still understand what this business\n` +
    `  does and why it is worth calling? Score what the pictures carry, not what the words say.\n` +
    `- persuasion (0-10): are you closer to contacting them than you were 30 seconds ago? Is the next\n` +
    `  step obvious and easy?\n` +
    `- strengths: up to 3, specific. Name the scene.\n` +
    `- failures: up to 4, specific. Name the scene and what is wrong with it as an advert.\n` +
    `- directive: the single most important thing a DIFFERENT attempt must do instead. Not "improve\n` +
    `  the hook" — say what the next version should be about and how it should be shot. If this board\n` +
    `  is genuinely good, say what would make it excellent instead.`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    // Judgement, not invention.
    temperature: 0.4,
    maxOutputTokens: 2048,
  });

  return finish(raw, violations);
}

/**
 * Turn a raw answer into a Review, and apply the gate. Shared so the plan pass
 * and the film pass cannot drift into scoring the same rubric differently —
 * a 7.5 has to mean the same thing whichever stage produced it.
 */
function finish(raw: Record<string, unknown>, violations: string[]): Review {
  const scores = {
    trust: num(raw.trust, 0, 10, 0),
    professionalism: num(raw.professionalism, 0, 10, 0),
    storyClarity: num(raw.storyClarity, 0, 10, 0),
    visualStorytelling: num(raw.visualStorytelling, 0, 10, 0),
    persuasion: num(raw.persuasion, 0, 10, 0),
  };

  const overall =
    Math.round(
      (Object.entries(WEIGHTS) as [keyof typeof scores, number][]).reduce((n, [k, w]) => n + scores[k] * w, 0) * 10,
    ) / 10;

  const wouldWatch = raw.wouldWatch === true;
  const wouldTrust = raw.wouldTrust === true;

  // The gate. Both booleans, every floor, and the bar — and any structural
  // violation that survived repair fails it outright, because those are rules
  // we already decided a good commercial cannot break.
  const passes =
    wouldWatch &&
    wouldTrust &&
    violations.length === 0 &&
    Object.values(scores).every((s) => s >= FLOOR) &&
    overall >= BAR;

  return {
    wouldWatch,
    wouldTrust,
    scores,
    overall,
    verdict: passes ? "pass" : "redirect",
    strengths: strList(raw.strengths, 3, 240),
    failures: strList(raw.failures, 4, 240),
    directive: str(raw.directive, 500),
  };
}

// ---------------------------------------------------------------------------
// Reviewing the film rather than the plan.
//
// reviewStoryboard above judges words, which is right where it sits: it is the
// gate that stops a bad idea being paid for. But once the commercial exists,
// scoring the text is scoring the wrong artefact — "friends looking stressed at
// a tablet" reads as a cliché on the page while the actual photograph of it is
// a good shot. A board that scored 4.2 produced frames that plainly did not
// deserve a 4.2, and the number shown to a customer has to be about the thing
// they were given.
//
// So this pass looks at the frames, in order, with their beats and their
// durations, and scores the commercial. Same rubric, same gate, different
// evidence.
// ---------------------------------------------------------------------------

export type ReviewFrame = {
  index: number;
  beat: string;
  seconds: number;
  onScreenText: string;
  voiceover: string;
  /** A downscaled JPEG. Full-size frames would blow the request size limit. */
  base64: string;
  mimeType: string;
};

export async function reviewCommercial(opts: {
  key: string;
  intel: BusinessIntel;
  brief: CreativeBrief;
  board: Storyboard;
  frames: ReviewFrame[];
}): Promise<Review> {
  const { key, intel, brief, board, frames } = opts;
  if (frames.length === 0) throw new Error("there are no frames to review");

  const shotList = frames
    .map(
      (f) =>
        `  ${f.index + 1}. [${f.beat}] ${f.seconds}s` +
        (f.onScreenText ? ` · on screen: "${f.onScreenText}"` : "") +
        (f.voiceover ? ` · voiceover: "${f.voiceover}"` : " · silent"),
    )
    .join("\n");

  const prompt =
    `The images below are the actual frames of a finished ${Math.round(board.totalSeconds)}-second commercial,\n` +
    `in order. This is the film, not a plan for one.\n\n` +
    `You are not a producer and you do not work for this company. You are the customer it is aimed at —\n` +
    `${brief.audience || intel.customer} — and it just interrupted something you were enjoying.\n\n` +
    `${intelBriefing(intel)}\n\n` +
    `THE CUT\n${shotList}\n` +
    `  end card: "${board.endCard.line}" — "${board.endCard.cta}"\n\n` +
    `Judge what you can SEE. Ignore how it was made and whether it followed a brief.\n` +
    `Most commercials are bad; one that is merely competent should not pass.\n\n` +
    `- wouldWatch: at frame 3 or 4, would you still be watching? Be strict.\n` +
    `- wouldTrust: do these pictures make you believe this is a real, competent business?\n` +
    `- trust (0-10): do these look like real premises, real people, real work — or like stock imagery?\n` +
    `  Look for tells: invented logos, garbled lettering, malformed hands, impossible objects.\n` +
    `- professionalism (0-10): does this look photographed by a crew, or generated? Judge the lighting,\n` +
    `  the composition, the depth of field, the consistency of the grade from frame to frame.\n` +
    `- storyClarity (0-10): do these frames, in this order, tell a story — someone with a problem, a\n` +
    `  business solving it, a result — or are they unrelated pictures?\n` +
    `- visualStorytelling (0-10): with no sound at all, do you understand what this business does and\n` +
    `  why it is worth calling? Score only what the pictures carry.\n` +
    `- persuasion (0-10): are you closer to contacting them? Is the next step obvious?\n` +
    `- strengths: up to 3, naming the frame number.\n` +
    `- failures: up to 4, naming the frame number and what is wrong with it as an advert.\n` +
    `- directive: the single most important thing to change. Name the frame and what should replace it.`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 2048,
    timeoutMs: 120_000,
    images: frames.map((f) => ({ mimeType: f.mimeType, base64: f.base64 })),
  });

  // No structural violations are passed in: the board already survived the
  // validator before a penny was spent on rendering it, so what is being
  // judged here is purely whether the finished thing works.
  return finish(raw, []);
}

/** Why a review failed, in one line, for the attempt history. */
export function whyRejected(review: Review, violations: string[]): string {
  if (!review.wouldWatch) return "a customer would have scrolled past it";
  if (!review.wouldTrust) return "it did not earn enough trust to be worth calling";
  if (violations.length) return violations[0];
  const weakest = (Object.entries(review.scores) as [string, number][]).sort((a, b) => a[1] - b[1])[0];
  return review.failures[0] ?? `weakest on ${weakest[0]} (${weakest[1]}/10)`;
}
