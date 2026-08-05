/**
 * Storybook prompt construction — kept pure so personalization can be unit-tested.
 *
 * Bug class this prevents: a hardcoded "gentle bedtime story for ages 3–7"
 * template silently replacing the user's custom topic, and illustration copy
 * that always says "the child" (turning adult photo subjects into kids).
 */

export type StorybookInput = {
  characterName: string;
  idea: string;
  theme: string;
  languageName: string;
  languageEndonym: string;
  pageCount: number;
  /**
   * The chosen adventure type and occasion, from `categoryGuidance`.
   *
   * Like the theme, it shapes the story rather than choosing it — the parent's
   * request stays the plot. Unlike the theme, which is costume only, this sets
   * the setting, the cast and the kind of problem to be solved.
   */
  guidance?: string;
  /**
   * The series briefing, when this story is a sequel — built by
   * `continuityPrompt` from what Amber remembers of the earlier episodes.
   *
   * Placed after the story request rather than before it, because the request
   * is still what this episode is about. Continuity constrains the world; it
   * does not choose the plot.
   */
  continuity?: string;
};

/**
 * Requests that contain an ambiguous word but are plainly children's material.
 *
 * Checked first, and decisive. A hyphen is a word boundary, so "Spider-Man"
 * matched the bare `man` alternative this list exists to defuse.
 */
const CHILDLIKE =
  /\b(spider[- ]?man|iron[- ]?man|ant[- ]?man|bat[- ]?man|he[- ]?man|super[- ]?man|gingerbread man|snow[- ]?man|muffin man|man on the moon|lady ?bug|lady ?bird|old(er)? (brother|sister|cousin|kid|boy|girl))\b/;

/** Words that only ever signal an adult request. */
const ADULT_TERMS =
  /\b(adult|gentleman|romance|romantic|dating|marriage|married|wife|husband|retire|retirement|elderly|widow|widower|grown[- ]?up)\b/;

/**
 * Ambiguous words that signal an adult request only in these shapes.
 *
 * `man`, `woman`, `lady` and `older` cannot decide this on their own; only the
 * words around them separate "an older gentleman looking for a companion" from
 * "Ollie's older brother meets Spider-Man". `senior` is deliberately absent
 * unless followed by `citizen` — on its own it reads as senior year.
 */
const ADULT_PHRASES =
  /\b(a (man|woman) (who|looking|named)|looking for a (nice )?(man|woman)|(his|her|my) (wife|husband)|senior citizen)\b/;

/**
 * An older person as the *protagonist*, which is a different thing from an
 * older person appearing in the story.
 *
 * "An older gentleman looking for a companion" and "Ava helps an old lady cross
 * the road" contain the same words and are not the same request: the first is
 * about him, the second is about Ava. What separates them is position — a
 * request opens with its hero. Anchoring is a cruder signal than understanding
 * the sentence, and it is the right kind of crude here, because the two
 * mistakes do not cost the same. Reading a child's story as adult puts
 * "keep adult proportions" against a photograph of a six-year-old; reading an
 * adult's story as a child's gives it a warmer tone than asked for, and the
 * photograph still governs how they are drawn.
 */
const ADULT_SUBJECT = /^\s*(a|an|the)\s+(old(er)?|elderly)\s+(man|woman|lady|gentleman|guy)\b/;

/**
 * Heuristic: adult-oriented requests must not be rewritten as kids' bedtime tales.
 *
 * The cost of a false positive is high and invisible. The flag does not only
 * change the prose — the route passes it into every illustration prompt, where
 * it emits "Do NOT turn this adult into a child. Keep adult proportions and
 * age." on a page being drawn from a photograph of a six-year-old. So a request
 * as ordinary as "Ollie meets Spider-Man" produced an adult-framed story whose
 * illustration prompts argued with the child's own photo.
 */
export function looksAdultOriented(idea: string, characterName: string): boolean {
  const t = `${idea} ${characterName}`.toLowerCase();
  // Early return, not a later condition: "Ollie's older brother meets
  // Spider-Man" must not be re-flagged by a phrase match further down.
  if (CHILDLIKE.test(t)) return false;
  // The idea alone for the subject test — the name is appended to `t` and would
  // never be at the front.
  return ADULT_TERMS.test(t) || ADULT_PHRASES.test(t) || ADULT_SUBJECT.test(idea.trim().toLowerCase());
}

export function buildStoryPrompt(input: StorybookInput): string {
  const hero = input.characterName.trim() || "the main character";
  const idea = input.idea.trim();
  const theme = input.theme.trim() || "Adventurer";
  const adult = looksAdultOriented(idea, hero);

  const audience = adult
    ? `Write an age-appropriate illustrated picture-book style story for an ADULT main character. Do NOT write a children's bedtime story. Do NOT invent a child wizard / school / toy plot. Do NOT use phrases like "little wizard", "brave little", or a preschool "once upon a time" tone unless the user asked for that. Treat the hero as a grown adult.`
    : idea
      ? `Write an illustrated picture-book story. Match the tone to the user's request (gentle if they ask for bedtime/kids; otherwise follow their topic).`
      : `Write an illustrated picture-book story. Prefer a warm, readable tone unless the user specifies otherwise.`;

  return (
    `${audience}\n\n` +
    `=== PRIMARY STORY REQUEST (AUTHORITATIVE — follow this exactly) ===\n` +
    (idea
      ? `"${idea}"\n`
      : `(No custom topic was provided — invent a simple, wholesome adventure for ${hero}.)\n`) +
    `===============================================================\n\n` +
    (input.guidance?.trim()
      ? `=== ADVENTURE TYPE ===\n${input.guidance.trim()}\n` + `===============================================================\n\n`
      : "") +
    (input.continuity?.trim()
      ? `=== SERIES CONTINUITY (this is not the first book) ===\n${input.continuity.trim()}\n` +
        `===============================================================\n\n`
      : "") +
    `Main character name: ${hero}\n` +
    `Role / costume only (does NOT replace the story topic): ${theme}. ` +
    `The character may dress or act in a ${theme.toLowerCase()} role, but the plot MUST stay about the primary story request above.\n` +
    `Language: write EVERY word of title, dedication, and page text in ${input.languageName} (${input.languageEndonym}). ` +
    `Do not use English unless the language IS English.\n\n` +
    `CRITICAL RULES:\n` +
    `- The primary story request is the plot. Never replace it with a preset example, default bedtime template, or generic "child bravely learns a lesson" story.\n` +
    `- Preserve the user's intended meaning even if grammar is imperfect.\n` +
    `- Infer approximate age/life stage from the request and name. If the request is about an older gentleman, romance, work, etc., keep that adult framing.\n` +
    `- Only use a cosy children's bedtime arc if the user clearly asked for a child/bedtime story.\n` +
    (adult
      ? `- Dedication must address an adult reader/character — never "little wizards" or similar child copy.\n`
      : "") +
    `- ${hero} is ALWAYS the protagonist. Other people may appear as supporting characters, but never replace ${hero} as the hero.\n` +
    `\nReturn ONLY JSON, no markdown fence:\n` +
    `{"title": "...", "dedication": "...", "pages": [{"text": "...", "illustration": "..."}]}\n\n` +
    `- Exactly ${input.pageCount} pages.\n` +
    `- "text": 2 to 3 short sentences for that page, in ${input.languageName}. Clear read-aloud rhythm.\n` +
    `- "dedication": one short line in ${input.languageName}.\n` +
    `- "illustration": a description IN ENGLISH of what to draw. EVERY illustration MUST name "${hero}" as the ` +
    `visible main subject (e.g. "${hero} stands…"). Do NOT invent a different hero's age, gender, or face — ` +
    `a real photograph of ${hero} will be attached when drawing, so keep illustration notes focused on pose, ` +
    `setting, action, mood, and ${theme.toLowerCase()} costume cues only. Supporting characters may appear ` +
    `but ${hero} must remain the clear focal subject. Never force the word "child" unless the story is actually ` +
    `about a child. No text or letters in the image.\n` +
    `- Complete arc across the pages that serves the primary request.\n`
  );
}

export function buildIllustrationPrompt(opts: {
  illustration: string;
  theme: string;
  pageText: string;
  adultOriented: boolean;
  characterName?: string;
  /**
   * The character bible's fixed appearance sentence, when this character has
   * one. It is what makes book four look like book one: the same words go to
   * the image model every time, rather than a fresh reading of a fresh photo.
   */
  appearance?: string;
  /**
   * Whether a photograph is attached to this call.
   *
   * The directive is that parents "should not need to upload another picture
   * unless they want to update it", so a sequel usually arrives without one.
   * The identity section has to name a single ground truth — with both, the
   * photo wins because it is the more specific reference; with only the bible,
   * the bible is not a supporting hint but the whole description, and saying
   * "the attached photograph" when nothing is attached invites the model to
   * invent one.
   */
  hasPhoto?: boolean;
}): string {
  const theme = opts.theme.trim() || "Adventurer";
  const hero = (opts.characterName || "").trim() || "the main character";
  const appearance = (opts.appearance || "").trim();
  const photo = opts.hasPhoto !== false;
  const style = opts.adultOriented
    ? "Illustrated storybook art, expressive and cinematic, rich colour, painterly, consistent character design, " +
      "no text, no words, no letters, no watermark, full-bleed square composition."
    : "Illustrated storybook art, warm and friendly, soft shapes, rich colour, painterly, consistent character design, " +
      "gentle lighting, no text, no words, no letters, no watermark, full-bleed square composition.";

  const identity = photo
    ? `The attached photograph shows ${hero}, the ONLY main character for this book.\n` +
      `Draw ${hero} as an illustrated version of THAT exact person on this page.\n` +
      `Preserve: approximate age, face shape, hairstyle, skin tone, glasses, facial hair, and distinctive features.\n` +
      `If the scene description conflicts with the photo (wrong age, gender, face, hair), IGNORE the conflict and follow the photograph.\n` +
      (appearance ? `This is the same character described as: ${appearance}\n` : "") +
      `Do NOT invent a different protagonist. Supporting people may appear in the background or beside ${hero}, ` +
      `but ${hero} from the photo must be the clear focal subject.\n`
    : `${hero} is the ONLY main character for this book, and looks exactly like this: ${appearance}\n` +
      `That description is fixed. It is the same in every book in this series, and it must be drawn the same way ` +
      `every time — a reader will notice if ${hero} changes between pages or between books.\n` +
      `If the scene description conflicts with it (wrong age, hair, clothing), IGNORE the conflict and follow the description.\n` +
      `Do NOT invent a different protagonist. Supporting people may appear in the background or beside ${hero}, ` +
      `but ${hero} must be the clear focal subject.\n`;

  return (
    `${style}\n\n` +
    `=== CHARACTER IDENTITY (GROUND TRUTH — overrides everything else) ===\n` +
    identity +
    `Draw in storybook style, NOT as a photograph.\n` +
    /*
     * The age line, and why the photo overrides the adult flag.
     *
     * "Do NOT turn this adult into a child" is only safe when there is no
     * photograph. With one, the photo is already declared ground truth above,
     * so the line is redundant when the flag is right and actively harmful when
     * it is wrong — an over-eager heuristic would have the model drawing an
     * adult from a picture of a six-year-old. The neutral line says the same
     * thing without betting on the guess.
     */
    (opts.adultOriented && !photo
      ? `Do NOT turn this adult into a child. Keep adult proportions and age.\n`
      : photo
        ? `Match the age implied by the photograph and story — do not arbitrarily age them up or down.\n`
        : `Match the age in the description above — do not arbitrarily age them up or down.\n`) +
    `They may wear ${theme.toLowerCase()} costume/role elements while staying the same individual.\n` +
    `===============================================================\n\n` +
    `Page text (for scene accuracy): ${opts.pageText}\n\n` +
    `Scene / action to depict (pose and setting only — appearance comes from ${photo ? "the photo" : "the description above"}): ${opts.illustration}\n\n` +
    `The illustration must match the page text and keep ${hero}'s identity consistent with ` +
    `${photo ? "the attached photo" : "that description"}.`
  );
}

export function summarizeStorybookRequest(input: StorybookInput) {
  return {
    characterName: input.characterName.trim() || "(unnamed)",
    idea: input.idea.trim() || "(empty)",
    theme: input.theme.trim() || "Adventurer",
    pageCount: input.pageCount,
    language: `${input.languageName} (${input.languageEndonym})`,
    adultOriented: looksAdultOriented(input.idea, input.characterName),
  };
}
