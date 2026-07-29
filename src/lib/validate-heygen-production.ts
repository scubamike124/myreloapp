/**
 * Pre-render production gate for MyReelo HeyGen submissions.
 * Mirrors Amber VQOS validateVideoPlan rules that must run before paid generate.
 * Canonical roster: src/data/reelo-brand-avatars.json (synced from Amber).
 */
import roster from "@/data/reelo-brand-avatars.json";
import { assertReeloAvatarEligible, isDeskOrSofaAvatar, isPatternBanned } from "@/lib/reelo-avatar-eligibility";

export const VIDEO_TYPES = [
  "product_demo",
  "social_short",
  "training",
  "homepage_hero",
  "premium_custom",
  "tv_commercial",
] as const;

export type ReeloVideoType = (typeof VIDEO_TYPES)[number];

export type HeygenProductionSubmission = {
  videoType?: string;
  avatarId?: string | null;
  engine?: string;
  estimatedCostUsd?: number;
  maximumAuthorizedCostUsd?: number;
  premiumUpgradeAllowed?: boolean;
  aspectRatio?: string;
  platform?: string;
  script?: string;
};

type RosterFile = {
  version: number;
  hardCostCeilingUsd?: number;
  premiumEnginesRequireWaiver?: string[];
};

const data = roster as RosterFile;
const PREMIUM = data.premiumEnginesRequireWaiver || [
  "cinematic_avatar",
  "avatar_iv",
  "veo_quality",
  "video_agent",
];

export function validateHeygenProductionSubmission(sub: HeygenProductionSubmission): {
  ok: boolean;
  failures: string[];
  avatarId?: string;
  voiceId?: string;
  videoType: ReeloVideoType;
} {
  const failures: string[] = [];
  const rawType = (sub.videoType || "social_short").trim();
  if (!(VIDEO_TYPES as readonly string[]).includes(rawType)) {
    failures.push(`INVALID_VIDEO_TYPE: ${rawType || "missing"}`);
    return { ok: false, failures, videoType: "social_short" };
  }
  const videoType = rawType as ReeloVideoType;

  let avatarId: string | undefined;
  let voiceId: string | undefined;
  try {
    const el = assertReeloAvatarEligible(sub.avatarId);
    avatarId = el.avatarId;
    voiceId = el.voiceId;
  } catch (e) {
    failures.push(e instanceof Error ? e.message : "Avatar ineligible");
  }

  if (sub.avatarId && (isPatternBanned(sub.avatarId) || isDeskOrSofaAvatar(sub.avatarId))) {
    failures.push(`AVATAR_BANNED: ${sub.avatarId}`);
  }

  const engine = (sub.engine || "avatar_iii").trim();
  if (PREMIUM.includes(engine) && !sub.premiumUpgradeAllowed) {
    failures.push(`PREMIUM_ENGINE_REQUIRES_OWNER_APPROVAL: ${engine}`);
  }

  const ceiling = Math.min(
    sub.maximumAuthorizedCostUsd ?? data.hardCostCeilingUsd ?? 0.5,
    data.hardCostCeilingUsd ?? 0.5,
  );
  if (
    typeof sub.estimatedCostUsd === "number" &&
    sub.estimatedCostUsd > ceiling &&
    !sub.premiumUpgradeAllowed
  ) {
    failures.push(`COST_CEILING: estimated $${sub.estimatedCostUsd} > $${ceiling}`);
  }

  if (videoType === "social_short" || videoType === "product_demo") {
    const ar = sub.aspectRatio || (sub.platform === "tiktok" ? "9:16" : undefined);
    // Website commercial may be 16:9; avatar studio defaults often 16:9 — warn via failure only when explicit wrong
    if (ar && ar !== "9:16" && ar !== "16:9" && ar !== "1:1") {
      failures.push(`ASPECT_RATIO_INVALID: ${ar}`);
    }
  }

  if (!sub.script?.trim() && (videoType === "product_demo" || videoType === "training")) {
    failures.push("SCRIPT_REQUIRED");
  }

  return {
    ok: failures.length === 0,
    failures,
    avatarId,
    voiceId,
    videoType,
  };
}
