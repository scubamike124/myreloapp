// ---------------------------------------------------------------------------
// Commercial DNA — the filmmaking rules, written down.
//
// The temptation with "learn from reference commercials" is to collect links
// and hand them to a model. That teaches nothing: a URL in a prompt is a wish,
// not a rule. What a reference commercial actually contains is a small number
// of decisions repeated with discipline — how long a shot is allowed to be
// before it cuts, which camera move belongs to which beat, when the logo is
// permitted on screen, how much of the frame the presenter is allowed to own.
//
// So the references are analysed once, by us, and the findings live here as
// constants the pipeline can enforce in code. A storyboard that breaks the
// pacing curve or over-spends its avatar budget is rejected by a function, not
// by a hopeful sentence in a prompt. That is the difference between a director
// and an autocomplete.
//
// Everything in this file is also fed to the writing model as its rulebook, so
// there is exactly one description of what a good commercial is.
// ---------------------------------------------------------------------------

import type { BeatId, CameraMove, ShotSize, Transition } from "./types";

/** A 30-second spot is the format. Every duration rule below sums to this. */
export const COMMERCIAL_SECONDS = 30;

// --- The five beats --------------------------------------------------------
//
// Non-negotiable and in this order. An advert missing the problem is a brochure;
// one missing the result is a description; one missing the CTA is a short film.

export type BeatSpec = {
  id: BeatId;
  title: string;
  /** What this beat is for. Stated as a job, so a scene can be judged against it. */
  job: string;
  /** What the viewer should feel by the end of it. */
  feeling: string;
  seconds: [min: number, max: number];
  /** How many distinct shots this beat is cut from. */
  shots: [min: number, max: number];
  /** The thing the picture alone has to establish. */
  mustShow: string;
  /** Camera moves that serve this beat's job. Others read as decoration. */
  moves: CameraMove[];
  /** Whether a presenter may appear here at all. */
  presenterAllowed: boolean;
};

export const BEATS: BeatSpec[] = [
  {
    id: "hook",
    title: "Hook",
    job: "Stop the scroll in the first second with a real image, not a title card.",
    feeling: "Curiosity — something is happening and I want to see the rest of it.",
    seconds: [3, 5],
    shots: [1, 2],
    mustShow: "A striking, concrete image from this business's actual world.",
    moves: ["slow push in", "whip pan", "crane down", "pull back reveal", "tracking follow"],
    // A stranger talking at camera is the weakest possible first second.
    presenterAllowed: false,
  },
  {
    id: "problem",
    title: "Customer problem",
    job: "Show the customer's frustration as it actually looks, before the business exists.",
    feeling: "Recognition — that is me, that is my week.",
    seconds: [5, 7],
    shots: [2, 3],
    mustShow: "A person in the friction, or the visible mess the problem leaves behind.",
    moves: ["handheld drift", "locked off", "rack focus", "slow pan"],
    presenterAllowed: false,
  },
  {
    id: "solution",
    title: "The business solving it",
    job: "Show the work being done — the craft, the people, the process, the care.",
    feeling: "Confidence — these people know exactly what they are doing.",
    seconds: [8, 11],
    shots: [3, 4],
    mustShow: "Real hands, real tools, real premises. Competence you can see.",
    moves: ["tracking follow", "rack focus", "orbit", "slow push in", "handheld drift"],
    presenterAllowed: true,
  },
  {
    id: "result",
    title: "The result",
    job: "Show the customer's life on the other side of the transaction.",
    feeling: "Desire — I want that outcome, and relief that it is available.",
    seconds: [6, 8],
    shots: [2, 3],
    mustShow: "The finished thing, or the relieved customer. The before/after answered.",
    moves: ["pull back reveal", "slow push in", "locked off", "tilt up"],
    presenterAllowed: false,
  },
  {
    id: "cta",
    title: "Call to action",
    job: "Name the business and the single next step, while trust is at its peak.",
    feeling: "Decision — I know who they are and exactly what to do now.",
    seconds: [4, 5],
    shots: [1, 2],
    // Not "show the logo": nothing in this pipeline knows what the business's
    // logo looks like, and an image model asked for one will design a new one.
    // The name and the next step are drawn over the picture in real type at
    // assembly, so what this beat needs is a calm plate to carry them.
    mustShow: "A calm, uncluttered final image with clear space for the name and the next step to sit over.",
    moves: ["locked off", "slow push in"],
    presenterAllowed: true,
  },
];

export function beat(id: BeatId): BeatSpec {
  return BEATS.find((b) => b.id === id)!;
}

export const BEAT_ORDER: BeatId[] = BEATS.map((b) => b.id);

// --- Shot grammar ----------------------------------------------------------

export const SHOT_SIZES: ShotSize[] = [
  "extreme wide",
  "wide",
  "medium wide",
  "medium",
  "medium close-up",
  "close-up",
  "extreme close-up",
  "insert",
  "overhead",
  "over-the-shoulder",
];

export const CAMERA_MOVES: CameraMove[] = [
  "locked off",
  "slow push in",
  "pull back reveal",
  "tracking follow",
  "handheld drift",
  "slow pan",
  "whip pan",
  "crane down",
  "rack focus",
  "orbit",
  "tilt up",
];

export const TRANSITIONS: Transition[] = ["hard cut", "cut on action", "match cut", "dissolve", "whip transition", "speed ramp"];

/**
 * The rule that makes a sequence read as directed rather than assembled: two
 * adjacent shots must differ in size. Cutting a medium to a medium is the
 * "stitched clips" look — the eye registers it as a jump rather than a choice.
 */
export const NO_REPEATED_SIZE_ACROSS_CUT = true;

/**
 * How many seconds a single shot may hold before the edit feels slack. Beyond
 * this, a viewer on a phone leaves. Under a second, nothing registers.
 */
export const SHOT_SECONDS = { min: 1.2, max: 4.5 } as const;

// --- Pacing ----------------------------------------------------------------
//
// Cut rhythm is not constant in a good commercial. It opens fast to earn
// attention, slows through the middle so the work can be understood, tightens
// again for the result, then holds still for the CTA. Expressed as a multiplier
// on the average shot length so it stays true at any total duration.

export const PACING_CURVE: Record<BeatId, number> = {
  hook: 0.7,
  problem: 0.9,
  solution: 1.2,
  result: 1.0,
  cta: 1.6,
};

// --- The avatar budget -----------------------------------------------------
//
// A presenter is a device for delivering a sentence the pictures cannot. That
// is a supporting role. When the presenter is the commercial, the business is
// invisible — which is precisely the failure mode this rule exists to stop.

export const AVATAR_BUDGET = {
  /** At most one scene in the whole spot may put a presenter on camera. */
  maxScenes: 1,
  /** And it may hold no more than this share of the running time. */
  maxShareOfDuration: 0.2,
  /** Beats where a presenter is never the right answer. */
  forbiddenBeats: ["hook", "problem", "result"] as BeatId[],
} as const;

// --- The muted test --------------------------------------------------------

export const MUTED_TEST =
  "Every scene must communicate its beat with the sound off. If the picture only makes sense " +
  "once the voiceover explains it, the picture is wallpaper and the scene must be re-shot.";

/** Voiceover is a seasoning, not the meal. Above this the film is a podcast. */
export const MAX_VO_WORDS_PER_SECOND = 2.4;

// --- Visual systems --------------------------------------------------------
//
// Not adjectives. "Cinematic" is not a look — it is a compliment, and asking a
// model for it returns the same average-of-everything render every time, which
// is exactly why changing the style dropdown changed nothing. Each system below
// commits to a lens, a light source, a grade, a motion language, an edit rhythm
// and a score. Two commercials built on different systems cannot look alike.

export type VisualSystem = {
  key: string;
  name: string;
  /** One line the customer sees in the review screen. */
  summary: string;
  lens: string;
  light: string;
  palette: string;
  motion: string;
  edit: string;
  music: string;
  transitions: Transition[];
  /** The kinds of business this system flatters. Guidance, not a hard gate. */
  suits: string;
};

export const VISUAL_SYSTEMS: VisualSystem[] = [
  {
    key: "verite",
    name: "Vérité Documentary",
    summary: "Filmed like a news crew followed them for a day. Nothing staged.",
    lens: "35mm, deep focus, shot from eye level at working distance",
    light: "available light only — windows, doorways, worklamps; no fill",
    palette: "neutral grade, true skin tones, no colour push",
    motion: "handheld with real weight, following the work rather than leading it",
    edit: "cut on action, no transitions but straight cuts, occasional held beat",
    music: "sparse — one instrument, or room tone alone under the voice",
    transitions: ["hard cut", "cut on action"],
    suits: "trades, clinics, restaurants, anyone whose credibility is in the doing",
  },
  {
    key: "brandfilm",
    name: "Polished Brand Film",
    summary: "The considered, premium look — slow, controlled, expensive.",
    lens: "50mm and 85mm, shallow depth of field, everything on a slider",
    light: "single controlled key with soft falloff, practicals in the background",
    palette: "warm highlights, deep clean shadows, gentle film curve",
    motion: "slow, deliberate, always motivated; nothing moves without a reason",
    edit: "long shots, dissolves on the emotional beats, cuts on the factual ones",
    music: "strings or piano that builds once, resolving on the end card",
    transitions: ["dissolve", "hard cut", "match cut"],
    suits: "professional services, premium products, anything sold on trust",
  },
  {
    key: "kinetic",
    name: "Kinetic Retail",
    summary: "Fast, bright and loud. Built for a thumb moving at speed.",
    lens: "24mm wide, close to the subject, slight distortion embraced",
    light: "high key, bright and even, no moody shadow anywhere",
    palette: "saturated, punchy, brand colour pushed hard",
    motion: "whip pans, snap zooms, speed ramps into and out of the action",
    edit: "cut on the music beat, nothing held longer than two seconds in the hook",
    music: "driving percussion with a clear downbeat to cut against",
    transitions: ["whip transition", "speed ramp", "hard cut"],
    suits: "retail, food, fitness, events — anywhere energy is the product",
  },
  {
    key: "architectural",
    name: "Architectural Minimal",
    summary: "Still, symmetrical and calm. Confidence through restraint.",
    lens: "24mm on a tripod, dead-centre framing, generous negative space",
    light: "flat north light or overcast; texture over contrast",
    palette: "cool and desaturated with one accent colour held back for the CTA",
    motion: "locked off, or a single slow push that never arrives",
    edit: "long holds, slow dissolves, silence used as punctuation",
    music: "ambient pad, almost subliminal, one note change per beat",
    transitions: ["dissolve", "hard cut"],
    suits: "architecture, design, legal, finance — quiet authority",
  },
  {
    key: "goldenhour",
    name: "Golden Hour Human",
    summary: "Warm, backlit and personal. People first, product second.",
    lens: "85mm, faces filling the frame, background dissolved to light",
    light: "low sun behind the subject, bounced fill, real flare in the lens",
    palette: "amber highlights, soft contrast, skin warm and healthy",
    motion: "gentle drift and slow motion on the human moments only",
    edit: "cross dissolves between people, hard cut into the CTA",
    music: "acoustic guitar or piano with a single vocal line",
    transitions: ["dissolve", "hard cut", "speed ramp"],
    suits: "care, family, wellbeing, community businesses",
  },
  {
    key: "process",
    name: "Process Macro",
    summary: "Extreme close-ups of the craft. The work sells itself.",
    lens: "macro, inches from the surface, focus falling off within the object",
    light: "hard raking side light to bring out texture and material",
    palette: "rich and tactile, deep blacks, specular highlights left hot",
    motion: "tiny precise moves — a rack focus, a slow orbit around one detail",
    edit: "rhythmic, almost musical, each cut landing on a physical sound",
    music: "minimal beat built from the sounds of the work itself",
    transitions: ["match cut", "hard cut", "cut on action"],
    suits: "makers, food, manufacturing, repair — anything with visible craft",
  },
];

export function visualSystem(key: string): VisualSystem | undefined {
  return VISUAL_SYSTEMS.find((v) => v.key === key || v.name.toLowerCase() === key.toLowerCase());
}

// --- Strategic angles ------------------------------------------------------
//
// The other half of divergence. A different look with the same argument is the
// same commercial; so is the same look with a different one. A retry has to
// move on both axes, which is what forcedDivergence in divergence.ts enforces.

export type Angle = {
  key: string;
  name: string;
  /** The argument, in the form the storyboard has to dramatise. */
  argument: string;
  /** The trap this angle falls into when written lazily. */
  pitfall: string;
};

export const ANGLES: Angle[] = [
  {
    key: "cost-of-inaction",
    name: "The cost of doing nothing",
    argument: "Show what the problem quietly costs every week it goes unfixed.",
    pitfall: "Fear without relief. The result beat must fully release the tension.",
  },
  {
    key: "transformation",
    name: "Before and after",
    argument: "Two states of the same life, and the business as the hinge between them.",
    pitfall: "A generic makeover. The before must be specific enough to be recognised.",
  },
  {
    key: "craft",
    name: "The craft",
    argument: "Show how carefully the work is done; competence is the argument.",
    pitfall: "Process for its own sake. Every step shown must matter to the customer.",
  },
  {
    key: "people",
    name: "The people behind it",
    argument: "You are not buying a service, you are choosing who turns up.",
    pitfall: "A staff montage. One person with one moment beats six smiling faces.",
  },
  {
    key: "risk-reversal",
    name: "Risk removed",
    argument: "Name the fear that stops people buying, then dismantle it on screen.",
    pitfall: "Stating a guarantee instead of showing why it is safe to accept.",
  },
  {
    key: "speed",
    name: "How fast this is over",
    argument: "The whole ordeal, compressed — sold on time returned to the customer.",
    pitfall: "Speed claims with no visible clock. The edit itself must feel quick.",
  },
  {
    key: "day-in-the-life",
    name: "A day in the customer's life",
    argument: "Follow one customer through one day; the business is a scene in it.",
    pitfall: "Wandering. The day needs one problem and one moment of resolution.",
  },
  {
    key: "authority",
    name: "The local authority",
    argument: "This is who the neighbourhood already calls, and here is the evidence.",
    pitfall: "Unearned claims. Only what the business genuinely stated may be used.",
  },
  {
    key: "comparison",
    name: "The honest comparison",
    argument: "Set the usual way against this way and let the pictures decide.",
    pitfall: "Naming or mocking a competitor. Compare to the situation, not a rival.",
  },
  {
    key: "origin",
    name: "Why they started",
    argument: "The founder hit this problem first; the business is their answer to it.",
    pitfall: "Nostalgia. The origin must explain a benefit the customer gets today.",
  },
];

export function angle(key: string): Angle | undefined {
  return ANGLES.find((a) => a.key === key || a.name.toLowerCase() === key.toLowerCase());
}

// --- The rulebook, as prompt text ------------------------------------------

/**
 * The DNA rendered for the writing model. Generated from the constants above
 * rather than written out again, so the rules the model is given can never
 * drift from the rules the validator enforces.
 */
export function dnaBriefing(): string {
  const beats = BEATS.map(
    (b) =>
      `  ${b.title} (${b.seconds[0]}-${b.seconds[1]}s, ${b.shots[0]}-${b.shots[1]} shots)\n` +
      `    job: ${b.job}\n` +
      `    the picture must show: ${b.mustShow}\n` +
      `    feeling: ${b.feeling}\n` +
      `    camera moves that serve it: ${b.moves.join(", ")}\n` +
      `    presenter on camera: ${b.presenterAllowed ? "permitted, but never required" : "forbidden"}`,
  ).join("\n\n");

  return (
    `COMMERCIAL DNA — the rules this board is judged against.\n\n` +
    `STRUCTURE (all five, in this order, no exceptions):\n${beats}\n\n` +
    `SHOT GRAMMAR:\n` +
    `  - Adjacent shots must differ in size. Two mediums in a row read as a mistake.\n` +
    `  - No shot shorter than ${SHOT_SECONDS.min}s or longer than ${SHOT_SECONDS.max}s.\n` +
    `  - Every shot needs an action — something must change while it is on screen.\n` +
    `  - A camera move must be motivated by what is happening, never decorative.\n\n` +
    `VISUAL STORYTELLING:\n  ${MUTED_TEST}\n` +
    `  - visualStory must describe what is SEEN, and must not repeat the voiceover.\n` +
    `  - Voiceover is at most ${MAX_VO_WORDS_PER_SECOND} words per second of the scene, and some scenes should have none.\n\n` +
    `PRESENTER BUDGET:\n` +
    `  - At most ${AVATAR_BUDGET.maxScenes} scene may show a presenter, and never in the ${AVATAR_BUDGET.forbiddenBeats.join(", ")} beats.\n` +
    `  - The business, its work, its customers and the result own the screen.\n\n` +
    `HONESTY:\n` +
    `  - No claim, statistic, price, award or guarantee may appear unless it is in the proven-claims list.\n` +
    `  - Invented credentials are the single worst failure available here.\n\n` +
    `TOTAL RUNNING TIME: ${COMMERCIAL_SECONDS} seconds.`
  );
}
