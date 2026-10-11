# Group B research: free business promotion on X, Bluesky, Threads, Mastodon, Telegram

Researched 2026-10-11. Research only: no accounts created, no sign-up flows opened, nobody contacted.

## 0. How far to trust this file (read first)

- **Tooling.** WebFetch cannot reach external sites (DNS blocked), so every fact below comes from WebSearch excerpts. I never opened an official page myself. "OFFICIAL" therefore means "the search tool attributed this text or number to an official page", not "I read the page".
- **Search budget ran out.** The shared limit of 200 WebSearch calls per turn was used up after about 40 of my own searches (the other agents in the turn used the rest). X and Bluesky are well covered, Threads is partly covered, and **Mastodon and Telegram were not searched at all**. Their sections come from background knowledge (tag MEMORY), and their verdicts are provisional. Section 7 lists the exact searches still needed. I did not try to get around the limit.
- **Source tags.**
  - **OFFICIAL**: docs, help center, terms, or an official announcement account (as excerpted by the search tool).
  - **SECONDARY**: blog, news, forum, third-party documentation.
  - **INFERRED**: my own reasoning or arithmetic from the facts above it.
  - **MEMORY**: unverified background knowledge, not checked this session. Treat as a lead and re-verify before building. Where I name a URL for a MEMORY item, it is the page the owner should check, not a page I read.
- **Dates.** "date n/v" means the date was not visible in the excerpt.
- **Verdict legend.** Every verdict assumes the human owner creates each account by hand (nothing here may be scripted). INTEGRATE = nothing beyond account creation plus a credential the owner generates in their own account settings (no payment, no review, no approval). INTEGRATE-AFTER-OWNER-STEP = one more named owner-only gate comes first (developer-app creation, tester consent, instance approval, bot creation).

## 1. Summary table

| Platform | Verdict | Free write API for a new small business? | Owner-only step(s), exactly | Audience fit (INFERRED) | Evidence quality |
|---|---|---|---|---|---|
| X (Twitter) | **MANUAL-ONLY** (an official API exists but is paid only) | No. Free tier closed to new developers on 2026-02-06. Pay-per-use: $0.015 per post, **$0.20 per post that contains a URL**, prepaid credits | Owner posts by hand in the X composer. API route would need the owner to buy credits, which breaks the no-spend rule | Medium: e-commerce sellers and bookkeeping niches present, contractors mostly not | High on pricing (official changelog 2026-04-16) |
| Bluesky | **INTEGRATE** | Yes. Free, self-serve, no review | Create the account in the official app (email; phone/captcha possible, unconfirmed). Generate an App Password (Settings > Privacy and Security > App Passwords). Optionally self-label the profile as a bot | Low: skews tech, media, academia | Medium-high; some details unverified |
| Threads | **INTEGRATE-AFTER-OWNER-STEP** | Yes. Role-holders need no App Review | Create a Meta developer app with the "Access the Threads API" use case; add the owner's own Threads profile as a Threads Tester and accept the invite in Threads; run the OAuth consent once to mint a token. Threads profile itself historically needs an Instagram account (current rule unverified) | Medium: broad US consumer base, extension of Instagram | Medium; rate-limit and sign-up details partly unverified |
| Mastodon | **INTEGRATE-AFTER-OWNER-STEP** (provisional, MEMORY only) | Yes (open REST API; instance rules vary) | Pick an instance whose written rules allow organization/commercial accounts and bots; register by hand (may need admin approval); create an access token under Preferences > Development (write:statuses, write:media, read:notifications) | Low | **Not researched** (budget exhausted) |
| Telegram channel | **INTEGRATE-AFTER-OWNER-STEP** (provisional, MEMORY only; lowest priority) | Yes (Bot API is free) | Create the channel and the bot (via @BotFather) in the Telegram app on a phone-verified account; add the bot as channel admin with the Post Messages right | Low; audience is zero until built, and the owner's rules forbid cold outreach | **Not researched** (budget exhausted) |

Suggested order if the owner wants to build (INFERRED): Bluesky first (cheapest, fully free), Threads second (free, more setup), X by hand, Mastodon and Telegram only if wanted after verification.

## 2. Cross-platform notes

- **Image plus link in one post is constrained everywhere.**
  - X: attach a native image and the URL stays as text; a link card is not shown when media is attached (MEMORY). Without media, the landing page needs Twitter Card / Open Graph tags (MEMORY).
  - Bluesky: a post embed is one type, so a post has either images or a link card, not both (MEMORY, atproto lexicon `app.bsky.feed.post`). Best fit: link card (`app.bsky.embed.external`) whose thumbnail is the sample image, plus a link facet in the text.
  - Threads: `link_attachment` works for text-only posts, not image, video or carousel posts (OFFICIAL excerpt, section 4).
- **Human-only steps on every platform:** creating the account, solving any CAPTCHA, verifying email/phone, and any OAuth consent screen. None of these may be scripted.
- **Safe posting habits that fit the owner's hard limits (INFERRED):** vary the wording of each post, one link per post, a real sample image with alt text, no tagging of non-customers, no auto-replies, no DMs, and modest cadence. Label the account as automated where a platform asks for it and posts go out unattended (X "Automated" label, Bluesky `bot` self-label).

---

## 3. X (Twitter)

**Verdict: MANUAL-ONLY.** The official API (`POST /2/tweets`) can post text, link and image, but since February 2026 there is no free tier for new developers. Posting a link costs $0.20 per post from prepaid credits. That is a paid plan under the owner's rules.

### 3.1 Business promotion
- Organic promotional posts on your own account are normal use. The spam policy targets "commercially-motivated spam ... that typically aims to drive traffic or attention from a conversation on X to accounts, websites, products, services, or initiatives". **OFFICIAL** https://help.x.com/rules-and-policies/platform-manipulation (date n/v). My reading, **INFERRED**: this is about hijacking other people's conversations (unsolicited replies and mentions, trend-jacking), not posts on your own timeline.
- Repeated posts are not a violation on their own but are reviewed under the spam policy. **OFFICIAL** https://help.twitter.com/en/rules-and-policies/copypasta-duplicate-content (date n/v). **INFERRED**: vary the text of each post.
- No special account type or disclosure is needed for organic self-promotion. X has no Pages; a business is a normal account. **INFERRED**.
- **Link reach is contested.**
  - Elon Musk replied "We haven't for over a year" when Paul Graham asked whether X still penalizes links; the reply is dated 2026-07-29, and X's head of product Nikita Bier had just told Mark Zuckerberg links no longer need to go in replies. No formal policy page. **SECONDARY** https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/ ; https://siecledigital.fr/2026/07/31/elon-musk-affirme-que-x-ne-penalise-plus-les-publications-contenant-un-lien-externe/ (2026-07-31) ; https://techtrendske.co.ke/2026/08/01/x-link-penalty-elon-musk/ (2026-08-01).
  - Several marketing blogs claim 30-50% reach loss, or zero median engagement, for non-Premium accounts that post links since March 2025 or March 2026. The excerpt did not say which blog; candidates in the same result set: https://www.socialpilot.co/blog/twitter-algorithm and https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works. **SECONDARY**, unverified, and they conflict with Musk's statement.
  - Net: **unknown**. Plan for some risk of lower reach on link posts.

### 3.2 Free tier and cost
- **No free tier for new developers.** X Developers announced "Officially launching X API Pay-Per-Use" with: "Only for-good Public Utility apps will continue to get Free scaled X API access"; "Legacy Free (recently active) API users will move to Pay-Per-Use with a one-time $10 voucher"; "Basic & Pro X API plans will remain available with the ability to opt-in to ..." (truncated). **OFFICIAL** https://x.com/XDevelopers/status/2019881223666233717 and https://x.com/XDevelopers/status/2019881225587167406. Post date 2026-02-06, decoded from the post IDs (**INFERRED**; secondary sources also say 6 Feb 2026: https://opentweet.io/answers/is-the-x-api-free-in-2026 , last updated Aug 2026, and https://roboin.io/article/en/2026/02/08/x-transitions-api-to-pay-per-use-model-ending-free-plan/).
- Docs: "No subscriptions - pay only for what you use"; credits are bought upfront in the Developer Console and deducted per request. **OFFICIAL** https://docs.x.com/x-api/getting-started/pricing (date n/v). A forum reply says "We no longer offer a Free tier" (author role not verified): https://devcommunity.x.com/t/so-there-is-no-free-plan-anymore/267341 .
- Legacy Basic ($200/month) subscribers were moved to pay-per-use from 2026-06-01. **OFFICIAL announcement thread** https://devcommunity.x.com/t/important-update-legacy-x-api-basic-plans-are-moving-to-pay-per-use-ppu/266305 (date n/v); date from **SECONDARY** https://opentweet.io/how-to/migrate-x-api-basic-to-pay-per-use (2026-08-31).
- **Write prices.** `POST /2/tweets` is $0.015 per post; **posts containing a URL are $0.20 per post**; summoned replies $0.01. Entry dated 2026-04-16, effective 2026-04-20. **OFFICIAL** https://docs.x.com/updates/changelog . Pricing page also lists Post: Read $0.005/resource, User: Read $0.010, DM Event: Read $0.010, "Owned Reads" $0.001/resource. **OFFICIAL** https://docs.x.com/x-api/getting-started/pricing . Corroborated by **SECONDARY** https://posteverywhere.ai/blog/x-twitter-api-pricing (Sept 2026) and https://pbxscience.com/x-overhauls-api-pricing-cheaper-reads-steeper-costs-for-url-posts/ (2026-08-25).
- **Monthly post cap on writes:** unknown for pay-per-use (not found). Old free-tier caps quoted in 2026 guides conflict (500 vs 1,500 posts per month) and predate February 2026, so they are not usable. **SECONDARY** https://elfsight.com/blog/how-to-get-x-twitter-api-key-in-2026 .
- **Media upload cost:** unknown. The official pricing summary I could see has no separate upload line. A secondary table lists "Add media metadata" at $0.005 per request. **SECONDARY** https://postproxy.dev/blog/x-api-pricing-2026 .
- **Cost for an image-plus-link post by API:** at least $0.20 plus any media charge. Example arithmetic: 30 such posts a month is $6.00 before media, plus an unknown minimum credit purchase. **INFERRED** from the official price.
- Prepaid credits are required (credits are bought upfront, **OFFICIAL** pricing page above). Guides in the result set add that a payment method must be on file before any call (**SECONDARY**, not attributable to one page; e.g. https://opentweet.io/how-to/x-api-pay-per-use-explained ). Minimum credit purchase: unknown.

### 3.3 Publishing automation
- Official API: `POST /2/tweets` (**OFFICIAL** changelog above). Image upload is v2 `POST /2/media/upload` (**OFFICIAL** https://docs.x.com/x-api/media/upload-media.md ). Size limits image 5 MB, GIF 15 MB, video 512 MB (**OFFICIAL** https://docs.x.com/x-api/media/introduction.md ); up to 4 photos, or 1 GIF, or 1 video per post (**OFFICIAL** best-practices page, Japanese-locale copy https://docs.x.com/ja/x-api/media/quickstart/best-practices.md ).
- Upload needs OAuth 2.0 user context with a `media.write` scope, and a text-only token can get 403 on upload. **SECONDARY** https://bundle.social/blog/x-api-media-upload (2026-08-09), https://opentweet.io/how-to/upload-media-x-api . v1.1 upload was deprecated for self-serve developers in 2025 (31 Mar 2025 per a quoted X email, 9 Jun 2025 per another vendor), and sources disagree on whether v1.1 still works in 2026. **SECONDARY** https://community.make.com/t/twitter-x-api-update-due-to-legacy-media-endpoints-being-depreciated/74243 ; https://docs.emplifi.io/platform/latest/home/june-5-2025 .
- Self-serve vs review: pay-per-use sign-up appears self-serve (Developer Console, credits). No source says a review step exists; none says it does not. **Unknown**. The older flow asked for a use-case description (section 3.4).
- Write access free? **No.** Rate limits under pay-per-use: **unknown** (not found).
- Posting as an organization vs a person: no difference; X has no Pages. **INFERRED**.
- Platform's own scheduler: sources conflict on whether free accounts can schedule in the web composer (several vendor blogs say yes; others say Premium only; X Pro/TweetDeck is paid since Aug 2023). **SECONDARY**, unresolved. https://socialk.it/en/how-to/how-to-schedule-x-twitter-posts-free ; https://publer.io/blog/tweetdeck-is-no-longer-free/ ; https://www.bostonglobe.com/2023/08/16/business/elon-musk-now-is-requiring-users-x-pay-access-tweetdeck . The owner should check whether the calendar icon appears in the desktop composer.

### 3.4 Account setup
- X account: signing-up help page https://help.x.com/en/using-x/create-x-account (**OFFICIAL**, contents not seen). Email or phone, date of birth, and an anti-bot challenge are typical (**MEMORY**).
- Developer account (older flow, page still lists Free/Basic/Pro): log in to X, verify email (phone verification may be needed), open the developer portal, enter account name, location and use case, accept the Developer Agreement, confirm by emailed link. **OFFICIAL** https://developer.x.com/en/support/x-api/developer-account1 (date n/v, partly outdated). Developer Console docs: https://docs.x.com/fundamentals/developer-portal .
- Scripted account creation: no API for it. The automation rules say scraping or browser automation in place of the API can lead to permanent suspension. **OFFICIAL** https://help.x.com/en/rules-and-policies/x-automation (page dated April 2026 per the excerpt).
- Human-only: create the account, verify email/phone, accept the developer agreement, add payment (API route only), authorize the app.

### 3.5 Automation rules
- If automated activity breaks the X Rules or automation rules, X may filter posts from search or suspend the account; the account holder is responsible for connected apps. **OFFICIAL** https://help.x.com/en/rules-and-policies/x-automation (April 2026).
- Labeling: automated accounts are marked with an "Automated" label (https://help.x.com/en/using-x/automated-account-labels , **OFFICIAL**). The Developer Agreement page says automated accounts using the API must enable the Automated label in app settings and should say in the bio that the account is a bot and who runs it; non-automated tools such as analytics dashboards are exempt. **OFFICIAL** https://docs.x.com/developer-guidelines (excerpt; exact wording not seen). **INFERRED**: if posts go out unattended, enable the label.
- Spam triggers: unsolicited messages, bulk or unsolicited replies and mentions, ignoring opt-outs. **OFFICIAL** (developer guidelines: do not spam or send unsolicited messages) and **SECONDARY** https://www.unfollr.com/blog/twitter-automation-rules , https://opentweet.io/x-automation-rules (Aug 2026).

### 3.6 Reading replies and mentions
- No free reads for new developers. `GET /2/users/{id}/mentions` and `GET /2/users/{id}/tweets` count as "Owned Reads" at $0.001 per resource when `{id}` is the authenticated user and that user owns the developer app. **OFFICIAL** https://docs.x.com/x-api/getting-started/pricing . Reading other posts is $0.005 per resource. A monthly cap on post reads is reported as 2 million or 3 million (sources conflict, **SECONDARY**; irrelevant at this scale).
- Scopes: tweet.read and users.read for OAuth 2.0 (**MEMORY**).

### 3.7 Audience fit: medium
E-commerce sellers and "accounting" niches are active on X, contractors mostly are not. **INFERRED**; no data found.

### 3.8 Verdict: MANUAL-ONLY
Reason: the only official write path costs money ($0.20 per post with a link plus prepaid credits). If the owner later accepts spend, it becomes INTEGRATE-AFTER-OWNER-STEP (owner buys credits and authorizes the app).

---

## 4. Bluesky

**Verdict: INTEGRATE.** Free, self-serve official API with app passwords, no review, generous rate limits. The owner creates the account and an app password by hand.

### 4.1 Business promotion
- No business-account type. Promotional posts with a link are not prohibited by anything found. Spam, per the developer guidelines, includes "generating automated or bulk interactions, including any that would cause a notification to a user like a message, follow, like or reply", and any method to automate generating followers or interactions, "including account generation tools". **OFFICIAL** https://docs.bsky.app/docs/support/developer-guidelines (date n/v).
- Community Guidelines were overhauled: announced 2025-08-14, in force 2025-10-15, moderation process updated 2025-11-19. A guide quotes "Do not send spam or repeatedly post content in ways that disrupt normal conversations or service use". **SECONDARY** https://techcrunch.com/2025/08/14/bluesky-rolls-out-massive-revamp-to-policies-and-community-guidelines ; https://ppc.land/bluesky-updates-community-guidelines-ahead-of-october-15-implementation/ ; **OFFICIAL blog** https://www.bsky.social/about/blog/11-19-2025-moderation-updates . I did not see the guidelines page itself (https://bsky.social/about/support/community-guidelines).
- Link suppression or reach penalty: none found in any source. One anecdotal essay says posting frequency or link repetition can draw spam labels on non-bot accounts. **SECONDARY, anecdote** https://write.as/vinterkarusell/the-platform-that-was-supposed-to-save-social-media-is-eating-its-own-users . Net: **unknown**; vary the text and avoid repeating the same link in a burst (**INFERRED**).

### 4.2 Free tier
- Free to use. Nothing requires payment to publish or be seen (no paid tier found).
- Rate limits on hosted accounts: 5,000 points per hour and 35,000 per day; CREATE costs 3 points, UPDATE 2, DELETE 1 (so 1,666 creates per hour and 11,666 per day); these sit on top of HTTP limits, including an overall 3,000 requests per 5 minutes per IP. **OFFICIAL** https://docs.bsky.app/docs/advanced-guides/rate-limits and https://docs.bsky.app/blog/rate-limits-pds-v3 (dates n/v). Far above what 7 offers need.
- A `createSession` limit of 300 per day per account is reported by one vendor (**SECONDARY**, unverified) https://adaptlypost.com/blog/bluesky-api-rate-limit ; store and reuse the refresh token instead of logging in each run (**INFERRED**).

### 4.3 Publishing automation
- Official XRPC API on the hosted PDS. Flow: `com.atproto.server.createSession` (identifier + app password), `com.atproto.repo.uploadBlob` for each image, then `com.atproto.repo.createRecord` with collection `app.bsky.feed.post`. The official tutorial shows blobs embedded in the record and a link card as an `app.bsky.embed.external` embed with a thumbnail blob; it advises stripping image metadata before upload. **OFFICIAL** https://docs.bsky.app/docs/tutorials/creating-a-post (date n/v).
- Link facets (clickable link in the text) use UTF-8 byte offsets (**SECONDARY** https://dev.to/piotrkulpinski/how-to-post-a-link-with-embed-card-on-bluesky-with-javascript-4bll ; **MEMORY** for the exact fields).
- Text limit 300 characters (graphemes) (**SECONDARY** https://adaptlypost.com/blog/bluesky-image-size-limit ). Up to 4 images per post (**SECONDARY**; one vendor lists 10 and a newer gallery embed is mentioned, so the exact cap is conflicting, but one image is all we need).
- **Image size:** older docs say 1 MB. One 2026 source says the cap is now 2,000,000 bytes, dated to an app release reported by TechCrunch in April 2026, and says link-card thumbnails are capped at 1,000,000 bytes. **SECONDARY, conflicting** https://opentweet.io/answers/bluesky-image-size-limit (Sept 2026). **INFERRED safe default:** keep every image and thumbnail under 1,000,000 bytes.
- Auth: App Passwords still work. The AT Protocol guides say password auth is acceptable for bots and command-line tools, while apps with an end-user login should use OAuth, and advise a dedicated app password rather than the main password. **OFFICIAL** https://atproto.com/guides/sdk-auth ; https://atproto.com/guides/auth . The Bluesky-hosted TypeScript README marks app-password sessions deprecated in favor of OAuth (**SECONDARY** https://cdn.jsdelivr.net/npm/@atproto/api@0.20.31/README.md). No removal date found.
- Review: none. Self-serve. Posting as an organization is the same as posting as a person (single account type, **INFERRED**); a custom-domain handle is a free way to show the business identity (**MEMORY**).
- Write access free: yes.

### 4.4 Account setup
- The `com.atproto.server.createAccount` call exists and takes optional invite and verification codes; `describeServer` reports a `phoneVerificationRequired` flag, and when true a phone verification token must be supplied. **SECONDARY** (third-party mirror of the lexicon, updated Feb 2026) https://www.withone.ai/knowledge/bluesky/conn_mod_def%3A%3AGJ0MoEPl2Gc%3A%3AaLrUj0-sSwixJBn07myunA . Official phone-verification endpoints I saw (`app.bsky.contact.startPhoneVerification` / `verifyPhone`) are for contact import, not sign-up: **OFFICIAL** https://docs.bsky.app/docs/api/app-bsky-contact-start-phone-verification .
- **Does bsky.social require phone or captcha today? Unconfirmed.** Consumer guides conflict (one lists a phone step, another lists "email or phone"), both undated: https://www.trustedreviews.com/how-to/how-to-sign-up-for-bluesky-without-an-invite-4415158 ; https://help.practicepanda.com/en/articles/12693137-how-to-create-a-bluesky-account-for-your-business . The only captcha mention found is an August 2024 Android release note. The owner should expect to see them and complete them by hand.
- Scripted sign-up: do not. Account generation tools are named as spam in the developer guidelines (**OFFICIAL**, above).
- Owner-only: sign up in the official app, confirm email, optional 2FA, create an App Password (Settings > Privacy and Security > App Passwords; shown once; leave the "Allow access to your direct messages" box unchecked for posting). **SECONDARY** https://help.postpone.app/platforms/bluesky/connecting-bluesky ; https://help.ocoya.com/en/articles/16555704 .

### 4.5 Automation rules
- Bots are allowed. The Bluesky bots guidance says bot accounts should identify themselves with a self-label on the profile and should only like, repost or reply to users who tagged the bot (opt-in), or the bot may be taken for spam. **SECONDARY quoting the official docs** https://opentweet.io/how-to/build-a-bluesky-bot (official page not seen). The official AT Protocol bot tutorial writes a `selfLabels` value `bot` into the profile record. **OFFICIAL** https://atproto.com/guides/bot-tutorial .
- Spam triggers: bulk or automated interactions that notify others (follows, likes, replies, messages), account generation tools (developer guidelines, **OFFICIAL**).
- **INFERRED**: a one-way publisher that posts original content and never replies or follows automatically fits the rules; add the `bot` self-label if posts go out unattended.

### 4.6 Reading replies
- `app.bsky.notification.listNotifications` ("Enumerate notifications for the requesting account. Requires auth.") returns notifications for the signed-in account. **OFFICIAL** https://docs.bsky.app/docs/api/app-bsky-notification-list-notifications . Reasons include reply, mention, quote, like, repost, follow; `limit` 1-100. **SECONDARY** https://atp.readthedocs.io/en/latest/atproto/atproto_client.models.app.bsky.notification.list_notifications.html .
- An app-password session can read these; the DM scope is a separate checkbox on the app password (**SECONDARY**, section 4.4 links). Fetching a full thread uses `app.bsky.feed.getPostThread` (**MEMORY**).

### 4.7 Audience fit: low
Bluesky skews toward tech, media and academia; few US contractors or e-commerce sellers. **INFERRED**; no data found. Cost of adding it is near zero.

### 4.8 Verdict: INTEGRATE
Owner steps (human only): create the account, solve any phone/captcha challenge, create an app password.

---

## 5. Threads

**Verdict: INTEGRATE-AFTER-OWNER-STEP.** The Threads API publishes text, images and link cards for free. For the owner's own profile no App Review is needed. The owner must set up a Meta developer app, add their own Threads profile as a tester, and approve the OAuth consent.

### 5.1 Business promotion
- No Pages concept; business posts come from a Threads profile. No Threads-specific ban on promotional posts with links was found. Meta-wide spam rules apply (**MEMORY**; not looked up).
- Link handling (**OFFICIAL**, Threads Posts documentation, last updated April 2026 per the excerpt): https://developers.facebook.com/docs/threads/posts/ and https://developers.facebook.com/documentation/threads/posts
  - The `link_attachment` parameter on container creation produces a preview card; if omitted, the first link in a text-only post becomes the link attachment.
  - **It only works for text-only posts, not image, video or carousel posts.**
  - A post may contain 5 or fewer links; since 2025-12-22 over-limit posts fail at container creation with `THREADS_API__LINK_LIMIT_EXCEEDED`.
  - Text posts are capped at 500 characters (emoji counted by UTF-8 bytes).
- Link reach penalty: **unknown** (not researched).

### 5.2 Free tier
- Free profile; no API fee found. **Limit: 250 API-published posts per 24-hour moving window per profile**; a carousel counts as one; enforced at publish; usage can be read from the `threads_publishing_limit` endpoint (needs `threads_basic` and `threads_content_publish`). **OFFICIAL** https://developers.facebook.com/docs/threads/overview (date n/v). Meta recommends apps enforce the limit themselves too.
- Reply and read limits: unknown (not found; see section 7).

### 5.3 Publishing automation
- Two steps: `POST /{threads-user-id}/threads` creates a media container, then `POST /{threads-user-id}/threads_publish` publishes it. **OFFICIAL** https://developers.facebook.com/docs/threads/posts/ . Image posts need a publicly reachable image URL (**MEMORY**), so host sample images on hq.amberoneai.com.
- Permissions: `threads_basic` (required) and `threads_content_publish`. **OFFICIAL** (overview page above).
- **Access: role-holders vs App Review.** "Threads testers can grant your app these permissions at any time. In order for app users without a role on your app to be able to grant your app these permissions, each permission must first be approved through the App Review process, and your app must be published." **OFFICIAL** https://developers.facebook.com/docs/threads/get-started . So posting only to the owner's own profile, with the owner as app admin/developer/tester, needs **no App Review**. App Review only matters if non-role users must authorize the app.
- If review were needed (not our case): one guide says each permission needs its own submission with a screencast of the exact user flow and takes 2-4 weeks per permission; another says Tech Provider verification takes about a week. **SECONDARY** https://postproxy.dev/blog/how-to-post-to-threads-via-api/ ; https://bundle.social/blog/threads-posting-api (2026-08-15); the excerpt did not say which one. Not verified against Meta docs.
- **Versus Facebook Login:** the Threads API is its own Meta app use case, "Access the Threads API", with its own `threads_*` permissions and its own authorization dialog (**OFFICIAL title** https://developers.facebook.com/docs/development/create-an-app/threads-use-case ; page body not seen). A Facebook Page or Facebook Login is not part of the flow (**MEMORY**, high confidence). Tokens: a short-lived token is exchanged for a long-lived one (about 60 days) that must be refreshed (**MEMORY**).
- Posting as a Page/organization: not applicable; posts go out as the authorized Threads profile (**INFERRED**).
- Write access free: yes. Scheduling: use your own scheduler against the API; Meta recommends enforcing the 250/24h limit in the app.

### 5.4 Account setup
- Needs a Threads profile. Historically it had to be created through an Instagram account; **whether that still holds in late 2026 is unverified**. Needs a Meta developer account and app (**MEMORY**: login with 2FA/phone verification may be asked).
- Scripted sign-up: no API exists; Instagram's terms bar automated account creation (**MEMORY**). Do not script.
- Owner-only: create or confirm the Threads profile; create the Meta developer app (use case "Access the Threads API"); add the profile as a Threads Tester and accept the invite in Threads account settings; approve the OAuth consent; keep the token fresh.

### 5.5 Automation rules
- The API is the sanctioned automation route. Whether Threads requires an "automated" label: unknown (not found). Spam behavior that triggers enforcement: not researched. **INFERRED**: original posts at low cadence through the API are the intended use; avoid unsolicited replies and mass mentions.

### 5.6 Reading replies
- `threads_read_replies` is the permission for reading replies to your posts, and `threads_manage_replies` is for replying or hiding (**MEMORY**, not seen in the excerpts). Role-holders can grant any permission without review (OFFICIAL quote in 5.3). Rate limits for reads: unknown.

### 5.7 Audience fit: medium
Large general US consumer audience tied to Instagram; small-business owners are present, but there is little niche targeting for contractors or bookkeepers. **INFERRED**; no data found.

### 5.8 Verdict: INTEGRATE-AFTER-OWNER-STEP
Named step: create the Meta developer app with the "Access the Threads API" use case, add the owner's own Threads profile as a Threads Tester and accept the invite, then run the OAuth consent once to obtain a token. No App Review needed while only role-holders use the app.

---

## 6. Mastodon and Telegram (NOT researched: budget exhausted; everything here is MEMORY)

I could not run a single search for these two platforms. Nothing below is verified this session. Use it only to plan the follow-up searches in section 7.

### 6.1 Mastodon (provisional verdict: INTEGRATE-AFTER-OWNER-STEP, audience low)

1. **Business promotion.** Policy is per instance, not central. Whether any instance explicitly welcomes business or organization accounts and bots is **unknown**. The directory https://joinmastodon.org/servers lets you filter servers and shows their prohibited-content lists (**MEMORY**); each instance's `/about` page holds its rules. Self-promotion is often poorly received in the culture (**INFERRED**). No link suppression: Mastodon has no ranking algorithm (**MEMORY**).
2. **Free tier.** Most instances are free; no post cap in the software; hosted paid services exist but are not needed. Per-instance limits possible.
3. **Publishing automation.** Open REST API: `POST /api/v1/statuses` (scope `write:statuses`), media via `POST /api/v2/media` (scope `write:media`) with alt text, then attach `media_ids`. Easiest credential: Preferences > Development > New application, which gives an access token directly (**MEMORY**). https://docs.joinmastodon.org/methods/statuses/ ; https://docs.joinmastodon.org/methods/media/ ; https://docs.joinmastodon.org/methods/apps/ . Default rate limits are about 300 requests per 5 minutes, with tighter limits on media uploads and deletes; instances can change them (**MEMORY**, check https://docs.joinmastodon.org/api/rate-limits/). No review. Posting as an organization is the same as a person.
4. **Account setup.** Instance-dependent: open, approval-required, or invite-only; email confirmation; sometimes a captcha; phone number not typical (**MEMORY**). The API has `POST /api/v1/accounts` for registration, but instances control it and scripted sign-up would break most instance rules and the owner's rules. Do not script. Human-only: pick the instance, register, wait for approval, create the token.
5. **Automation rules.** Mastodon has a profile setting that flags an account as automated (bot) (**MEMORY**, https://docs.joinmastodon.org/user/profile/). Whether a given instance allows bots or commercial accounts is **unknown** and must be read from its rules.
6. **Reading replies.** `GET /api/v1/notifications` (scope `read:notifications`) and `GET /api/v1/statuses/:id/context` (**MEMORY**).
7. **Audience fit: low** (tech and open-source leaning; **INFERRED**).
8. **Verdict (provisional): INTEGRATE-AFTER-OWNER-STEP.** Named step: choose an instance whose written rules allow organization/commercial accounts and bots, register by hand (admin approval may apply), and create an access token. If no instance qualifies, the verdict falls to NOT-ALLOWED for this promotion.

### 6.2 Telegram channel (provisional verdict: INTEGRATE-AFTER-OWNER-STEP, lowest priority)

1. **Business promotion.** The Terms of Service bar using Telegram to send spam or scam users and several illegal-content categories (**MEMORY**, https://telegram.org/tos ; bot rules at https://telegram.org/tos/bot-developers). Posting your own business content in a channel you own is not prohibited (**INFERRED**). Telegram Ads are paid, so out of scope.
2. **Free tier.** The Bot API is free. Documented bot send limits are roughly 1 message per second per chat, up to about 20 messages per minute in a group, and about 30 messages per second for bulk sends (**MEMORY**, https://core.telegram.org/bots/faq). A handful of posts per day is far below any limit.
3. **Publishing automation.** Bot API `sendMessage` / `sendPhoto` with HTML links, posting to `@channelusername` or the numeric chat id, once the bot is a channel administrator with the Post Messages right (**MEMORY**, https://core.telegram.org/bots/api). Self-serve; no review. Posts appear under the channel name.
4. **Account setup.** A Telegram account needs a phone number and SMS code. The channel is created in the app by the owner. The bot is created by talking to @BotFather in the app; there is no sign-up script path (**MEMORY**). Human-only: all of it.
5. **Automation rules.** Bots are a first-class feature; spam behavior (mass invites, unsolicited messages) triggers restrictions (**MEMORY**).
6. **Reading replies.** A channel's comments live in a linked discussion group; a bot in that group can receive them as updates (**MEMORY**).
7. **Audience fit: low.** The audience is zero until built. Telegram is little used among US contractors and small sellers (**INFERRED**), and the owner's rules rule out cold invites or DMs, so growth would depend on linking the channel from the website.
8. **Verdict (provisional): INTEGRATE-AFTER-OWNER-STEP**, but not worth building before Bluesky and Threads.

---

## 7. Research gaps and the exact searches still needed

The shared search budget ended. To finish, the owner or caller can send a follow-up after this reply, or raise `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`.

1. **Mastodon (nothing verified).**
   - docs.joinmastodon.org pages: api/rate-limits, methods/accounts (create), methods/apps, methods/statuses, methods/media, user/profile (bot flag).
   - Instance rules: mastodon.social, mastodon.online, mas.to and any instance whose rules mention "commercial", "business", "organization", "advertising" or "bots". Current registration mode of each (open, approval, invite).
   - Whether any instance explicitly welcomes small-business accounts.
2. **Telegram (nothing verified).**
   - core.telegram.org/bots/faq (limits) and /bots/api (channel posting, `sendPhoto` size and caption limits).
   - telegram.org/tos and /tos/bot-developers (promotion and spam wording).
   - Channel-creation requirements and how a brand-new public channel is discovered.
3. **Threads.**
   - Reply and read rate limits.
   - Whether a Threads profile can be created without Instagram in 2026.
   - Re-confirm `link_attachment` is text-only and how a URL in an image post's text renders.
   - Token lifetime and refresh.
   - Exact setup steps for the "Access the Threads API" use case and whether development-mode publishing needs Business Verification.
   - Link reach on Threads, and any "automated account" label.
4. **Bluesky.**
   - Read the atproto lexicons: `com.atproto.server.createAccount`, `describeServer`, `app.bsky.feed.post`, `app.bsky.embed.images` and `.external` (size caps).
   - Whether bsky.social currently requires phone or captcha at sign-up.
   - The official bots page (docs.bsky.app/docs/starter-templates/bots) and the Community Guidelines text on spam and commercial content.
   - `createSession` rate limits.
5. **X.**
   - Price of media upload under pay-per-use.
   - Whether the free web composer can schedule posts.
   - Pay-per-use rate limits for `POST /2/tweets`.
   - Minimum credit purchase and whether any new-signup voucher exists today (sources conflict: one says a small credit, another says none).

## 8. Source index (every URL above, by platform)

**X**: https://docs.x.com/x-api/getting-started/pricing ; https://docs.x.com/updates/changelog ; https://docs.x.com/x-api/fundamentals/post-cap ; https://docs.x.com/x-api/media/introduction.md ; https://docs.x.com/x-api/media/upload-media.md ; https://docs.x.com/developer-guidelines ; https://docs.x.com/fundamentals/developer-portal ; https://x.com/XDevelopers/status/2019881223666233717 ; https://x.com/XDevelopers/status/2019881225587167406 ; https://devcommunity.x.com/t/so-there-is-no-free-plan-anymore/267341 ; https://devcommunity.x.com/t/important-update-legacy-x-api-basic-plans-are-moving-to-pay-per-use-ppu/266305 ; https://help.x.com/en/rules-and-policies/x-automation ; https://help.x.com/en/using-x/automated-account-labels ; https://help.x.com/rules-and-policies/platform-manipulation ; https://help.twitter.com/en/rules-and-policies/copypasta-duplicate-content ; https://developer.x.com/en/support/x-api/developer-account1 ; https://help.x.com/en/using-x/create-x-account ; secondary: https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/ ; https://opentweet.io/answers/is-the-x-api-free-in-2026 ; https://posteverywhere.ai/blog/x-twitter-api-pricing ; https://bundle.social/blog/x-api-media-upload .

**Bluesky**: https://docs.bsky.app/docs/advanced-guides/rate-limits ; https://docs.bsky.app/blog/rate-limits-pds-v3 ; https://docs.bsky.app/docs/tutorials/creating-a-post ; https://docs.bsky.app/docs/support/developer-guidelines ; https://docs.bsky.app/docs/api/app-bsky-notification-list-notifications ; https://atproto.com/guides/sdk-auth ; https://atproto.com/guides/auth ; https://atproto.com/guides/bot-tutorial ; https://www.bsky.social/about/blog/11-19-2025-moderation-updates ; secondary: https://opentweet.io/how-to/build-a-bluesky-bot ; https://opentweet.io/answers/bluesky-image-size-limit ; https://www.withone.ai/knowledge/bluesky/conn_mod_def%3A%3AGJ0MoEPl2Gc%3A%3AaLrUj0-sSwixJBn07myunA .

**Threads**: https://developers.facebook.com/docs/threads/overview ; https://developers.facebook.com/docs/threads/get-started ; https://developers.facebook.com/docs/threads/posts/ ; https://developers.facebook.com/docs/development/create-an-app/threads-use-case ; secondary: https://postproxy.dev/blog/how-to-post-to-threads-via-api/ ; https://bundle.social/blog/threads-posting-api .

**Mastodon / Telegram (MEMORY, not opened)**: https://docs.joinmastodon.org/api/rate-limits/ ; https://joinmastodon.org/servers ; https://core.telegram.org/bots/api ; https://core.telegram.org/bots/faq ; https://telegram.org/tos .
