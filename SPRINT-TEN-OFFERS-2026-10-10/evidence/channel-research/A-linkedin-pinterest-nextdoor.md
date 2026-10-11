# Group A research: LinkedIn, Pinterest, Nextdoor (free promotion for Amber One AI)

Research date: 2026-10-11. Research only: no account created, no sign-up flow opened, nobody contacted.

Tags used on every non-trivial fact:
- OFFICIAL = the cited URL is an official platform page (docs, help center, terms, press room).
- SECONDARY = blog, vendor, forum, news, community post.
- INFERRED = my reasoning from the facts above it (no source says it directly).
- "n/d" = no date visible in the search result.

## 0. Method, limits and gaps (read first)

- WebFetch was tried once and failed (`getaddrinfo ENOTFOUND blog.nextdoor.com`), as the brief warned. Every fact below comes from WebSearch result summaries. OFFICIAL therefore means "an official page, as summarized by the search tool". I did not read full page text. Quotation marks mark wording the search tool presented as a quote; re-read the live page before relying on exact wording in a policy-sensitive build.
- The shared per-turn WebSearch cap (200 searches across all agents) was reached after about 51 of my searches. The final search (an extended-mode check of Pinterest's developer-guidelines wording) was refused. I did not work around the cap.
- Coverage: LinkedIn and Pinterest are well covered. **Nextdoor got ONE search.** For Nextdoor, the API question, verification steps, automation rules, link behavior, comment reading and current posting limits were NOT researched. Those answers are "unknown" and the Nextdoor verdict is provisional. Follow-up queries are in section 6.
- Pinterest's Terms of Service and Community Guidelines are being revised with changes effective **2026-11-12** (OFFICIAL, https://policy.pinterest.com/en/terms-of-service and https://policy.pinterest.com/en/community-guidelines; guidelines page "last updated May 2026"). Re-check after that date.
- LinkedIn Marketing API versions are sunset about 12 months after release: version 202508 sunset 2026-08-17 and **version 202510 sunsets 2026-10-15** (OFFICIAL notices on https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-11 and the Posts API page). Any `Linkedin-Version` header in new code must be a newer version listed on the live Posts API page.

## 1. Verdict table

| Platform / route | Verdict | Exact owner step or approval | Audience fit | Confidence |
|---|---|---|---|---|
| LinkedIn, personal profile (Share on LinkedIn, `w_member_social`, Posts API) | **INTEGRATE** | Self-serve, no review. Owner creates the developer app (the app form asks for a LinkedIn Page, INFERRED, not re-verified), adds the two self-serve products "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect", and clicks through OAuth consent once. | Medium (high for bookkeepers, medium for e-commerce sellers, low for home-service contractors) | High for the permission model, medium for exact endpoint behavior (test call needed) |
| LinkedIn, Company Page (Community Management API, `w_organization_social`) | **INTEGRATE-AFTER-OWNER-STEP** | Community Management API access request on a NEW app that carries no other product: Development tier (business email, registered legal organization, website/privacy policy, Page verification of the app), then Standard-tier upgrade (screen recording under 5 min, test credentials). Review time unofficial and long. | Same | Medium |
| Pinterest (API v5, business account) | **INTEGRATE-AFTER-OWNER-STEP** | Trial access approval, then Standard access approval (OAuth demo video). Pins created under Trial are visible only to their creator. | Low (medium for e-commerce sellers only) | Medium-high |
| Nextdoor (Business Page) | **MANUAL-ONLY (provisional)** | Owner claims and verifies a free Business Page and posts by hand. No publishing API for small businesses was found, but this was NOT researched beyond one search. | Low | Low (coverage thin) |

LinkedIn headline verdict (one value): INTEGRATE, for the personal-profile route. The Company Page route is the second row. Both routes also have a no-approval fallback: the platform's own scheduler used by the owner (section 3.3).

## 2. Three caveats that matter most

1. **Pinterest public posting is gated behind Standard access.** Official docs say Pins and boards created under Trial access are visible only to the creator (sandbox). Standard needs an OAuth demo video; community reports in 2026 show 2 to 5+ weeks pending (SECONDARY). A reading of Pinterest's developer guidelines (search-tool paraphrase, wording not independently verified) also says an app may not publish for a user without the user's knowledge and consent, and that a scheduling feature needs the user to pick each Pin. Design for a human-approved queue.
2. **LinkedIn Company Page posting is a vetted, slow, single-product app; reading replies is closed on the free route.** Community Management API is for registered legal organizations, must be the only product on its app, and has no official review time (one Microsoft Q&A post reports 40 business days stuck at Standard-tier stage 1, SECONDARY). On the self-serve member route an app cannot read comments (`r_member_social` is closed to new requests). Also, external links cost reach (Ordinal, 900k posts: link posts averaged 26.5 percent lower reach, worse for Pages than profiles, SECONDARY).
3. **Nextdoor is unresolved.** Only the policy side is known: promotion must come from a free Business Page, not a personal neighbor account. Whether any publishing API exists for small businesses, how the Page is verified, and current posting limits were not verified. Do not build a Nextdoor adapter on the assumption that an API exists. The repo's vault expects a "Nextdoor access token" (INFERRED, local file `SPRINT-TEN-OFFERS-2026-10-10/ads/CHANNELS.md` lines 64 and 87), which shows someone assumed an API; this research found no evidence either way.

## 3. LinkedIn

### 3.1 Business promotion

- Promotion that links to an external landing page is not banned. LinkedIn's Professional Community Policies bar spam, described as untargeted, irrelevant, obviously unwanted, unauthorized, inappropriately commercial or promotional, or gratuitously repetitive messages (search-tool paraphrase of the spam section, wording approximate; the target is "inappropriately" commercial content, not promotion as such). OFFICIAL, https://www.linkedin.com/legal/professional-community-policies (n/d). Related: https://www.linkedin.com/help/linkedin/answer/a1338787 (Spam, n/d) and https://www.linkedin.com/help/linkedin/answer/a1344213 (n/d).
- LinkedIn's content guidance discourages posts that only try to sell products, services or events without useful insight, and lists engagement bait ("Like if you agree!") and engagement pods as things to avoid. OFFICIAL, https://www.linkedin.com/blog/content-recommendations-avoid (n/d); the "solely promote or sell" phrasing is attributed to LinkedIn's guidance by SECONDARY https://www.searchenginejournal.com/linkedin-shares-dos-donts-for-better-post-visibility/533571/ (n/d). A tip + real sample + one link matches the recommended pattern (INFERRED).
- February 2026 feed update: LinkedIn says it is working to make engagement pods ineffective, curb comment automation and unauthorized third-party tools, and reduce engagement bait such as "comment to agree" prompts. OFFICIAL, https://news.linkedin.com/2026/ImprovingTheFeed (Feb 2026).
- Conditions: a Page must represent the organization; a personal profile must carry a real member name (profiles that stand in for businesses can be flagged as spam). OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a726850 (n/d) and https://www.linkedin.com/help/linkedin/answer/a6204405 (n/d). No disclosure rule for promoting your own business was found (INFERRED: none applies; paid ads carry their own labels).
- Reach penalty for links (no LinkedIn confirmation of a deliberate penalty found):
  - Ordinal, more than 900,000 posts, Feb 2023 to Feb 2026: link posts averaged reach 73.5 against a baseline of 100 (26.5 percent penalty), growing from 5 percent in 2023 to 42 percent in 2025; Company Pages hit harder than personal profiles, which show almost no penalty. SECONDARY, https://www.tryordinal.com/blog/linkedin-link-penalty-study (2026).
  - Van der Blom research (1.3M posts) cited as an 18.8 percent median reduction for one external link in the body; a blog estimate of about 60 percent has no clear method. SECONDARY, https://www.agilitypr.com/pr-news/social-media-influencer-marketing/the-linkedin-link-tax-why-sharing-your-blog-is-costing-you-60-percent-of-your-audience/ (n/d).
  - Link-in-comments workaround: evidence conflicting (one source says it is also penalized in early 2026). SECONDARY, same Ordinal study.
- Pages vs profiles: AuthoredUp (posts Mar 2025 to Feb 2026) found profiles reach about twice as many people as Pages (median 751 vs 431 impressions); Pages slightly higher engagement rate (2.65 vs 2.45 percent). Company-page organic reach cited as about 1.6 percent of followers. SECONDARY, https://authoredup.com/blog/how-to-use-linkedin-for-business and https://influenceonline.co.uk/2026/07/31/the-linkedin-company-page-is-dead-long-live-the-expert (2026-07-31).
- Link and image behavior in the API: the Posts API does not scrape a URL for article posts; the app must supply title, description and a thumbnail (an uploaded image URN). OFFICIAL as summarized, Microsoft "Article Post API" page https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/advertising-targeting/version/article-ads-integrations?view=li-lms-2024-06 (2024-06 view); the thumbnail field is listed as an image URN by SECONDARY https://www.withone.ai/knowledge/linked-in/conn_mod_def%3A%3AGKRUReeQTGc%3A%3AdHOd6XdOSeyqikcYXKUTuA (n/d). INFERRED: the cleanest "sample image + clickable link" is an article post whose thumbnail is the sample image; the alternative is an image post with the URL in the text (whether LinkedIn draws a preview card for that: unknown).
- Groups: each group's owners set the rules. Examples seen: Chartered Accountants Ireland bans self-promotion and direct sales pitches; CMSA keeps a separate "Promotions" section; a Goldman Sachs alumni group requires pre-approval of promotional posts; one group says posts flagged 5 times are auto-deleted. SECONDARY, https://charteredaccountants.ie/about-us/Social-Media/LinkedIn-Group-Policy , https://cmsa.org/social-media-policy/ , https://www.goldmansachs.com/alumni/newsletters/2025/partner-alumni-linkedin-community-guidelines (n/d to 2025). No publishing API for groups was found in the docs searched, and I could not confirm Groups' 2026 status. INFERRED: groups are manual-only and not worth the risk for promotion.

### 3.2 Free tier

- Developer products used here carry no fee in the LinkedIn docs found (INFERRED from absence of any price). SECONDARY summaries call the API free but gated: https://opentweet.io/answers/is-the-linkedin-api-free ("Last updated: September 2026"), https://schedpilot.com/linkedin-api-pricing/ (2026).
- Creating a Page: no fee mentioned in the help pages found (INFERRED free; a paid Premium Company Page exists as an optional upsell, not verified here). Nothing found requires payment to publish or to be seen on organic posts.
- Posts per day or month: no platform or API cap found. Unknown.
- API call limits: not published per endpoint. Limits are counted per 24 hours (reset midnight UTC), per application and per member; exceeding returns 429; the actual number is shown in the Developer Portal under the app's Analytics tab, only for endpoints called at least once that day. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits (n/d). Third-party figure of 150 per member and 100,000 per app per day for Share on LinkedIn is unverified. SECONDARY, https://singhamandeep.com/?p=1400 (n/d).
- Community Management API Development tier: 500 calls per app and 100 per member per 24 hours (a LinkedIn FAQ says the app limit was raised from 100 to 500); must finish integration and testing within twelve months. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-06 (2026-06 view). Standard tier: "full-featured", for production.
- An image post costs more than one API call (upload then create), so per-post call counts exceed one. SECONDARY summary of the Images API flow, https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-11 (OFFICIAL doc; call-count remark is INFERRED).

### 3.3 Publishing automation

Official publishing API: **Posts API**, `POST https://api.linkedin.com/rest/posts`. Needs headers `Linkedin-Version: YYYYMM` and `X-Restli-Protocol-Version: 2.0.0`; success is HTTP 201 with the new post ID in the `x-restli-id` header. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09 (page about 151 days old per the search tool, so about May 2026). The older UGC Post API is marked legacy: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api?view=li-lms-2025-11 . The "Share on LinkedIn" page (about 614 days old, about Feb 2025) still shows the old `ugcPosts` request body: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin . Use the Posts API page as the reference and confirm with one live test call (201 vs 403).

Text + link + image:
- Image posts: initialize an upload with the Images API (`POST /rest/images?action=initializeUpload`, owner is a person or organization URN), upload the binary to the returned single-use URL, then create the post with the image URN. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-11 . The Images API lists `w_member_social` among accepted permissions and notes a `w_member_social`-only token cannot GET `rest/images`. Whether a member-only token passes `initializeUpload`: the page does not say outright; test it.
- Article (link card) posts: app supplies thumbnail, title, description (see 3.1).
- Multi-image posts exist: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2023-06 (OFFICIAL, 2023 view).

Route A, **member (personal profile)**:
- Product "Share on LinkedIn" grants `w_member_social` ("post, comment and like posts on behalf of an authenticated member"). Self-serve through the app's Products tab; "Sign In with LinkedIn using OpenID Connect" (scopes `openid`, `profile`, `email`) is also self-serve and is how the member ID for the author URN `urn:li:person:{id}` is obtained. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access ("Open Permissions are the only permissions that are available to all developers without special approval"; n/d) and the Share on LinkedIn page above.
- Free tier includes write access. Reading is separate (3.6).
- Token lifetime and refresh behavior for self-serve apps: NOT verified here (see section 6).

Route B, **organization (Company Page)**:
- Permission `w_organization_social` (newer docs also show `_feed` suffixed names, for example `w_organization_social_feed`, after the Community Management migration). The authorizing member must hold the Page role ADMINISTRATOR, DIRECT_SPONSORED_CONTENT_POSTER or CONTENT_ADMIN. OFFICIAL, Posts API page above; migration guide https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-api-migration-guide?view=li-lms-2026-06 .
- Access is application/review, in two tiers. What is reviewed at Development tier: approved use case, verified business email (personal addresses fail vetting), verified organization, verified website and domain, and confirmation by a LinkedIn Page of the same organization that verifies the application. The API is only available to registered legal organizations, for commercial use cases only (paraphrase). Prepare: business email, legal name, registered address, website, privacy policy. A rejected request cannot be re-submitted on the same app; create a new app. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review?view=li-lms-2026-06 and https://developer.linkedin.com/product-catalog/marketing/community-management-api .
- Vetting survey: generated in the Developer Portal and must be completed within 21 days of being triggered. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/shared/linkedin-api-partner-support-guide .
- Standard tier (needed beyond the Development limits): Standard-tier access form, a screen recording (under 5 minutes, high resolution, showing the full OAuth consent flow, a member posting and how engagement is displayed; narration recommended), test credentials, a company and product overview. Later functionality changes "may require re-review". OFFICIAL, community-management-app-review page above and the migration guide. Do not file a tier upgrade for data/analytics-only use cases (rejected). OFFICIAL, partner support guide.
- **Only-product rule**: Community Management API must be the only product on its developer app (legal and security constraints). If the app already has other products or pending requests the option is greyed out. Fix: create a new app, request Development tier there, then request Standard (the new app can be used for verification only and discarded; verify it with the same Page as the old app to see the Standard upgrade option). OFFICIAL, partner support guide and migration guide. A Microsoft Q&A answer adds that it also cannot coexist with Sign In with LinkedIn (OIDC) on one app: SECONDARY, https://learn.microsoft.com/en-us/answers/questions/5815518/cannot-enabled-community-management-api-on-a-verif (n/d). INFERRED consequence: two apps, one self-serve for the member route, one vetted for the Page route.
- Typical wait: **unknown officially.** SECONDARY: vendor blogs say 4 to 8 weeks at best and 3 to 4 months on average, with some 6+ months or rejected (https://www.blotato.com/blog/linkedin-api-pricing , https://singhamandeep.com/?p=1420 , n/d); a Microsoft Q&A post titled "Community Management API Standard Tier review at stage 1 for 40 business days, two support cases unanswered" (https://learn.microsoft.com/en-us/answers/questions/5999694/community-management-api-standard-tier-review-at-s , n/d, one user).
- Whether a sole proprietor or single-member LLC qualifies: unknown. Whether "post to our own Page" is an accepted use case: unknown (use case is a review criterion, categories not seen). Development tier also blocks BATCH_GET and webhooks (search-tool summary of the Microsoft guide).
- Posting as a Page differs from posting as a person in: author URN (`urn:li:organization:{id}` vs `urn:li:person:{id}`), scope, product, vetting, and the authorizing member's Page role.

Developer AI policy (flag): LinkedIn's Marketing developer AI policy lists as prohibited AI functionality that creates or modifies posts, comments, messages or other content. OFFICIAL as summarized, https://learn.microsoft.com/en-us/linkedin/marketing/developer-ai-policy?view=li-lms-2024-11 (2024-11 view, may be updated). Scope (Marketing APIs including Community Management, vs the consumer Share product) is unclear. INFERRED risk: if an LLM writes or edits post text inside the integrated app, check this policy; the safe pattern is human-written or human-approved text.

Native scheduling (counts as supported automation, manual entry):
- Personal profile: composer clock icon, schedule between 10 minutes (older text says 1 hour) and 3 months ahead; events, jobs and services cannot be scheduled. OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a1347212 (n/d).
- Page: only a super admin or content admin; between 1 hour and 3 months ahead; events, multiple photos, reshares, polls, jobs and service posts cannot be scheduled; after scheduling the content cannot be edited (reschedule or delete only). OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a1419179 (n/d).

### 3.4 Account setup

- Personal profile first: you cannot convert a profile to a Page; the profile must be a real person. To create a Page the account needs more than one connection, a brand-new account must wait at least one day, and you may need to verify the workplace by work email or Microsoft Entra Verified ID. If the organization already has a Page, request admin access instead. OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a726850 and https://www.linkedin.com/help/linkedin/answer/a553289 (n/d). Older third-party guides add a 7-day-old profile and a company-domain email (Gmail excluded); unconfirmed, SECONDARY, https://nonprofit.linkedin.com/resource-hub/getting-started/create-a-page (n/d).
- Developer app: requires a verified association with a LinkedIn Page (the Page verifies the app); for Community Management a business email is verified. OFFICIAL, app review page above. The app creation form asking for a Page for the self-serve route is INFERRED from prior knowledge, not re-verified.
- ID, phone, postcard, CAPTCHA, 2FA: no requirement found in the pages searched for Page creation, other than the workplace verification above. Sign-up CAPTCHA/phone checks: unknown (not researched).
- Scripted account creation: forbidden in effect. LinkedIn does not permit bots or automated methods, and fake accounts are banned (OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a1341387 , n/d). No account-creation API exists in the docs seen (INFERRED).
- Human-only steps: create/verify the profile and Page, workplace verification, create the developer app, Page admin verifies the app, add products, OAuth consent, the Community Management request/survey/screen recording, rescheduling in the native scheduler.

### 3.5 Automation rules

- Browser bots, scripts, crawlers, extensions that automate activity are prohibited; User Agreement section 8.2 forbids using bots or other unauthorized automated methods to create, comment on, like, share or re-share posts, or to drive inauthentic engagement (search-tool paraphrase of the help page's reference to section 8.2); violators risk restriction or closure. OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a1341387 (Prohibited software and extensions) and https://www.linkedin.com/help/linkedin/answer/a1340567 (Automated activity on LinkedIn); the clause text is mirrored (SECONDARY) at https://conductatlas.com/platform/linkedin/linkedin-user-agreement/provision/CA-P-023526/prohibition-on-bots-or-inauthentic-automated-engagement/ (User Agreement "last updated May 5, 2026" per that site).
- Permitted automation: posting through the official API with the member's own OAuth consent, and the native scheduler. Posting via a session replay or browser automation is not. INFERRED from the above plus SECONDARY commentary (https://opentweet.io/answers/is-scheduling-linkedin-posts-safe , "Last updated: September 2026").
- Labeling of automated accounts: no rule or label program found. Unknown.
- Spam enforcement triggers: spam content (inappropriately commercial, irrelevant, gratuitously repetitive), mass or low-acceptance connection requests, "I don't know this person" reports, repetitive comments; LinkedIn's transparency report calls spam/scam the most common violation it acts on. OFFICIAL, https://www.linkedin.com/help/linkedin/answer/a1344213 and https://about.linkedin.com/transparency/community-report (n/d). Restrictions usually lift automatically after the stated period or on appeal form (OFFICIAL, a1340567). Vendor numbers on thresholds are marketing and unverified (SECONDARY).
- Engagement bait and pods are discouraged (3.1).

### 3.6 Reading replies

- Organization posts: Comments API and Social Metadata API need `r_organization_social` (newer name `r_organization_social_feed`), i.e. Community Management API approval and an admin-type Page role. OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2026-06 and https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/social-metadata-api?view=li-lms-2026-09 .
- Member posts: reading needs `r_member_social` (newer docs: `r_member_social_feed`), which is restricted. The Marketing API FAQ says it is closed: "we're not accepting access requests this time due to resource constraints" (page about 10 months old, so about Dec 2025). OFFICIAL, https://learn.microsoft.com/en-us/linkedin/marketing/lms-faq?view=li-lms-2025-11 . Result: on the self-serve member route an app can write (`w_member_social`) but cannot read comments on its own posts. Humans can still read notifications in the LinkedIn app.
- Mentions of the Page or profile in other people's posts: no documented API; an AI-generated Microsoft Q&A answer says none exists (SECONDARY, https://learn.microsoft.com/en-us/answers/questions/5856807/linkedin-api-inquiry-public-mentions-of-my-org).
- Development tier blocks webhooks and BATCH_GET (3.3), so replies would be polled.

### 3.7 Audience fit

MEDIUM. Bookkeepers and small accounting practices: high (active on LinkedIn, B2B mindset). Small e-commerce sellers: medium. US home-service contractors: low (they live more on Facebook, Nextdoor, YouTube). A new Page with few followers gets very little organic reach (Pages reach about 1.6 percent of followers, SECONDARY), so the personal-profile route is the stronger reach choice. INFERRED from the SECONDARY reach data and general platform knowledge; no source rates this audience directly.

### 3.8 Verdict

- Member route: **INTEGRATE** (permitted official API, self-serve, write access on the free tier).
- Company Page route: **INTEGRATE-AFTER-OWNER-STEP**: Community Management API Development-tier approval on a new single-product app, then Standard-tier upgrade.
- Fallback for both: native scheduler, owner enters each post (manual).

## 4. Pinterest

### 4.1 Business promotion

- Allowed. Business accounts and Pins that link to a site are the platform's normal model. Rules that bite: users may not create or save content that is repetitive, deceptive or irrelevant to make money; links to unsafe, deceptive, unoriginal or spam-facilitating sites are barred; redirecting an existing Pin to a new destination is barred; links with excessive or deceptive redirection and abused shorteners may be blocked. OFFICIAL, https://policy.pinterest.com/en/community-guidelines (last updated May 2026; revision effective 2026-11-12).
- Affiliate Pins created repetitively or in large volume violate the spam policy; the same image appearing in multiple Pins is not by itself spam. OFFICIAL, https://policy.pinterest.com/en/commercial-and-branded-content-guidelines and https://policy.pinterest.com/transparency-report (n/d). Paid-partnership disclosure rules exist in the Commercial and Branded Content Guidelines; they do not apply to promoting your own services (INFERRED).
- Enforcement: Pinterest may limit a Pin's, board's or account's distribution (still visible to the poster and anyone with a direct link, removed from search and home feed); repeated violations can remove boards or accounts. OFFICIAL, https://policy.pinterest.com/en/enforcement and https://help.pinterest.com/en/article/spam-on-pinterest (n/d). Saving many Pins from the same website quickly can trigger a temporary block. OFFICIAL, https://help.pinterest.com/en/article/rate-limit-blocks (n/d).
- Link suppression or reach penalty for outbound links: none documented. A belief that Pinterest favors content posted natively or through its own scheduler is unconfirmed community talk. SECONDARY, https://community.pinterest.biz/t/pinterest-scheduler/38307 (n/d). INFERRED: Pinterest is link-out by design, so an outbound link is not itself penalized.

### 4.2 Free tier

- Business account: free. OFFICIAL, https://business.pinterest.com/getting-started/ and https://help.pinterest.com/en/business/article/get-a-business-account (n/d). API access: no fee found; gated by approval (4.3).
- Pin volume: no official daily or monthly cap found. Vendor rule of thumb of 5 to 25 fresh Pins a day is not Pinterest policy (SECONDARY, https://socialbu.com/blog/schedule-pinterest-pins , n/d).
- Native scheduler: schedule a standard Pin up to 30 days ahead, one at a time, with up to 10 Pins scheduled at once. OFFICIAL, https://help.pinterest.com/en/business/article/schedule-pins (n/d). Bulk CSV import for business accounts, up to 200 images or videos (older page, about 1,000 days old, re-check), where a future publish date schedules the Pin: https://help.pinterest.com/en/business/article/bulk-upload-video-pins (OFFICIAL).
- API rate limits: Trial = 1,000 requests per day for all API requests, and the write category `org_write` (create, edit, delete boards, sections, Pins) = 300 per day per app. Standard = 100 requests per second per user per app overall, `org_write` = 100 per minute per user per app. OFFICIAL, https://developers.pinterest.com/docs/key-concepts/access-tiers/ and https://developers.pinterest.com/docs/reference/rate-limits/ (n/d). Responses carry `x-ratelimit` headers; Create Pin documents 429 for too many requests.
- Nothing requires payment to publish or be seen organically (INFERRED; ads are optional).

### 4.3 Publishing automation

- **Create Pin**: `POST /v5/pins`, "Create a Pin on a board or board section owned by the operation user_account". Fields: `board_id` (numeric string), `media_source` (for example `source_type: image_url` with `url`; the guide describes `image_url` as an image from a third-party website), `link` (up to 2048 chars), `title` (up to 100), `description` (up to 800), `alt_text` (up to 500). `is_removable: true` makes an ad-only Pin (not wanted). OFFICIAL, https://developers.pinterest.com/docs/api/v5/pins-create/ and https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/ (n/d).
- Scopes: `pins:write` creates, updates, deletes public Pins; `boards:read` is needed to look up the board ID (docs advise requesting the matching read scope); `boards:write` for creating boards. OFFICIAL, https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/ (n/d). The Create Pin page's own scope line was not captured; confirm.
- **Access is application plus review**, in two tiers. OFFICIAL, https://developers.pinterest.com/docs/key-concepts/access-tiers/ and https://developers.pinterest.com/docs/getting-started/connect-app/ (n/d):
  1. Steps: a business account administers the app; verify its email and accept the Developer Terms of Service under "My apps"; register the app with the Connect app form (app ID and secret); submit the Trial access request. Requests are reviewed each business day, with an email decision (official statement; community reports below show longer waits).
  2. **Trial**: Pins and boards created are visible only to their creator as sandbox entities; good for exploring only. Test tokens last 24 hours.
  3. **Standard**: needed to publish publicly; the app must already have Trial and comply with the Developer Guidelines; submit a video recording of the app completing an action with the API. A video of the OAuth flow is required even for a solo developer; a terminal or Postman recording is accepted. Pinterest-run FAQ, https://community.pinterest.biz/t/frequently-asked-questions-pinterest-api/2083 (OFFICIAL community FAQ, n/d).
  4. Denial reasons listed: collecting credentials or session cookies instead of OAuth; a demo that does not show a live Pinterest integration or the full OAuth flow; wireframes or general platform demos. Appeals through a Help Center ticket. OFFICIAL, access-tiers page.
- Typical wait: official page gives none. Community reports in 2026 (SECONDARY): Trial pending about 11 days with no status (post says since June 5, 2026), many at 2+ weeks (https://community.pinterest.biz/t/update-developer-app-approvals/45527 ); Standard pending 26 days (https://community.pinterest.biz/t/upgrade-to-standard-access-pending-26-days-what-is-the-current-review-time/50445 ), 3 weeks, 2+ weeks (https://community.pinterest.biz/t/standard-access-upgrade-still-pending-after-2-weeks/50925 ), 1+ month, one over 5 weeks; while Trial is pending calls return 401 "consumer type is not supported" (https://community.pinterest.biz/t/trial-access-not-activated-all-v5-endpoints-return-code-3-consumer-type-is-not-supported/50150 ). Dates on these threads are n/d except where stated.
- Public visibility confirmation: Trial Pins are visible only to the app owner (OFFICIAL above; community answer in https://community.pinterest.biz/t/stuck-in-trial-mode-pins-not-showing-publicly/44410 , SECONDARY).
- Page vs person: not applicable. Pins are created on boards of the authorizing business account.
- Developer guidelines (search-tool paraphrase, exact wording NOT independently verified): apps may not take actions for users without their specific knowledge and consent (examples include creating, saving and editing Pins, following, messaging, commenting); apps may not let users trigger actions automatically without considering each one, and for scheduling the user must pick each Pin to be published; apps created to spread spam are not permitted; do not test rate limits or abuse prevention; do not store information obtained through the API (call it each time). OFFICIAL as summarized, https://policy.pinterest.com/en/developer-guidelines (n/d). A vendor's reading is that drafting Pins for user approval is compliant and auto-generate-and-auto-publish is not (SECONDARY, https://vorplabs.com/agent-tools/pinterest-api , n/d; the second search could not confirm the "must pick each Pin" wording). INFERRED design: a human-approved queue where the owner approves each specific Pin before the API publishes it.
- Pinterest recommends building your own limit on Pin creation, since few users create many Pins in a short window. OFFICIAL, Create Pin docs / https://developers.pinterest.com/docs/key-concepts/best-practices/ (n/d). Spam created through an app earns the app a strike and an email to the developer (OFFICIAL as summarized, same best-practices page).
- Approved scheduling partners (API-connected): Tailwind, Buffer, Canva, Picsart. OFFICIAL blog, https://create.pinterest.com/en-sa/blog/tools-to-automate-pin-scheduling/ (n/d). These may have paid tiers; the owner's no-paid-plan rule may exclude them (INFERRED; free tiers not checked).

### 4.4 Account setup

- Business account: free; the sign-up email must not already be on a Pinterest account; create from a desktop device; enter email, password and age, then profile and business description; or convert a personal account (must be public, unlink linked accounts first; Pins and followers are kept). OFFICIAL, https://help.pinterest.com/en/business/article/get-a-business-account and https://help.pinterest.com/en/article/switch-back-to-personal-account (n/d).
- ID, phone, postcard, CAPTCHA, 2FA for the business account: none found in the pages searched; unknown whether the sign-up flow shows CAPTCHA or phone checks.
- Claim the website (optional for posting, useful for attribution): four methods: HTML tag, HTML file at the server root, DNS TXT record (allow up to 72 hours), or Google Merchant Center (some accounts). A site can be claimed by only one Pinterest account. Claiming gives analytics, a featured logo on Pins, and makes "Visit site" lead to the claimed site. No source says claiming is required to create a Pin with a link. OFFICIAL, https://help.pinterest.com/en/business/article/claim-your-website (n/d). Whether the subdomain `hq.amberoneai.com` can be claimed on its own: unknown.
- Scripted account creation: no sign-up API seen; Pinterest bars automation it has not explicitly approved (4.5) and a disabled user may not create a new account without written permission (OFFICIAL, Terms of Service). No source states "bot sign-ups are forbidden" in those words (INFERRED forbidden in effect).
- Human-only steps: create the business account (desktop), verify email, accept developer terms, register the app, request Trial, record and submit the OAuth demo for Standard, OAuth consent, claim the website (DNS or file change on the site).

### 4.5 Automation rules

- Community Guidelines: do not use automation that has not been explicitly approved by Pinterest, including unauthorized services that act on your behalf; undocumented methods of access and scraping are barred. OFFICIAL, https://policy.pinterest.com/en/community-guidelines . Terms of Service bar scraping or collecting data without permission. OFFICIAL, https://policy.pinterest.com/en/terms-of-service .
- Scheduled posting through the official API (approved partners or your own approved Standard-access app) and through the native scheduler is within the approved path (INFERRED from the two points above).
- Labeling of automated accounts: no rule found. Unknown.
- Spam enforcement triggers: repetitive, deceptive or irrelevant content for profit; large-volume affiliate Pins; saving many Pins from the same site quickly; deceptive redirects (4.1). OFFICIAL.

### 4.6 Reading replies

- No official v5 endpoint to list comments on a Pin was found. A community thread shows a developer unable to get comments and likes by API, trying pin analytics with `TOTAL_COMMENTS` and `TOTAL_REACTIONS` metrics (answer unclear): SECONDARY, https://community.pinterest.biz/t/how-to-get-pin-likes-and-comments-count/2351 (n/d). Unknown whether counts are available and comment text appears unavailable. The OpenAPI description at github.com/pinterest/api-description (v5/openapi.json) would settle it.
- Scopes exist for reading Pins and analytics (`pins:read`), but comment text via API: not found.

### 4.7 Audience fit

LOW overall; MEDIUM for small e-commerce sellers. Pinterest reported 640 million global monthly active users in Q2 2026 (OFFICIAL, https://www.businesswire.com/news/home/20260804215798/en/ and https://www.sec.gov/Archives/edgar/data/0001506293/000150629326000102/q2-26xpressrelease.htm , 2026-08-04). The audience is consumers planning and shopping, not owners looking for back-office services. Best match is the Product Catalog Cleanup offer for sellers, as a how-to or checklist Pin (INFERRED). I did not find a source rating small-business or contractor audiences on Pinterest.

### 4.8 Verdict

**INTEGRATE-AFTER-OWNER-STEP**. Named steps: Trial access approval, then Standard access approval with an OAuth demo video. Without Standard, Pins are not public. Fallback now: owner uses the native scheduler (10 Pins, 30 days) or CSV bulk import (MANUAL-ONLY). Given the low audience fit, treat Pinterest as lowest priority of the three.

## 5. Nextdoor (thin coverage: one search)

### 5.1 Business promotion

- Rule: promoting a business, service or paid opportunity must be done from a free Business Page, not a personal neighbor account; personal-account promotion is no longer allowed; you need a claimed Business Page to post. OFFICIAL as summarized, https://blog.nextdoor.com/self-promotion-update ("Changes to self-promotion policy: A better feed for neighbors, a better home for businesses", n/d).
- External-link posts, disclosure rules, link suppression or reach penalty: unknown (not researched).

### 5.2 Free tier

- Business Page: free. Business Posts: Nextdoor's 2023 release says free marketing tools let businesses post "as often as they'd like"; a 2020 article said two free posts per month. The two conflict; the 2023 source is newer but is 3+ years old, so the current limit is unknown. OFFICIAL, https://www.businesswire.com/news/home/20230307005478/en/Nextdoor-Launches-New-Suite-of-Free-Marketing-Tools-to-Support-Small-Business-Growth-in-Neighborhoods/ (2023-03-07); SECONDARY, https://searchengineland.com/nextdoor-rolls-out-free-business-posts-best-practices-advice-336135 (2020). Current marketing page: Business Posts are free and appear in the neighborhood newsfeed. OFFICIAL, https://business.nextdoor.com/local (n/d).
- Who sees it: 2023 release says Business Posts are distributed automatically to the business's neighborhood, and neighbors who have "Faved" the business get its updates. The 2020 article said all neighbors within 2 miles of the business (a 2020 figure, may have changed). Every Fave shows on the Page. Current radius: unknown.
- Paid reach (ads): optional, not allowed for this project.

### 5.3 Publishing automation

- **Unknown.** No Nextdoor developer or publishing documentation was retrieved. Not established: whether any API publishes organic Business Posts for small businesses (as opposed to the advertiser/partner API), whether it is self-serve, scopes, rate limits, whether the native app has a scheduler.
- Local context: the repo's channel notes say the vault has no "Nextdoor access token" and that the Nextdoor adapter "sends `body_text`" (INFERRED/local, `SPRINT-TEN-OFFERS-2026-10-10/ads/CHANNELS.md` lines 64 and 87). That reflects an earlier assumption, not a verified API.

### 5.4 Account setup

- Claiming a Business Page is required to post (5.1). The detailed verification requirements (address or phone check, postcard, ID, whether a remote or service-area business with no storefront qualifies) were not retrieved. Sources that exist but were not opened: claim guide https://business.nextdoor.com/en-us/blog/guide-to-claiming-your-nextdoor-business-page (2019-10-07), Australian FAQ https://go.nextdoor.com/aulocal-businesses-faq (not US), playbook PDF https://business.nextdoor.com/hubfs/Local%20Business%20Playbook/Nextdoor%20Local%20Business%20Playbook.pdf (n/d).
- Scripted account creation: not researched. INFERRED not viable (neighbor accounts are address-verified), and the owner's rules forbid automated sign-ups.

### 5.5 Automation rules

- Unknown (not researched): bots, scheduled posts, labeling, spam triggers.

### 5.6 Reading replies

- Unknown (not researched).

### 5.7 Audience fit

LOW for these offers. INFERRED: the audience is local residents near a business's address (buyers of home services), not the contractors, bookkeepers and sellers who buy back-office pilots, and a Page reaches only its neighborhood radius. A remote AI-services business may not fit a neighborhood-business page at all (unverified).

### 5.8 Verdict

**MANUAL-ONLY (provisional)**. No permitted automation was found, but the API question was not actually researched. What would change it: an official Nextdoor page showing an organic Business Post publishing endpoint open to small businesses would move it to INTEGRATE-AFTER-OWNER-STEP. If Business Page eligibility for a remote services company fails, it becomes NOT-RELEVANT.

## 6. Not verified: follow-up queries to run in a new search session

Nextdoor (priority):
1. "developer.nextdoor.com" API documentation: ads/partner API versus any organic Business Post endpoint.
2. "Nextdoor Business Page create post API" and "Nextdoor third-party scheduling tool Business Posts" (any official partner list).
3. "Nextdoor claim Business Page verify phone postcard address 2026" (help.nextdoor.com).
4. "Nextdoor Business Posts free limit per month 2026" and reach radius.
5. "Nextdoor Business Page post link image allowed" and Nextdoor Community Guidelines on promotion and automation, Terms of Service on bots.
6. "Nextdoor Business Page comments replies notifications" and any comment-reading API.
7. "Nextdoor Business Page service area business without storefront eligible".

LinkedIn:
8. Access-token lifetime and refresh tokens for self-serve apps ("Authenticating with OAuth 2.0 Overview", https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication). Prior knowledge only: self-serve tokens last about 60 days, refresh tokens limited to partner programs; NOT verified.
9. Developer-app creation form: is a LinkedIn Page required for the self-serve app (prior knowledge says yes; not verified).
10. Developer AI policy scope (does it cover Share on LinkedIn and Community Management).
11. Whether a member-only `w_member_social` token can call Images API `initializeUpload` and Posts API `/rest/posts` (live test).
12. LinkedIn Groups status in 2026 and any group posting API.
13. Which `Linkedin-Version` values are currently supported (docs show a 2026-09 view; 202510 sunsets 2026-10-15).

Pinterest:
14. Exact developer-guidelines wording on user consent and scheduling (policy.pinterest.com/en/developer-guidelines).
15. Token lifetimes and refresh behavior; image size and ratio requirements for Pins; whether a subdomain can be claimed.
16. Whether a v5 endpoint lists comments (check github.com/pinterest/api-description).
17. Re-check Terms and Community Guidelines after 2026-11-12.

## 7. Source index (by platform)

LinkedIn, OFFICIAL: learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin ; /linkedin/shared/authentication/getting-access ; /linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09 ; /shares/images-api?view=li-lms-2025-11 ; /shares/comments-api?view=li-lms-2026-06 ; /shares/social-metadata-api?view=li-lms-2026-09 ; /marketing/community-management-app-review?view=li-lms-2026-06 ; /community-management/community-management-api-migration-guide?view=li-lms-2026-06 ; /marketing/increasing-access?view=li-lms-2026-06 ; /marketing/lms-faq?view=li-lms-2025-11 ; /linkedin/shared/linkedin-api-partner-support-guide ; /linkedin/shared/api-guide/concepts/rate-limits ; /marketing/developer-ai-policy?view=li-lms-2024-11 ; developer.linkedin.com/product-catalog/marketing/community-management-api ; linkedin.com/legal/professional-community-policies ; linkedin.com/help/linkedin/answer/{a1341387, a1340567, a1338787, a1344213, a726850, a553289, a6204405, a1347212, a1419179} ; linkedin.com/blog/content-recommendations-avoid ; news.linkedin.com/2026/ImprovingTheFeed.

Pinterest, OFFICIAL: developers.pinterest.com/docs/key-concepts/access-tiers/ ; /docs/reference/rate-limits/ ; /docs/getting-started/connect-app/ ; /docs/getting-started/set-up-authentication-and-authorization/ ; /docs/api/v5/pins-create/ ; /docs/work-with-organic-content-and-users/create-boards-and-pins/ ; /docs/key-concepts/best-practices/ ; policy.pinterest.com/en/{community-guidelines, developer-guidelines, terms-of-service, enforcement, commercial-and-branded-content-guidelines} ; help.pinterest.com/en/article/{spam-on-pinterest, rate-limit-blocks, switch-back-to-personal-account} ; help.pinterest.com/en/business/article/{get-a-business-account, claim-your-website, schedule-pins, bulk-upload-video-pins} ; business.pinterest.com/getting-started/ ; create.pinterest.com/en-sa/blog/tools-to-automate-pin-scheduling/ ; community.pinterest.biz/t/frequently-asked-questions-pinterest-api/2083 ; Pinterest Q2 2026 results (businesswire 20260804215798, sec.gov 8-K).

Nextdoor, OFFICIAL: blog.nextdoor.com/self-promotion-update ; businesswire 20230307005478 ; business.nextdoor.com/local. SECONDARY: searchengineland.com/nextdoor-rolls-out-free-business-posts-best-practices-advice-336135 (2020).

SECONDARY used: tryordinal.com (link penalty study), authoredup.com, influenceonline.co.uk, agilitypr.com, singhamandeep.com, blotato.com, opentweet.io, schedpilot.com, conductatlas.com, bundle.social/blog/linkedin-api-permissions (2026-08-04), dev.to walkthrough (single-product claim, unconfirmed), community.pinterest.biz threads (45527, 50445, 50925, 50150, 44410, 2351, 38307), community.make.com/t/pinterest-trial-access-vs-standard-access/50622, vorplabs.com/agent-tools/pinterest-api, socialbu.com, Microsoft Q&A threads (5815518, 5999694, 5856807).
