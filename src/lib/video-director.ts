/**
 * MyReelo Video Director — mirrors Amber video-qos/video-director.
 */
export type DirectorTemplate = {
  id: string;
  styles: string[];
  videoType: string;
  industries: string[];
  musicMood: string;
  captionStyle: string;
  sceneBlueprint: Array<{ id: string; startSec: number; endSec: number; role: string }>;
};

export type DirectedScene = {
  id: string;
  startSec: number;
  endSec: number;
  description: string;
  role: string;
  camera: string;
  transitionIn: string;
  subtitleBeat: string;
};

export type VideoDirection = {
  hookSec: number;
  ctaStartSec: number;
  ctaEndSec: number;
  pacing: "punchy" | "steady" | "cinematic" | "calm";
  emotionalArc: string[];
  transitions: string;
  cameraNotes: string[];
  brollPlacement: Array<{ afterSceneId: string; note: string }>;
  music: {
    mood: string;
    duckUnderVo: boolean;
    swellOnCta: boolean;
    bedLevel: "low" | "medium";
  };
  captions: {
    style: string;
    safeZone: "bottom-center" | "center";
    wordsPerChunk: number;
    emphasizeHook: boolean;
    emphasizeCta: boolean;
  };
  branding: {
    endCardSec: number;
    logoMoments: string[];
    colorCue: string;
  };
  scenes: DirectedScene[];
  directorNotes: string[];
};

function pacingFor(template: DirectorTemplate, tone?: string): VideoDirection["pacing"] {
  const style = `${template.styles.join(" ")} ${tone || ""}`.toLowerCase();
  if (/cinematic|premium|luxury/.test(style) || template.videoType === "tv_commercial") return "cinematic";
  if (/medical|calm|trust|care/.test(style) || template.id === "medical") return "calm";
  if (/social|sale|punchy|urgent/.test(style) || template.videoType === "social_short") return "punchy";
  return "steady";
}

function cameraForRole(role: string, pacing: VideoDirection["pacing"]): string {
  const r = role.toLowerCase();
  if (r.includes("hook")) {
    return pacing === "cinematic"
      ? "slow push-in, medium close-up, hold eye line"
      : "snap medium close-up, slight push, lock eyes in first 1s";
  }
  if (r.includes("proof") || r.includes("product") || r.includes("action") || r.includes("ui") || r.includes("reveal")) {
    return "cut to product/UI insert or over-shoulder; avoid desk framing; keep product readable";
  }
  if (r.includes("desire") || r.includes("story")) {
    return "wider establishing then gentle push; emotional beat before proof";
  }
  if (r.includes("cta") || r.includes("end")) {
    return "return to presenter medium shot; end card hold last 1.5–2s; no abrupt cut-off";
  }
  return "stable medium shot, natural micro-movement, professional presence";
}

function transitionFor(role: string, pacing: VideoDirection["pacing"]): string {
  if (pacing === "punchy") return role.includes("hook") ? "hard cut" : "hard cut or whip";
  if (pacing === "cinematic") return "soft dissolve or match cut";
  if (pacing === "calm") return "gentle dissolve";
  return "clean cut";
}

export function directVideo(input: {
  template: DirectorTemplate;
  durationSec: number;
  product: string;
  audience: string;
  tone?: string;
  industry?: string;
  brandColors?: string[];
}): VideoDirection {
  const { template, durationSec, product, audience } = input;
  const pacing = pacingFor(template, input.tone);
  const last = template.sceneBlueprint[template.sceneBlueprint.length - 1];
  const scale = durationSec / (last?.endSec || durationSec);
  const hookEnd = Math.min(4, Math.max(2.5, (template.sceneBlueprint.find((s) => /hook/i.test(s.role))?.endSec || 3) * scale));
  const ctaScene = [...template.sceneBlueprint].reverse().find((s) => /cta|end/i.test(s.role));
  const ctaStartSec = ctaScene ? Math.round(ctaScene.startSec * scale * 10) / 10 : Math.max(0, durationSec - 4);

  const scenes = template.sceneBlueprint.map((s) => {
    const role = s.role;
    return {
      id: s.id,
      startSec: Math.round(s.startSec * scale * 10) / 10,
      endSec: Math.round(s.endSec * scale * 10) / 10,
      description: `${role}: ${product}`,
      role,
      camera: cameraForRole(role, pacing),
      transitionIn: transitionFor(role, pacing),
      subtitleBeat: /hook/i.test(role)
        ? "large hook line, 3–6 words max"
        : /cta|end/i.test(role)
          ? "CTA phrase + brand — high contrast"
          : "VO-synced chunks, safe-zone bottom",
    };
  });

  const musicMood =
    template.musicMood ||
    (pacing === "cinematic" ? "cinematic" : pacing === "punchy" ? "upbeat-bed" : pacing === "calm" ? "soft-ambient" : "low-bed");

  const broll: VideoDirection["brollPlacement"] = [];
  for (const s of scenes) {
    if (/proof|product|action|reveal|ui/i.test(s.role)) {
      broll.push({
        afterSceneId: s.id,
        note: `Insert real ${product} proof / UI / b-roll for ${audience}; never fake stock UI`,
      });
    }
  }

  return {
    hookSec: Math.round(hookEnd * 10) / 10,
    ctaStartSec,
    ctaEndSec: durationSec,
    pacing,
    emotionalArc:
      pacing === "cinematic"
        ? ["intrigue", "desire", "proof", "resolve", "cta"]
        : pacing === "punchy"
          ? ["interrupt", "payoff", "cta"]
          : pacing === "calm"
            ? ["reassure", "clarify", "trust", "cta"]
            : ["hook", "explain", "prove", "cta"],
    transitions: pacing === "punchy" ? "hard cuts; one whip max" : pacing === "cinematic" ? "match cuts + soft dissolves" : "clean cuts",
    cameraNotes: scenes.map((s) => `${s.id}: ${s.camera}`),
    brollPlacement: broll,
    music: { mood: musicMood, duckUnderVo: true, swellOnCta: true, bedLevel: pacing === "cinematic" ? "medium" : "low" },
    captions: {
      style: template.captionStyle || "burned-safe-zone",
      safeZone: "bottom-center",
      wordsPerChunk: pacing === "punchy" ? 4 : 6,
      emphasizeHook: true,
      emphasizeCta: true,
    },
    branding: {
      endCardSec: Math.min(3, Math.max(1.5, durationSec - ctaStartSec)),
      logoMoments: ["open-1s-optional", "cta-end-card"],
      colorCue: input.brandColors?.[0] || "brand accent",
    },
    scenes,
    directorNotes: [
      `Hook locked in first ${Math.round(hookEnd * 10) / 10}s`,
      `CTA window ${ctaStartSec}s–${durationSec}s`,
      `Pacing: ${pacing} · music: ${musicMood}`,
      "VQOS still required before publishAuthorized",
    ],
  };
}
