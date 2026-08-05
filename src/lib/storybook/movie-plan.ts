/**
 * The screenplay: a storybook turned into something that can be filmed.
 *
 * The directive lists what a scene has to carry — "scene breakdown, camera
 * directions, narration, voice, music cues, sound effects, lighting, camera
 * movement, visual effects, scene transitions, character animation" — and this
 * is where a page of a picture book becomes that.
 *
 * ## The plan is text, and that is what makes the quality gate affordable
 *
 * Everything here is written before a single second of video is rendered, which
 * is what lets `director.ts` judge the film for a fraction of a cent instead of
 * $7.20. A plan is also re-readable: when a parent asks why their film looks the
 * way it does, the answer is a document rather than a prompt that has been
 * thrown away.
 *
 * ## One scene per page, deliberately
 *
 * Not one scene per beat, or per paragraph. The book and the film are sold as
 * the same story — the bundle's whole promise — and a reader who can point at
 * page four and find it in the film is the cheapest way to keep that promise
 * true.
 */

import type { CharacterBible } from "./character-bible.ts";

export type Scene = {
  /** 1-based, and the same number as the book's page. */
  number: number;
  /** What happens, in one or two sentences. */
  action: string;
  /** The line the narrator reads over it. Usually the page's own text. */
  narration: string;
  /** e.g. "wide establishing shot", "close on her hands". */
  shot: string;
  /** e.g. "slow push in", "pan left to follow". */
  cameraMove: string;
  /** e.g. "late afternoon, low golden light through the trees". */
  lighting: string;
  /** e.g. "soft strings, hopeful, building". */
  musicCue: string;
  /** Diegetic sound. e.g. "gulls, distant surf". */
  soundEffects: string;
  /** How this scene becomes the next. e.g. "cut", "slow dissolve". */
  transition: string;
  /** What the character physically does. e.g. "she looks up, then runs". */
  characterAnimation: string;
};

export type MoviePlan = {
  title: string;
  /** One sentence: what the film is about. */
  logline: string;
  /** The look, applied to every scene so they belong to one film. */
  visualStyle: string;
  /** How the narrator sounds. */
  narratorVoice: string;
  /** The score as a whole, not per scene. */
  musicStyle: string;
  scenes: Scene[];
};

/** Seconds per scene. Veo accepts 4, 6 or 8; 6 is the mid price. */
export const SCENE_SECONDS = 6;

export const MAX_SCENES = 12;

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max).trim() : "");

/**
 * Read a plan out of whatever the model returned.
 *
 * Every field is defaulted rather than required. A scene missing its lighting
 * note is a scene that gets a sensible default; a parse that threw would lose
 * the eleven good scenes with it, and the quality gate downstream is what
 * decides whether the result is good enough — not this function.
 */
export function readPlan(raw: unknown, fallbackTitle: string): MoviePlan {
  const rec = (raw ?? {}) as Record<string, unknown>;
  const scenes = Array.isArray(rec.scenes) ? rec.scenes : [];

  return {
    title: str(rec.title, 160) || fallbackTitle,
    logline: str(rec.logline, 300),
    visualStyle: str(rec.visualStyle, 400),
    narratorVoice: str(rec.narratorVoice, 200),
    musicStyle: str(rec.musicStyle, 200),
    scenes: scenes.slice(0, MAX_SCENES).map((s, i): Scene => {
      const r = (s ?? {}) as Record<string, unknown>;
      return {
        number: i + 1,
        action: str(r.action, 600),
        narration: str(r.narration, 600),
        shot: str(r.shot, 120) || "medium shot",
        cameraMove: str(r.cameraMove, 120) || "slow push in",
        lighting: str(r.lighting, 200) || "soft natural light",
        musicCue: str(r.musicCue, 200) || "gentle underscore",
        soundEffects: str(r.soundEffects, 200),
        transition: str(r.transition, 80) || "cut",
        characterAnimation: str(r.characterAnimation, 300),
      };
    }),
  };
}

/** A plan with no scenes, or scenes with nothing to film, cannot be rendered. */
export function isRenderable(plan: MoviePlan): boolean {
  return plan.scenes.length > 0 && plan.scenes.every((s) => s.action.length > 0);
}

export function planSeconds(plan: MoviePlan): number {
  return plan.scenes.length * SCENE_SECONDS;
}

/**
 * The prompt that writes the screenplay.
 *
 * The pages are handed over as the source of truth for what happens, and the
 * model is told to adapt rather than invent. A screenplay that departs from the
 * book breaks the bundle's promise that the two are the same story — and the
 * parent has already read the book, so they will notice.
 */
export function buildMoviePrompt(input: {
  title: string;
  dedication: string;
  pages: { text: string; illustration?: string }[];
  characterName: string;
  bible?: CharacterBible | null;
  appearance?: string;
  languageName: string;
  /** From `rewriteBrief` when the director rejected the previous attempt. */
  revision?: string;
}): string {
  const hero = input.characterName.trim() || "the main character";
  const scenes = Math.min(input.pages.length, MAX_SCENES);

  const pages = input.pages
    .slice(0, MAX_SCENES)
    .map((p, i) => `Page ${i + 1}: ${p.text}${p.illustration ? `\n  (illustrated as: ${p.illustration})` : ""}`)
    .join("\n");

  return (
    `Adapt this children's picture book into a ${scenes}-scene animated short film.\n\n` +
    `=== THE BOOK (this is what happens — adapt it, do not replace it) ===\n${pages}\n` +
    `===============================================================\n\n` +
    `Title: ${input.title}\n` +
    `Hero: ${hero}\n` +
    (input.appearance ? `${hero} looks exactly like this, in every scene: ${input.appearance}\n` : "") +
    (input.bible?.animationStyle ? `Animation style: ${input.bible.animationStyle}\n` : "") +
    `Narration language: ${input.languageName}. Write every narration line in ${input.languageName}.\n\n` +
    (input.revision ? `=== REVISION REQUIRED ===\n${input.revision}\n=======================\n\n` : "") +
    `RULES:\n` +
    `- Exactly one scene per page, in order. Scene ${scenes} ends the story.\n` +
    `- Each scene is ${SCENE_SECONDS} seconds. Write action that fits in ${SCENE_SECONDS} seconds — one clear beat, not three.\n` +
    `- Narration is what a reader hears. Keep it close to the page text; shorten it if it will not fit.\n` +
    `- ${hero} must be described consistently. Do not restyle them between scenes.\n` +
    `- Vary the shots and the camera moves. A film where every scene is a slow push in is boring by scene three.\n` +
    `- No on-screen text, letters, watermarks or subtitles.\n` +
    `- Nothing frightening: no peril to the child, no violence, no darkness played for fear.\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"title":"...","logline":"...","visualStyle":"...","narratorVoice":"...","musicStyle":"...",` +
    `"scenes":[{"action":"...","narration":"...","shot":"...","cameraMove":"...","lighting":"...",` +
    `"musicCue":"...","soundEffects":"...","transition":"...","characterAnimation":"..."}]}\n\n` +
    `- "visualStyle": the look shared by every scene — medium, palette, light. One sentence.\n` +
    `- "narratorVoice": who reads it and how. One phrase.\n` +
    `- "musicStyle": the score across the whole film. One phrase.\n` +
    `- "shot" and "cameraMove": concrete and filmable, not "cinematic".\n`
  );
}

/**
 * The prompt handed to the video model for one scene.
 *
 * Assembled here rather than in the route so a scene's prompt is derived from
 * the plan by one function that can be read and tested. The appearance sentence
 * goes into every scene: the model has no memory between calls, so consistency
 * is something each prompt has to carry on its own.
 */
export function buildScenePrompt(plan: MoviePlan, scene: Scene, appearance: string): string {
  return [
    plan.visualStyle,
    appearance ? `The main character looks exactly like this: ${appearance}` : "",
    `Scene ${scene.number} of ${plan.scenes.length}. ${scene.action}`,
    scene.characterAnimation ? `Character action: ${scene.characterAnimation}` : "",
    `Shot: ${scene.shot}. Camera: ${scene.cameraMove}. Lighting: ${scene.lighting}.`,
    scene.soundEffects ? `Ambience: ${scene.soundEffects}.` : "",
    // Narration is laid over the footage afterwards, which is why the film can
    // be rendered on the cheaper tier at all — it is not buying Veo's audio.
    "No on-screen text, no letters, no watermark, no subtitles.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The prompt that asks the director for scores.
 *
 * It asks for numbers and nothing else. The decision — the threshold, which
 * criteria cannot be traded away, how many attempts — lives in `director.ts`,
 * because a model asked "is this good enough?" gives an answer that moves with
 * the wording of the question.
 */
export function buildReviewPrompt(plan: MoviePlan, criteria: { key: string; label: string; brief: string }[]): string {
  const scenes = plan.scenes
    .map(
      (s) =>
        `Scene ${s.number}: ${s.action}\n` +
        `  narration: ${s.narration}\n` +
        `  ${s.shot}, ${s.cameraMove}, ${s.lighting}\n` +
        `  music: ${s.musicCue} | sound: ${s.soundEffects} | transition: ${s.transition}\n` +
        `  character: ${s.characterAnimation}`,
    )
    .join("\n\n");

  return (
    `You are reviewing the plan for a children's animated short before it is rendered. ` +
    `Rendering is expensive, so this is the last chance to catch a weak film cheaply.\n\n` +
    `Title: ${plan.title}\nLogline: ${plan.logline}\n` +
    `Visual style: ${plan.visualStyle}\nNarrator: ${plan.narratorVoice}\nMusic: ${plan.musicStyle}\n\n` +
    `${scenes}\n\n` +
    `Score each of these from 0 to 10. Be strict — a 7 means "good enough to make".\n` +
    criteria.map((c) => `- ${c.key}: ${c.label}. ${c.brief}`).join("\n") +
    `\n\nReturn ONLY JSON, no markdown fence:\n` +
    `{${criteria.map((c) => `"${c.key}":0`).join(",")},"notes":"..."}\n\n` +
    `- "notes": the single most important thing to fix, in one sentence. ` +
    `If nothing needs fixing, say so.\n`
  );
}
