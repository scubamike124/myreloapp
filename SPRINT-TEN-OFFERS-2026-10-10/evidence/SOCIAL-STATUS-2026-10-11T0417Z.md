<!-- Saved verbatim from #105 comment 6105360976 (first run of the worker's read-only social status report, PR #795, as of 2026-10-11T04:17:19Z). It holds no token, key or password: only yes/no for named vault keys, public handles, scope names, dates, post links and short error codes. -->

<!-- amber-social-status -->
## Social publishing: what is connected and what has been posted (read-only)

As of `2026-10-11T04:17:19.676Z`, from amber-os-worker. This reads the database and the vault. It prints no token, key, password or other secret value: only yes or no for named vault keys, public handles, scope names, dates, post links and short error codes. It posts nothing and changes no account or job.

**In short:** 44 account rows, 0 derived CONNECTED. 23 of the latest 25 publish jobs are LIVE_VERIFIED.

### Accounts

| Platform | Brand key | Handle | Stored status | Derived status | Token stored | Token readable here | Expires | Refresh token | Scopes granted | Missing scopes | Connected at | Last sync |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FACEBOOK | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| FACEBOOK | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| FACEBOOK | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| FACEBOOK | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| INSTAGRAM | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| INSTAGRAM | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| INSTAGRAM | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| INSTAGRAM | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| TIKTOK | datewise |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| TIKTOK | dayli |  | EXPIRED | **EXPIRED** | yes | yes | 2026-08-24 | yes | `user.info.basic, video.publish, video.upload` |  | 2026-08-23 17:32Z | 2026-08-23 17:32Z |
| TIKTOK | launchready | `launchreadyai` | EXPIRED | **EXPIRED** | yes | yes | 2026-08-24 | yes | `video.publish, video.upload, user.info.basic` |  | 2026-08-23 07:55Z | 2026-08-23 07:55Z |
| TIKTOK | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| TIKTOK | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | amberone | `AmberOne` | CONNECTED | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | api_marketplace | `Amber API Marketplace` | CONNECTED | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | ebook_factory | `Amber E-Book Factory` | CONNECTED | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | launchready | `Launch Ready` | EXPIRED | **EXPIRED** | yes | yes | 2026-08-03 | yes | `openid, https:[redacted], https:[redacted], https:[redacted], https:[redacted], https:[redacted]` |  |  | 2026-08-03 21:22Z |
| YOUTUBE | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| YOUTUBE | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| LINKEDIN | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| LINKEDIN | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| LINKEDIN | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| LINKEDIN | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| X | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| X | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| X | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| X | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| THREADS | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| THREADS | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| THREADS | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| THREADS | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| PINTEREST | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| PINTEREST | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| PINTEREST | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| PINTEREST | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| GOOGLE_BUSINESS | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| GOOGLE_BUSINESS | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| GOOGLE_BUSINESS | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| GOOGLE_BUSINESS | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| NEXTDOOR | dayli |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| NEXTDOOR | launchready |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| NEXTDOOR | myreelo |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |
| NEXTDOOR | restpilot |  | AWAITING_USER_OAUTH | **AWAITING_USER_OAUTH** | no |  |  |  |  |  |  |  |

### App keys and logins in the vault (yes or no, never values)

| Platform | Keys the adapter needs | Present |
|---|---|---|
| FACEBOOK | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | yes, yes |
| INSTAGRAM | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | yes, yes |
| TIKTOK | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | yes, yes |
| YOUTUBE | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | yes, yes |
| LINKEDIN | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | no, no |
| X | `X_API_KEY`, `X_API_SECRET` | no, no |
| THREADS | `THREADS_ACCESS_TOKEN` | no |
| PINTEREST | `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET` | no, no |
| GOOGLE_BUSINESS | `GOOGLE_BUSINESS_CLIENT_ID`, `GOOGLE_BUSINESS_CLIENT_SECRET` | no, no |
| NEXTDOOR | `NEXTDOOR_ACCESS_TOKEN` | no |

Other publishing-related keys: `TIKTOK_ACCOUNT_USERNAME` no; `TIKTOK_ACCOUNT_PASSWORD` no; `LAUNCHREADY_TIKTOK_HANDLE` no; `META_APP_ID` yes; `META_APP_SECRET` yes; `INSTAGRAM_ACCESS_TOKEN` no; `THREADS_APP_ID` no; `THREADS_APP_SECRET` no; `YOUTUBE_CHANNEL_ID` yes; `YOUTUBE_REFRESH_TOKEN` yes; `X_CLIENT_ID` no; `X_CLIENT_SECRET` no; `NEXTDOOR_CLIENT_ID` no; `NEXTDOOR_CLIENT_SECRET` no; `R2_ACCOUNT_ID` yes; `R2_BUCKET` yes; `R2_ACCESS_KEY_ID` yes; `R2_SECRET_ACCESS_KEY` yes; `R2_PUBLIC_URL` no.

### Publish jobs, last 30 days, by platform and status

No publish job was created in the last 30 days.

### Latest publish jobs (up to 25)

| Created | Platform | Brand | Status | Attempts | Published | Verified | Link | Title (published only) | Last error |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-02 01:30Z | TIKTOK | launchready | FAILED | 1 |  |  |  |  | `token_expired` `Refresh token is invalid or expired.` |
| 2026-09-02 01:17Z | TIKTOK | dayli | FAILED | 1 |  |  |  |  | `token_expired` `Refresh token is invalid or expired.` |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/kYoQBIboJ-c | `An AI Assistant That Actually Finishes Setup #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/OZChRKdcEPc | `Is Your Website Costing You Customers? (Free AI Scan)` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/LVRe_rlNVpg | `How Busy Executives Cut Admin Chaos Fast #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/ZMJC_O2muKk | `Domain & Hosting Setup Made Simple (No Tech Stress)` |  |
| 2026-08-26 18:39Z | YOUTUBE | ebook_factory | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/ZnUL-Ujqs5Q | `Master Prompt Engineering in Minutes #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | api_marketplace | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/608m6dX_2l0 | `Ship Mobile App Artifacts Fast with Wrap API #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/yMPVGMiD3do | `Organize Your Entire Family With One AI Assistant` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-26 07:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/xs2ScekaOWs | `What Is Website Wrapping? (Fix Your Old Site)` |  |
| 2026-08-26 18:39Z | YOUTUBE | ebook_factory | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/KDjKrcoSTA8 | `Small Business Cyber Security Checklist #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | api_marketplace | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/_WOiK6NYmPI | `Scan Website Compliance Signals in Seconds #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/LAUjqIdEg84 | `Put Local Business Ads On Autopilot with Amber One` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/yvFuVeYZMmE | `Stop Putting Off Your Online Store (Launch Today)` |  |
| 2026-08-26 18:39Z | YOUTUBE | ebook_factory | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/vjQQarSOkLE | `Fix Your Short-Form Video Strategy Today #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | api_marketplace | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/hPnZnEmc9Ws | `Production APIs with Zero Fabricated Claims #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/rt2__Dln14U | `Run Your Whole Day From One AI Conversation` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-26 07:15Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/92ojfs6s9bw | `Agencies Charge Thousands For This... (Launch in Hours)` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-25 19:56Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/CHdxrzyQqLg | `An AI Assistant with Guided Setup That Stays Until Finished` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-25 19:52Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/MGYYhUwMW3k | `Is Your Website Costing You Leads? (Free AI Scan)` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-25 19:49Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/4pPQJQvu4Og | `Run Executive Meeting Prep & Follow-Ups with Amber One` |  |
| 2026-08-26 18:39Z | YOUTUBE | launchready | LIVE_VERIFIED | 0 | 2026-08-25 19:45Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/nxO1DDYD91s | `Custom Domains & Fast Hosting Done for You #Shorts` |  |
| 2026-08-26 18:39Z | YOUTUBE | ebook_factory | LIVE_VERIFIED | 0 | 2026-08-25 19:41Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/jCxoV--Kq40 | `Beginner Prompt Engineering Guide: Stop Getting Vague AI Answers` |  |
| 2026-08-26 18:39Z | YOUTUBE | api_marketplace | LIVE_VERIFIED | 0 | 2026-08-25 19:37Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/5MxPj4OvEuA | `Package Web Experiences Faster with Wrap API ($79/mo)` |  |
| 2026-08-26 18:39Z | YOUTUBE | amberone | LIVE_VERIFIED | 0 | 2026-08-25 19:34Z | 2026-08-26 18:39Z | https://www.youtube.com/shorts/zkE_pZrMxhk | `End Family Schedule Chaos: Meet Amber One` |  |

### Approval batches (latest 10)

| Created | Status | Platforms | Brands | Approved | Scheduled for |
|---|---|---|---|---|---|
| 2026-09-02 01:30Z | FAILED | TIKTOK | launchready | 2026-09-02 01:30Z | 2026-09-02 01:30Z |
| 2026-09-02 01:17Z | FAILED | TIKTOK | dayli | 2026-09-02 01:17Z | 2026-09-02 01:17Z |
| 2026-08-23 07:47Z | PARTIAL_FAILURE | YOUTUBE, TIKTOK | launchready | 2026-08-23 07:47Z | 2026-08-23 07:47Z |

