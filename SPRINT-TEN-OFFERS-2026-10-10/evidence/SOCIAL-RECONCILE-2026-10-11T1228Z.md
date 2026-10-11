# Facebook and TikTok reconciliation report, saved verbatim (list of all vault entry names removed)

Source: the amber-os-worker social reconcile report (amberai #802, merged as `561f386`), #105 comment 6109024258, as of 2026-10-11T12:28:33Z. It prints no token, key, password, username or secret value. The marker line and the report text below are as the worker wrote them; the services table shows `https:[redacted]` for the addresses it asked, a defect in this first version (the token filter treated a long host name as a token) that amberai #803 fixes. The addresses asked were `https://hq.amberoneai.com/api/health/public`, `https://amber-os-worker-production.up.railway.app/api/health/public`, `https://amber-social-worker-production.up.railway.app/api/health/public` and `https://amberai-production.up.railway.app/api/health/public`.

---

<!-- amber-social-reconcile -->
## Facebook and TikTok: what was ever connected, what was ever posted, and what is missing (read-only)

As of `2026-10-11T12:28:33.568Z`, from amber-os-worker. This reads the database (all time), the NAMES of vault entries, site logins and environment variables, and asks Meta and TikTok whether the app credentials work. It prints no token, key, password, username or secret value, posts nothing, queues nothing and changes no account, job or credential.

### 1. Every time Connect was pressed (all time)

| Platform | Logins started | Finished | Not finished | First started | Last started |
|---|---|---|---|---|---|
| FACEBOOK | 8 | 0 | 8 | 2026-08-03 20:15Z | 2026-08-23 21:56Z |
| INSTAGRAM | 6 | 0 | 6 | 2026-08-03 16:51Z | 2026-08-03 20:35Z |
| THREADS | 0 | 0 | 0 | | |
| TIKTOK | 69 | 2 | 67 | 2026-08-01 16:39Z | 2026-08-23 17:29Z |

Newest login attempts:

| Platform | Brand | Started | Finished |
|---|---|---|---|
| FACEBOOK | launchready | 2026-08-23 21:56Z | not finished (the link expired 2026-08-23) |
| TIKTOK | dayli | 2026-08-23 17:29Z | 2026-08-23 17:32Z |
| TIKTOK | dayli | 2026-08-23 17:28Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 07:46Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 07:44Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 07:04Z | 2026-08-23 07:45Z |
| TIKTOK | launchready | 2026-08-23 04:41Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 04:37Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 04:28Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 04:27Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 03:36Z | not finished (the link expired 2026-08-23) |
| TIKTOK | launchready | 2026-08-23 03:29Z | not finished (the link expired 2026-08-23) |

Account rows that carry a "login started" mark: FACEBOOK/launchready at 2026-08-23 21:56Z; INSTAGRAM/launchready at 2026-08-03 20:35Z; TIKTOK/datewise at 2026-08-01 20:27Z; TIKTOK/launchready at 2026-08-23 07:46Z; TIKTOK/myreelo at 2026-08-01 20:36Z.

### 2. Every publish job ever queued, by platform and status

| Platform | Status | Jobs | First created | Last created |
|---|---|---|---|---|
| TIKTOK | FAILED | 2 | 2026-09-02 01:17Z | 2026-09-02 01:30Z |
| TIKTOK | LIVE_VERIFIED | 1 | 2026-08-23 07:47Z | 2026-08-23 07:47Z |
| YOUTUBE | FAILED | 1 | 2026-08-23 07:47Z | 2026-08-23 07:47Z |
| YOUTUBE | LIVE_VERIFIED | 49 | 2026-08-26 18:37Z | 2026-08-26 18:39Z |

Never a job on: FACEBOOK, INSTAGRAM, THREADS.

### 3. The newest attempts on Facebook, Instagram, Threads and TikTok (provider answers)

| Started | Platform | Brand | Attempt | Status | Error code | Provider's words | Retried? |
|---|---|---|---|---|---|---|---|
| 2026-09-02 01:30Z | TIKTOK | launchready | 1 | FAILED | `token_expired` | `Refresh token is invalid or expired.` | no |
| 2026-09-02 01:17Z | TIKTOK | dayli | 1 | FAILED | `token_expired` | `Refresh token is invalid or expired.` | no |
| 2026-08-23 07:47Z | TIKTOK | launchready | 1 | LIVE_VERIFIED |  | `Your TikTok post is live privately. Public posting still needs TikTok app review.` | no |

Repair tasks those failures opened:

| Platform | Error code | Tasks | Last |
|---|---|---|---|
| TIKTOK | `token_expired` | 2 | 2026-09-02 01:30Z |

### 4. The accounts as the database holds them

| Platform | Brand | Stored, then derived | Handle | Token | Access token expires | Refresh token | Scopes granted | Page chosen | Meta's Page name stored | Seeded (app keys ready) | Created | Updated | What the row says |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FACEBOOK | dayli | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| FACEBOOK | launchready | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-23 21:56Z | `Waiting for owner to finish the provider login screen.` |
| FACEBOOK | myreelo | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| FACEBOOK | restpilot | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| INSTAGRAM | dayli | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| INSTAGRAM | launchready | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-03 20:35Z | `Amber started Instagram OAuth automatically. Finish Meta login once.` |
| INSTAGRAM | myreelo | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| INSTAGRAM | restpilot | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  | 2026-08-03 16:34Z | 2026-08-01 16:38Z | 2026-08-03 16:34Z | `Shared Meta App ID+Secret ready. Finish Instagram/Facebook Login once per brand — do not create a new IG account.` |
| TIKTOK | datewise | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 20:15Z | 2026-08-01 20:27Z | `Waiting for owner to finish the provider login screen.` |
| TIKTOK | dayli | EXPIRED, EXPIRED |  | stored, readable | 2026-08-24 | yes | `user.info.basic` `video.publish` `video.upload` |  |  |  | 2026-08-01 16:38Z | 2026-09-02 01:52Z |  |
| TIKTOK | launchready | EXPIRED, EXPIRED | `launchreadyai` | stored, readable | 2026-08-24 | yes | `video.publish` `video.upload` `user.info.basic` |  |  |  | 2026-08-01 16:38Z | 2026-09-02 01:52Z | `Waiting for owner to finish the provider login screen.` |
| TIKTOK | myreelo | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 20:36Z | `Waiting for owner to finish the provider login screen.` |
| TIKTOK | restpilot | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 16:38Z |  |
| THREADS | dayli | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 16:38Z |  |
| THREADS | launchready | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 16:38Z |  |
| THREADS | myreelo | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 16:38Z |  |
| THREADS | restpilot | AWAITING_USER_OAUTH, AWAITING_USER_OAUTH |  | none |  |  |  |  |  |  | 2026-08-01 16:38Z | 2026-08-01 16:38Z |  |

### 5. Older places a post could have been recorded

Nothing about these platforms in Campaign, MarketingPostResult, ContentPiece or SocialInsight.

### 6. Credentials, logins and variables that mention these platforms (names and dates only)

Configured vault entries: 99. Dates are when the entry was last changed.

- **Meta, Facebook, Instagram, Threads:** `FACEBOOK_APP_ID` (2026-08-03), `FACEBOOK_APP_SECRET` (2026-08-03), `META_APP_ID` (2026-08-03), `META_APP_SECRET` (2026-08-03)
- **TikTok:** `LAUNCHREADY_TIKTOK_HANDLE` (2026-08-23), `TIKTOK_CLIENT_KEY` (2026-08-23), `TIKTOK_CLIENT_SECRET` (2026-08-23)
- **Scheduling or automation services:** none
- **Other social networks:** `YOUTUBE_AMBERONE_CHANNEL_ID` (2026-08-22), `[redacted]` (2026-08-22), `YOUTUBE_CHANNEL_ID` (2026-08-22), `YOUTUBE_CLIENT_ID` (2026-08-03), `YOUTUBE_CLIENT_SECRET` (2026-08-03), `YOUTUBE_DATEWISE_CHANNEL_ID` (2026-08-22), `YOUTUBE_DAYLI_CHANNEL_ID` (2026-08-22), `[redacted]` (2026-08-22), `YOUTUBE_FORMA_CHANNEL_ID` (2026-08-22), `YOUTUBE_GRANTPILOT_CHANNEL_ID` (2026-08-22), `YOUTUBE_LAUNCHREADY_CHANNEL_ID` (2026-08-22), `YOUTUBE_MYREELO_CHANNEL_ID` (2026-08-22), `YOUTUBE_POSTING_MODE` (2026-08-22), `YOUTUBE_REFRESH_TOKEN` (2026-08-22), `YOUTUBE_REFRESH_TOKEN_AMBERONE` (2026-08-24), `[redacted]` (2026-08-24), `[redacted]` (2026-08-24), `[redacted]` (2026-08-22), `[redacted]` (2026-08-22), `YOUTUBE_RESTPILOT_CHANNEL_ID` (2026-08-22), `YOUTUBE_VALORASTYLE_CHANNEL_ID` (2026-08-22)
- **Site logins stored for browser use (host, service, status, last used; no username or password shown):** none
- **This service's environment variables with those words in their names:** `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

(The list of all 99 configured vault entry names is left out of this saved copy; the grouped names above are the ones that mention these platforms.)

### 7. Do the app credentials work? (asked of Meta and TikTok; no user login involved)

| App | Vault names read | App id | Accepted? | What came back |
|---|---|---|---|---|
| Meta app the code reads first | `FACEBOOK_APP_ID + FACEBOOK_APP_SECRET` | `1083288454271410` | yes | `Meta accepted the app id and secret` app name: Amber api; category: (none); privacy policy URL: NOT set; app domains: amberoneai.com, hq.amberoneai.com |
| Meta app it falls back to | `META_APP_ID + META_APP_SECRET` | `1083288454271410` | yes | `Meta accepted the app id and secret` app name: Amber api; category: (none); privacy policy URL: NOT set; app domains: amberoneai.com, hq.amberoneai.com |
| TikTok app | `TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET` | `aw5w7dqu0q10qg3y` | yes | `TikTok issued an app-only token (the client key and secret are accepted)` |

### 8. Which Railway services answer

- This service: `SERVICE_MODE` = `os`
- This service: `RAILWAY_SERVICE_NAME` = `amber-os-worker`
- This service: `RAILWAY_PROJECT_NAME` = `amber-hq`
- This service: `RAILWAY_ENVIRONMENT_NAME` = `production`
- This service: `RAILWAY_GIT_COMMIT_SHA` = `561f386`
- This service: `RAILWAY_PUBLIC_DOMAIN` = `[redacted]`

| Service | Address asked | Answer |
|---|---|---|
| amber-hq-web (this deployment) | `https:[redacted]` | answers: `HTTP 200, service amber-ai, commit 561f386 (main), environment production, process started 2026-10-11 12:28Z` |
| amber-os-worker (this deployment) | `https:[redacted]` | answers: `HTTP 200, service amber-os-worker, commit ?, environment ?, process started ?` |
| amber-social-worker (documented, not in the GitHub deploy statuses) | `https:[redacted]` | no answer: `HTTP 404` |
| amberai in the other Railway project, elegant-exploration (guessed address) | `https:[redacted]` | no answer: `HTTP 404` |

