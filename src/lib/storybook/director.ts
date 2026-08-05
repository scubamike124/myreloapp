/**
 * Amber as Creative Director.
 *
 * The directive: "Before rendering any movie: review story quality, hook,
 * emotional pacing, camera movement, visual consistency, character consistency,
 * educational value, entertainment value. If quality is below the required
 * threshold, automatically improve and regenerate. Do not deliver low-quality
 * productions."
 *
 * ## The gate is before the render, and that is the entire point
 *
 * A twelve-scene film is about $7.20 of provider spend. Judging the finished
 * film and re-rendering costs that again every time it fails, and a gate that
 * expensive gets quietly turned down until it stops rejecting anything.
 *
 * So the gate judges the *screenplay* — the text the film will be made from.
 * Rejecting a weak plan costs a fraction of a cent, which means the threshold
 * can be set where it should be rather than where it is affordable. Everything
 * the directive lists is decidable from the plan: camera movement, pacing and
 * visual consistency are all written down before they are rendered.
 *
 * ## Why the model does not get to choose the threshold
 *
 * The scores come from a model; the decision does not. The model returns eight
 * numbers, and this file decides what they mean — a fixed threshold, a fixed
 * rule for which criteria can never be traded away, and a fixed number of
 * attempts. A prompt that asked "is this good enough?" would produce a verdict
 * that drifts with the wording, and "do not deliver low-quality productions" is
 * not a thing to be persuaded about.
 */

/** The eight the directive names, in the order it names them. */
export const CRITERIA = [
  "storyQuality",
  "hook",
  "emotionalPacing",
  "cameraMovement",
  "visualConsistency",
  "characterConsistency",
  "educationalValue",
  "entertainmentValue",
] as const;

export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABEL: Record<Criterion, string> = {
  storyQuality: "Story quality",
  hook: "Hook",
  emotionalPacing: "Emotional pacing",
  cameraMovement: "Camera movement",
  visualConsistency: "Visual consistency",
  characterConsistency: "Character consistency",
  educationalValue: "Educational value",
  entertainmentValue: "Entertainment value",
};

/** What each score is actually judging. Sent to the reviewer verbatim. */
export const CRITERION_BRIEF: Record<Criterion, string> = {
  storyQuality: "Does it have a beginning, a real problem, and an ending that resolves it?",
  hook: "Does the first scene give a reason to watch the second?",
  emotionalPacing: "Does the feeling change across the scenes, rather than staying level?",
  cameraMovement: "Does each scene specify a shot and a move, and do they vary?",
  visualConsistency: "Do the scenes describe one world — same style, same palette, same light?",
  characterConsistency: "Is the hero described the same way in every scene?",
  educationalValue: "Is there something true or worth learning, without a lecture?",
  entertainmentValue: "Would a child ask to watch it again?",
};

export type Scores = Record<Criterion, number>;

/**
 * The bar, out of 10.
 *
 * Set at 7 rather than 8: the reviewer is scoring a plan, and a plan that
 * scores 7 across the board becomes a good film. Set higher, the loop below
 * spends its three attempts chasing a number rather than fixing anything.
 */
export const THRESHOLD = 7;

/**
 * Criteria that cannot be averaged away.
 *
 * A film can be a little less educational than hoped and still be worth
 * watching. It cannot have the hero change appearance halfway through — that is
 * the one failure a parent notices immediately and the one this whole
 * subsystem, character bible included, exists to prevent. So these two are
 * judged individually and a good average does not rescue them.
 */
export const NON_NEGOTIABLE: Criterion[] = ["characterConsistency", "visualConsistency"];

/** Below this, a non-negotiable criterion fails on its own. */
export const NON_NEGOTIABLE_FLOOR = 7;

/**
 * How many times a rejected plan is rewritten before the order stops.
 *
 * Finite on purpose. "Automatically improve and regenerate" without a limit is
 * a loop that bills a parent for a film it never delivers, and a plan that is
 * still failing on the fourth attempt is not going to be fixed by a fifth — the
 * request itself is the problem, and a person should see it.
 */
export const MAX_ATTEMPTS = 3;

export type Verdict = {
  approved: boolean;
  scores: Scores;
  average: number;
  /** Criteria below the bar, worst first — this is what the rewrite is aimed at. */
  failed: Criterion[];
  /** Failures that cannot be traded against a good average. */
  blocking: Criterion[];
  /** The reviewer's own words, kept for the audit trail. */
  notes: string;
};

const clamp = (n: unknown): number => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, v));
};

/** Read whatever the reviewer returned, tolerating anything. */
export function readScores(raw: unknown): Scores {
  const rec = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Scores;
  for (const c of CRITERIA) out[c] = clamp(rec[c]);
  return out;
}

/**
 * The decision.
 *
 * A missing score is a zero rather than a skip, so a reviewer that returns half
 * an answer fails the gate instead of passing it by omission — the failure mode
 * of a quality check should be "rejected", never "approved by accident".
 */
export function judge(scores: Scores, notes = ""): Verdict {
  const values = CRITERIA.map((c) => scores[c]);
  const average = values.reduce((a, b) => a + b, 0) / CRITERIA.length;

  const failed = CRITERIA.filter((c) => scores[c] < THRESHOLD).sort((a, b) => scores[a] - scores[b]);
  const blocking = NON_NEGOTIABLE.filter((c) => scores[c] < NON_NEGOTIABLE_FLOOR);

  return {
    approved: average >= THRESHOLD && failed.length === 0 && blocking.length === 0,
    scores,
    average: Math.round(average * 10) / 10,
    failed,
    blocking,
    notes: notes.slice(0, 1000),
  };
}

/**
 * The instruction for the next attempt.
 *
 * Names the criteria that failed and what each one means, rather than saying
 * "make it better" — a rewrite aimed at nothing in particular tends to move the
 * scores sideways, and there are only three attempts.
 */
export function rewriteBrief(verdict: Verdict): string {
  if (verdict.approved) return "";
  const lines = ["The previous version was rejected. Fix these specifically:"];
  for (const c of verdict.failed) {
    lines.push(`- ${CRITERION_LABEL[c]} (scored ${verdict.scores[c]}/10). ${CRITERION_BRIEF[c]}`);
  }
  if (verdict.blocking.length > 0) {
    lines.push(
      "",
      `${verdict.blocking.map((c) => CRITERION_LABEL[c]).join(" and ")} must be fixed. ` +
        `A good score elsewhere does not make up for it.`,
    );
  }
  if (verdict.notes) lines.push("", `Reviewer's notes: ${verdict.notes}`);
  lines.push("", "Keep everything that was working. Do not restart the story.");
  return lines.join("\n");
}

/** One line for the order screen, so a parent is told what happened. */
export function verdictSummary(verdict: Verdict, attempt: number): string {
  if (verdict.approved) {
    return attempt === 1
      ? `Amber approved the film (${verdict.average}/10).`
      : `Amber approved the film on attempt ${attempt} (${verdict.average}/10).`;
  }
  const worst = verdict.failed[0];
  return worst
    ? `Amber sent it back: ${CRITERION_LABEL[worst].toLowerCase()} scored ${verdict.scores[worst]}/10.`
    : `Amber sent it back (${verdict.average}/10).`;
}
