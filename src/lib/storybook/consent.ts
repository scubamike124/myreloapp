/**
 * Who agreed to what, and when.
 *
 * ## The model
 *
 * The storybook makes personalised books from photographs of children. The
 * defensible way to run that — and the way comparable photo-book services run
 * it — is as a service sold to **parents**: the account holder is an adult, the
 * child is theirs, and they say so before a photograph is used.
 *
 * That is a meaningfully different thing from a service *directed at children*.
 * COPPA is concerned with collecting personal information from a child; here the
 * information is provided by the parent about their own child, on an account the
 * parent owns. Keeping that distinction true is a design constraint, not a
 * wording choice: children must not be the account holders, and the consent has
 * to be recorded rather than assumed.
 *
 * ## Why it is a record and not a checkbox
 *
 * A checkbox that sets no state proves nothing afterwards. If someone asks "did
 * this person consent, to what, and when?", the answer has to exist
 * independently of the story — which may since have been deleted — so consent
 * is its own row, and deleting stories does not erase the fact that consent was
 * given.
 *
 * ## Versioning
 *
 * Consent to one form of words is not consent to a later, broader one. The
 * version is stored, so widening the wording means asking again rather than
 * quietly inheriting agreement to something the person never read.
 *
 * ## What this file does NOT decide
 *
 * Whether the wording is legally sufficient in a given jurisdiction. It records
 * agreement to a specific text; a lawyer should read the text.
 */

export const CONSENT_KIND = "storybook_child_image" as const;

/**
 * The current wording. Bump the version whenever a word of it changes.
 *
 * Written to be understood rather than to be defensible-sounding: it says what
 * is used, what is kept, what is not kept, and what happens on deletion.
 */
export const CHILD_IMAGE_CONSENT_VERSION = "2026-08-1";

export const CHILD_IMAGE_CONSENT_TEXT =
  "I am 18 or over and I am the parent or legal guardian of the person in this photograph, " +
  "or I have their guardian's permission. I agree that the photo may be sent to our AI " +
  "providers to draw an illustrated character. The photo itself is not kept — only a written " +
  "description of how the character looks, which I can view and delete at any time.";

/** The promises the wording makes, kept next to it so they cannot drift apart. */
export const CONSENT_PROMISES = [
  "The photograph is not stored.",
  "A written description of the character is stored, and is deletable.",
  "The account holder is an adult.",
  "The account holder is the guardian, or has the guardian's permission.",
] as const;

export type ConsentRecord = {
  kind: string;
  version: string;
  createdAt: string;
};

/**
 * Whether a stored consent still covers the current wording.
 *
 * Older versions do not count. That is the point of versioning: if the text
 * changed, the person agreed to different words and has to be asked again.
 */
export function coversCurrentWording(records: ConsentRecord[]): boolean {
  return records.some((r) => r.kind === CONSENT_KIND && r.version === CHILD_IMAGE_CONSENT_VERSION);
}
