# Group D research: free promotion on blogs, Q&A sites, launch sites, the owner's own site and directories

Researched 2026-10-11. Research only: no account was created, no sign-up flow opened, nothing posted, nobody contacted.

## READ FIRST: what was and was not verified

- WebFetch could not reach any site (DNS `ENOTFOUND`), so I never opened a platform page. Every fact below reached me through WebSearch result summaries.
- The WebSearch budget for this turn (200 calls, shared by every agent in it) ran out after about 50 of my searches, at the first searches for platform 7. **Platforms 1 to 6 were searched. Platforms 7, 8, 9 and 10 were NOT searched.** Their sections are written from my own background knowledge (cutoff June 2026), tagged BACKGROUND, and their verdicts are PROVISIONAL. A re-run list is at the end.
- Source tags used throughout:
  - **OFFICIAL**: the URL is on the platform's own domain. I read it through a search summary, not by opening it, so quoted wording is what the summary reported.
  - **SECONDARY**: third party (blog, review site, aggregator, another product's docs, or a vendor's own marketing).
  - **INFERRED**: my reasoning from the facts cited next to it.
  - **BACKGROUND**: from memory, not checked this session. A lead, not a fact.
- A date is given only where the search summary showed one.
- Hard limits applied: no paid plans or ad spend, no Reddit, no unsolicited DMs or cold email, no engagement bait, no browser bots or scripted sign-ups.

## Summary table (verdicts)

| # | Platform | Verdict | Audience fit | Evidence | Why in one line |
|---|---|---|---|---|---|
| 1 | Medium | MANUAL-ONLY | LOW | OFFICIAL | Medium says it issues no new integration tokens and allows no new integrations. A manual post that links to your own services is allowed (2018 policy), with disclosure. |
| 2 | DEV Community | INTEGRATE-AFTER-OWNER-STEP | LOW | OFFICIAL + SECONDARY | Forem API v1 posts with an API key the owner generates. Promotion is tolerated only if the post has value beyond promotion. Developer audience, so build last. |
| 3 | Hashnode | MANUAL-ONLY | LOW | SECONDARY, partly conflicting | The GraphQL API is reported to need paid Pro since May or June 2026. The free web editor still works. The code of conduct bans bulk or automated posting and posting mainly to self-promote. |
| 4 | Substack | MANUAL-ONLY | LOW | OFFICIAL + SECONDARY | No self-serve publishing API. The Developer API only looks up profiles. Notes publishing through an API is partner-only (Buffer, Typefully). Native Notes scheduler exists. Publications whose main purpose is advertising are not permitted. |
| 5 | Tumblr | INTEGRATE-AFTER-OWNER-STEP | LOW | OFFICIAL (limits) + SECONDARY | API v2 with NPF is self-serve: owner makes the account, registers an app and authorizes it. Audience is a poor fit, so skip unless breadth is wanted. |
| 6 | Quora | MANUAL-ONLY | MEDIUM | OFFICIAL, via summaries | No official posting API. A link is allowed only inside a complete, relevant answer, with affiliation disclosed. Repeating the same answer is spam. |
| 7a | Indie Hackers | NOT-RELEVANT (provisional) | LOW | BACKGROUND | Founder and maker community. Not searched. |
| 7b | Product Hunt | NOT-RELEVANT (provisional) | LOW | BACKGROUND | Software and product launches. Not searched. |
| 7c | BetaList | NOT-RELEVANT (provisional) | LOW | BACKGROUND | Early-stage startup directory. Not searched. |
| 8 | Hacker News | NOT-RELEVANT (provisional) | LOW | BACKGROUND | Show HN excludes sign-up pages and reading material. No official write API. Not searched. |
| 9a | Own site tip pages + IndexNow | INTEGRATE (provisional) | HIGH fit (searchers with intent); reach slow and unknown | BACKGROUND | IndexNow needs only a key file on the host plus an HTTP call. No account. Google does not take part. Not searched. |
| 9b | Bing Webmaster Tools | INTEGRATE-AFTER-OWNER-STEP (provisional) | n/a | BACKGROUND | Owner signs in and verifies the site, then creates an API key. Not searched. |
| 9c | Google Search Console | INTEGRATE-AFTER-OWNER-STEP (provisional) | n/a | BACKGROUND | Owner verifies the property. A `Sitemap:` line in robots.txt works with no verification. Not searched. |
| 10 | Free directories | MANUAL-ONLY (provisional) | MEDIUM | BACKGROUND | Candidate list only. Not searched. |

### Facts matrix

| Platform | Free to publish | Self-serve official write API (free) | Platform's own scheduler | Replies readable by an app (free) | Scripted sign-up |
|---|---|---|---|---|---|
| Medium | yes (INFERRED) | NO, closed to new integrations (OFFICIAL) | unknown | no (BACKGROUND) | not allowed by the hard limits |
| DEV | yes | YES, API key (OFFICIAL docs) | unknown | yes, public comments endpoint (BACKGROUND) | not allowed by the hard limits |
| Hashnode | yes in the web editor | reported NO, Pro is paid (SECONDARY) | unknown | only through the paid API | not allowed by the hard limits |
| Substack | yes | NO (partner-only for Notes) | Notes scheduler yes (OFFICIAL) | no official route found | not allowed by the hard limits |
| Tumblr | yes | YES (OFFICIAL docs, SECONDARY detail) | queue and schedule states (BACKGROUND) | yes, notes endpoint (BACKGROUND) | not allowed by the hard limits |
| Quora | yes | NO | none | no | not allowed by the hard limits |

### Exact owner-only steps, by platform

- **Medium**: answer one yes/no question: did the owner generate an integration token before 2025-01-01? If yes it may still work (OFFICIAL says all existing tokens continue to work). Otherwise manual posting only.
- **DEV**: create the account, confirm the email, generate an API key in account settings (the path is BACKGROUND: Settings, Extensions), put the key in the vault.
- **Hashnode**: nothing to build now. Optional zero-cost test: owner creates a free publication and a personal access token and tries one read-only query. If it works, the paywall report is wrong and the verdict becomes INTEGRATE-AFTER-OWNER-STEP.
- **Substack**: owner creates the account and publication. Any automation would be through Buffer's partner integration, which the owner would connect himself (not evaluated further).
- **Tumblr**: owner creates the account and blog, registers an app, completes the OAuth consent screen.
- **Quora**: owner creates the account and posts by hand.
- **IndexNow**: no owner step beyond deploying a key file. **Bing Webmaster Tools** and **Search Console**: owner signs in and verifies the site (file, tag or DNS record).
- **Directories**: owner submits and verifies each by hand.

---

## 1. Medium

**Verdict: MANUAL-ONLY.** Audience fit: LOW.

1. **Business promotion.**
   - Medium's own 2018 policy post says you may promote "your own work or goods and services you provide, like a link to your website or your book", may not advertise or promote third-party products, services or brands, and must disclose affiliate links or payment for a post. [OFFICIAL, September 2018] https://blog.medium.com/ad-free-medium-aeee8ef5dacf . This is eight years old and I found no 2025 or 2026 update.
   - The current Medium Rules give Medium "sole authority and final decision" on whether content violates them and list prohibitions such as buying or selling social interactions. In the part the summary showed, they do not mention self-promotion. [OFFICIAL] https://policy.medium.com/medium-rules-30e5502c4eb4 and https://help.medium.com/hc/en-us/articles/213477928
   - Link suppression or reach penalty: no first-party statement found. A marketing guide says to post nothing that resembles spam or exists mainly to drive traffic or sales. [SECONDARY] https://neilpatel.com/blog/marketers-guide-to-medium/ . From memory, Medium's distribution standards may leave promotional stories undistributed beyond followers. [BACKGROUND, unverified]
   - Conditions I would apply: disclose that Amber One sells the service, give a complete tip in the body, one link. [INFERRED]
2. **Free tier.** No fee to publish was found. Cost, limits: unknown. Partner Program and paid membership are not needed to publish (BACKGROUND).
3. **Publishing automation.** The official API is closed. The help article says Medium "will not be issuing any new integration tokens for our API and will not allow any new integrations. All existing tokens will continue to work." [OFFICIAL, no date shown] https://help.medium.com/hc/en-us/articles/213480228-API-Importing
   - One integration vendor gives the cutoff as 2025-01-01. [SECONDARY] https://docs.stackone.com/connectors/medium/guides/link-account/integration-token.md
   - n8n's docs say the Medium API is no longer supported and its credentials cannot configure new integrations. [SECONDARY] https://docs.n8n.io/integrations/builtin/credentials/medium/
   - A blog says legacy tokens reportedly still work. [SECONDARY, unverified] https://timetopost.co/blog/medium-api-auto-post-2026/
   - Legacy scopes were basicProfile, listPublications, publishPost, uploadImage. [BACKGROUND] Rate limits: unknown.
   - Manual alternative: Medium has a story import tool that sets a canonical link to the original page. [BACKGROUND, unverified; manual only]
4. **Account setup.** Email, Google, Apple or Facebook sign-in (BACKGROUND). Phone, ID, CAPTCHA, 2FA requirements: unknown. Scripted sign-up is excluded by the hard limits. Human-only: account creation, email confirmation, every publish.
5. **Automation rules.** Medium has sole discretion and bans buying or selling interactions (OFFICIAL, see 1). Platform scheduler: unknown. Browser bots: excluded by the hard limits.
6. **Reading replies.** No. The legacy API had no comment endpoints (BACKGROUND). Replies would be read by hand.
7. **Audience fit: LOW.** Readers skew to writers, tech and self-improvement. Few trade contractors. Some long-tail search value. [INFERRED]
8. **Verdict: MANUAL-ONLY.** It becomes INTEGRATE-AFTER-OWNER-STEP only if the owner already holds a token made before the cutoff.

---

## 2. DEV Community (Forem)

**Verdict: INTEGRATE-AFTER-OWNER-STEP**, build last. Audience fit: LOW.

1. **Business promotion.**
   - DEV's Content Policy sits in its Terms. A DEV moderator quoted it as telling members to be careful not to share content that is too promotional, and that promoting "your product, business, personal brand" is generally fine if the post has "value beyond promotion". [SECONDARY, moderator comment] https://www.dev.to/david1542/i-developed-an-ai-assistant-for-production-issues-468f . The Terms page itself was not opened: https://dev.to/terms
   - DEV Team: DEV "strongly recommends against posting articles that are purely promotional", and content outside the Content Policy may be removed and accounts suspended. [OFFICIAL, DEV Team post] https://dev.to/devteam/dev-org-accounts-tips-for-reposting-blog-content-54eb
   - DEV's help for organizations says to use the canonical link when reposting and to engage genuinely by commenting and following, and lists the content that works: round-ups, tool lists, technical deep-dives, tutorials, fair comparisons. [OFFICIAL] https://dev.to/help/organizations/maximizing-your-dev-organization
   - Archived FAQ: posts can be removed at the moderators' discretion. [SECONDARY, Wayback copy of the official FAQ, 2023-12-01] https://webcf.waybackmachine.org/web/20231201224526/https://dev.to/faq
   - Moderation is by a small team plus tooling, including admin anti-spam terms. [OFFICIAL] https://dev.to/devteam/community-moderation-and-support-on-dev-7me
   - Link suppression or reach penalty: none documented. Unknown.
2. **Free tier.** Free. Reported limits: 10 article creates per 30 seconds and 30 updates per 30 seconds, then HTTP 429. [SECONDARY] https://dev.to/msnmongare/getting-started-with-the-devto-api-a-beginners-guide-1ljo ; 429 carries a Retry-After header [SECONDARY] https://dev.to/morinaga/three-devto-api-behaviors-i-had-to-handle-explicitly-in-a-publish-pipeline-56c0 . Not confirmed in the official docs. Nothing requires payment to publish or be seen: none found.
3. **Publishing automation. Yes, official and self-serve.**
   - `POST https://dev.to/api/articles` with header `api-key` and `Accept: application/vnd.forem.api-v1+json`. The docs warn they may be out of date. [OFFICIAL] https://developers.forem.com/api
   - Body is an `article` object with title, body_markdown, published, tags. `published: true` publishes at once. [SECONDARY examples] https://playbooks.com/skills/rawveg/skillsforge-marketplace/forem-api . `published: false` should create a draft (INFERRED), which fits an approve-then-publish flow. Fields `canonical_url`, `main_image`, `description`, `series`, `organization_id`: [BACKGROUND, not confirmed in this session].
   - Text, link and image: the link and image go in the Markdown. The image must be at a URL (for example on hq.amberoneai.com). No image-upload endpoint was confirmed.
   - The API key is generated by the logged-in user in account settings, as community guides and client-library docs report (for example [SECONDARY] https://docs.juliahub.com/General/Forem/stable/ ). There are no scopes: one key acts as the account. [BACKGROUND]
4. **Account setup.** Owner creates the account and key. Email or social sign-in (BACKGROUND). Phone, ID, CAPTCHA, 2FA: unknown. Scripted sign-up: excluded by the hard limits and likely to trip DEV's anti-spam tooling (INFERRED). Human-only: account, email confirmation, key creation.
5. **Automation rules.** The API is the documented route. The same community guide that gives the rate limits advises not to spam or automate interactions in ways that would violate DEV's community guidelines. [SECONDARY] https://dev.to/msnmongare/getting-started-with-the-devto-api-a-beginners-guide-1ljo . Scheduled posts: unknown.
6. **Reading replies.** Yes, I believe: `GET /api/comments?a_id=<article id>` is public. [BACKGROUND, unverified]
7. **Audience fit: LOW.** DEV is a developer community. Contractors, bookkeepers and shop owners are not there. A tip post about catalog or CRM data could reach a few tech-adjacent people. [INFERRED]
8. **Verdict: INTEGRATE-AFTER-OWNER-STEP.** Owner step: create the DEV account and generate the API key. Low priority.

---

## 3. Hashnode

**Verdict: MANUAL-ONLY** (API reportedly paywalled). Audience fit: LOW.

1. **Business promotion.**
   - Code of Conduct, unacceptable: "Spam and manipulation. Automated or bulk posting, engagement farming, misleading links, SEO abuse, or using the platform primarily for self-promotion without contributing to the community." Hashnode may remove content and suspend accounts without notice. [OFFICIAL] https://hashnode.com/code-of-conduct
   - Terms summary lists "no spam, harassment, hate speech, illegal content, or malicious activity"; the tracker's copy is dated 2026-02-15. [SECONDARY] https://tostracker.app/document/hashnode . Official: https://hashnode.com/terms (also says Hashnode may modify, deprecate or discontinue the API at any time).
   - No numeric threshold for "too much" self-promotion, and no link-suppression statement found.
2. **Free tier.** Free blog, and posting in the web editor costs nothing. Pro is reported at $5 a month or $50 a year; one guide dates "Hashnode Pro launch $5/mo ($50/yr)" to 2026-06-11. [SECONDARY] https://www.poster.ly/guides/hashnode-guide and https://gappsy.com/tools/hashnode/ . Hashnode's earlier official launch post said $7 a month or $70 a year (undated in the summary). [OFFICIAL, older] https://townhall.hashnode.com/meet-hashnode-pro . Price is moot: paid plans are excluded. Custom domains, the GraphQL API and GitHub backup are reported to have moved behind Pro, with existing custom domains kept. [SECONDARY] https://gappsy.com/tools/hashnode/
3. **Publishing automation.**
   - Technically: GraphQL at `https://gql.hashnode.com`, POST only, mutation `publishPost`, a personal access token in the `Authorization` header with no `Bearer` prefix. [SECONDARY] https://timetopost.co/blog/schedule-hashnode-posts-api/ and a mirror of the docs https://scriptagc.wasmer.app/https_apidocs_hashnode_com . The mirror gives 500 mutation requests per minute.
   - **Paywall.** A first-hand post says that in June 2026 "every request, read or write, now requires a Pro plan", quotes an announcement "We're retiring free GraphQL API access" (reason given: scraper and spam abuse), and says a token from a new free publication redirected to the paywall. [SECONDARY, first-hand] https://dev.to/thefreetier/hashnodes-free-blog-platform-quietly-paywalled-its-entire-api-4f92 . A guide dates the API paywall to 2026-05-13. [SECONDARY] https://www.poster.ly/guides/hashnode-guide ; also https://glama.ai/mcp/servers/lzi61843gd
   - **Conflict.** Hashnode's own pricing page still lists "unlimited API usage" on the free plan [OFFICIAL, may be stale] https://hashnode.com/ai , and an aggregator says the API is on all tiers [SECONDARY, looks outdated] https://apis.io/plans/hashnode/hashnode-plans-pricing/ . I could not open the announcement at hashnode.com/announcements/graphql-api.
   - Treatment: assume paywalled (that breaks the no-paid-plans rule) until the owner's zero-cost test says otherwise. One result suggests posting through the web editor's session cookie. Do not: it is a browser-bot route and a likely terms breach.
4. **Account setup.** Unknown (not verified): sign-in methods, CAPTCHA, phone, ID, 2FA. Scripted sign-up excluded. Human-only: account, publication, token.
5. **Automation rules.** Code of Conduct bans automated or bulk posting (OFFICIAL, see 1). An official API route is the sanctioned one when it is available. Scheduled posts: unknown.
6. **Reading replies.** Only through the API, which is reported paid. Manual reading otherwise. [INFERRED]
7. **Audience fit: LOW.** Developer blogging network. [INFERRED]
8. **Verdict: MANUAL-ONLY.** Flips to INTEGRATE-AFTER-OWNER-STEP if the free-token test works.

---

## 4. Substack

**Verdict: MANUAL-ONLY.** Audience fit: LOW.

1. **Business promotion. Two layers.**
   - Publications. The Content Guidelines say Substack "is intended for high quality editorial content, not conventional email marketing" and that it does not permit "publications whose primary purpose is to advertise external products or services, drive traffic to third party sites, distribute offers and promotions, enhance search engine optimization, or similar activities"; brands and commercial organizations "may be subject to additional verification". The official page was last updated 2026-07-20; the marketing paragraph came to me through copies of the text. [OFFICIAL + SECONDARY] https://substack.com/content ; copies https://ecommercefastlane.com/how-to-start-a-substack-to-promote-your-small-business/ , https://prsuperstar.co.uk/substack-pr/ . Spam in comments and replies is also prohibited. A publication that is only a stream of landing-page links is outside the rule; a real newsletter of tips with a soft link is inside it. [INFERRED]
   - Notes. No official rule on external links and no documented reach penalty. One creator reports link Notes getting about 20 views against 1,000 or more for others: a single anecdote, not data. [SECONDARY] https://mackcollier.substack.com/p/what-substack-is-telling-us-about . Substack's own post says external embeds were added to help Notes reach beyond Substack. [OFFICIAL] https://on.substack.com/p/video-and-embeds-on-substack-notes
   - Substack's Community Guidelines for its own programs list spam and repetitive self-promotion as off-limits. [OFFICIAL] https://on.substack.com/p/community-guidelines
2. **Free tier.** Free to start. Substack keeps 10 percent of paid subscriptions only (not used here). [SECONDARY] https://pubstacksuccess.substack.com/p/how-to-start-a-substack-newsletter . Nothing needs payment to publish or be seen: none found.
3. **Publishing automation.**
   - No self-serve public API for posts or Notes. [SECONDARY] https://apis.io/providers/substack/ and https://providers.apievangelist.com/providers/substack/
   - The Substack Developer API (reported released April 2026) is token-gated behind an application and terms. It returns public creator and publication data (names, subscriber counts, bestseller status, URLs). It cannot publish. [OFFICIAL terms, last updated 2026-01-08] https://substack.com/api-tos ; launch date, LinkedIn-handle lookup and the application step [SECONDARY aggregators] https://apis.io/providers/substack/ and https://smtpedia.com/platforms/substack/api/
   - Notes through a partner: Buffer announced Substack Notes on 2026-09-23, "built on Substack's official API" in partnership with Substack. [Buffer's own pages, so SECONDARY for Substack] https://buffer.com/resources/substack-notes-buffer-integration/ ; Buffer's team says Substack gave it access. [SECONDARY] https://theweeklyscrollbybuffer.substack.com/p/you-can-now-post-substack-notes-through . Typefully is also reported as supported. [SECONDARY] https://github.com/Leo-youngk/diary-twitter/pull/19 . Buffer's free plan: 3 channels, 10 scheduled posts per channel; Buffer says Notes are in its API and MCP. I did not find whether other developers can get Notes write access.
   - Platform's own scheduler: Notes can be scheduled in the composer on web, iOS and Android. [OFFICIAL] https://on.substack.com/p/new-on-substack-post-templates-notes . Launch date is 2026-03-23 or April 2026 depending on the guide. Guides say one Note at a time, up to 3 months ahead. [SECONDARY] https://thrivewithcarrie.substack.com/p/schedule-substack-posts-and-notes
   - Do not use cookie-based unofficial libraries (for example https://substack-api.readthedocs.io/ ). The Terms of Use are reported to ban crawling or scraping and "any processes that run or are activated while you are not logged into Substack" (copy dated 2026-05-05). [SECONDARY] https://conductatlas.com/platform/substack/substack-terms-of-use/prohibition-on-spam-and-auto-responders/
4. **Account setup.** Email, Google or Apple sign-in with an emailed login code. [SECONDARY] https://makeyourcopycount.beehiiv.com/p/setting-up-your-substack-account . Phone, ID, CAPTCHA: not found. Commercial brands may be asked for more verification (OFFICIAL, see 1). Scripted sign-up: nothing allows it. Human-only: account, publication, verification, connecting Buffer.
5. **Automation rules.** The native scheduler and the partner API route are legitimate. Bots, scrapers and unofficial clients are prohibited per the terms quote above.
6. **Reading replies.** No official route found. Buffer reports Notes analytics (impressions, engagement); whether it returns replies is not stated. Unknown.
7. **Audience fit: LOW.** A newsletter reading audience, not trade contractors. [INFERRED]
8. **Verdict: MANUAL-ONLY.** A Buffer-based route could become INTEGRATE-AFTER-OWNER-STEP (the owner connects Substack in Buffer); not evaluated, and Buffer's own API terms were not checked.

---

## 5. Tumblr

**Verdict: INTEGRATE-AFTER-OWNER-STEP.** Audience fit: LOW. I would skip it unless breadth is the goal.

1. **Business promotion.** The User Guidelines (last modified 2026-01-09) say spam is not allowed; "do not use deceptive means to generate revenue or traffic, or create blogs with the primary purpose of affiliate marketing"; no dubious code such as redirects or injected ads; no overloading posts with irrelevant tags. Contests and giveaways follow separate Promotions Guidelines (follows, reblogs and likes cannot be entry methods). [OFFICIAL] The summary attributed this text to Tumblr's own guideline pages (the search returned https://www.tumblr.com/abuse/trafficking , /abuse/privacy and /abuse/gore); I could not pin down which URL carries the spam and affiliate wording. The usual address of the guidelines is https://www.tumblr.com/policy/en/community [BACKGROUND, not checked]. Promotions summary [SECONDARY, undated] https://www.webpronews.com/tumblr-policies-specific-changes-announced/ . I found nothing that bans a business blog from posting a useful tip with its own link. Link suppression: unknown.
2. **Free tier.** Free. Limits [OFFICIAL] https://www.tumblr.com/docs/api : 300 calls per minute, 18,000 per hour and 432,000 per day per IP; 1,000 per hour and 5,000 per day per consumer key; 250 new published posts (including reblogs) per day per user; HTTP 429 when exceeded. Developers can ask Tumblr for higher limits. [SECONDARY, August 2024] https://rollout.com/integration-guides/tumblr/api-essentials . Blaze is paid promotion and is not used.
3. **Publishing automation. Yes, API v2 with NPF.**
   - Official docs: https://www.tumblr.com/docs/api/v2 (create post in a blog, NPF content blocks).
   - Register an app at https://www.tumblr.com/oauth/apps to get a consumer key and secret. [SECONDARY] https://rollout.com/integration-guides/tumblr/api-essentials . No review step found. I could not confirm that new registration is open in 2026.
   - Auth: OAuth 1.0a fully supported; OAuth 2 with scopes `basic`, `write`, `offline_access` at `https://api.tumblr.com/v2/oauth2/token`. [SECONDARY] https://www.skillsdirectory.com/skills/rawveg-tumblr
   - NPF create-post route is `POST /v2/blog/{blog-identifier}/posts` (BACKGROUND). One aggregator lists the legacy `/post` route instead. [SECONDARY] https://publicapi.dev/tumblr-api . Image, text and link blocks are supported by NPF (BACKGROUND). Check the Methods section of the official docs before coding.
   - Platform risk: the move of Tumblr onto WordPress is on indefinite hold (July 2025). [SECONDARY] https://gadgetbond.com/tumblr-wordpress-migration-on-hold/ . I found no 2026 API announcements.
4. **Account setup.** Email, username and password (BACKGROUND). Email verification, CAPTCHA, phone, 2FA: unknown. Scripted sign-up excluded. Human-only: account and blog, app registration, OAuth consent.
5. **Automation rules.** API posting is the sanctioned route. The API has draft, queue and scheduled states (BACKGROUND). Spam, deceptive traffic generation and tag stuffing are banned (see 1).
6. **Reading replies.** Yes, I believe: `GET /v2/blog/{blog}/notes?id=<post id>` returns notes including replies. [BACKGROUND, unverified]
7. **Audience fit: LOW.** Mostly fandom, art and culture. [INFERRED]
8. **Verdict: INTEGRATE-AFTER-OWNER-STEP.** Owner steps: create the account and blog, register the app, approve the OAuth consent.

---

## 6. Quora

**Verdict: MANUAL-ONLY.** Audience fit: MEDIUM.

The wording below comes from one extended-mode search that summarized Quora's help-center pages. I could not open them, and a follow-up search did not corroborate the "Professional Business Profile" point.

1. **Business promotion. Allowed only inside a real answer.**
   - "Self-promotional links or self-promotion that does not form a part of a direct and helpful response to the question is not allowed." [OFFICIAL] https://help.quora.com/hc/en-us/articles/9456583756180-Question-and-Answer-Policies and https://help.quora.com/hc/en-us/articles/115004211543-What-are-the-main-policies-and-guidelines-for-writing-answers-on-Quora-
   - The gist of an answer must be understandable without leaving Quora. Answers that cannot be, and appear to be promotional, may be treated as spam. Affiliate links are not allowed. Relevant affiliations must be disclosed in the answer or the credential. [OFFICIAL, same pages]
   - Posting the same answer on many questions counts as spam when it is not customized to each. [OFFICIAL] https://help.quora.com/hc/en-us/articles/360000470206-What-is-Quora-s-policy-on-plagiarism-and-attribution
   - Spaces: posting irrelevant answers or "excessively promoting the same product or service for the purpose of driving traffic or gaining money" is spam. [OFFICIAL] https://help.quora.com/hc/en-us/articles/360043961972-Spaces-Policies
   - General platform rules: https://help.quora.com/hc/en-us/articles/360000470706-Platform-Policies [OFFICIAL]
   - Business guidance reportedly says answers promoting products or services should be tied to a "Professional Business Profile" and that a website link belongs in the profile rather than in answers. [OFFICIAL page, single summary, NOT corroborated] https://business.quora.com/resources/writing-on-quora-as-a-business . Verify before the owner acts.
   - Reach: answers that look promotional are reported to be collapsed or deleted. [SECONDARY] https://www.infidigit.com/blog/quora-answers-collapsed-and-deleted . Third-party "one link in ten answers" rules of thumb are not Quora policy.
2. **Free tier.** Free to answer and to run a Space. Quora Ads are paid and out of scope. [OFFICIAL, for contrast] https://quoraadsupport.zendesk.com/hc/en-us/articles/25153521403277-Quora-Advertising-Policies
3. **Publishing automation.** No official API for answers, posts or Spaces was found. Third-party scraper APIs exist (SocialCrawl, Bright Data, Apify) and are read-only and unsanctioned. [SECONDARY] https://www.socialcrawl.dev/platforms/quora . A fragment of Quora's terms, quoted on a scraping vendor's page (the summary named the vendor "3i Data Scraping"; exact URL not identified), bars accessing or searching the Service by automated means other than its published interfaces. [SECONDARY] Another vendor says scraping Quora is against its terms. [SECONDARY] https://www.promptcloud.com/is-it-legal-to-scrape-quora/ . The terms themselves are at https://www.quora.com/about/tos [BACKGROUND address, not opened].
4. **Account setup.** Unknown (not verified): sign-in methods, phone, ID, CAPTCHA, 2FA. Multiple accounts linked to one identity for manipulation are a ban trigger. [SECONDARY, vendor with a commercial interest] https://multilogin.com/?p=115890 . Scripted sign-up excluded. Human-only: everything.
5. **Automation rules.** Scripted posting is not supported and the terms fragment above forbids it. [INFERRED]
6. **Reading replies.** No API. By hand only.
7. **Audience fit: MEDIUM.** People ask "how do I chase unpaid invoices" or "how do I clean duplicate contacts". Evergreen and intent-matched, but link rules are strict and results here are unmeasured. [INFERRED]
8. **Verdict: MANUAL-ONLY.**

---

## 7. Indie Hackers, Product Hunt, BetaList (NOT SEARCHED: BACKGROUND ONLY, PROVISIONAL)

None of this was checked this session. Official pages to verify: https://www.indiehackers.com/ , https://www.producthunt.com/ and https://api.producthunt.com/v2/docs , https://betalist.com/

| Item | Indie Hackers | Product Hunt | BetaList |
|---|---|---|---|
| Service (not software) allowed? | unknown | unknown. Launches are for products; services and agencies may be excluded. | unknown. Directory of early-stage startups. |
| Link and promotion rules | Self-promotion is tolerated when it adds value; spam is not. [BACKGROUND] | Soliciting upvotes is discouraged or penalized. [BACKGROUND] | Free submission waits in a queue; a paid fast lane exists and is not to be used. [BACKGROUND] |
| API to post | none known | GraphQL API v2 exists (OAuth). I could not confirm any mutation that creates a launch. Commercial use of the API is reported as restricted. Unknown. | none known |
| Replies readable | no known API | read access exists; comments on your launch are readable by a token (BACKGROUND, unverified) | not applicable |
| Account | owner, by hand | owner, by hand | form submission, by hand |
| Audience fit | LOW: indie software founders | LOW: tech early adopters | LOW: tech early adopters |
| Verdict | NOT-RELEVANT (provisional) | NOT-RELEVANT (provisional) | NOT-RELEVANT (provisional) |

---

## 8. Hacker News (NOT SEARCHED: BACKGROUND ONLY, PROVISIONAL)

Official pages to verify: https://news.ycombinator.com/showhn.html , https://news.ycombinator.com/newsguidelines.html , https://github.com/HackerNews/API

- **Show HN.** It is for something people can try (run or hold). Blog posts, sign-up pages, newsletters and lists are off-topic for Show HN and belong in a regular submission. [BACKGROUND] A person-reviewed report service is not something a reader can try, so it does not qualify. [INFERRED]
- **Promotion.** The guidelines say not to use HN primarily for promotion and not to solicit upvotes or comments. [BACKGROUND]
- **API.** The official API is read-only. No official submit endpoint is known. [BACKGROUND] Automated submission would be unsupported.
- **Free tier, account, replies.** Free. Account by hand. Replies readable through the read-only API only (BACKGROUND).
- **Audience fit: LOW** (developers). **Verdict: NOT-RELEVANT (provisional).**

---

## 9. The owner's own website as a channel (NOT SEARCHED: BACKGROUND ONLY, PROVISIONAL)

Official documents to verify: https://www.indexnow.org/documentation , https://www.indexnow.org/faq , https://learn.microsoft.com/en-us/bingwebmaster/ , https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap , https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl , https://developers.google.com/search/docs/essentials/spam-policies , https://developers.google.com/search/apis/indexing-api/v3/quickstart

### 9a. Tip pages on hq.amberoneai.com
- No third-party rules apply. Search-engine spam policies do. Google's spam policies target mass-produced low-value pages ("scaled content abuse") however they are made. Each tip page should hold a real, distinct tip, a real sample image with alt text, a canonical URL, a link to the matching offer page, and an entry in the sitemap. [BACKGROUND]
- Audience fit: HIGH, because a person searching "follow up on stale estimates" is the buyer. Reach depends on indexing and ranking, which are slow for a young site and unknown here. [INFERRED]

### 9b. IndexNow. Verdict: INTEGRATE (provisional)
- Open protocol from Microsoft Bing and Yandex. Engines named by the owner: Bing, Yandex, Seznam, Naver. The official list may add others (for example Yep): check. [BACKGROUND]
- **Verification: only a key file.** Make a key of 8 to 128 characters (letters, digits, dashes). Host a UTF-8 text file at `https://<host>/<key>.txt` containing the key (or name another location with `keyLocation`). No account, no webmaster-tools sign-in. [BACKGROUND]
- Submit by `GET https://api.indexnow.org/indexnow?url=<url>&key=<key>` or by `POST` of JSON `{host, key, keyLocation, urlList}` with up to 10,000 URLs. One submission is shared with the other participating engines. [BACKGROUND]
- Replies: 200 and 202 accepted (202 means key validation pending); 400 bad format; 403 key not valid or not found; 422 URLs do not belong to the host or the key does not match; 429 too many requests (treated as possible spam). [BACKGROUND]
- It reports new, changed or deleted URLs and does not guarantee crawling or indexing. Submit only URLs that changed. [BACKGROUND]
- Google is not known to take part (as of my knowledge; unverified for October 2026). Use the sitemap route for Google.
- Fully automatable by the worker: deploy the key file, then call the endpoint when a tip page goes live.

### 9c. Bing Webmaster Tools. Verdict: INTEGRATE-AFTER-OWNER-STEP (provisional)
- Free. Owner signs in with a Microsoft, Google or Facebook account and verifies the site by an XML file, a meta tag or a CNAME record, or by importing a verified Google Search Console property. [BACKGROUND]
- After that: sitemap submission and a URL-submission API that uses an API key made by the verified owner, with a per-day quota shown in the portal. The quota for a new site is unknown. Bing steers people to IndexNow. [BACKGROUND]
- Owner-only step: sign in, add and verify hq.amberoneai.com (or the parent domain), generate the API key.

### 9d. Google Search Console. Verdict: INTEGRATE-AFTER-OWNER-STEP (provisional)
- Free. Needs ownership verification: DNS TXT record for a Domain property, or an HTML file, meta tag, Analytics or Tag Manager for a URL-prefix property. [BACKGROUND]
- **Sitemap discovery needs no verification** if robots.txt carries a `Sitemap:` line. [BACKGROUND] Submitting through the Search Console report or API (`sitemaps.submit`, OAuth, verified owner) does need it.
- The old sitemap "ping" URL was retired in 2023 and 2024. [BACKGROUND]
- The Indexing API is only for JobPosting and BroadcastEvent pages. Do not use it for these pages. The URL Inspection API reads status only; "Request indexing" is a manual action with a quota. [BACKGROUND]

### 9e. Typical indexing delay
- Google says crawling a new URL can take from "a few days to a few weeks" and requesting a crawl does not guarantee inclusion. [BACKGROUND, from Google's "Ask Google to recrawl your URLs" page]
- Bing and the IndexNow engines: no official figure. I found no 2025 or 2026 source in this session. **Do not promise a timeline.**

### 9f. Allowed without verification beyond a key file?
- IndexNow: yes (key file only). robots.txt `Sitemap:` line: yes. Bing Webmaster Tools and Search Console features: no, they need the owner to verify the site.

---

## 10. Free small-business directories (NOT SEARCHED: BACKGROUND ONLY, PROVISIONAL)

Candidates only. Each needs a current check of free-listing terms, whether the listing carries a link, and eligibility for an online-only vendor. None has a permitted third-party posting API that I know of, so all are manual.

| Directory | Why it might fit | Submission | Owner-only step | Risk |
|---|---|---|---|---|
| Better Business Bureau (bbb.org) basic profile | US businesses of any size. Accreditation is paid and not needed. | web form | identity and address check | Accreditation upsells. |
| Alignable (alignable.com) | Free network of US and Canadian small businesses, with referrals. | web | account and profile | Spam-sensitive. Do not send mass messages. |
| Manta (manta.com) | Free US small-business listing. | web, claim | claim and verify | Low value. |
| Clutch (clutch.co) | B2B service-provider directory. | web | client review verification | Needs real client reviews. Never fabricate any. |
| Google Business Profile | Free. | web; API only by application | verification (video, phone or postcard) | Needs a real address and in-person service or a service area. An online-only vendor may be ineligible. |
| Bing Places, Apple Business Connect | Free. | web | verification | Same eligibility risk. |

Not a fit (BACKGROUND): Angi, Thumbtack and HomeAdvisor (consumer lead marketplaces, paid per lead); Capterra and G2 (software only); chambers of commerce (paid dues). Yelp and Nextdoor are consumer-local and a weak fit for a B2B back-office vendor.

Verdict: MANUAL-ONLY (provisional). Audience fit: MEDIUM.

---

## Cross-cutting notes

- **What a rule-abiding post looks like on every channel.** One complete, useful tip in the body, a real sample image, one link to the matching landing page, a plain line saying Amber One runs the service, and different text per channel. Identical copies are a problem on Quora (repeated answers are spam), Hashnode (bulk posting) and DEV (purely promotional). Use `canonical_url` to the owner's own tip page where a platform supports it. [INFERRED from the sources above]
- **Free APIs that really exist.** Only DEV, Tumblr and IndexNow are free, self-serve and permitted. DEV and Tumblr reach the wrong audience, so the best-value automation is the owner's own pages plus IndexNow, then Search Console and Bing Webmaster Tools after the owner verifies the site.
- **Do-not-use routes seen in results.** Substack cookie-based libraries, a Hashnode session-cookie workaround, Quora scraper APIs, browser automation for Medium, Quora or Substack. All conflict with the no-browser-bot limit and, where quoted, with the platforms' terms.
- **Lead for another group.** Buffer now supports Substack Notes through an official partner API (2026-09-23) and says it supports Notes in its own API and MCP. If another group evaluates Buffer, check its API and free-plan terms.

## Re-run list for a fresh search budget (highest value first)

1. IndexNow: official documentation and FAQ (engine list, response codes, limits, any Google adoption in 2026).
2. Google Search Console and Bing Webmaster Tools: verification methods, sitemap API, URL-submission quota for new sites, current "Request indexing" quota, official and reported indexing delays in 2025 and 2026.
3. Hacker News: Show HN page, guidelines, any 2026 rule changes on AI text and promotion.
4. Product Hunt: API v2 mutations and commercial-use terms, launch rules for services, account-age rules. BetaList: submission rules, services, free queue. Indie Hackers: posting and promotion rules.
5. Directories: free-listing terms and online-only eligibility for BBB, Alignable, Manta, Clutch, Google Business Profile, Bing Places, Apple Business Connect.
6. Confirmation checks on platforms 1 to 6:
   - Hashnode: official announcement of the API paywall (hashnode.com/announcements/graphql-api).
   - Quora: the "Professional Business Profile" claim on business.quora.com.
   - Medium: current distribution standards on promotional stories.
   - Tumblr: whether new app registration is open, the OAuth 2 scopes, the NPF create-post route.
   - DEV: Terms content-policy text, the `canonical_url` and `main_image` fields, the comments endpoint.
   - Substack: the official marketing paragraph on substack.com/content, and whether Notes write access exists beyond Buffer and Typefully.
