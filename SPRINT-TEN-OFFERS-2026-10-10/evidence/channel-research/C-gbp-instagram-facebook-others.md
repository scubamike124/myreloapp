# Group C: free business promotion on specific platforms (rules and automation facts)

As of 2026-10-11. Research only. No accounts created, no sign-up flows opened, nobody contacted.

STATUS WARNING: the shared WebSearch budget (200 calls per turn across all agents) ran out after
56 successful standard-mode searches. Google Business Profile, Instagram and the Facebook Page
API/link-cap news are well covered. Alignable, YouTube/WhatsApp, Yelp/Bing/Apple and the Facebook
Groups/Page rule details were NOT researched; their verdicts below are PROVISIONAL and rest on
model background knowledge only (tag BACKGROUND). See section 9 for the exact follow-up searches.

## 1. Summary table (verdicts)

| # | Platform | Verdict | Exact gate / owner-only step | Free-tier catch | Audience fit | Evidence |
|---|----------|---------|------------------------------|-----------------|--------------|----------|
| 1 | Google Business Profile Posts | INTEGRATE-AFTER-OWNER-STEP (only if the business is eligible; a purely online-only business is not eligible, which would make it NOT-ALLOWED) | (a) real in-person or service-area business; (b) profile verified (video, postcard, phone or email) and active 60+ days, with a website; (c) submit the "Application for Basic API Access" form from an owner/manager email. Quota stays 0 until approved; Google reported an application backlog on 2026-09-15 | Free, API free. Posts may not carry phone/email/social links or unrelated website links (policy change reported 2026-10-06) | LOW | Good |
| 2 | Instagram (professional account) | INTEGRATE-AFTER-OWNER-STEP | Owner creates the account, switches it to Professional, registers a Meta developer account, creates a Business-type app, authorizes via Business Login (instagram_business_basic + instagram_business_content_publish). No App Review for own account (Standard Access) | Caption URLs are not clickable. Clickable links in organic posts exist only on paid Meta One plans (Advanced and up, about 49.99 USD/month, launched 2026-09-15). Free route = bio link | LOW | Good |
| 3 | Facebook Page | INTEGRATE-AFTER-OWNER-STEP (with a link-cap caveat) | Owner creates the Page and a Meta developer app, authorizes a Page token (pages_manage_posts, pages_read_engagement, pages_show_list). Review level for own Page not verified (INFERRED: none) | Some free Pages are capped at 2 organic link posts (or comments) per calendar month unless they pay for Meta One; rollout partial | MEDIUM | Partial |
| 4 | Facebook Groups | MANUAL-ONLY (default: do not use for promotion) | Groups posting API removed in 2024; any manual post must follow each group's written rules (not verified) | n/a | LOW for promotion | Partial |
| 5 | Alignable | MANUAL-ONLY (PROVISIONAL) | not researched | not researched | MEDIUM (INFERRED) | None |
| 6 | YouTube Community posts | NOT-RELEVANT (PROVISIONAL; no posting API known) | not researched | not researched | LOW | None |
| 7 | WhatsApp Channels | NOT-RELEVANT (PROVISIONAL; no posting API known) | not researched | not researched | LOW | None |
| 8 | Yelp for Business | NOT-RELEVANT (PROVISIONAL) | not researched | not researched | LOW | None |
| 9 | Bing Places | NOT-RELEVANT (PROVISIONAL) | not researched | not researched | LOW | None |
| 10 | Apple Business Connect | NOT-RELEVANT (PROVISIONAL) | not researched | not researched | LOW | None |

Three most important caveats:

1. Meta One (launched 2026-09-15) changed "free link promotion" on Meta platforms. Some free
   Facebook Pages are limited to 2 organic link posts (or comments) per month, and clickable
   links in Instagram posts/Reels are a paid-tier feature. A free plan has to use the bio link or
   the Page's website/button, not per-post links. Reports of exact per-tier caps conflict.
2. Google Business Profile is not available to online-only businesses, and its API is gated:
   60+ day verified profile, a form application, quota 0 until approved, and an announced
   backlog with no timeframe (2026-09-15). Treat the GBP API as a weeks-to-months item at best.
3. Half the platform list (Alignable, YouTube/WhatsApp, Yelp/Bing/Apple, Facebook Groups rules)
   is unverified because the search budget ran out. Do not build on those provisional verdicts.

## 2. Coverage, method and tags

- Method: WebSearch only (WebFetch blocked). Every source below was seen as a search-result
  summary, not opened in full, so exact wording on the live page may differ. Quotes are as the
  search tool returned them.
- Tags: OFFICIAL = the platform's own docs, help center or terms. SECONDARY = news, blog, forum,
  vendor. INFERRED = my reasoning from the facts. BACKGROUND = model memory, not checked in this
  session (treat as a lead only).
- Conflicts found and not resolved (extended-mode search was not possible):
  - Instagram publishing limit: 100 per 24 h (Content Publishing guide) vs "currently 50"
    (content_publishing_limit reference page).
  - Meta One per-tier link caps: Blotato (Advanced 8, Expert 20, Max unlimited, free 2) vs
    AdLibrary (Expert 20 Facebook + 8 Instagram, only Max removes the cap) vs a source saying
    Advanced allows 4 linked posts and 4 linked Reels.
  - GBP API review time: Google FAQ says reviewed within 14 days; Google staff announced a
    backlog on 2026-09-15 with no timeframe.
  - GBP "recurring posts" release-note date: 2024-10-16 in one result, an April 2026 entry in
    another.

---

## 3. Google Business Profile "Posts"

### 3.1 Business promotion
- Eligibility is the main gate. Google: a business must make in-person contact with customers
  during its stated hours. Ineligible: "Brands, organizations, artists, and other online-only
  businesses", lead generation agents/companies, rental or for-sale properties, P.O. box
  addresses. OFFICIAL https://support.google.com/business/answer/13763036 (date not visible).
  Google also suggests Google Ads for ineligible businesses (paid; out of scope).
- Service-area businesses (SAB) are eligible if they serve customers at the customers' location;
  the street address can be hidden but a real address must exist; P.O. boxes and virtual offices
  are not allowed unless the office is staffed during business hours. OFFICIAL
  https://support.google.com/business/answer/3038177 (date not visible).
- June 2025 guideline change: countries or states cannot be service areas; keep the area within
  about two hours' drive of the base. SECONDARY
  https://ppc.land/google-bans-countries-and-states-from-business-profile-service-areas/
- Fit by target type (INFERRED from the above): home-service contractors who drive to customers
  = eligible as SAB. Bookkeepers/accountants = eligible only if they meet clients in person
  (client site or office); fully remote = ineligible. Remote-only e-commerce sellers =
  ineligible. Amber One AI itself: a purely remote "pilot" service is almost certainly
  "online-only", so it likely cannot hold a profile unless it has a genuine in-person or
  service-area operation. SECONDARY guides in the results warn that picking the wrong business
  model (especially "online-only") can block verification or later trigger suspension (which
  page said it was not identified; candidates: https://wiremo.co/blog/google-business-profile-video-verification/ ,
  https://www.wisedigitalpartners.com/learn/blog/seo/google-business-profile-verification ).
- Posts may promote a service with a photo/video, description and an action button that sends
  customers to a website to book, order or "learn more". OFFICIAL
  https://support.google.com/business/answer/7662907 (date not visible). Offer posts get a
  "View offer" button automatically; posts older than 6 months are archived unless a date range
  is set (same page, as summarized).
- Post content rules: no phone numbers in post text (use the Call button tied to the verified
  number); links to malware, phishing or pornographic sites are not allowed; posts may be reviewed
  after publishing (statuses Live, Pending, Not approved). OFFICIAL
  https://support.google.com/business/answer/7213077 and
  https://support.google.com/business/answer/7662907
- NEW, 2026-10: Google updated the "Advertising & solicitation" section of the Maps/Business
  Profile prohibited-content policy. As reported: in posts, merchants may not include email
  addresses, phone numbers, social media links or links to other websites unrelated to the
  business; offers and updates that may look promotional remain allowed in posts. The listing
  itself may not carry time-bound promotions, pricing or direct calls to action. No enforcement
  date given. The two reports word it slightly differently (one says "unrelated" applies to the
  website links only, the other to all four items), so treat email, phone and social links as
  banned in posts. SECONDARY (2026-10-06)
  https://seroundtable.com/google-maps-policy-listings-or-posts-42228.html and (2026-10-08)
  https://www.relevantaudience.com/seo/google-business-profile-policy-bans-promotions-in-listings/
  Official policy page (not re-read): https://support.google.com/contributionpolicy/answer/7400114
  INFERRED: a button linking to the business's own landing page on its own domain
  (hq.amberoneai.com) is the lowest-risk pattern; do not put the URL, phone or email in the text.
- Duplicate content: Search Engine Journal reports Google lists duplicate photos/posts/videos as
  content to avoid. SECONDARY (date not visible)
  https://www.searchenginejournal.com/google-avoid-duplicate-content-in-business-profile-posts/460863/
  INFERRED: write each of the seven offer posts with unique text and a unique image.
- Link suppression or reach penalty: none reported for outbound website buttons. Unrelated:
  posts were temporarily invisible on Search/Maps in late April 2025 (never officially confirmed),
  SECONDARY https://www.dacgroup.com/en-gb/?p=134510

### 3.2 Free tier
- Profile: free. API: free ("available to registered users at no charge"). OFFICIAL
  https://developers.google.com/my-business/content/pricing (mirrors show "last updated"
  2025-08-28 and 2026-08-28; unclear which is current).
- Posts per day or month: no limit found in the pages seen (unknown). API limits: default 300
  requests per minute per project after approval; 10 edits per minute per Business Profile,
  cannot be increased. OFFICIAL https://developers.google.com/my-business/content/limits
  (pages around 2025-08).
- Nothing requires payment to publish or be seen.

### 3.3 Publishing automation
- Official API: Business Profile APIs. Posting uses the v4 resource
  accounts.locations.localPosts (create, list, get, patch, delete). Fields include summary,
  callToAction (actionType enum sets the button text; url is the destination), media (sourceUrl
  is the only supported field, so the image must be at a public URL), topicType, event, offer,
  state, searchUrl. callToAction is ignored for OFFER posts. Scope:
  https://www.googleapis.com/auth/business.manage. OFFICIAL
  https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts
  (localized copy updated 2025-07-25). Text + link button + image is supported.
- Scheduling: recurring posts can be created through the LocalPosts API (RecurrenceInfo).
  OFFICIAL release notes https://developers.google.com/my-business/content/latest-updates
  (entry 2024-10-16; one search summary of the same notes also mentions an entry dated
  2026-04-07 about scheduling recurring posts via RecurrenceInfo; not reconciled). Releasebot's
  2026 list (reviews, invitations) does not mention localPosts (SECONDARY
  https://releasebot.io/updates/google/google-business-profile-apis). No deprecation of
  localPosts found. A Make.com forum thread reports 403 errors creating posts (cause unverified):
  https://community.make.com/t/google-my-business-business-profile-creating-posts-via-api-fails-403-mybusiness-googleapis-com-legacy-api-confusion/99258
- Access is NOT self-serve. OFFICIAL https://developers.google.com/my-business/content/prereqs :
  applicant must manage a Business Profile that is verified and active for 60+ days; the business
  must have a website on the profile; create a Google Cloud project; submit the GBP API contact
  form choosing "Application for Basic API Access" from an email listed as owner or manager of
  the profile (the limits page also advises the website domain match the email domain). Quota is
  0 QPM until approved and 300 QPM after.
- Review time: OFFICIAL FAQ says requests are reviewed within 14 days
  https://developers.google.com/my-business/content/faq . Reality, 2026-09-15: Google staff
  posted in the support forum that processing is delayed by high volume, gave no timeframe and
  asked applicants not to resubmit; many applicants still see quota 0. SECONDARY
  https://www.seroundtable.com/google-business-profile-api-application-delays-42085.html and
  https://optimixed.com/article/google-business-profile-api-application-processing-delayed-7cd9f1
  A developer thread reports a request pending 14+ days at 0 QPM (date not visible):
  https://discuss.google.dev/t/gbp-api-escalation-basic-access-pending-14-days-requests-per-minute-locked-at-0/393020
- What is reviewed / what the application must show: only the prerequisites above are published.
  Anecdotes (SECONDARY, undated): a single-location pool operator was denied with a message that
  access goes to companies who manage business location data for clients, and an Upwork post
  reports three denials ("did not pass internal quality checks"). Approval for a business
  automating its own profile is therefore uncertain. A thread also reports an approved project
  that still could not enable the API (https://discuss.google.dev/t/approved-but-cannot-enable-google-business-profile-api-fails-to-load-every-time/248497).
- Write access on the free tier: yes once approved (no paid tier exists). Posting is as the
  location (Business Profile) by an authorized owner/manager Google account, not as a person.
- API policy: use is for listings you own or are authorized to manage; Google may review use at
  any time and deactivate the project; you may not give indirect access to your project. OFFICIAL
  https://developers.google.com/my-business/content/policies and /terms

### 3.4 Account setup
- Needs a Google account, a real address (hidden for SAB), phone, website, and verification.
  OFFICIAL (summary) https://support.google.com/places/answer/177852 : methods are phone/text,
  email, video recording, live video call, postcard; which ones are offered depends on category,
  region and Google's checks; IVR phone systems cannot receive codes.
- SECONDARY detail (guides in the search results; which page said what was not identified):
  video must be recorded live in the Business Profile flow (no pre-recorded upload), roughly
  30 seconds or more; SABs typically show branded vehicles, equipment, licences, tools, mail
  with the business address; postcards: one guide says up to 5 business days, another says to
  request a new code if none arrives in about 14 days, and one says the code expires after 30
  days. Turnaround claims for video/phone range from near-instant to about a week. Candidate
  pages: https://wiremo.co/blog/google-business-profile-video-verification/ ,
  https://www.synup.com/en/how-to/verify-google-my-business ,
  https://localo.com/marketing-dictionary/what-is-google-business-profile-verification-methods ,
  https://www.wisedigitalpartners.com/learn/blog/seo/google-business-profile-verification
- Human-only steps: eligibility decision, creating/claiming the profile, verification (live
  video, postcard code, phone), OAuth consent, the API access form. Scripted account creation:
  not verified for Google (unknown). The hard limit applies anyway: do not automate sign-ups.

### 3.5 Automation rules
- API-based and recurring posting is an intended, documented use (see 3.3). Browser bots are not
  needed or allowed under the hard limits.
- Enforcement triggers seen: prohibited content, phone numbers in posts, duplicate content,
  unrelated links; a profile registered under a false business model risks suspension (SECONDARY).
  Whether automated accounts must be labeled: no such rule found (unknown).

### 3.6 Reading replies
- GBP posts have no public comment/reply thread (INFERRED; no source). Per-post view counts
  returned to the dashboard in Google's September 2026 Small Business Bulletin (dated 2026-09-10),
  covering 18 months, but "not yet available in the API". SECONDARY
  https://seroundtable.com/google-posts-insights-views-41913.html ,
  https://ppc.land/google-adds-post-view-counts-to-business-profile-no-api-access-yet/
- Reviews (a different object) can be read and replied to with the same scope; 2026 release
  notes show active review changes (SECONDARY releasebot link above).

### 3.7 Audience fit: LOW
Searchers using Maps/Search are mostly consumers looking for a local provider; owners rarely
browse a vendor's Posts. Value is credibility on a branded search, and only if the business is
eligible. INFERRED.

### 3.8 Verdict: INTEGRATE-AFTER-OWNER-STEP (conditional)
Gate 1: eligibility (online-only = no profile). Gate 2: verified profile active 60+ days with a
website. Gate 3: "Application for Basic API Access" approval (current backlog). Until then the
only compliant route is manual posting in the Business Profile dashboard.

---

## 4. Instagram (professional account)

### 4.1 Business promotion
- Normal business posts with an image, a tip and a landing-page URL in the caption are allowed on
  a Professional (Business or Creator) account (INFERRED; no rule against it found).
- Links: URLs in feed/Reel captions display as plain text and are not clickable (SECONDARY, link
  tool vendors, e.g. https://tlinky.com/link-in-bio-for-instagram/ , and Planoly
  https://api.planoly.com/blog/instagram-is-finally-testing-links-in-captions ). A test of
  clickable caption links for paid Meta Verified subscribers was reported (SECONDARY, date not
  visible) https://ppc.land/instagram-tests-clickable-links-in-post-captions-for-meta-verified-users/
- NEW with Meta One (launched 2026-09-15): clickable links in organic posts and Reels sit behind
  the paid Meta One for Business tiers, entry at Advanced (about 49.99 USD/month per account);
  free accounts keep the bio link(s) and the Stories link sticker. SECONDARY
  https://www.valueyournetwork.com/en/meta-one-business-links/ ,
  https://www.thekeyword.co/news/meta-one-business-plans ,
  https://www.blotato.com/blog/meta-one-link-limits ,
  https://www.socialmediatoday.com/news/meta-launches-meta-one-for-business-add-on-packages/830469/
  Meta states core features stay free (per press coverage of the launch).
- Bio links: up to five external links, no follower minimum (SECONDARY, vendor blogs, e.g.
  https://tlinky.com/link-in-bio-for-instagram/ ; rollout date varies by source). Official
  Instagram bio-link rules were not found (unknown).
- INFERRED free pattern: caption says "link in bio"; the bio link goes to a hub page on
  hq.amberoneai.com that lists the seven offer pages (or to the single offer being featured).
- Reach penalty for links: none documented for Instagram (unknown).

### 4.2 Free tier
- Account: free. API: free to use. API publishing cap: Content Publishing guide says 100
  API-published posts per rolling 24 hours (carousel counts as 1, enforced at media_publish);
  the content_publishing_limit reference says quota_total is "currently 50" (example v26.0).
  Query GET /<IG_ID>/content_publishing_limit for the real number. OFFICIAL
  https://developers.facebook.com/docs/instagram-platform/content-publishing and
  https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit
  The plan needs about 1 post per day, so either figure is enough.
- Payment is needed only for clickable per-post links (see 4.1).

### 4.3 Publishing automation
- Official API: Instagram API with Instagram Login (Business Login for Instagram). It does not
  require a linked Facebook Page. It supports publishing single images, videos, Reels and
  carousels on behalf of a professional account. OFFICIAL
  https://developers.facebook.com/docs/instagram-platform/overview
- Image rules: JPEG only (MPO/JPS rejected); the file must sit on a publicly reachable URL when
  the container is created/published; filters, shopping tags and branded-content tags are not
  supported. OFFICIAL content-publishing guide above. So the sample images must be served as
  stable public JPEG files. Caption limits (2,200 characters, 30 hashtags) came only from vendor
  docs (SECONDARY), not from Meta pages seen.
- Permissions: instagram_business_basic + instagram_business_content_publish (Business Login
  path). Facebook-Login path uses the older instagram_basic / instagram_content_publish names
  (BACKGROUND).
- Access: Standard Access is enough if the app only serves your own professional account (added
  in the App Dashboard): no App Review. Advanced Access (App Review plus Business Verification)
  is required only for accounts you do not own or manage. OFFICIAL
  https://developers.facebook.com/docs/instagram-platform/overview and
  https://developers.facebook.com/documentation/instagram-platform/app-review . Typical review
  wait for Advanced Access is "days to about a month" (SECONDARY, vendor guides); not needed here.
  Whether the app must be in Live mode for own-account publishing: unknown.
- Rate limits: Business Use Case rate limiting; common secondary figure is 4800 x impressions per
  24 hours, but another 2026 vendor article says 200 calls per user per hour. Unresolved (unknown).
  SECONDARY https://www.getphyllo.com/post/instagram-api-rate-limits-explained-and-how-to-scale-beyond-them-2026
- Posting identity: the professional account itself; a personal account cannot use the API
  (one developer guide in the results says the Basic Display API was shut down in December 2024;
  SECONDARY, page not pinned, probably https://www.getphyllo.com/post/instagram-api-guide ).
- Platform's own scheduler (Instagram app / Meta Business Suite) exists and is free
  (BACKGROUND); Meta One advertises scheduling "up to a year ahead" as a paid feature
  (SECONDARY, thekeyword.co link above); the free horizon is unknown.

### 4.4 Account setup
- Professional account required; switching from a personal account is done in the app by the
  human owner. Tester accounts for the app must be public. OFFICIAL (search summary; the exact
  page was not pinned) https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app
  and https://developers.facebook.com/documentation/development/create-an-app/other-app-types/instagram-apis.md
- Instagram Terms: "You can't attempt to create accounts or access or collect information in
  unauthorized ways. This includes creating accounts or collecting information in an automated way
  without our express permission." OFFICIAL (as quoted by the search tool) https://help.instagram.com/581066165581870
  -> scripted sign-up is forbidden.
- Human-only steps: Instagram sign-up and any email/phone/CAPTCHA checks (specifics not
  verified), switch to Professional, Meta developer registration and app creation (a Facebook
  login is normally needed for the developer account: BACKGROUND), adding the account as a tester
  or role holder, and the OAuth consent. Long-lived tokens expire and need refreshing
  (BACKGROUND; verify).

### 4.5 Automation rules
- Publishing through the official Content Publishing API (including scheduled publishing) is the
  sanctioned route (SECONDARY vendor guides, e.g. https://adaptlypost.com/blog/instagram-automation ).
- Risk area is engagement automation (auto-follow, auto-like, auto-comment, auto-DM) and
  unauthorized automated access; the hard limits already forbid these. Labeling of automated
  accounts: no rule found (unknown). If any image were AI-generated, Meta labelling rules could
  apply (BACKGROUND; the plan uses real sample images).

### 4.6 Reading replies
- Yes on the free tier for your own account: instagram_business_manage_comments (with
  instagram_business_basic) reads and moderates comments; the `comments` webhook field covers
  comments on media owned by the app user; webhooks are not sent for private accounts; Standard
  Access applies for accounts you own. OFFICIAL
  https://developers.facebook.com/docs/instagram-platform/comment-moderation and
  https://developers.facebook.com/docs/instagram-api/guides/webhooks
- Rate limits for comment reads: unresolved (sources conflict); polling needs care.

### 4.7 Audience fit: LOW
Instagram works for contractors showing finished jobs to consumers; a back-office report sample is
a weak visual and bookkeepers/e-commerce operators rarely look for back-office vendors there.
INFERRED.

### 4.8 Verdict: INTEGRATE-AFTER-OWNER-STEP
Owner steps: create the account, switch to Professional, register the Meta developer account,
create a Business app with "API setup with Instagram login", add the account, authorize with
instagram_business_basic + instagram_business_content_publish. No approval wait for an own
account. Expect non-clickable URLs (bio link only) on the free tier.

---

## 5. Alignable (NOT RESEARCHED; PROVISIONAL)

No live sources were obtained. BACKGROUND (unverified, treat as leads):
- Free membership network of local small-business owners (mostly US/Canada); paid ad/upgrade
  products exist (names and prices unknown).
- No public posting API known. Posting-rule detail on self-promotion, link handling, automation
  and spam enforcement: unknown.
- Audience: owners of small local businesses, which matches the targets; many members are also
  service sellers, so solicitation is crowded (INFERRED).
Provisional verdict: MANUAL-ONLY. Fit: MEDIUM (INFERRED). Needs the follow-up searches in section 9.

---

## 6. Facebook Page and Facebook Groups

### 6A. Facebook Page

#### 6A.1 Business promotion
- A Page is Meta's business presence and link posts are supported by the Pages API; I found no
  rule forbidding promotional link posts on a Page (INFERRED). Page Terms/Community Standards
  specifics and disclosure rules: not researched (unknown).
- Link cap (the key finding): in December 2025 Meta confirmed to TechCrunch a limited test in
  which Facebook Pages and profiles in Professional Mode without Meta Verified could share links
  in only 2 organic posts per month; links in comments were not counted then; publishers were
  excluded. SECONDARY (2025-12-17)
  https://techcrunch.com/2025/12/17/facebook-is-testing-a-link-posting-limit-for-professional-accounts-and-pages ,
  https://pressgazette.co.uk/news/facebook-tests-charging-creators-and-businesses-to-post-more-than-two-links-per-month/ ,
  https://www.mediapost.com/publications/article/411459/
- Expansion with Meta One: Social Media Today reported (2026-09-17) that Meta appears to have
  widened the test so non-paying professional accounts are limited to 2 link posts per month
  unless they subscribe to Meta One for Business. Blotato (Sept 2026) says affected free Pages can
  put links in 2 organic posts OR comments per month (comments now count), links to Meta's own
  apps and links in ads do not count, and the limit may not apply to all Pages; Relevant
  Audience adds that publisher Pages are exempt. SECONDARY https://www.socialmediatoday.com/news/facebook-pages-get-charged-for-link-posts/ ,
  https://www.relevantaudience.com/meta/facebook-pages-charged-for-link-posts-meta-one/ ,
  https://www.blotato.com/blog/meta-one-link-limits . No Meta help-center page on the cap was
  found (unknown). Whether API-published link posts count toward the cap: unknown (assume yes).
- Reach of link posts: Relevant Audience, citing Meta's Widely Viewed Content report, says 98.7%
  of US post views in the period did not include a link to a source outside Facebook (SECONDARY,
  same Relevant Audience URL). No reliable official organic-reach figure for Pages found (unknown).
- Recommended posting frequency: no official number found (unknown).
- INFERRED workaround for a free plan: keep most posts link-free and send people through the
  Page's website field / call-to-action button (free Page features, BACKGROUND), saving the 2
  monthly link posts for the highest-value offers. Not verified.

#### 6A.2 Free tier
- Page creation and Pages API: free (BACKGROUND for the Page; Pages API fee-free is not stated
  in the sources seen). Meta One for Business launched 2026-09-15: Essential about 14.99, Advanced
  49.99, Expert 149, Max 499 USD per month, sold per account (SECONDARY, several outlets, e.g.
  https://www.androidcentral.com/apps-software/meta/this-is-everything-the-meta-one-subscriptions-will-offer-you-and-for-how-much-too ,
  https://www.thekeyword.co/news/meta-one-business-plans ). Per-tier link caps conflict
  (section 2). Under the hard limits, paying is out, so the free cap is the working limit.
- API scheduling window: publish time must be 10 minutes to 30 days after the request. OFFICIAL
  https://developers.facebook.com/documentation/pages-api/posts (v25.0 example). A 2026 blog
  claiming 75 days contradicts the docs and should be ignored.

#### 6A.3 Publishing automation
- Official API: POST /{page-id}/feed with message and link; published=false plus
  scheduled_publish_time schedules the post. OFFICIAL
  https://developers.facebook.com/documentation/pages-api/posts . Photo posts via /{page-id}/photos
  (BACKGROUND).
- Permissions (SECONDARY, https://zernio.com/blog/schedule-facebook-posts-via-api ):
  pages_manage_posts, pages_read_engagement, pages_show_list. Review level for an app that only
  serves Pages the app roles own: not verified for the Pages API. INFERRED by analogy to the
  Instagram docs: Standard Access, no App Review. Typical wait if review were needed: unknown.
- Identity: a Page access token posts as the Page, not as a person (BACKGROUND). Posting to
  personal profiles by API is not offered (BACKGROUND).
- Platform's own scheduler: Meta Business Suite (free; BACKGROUND). Free scheduling horizon
  unknown, since Meta One lists "up to a year ahead" as a paid feature.

#### 6A.4 Account setup
- Page creation is done by a human from a personal Facebook profile (BACKGROUND, not verified
  this session); email/phone checks, CAPTCHA, 2FA and any ID checks: unknown. Automated account
  creation: not verified for Facebook, but Instagram's equivalent clause forbids it; do not script
  sign-ups.

#### 6A.5 Automation rules
- Scheduled publishing through the API is documented (6A.3). Spam triggers, labeling of automated
  accounts: not researched (unknown).

#### 6A.6 Reading replies
- Comments on Page posts are readable through the Pages API (pages_read_engagement; probably
  pages_read_user_content as well) and webhooks (BACKGROUND, unverified). Limits unknown.

#### 6A.7 Audience fit: MEDIUM (INFERRED)
Many US contractors and small sellers maintain Facebook Pages and use Facebook for local business
networking; organic Page reach is weak and links are de-emphasized.

#### 6A.8 Verdict: INTEGRATE-AFTER-OWNER-STEP, with the link-cap caveat
Owner steps: create the Page, register the developer app, authorize a Page token. No approval wait
expected for an own Page (INFERRED). Free link promotion may be limited to 2 posts per month.

### 6B. Facebook Groups

- Promotion rules: not researched. BACKGROUND: group admins set the rules and self-promotion is
  commonly banned; treat as disallowed unless the written rules say otherwise.
- API: Meta announced the Groups API deprecation on 2024-01-23 with Graph API v19.0; permissions
  such as publish_to_groups were scheduled for removal around 2024-04-22; developer reports say
  the permission now returns "Invalid Scopes". SECONDARY
  https://developers.facebook.com/community/threads/2076398286093257/ ,
  https://techpoint.africa/2024/02/06/meta-facebook-disrupts-scheduling ,
  https://www.gigazine.net/gsc_news/en/20240206-meta-cuts-third-party-access-facebook-groups
  Only a narrow private-reply workflow with a Page token remains. Not re-checked against Meta's
  current changelog.
- Verdict: MANUAL-ONLY (human, only where the group's own rules permit promotion; default: do
  not use). Any automation would need a browser bot, which the hard limits forbid.

---

## 7. YouTube Community posts and WhatsApp Channels (NOT RESEARCHED; PROVISIONAL)

No live sources were obtained. BACKGROUND (unverified):
- YouTube: the YouTube Data API v3 has no endpoint to create Community-tab posts; posts are made
  in YouTube Studio/app by the channel owner. Eligibility thresholds and link rules for posts:
  unknown for 2026. A new channel with no subscribers has no audience (INFERRED).
- WhatsApp Channels: created and posted to from the WhatsApp app; no official posting API known
  to me; the WhatsApp Business Platform (Cloud API) is for opted-in customer messaging, not
  Channels. New channels start with no followers (INFERRED).
Provisional verdicts: YouTube Community posts NOT-RELEVANT (MANUAL-ONLY if the owner already has a
channel with subscribers); WhatsApp Channels NOT-RELEVANT. Fit: LOW.

---

## 8. Yelp for Business, Bing Places, Apple Business Connect (NOT RESEARCHED; PROVISIONAL)

No live sources were obtained. BACKGROUND (unverified):
- Yelp for Business: free claim of a business page; the public Yelp Fusion/Places API is read-only
  for consumer data; no posting API for organic business posts known; Yelp is consumer-review
  centred. Online-only B2B service = poor fit.
- Bing Places: free listing (can import from Google); needs a physical location or service area;
  no promotional-post feature known to me.
- Apple Business Connect: free place-card claiming for Apple Maps, with "Showcases" (image +
  link promotions) in the portal; partner-only API; needs a real business location.
Provisional verdicts: all three NOT-RELEVANT for an online-only back-office service (MANUAL-ONLY
for a contractor that has a real location). Fit: LOW. Re-check with section 9 queries before
relying on this.

---

## 9. Follow-up searches still needed (budget ran out)

1. Alignable: "Alignable posting guidelines self-promotion", "Alignable terms of service
   automated", "Alignable API", "Alignable Premium vs free".
2. YouTube: "YouTube Data API create community post 2026", "YouTube Community posts eligibility links".
3. WhatsApp Channels: "WhatsApp Channels API post updates 2026", "create WhatsApp Channel requirements".
4. Yelp: "Yelp for Business free page posts links", "Yelp API posting". Bing: "Bing Places posts
   feature", "Bing Places API". Apple: "Apple Business Connect Showcases link", "Apple Business Connect API".
5. Facebook: "Meta Pages terms promotional posts", "Facebook Groups self-promotion policy",
   "pages_manage_posts Standard Access app review own Page", "Facebook Page recommended posting
   frequency Meta", and Meta's own help-center page on link limits / Meta One caps (to settle the
   conflicting per-tier numbers and whether API posts count).
6. Instagram: settle 100 vs 50 per 24 h in Meta's docs; official bio-link rules; Live-mode need.
7. GBP: re-read support.google.com/contributionpolicy/answer/7400114 for the exact Oct 2026 post
   wording; check the access-form page for current approval status/wording.

## 10. Implications for the plan (INFERRED)
- Host the seven sample images as stable public JPEG files (needed by Instagram and by GBP
  media.sourceUrl).
- For Meta platforms assume the free route is bio link / Page website field, not per-post links.
- Start the GBP clock only if Amber One truly qualifies; the API path needs a 60-day-old verified
  profile plus the access approval, so use manual dashboard posts meanwhile.
- Keep each post's text and image unique across platforms and offers (GBP duplicate-content rule).
- All account creation and consent steps are human-only on every platform.
