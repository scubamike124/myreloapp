# Owner-owned channels: what is connected, what has been posted, and what Amber can publish

Rewritten 2026-10-11 from what production holds. The version written on 2026-10-10 (about 17:00Z) was code-only: this session cannot read production's database, so it said "no channel is verified as connected" from code and git history alone. The owner said Amber had posted to TikTok and Facebook before, so that conclusion was withdrawn until production could be read. It is read now.

**How it was read.** A read-only worker report (amberai PR #795, merged as `ea8d28f`) reads the `SocialAccount`, `SocialPublishJob` and `SocialApprovalBatch` rows and whether each vault key is present, and edits one marked comment on issue #105. It prints no token, key, password or other secret value, only yes or no for named vault keys, public handles, scope names, dates, post links and short error codes. Its first run is saved verbatim in `evidence/SOCIAL-STATUS-2026-10-11T0417Z.md` (#105 comment 6105360976, as of 2026-10-11 04:17:19Z). Everything in the "Production" section below is from that run. Nothing was posted, connected or changed to produce it.

**Second read, 2026-10-11 12:28Z (the owner's next priority: "reconcile Amber's previous Facebook/TikTok publishing connections and identify the exact missing connection or permission").** A second worker report (amberai #802, merged as `561f386`) reads everything all-time and asks Meta and TikTok whether the app credentials work. Its first run is saved in `evidence/SOCIAL-RECONCILE-2026-10-11T1228Z.md` (#105 comment 6109024258; the list of all 99 vault entry names is left out of the saved copy). Its findings are in "Second read" below and are folded into the conclusion.

## Conclusion

1. **No account is connected for publishing right now.** Of 44 account rows, 0 derive to CONNECTED. No publish job was created in the last 30 days. The latest job is from 2026-09-02.
2. **Facebook was never connected through this system (confirmed by the all-time read of 12:28Z).** 8 Facebook and 6 Instagram login links were created between 2026-08-03 and 2026-08-23 and none was finished; there has never been a job on Facebook, Instagram or Threads; the older tables (Campaign, MarketingPostResult, ContentPiece, SocialInsight) hold nothing about either platform; the four Facebook rows (dayli, launchready, myreelo, restpilot) read `AWAITING_USER_OAUTH` with no token and no Page chosen. The vault holds the Meta app id and secret (set 2026-08-03) and no Page token, scheduler key or stored site login. Meta accepts the app's id and secret today; the app ("Amber api", id 1083288454271410) has **no privacy-policy URL and no category**. The exact missing piece is one finished Meta login by a person who manages the Page (see "Second read"). If Amber posted to Facebook before, it was from somewhere this database does not cover.
3. **TikTok did connect, once, and then lapsed.** 69 login links were created and 2 finished (`launchready` at 07:45Z and `dayli` at 17:32Z on 2026-08-23; scopes `video.publish`, `video.upload`, `user.info.basic`). Exactly one post went through the API: `launchready` (`@launchreadyai`), 2026-08-23 07:47Z, live privately ("Public posting still needs TikTok app review"). The stored refresh tokens were refused on 2026-09-02 ("Refresh token is invalid or expired"), which failed two jobs and opened two repair tasks; both rows are EXPIRED. The four TikTok videos of 2026-08-01 were made through TikTok Studio by a browser runner (git history; the script is `scripts/tiktok-upload-run.ts`, which drives TikTok Studio from a signed-in browser profile on a computer), not by this pipeline. The vault holds no TikTok username, password or saved browser session, so production cannot sign in without the owner.
4. **YouTube is the only channel with posts on record.** (The all-time read at 12:28Z counts 49 Shorts LIVE_VERIFIED and 1 FAILED; the first report listed only the newest 25 jobs, 23 of them Shorts. The check below covers up to 40.) 23 YouTube Shorts on four channels (AmberOne 8, Launch Ready 7, Amber E-Book Factory 4, Amber API Marketplace 4) are recorded LIVE_VERIFIED, published between 2026-08-25 19:34Z and 2026-08-26 07:45Z and recorded at 2026-08-26 18:39Z, each with 0 attempts logged and no approval batch, so they were recorded rather than uploaded by the worker's publish loop. **Read on 2026-10-11 07:39Z through YouTube's public oEmbed (no login): all 40 Shorts the database records answered as public or unlisted, none refused (private or deleted)** (the report checks up to 40; the vault's `YOUTUBE_POSTING_MODE` is not set). The three channel rows other than Launch Ready read stored status CONNECTED with no token stored, so the pipeline would refuse to publish to them today.
5. **Even a connected account could not carry a per-offer tracked link today.** Every adapter sends video only (Reels, Shorts, TikTok videos), and on those formats a link in the caption is not a usable tracking link (YouTube made Shorts links unclickable in 2023; Instagram captions carry no clickable link; TikTok has none in a video description; Facebook Reels captions are the same, a point I did not check against Meta's pages). The one format that does carry a clickable per-offer link is a text post with a link on a Facebook Page, which the code cannot send yet.
6. **So nothing can be posted publicly by Amber tonight without an owner step.** The step is one connection, below. Nothing here asks the owner to create an account or paste a post.

## Second read (2026-10-11 12:28Z): Facebook and TikTok reconciled

| | Facebook | TikTok |
|---|---|---|
| Login links created / finished | 8 / 0 (2026-08-03 20:15Z to 2026-08-23 21:56Z); Instagram 6 / 0; Threads 0 | 69 / 2 (both 2026-08-23) |
| Posts ever made through Amber | 0 (no job on Facebook, Instagram or Threads) | 1, private, 2026-08-23 07:47Z |
| Account rows | 4 brands, `AWAITING_USER_OAUTH`, no token, no Page chosen | `launchready` and `dayli` EXPIRED (access token to 2026-08-24; refresh refused 2026-09-02, `token_expired`) |
| App credentials | Meta app "Amber api" (id 1083288454271410; `FACEBOOK_APP_*` and `META_APP_*` are the same app). Meta accepts the id and secret. **No privacy-policy URL, no category.** App domains `amberoneai.com`, `hq.amberoneai.com` | TikTok accepts the client key and secret |
| Anywhere else | Nothing in Campaign, MarketingPostResult, ContentPiece or SocialInsight; no scheduler key; no stored site login | The same |

- **The older `publishCampaign` path is a dry run by design** (`src/lib/integrations/social-adapter.ts`: it queues a campaign for approval and never calls a platform), so it cannot be where an earlier Facebook post came from.
- **The code has one Facebook route, the OAuth Page login and the Graph API, and no browser route.** TikTok has two: the Content Posting API (needs the OAuth login; unaudited apps post private) and a browser script (`scripts/tiktok-upload-run.ts`, `src/lib/browser-automation/tiktok-studio.ts`) that needs a signed-in TikTok Studio session. The script is run by hand on a computer with a persistent Chrome profile; nothing in production loads a saved session, so it cannot run there. That route is the likeliest source of the earlier TikTok videos.
- **Why the 14 Meta logins never finished is not recorded.** The callback route is shared and TikTok finished through it twice, so the route works; the Meta-specific steps after it (token exchange, Page lookup) have never succeeded in production. The callback used to turn every failure into a dashboard banner and keep nothing (amberai #803 records the provider's words on the account row, and #802 already names a missing permission or Page when a login finishes). The 13:00Z version of the report (build `bee94b3`, `evidence/SOCIAL-RECONCILE-2026-10-11T1300Z.md`) splits them: **all 8 Facebook links were created by a signed-in user** (someone pressed Connect eight times and none finished), and the 6 Instagram links by an automatic step with no user (the account note reads "Amber started Instagram OAuth automatically"); all 69 TikTok links were created by a signed-in user.
- **Other Railway services.** `amber-hq-web` and `amber-os-worker` answer on `561f386`. The documented `amber-social-worker` and a guessed address for `amberai` in the other Railway project (`elegant-exploration`) both answered HTTP 404, which shows only that nothing answers at those addresses. GitHub's deploy statuses on `main` show the `amber-hq` services (web at `hq.amberoneai.com`, worker at `amber-os-worker-production.up.railway.app`) on every commit read from 2026-09-03 on, and `elegant-exploration` / `amberai` ("Success", with no public domain) first on the commit deployed 2026-10-05 00:07Z (the commit of 2026-10-02 12:00Z has none): it was created in early October, after the Facebook and TikTok logins of August, so it is unlikely to be where earlier posts were made. Statuses before 2026-09-02 are not kept, so August itself cannot be read this way.
- **This checkout is a shallow clone** (911 commits, the oldest being `db892b5`), so earlier work cannot be searched here.

### The exact missing connection and permissions (Facebook)

1. A finished Meta login that returns a Page access token. Only that login creates one; there is no Page token anywhere else.
2. The login asks for `pages_show_list`, `pages_read_engagement` and `pages_manage_posts` (classic Facebook Login, `https://www.facebook.com/v21.0/dialog/oauth`, no `config_id`). Only the Meta app's dashboard shows whether the app offers them; the next login names any that are missing (amberai #802).
3. The redirect address Amber sends, `https://hq.amberoneai.com/api/social/oauth/callback/facebook`, must be listed under Valid OAuth Redirect URIs. The callback itself is public (no session cookie needed).
4. The person who signs in needs a role on the Meta app (a Development-mode app admits only role holders, and Standard Access permissions are granted only to role holders in Live mode too), and must manage the Page. **The 13:00Z read shows the app has exactly one role holder, an administrator (0 developers, 0 testers).** If the Page is managed by a different Facebook profile, that profile has to be added as a Developer or Tester, or the administrator's profile given access to the Page. That alone would explain eight failed attempts; it is not established as the cause.
5. For the public to see the posts the app must be Live. Meta's documentation says data an app makes in Development mode can only be seen by people with a role on the app ([app modes](https://developers.facebook.com/docs/development/build-and-test/app-modes)). The app has no privacy-policy URL and no category; the site's `/privacy` page is a placeholder ("not reviewed by counsel", "final launch copy must be confirmed by the Owner"), so whether to submit it is the owner's decision. Not checked from here: the app's mode, its permissions and its redirect list (Meta's dashboard only). The redirect address Amber sent in August, read from the stored login links, is exactly the one in item 3.

### The exact missing connection (TikTok), and why it is not needed for the offers

API route: press Connect on the TikTok row for `launchready` again (a fresh login); public posts need TikTok's own audit of the app, until then every post is private. Browser route: a signed-in TikTok Studio session, which only the owner can create (login, CAPTCHA or 2FA). Either way a TikTok video carries no clickable per-offer link, so TikTok is not part of the offer test.

## Production, as read at 04:17Z on 2026-10-11

### Accounts (44 rows: 4 brands x 10 platforms, plus three extra YouTube channels)

| Platform | Rows | Stored status | Derived status | Token | Detail |
|---|---|---|---|---|---|
| Facebook | dayli, launchready, myreelo, restpilot | AWAITING_USER_OAUTH | AWAITING_USER_OAUTH | none stored | Never connected. |
| Instagram | the same four | AWAITING_USER_OAUTH | AWAITING_USER_OAUTH | none stored | Never connected. |
| TikTok | launchready (`launchreadyai`), dayli | EXPIRED | EXPIRED | stored, readable, expired 2026-08-24 | Scopes `video.publish`, `video.upload`, `user.info.basic`; refresh token stored but refused on 2026-09-02. datewise, myreelo, restpilot: never connected. |
| YouTube | amberone (`AmberOne`), api_marketplace (`Amber API Marketplace`), ebook_factory (`Amber E-Book Factory`) | CONNECTED | AWAITING_USER_OAUTH | none stored | A stored "connected" label with no token behind it. |
| YouTube | launchready (`Launch Ready`) | EXPIRED | EXPIRED | stored, readable, expired 2026-08-03 | Refresh token stored. |
| YouTube | dayli, myreelo, restpilot | AWAITING_USER_OAUTH | AWAITING_USER_OAUTH | none | Never connected. |
| LinkedIn, X, Threads, Pinterest, Google Business Profile, Nextdoor | four brands each | AWAITING_USER_OAUTH | AWAITING_USER_OAUTH | none | Never connected, and no app key in the vault (below). |

### Vault (yes or no, never values)

Present: Meta app id and secret (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `META_APP_ID`, `META_APP_SECRET`), TikTok client key and secret, YouTube client id and secret, `YOUTUBE_REFRESH_TOKEN`, `YOUTUBE_CHANNEL_ID`, and the media store keys (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).

Absent: LinkedIn client id and secret, X API key and secret, Threads access token and app keys, Pinterest app id and secret, Google Business client id and secret, Nextdoor access token, `TIKTOK_ACCOUNT_USERNAME`, `TIKTOK_ACCOUNT_PASSWORD`, `INSTAGRAM_ACCESS_TOKEN`, `R2_PUBLIC_URL`.

### Publish history

The report lists the latest 25 jobs and the latest 10 approval batches (there are only three batches).

| When | Platform / brand | Result |
|---|---|---|
| 2026-09-02 01:30Z | TikTok / launchready | FAILED, 1 attempt, `token_expired` ("Refresh token is invalid or expired.") |
| 2026-09-02 01:17Z | TikTok / dayli | FAILED, 1 attempt, `token_expired` |
| Published 2026-08-25 19:34Z to 2026-08-26 07:45Z; recorded 2026-08-26 18:39Z | YouTube / amberone 8, launchready 7, ebook_factory 4, api_marketplace 4 | 23 x LIVE_VERIFIED, 0 attempts, a youtube.com/shorts link each |
| Approval batches | 2026-08-23 07:47Z YouTube + TikTok / launchready: PARTIAL_FAILURE; 2026-09-02 TikTok / dayli and TikTok / launchready: FAILED | |

Titles of the Shorts include "An AI Assistant That Actually Finishes Setup", "Put Local Business Ads On Autopilot with Amber One" and "Small Business Cyber Security Checklist", so they are on-brand for Amber One AI; none is about the ten pilot offers and none carries a pilot offer link.

## What each adapter sends (code, `src/lib/integrations/social`, unchanged since 2026-08-10)

| Platform | `publish()` sends | Text or link post | Posts as | Visibility rule that applies |
|---|---|---|---|---|
| Facebook | A Reel, uploaded to `/{page}/video_reels` (`providers/meta.ts`, `publishFacebookReel`) | No | The first Page the login returns (`discoverMetaPage`, `json.data?.[0]`) | A Meta app in Development mode can publish, but the post is visible only to people with a role on the app (Postiz and Magefan; Meta's own page does not state it); the app must be Live for public posts. |
| Instagram | A Reel | No | The linked Instagram professional account | Captions carry no clickable link. |
| TikTok | Video only | No | The connected creator | An unaudited TikTok client can post only with `SELF_ONLY` visibility until it passes TikTok's audit (TikTok's content sharing guidelines). |
| YouTube | A Short, resumable upload; `privacyStatus` is hard-coded `"private"` in both branches of the adapter | No | The authorized channel | Videos uploaded by `videos.insert` from an unaudited API project created after 2020-07-28 are private whatever status is requested (YouTube's `videos.insert` reference). Links in a Short's description and comments are not clickable (YouTube, since 2023-08-31). |
| LinkedIn, X, Threads, Pinterest, Google Business, Nextdoor | Video (X and LinkedIn need the local MP4; Nextdoor sends `body_text` but the orchestrator rejects a job without a video first) | No | A member profile (LinkedIn), a user (X, Threads) and so on | None of them can connect: the app keys are not in the vault. |

The orchestrator, the approval route and the approval policy are video-only too: `createApprovalBatchAndJobs` stages a `video/mp4`; `validatePublishMedia` rejects a job without a video; `/api/social/approve` accepts only an `.mp4` under `.data/commercial`, `.data/social-media` or `public/amber-social-library`. Posting is paced per account (TikTok 60 min, LinkedIn 60, Instagram 30, Threads 30, YouTube 30, Facebook 20, X 15; `post-pacing.ts`).

## What Amber can publish today

| Format | Where | Today |
|---|---|---|
| Text post with a tracked link | Any | **Nowhere.** No adapter sends it, and no account is connected. |
| Facebook Reel | Facebook | Not connected. |
| Instagram Reel | Instagram | Not connected. |
| TikTok video | TikTok | Expired; needs the owner's TikTok login. Would be private until TikTok audits the app. |
| YouTube Short | YouTube | The adapter in this repository uploads private and the rows hold no usable token, so it cannot post now. The 40 recorded Shorts were read as public or unlisted (2026-10-11), and they show 0 attempts, so they were most likely not uploaded by this adapter as it stands (not established). |

## The barriers, each at its exact point

These are owner-only steps (identity, a login with possible CAPTCHA or 2FA, or a setting only the owner controls). Amber stops at each and does nothing else about it.

1. **Facebook (the one that matters for tracked links).** Open HQ, `/dashboard/social-publish`, pick any brand in the brand selector (it only labels the connection; the page lists Launch Ready, RestPilot, MyReelo / Story Book, DateWise AI and Dayli, and there is no Amber One brand, and the offers' posts go to the Page chosen at the Meta login, not to the brand), press **Connect** on the Facebook row, sign in to Meta, and choose the Page the posts should go on. The adapter takes the first Page the login returns, so the login should manage only the Page the owner wants. For the posts to be public rather than visible only to people with a role on the app, the Meta app should be in Live mode (Meta developer dashboard; third-party sources, to check against Meta's current App Mode docs). Amber cannot sign in to Meta for the owner and does not try. Before pressing Connect, check in the Meta app the three things only its dashboard shows (the permissions offered, the redirect address, your own role; "Second read" above). Connecting starts the plan: the first post goes out at the next weekday 14:00Z slot after the login, one per ready offer, at least 20 hours apart, and `promo: pause` holds it.
2. **TikTok.** `@launchreadyai` needs the Connect TikTok login again, and TikTok keeps unaudited apps private. TikTok is a video platform without a per-offer link, so it is not the channel for this test.
3. **YouTube.** The adapter uploads private. Public posting needs the owner's explicit posting-mode choice and, per YouTube, a passed API audit. YouTube Shorts links are not clickable, so it cannot carry a per-offer link either.
4. **Everything else.** LinkedIn, X, Threads, Pinterest, Google Business and Nextdoor need developer apps created by the owner. The brief says not to ask for new accounts, so these stay closed.

## Unknowns that remain

- ~~Whether the recorded Shorts are public.~~ Answered 2026-10-11 07:39Z by the worker's read-only check: 40 of 40 answer as public or unlisted.
- **What drains the publish queue in production.** Answered the same minute: the supervisor tick that is meant to drain it is scheduled (`*/15 * * * *`) but its last run was 2026-08-11T02:30Z, so nothing has drained the queue for two months. A post created by the promotion lane is therefore sent by the lane's own publish pass (amberai #801), not by the supervisor.
- Whether `YOUTUBE_REFRESH_TOKEN` still works. It has not been tried: the report checks presence only.
- Whether the Meta app is Live, which permissions it offers, whether its redirect list has the address above, and which Pages the owner manages. Meta's dashboard shows these; the only role holder is one administrator (13:00Z read).
- Whether earlier Facebook posts exist elsewhere (a copy on the owner's computer, another Railway project, or by hand). Nothing in the database, the vault, the site logins or the code points to one.
- Why the 14 Meta logins did not finish (cancelled, refused at Meta's dialog, never opened, or failed at the exchange). Not recorded; the next attempt will be (#803).

## Rules the posts follow

Facebook Page posts through the Pages API (a POST to the Page's `/feed` with `message` and `link`) need a Page access token with `pages_manage_posts`; the Platform Terms and Page rules apply (no deceptive or repetitive posting, no engagement bait). The posts for the ten offers say they are pilots, say what the buyer gets and sends, say the sample is made from invented data, carry no price, no result we have not measured and no guarantee, and end with one tracked link. One post per offer per channel, a few hours apart and not more than one a day, never repeated. No direct messages, no cold email, no Reddit, no paid promotion.
