/**
 * Reelo brand avatar eligibility — mirrors Amber VQOS registry.
 * Canonical source: Amber `src/data/video-standards/reelo-brand-avatars.json`
 * Synced copy: `src/data/reelo-brand-avatars.json` (this app).
 */
import roster from "@/data/reelo-brand-avatars.json";

type RosterAvatar = {
  avatarId: string;
  id?: string;
  name?: string;
  allowedEngines?: string[];
  allowedVideoTypes?: string[];
  brands?: string[];
  defaultVoiceId?: string;
  primaryDefault?: boolean;
};

type RosterFile = {
  version: number;
  bannedAvatarIdPatterns: string[];
  bannedNameKeywords: string[];
  avatars: RosterAvatar[];
  premiumEnginesRequireWaiver?: string[];
};

const data = roster as RosterFile;

export const DEFAULT_REELO_AVATAR_ID = "Annie_Business_Casual_Standing_Front_2_public";
export const DEFAULT_REELO_VOICE_ID = "4754e1ec667544b0bd18cdf4bec7d6a7"; // Brittney

export function isPatternBanned(avatarId: string, name = ""): boolean {
  const hay = `${avatarId} ${name}`;
  if (data.bannedAvatarIdPatterns.some((p) => hay.includes(p))) return true;
  const lower = hay.toLowerCase();
  return data.bannedNameKeywords.some((k) => lower.includes(k.toLowerCase()));
}

export function isDeskOrSofaAvatar(avatarId: string, name = ""): boolean {
  const hay = `${avatarId} ${name}`.toLowerCase();
  return (
    /sofa|lounge|couch|sitting_sofa|suitsofa|standing_office|desk/.test(hay) ||
    isPatternBanned(avatarId, name)
  );
}

export function assertReeloAvatarEligible(avatarId: string | null | undefined): {
  avatarId: string;
  voiceId: string;
  avatar: RosterAvatar;
} {
  const id = (avatarId || "").trim();
  if (!id) {
    throw new Error(
      "AVATAR_REQUIRED: no silent fallback. Pass an approved standing roster avatarId.",
    );
  }
  if (isPatternBanned(id) || isDeskOrSofaAvatar(id)) {
    throw new Error(
      `AVATAR_BANNED: ${id} is banned (desk/sofa/Abigail defaults). Use reelo-brand-avatars.json standing hosts only.`,
    );
  }
  const avatar = data.avatars.find((a) => a.avatarId === id || a.id === id);
  if (!avatar) {
    throw new Error(
      `AVATAR_NOT_IN_REGISTRY: ${id} is not in reelo-brand-avatars.json — random catalog picks are not allowed.`,
    );
  }
  return {
    avatarId: avatar.avatarId,
    voiceId: avatar.defaultVoiceId || DEFAULT_REELO_VOICE_ID,
    avatar,
  };
}

export function listApprovedReeloAvatars(): RosterAvatar[] {
  return data.avatars;
}

export function defaultApprovedAvatar(): RosterAvatar {
  return (
    data.avatars.find((a) => a.primaryDefault) ||
    data.avatars.find((a) => a.avatarId === DEFAULT_REELO_AVATAR_ID) ||
    data.avatars[0]!
  );
}
