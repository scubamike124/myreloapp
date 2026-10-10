# Owner-owned business channels: what is connected for organic posting

Sprint workstream 8 (ads), checked 2026-10-10 between about 17:00Z and 17:30Z. Read-only: nothing was published, no publish job was enqueued, no social API was called, and nothing in production was changed. Production's database was not read; this session has no credentials for it. Code references are to branch `claude/ten-offers-pilots` at `e31d9e2` (worktree `/home/user/wt-offers`).

## Conclusion

1. **No owner-owned business channel is verified as connected for organic posting.** Nothing we can read (code, docs, git history, issue #105) shows an Amber One AI business page (Facebook, LinkedIn, X, Threads, Bluesky, Instagram) connected to Amber. The only real social posts on record are four TikTok videos to @launchreadyai (the Launch Ready brand, not Amber One AI) on 2026-08-01, made through TikTok Studio by a browser runner, not by the API pipeline.
2. **Even a connected page could not take a text post with a link today.** The publish pipeline only publishes MP4 video, end to end.
3. **So none of the ten posts can be published through Amber's pipeline in this sprint** without an owner step (connect a business page in HQ) and a code change (a text-post path). The smallest safe path is at the end of this file.
4. **Do not enqueue anything to test this.** In production, any `SCHEDULED` publish job is picked up by the next supervisor tick on amber-os-worker: for a connected account, enqueueing a job publishes it; for an unconnected one, it files an owner-action repair task.

## Verified facts

### What the code supports

Ten platforms have an adapter (`src/lib/integrations/social/registry.ts:14-25`; Prisma enum `Platform`, `prisma/schema.prisma:50-61`). There is no adapter for Bluesky, Mastodon or Reddit. Several adapters declare `text` in their capabilities, but each `publish()` sends video:

| Platform | What `publish()` actually sends | Text post with a link? | Posts as |
|---|---|---|---|
| Facebook | A Reel, uploaded to `/{page}/video_reels` (`providers/meta.ts:313`, `339`, `388`); needs the local MP4 | No | The first Page the login returns (`meta.ts:100`) |
| Instagram | A Reel: `media_type: "REELS"` with a public video URL (`meta.ts:197`, `203`, `225`) | No | Instagram professional account |
| Threads | `media_type: "VIDEO"` (`meta.ts:425`, `452`); declares `text` (`meta.ts:702`) but returns OWNER_ACTION_REQUIRED without a video URL | No | User |
| LinkedIn | A video through the Videos API; "LinkedIn needs the local MP4 for chunked upload." (`providers/others.ts:458`); declares `text` (`others.ts:390`) | No | A member profile, `urn:li:person` (`others.ts:474`, `540`), scope `w_member_social` (`others.ts:397`): not a company page |
| X | Chunked video upload; "X needs the local MP4 for chunked media upload." (`others.ts:688`); declares `text` (`others.ts:609`) | No | User |
| YouTube | A Short; needs the local MP4 (`others.ts:274`) | No | Channel |
| Pinterest | A video Pin; needs a board and a public video URL (`others.ts:888`) | No | Board |
| Google Business Profile | `localPosts` with `mediaFormat: "VIDEO"` (`others.ts:1053`, `1074`) | No | Location |
| Nextdoor | `body_text` with optional media (`others.ts:1223`): the one adapter that could send text, but the orchestrator rejects it before `publish()` (next table), it needs partner Publish API access (returns NEEDS_APP_REVIEW on 401/403, `others.ts:1233`), and it has no `verifyPublication` | Not reachable | Business profile |
| TikTok | Video only; "No video file was attached." (`providers/tiktok.ts:220`) | No | Creator account |

The orchestrator and the approval path are video-only too:

| Step | Fact |
|---|---|
| Job creation | `createApprovalBatchAndJobs` requires `localMediaPath`, hashes the file and stages it as `video/mp4` (`orchestrator.ts:40`, `51`, `78-79`) |
| Before every publish | `validatePublishMedia` throws for any adapter without `video` in its media and for any job with no media (`orchestrator.ts:630-639`), called before every publish attempt (`orchestrator.ts:837`) |
| The publish call | `executePublishJob` always passes `kind: "video"`, `mimeType: "video/mp4"` (`orchestrator.ts:972-979`) |
| Owner approval API | `/api/social/approve` accepts only an `.mp4` inside `.data/commercial`, `.data/social-media` or `public/amber-social-library` (`approval-policy.ts:8-24`, `src/app/api/social/approve/route.ts:43`) and defaults the brand to `launchready` (`route.ts:61`) |
| Business picture ads (Instagram, Nextdoor; supervisor stage 12) | Never call a provider: a due post becomes `QUEUED` behind an approval request (`src/lib/business-ads/index.ts:418-460`); nothing in the tree turns that approval into a publish |
| Advertising Command Center | `postOrganicContent` (`src/lib/advertising/posting.ts:28-66`) also requires `localMediaPath` and has no caller |

### Where the publish worker runs

- Supervisor stage 13 drains the publish queue on every tick, up to 5 jobs (`src/lib/supervisor/index.ts:831-859`). amber-os-worker runs the supervisor tick each cycle (`scripts/cloud-os-worker.ts:297-301`), and the #105 worker beacon (comment 5737077514) shows supervisor ticks completing (last at 2026-10-10T16:57:52Z). The beacon does not report what stage 13 did.
- The worker claims any job in `SCHEDULED`, `RETRYING` or `PROCESSING` that is due (`orchestrator.ts:315-327`), paced per account (`post-pacing.ts:29-40`: LinkedIn 60 min, Facebook 20, Threads 30, X 15).

### What "connected" means, and how to see it

- One `SocialAccount` row per organization, platform and brand key (`prisma/schema.prisma:492-512`). Brand keys in use: dayli, myreelo, restpilot, launchready, datewise, default (`src/lib/social-runtime.ts:22-28`). There is a TikTok brand spec for AmberOne (`businessKey: "amberone"`, YouTube channel `UCjH2Jx_JdCu52XV5L9bNd1Q`, preferred TikTok handle `amberoneai`) in `src/lib/integrations/tiktok/brand-accounts.ts:212-242`: a plan, not proof of a connection.
- It counts as CONNECTED only when `tokenEncrypted` decrypts to a token that is not expired (or has a refresh token), no scopes are missing, and the status is not NEEDS_APP_REVIEW, EXPIRED or ERROR (`social-runtime.ts:40-79`). App keys alone never count (`docs/SOCIAL_PUBLISHING.md:3`).
- The row becomes CONNECTED only when the owner finishes Connect in HQ: `/dashboard/social-publish`, the provider's login, then `/api/social/oauth/callback/<platform>` (`src/lib/integrations/social/oauth.ts:232-267`).
- To see it: `scripts/inspect-instagram-social.ts` reads `amber_hq."SocialAccount"` with production credentials taken from `railway variables --service amber-hq-web` (lines 17-29, 94-111). A connected account shows status CONNECTED, a token length above 0, a handle, and `connectedAt` and scopes in its metadata.

### Evidence of connected accounts or successful publishes

| Evidence | What it shows |
|---|---|
| Commits `6c799e5` (2026-08-02 00:02Z) and `602fe0e` (2026-08-02 08:08Z) | Four TikTok videos went to @launchreadyai on 2026-08-01. The first went public; the others were held "Only me / Content under review" for a while. Launch Ready brand, video only. |
| Commits `52f8aa8`, `d8ad8da`, `6c799e5` | Those posts were made by `scripts/tiktok-upload-run.ts`, which drives TikTok Studio in a signed-in local Chrome, not by the TikTok API adapter |
| `docs/evidence/tiktok-live-gate.md` (2026-08-01) | Production TikTok "NOT LIVE_VERIFIED"; blocker: "Finish TikTok Login Kit once per brand so `tokenEncrypted` is set" (lines 4, 20-21) |
| `docs/evidence/social-adapters-live-gate.md` (2026-08-01) | Every other adapter "LIVE_VERIFIED canaries pending" (line 4) |
| `src/lib/marketing-os/index.ts:25-38` | Still lists only Instagram and Nextdoor as initial, everything else as future: "promote only after LIVE_VERIFIED canaries" |
| `src/lib/integrations/social/oauth.ts:164-165` (committed 2026-08-10) | A comment says a strict expiry check "recently blocked valid Instagram callbacks as expired": an Instagram connection was attempted before then. Nothing records whether it ever completed, or for which account. |
| `scripts/prove-autonomous-publish.ts` (commit `7a3ae20`) | The publish proof ran on a throwaway database and expects OWNER_ACTION_REQUIRED "with no connected account" |
| Git history | The local clone is shallow (from 2026-09-11). The requested `git log --all -i --grep` finds no commit about Instagram, Facebook, LinkedIn, Threads or Nextdoor; its "tiktok" and "publish" hits are other work (agent marketplaces, listings, #105 reports). On GitHub, the files in `src/lib/integrations/social` were last changed 2026-08-10 (`3e19287`, a commit of uncommitted working-tree files, nothing about a connection). |
| Issue #105, body and 55 comments (read about 17:05Z) | No comment reports a social account, a connection, a publish job or a social post. Social words there are incidental: a bounty titled "Meta Ads Virtual Card For Facebook And Instagram Billing" (5945240045), `linkedin.com` in a domain census (5857335346), Reddit threads in the listings catalog. The Listings catalog (6074182151, 48 channels) holds no social business page, and its "Owner's hand-sent email" channel is outreach, which this sprint does not allow. |
| Handles | No Amber One AI LinkedIn, Facebook, X, Threads or Bluesky handle is recorded anywhere in `src`, `docs`, `data` or `scripts`. The only recorded AmberOne channel is the YouTube channel id above, which the pipeline can only post video to. |

## Unknowns

- Whether any `SocialAccount` in production is CONNECTED, for any platform or brand. Production's database cannot be read from here, and Amber's Railway operator token is refused for reading variables (#105 comment 6084165961).
- Whether Amber One AI has a Facebook Page, a LinkedIn company page, or X, Threads or Bluesky accounts at all, and who manages them.
- Whether production's Vault holds Meta (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`), LinkedIn, X or Threads app keys, and whether the Meta app has `pages_manage_posts` granted.
- Whether the Instagram connection attempted before 2026-08-10 (`oauth.ts:164-165`) ever completed, and for which account. It would not help here: the Instagram adapter posts Reels only, and Instagram captions carry no clickable link.
- Whether the AmberOne YouTube channel or the @launchreadyai TikTok is connected now. Neither helps: both are video-only, and @launchreadyai is another brand.
- Whether supervisor stage 13 has processed any job in production since August. The beacon does not report it.

## Can a text post with a link go through the existing pipeline?

**No.** No adapter's `publish()` sends text alone. The orchestrator refuses any job without a video before calling an adapter, and the approval API accepts only an MP4 from the commercial library. Nextdoor's adapter could send text, but the orchestrator rejects it, and it also needs Nextdoor's partner Publish API access, which had not been granted as of `docs/SOCIAL_PUBLISHING.md` (2026-08-01, line 45).

## The smallest safe path to one organic text post per offer

**The blocker:** there is no evidence that any Amber One AI business page is connected. The owner would need to connect one (the Facebook Page is the shortest route) in HQ at `/dashboard/social-publish`, and the pipeline needs a text-post path, because today it only publishes MP4 video.

- **Today, with no code (owner only):** the owner pastes the posts from `AD-ASSETS.md` on their own pages, using the `?src=<channel>` links. Amber cannot do this step.
- **Through Amber (owner step, then one small PR):**
  1. **Owner:** connect the Amber One AI Facebook Page in HQ (`/dashboard/social-publish`, Connect Facebook). This needs the Meta app keys in the Vault and `pages_manage_posts`. The adapter takes the first Page the login returns (`meta.ts:100`), so either the login manages only that Page or the code picks the Page by id. A LinkedIn company page would need more: the adapter posts as a person (`urn:li:person`), so it needs an organization author and the `w_organization_social` scope, which LinkedIn grants only to approved apps (LinkedIn's rule; not checked here).
  2. **Code:**
     - A Facebook Page text post: `POST /{page-id}/feed` with `message` and `link`, verified through the post's `permalink_url`.
     - The orchestrator lets a job with no media through when the adapter declares `text`.
     - A committed list of the ten posts that the owner approves (offer, platform, channel, not-before time), with each text built as `fillLink(AD_COPY[offer].launchPost, offerLink(offer, "facebook-page"))`.
  3. **Applied once by the worker, behind an owner switch:**
     - Each job is created once, with an idempotency key of offer, platform and campaign, and only while the account derives CONNECTED.
     - A job that ends FAILED or OWNER_ACTION_REQUIRED is never re-created.
     - Posts go out paced, a few hours apart.
     - The job refuses any text that differs from the committed list.
  4. **Audit:** after each LIVE_VERIFIED, one comment on #105 with the offer, the platform, the post URL, the link used and the time. Nothing is edited after posting.
