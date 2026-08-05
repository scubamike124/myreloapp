/**
 * The permanent record of a child as a character.
 *
 * The directive: "Every child receives a permanent Character Bible… Future
 * stories should reuse this Character Bible automatically. Parents should not
 * need to upload another picture unless they want to update it."
 *
 * Today nothing survives a page reload — the storybook route generates and
 * returns, and StoryMaker's own UI admits it: *"Episodes live in this page only
 * — save or print them before you close it."* So every new story starts by
 * asking for the photo again, and the child looks different each time. That is
 * the single thing most likely to make a parent stop buying: they can see it is
 * not the same character.
 *
 * ## Why the appearance is stored as words
 *
 * The illustration chain is a text-to-image call. Consistency between two
 * stories written months apart comes from giving the model the *same
 * description*, not from re-deriving one from a photo that may have been
 * retaken in different light. So the bible holds the description, and the photo
 * is the thing that produced it once.
 *
 * ## What is deliberately not stored here
 *
 * The photograph itself. The privacy note on the storybook page tells parents
 * "your photo is sent to the AI provider to draw the character and is not kept
 * by Reelo", and that promise is older than this file. Keeping the derived
 * description honours both the promise and the requirement: the child stays
 * consistent without the original image being retained.
 */

export type VoiceProfile = {
  /** Provider voice id, when a narration voice has been chosen for this child. */
  voiceId?: string;
  /** How the narrator should sound reading this character's lines. */
  tone?: string;
};

export type CharacterBible = {
  id: string;
  userId: string;
  /** What the child is called in stories. */
  name: string;
  /** Rough age band, which changes vocabulary and story length. */
  ageBand?: "3-5" | "6-8" | "9-12";

  /* ---- appearance, as the words handed to the image model ---- */
  face: string;
  hair: string;
  clothing: string;
  bodyProportions?: string;
  /** e.g. "soft watercolour", "3D animated". Held so a series stays one style. */
  animationStyle?: string;
  /** Expressions the character is drawn with, so a smile is the same smile. */
  expressions?: string[];

  /* ---- who they are, which drives plot rather than pixels ---- */
  personality?: string[];
  voice?: VoiceProfile;

  createdAt: string;
  updatedAt: string;
  /**
   * Bumped whenever a parent updates the bible.
   *
   * A story records the version it was drawn from, so "why does book three look
   * different?" has an answer instead of being a mystery.
   */
  version: number;
};

/** The fields that must be present before the bible can illustrate anything. */
export const REQUIRED_APPEARANCE: (keyof CharacterBible)[] = ["name", "face", "hair", "clothing"];

export function isUsable(bible: Partial<CharacterBible>): boolean {
  return REQUIRED_APPEARANCE.every((k) => {
    const v = bible[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}

/**
 * The description handed to the illustrator, identical every time.
 *
 * Built by concatenation in a fixed order rather than by asking a model to
 * summarise the bible. A generated summary would drift between calls, and
 * drift is the exact failure this file exists to prevent — two stories a year
 * apart must produce the same sentence.
 */
export function appearancePrompt(bible: CharacterBible): string {
  const parts = [
    `${bible.name}, a child`,
    bible.ageBand ? `aged ${bible.ageBand}` : "",
    `with ${bible.hair}`,
    bible.face,
    `wearing ${bible.clothing}`,
    bible.bodyProportions ?? "",
  ].filter(Boolean);
  const who = parts.join(", ");
  return bible.animationStyle ? `${who}. Drawn in ${bible.animationStyle}.` : `${who}.`;
}

/**
 * Merge an update, keeping anything the parent did not change.
 *
 * A partial update must never blank a field. Parents edit one thing — a
 * haircut, a new favourite jumper — and losing the rest of the description
 * would silently change the character everywhere.
 */
export function applyBibleUpdate(
  current: CharacterBible,
  update: Partial<Omit<CharacterBible, "id" | "userId" | "createdAt" | "version">>,
  now: Date,
): CharacterBible {
  const next: CharacterBible = { ...current };
  for (const [key, value] of Object.entries(update)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    (next as Record<string, unknown>)[key] = value;
  }
  next.updatedAt = now.toISOString();
  /*
   * Only a change to how the character *looks* invalidates existing artwork, so
   * only that bumps the version a story pins itself to.
   *
   * Compared against the merged result rather than against the update, because
   * the loop above deliberately ignores blank strings. Reading the update
   * directly counted a cleared field as a change and bumped the version for an
   * edit that was never applied — which told a parent their older books were
   * drawn from a different description when nothing had moved.
   */
  const appearanceChanged = (
    ["face", "hair", "clothing", "bodyProportions", "animationStyle"] as const
  ).some((k) => next[k] !== current[k]);
  next.version = appearanceChanged ? current.version + 1 : current.version;
  return next;
}
