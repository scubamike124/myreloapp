// ---------------------------------------------------------------------------
// The Commercial Director — the four stages, run in order.
//
// The old path was one step: a script writer wired straight to a renderer. One
// step cannot improve on itself, which is why every commercial arrived at the
// same quality and the only lever left was to pay for another render of it.
//
// Here each stage narrows the one after it. Research decides what is true;
// strategy decides what to argue; the board decides what the camera does;
// the review decides whether a customer would care. A board that fails review
// does not get polished — it is thrown out and a different argument, shot a
// different way, is tried instead. Nothing renders, so a rejected direction
// costs a few seconds of text instead of a customer's credits.
// ---------------------------------------------------------------------------

import { writeBrief } from "./brief";
import { reviewStoryboard, whyRejected } from "./critic";
import { directionOf, isRepeat, tooSimilar } from "./divergence";
import { validateStoryboard, writeStoryboard } from "./storyboard";
import type { Attempt, BusinessIntel, Direction } from "./types";

export type DirectResult = {
  /** Every direction tried this run, in order, including the rejected ones. */
  attempts: Attempt[];
  /** The one to show: the first that passed, or the strongest that did not. */
  best: Attempt;
  /** True when nothing cleared the bar and `best` is the least-bad attempt. */
  settled: boolean;
};

export async function direct(opts: {
  key: string;
  intel: BusinessIntel;
  /** Directions already rejected — from earlier runs, so retries keep diverging. */
  tried?: Direction[];
  /** Why each of those was rejected, positionally aligned with `tried`. */
  priorDirectives?: string[];
  maxAttempts?: number;
}): Promise<DirectResult> {
  const { key, intel, maxAttempts = 2 } = opts;

  const tried: Direction[] = [...(opts.tried ?? [])];
  const directives: string[] = [...(opts.priorDirectives ?? [])];
  const attempts: Attempt[] = [];

  for (let n = 0; n < maxAttempts; n++) {
    const brief = await writeBrief({ key, intel, tried, directives });

    // The brief writer already knows which arguments are spent. The board
    // writer needs the other half of that memory — which images are — or it
    // will open on the same frame under a different argument.
    const spentOpenings = tried.map((d) => d.openingSubject).filter(Boolean);

    let board = await writeStoryboard({ key, intel, brief, spentOpenings });
    let violations = validateStoryboard(board, intel, tried);

    // One repair pass. The writer is given its own failures verbatim, which
    // fixes the mechanical breaks — a beat running long, two mediums in a row —
    // without spending a whole attempt on them. A second pass is not worth it:
    // what survives one repair is a problem with the idea, and the answer to a
    // bad idea is a different idea, not a third rewrite.
    if (violations.length > 0) {
      const repaired = await writeStoryboard({
        key,
        intel,
        brief,
        spentOpenings,
        repair: { board, violations },
      });
      const after = validateStoryboard(repaired, intel, tried);
      // Keep the repair only if it genuinely improved things; a rewrite that
      // trades three violations for four is not progress.
      if (after.length < violations.length) {
        board = repaired;
        violations = after;
      }
    }

    const direction = directionOf(board);

    // The brief stage should already have made this impossible — it picks from
    // a menu with the spent options removed — but a board that lands on a tried
    // direction anyway is exactly the failure this system exists to catch, so
    // it is recorded rather than quietly shown.
    const repeated = isRepeat(board, tried) || tooSimilar(board, tried);
    if (repeated) violations = [...violations, "this is the same commercial as a previous attempt"];

    const review = await reviewStoryboard({ key, intel, brief, board, violations });
    attempts.push({ brief, storyboard: board, review, direction, violations });

    if (review.verdict === "pass") {
      return { attempts, best: attempts[attempts.length - 1], settled: false };
    }

    tried.push(direction);
    directives.push(whyRejected(review, violations));
  }

  // Nothing passed. Show the strongest attempt with its review attached rather
  // than an error — the customer can see what was tried, why each was rejected,
  // and push for another direction. Silence here would be the old behaviour:
  // hand over something mediocre and call it finished.
  const best = attempts.reduce((a, b) => (b.review.overall > a.review.overall ? b : a));
  return { attempts, best, settled: true };
}
