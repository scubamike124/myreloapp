// ---------------------------------------------------------------------------
// Forced divergence — why the second attempt cannot be the first one again.
//
// The observed failure is that regenerating produces a near-identical
// commercial. That is not the model being stubborn; it is the model being
// consistent. Given the same business and the same instructions it will find
// the same strongest answer every time, and turning the temperature up only
// changes the adjectives.
//
// The fix is to remove the previous answer from the space rather than ask for
// something different. Each attempt is fingerprinted by the two decisions that
// actually determine what a commercial feels like — the argument it makes and
// the way it is shot — and the next attempt is handed a shortlist that excludes
// both. A direction that has failed cannot be reached again, so "try again"
// always costs a genuinely new idea rather than another render of the old one.
// ---------------------------------------------------------------------------

import { ANGLES, VISUAL_SYSTEMS, type Angle, type VisualSystem } from "./dna";
import type { Direction, Storyboard } from "./types";

/** How a direction is identified. Angle and system are the load-bearing pair. */
export function fingerprint(d: Direction): string {
  return `${d.angle}|${d.visualSystem}`;
}

export function directionOf(board: Storyboard): Direction {
  const opening = board.scenes[0];
  return {
    angle: board.angle,
    visualSystem: board.visualSystem,
    openingShot: opening ? `${opening.shotSize} / ${opening.cameraMove}` : "",
    openingSubject: opening?.subject ?? "",
    structure: board.scenes.map((s) => s.shotSize).join(">"),
  };
}

// --- Opening image ---------------------------------------------------------
//
// Two commercials that open on the same picture feel like the same commercial,
// however different the argument underneath is. The shot grammar cannot detect
// that — a "medium wide / pull back reveal" describes a face and a child's hand
// equally well — so the subject line is compared as words.
//
// Deliberately crude. This does not need to understand the image; it needs to
// notice that the third concept has opened on the worn-out picture book for the
// third time. Overlap is measured against the smaller set so that a terse
// subject cannot dodge the check by being shorter than the one it repeats.

const STOP = new Set([
  "a", "an", "the", "of", "and", "in", "on", "at", "with", "to", "is", "its",
  "his", "her", "their", "that", "this", "for", "from", "by", "as", "it", "into",
  "over", "out", "up", "down", "near", "next", "shot", "frame",
]);

function keyWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

/** How much two opening images share, 0 to 1. */
export function subjectOverlap(a: string, b: string): number {
  const left = keyWords(a);
  const right = keyWords(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / Math.min(left.size, right.size);
}

/** Above this, the camera is pointing at the same thing again. */
export const MAX_SUBJECT_OVERLAP = 0.5;

/**
 * What the next attempt is allowed to choose from. Anything already tried is
 * removed outright — not discouraged, removed — so the shortlist handed to the
 * writer contains no route back to a direction that has already failed.
 *
 * When every angle has been spent the pool reopens rather than dead-ending;
 * ten failed attempts on one business is a different problem than this
 * function can solve, and returning nothing would just crash the run.
 */
export function availableDirections(tried: Direction[]): { angles: Angle[]; systems: VisualSystem[]; exhausted: boolean } {
  const usedAngles = new Set(tried.map((d) => d.angle));
  const usedSystems = new Set(tried.map((d) => d.visualSystem));

  const angles = ANGLES.filter((a) => !usedAngles.has(a.key));
  const systems = VISUAL_SYSTEMS.filter((v) => !usedSystems.has(v.key));

  const exhausted = angles.length === 0 || systems.length === 0;
  return {
    angles: angles.length ? angles : ANGLES,
    systems: systems.length ? systems : VISUAL_SYSTEMS,
    exhausted,
  };
}

/** True when a fresh board has landed on something already tried and rejected. */
export function isRepeat(board: Storyboard, tried: Direction[]): boolean {
  const fresh = fingerprint(directionOf(board));
  return tried.some((d) => fingerprint(d) === fresh);
}

/**
 * How similar two boards are in shot construction, 0 to 1. Angle and system can
 * both differ while the board is still cut identically — same sizes in the same
 * order — which is the subtler version of the same failure. Compared as a plain
 * position-wise match because shot order is the thing being tested.
 */
export function structuralOverlap(a: Direction, b: Direction): number {
  const left = a.structure.split(">");
  const right = b.structure.split(">");
  const span = Math.max(left.length, right.length);
  if (span === 0) return 0;
  let same = 0;
  for (let i = 0; i < span; i++) if (left[i] && left[i] === right[i]) same++;
  return same / span;
}

/** Above this, two boards are the same edit wearing different clothes. */
export const MAX_STRUCTURAL_OVERLAP = 0.6;

export function tooSimilar(board: Storyboard, tried: Direction[]): boolean {
  const fresh = directionOf(board);
  return tried.some(
    (d) =>
      structuralOverlap(fresh, d) > MAX_STRUCTURAL_OVERLAP ||
      subjectOverlap(fresh.openingSubject, d.openingSubject) > MAX_SUBJECT_OVERLAP,
  );
}

/**
 * The instruction block for a retry. Names what was tried, why it failed and
 * what is now off the table, then hands over the reduced shortlist.
 */
export function divergenceBriefing(tried: Direction[], directives: string[]): string {
  if (tried.length === 0) return "";

  const { angles, systems, exhausted } = availableDirections(tried);

  return (
    `\nPREVIOUS ATTEMPTS — none of these worked, and none may be repeated:\n` +
    tried
      .map((d, i) => `  ${i + 1}. argument "${d.angle}" shot as "${d.visualSystem}", opening on a ${d.openingShot || "(none)"}` +
        (d.openingSubject ? `\n     the opening image was: ${d.openingSubject}` : "") +
        (directives[i] ? `\n     rejected because: ${directives[i]}` : ""))
      .join("\n") +
    `\n\nThis attempt must be a DIFFERENT COMMERCIAL, not a rewrite. That means:\n` +
    `  - a different argument, chosen from: ${angles.map((a) => a.key).join(", ")}\n` +
    `  - a different visual system, chosen from: ${systems.map((v) => v.key).join(", ")}\n` +
    // Naming the images explicitly is the point: the old wording asked for a
    // different opening while only ever showing the writer a shot size, which
    // it could satisfy while pointing the camera at the same thing again.
    `  - a different opening IMAGE. These subjects are now spent, and none may open this board:\n` +
    tried
      .map((d) => d.openingSubject)
      .filter(Boolean)
      .map((s) => `      · ${s}\n`)
      .join("") +
    `  - a different shot progression, not the same sizes in the same order\n` +
    (exhausted
      ? `  - the obvious directions are spent, so take the strongest unusual one and commit to it fully\n`
      : "")
  );
}
