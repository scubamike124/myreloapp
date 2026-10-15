# Which free sites Amber may register on and post to by herself: the sites' own words (read 2026-10-15, 15:30Z to 17:44Z)

The owner's rule of 2026-10-15: use free college-student promotion sites autonomously wherever the site's rules allow it; create a free account with our real identity and an inbox Amber can read; never invent a personal identity, never evade a CAPTCHA or a verification, never post where automation or promotion is prohibited; a site that needs the owner's phone, an identity check or their personal approval is skipped and listed. Every line below was read by a runner from the site's own API or policy page at the time given (amberai `sp-channel-eligibility.yml` runs 38760931072, 38761636556, 38762248446, 38762537984); nothing was created or posted during the reads.

**Updated 18:10Z.** The owner's second rule (17:3xZ): never the owner's birthday to unlock a platform; find the places that allow a truthful business account without a personal date of birth, in all regions. Rounds 6 to 9 (runs 38778087564, 38779107129, 38779567948, 38779729064, 17:31Z to 17:44Z) read every open Mastodon server in every language that has no age rule, the PeerTube directory, Pixelfed's open servers and Misskey. The answer is in the second table and the section after it; the first table's Mastodon rows are amended for the rule.

## The result in one table

| Site | What its own words say | Can Amber register and post by herself? | What it would take |
|---|---|---|---|
| Bluesky (bsky.social) | `describeServer`: `phoneVerificationRequired: true`, `inviteCodeRequired: false`. Guidelines (2025-09-19): commercial content must be clearly identified; no spam. | **No: a phone number is verified by SMS at sign-up.** | your phone, once (5 min); then Amber's existing Bluesky publisher posts daily |
| mastodon.social (fediverse, 267,396 active users, the largest) | registrations open, no approval, **min_age 16**; rules: no advertising rule; "use of generative AI must be disclosed"; terms (effective 2026-08-31) have no automation clause. Mastodon's API requires `date_of_birth` when a server has a minimum age. | **Not under the owner's rule of 17:3xZ: the sign-up needs a date of birth, which stays unasked.** Amber's registrar passes over every server with an age rule (amberai #840) and says so on the tracker. | nothing is asked of you. (If you ever open @studyproofs there by hand, `MASTODON_INSTANCE` and `MASTODON_ACCESS_TOKEN` in the vault let Amber post daily.) |
| mstdn.party (open, 1,716 active, min_age 18, "You must specify whether your account is automated") and mstdn.plus (open, 598 active, min_age 16, "Bots must be marked as bots ... automated posts should be unlisted") | no rule against advertising; bots allowed when declared | **Not under the same rule** (an age rule on each) | nothing |
| ieji.de (open, 1,238 active, no age rule) | extended description: "Accounts mainly used for spam, porn, advertisements or backlinking are immediately deleted. We do not allow fully automatic AI accounts." | **No: its rules forbid exactly this account.** | nothing; not asked of you either |
| mastodon.au, cupoftea.social, mastodon.uno, mastodon.nz | "No AI Accounts, or AI generated content, without express prior approval" / "No AI Accounts" / "Sono vietati gli account gestiti dall'IA" / "No AI Accounts ... Personal accounts only" | **No** | nothing |
| social.vivaldi.net, masto.nu, glasgow.social, mstdn.ca, techhub.social, defcon.social, cyberplace.social | "No promotion of AI, Cryptocurrencies or NFTs" / "No advertising, spam or excessive promotion" / "No spam. This includes commercial advertising, promotional campaigns, and SEO" / "advertising or mass-marketing posts will be actioned" / "no direct advertising selling products or services" / "spam & commercial advertising are forbidden" / "Each username on here should be a person, not a brand" | **No** | nothing |
| mstdn.social, mastodon.world, hachyderm.io, universeodon.com, piaille.fr, mastodonapp.uk, mstdn.jp, fediscience.org | approval by a person required for each new account (and mstdn.social: "AI Agents are charged €100 for account processing") | **No: a person approves each account**; and most also forbid advertising | nothing |
| mastodon.online, mas.to, scholar.social, sciences.social, mastodon.cloud | registrations closed or invitation-only (sciences.social: "due to a high percentage of spam/AI requests") | **No** | nothing |
| Lemmy (lemmy.world, lemmy.ml, lemmy.zip, lemmy.ca, feddit.uk, feddit.org, programming.dev, discuss.online, lemmy.today, reddthat.com, lemmy.dbzer0.com) | every instance: `registration_mode: RequireApplication` (a person reads each application), most with `captcha: true`; the student communities found have 18 to 152 subscribers | **No: an application read by a person, usually behind a CAPTCHA**; and almost no students there | nothing |
| Pixelfed (pixelfed.social, open, no approval) | guidelines: "Excessive advertising" is removed from the public timeline; sign-up page `/register`: HTTP 403 "Just a moment", a Cloudflare bot check | **No: a bot check guards the sign-up.** | you sign up (2 min), make a personal access token in Settings, Applications, and put it in the vault as `MASTODON_INSTANCE` = https://pixelfed.social and `MASTODON_ACCESS_TOKEN` (Pixelfed speaks Mastodon's API); Amber then posts the pictures daily |
| Misskey (misskey.io) | `disableRegistration: true`; Cloudflare Turnstile on | **No** | nothing |
| Tumblr | Community guidelines: "Mass Registration or Automation. Don't register accounts or post content automatically, systematically, or programmatically" | **No: forbidden outright** | by hand only (studyblr) |
| dev.to | Terms: content "not designed primarily for the purposes of promotion or creating backlinks"; developers, not students | **No** | nothing |
| Hashnode | Acceptable use: no "unsolicited promotional content ... or automated content generation"; developers, not students | **No** | nothing |
| Product Hunt, Futurepedia, Toolify, There's An AI For That, Launching Next | each page answered HTTP 403 "Enable JavaScript and cookies to continue": a Cloudflare bot challenge in front of the sign-up or submit form | **No: a bot check guards the form.** | by hand (texts in LAUNCH-APPROVAL.md Part 3) |
| AlternativeTo, SaaSHub, BetaList, ISTE EdTech Index, Notion template gallery, AnkiWeb | forms for a person (AlternativeTo's and Notion's submit addresses have moved; BetaList's pages carry Cloudflare Turnstile; AnkiWeb's register page is a JavaScript app; SaaSHub's free "Submit" tool is a B2B directory) | **No** (a person fills a form; none is a student place) | by hand, optional |
| Discord study servers, Facebook study groups, Quora, Reddit, Instagram, TikTok, X, LinkedIn, YouTube | the rules read on 2026-10-13 (LAUNCH-PLAN-2026-10-13.md): self-bots banned, automation banned, phone or app review needed, or no free API; Reddit excluded by your rule | **No** (Amber's own publishers work for YouTube, Facebook Page, Threads, LinkedIn once you connect an account) | the connection list in OWNER-CONNECTIONS-2026-10-14.md |

## Rounds 6 to 9 (17:31Z to 17:44Z): every open server without an age rule, in all languages; the video and picture fediverse

Read from each server's own API (`/api/v2/instance`, `/api/v1/instance/rules`, `/api/v1/instance/extended_description`, the terms page where there is one) and, for PeerTube, `/api/v1/config` and `/api/v1/config/about`. "Open" means registrations enabled with no approval. Nothing was created or posted during the reads.

| Site (region) | What its own words say | Can Amber register and post by herself, with no date of birth? |
|---|---|---|
| **stream.indieagora.com (IndieAgora, United Kingdom; PeerTube 8.1.7; English)** | sign-up allowed, no approval, e-mail verification on, minimum age 13 as a condition of the terms (there is no date-of-birth field in PeerTube's sign-up), 5 GB a user and 2 GB a day of video, robots allowed, no CAPTCHA marker on the sign-up; "a space for creators, artists, thinkers, and explorers"; what is not allowed: gore, pornography, abuse, copyright breaches, spam, scams; nothing against an automated or a business account | **Yes.** Chosen: Amber opens StudyProofs' account there herself and uploads the six demonstration videos, one a day (amberai #841). A PeerTube video is a public page and federates to Mastodon. |
| peertube.cif.su (Russia, free-speech instance) | advertising allowed with a watermark and a timestamp | allowed by its words; not chosen (its reputation would attach to the product) |
| clip.place | bans automated advertising | **No** |
| veedeo.org, peertube.uno, mesnumeriques' PeerTube | ban promotion | **No** |
| play.kryta.app | a shop's own instance | **No** |
| the other open PeerTube instances in the directory | upload quota 0 for a new account, or closed sign-up | **No** |
| uri.life (Korea; Korean) | bots allowed under extra rules; no rule against promotion | allowed by its words; a poor fit (Korean-language community) |
| c7.io (China; Chinese creators) | anything not banned is allowed | allowed by its words; a poor fit (Chinese-language community) |
| theatl.social (Atlanta, United States) | a regional server for Atlanta | allowed by its words; a poor fit (one city) |
| mastodon.au, cupoftea.social, mastodon.uno, mastodon.nz, fairy.id, sakurajima.moe | ban AI or automated accounts | **No** |
| social.vivaldi.net | no AI promotion | **No** |
| mstdn.ca | advertising or mass-marketing posts are actioned | **No** |
| masto.nu, glasgow.social, mastodon-belgium.be, mastodon.pub.solar, mastodon.com.pl | ban advertising | **No** |
| mastodon.nu | advertising needs the admin's permission | **No** (a person's permission first) |
| nrw.social (Germany) | bans "unmarked, automated or excessive advertising and pure advertising accounts" | **No** |
| pouet.chapril.org (France) | its CGU bans robot accounts without a prior request | **No** |
| tkz.one, mast.lat (Spanish-speaking) | ban auto-publishing accounts | **No** |
| mastodon.vlaanderen (Belgium) | bots need the admin's leave | **No** |
| masto.nyc, gardenstate.social, masto.yttrx | "Be a New Yorker" / "No companies outside New Jersey" / "People, not companies" | **No** |
| organica.social, cyberplace.social | 18+ rule and no advertising / persons only | **No** |
| Pixelfed's open servers (gram.social 106k active, pixelfed.uno 81k, pixelfed.de, pxlmo.com, pixelshot.it, metapixl.com, pixelfed.dk, pixelfed.es, chroma.social) | open registration in the FediDB directory, but Pixelfed signs up through its web form only (no registration API; pixelfed.social's form sits behind a Cloudflare bot check) | **No by herself**; by hand it is a 2-minute sign-up and a token (OWNER-CONNECTIONS) |
| misskey.io | registrations closed; Cloudflare Turnstile on | **No** |
| Lemmy, every instance read | an application read by a person, usually behind a CAPTCHA | **No** |

## The answer to the owner's question of 17:3xZ, in all regions

The free places whose own words allow a truthful, declared business account with no personal date of birth are: the open PeerTube instances (IndieAgora qualifies outright and is the one chosen; cif.su allows it but is not worth the association), three open Mastodon servers whose audiences are a poor fit for an English study tool (uri.life, c7.io, theatl.social), and Pixelfed's open servers by hand only. Every Mastodon server with reach either has an age rule (mastodon.social, mstdn.party, mstdn.plus: a date of birth in the sign-up, which stays unasked), bans automated or advertising accounts, approves each account by hand, or is closed. One account on IndieAgora is seen worldwide: a PeerTube video is a public page in every country and federates to every Mastodon server that follows it.

## What was built from this (amberai, 2026-10-15)

- A PeerTube channel (amberai #841, 18:00Z): a registrar that reads IndieAgora's configuration and terms again at every attempt, opens `studyproofs` with the onboarding mailbox Amber reads (`onboard.peertube@<inbound domain>`), a generated password and the channel `studyproofs_demos`, verifies by the mailed link, and sets the account's and the channel's descriptions to say the account is automated and run by AmberOne AI; and an uploader that puts one of the six demonstration videos up each day at 19:00Z as a public video (category Education, licence Attribution), read back without a login. Every secret goes to the vault; a taken username, a changed rule, a failed verification or a refusal is on the tracker's PeerTube row.
- The Mastodon registrar walks the open servers and passes over any with an age rule (amberai #840): the birthdate entry is never asked for.

- A Mastodon publisher for the promotion lane (`src/lib/integrations/social/providers/mastodon.ts`): public status in English with the example's picture and the tracked link, one a day at 18:00Z, nothing repeated within 36 hours (the account's own statuses are read first), each post read back without a login (that read is "live"), mentions read as replies. Vault names `MASTODON_INSTANCE` and `MASTODON_ACCESS_TOKEN`.
- A registrar (`src/lib/studyproofs/mastodon-registrar.ts`) that opens StudyProofs' own account on the server named in the vault (mastodon.social unless `STUDYPROOFS_MASTODON_SERVER` says otherwise), only after reading the server's own registration state, age rule, rules and description again, with the onboarding mailbox Amber reads (`onboard.mastodon@<inbound domain>`), a generated password, the bot flag and a bio that says the account is automated and run by AmberOne AI, and the date of birth only from the owner's vault entry. A CAPTCHA on the confirmation page stops it and is listed; a server whose rules ban AI accounts or advertising is refused without asking anyone. Secrets go to the vault; no line carries one.
- The tracker's Promotion section shows the Mastodon and PeerTube rows with each registrar's state (not permitted, pending verification, registered, failed, with the server's reason).

## Worldwide

A fediverse post is seen on every server that follows the account or the hashtags, in every country at once, so one account on the largest open server is the right shape; one account per country would be the duplicate-account behaviour several servers forbid. Posts are in English, the language of the product and the examples.
