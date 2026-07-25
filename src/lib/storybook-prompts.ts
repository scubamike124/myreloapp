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
};

/** Heuristic: adult-oriented requests must not be rewritten as kids' bedtime tales. */
export function looksAdultOriented(idea: string, characterName: string): boolean {
  const t = `${idea} ${characterName}`.toLowerCase();
  return /\b(adult|gentleman|lady|man|woman|men|women|romance|romantic|dating|marriage|wife|husband|retire|retirement|older|elderly|senior|grown[- ]?up|looking for a (nice )?woman|looking for a (nice )?man)\b/.test(
    t,
  );
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
}): string {
  const theme = opts.theme.trim() || "Adventurer";
  const hero = (opts.characterName || "").trim() || "the main character";
  const style = opts.adultOriented
    ? "Illustrated storybook art, expressive and cinematic, rich colour, painterly, consistent character design, " +
      "no text, no words, no letters, no watermark, full-bleed square composition."
    : "Illustrated storybook art, warm and friendly, soft shapes, rich colour, painterly, consistent character design, " +
      "gentle lighting, no text, no words, no letters, no watermark, full-bleed square composition.";

  return (
    `${style}\n\n` +
    `=== CHARACTER IDENTITY (GROUND TRUTH — overrides everything else) ===\n` +
    `The attached photograph shows ${hero}, the ONLY main character for this book.\n` +
    `Draw ${hero} as an illustrated version of THAT exact person on this page.\n` +
    `Preserve: approximate age, face shape, hairstyle, skin tone, glasses, facial hair, and distinctive features.\n` +
    `If the scene description conflicts with the photo (wrong age, gender, face, hair), IGNORE the conflict and follow the photograph.\n` +
    `Do NOT invent a different protagonist. Supporting people may appear in the background or beside ${hero}, ` +
    `but ${hero} from the photo must be the clear focal subject.\n` +
    `Draw in storybook style, NOT as a photograph.\n` +
    (opts.adultOriented
      ? `Do NOT turn this adult into a child. Keep adult proportions and age.\n`
      : `Match the age implied by the photograph and story — do not arbitrarily age them up or down.\n`) +
    `They may wear ${theme.toLowerCase()} costume/role elements while staying the same individual.\n` +
    `===============================================================\n\n` +
    `Page text (for scene accuracy): ${opts.pageText}\n\n` +
    `Scene / action to depict (pose and setting only — appearance comes from the photo): ${opts.illustration}\n\n` +
    `The illustration must match the page text and keep ${hero}'s identity consistent with the attached photo.`
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
