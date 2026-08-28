// ---------------------------------------------------------------------------
// Stage 2 — the creative brief.
//
// A separate stage from the storyboard on purpose. Asked to write a commercial
// in one go, a model reaches for shots immediately and the strategy becomes
// whatever the shots happen to imply — which is how you end up with pretty
// footage that argues nothing. Deciding the argument first, in words, with no
// camera allowed, means the board that follows has something to serve.
//
// The brief commits to exactly one angle and one visual system, both drawn from
// the DNA and both narrowed by whatever has already failed. Those two choices
// are the fingerprint of the whole attempt.
// ---------------------------------------------------------------------------

import { visualSystem, type Angle, type VisualSystem } from "./dna";
import { availableDirections, divergenceBriefing } from "./divergence";
import { askJson, str, type JsonSchema } from "./gemini";
import { intelBriefing } from "./intel";
import type { BusinessIntel, CreativeBrief, Direction } from "./types";

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    angle: { type: "string" },
    angleRationale: { type: "string" },
    audience: { type: "string" },
    promise: { type: "string" },
    objectionToKill: { type: "string" },
    emotionalArc: { type: "string" },
    takeaway: { type: "string" },
    visualSystem: { type: "string" },
    musicDirection: { type: "string" },
    trustMechanism: { type: "string" },
  },
  required: [
    "angle",
    "angleRationale",
    "audience",
    "promise",
    "objectionToKill",
    "emotionalArc",
    "takeaway",
    "visualSystem",
    "musicDirection",
    "trustMechanism",
  ],
};

function angleMenu(angles: Angle[]): string {
  return angles.map((a) => `  ${a.key} — ${a.name}: ${a.argument}\n    watch out for: ${a.pitfall}`).join("\n");
}

function systemMenu(systems: VisualSystem[]): string {
  return systems
    .map(
      (v) =>
        `  ${v.key} — ${v.name}: ${v.summary}\n` +
        `    lens ${v.lens} · light ${v.light} · grade ${v.palette}\n` +
        `    motion ${v.motion} · edit ${v.edit} · score ${v.music}\n` +
        `    suits ${v.suits}`,
    )
    .join("\n");
}

export async function writeBrief(opts: {
  key: string;
  intel: BusinessIntel;
  tried: Direction[];
  directives: string[];
}): Promise<CreativeBrief> {
  const { key, intel, tried, directives } = opts;
  const { angles, systems } = availableDirections(tried);

  const prompt =
    `You are the creative director on a business commercial. This is the strategy meeting — no shots,\n` +
    `no camera, no script. Decide only what this film argues and how it will look.\n\n` +
    `${intelBriefing(intel)}\n\n` +
    `AVAILABLE ARGUMENTS (choose exactly one, by key):\n${angleMenu(angles)}\n\n` +
    `AVAILABLE VISUAL SYSTEMS (choose exactly one, by key):\n${systemMenu(systems)}\n` +
    divergenceBriefing(tried, directives) +
    `\nReturn:\n` +
    `- angle: the key of the argument you chose.\n` +
    `- angleRationale: why this argument beats the others FOR THIS BUSINESS. Name the business's own\n` +
    `  facts in your reasoning. If your rationale would read the same for any firm in this category,\n` +
    `  you have chosen lazily — choose again.\n` +
    `- audience: the one person this is aimed at, in their situation.\n` +
    `- promise: the single thing this commercial promises. One sentence. One promise, not three.\n` +
    `- objectionToKill: the hesitation this film has to dismantle, and it must be dismantled visually.\n` +
    `- emotionalArc: the feeling at second 0, second 15 and second 30. Three states, in order.\n` +
    `- takeaway: the one line the viewer could repeat to someone else afterwards.\n` +
    `- visualSystem: the key of the visual system you chose.\n` +
    `- musicDirection: the score, described so a composer could start. Match the system.\n` +
    `- trustMechanism: precisely why a stranger trusts this business more at second 30 than at second 0.\n` +
    `  "It looks professional" is not a mechanism. Name what they SAW that earned it.`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    // The strategy is where divergence has to happen, so it runs hot.
    temperature: 1.0,
    maxOutputTokens: 2048,
  });

  // The model is asked for a key from a menu, but it is not trusted to return
  // one — an off-menu system would silently drop the whole look back to
  // "cinematic", which is the failure this module was built to remove.
  const chosenAngle = angles.find((a) => a.key === str(raw.angle, 60)) ?? angles[0];
  const chosenSystem = visualSystem(str(raw.visualSystem, 60)) ?? systems[0];

  return {
    angle: chosenAngle.key,
    angleRationale: str(raw.angleRationale, 600),
    audience: str(raw.audience, 300),
    promise: str(raw.promise, 300),
    objectionToKill: str(raw.objectionToKill, 300),
    emotionalArc: str(raw.emotionalArc, 300),
    takeaway: str(raw.takeaway, 200),
    visualSystem: chosenSystem.key,
    musicDirection: str(raw.musicDirection, 300),
    trustMechanism: str(raw.trustMechanism, 400),
  };
}

/** The brief as prompt text for the storyboard stage. */
export function briefBriefing(brief: CreativeBrief): string {
  const sys = visualSystem(brief.visualSystem);
  return (
    `THE BRIEF — every shot must serve this\n` +
    `  argument: ${brief.angle}\n` +
    `  why: ${brief.angleRationale}\n` +
    `  aimed at: ${brief.audience}\n` +
    `  the promise: ${brief.promise}\n` +
    `  the objection to dismantle on screen: ${brief.objectionToKill}\n` +
    `  emotional arc: ${brief.emotionalArc}\n` +
    `  takeaway: ${brief.takeaway}\n` +
    `  trust is earned by: ${brief.trustMechanism}\n` +
    `  music: ${brief.musicDirection}\n\n` +
    (sys
      ? `THE VISUAL SYSTEM — ${sys.name}\n` +
        `  ${sys.summary}\n` +
        `  lens: ${sys.lens}\n` +
        `  light: ${sys.light}\n` +
        `  grade: ${sys.palette}\n` +
        `  motion: ${sys.motion}\n` +
        `  edit: ${sys.edit}\n` +
        `  score: ${sys.music}\n` +
        `  transitions available: ${sys.transitions.join(", ")} — no others\n` +
        `  Every shot obeys this system. A shot that would look at home in a different system is wrong.`
      : "")
  );
}
