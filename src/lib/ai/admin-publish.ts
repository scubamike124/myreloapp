// ---------------------------------------------------------------------------
// Real, immediate publish for the Command Center — dispatches to the
// connected platform's own publish() (src/lib/social/*.ts) using the real
// token stored by the OAuth callback (src/lib/social/store.ts). Never
// simulates success: no connected account, no attempt — an honest error
// instead, same shape as check_social_accounts/schedule_post.
// ---------------------------------------------------------------------------

import { ensureAdminSystemUser } from "@/lib/ai/admin-account";
import { getSocialAccount } from "@/lib/social/store";
import * as youtube from "@/lib/social/youtube";
import * as meta from "@/lib/social/meta";
import * as tiktok from "@/lib/social/tiktok";
import * as x from "@/lib/social/x";
import { amberYoutubeBridgeConfigured, getBridgedYoutubeAccessToken } from "@/lib/amber/youtube-bridge";

export type PublishArgs = { platform: string; mediaUrl: string; caption: string };
export type PublishOutcome = { ok: true; postUrl: string; platformId: string; note?: string } | { ok: false; error: string };

const CONNECT_HINT = "Not connected — open Business Center → Social (or the Command Center's connect link) and connect this platform first.";

export async function publishToPlatform(args: PublishArgs): Promise<PublishOutcome> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };

  const account = await getSocialAccount(userId, args.platform);

  // No dedicated Reelo OAuth connection for YouTube — fall back to Amber's
  // shared channel rather than failing outright, exactly the case the bridge
  // exists for. Every other platform, and YouTube once an org connects its
  // own channel, is completely unaffected by this branch.
  if (!account && args.platform === "youtube" && amberYoutubeBridgeConfigured()) {
    try {
      const { accessToken } = await getBridgedYoutubeAccessToken();
      const result = await youtube.publish(accessToken, { mediaUrl: args.mediaUrl, caption: args.caption });
      return result.ok ? { ...result, note: "Published via Amber's shared YouTube channel — no dedicated Reelo connection for this org." } : result;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Amber's shared YouTube channel is unavailable." };
    }
  }

  if (!account) return { ok: false, error: `${CONNECT_HINT} (platform: ${args.platform})` };

  try {
    switch (args.platform) {
      case "youtube": {
        let token = account.accessToken;
        // Google access tokens expire hourly — refresh proactively rather
        // than publish, fail, and make the model retry blind.
        if (account.expiresAt && new Date(account.expiresAt).getTime() < Date.now() + 60_000 && account.refreshToken) {
          token = await youtube.refreshAccessToken(account.refreshToken);
        }
        return await youtube.publish(token, { mediaUrl: args.mediaUrl, caption: args.caption });
      }
      case "facebook":
        return await meta.publishFacebook(account.accessToken, account.externalId ?? "", { mediaUrl: args.mediaUrl, caption: args.caption });
      case "instagram":
        return await meta.publishInstagram(account.accessToken, account.externalId ?? "", { mediaUrl: args.mediaUrl, caption: args.caption });
      case "tiktok":
        return await tiktok.publish(account.accessToken, { mediaUrl: args.mediaUrl, caption: args.caption });
      case "x":
        return await x.publish(account.accessToken, { mediaUrl: args.mediaUrl, caption: args.caption });
      default:
        return { ok: false, error: `Unsupported platform: ${args.platform}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The platform call failed." };
  }
}
