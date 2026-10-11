# Owner steps per channel: the exact missing requirement, and what happens the moment it is done

Written 2026-10-11. Amber is built to publish on five channels by itself, one post per weekday slot on each, with a sample image, a tip and a tracked link. **Four of the five need one step that only the owner can take** (an account made by a person, a login only the account's owner can give, or a credential only the owner may save). Nothing below asks the owner to paste a post: when a step is done, the next slot posts by itself and the result appears in the tracker on #105.

**Why Amber did not make these accounts itself.** The owner authorized normal free business-account setup and email verification with the approved business details and Amber's mailbox, and asked to be asked only for identity, CAPTCHA, 2FA or another owner-only verification. This session has no browser and no route to any outside website (every outside address fails at DNS), so it cannot open a sign-up page at all. The production worker's sign-up engine (`amber-earnings/onboarding`) will run a sign-up only for a platform whose terms it has quoted as inviting automated sign-up, and none of these platforms' terms has been read and quoted (the research could not open any page). Every one of these platforms also puts a phone check, a CAPTCHA or an identity check on a new account, which is exactly the owner-only point. So the sign-ups are listed here as the owner's, with everything else prepared. If the owner would rather have the production worker try a sign-up with the approved profile and stop at the first CAPTCHA or phone check, say so on #105 and name the platform; Amber will first have to find and quote that platform's terms on automated sign-up.

## Where each channel stands

| Channel | Posts as | Slot (UTC) | State now | The one thing missing | Who | About how long |
|---|---|---|---|---|---|---|
| Our tip pages | the website | every day 13:00 | **Ready.** Posts after the deploy; nothing to connect | nothing | nobody | 0 |
| Facebook Page | the Page | weekdays 14:00; at most 2 link posts in 30 days | Never connected (14 login links since August, none finished) | A finished Meta login that returns a Page token (see `CHANNELS.md`, "The exact missing connection") | owner | 15 min |
| Bluesky | the Bluesky account | weekdays 15:00 | Built; no account | An account for Amber One AI, and an **app password** saved in the vault as `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` | owner | 10 min |
| Threads | the Threads profile | weekdays 16:00 | Built; no Threads app credentials, no connection | The Threads use case on the Meta app, a Threads Tester role, the app id and secret in the vault, then Connect | owner | 20 min |
| LinkedIn | **your own LinkedIn profile** | Tuesday to Thursday 17:00 | Built; no developer app | A LinkedIn developer app, its keys in the vault, Connect, and a `promo-page: <your name>` line on #105 | owner | 25 min |
| Pinterest | a business account | none yet | Not built | Trial access, then Standard access approval from Pinterest (weeks) | owner, then Pinterest | start 10 min, wait weeks |
| X | n/a | none | Not offered | X's API costs money (free tier closed 2026-02-06; $0.20 a post with a link) | n/a | n/a |
| Nextdoor, Google Business Profile, Instagram | n/a | none | Not usable | See "Closed channels" below | n/a | n/a |

The tracker on #105 shows each channel's state and, when one is blocked, this table's "missing" text. Nothing posts anywhere until its row is done, and `promo: pause` on #105 stops every channel at once.

## Profile text, ready to paste (all of it passes the owner's copy rules)

- **Name:** Amber One AI
- **Handle:** `amberoneai` (Bluesky: `amberoneai.bsky.social`)
- **Short bio (150 characters; Threads and anywhere short):** Back-office pilots for small businesses: follow-up lists, invoice reminders, catalog checks. Samples use invented data; a person reviews every report.
- **Longer bio (up to 256; Bluesky and LinkedIn):** Small, hands-on back-office pilots for small businesses. Samples are made from invented data and a person reviews every report. Details: hq.amberoneai.com/offers
- **Website:** https://hq.amberoneai.com/offers
- **Picture:** https://hq.amberoneai.com/brand/amber-avatar.png
- **Banner or header (1200 x 630):** https://hq.amberoneai.com/offers/og-card.png
- **Contact email:** the approved business email (`AMBER_BUSINESS_CONTACT_EMAIL` in the vault), so the sign-up and verification mail arrives in the mailbox Amber can read.

## Bluesky (the lightest step)

1. Open bsky.app and create an account with the business email and the handle above. If Bluesky asks for a phone number or a CAPTCHA, that is the owner-only part.
2. Set the name, picture, banner and bio from the block above. If Bluesky offers a label for an automated account, turn it on (the account posts by itself).
3. Settings, Privacy and Security, **App Passwords**, Add App Password, name it "Amber promotion", and copy the password (it is shown once; **not** the account password).
4. In the Owner Vault save `BLUESKY_HANDLE` (for example `amberoneai.bsky.social`) and `BLUESKY_APP_PASSWORD`. Never paste either into chat or GitHub.
5. Done. At the next weekday 15:00Z slot Amber logs in with the app password, posts one link card (the offer's sample image, a tip, the tracked link) and reads the post back publicly. Replies and mentions are read every six hours and a draft reply is prepared for you to send; nothing is sent or followed by Amber. To cut the access off at any time, delete the app password in Bluesky.

## Threads

1. In the Meta developer dashboard open the app ("Amber api"), add the use case **Access the Threads API**, and list `threads_basic`, `threads_content_publish` and `threads_read_replies` as its permissions (a login that asks for a permission the use case does not list can be refused by Meta's dialog).
2. In the use case's settings add the Valid OAuth Redirect URI `https://hq.amberoneai.com/api/social/oauth/callback/threads`, and copy the Threads app id and secret into the Owner Vault as `THREADS_APP_ID` and `THREADS_APP_SECRET`.
3. Add the Threads profile as a **Threads Tester** under the app's roles, and accept the invitation in Threads (Settings, Account, Website permissions, Invites). A Threads profile may need an Instagram account behind it; Meta's current rule was not verified.
4. In HQ, Social Publish, Threads, press **Connect**, sign in as that profile and allow the three permissions.
5. The username should look like Amber One AI's (for example `@amberoneai`). Otherwise write `promo-page: @username` on #105.
6. Done. At the next 16:00Z slot Amber posts a text post with the link card (Threads shows no uploaded image on a link post; the page's own preview card is the picture). Amber extends the login by itself before it expires (about every 50 days). **Check against Meta's current documentation** that the long-lived token steps (`th_exchange_token`, `th_refresh_token`) are still what Meta describes: they were written from memory.

## LinkedIn (posts as you)

LinkedIn's free, self-serve route posts from **a member's own profile**, so these posts go out under the owner's name. If that is not wanted, skip LinkedIn: a Company Page route exists but needs LinkedIn's Community Management API approval (a registered organization, a review and a screen recording; reports say weeks).

1. At developers.linkedin.com create an app (LinkedIn asks for a LinkedIn Page to associate it with), and under Products add **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**. Both are self-serve.
2. On the Auth tab add the redirect URL `https://hq.amberoneai.com/api/social/oauth/callback/linkedin`. Copy the Client ID and Client Secret into the Owner Vault as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.
3. In HQ, Social Publish, LinkedIn, press **Connect**, sign in and allow.
4. Write `promo-page: <your name exactly as LinkedIn shows it>` on #105. Amber will not post from a profile whose name does not look like Amber One AI's until you say so.
5. Done. On Tuesday, Wednesday and Thursday at 17:00Z Amber posts a link card with a sample image. LinkedIn does not let this app read a post back, so each post is recorded as **accepted, not verified**, with its link; open the link to see it. LinkedIn also gives this app no way to read comments, so replies there are not read.
6. The login lasts about 60 days and LinkedIn gives self-serve apps no refresh, so press Connect again when the tracker shows it expired. The code names LinkedIn's API version in one constant (`LINKEDIN_VERSION`); LinkedIn retires versions about a year after release, and `202510` is retired on 2026-10-15.

## Facebook

Exactly as `CHANNELS.md` describes (one finished Meta login by a person who manages the Page; the app's mode, permissions and redirect address checked in the dashboard). Two things changed: the lane now holds the Page to **two link posts in 30 days** (Meta is reported to cap free Pages at about that from 2026-09-15; the tracker will say when the next one is allowed), and the posts carry the offer page's own preview card as their picture.

## Pinterest (weeks; start only if wanted)

Pinterest shows no pin to the public until its Standard access is approved, after Trial access is approved; reports say two to five weeks or more. Amber's portrait pin images (1000 x 1500) are made. To start: at developers.pinterest.com connect the app and request Trial access with the business account; Amber will then prepare the Standard access request and its demo-video script. Pinterest changes its terms on 2026-11-12.

## Closed channels, and why

- **X:** the API is paid (free tier closed to new developers on 2026-02-06; $0.20 a post that contains a link). Not offered under the no-spend rule.
- **Nextdoor:** no publishing route for a small business was found (one search only); a free Business Page posts by hand. Not built.
- **Google Business Profile:** only for a real in-person or service-area business with a profile verified for 60 days, and the API access form has a backlog; posts may not carry social links. Not built until eligibility is known.
- **Instagram:** a caption link is not clickable on the free plan, so no offer link can be tracked. Not built.
- **Medium, Hashnode, Substack, Quora:** no free posting API for a new app; posting by hand is allowed under their rules but is not something Amber can do for you.

## Optional, speeds up the tip pages

Verify hq.amberoneai.com in **Bing Webmaster Tools** and **Google Search Console** (sign in as the owner, add the site, choose the file or DNS method). The sitemap and robots.txt already list the tip pages; Amber also announces each one to search engines through IndexNow by itself. Neither is required.

## What the owner can check, any day

The tracker comment on #105 has the channel table (state, detail, what is missing), the post list with every live link or exact error, the funnel by offer and channel (visits, inquiries, qualified, paid, refunded, verified revenue), and the responses section (replies read and the draft for each). Revenue counts only a verified payment.
