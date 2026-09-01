export type SocialProvider = "tiktok" | "instagram" | "youtube" | "facebook";

export const SOCIAL_PROVIDERS: SocialProvider[] = ["tiktok", "instagram", "youtube", "facebook"];

export type ProviderConfig = {
  id: SocialProvider;
  label: string;
  /** Secrets required before OAuth start works. */
  requiredEnv: string[];
  future?: boolean;
};

export const PROVIDER_META: Record<SocialProvider, ProviderConfig> = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    requiredEnv: ["META_APP_ID", "META_APP_SECRET"],
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    requiredEnv: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    requiredEnv: ["META_APP_ID", "META_APP_SECRET"],
    future: true,
  },
};

/** Resolve YouTube/Google OAuth client from Amber vault names or Reelo aliases. */
export function youtubeClientId(): string {
  return (
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.YOUTUBE_CLIENT_ID?.trim() ||
    ""
  );
}

export function youtubeClientSecret(): string {
  return (
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.YOUTUBE_CLIENT_SECRET?.trim() ||
    ""
  );
}

export function providerSecretsReady(provider: SocialProvider): boolean {
  const meta = PROVIDER_META[provider];
  if (meta.future) return false;
  if (provider === "youtube") return Boolean(youtubeClientId() && youtubeClientSecret());
  return meta.requiredEnv.every((k) => Boolean(process.env[k]?.trim()));
}

export function appBaseUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.CF_PAGES_URL ? `https://${process.env.CF_PAGES_URL}` : "") ||
    "https://www.myreelo.com";
  return u.replace(/\/$/, "");
}

export function oauthCallbackUrl(provider: SocialProvider): string {
  return `${appBaseUrl()}/api/oauth/${provider}/callback`;
}

export type PublicSocialAccount = {
  id: string;
  provider: SocialProvider;
  externalId: string;
  handle: string;
  displayName: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

export type PublishAdapterResult =
  | { ok: true; externalPostId: string; message: string }
  | { ok: false; error: string; code: "keys_needed" | "no_token" | "not_implemented" | "api_error" };
