// ---------------------------------------------------------------------------
// Stage 3 — the storyboard, and the rules it has to survive.
//
// Two halves. The first writes a board against the DNA and the brief. The
// second checks it in code, which is the half that matters: a prompt asking for
// varied shot sizes produces varied shot sizes most of the time, and "most of
// the time" is how a product ships three identical commercials to the same
// customer. validateStoryboard does not ask, it measures — beat coverage,
// running time, adjacent shot sizes, presenter share, voiceover density,
// whether the picture carries the beat with the sound off, and whether anything
// is being claimed that the business never actually claimed.
//
// Violations come back as sentences rather than error codes because they are
// fed straight back to the writer as notes. A board is rewritten against its
// own failures before anyone is asked to look at it.
// ---------------------------------------------------------------------------

import {
  AVATAR_BUDGET,
  BEAT_ORDER,
  CAMERA_MOVES,
  COMMERCIAL_SECONDS,
  MAX_VO_WORDS_PER_SECOND,
  SHOT_SECONDS,
  SHOT_SIZES,
  TRANSITIONS,
  beat,
  dnaBriefing,
  visualSystem,
} from "./dna";
import { briefBriefing } from "./brief";
import { askJson, num, oneOf, str, type JsonSchema } from "./gemini";
import { intelBriefing } from "./intel";
import type { BeatId, BusinessIntel, CreativeBrief, Direction, Scene, Storyboard } from "./types";

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    logline: { type: "string" },
    music: { type: "string" },
    endCardLine: { type: "string" },
    endCardCta: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          beat: { type: "string", enum: [...BEAT_ORDER] },
          seconds: { type: "number" },
          shotSize: { type: "string", enum: [...SHOT_SIZES] },
          cameraMove: { type: "string", enum: [...CAMERA_MOVES] },
          subject: { type: "string" },
          action: { type: "string" },
          location: { type: "string" },
          visualStory: { type: "string" },
          onScreenText: { type: "string" },
          voiceover: { type: "string" },
          transitionOut: { type: "string", enum: [...TRANSITIONS] },
          presenter: { type: "boolean" },
        },
        required: [
          "beat",
          "seconds",
          "shotSize",
          "cameraMove",
          "subject",
          "action",
          "location",
          "visualStory",
          "onScreenText",
          "voiceover",
          "transitionOut",
          "presenter",
        ],
      },
    },
  },
  required: ["title", "logline", "music", "endCardLine", "endCardCta", "scenes"],
};

export async function writeStoryboard(opts: {
  key: string;
  intel: BusinessIntel;
  brief: CreativeBrief;
  /** On a repair pass: the board that failed, and what was wrong with it. */
  repair?: { board: Storyboard; violations: string[] };
  /**
   * Opening images already used by earlier attempts.
   *
   * The divergence briefing goes to the brief writer, which picks the argument
   * and the visual system — but the opening IMAGE is invented here, and this
   * stage was never told what had already been shot. The result was three
   * "different" commercials that all opened on the same child's hand reaching
   * for the same worn-out books. Strategy can diverge perfectly and still
   * produce an identical first frame, so the constraint has to reach the stage
   * that actually draws it.
   */
  spentOpenings?: string[];
}): Promise<Storyboard> {
  const { key, intel, brief, repair } = opts;
  const spentOpenings = (opts.spentOpenings ?? []).filter(Boolean);

  const prompt =
    `You are directing a ${COMMERCIAL_SECONDS}-second business commercial. Write the board shot by shot.\n\n` +
    `${dnaBriefing()}\n\n` +
    `${intelBriefing(intel)}\n\n` +
    `${briefBriefing(brief)}\n\n` +
    (spentOpenings.length
      ? `OPENING IMAGES ALREADY USED — scene 1 may not be any of these, nor a paraphrase:\n` +
        spentOpenings.map((s) => `  - ${s}`).join("\n") +
        `\nPoint the camera somewhere genuinely different. If every previous opening was a hand\n` +
        `reaching for an object, do not open on a hand, and do not open on that object. Changing\n` +
        `the shot size of the same picture is not a different opening.\n\n`
      : "") +
    (repair
      ? `THIS IS A REWRITE. Your previous board broke these rules:\n` +
        repair.violations.map((v) => `  - ${v}`).join("\n") +
        `\nKeep what worked. Fix every listed failure. Do not introduce new ones.\n` +
        `Previous board:\n${boardAsText(repair.board)}\n\n`
      : "") +
    `For each scene:\n` +
    `- subject: what is physically in the frame. A named thing — "the fitter's hands on the torque\n` +
    `  wrench", not "professionalism".\n` +
    `- action: what CHANGES during the shot. A shot where nothing changes is a photograph.\n` +
    `- location: which of the business's real locations this is.\n` +
    `- visualStory: what a viewer with the sound off understands from this shot. If you cannot answer\n` +
    `  without repeating the voiceover, the shot is decoration — replace it.\n` +
    `- onScreenText: text burned into the frame, or "" for none. Most scenes should have none.\n` +
    `- voiceover: the spoken line, or "" for none. At least two scenes must carry themselves in silence.\n` +
    `- presenter: true only if a person addresses camera. Almost always false.\n\n` +
    `Also return a title, a one-line logline, the music, and the end card — endCardLine (what the brand\n` +
    `stands for, a few words) and endCardCta (the single next step: call, book, visit, order).`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    temperature: repair ? 0.7 : 0.95,
    maxOutputTokens: 8192,
    timeoutMs: 120_000,
  });

  const scenes: Scene[] = (Array.isArray(raw.scenes) ? raw.scenes : [])
    .slice(0, 16)
    .map((s: Record<string, unknown>): Scene => ({
      beat: oneOf<BeatId>(s.beat, BEAT_ORDER, "solution"),
      seconds: num(s.seconds, 0.5, 12, 3),
      shotSize: oneOf(s.shotSize, SHOT_SIZES, "medium"),
      cameraMove: oneOf(s.cameraMove, CAMERA_MOVES, "locked off"),
      subject: str(s.subject, 240),
      action: str(s.action, 240),
      location: str(s.location, 160),
      visualStory: str(s.visualStory, 300),
      onScreenText: str(s.onScreenText, 120),
      voiceover: str(s.voiceover, 300),
      transitionOut: oneOf(s.transitionOut, TRANSITIONS, "hard cut"),
      presenter: s.presenter === true,
    }))
    .filter((s: Scene) => s.subject && s.action);

  // Trimmed to length before anyone sees it, so the durations on the board are
  // the durations that would be shot.
  const cut = fitToTime(scenes);

  return {
    title: str(raw.title, 120) || `${intel.name} — ${COMMERCIAL_SECONDS}s`,
    logline: str(raw.logline, 300),
    angle: brief.angle,
    visualSystem: brief.visualSystem,
    music: str(raw.music, 300) || brief.musicDirection,
    totalSeconds: Math.round(cut.reduce((n, s) => n + s.seconds, 0) * 10) / 10,
    scenes: cut,
    endCard: { line: str(raw.endCardLine, 120), cta: str(raw.endCardCta, 80) },
  };
}

// --- Timing ----------------------------------------------------------------
//
// The model writes good shots and cannot add up. Boards came back at 32.5s and
// 33s with beats spilling past their windows, and the repair pass did not
// reliably fix it because the failure is arithmetic, not judgement — asking
// again just produces a different wrong total.
//
// Trimming a board to length is what an editor does to every commercial ever
// cut, so it is done here instead of being asked for. The proportions the
// director chose are preserved; only the absolute lengths move.

/**
 * Push `values` to sum to `target`, keeping each within [mins[i], max] and
 * holding their relative proportions as far as the clamps allow.
 *
 * The floor is per-element rather than shared because a shot carrying a line of
 * voiceover cannot be trimmed below the time it takes to say it.
 */
function distribute(values: number[], target: number, mins: number[], max: number): number[] {
  if (values.length === 0) return values;

  const sum = values.reduce((a, b) => a + b, 0);
  const scaled = sum > 0 ? values.map((v) => v * (target / sum)) : values.map(() => target / values.length);
  const out = scaled.map((v, i) => Math.min(max, Math.max(mins[i], v)));

  // Clamping breaks the total, so spread whatever is left over across the
  // scenes that still have room to take it.
  for (let pass = 0; pass < 24; pass++) {
    const diff = target - out.reduce((a, b) => a + b, 0);
    if (Math.abs(diff) < 0.05) break;
    const movable = out.map((v, i) => ((diff > 0 ? v < max - 0.01 : v > mins[i] + 0.01) ? i : -1)).filter((i) => i >= 0);
    if (movable.length === 0) break;
    const step = diff / movable.length;
    for (const i of movable) out[i] = Math.min(max, Math.max(mins[i], out[i] + step));
  }

  const rounded = out.map((v) => Math.round(v * 10) / 10);
  // Rounding can cost a tenth or two; put it on whichever scene can absorb it.
  const residue = Math.round((target - rounded.reduce((a, b) => a + b, 0)) * 10) / 10;
  if (Math.abs(residue) >= 0.1) {
    const i = rounded.findIndex((v, j) => (residue > 0 ? v + residue <= max : v + residue >= mins[j]));
    if (i >= 0) rounded[i] = Math.round((rounded[i] + residue) * 10) / 10;
  }
  return rounded;
}

/**
 * The shortest this shot can be. A silent shot only has to register; one with a
 * line has to last long enough for the line to be read at a natural pace.
 * Rounded up to a tenth so the validator, which recomputes the same budget,
 * cannot disagree with the fitter about whether the line fits.
 */
function floorFor(scene: Scene): number {
  const spoken = words(scene.voiceover).length / MAX_VO_WORDS_PER_SECOND;
  return Math.max(SHOT_SECONDS.min, Math.ceil(spoken * 10) / 10);
}

/**
 * Cut the board to exactly COMMERCIAL_SECONDS, with every beat inside its own
 * window. Beat targets are set first — a beat is a unit of story and must not
 * be squeezed to pay for another one — then each beat's shots are fitted to it.
 */
export function fitToTime(scenes: Scene[]): Scene[] {
  if (scenes.length === 0) return scenes;

  const groups = BEAT_ORDER.map((id) => ({ id, scenes: scenes.filter((s) => s.beat === id) })).filter((g) => g.scenes.length > 0);

  const current = groups.map((g) => g.scenes.reduce((n, s) => n + s.seconds, 0));
  // A beat cannot be shorter than the lines spoken inside it. Where that
  // exceeds the beat's window the board is genuinely over-written, the total
  // will overrun, and the validator says so — better than silently cutting a
  // sentence in half to make the arithmetic tidy.
  const mins = groups.map((g) => Math.max(beat(g.id).seconds[0], g.scenes.reduce((n, s) => n + floorFor(s), 0)));
  const maxes = groups.map((g, i) => Math.max(beat(g.id).seconds[1], mins[i]));

  // Start each beat inside its window, then share out the difference to 30s
  // across whatever headroom the windows leave.
  const targets = current.map((c, i) => Math.min(maxes[i], Math.max(mins[i], c)));
  for (let pass = 0; pass < 24; pass++) {
    const diff = COMMERCIAL_SECONDS - targets.reduce((a, b) => a + b, 0);
    if (Math.abs(diff) < 0.05) break;
    const room = targets.map((t, i) => (diff > 0 ? maxes[i] - t : t - mins[i]));
    const total = room.reduce((a, b) => a + b, 0);
    if (total < 0.05) break;
    for (let i = 0; i < targets.length; i++) targets[i] += diff * (room[i] / total);
  }

  const fitted = new Map<Scene, number>();
  groups.forEach((g, i) => {
    const seconds = distribute(
      g.scenes.map((s) => s.seconds),
      Math.round(targets[i] * 10) / 10,
      g.scenes.map((s) => floorFor(s)),
      // A shot never runs past the grammar's ceiling unless its own line needs
      // the room, in which case the line is what sets the length.
      Math.max(SHOT_SECONDS.max, ...g.scenes.map((s) => floorFor(s))),
    );
    g.scenes.forEach((s, j) => fitted.set(s, seconds[j]));
  });

  return scenes.map((s) => ({ ...s, seconds: fitted.get(s) ?? s.seconds }));
}

// --- Validation ------------------------------------------------------------

const WORD = /[\p{L}\p{N}']+/gu;

function words(text: string): string[] {
  return (text.toLowerCase().match(WORD) ?? []).filter((w) => w.length > 2);
}

/**
 * How much of the visual description is just the voiceover again. A shot whose
 * only stated purpose restates the line being spoken over it is the "narration
 * with clips attached" failure, and it is detectable without a model.
 */
function echoRatio(visualStory: string, voiceover: string): number {
  const vo = new Set(words(voiceover));
  if (vo.size === 0) return 0;
  const vis = words(visualStory);
  if (vis.length === 0) return 1;
  return vis.filter((w) => vo.has(w)).length / vis.length;
}

/** Words that assert something a business has to have actually earned. */
const CLAIM_WORDS =
  /\b(guarantee[ds]?|guaranteed|certified|accredited|licen[cs]ed|award[- ]?winning|awards?|rated|no\.?\s?1|number one|#1|best|leading|voted|trusted by|years? of experience|free\b)/i;

/**
 * Nothing may be asserted on screen that the source did not state. A digit or a
 * credential word in the spoken or burnt-in text has to be traceable to a
 * proven claim, or it is an invention with the customer's name on it.
 */
function unprovenClaims(scene: Scene, proven: string[]): string[] {
  const text = `${scene.voiceover} ${scene.onScreenText}`.trim();
  if (!text) return [];
  const provenText = proven.join(" ").toLowerCase();

  const out: string[] = [];

  const numbers = text.match(/\b\d[\d.,]*\s?(%|percent|years?|stars?|hours?|minutes?|days?)?/gi) ?? [];
  for (const n of numbers) {
    const bare = n.trim().toLowerCase();
    if (!provenText.includes(bare.replace(/\s+/g, " "))) {
      out.push(`claims "${bare}" but the source never stated it`);
    }
  }

  const credential = text.match(CLAIM_WORDS);
  if (credential && !provenText.includes(credential[0].toLowerCase())) {
    out.push(`asserts "${credential[0]}" but the source never stated it`);
  }

  return out;
}

/**
 * Every structural rule in the DNA, measured. Returns plain sentences because
 * the writer is handed them verbatim on the repair pass.
 */
export function validateStoryboard(board: Storyboard, intel: BusinessIntel, tried: Direction[] = []): string[] {
  const v: string[] = [];
  const scenes = board.scenes;

  if (scenes.length === 0) return ["the board has no scenes"];

  // --- the opening image
  //
  // Asking for a different first shot in the prompt was not enough: three
  // consecutive attempts on different arguments and different visual systems
  // all opened on a close-up with a slow push in, because that is the safest
  // opening and the model reaches for it every time. The first second is what
  // a viewer judges the whole film on, so an opening that has already been
  // tried and rejected is checked for rather than requested.
  const opening = `${scenes[0].shotSize} / ${scenes[0].cameraMove}`;
  if (tried.some((d) => d.openingShot === opening)) {
    v.push(`the film opens on a ${opening} again — a rejected attempt already opened on exactly that shot, so this one has to arrive differently`);
  } else if (tried.some((d) => d.openingShot.endsWith(`/ ${scenes[0].cameraMove}`))) {
    // Changing the shot size but keeping the move is how three "different"
    // attempts still all began with a slow push in. The move is what the first
    // second feels like, so it is checked on its own.
    v.push(`the film opens on a "${scenes[0].cameraMove}" again, as a rejected attempt did — the camera has to behave differently in the first second`);
  }

  // --- structure
  const present = new Set(scenes.map((s) => s.beat));
  for (const id of BEAT_ORDER) {
    if (!present.has(id)) v.push(`the ${beat(id).title} beat is missing entirely — ${beat(id).job}`);
  }

  const order = scenes.map((s) => BEAT_ORDER.indexOf(s.beat));
  for (let i = 1; i < order.length; i++) {
    if (order[i] < order[i - 1]) {
      v.push(`scene ${i + 1} goes back to the ${beat(scenes[i].beat).title} beat after moving past it — the five beats run in order`);
      break;
    }
  }

  // --- per-beat shot count and duration
  for (const id of BEAT_ORDER) {
    const inBeat = scenes.filter((s) => s.beat === id);
    if (inBeat.length === 0) continue;
    const spec = beat(id);
    if (inBeat.length < spec.shots[0] || inBeat.length > spec.shots[1]) {
      v.push(`the ${spec.title} beat is cut from ${inBeat.length} shot${inBeat.length === 1 ? "" : "s"}; it needs ${spec.shots[0]}-${spec.shots[1]}`);
    }
    const secs = inBeat.reduce((n, s) => n + s.seconds, 0);
    if (secs < spec.seconds[0] || secs > spec.seconds[1]) {
      v.push(`the ${spec.title} beat runs ${secs.toFixed(1)}s; it must run ${spec.seconds[0]}-${spec.seconds[1]}s`);
    }
    for (const s of inBeat) {
      if (!spec.moves.includes(s.cameraMove)) {
        v.push(`"${s.cameraMove}" does not serve the ${spec.title} beat — use one of: ${spec.moves.join(", ")}`);
      }
    }
  }

  // --- running time
  const total = scenes.reduce((n, s) => n + s.seconds, 0);
  if (Math.abs(total - COMMERCIAL_SECONDS) > 1.5) {
    v.push(`the board runs ${total.toFixed(1)}s; it must run ${COMMERCIAL_SECONDS}s`);
  }

  // --- shot grammar
  scenes.forEach((s, i) => {
    if (s.seconds < SHOT_SECONDS.min) v.push(`scene ${i + 1} holds ${s.seconds}s — nothing registers under ${SHOT_SECONDS.min}s`);
    if (s.seconds > SHOT_SECONDS.max) {
      // A shot only runs long because its line is long: the fitter will not
      // trim a shot below the time needed to speak it. Reporting the overrun
      // sends the writer to fix the shot, which cannot work — the words are
      // what has to give, and every knock-on beat overrun comes from here too.
      const needed = floorFor(s);
      v.push(
        needed > SHOT_SECONDS.max
          ? `scene ${i + 1} speaks ${words(s.voiceover).length} words, which needs ${needed}s to read — no shot may run past ${SHOT_SECONDS.max}s, so the line has to lose words`
          : `scene ${i + 1} holds ${s.seconds}s — the edit goes slack over ${SHOT_SECONDS.max}s`,
      );
    }
    if (i > 0 && s.shotSize === scenes[i - 1].shotSize) {
      v.push(`scenes ${i} and ${i + 1} are both "${s.shotSize}" — adjacent shots must differ in size or the cut reads as a mistake`);
    }
  });

  // --- the visual system's transition vocabulary
  const sys = visualSystem(board.visualSystem);
  if (sys) {
    scenes.forEach((s, i) => {
      // The last shot has nothing to transition into, so its value is moot.
      if (i < scenes.length - 1 && !sys.transitions.includes(s.transitionOut)) {
        v.push(`scene ${i + 1} transitions on a "${s.transitionOut}", which is not part of the ${sys.name} system (${sys.transitions.join(", ")})`);
      }
    });
  }

  // --- the presenter budget
  const presenterScenes = scenes.filter((s) => s.presenter);
  if (presenterScenes.length > AVATAR_BUDGET.maxScenes) {
    v.push(`${presenterScenes.length} scenes put a presenter on camera; at most ${AVATAR_BUDGET.maxScenes} may`);
  }
  const presenterSeconds = presenterScenes.reduce((n, s) => n + s.seconds, 0);
  if (total > 0 && presenterSeconds / total > AVATAR_BUDGET.maxShareOfDuration) {
    v.push(
      `the presenter holds ${Math.round((presenterSeconds / total) * 100)}% of the running time; the cap is ` +
        `${AVATAR_BUDGET.maxShareOfDuration * 100}% — the business, not the spokesperson, is the commercial`,
    );
  }
  for (const s of presenterScenes) {
    if (AVATAR_BUDGET.forbiddenBeats.includes(s.beat)) {
      v.push(`a presenter appears in the ${beat(s.beat).title} beat, where a talking head kills the beat's job`);
    }
  }

  // --- the muted test
  scenes.forEach((s, i) => {
    if (!s.visualStory) {
      v.push(`scene ${i + 1} says nothing with the sound off`);
      return;
    }
    if (s.voiceover && echoRatio(s.visualStory, s.voiceover) > 0.6) {
      v.push(`scene ${i + 1}'s picture only restates its voiceover — the shot has to add something the words do not`);
    }
  });

  const silent = scenes.filter((s) => !s.voiceover).length;
  if (silent < 2) {
    v.push(`only ${silent} scene${silent === 1 ? "" : "s"} play without narration; at least 2 must carry themselves on picture alone`);
  }

  // --- voiceover density
  scenes.forEach((s, i) => {
    const count = words(s.voiceover).length;
    const budget = Math.floor(s.seconds * MAX_VO_WORDS_PER_SECOND);
    if (count > budget) {
      v.push(`scene ${i + 1} speaks ${count} words in ${s.seconds}s — the read only fits ${budget}`);
    }
  });

  // --- honesty
  scenes.forEach((s, i) => {
    for (const claim of unprovenClaims(s, intel.provenClaims)) {
      v.push(`scene ${i + 1} ${claim}`);
    }
  });
  for (const claim of unprovenClaims(
    { ...scenes[0], voiceover: "", onScreenText: `${board.endCard.line} ${board.endCard.cta}` },
    intel.provenClaims,
  )) {
    v.push(`the end card ${claim}`);
  }

  // --- things no renderer here can actually produce
  //
  // A board that asks to see "the Pizza Pilgrims logo on a wooden peel" gets
  // exactly that: an image model that has never seen the real logo designs a
  // plausible one, and the commercial ships a fabricated identity for a
  // business that owns a real one. Nothing downstream can satisfy this, so it
  // is caught where it is written.
  const UNRENDERABLE = /\b(logo|brand mark|wordmark|emblem|signage|sign written|shop sign|banner|billboard|business card|menu board|chalkboard)\b/i;
  scenes.forEach((s, i) => {
    const hit = `${s.subject} ${s.action}`.match(UNRENDERABLE);
    if (hit) {
      v.push(
        `scene ${i + 1} asks to show a ${hit[0]}, which nothing here can render — it would be invented. ` +
          `Show the real thing the business does instead; the name and the call to action are typeset over the picture afterwards.`,
      );
    }
  });

  // --- the end card
  if (!board.endCard.cta) v.push("there is no call to action on the end card");

  return v;
}

/** The board as flat text, for the repair pass and the critic. */
export function boardAsText(board: Storyboard): string {
  return (
    `"${board.title}" — ${board.logline}\n` +
    `argument: ${board.angle} · visual system: ${board.visualSystem} · music: ${board.music}\n\n` +
    board.scenes
      .map(
        (s, i) =>
          `${i + 1}. [${beat(s.beat).title}] ${s.seconds}s · ${s.shotSize} · ${s.cameraMove}${s.presenter ? " · PRESENTER ON CAMERA" : ""}\n` +
          `   subject: ${s.subject}\n` +
          `   action: ${s.action}\n` +
          `   location: ${s.location}\n` +
          `   with the sound off: ${s.visualStory}\n` +
          (s.onScreenText ? `   on screen: "${s.onScreenText}"\n` : "") +
          (s.voiceover ? `   voiceover: "${s.voiceover}"\n` : `   voiceover: (silent)\n`) +
          `   out on: ${s.transitionOut}`,
      )
      .join("\n") +
    `\n\nEND CARD: ${board.endCard.line} — ${board.endCard.cta}`
  );
}
