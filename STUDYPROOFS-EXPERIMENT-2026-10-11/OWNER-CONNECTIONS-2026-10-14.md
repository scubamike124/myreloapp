# StudyProofs promotion: the one consolidated list of connection steps (2026-10-14, updated 23:15Z)

Everything below is the exact step that stands between a channel and Amber posting on it by herself, with what happens the moment the step is done. Nothing here costs money. Every step is on an account you control; Amber never asks for a password, and nothing is pasted into chat or GitHub (the vault at `/dashboard/vault` is the only place a key goes).

## Where each channel stands right now

| Channel | Who can post today | What is still needed | About how long | What happens the moment it is done |
|---|---|---|---|---|
| 1. Our own example pages, sitemap, IndexNow | Amber, done | nothing | 0 | done: both pages live since 20:51Z, IndexNow accepted all three addresses at 22:12:33Z |
| 2. YouTube Shorts (the AmberOne channel) | nobody yet: the vault's login is refused by Google (see A) | **a fresh YouTube login: Connect on the YouTube row in HQ** (A); then, only if the first upload comes back private, Google's audit (A2) | 5 min; 20 min more if the audit is needed | the first Short in the next open 22:00Z to 06:00Z window, then one distinct Short a day for six days; each is shown on the tracker with its public address |
| 3. Facebook Page | nobody | the Meta login for a Page (B) | 15 min | one distinct link post a day at 14:00Z |
| 4. Bluesky | nobody | an account and an app password in the vault (C) | 10 min | one distinct post a day at 15:00Z, with the sample image |
| 5. Threads | nobody | the Threads use case on the Meta app, a tester role, the keys in the vault, Connect (D) | 20 min | one distinct post a day at 16:00Z |
| 6. LinkedIn, your own profile | you, by hand (texts ready) | a LinkedIn developer app, its keys in the vault, Connect, and one line on #105 (E) | 25 min | three posts a week (Tuesday to Thursday, 17:00Z) under your name |
| 7. X | you, by hand (texts ready) | nothing Amber can use: X's API is paid (free tier closed to new developers on 2026-02-06), so there is no free route for her | 5 min a post | the 14 texts in `BY-HAND-POSTS-2026-10-15.md`, one a day |
| 8. TikTok | you, by hand (texts ready) | a fresh TikTok login on the row in HQ **and** TikTok's audit of the app before any post is public (F) | 10 min, then TikTok's weeks | until the audit: nothing public through the API; by hand in the app with the kit text |
| 9. Instagram | you, by hand (texts ready) | a professional account and the same Meta login as Facebook (G) | 15 min once, 10 min a post | Reels and a Story with the link sticker, by hand; no free API route gives a clickable link |
| 10. Pinterest | you, by hand (CSV ready) | a business account; upload `kit/pinterest-bulk.csv` with Bulk Create Pins (H) | 15 min | four pins live, with clickable tracked links; the API route needs Pinterest's approval (weeks) and is not worth starting |
| 11. Quora, Discord study servers, Facebook study groups | you, by hand | your own account in each; the written rules of each place allow a disclosed post or not (I) | 20 min a post | one disclosed post where allowed, never a direct message |
| 12. Product Hunt, AlternativeTo, ISTE EdTech Index, Notion | you, by hand | one form each (J) | 5 to 60 min each | listings that keep working after the two weeks |

Amber's part needs no further word from you: the promotion lane (amberai #834) posts on channels 2 to 6 by itself the moment each is connected, keeps one distinct post a day per channel (no text is repeated within 30 days; LinkedIn three a week), records every post on the StudyProofs tracker (amberai #105, section "Promotion") with its public address and time, and the funnel counts each post's visitors and sign-ups by `src` and `campaign`. To stop everything, write `studyproofs-promo: pause` on #105; `studyproofs-promo: resume` starts it again.

## A. YouTube: a fresh login (5 min), then the audit only if an upload is kept private

**What production found (2026-10-14 23:02Z):** the lane's first run tried the vault's AmberOne login (`YOUTUBE_REFRESH_TOKEN_AMBERONE`, saved 2026-08-24) and Google refused it: `invalid_grant` ("Bad Request"), Google's answer for a refresh token that has expired, was revoked, or was replaced by a newer login. The 40 Shorts of August were made with it; it has died since. A Google project whose OAuth consent screen is still in **Testing** gives logins that expire after 7 days, which fits what happened.

1. In HQ open `/dashboard/social-publish`, Connections, the **YouTube** row for AmberOne, press **Connect**, sign in as the Google account that owns the AmberOne channel, and allow uploading. (From amberai #837 on, the lane tries the vault's two names and then every YouTube row connected in HQ, and uses the first login Google accepts for a channel named StudyProofs or Amber; it shows on the tracker what each login answered, by name, never a token.)
2. So that this login does not die in 7 days: in console.cloud.google.com, the project of the OAuth client the vault's `YOUTUBE_CLIENT_ID` belongs to, **OAuth consent screen**, publishing status **In production** (an unverified app in production still works for your own account; it only shows a warning screen at login).
3. Done. The next open slot (22:00Z to 06:00Z, every day) carries the first Short; the tracker shows its public address and time, and the ledger here is updated from it.

**A2. Only if the tracker says an upload was kept private** (code `youtube_audit`): a project that has not passed YouTube's API compliance audit has every API upload set to private, whatever the request asks for. Submit YouTube's **API Services compliance audit** form (the "YouTube API Services, Audit and Quota Extension Form" on support.google.com) for that project: what the app does (uploads the owner's own demonstration videos to the owner's own channel), the client, the privacy policy address. Google answers by email (reports say days to a few weeks). Write `studyproofs-promo: resume` on #105 when Google confirms; the private uploads can be made public in YouTube Studio by hand.

**Meanwhile, by hand (10 min a video):** YouTube Studio, Upload, the six video files from `demos/` (cards, notes and quiz for each example), title and description from `kit/KIT-TEXT.md` for the two card videos and from amberai's library for the four others (titles "Cellular respiration: study notes with where each came from", "Cellular respiration: a 4-question quiz, graded with the reasons", "Hypothesis testing: study notes with where each came from", "Hypothesis testing: an 8-question quiz, graded with the reasons"), privacy Public. Optional: the channel's About link `https://hq.amberoneai.com/studyproofs/examples?src=youtube-about`.

## B. Facebook Page (15 min)

What is missing is one finished Meta login that returns a Page token; fourteen logins since August were started and none finished.

1. In the Meta developer dashboard open the app ("Amber api"): under App Roles make sure the Facebook profile that manages the Page has a role (Administrator, Developer or Tester); under Facebook Login, Settings, make sure `https://hq.amberoneai.com/api/social/oauth/callback/facebook` is in Valid OAuth Redirect URIs; under Permissions make sure `pages_show_list`, `pages_read_engagement` and `pages_manage_posts` are available to the app. For the public to see the posts the app must be in **Live** mode (Development mode shows posts only to role holders).
2. In HQ open `/dashboard/social-publish`, Connections, the Facebook row, press **Connect**, sign in as the profile that manages the Page, choose the Page, allow posting.
3. The Page's name decides: a Page named StudyProofs or Amber is used at once; any other Page is used only after you write `studyproofs-promo-page: <the Page's name>` on #105.
4. Done. The next 14:00Z slot carries the first post. One note from the research: Meta is reported to limit free Pages to about two link posts in 30 days from 2026-09-15; if Facebook refuses a post for that reason, the tracker shows Facebook's answer and Amber waits rather than retrying.

## C. Bluesky (10 min, the lightest step)

1. At bsky.app create an account for StudyProofs (or use Amber One AI's if you prefer the posts under that name).
2. Settings, Privacy and Security, **App Passwords**, Add App Password, name it "Amber promotion", copy it (shown once; it is not the account password).
3. In the Owner Vault save `BLUESKY_HANDLE` (for example `studyproofs.bsky.social`) and `BLUESKY_APP_PASSWORD`.
4. Done. The next 15:00Z slot carries the first post with the example's picture; Amber reads each post back and records its public address. Delete the app password in Bluesky to cut the access off at any time.

## D. Threads (20 min)

1. In the Meta developer dashboard open the app, add the use case **Access the Threads API** and list `threads_basic`, `threads_content_publish` and `threads_read_replies` under it (Amber's login asks for all three; a login that asks for a permission the use case does not list can be refused by Meta's dialog).
2. Add the Valid OAuth Redirect URI `https://hq.amberoneai.com/api/social/oauth/callback/threads`; copy the Threads app id and secret into the Owner Vault as `THREADS_APP_ID` and `THREADS_APP_SECRET`.
3. Add the Threads profile as a **Threads Tester** under the app's roles and accept the invitation in Threads (Settings, Account, Website permissions, Invites).
4. In HQ, `/dashboard/social-publish`, Threads, press **Connect**, sign in as that profile and allow. A profile not named StudyProofs or Amber needs the `studyproofs-promo-page: @username` line on #105.
5. Done. The next 16:00Z slot carries the first post (a text post with the page's own preview card).

## E. LinkedIn, your own profile (25 min; the posts go out under your name)

1. At developers.linkedin.com create an app (LinkedIn asks for a LinkedIn Page to associate it with); under Products add **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** (both self-serve).
2. Auth tab: add the redirect URL `https://hq.amberoneai.com/api/social/oauth/callback/linkedin`; copy the Client ID and Client Secret into the Owner Vault as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.
3. In HQ, `/dashboard/social-publish`, LinkedIn, press **Connect**, sign in and allow.
4. Write `studyproofs-promo-page: <your name exactly as LinkedIn shows it>` on #105: Amber never posts from a personal profile that is not named.
5. Done. Tuesday, Wednesday and Thursday at 17:00Z, one post each, with the example's picture; LinkedIn gives this app no way to read a post back, so each is recorded as accepted with its link. The login lasts about 60 days; press Connect again when the tracker says it expired.

If you would rather not create the app: the six LinkedIn texts in `BY-HAND-POSTS-2026-10-15.md` take five minutes each.

## F. TikTok (your login, then TikTok's audit)

1. In HQ, `/dashboard/social-publish`, the TikTok row for `launchready` (or `dayli`), press **Connect** and sign in: both stored logins expired on 2026-09-02.
2. Public posts through the API need TikTok's audit of the app (unaudited apps can post only to private accounts). The audit is requested in the TikTok developer portal for the app; reports say two to six weeks.
3. Until then, by hand in the TikTok app: the video from `demos/`, the caption from `kit/KIT-TEXT.md`, **Disclose commercial content** then **Your brand**; the bio link `https://hq.amberoneai.com/studyproofs/examples?src=tiktok-bio`.

## G. Instagram (by hand)

1. Create a professional (creator or business) account for StudyProofs, or use an existing one.
2. Post the Reel and the Story from `kit/KIT-TEXT.md` (the Story's link sticker carries the tracked link; the bio link is `https://hq.amberoneai.com/studyproofs/examples?src=instagram-bio`).
3. No free API route gives a clickable link in a caption, so Amber does not post here; connecting Instagram in HQ (the same Meta login as B, with the Instagram permissions) would let her post Reels later, without links.

## H. Pinterest (15 min, by hand, clickable links)

1. Create a Pinterest business account (or convert one) at business.pinterest.com.
2. On a desktop browser, Create, **Bulk create Pins**, upload `kit/pinterest-bulk.csv` (two pins now; two more texts are in `LAUNCH-TEST-2026-10-13.md` for week 2). Each pin's link is the tracked example address.
3. Done; pins keep working for months. Pinterest's API would need its approval (weeks): not worth starting for this test.

## I. Communities (by hand, one post each, only where the written rules allow it)

- **Discord study servers** (at most three): join with your own account, read the rules channel; post the community text from `LAUNCH-APPROVAL.md` Part 2 only where self-promotion is allowed or a moderator says yes; never a direct message.
- **Facebook study groups**: your own profile; the group's pinned rules decide; the same text.
- **Quora**: two or three complete answers to real questions about making flashcards from notes, with the affiliation stated ("I make StudyProofs") and the tracked link `?src=quora`.

The texts carry the disclosure line and the sentence that invites deletion if such posts are not allowed.

## J. Listings (by hand, one form each)

- **Product Hunt**: a personal account now (a new account waits one week before it can post, or subscribe to the newsletter for immediate access); the listing text is in `LAUNCH-APPROVAL.md` Part 3; never ask for upvotes.
- **AlternativeTo**: verify your email, "Suggest new application", Part 3 text; the free queue is slow; do not buy the priority review.
- **ISTE EdTech Index**: register the product with Part 3 text (free; the privacy policy is required and exists).
- **Notion template gallery**: only if a real exam-week planner template is built first (2 to 3 hours); a template that is only an advert is refused.

## What Amber does with every post, whoever makes it

Posts Amber makes are recorded by the lane (the tracker's Promotion section: post, channel, account, state, public address, time). Posts you make by hand: tell Amber the address, or she reads them from the funnel when the first visitor arrives with that `src`; the ledger `LAUNCH-LEDGER.md` carries them. Performance is read from the tracker's funnel by `src` (visitors, sign-ups, first study set, came back, trials, checkouts, verified payments), never from platform vanity numbers.
