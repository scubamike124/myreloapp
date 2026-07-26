import type { PublishAdapterResult, SocialProvider } from "@/lib/social/providers";
import { providerSecretsReady } from "@/lib/social/providers";

export type PublishInput = {
  provider: SocialProvider;
  accessToken: string;
  mediaUrl: string;
  caption: string;
  title?: string;
  handle?: string;
};

/**
 * Platform publish adapters. Real HTTP calls land here when each provider's
 * upload API is fully wired; until then we refuse honestly (never fake Posted).
 */
export async function publishToProvider(input: PublishInput): Promise<PublishAdapterResult> {
  if (!providerSecretsReady(input.provider)) {
    return {
      ok: false,
      code: "keys_needed",
      error: `${input.provider} developer credentials are not configured on the server.`,
    };
  }
  if (!input.accessToken) {
    return { ok: false, code: "no_token", error: "No OAuth access token for this account." };
  }
  if (!input.mediaUrl) {
    return { ok: false, code: "api_error", error: "No media URL to publish." };
  }

  switch (input.provider) {
    case "tiktok":
      return publishTikTok(input);
    case "instagram":
      return publishInstagram(input);
    case "youtube":
      return publishYouTube(input);
    case "facebook":
      return {
        ok: false,
        code: "not_implemented",
        error: "Facebook publishing is reserved for a future release.",
      };
    default:
      return { ok: false, code: "not_implemented", error: "Unknown provider." };
  }
}

async function publishTikTok(input: PublishInput): Promise<PublishAdapterResult> {
  // TikTok Content Posting API requires app review + video upload init.
  // Architecture is ready; refuse until upload endpoints are enabled with live keys.
  void input;
  return {
    ok: false,
    code: "not_implemented",
    error:
      "TikTok OAuth can connect accounts. Direct publish needs TikTok Content Posting API approval — not enabled yet. Item stays scheduled; use Export meanwhile.",
  };
}

async function publishInstagram(input: PublishInput): Promise<PublishAdapterResult> {
  void input;
  return {
    ok: false,
    code: "not_implemented",
    error:
      "Instagram OAuth can connect accounts. Reels publish via Graph API is not enabled yet. Item stays scheduled; use Export meanwhile.",
  };
}

async function publishYouTube(input: PublishInput): Promise<PublishAdapterResult> {
  void input;
  return {
    ok: false,
    code: "not_implemented",
    error:
      "YouTube OAuth can connect channels. Shorts upload via YouTube Data API is not enabled yet. Item stays scheduled; use Export meanwhile.",
  };
}
