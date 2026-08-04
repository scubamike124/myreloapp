/**
 * MyReelo Avatar Director — mirrors Amber video-qos/avatar-director.
 * Rotates Premium presenters; never sticky-defaults to one host.
 */
import roster from "@/data/reelo-brand-avatars.json";
import { assertReeloAvatarEligible, listApprovedReeloAvatars } from "@/lib/reelo-avatar-eligibility";

type RosterAvatar = {
  avatarId: string;
  name?: string;
  gender?: string;
  archetype?: string;
  environment?: string;
  defaultVoiceId?: string;
  tier?: "premium" | "regular";
  preferredForAds?: boolean;
  primaryDefault?: boolean;
  industries?: string[];
  tones?: string[];
  qualityScores?: Record<string, number>;
  allowedVideoTypes?: string[];
};

const recentMemory: string[] = [];

function tierOf(a: RosterAvatar): "premium" | "regular" {
  if (a.tier === "premium" || a.tier === "regular") return a.tier;
  return a.preferredForAds ? "premium" : "regular";
}

function baseQuality(a: RosterAvatar): number {
  const q = a.qualityScores;
  if (!q) return a.preferredForAds ? 8.2 : 7.4;
  const keys = [
    "realism",
    "lipSync",
    "eyeContact",
    "bodyMovement",
    "clothing",
    "professionalism",
    "cameraPresence",
    "businessSuitability",
  ];
  return keys.reduce((s, k) => s + (q[k] ?? 7), 0) / keys.length;
}

function fitBoost(a: RosterAvatar, industry: string, tone: string, audience: string): number {
  let boost = 0;
  const hay = `${a.archetype} ${a.environment} ${(a.industries || []).join(" ")}`.toLowerCase();
  const ind = industry.toLowerCase();
  if (ind && (a.industries || []).some((i) => ind.includes(i) || i.includes(ind.split(/[\s/-]/)[0]!))) boost += 1.2;
  if (/medical|health/.test(ind) && /amelia|train|caroline/i.test(hay)) boost += 1.3;
  if (/restaurant|food/.test(ind) && /annie|blanka|casual/i.test(hay)) boost += 1.0;
  if (/real.?estate/.test(ind) && /caroline|blanka|executive/i.test(hay)) boost += 1.2;
  if (/auto|corporate|b2b|finance/.test(ind) && /brandon|armando|suit/i.test(hay)) boost += 1.4;
  if (/saas|tech|marketing/.test(ind) && /annie|caroline|marketing/i.test(hay)) boost += 1.0;
  if (/trust|calm/.test(tone) && /amelia|caroline/i.test(hay)) boost += 0.8;
  if (/premium|luxury|cinematic/.test(tone) && /suit|blanka|armando|brandon/i.test(hay)) boost += 1.0;
  if (/founder|executive/.test(audience) && /brandon|armando/i.test(hay)) boost += 0.9;
  if (a.primaryDefault) boost -= 0.45;
  return boost;
}

export function directReeloAvatar(opts: {
  videoType: string;
  industry?: string;
  tone?: string;
  audience?: string;
  overrideAvatarId?: string | null;
}): {
  avatarId: string;
  voiceId: string;
  tier: "premium" | "regular";
  reason: string;
  name: string;
} {
  if (opts.overrideAvatarId) {
    const el = assertReeloAvatarEligible(opts.overrideAvatarId);
    recentMemory.push(el.avatarId);
    return {
      avatarId: el.avatarId,
      voiceId: el.voiceId,
      tier: tierOf(el.avatar as RosterAvatar),
      reason: "User override (eligible)",
      name: (el.avatar as RosterAvatar).name || el.avatarId,
    };
  }

  const industry = opts.industry || "";
  const tone = opts.tone || "";
  const audience = opts.audience || "";
  const pool = listApprovedReeloAvatars().filter((a) => {
    const types = (a as RosterAvatar).allowedVideoTypes || [];
    return !types.length || types.includes(opts.videoType);
  }) as RosterAvatar[];

  const premium = pool.filter((a) => tierOf(a) === "premium");
  const candidates = premium.length ? premium : pool;

  const ranked = candidates
    .map((a) => {
      let score = baseQuality(a) + fitBoost(a, industry, tone, audience) + (tierOf(a) === "premium" ? 1.1 : 0);
      const idx = recentMemory.lastIndexOf(a.avatarId);
      if (idx >= 0) score -= Math.max(0, 2.8 - (recentMemory.length - 1 - idx) * 0.35);
      return { a, score };
    })
    .sort((x, y) => y.score - x.score);

  const top = ranked.slice(0, Math.min(3, ranked.length));
  if (!top.length) throw new Error("AVATAR_DIRECTOR_EMPTY");
  const pick = top[Math.floor(Math.random() * top.length)]!;
  recentMemory.push(pick.a.avatarId);
  while (recentMemory.length > 8) recentMemory.shift();

  return {
    avatarId: pick.a.avatarId,
    voiceId: pick.a.defaultVoiceId || "",
    tier: tierOf(pick.a),
    reason: `Avatar Director: ${tierOf(pick.a)} · score ${pick.score.toFixed(2)}`,
    name: pick.a.name || pick.a.avatarId,
  };
}

export function listDirectorTiers() {
  const all = listApprovedReeloAvatars() as RosterAvatar[];
  return {
    version: (roster as { version?: number }).version,
    premium: all.filter((a) => tierOf(a) === "premium").map((a) => ({ avatarId: a.avatarId, name: a.name })),
    regular: all.filter((a) => tierOf(a) === "regular").map((a) => ({ avatarId: a.avatarId, name: a.name })),
  };
}
