# StudyProofs and Amber: morning report, 2026-10-17 (sent 08:2xZ; numbers as of the 04:56Z rebuild of the region scan)

Everything below is in this repository with its evidence; nothing was spent, no outreach was sent, no identity step was taken, and Amber IT was cancelled at your word (03:5xZ) with nothing built.

## Live posts (publicly verified)

| Time (UTC) | Platform | Account | Post | Public URL |
|---|---|---|---|---|
| 2026-10-15 23:47:13 | PeerTube (stream.indieagora.com) | StudyProofs (studyproofs, channel studyproofs_demos) | quiz-graded: "Cellular respiration: a 4-question quiz, graded with the reasons" | https://stream.indieagora.com/videos/watch/d552d5a1-e998-4c88-9153-838b4d6798ce |
| 2026-10-16 07:19:40 | Mastodon (101010.pl) | StudyProofs (@studyproofs, bot-flagged, bio with the AI disc | notes-with-sources: "From STAT 200 sample notes: 6 note sections, each with its source lin | https://101010.pl/@studyproofs/117449371188624497 |
| 2026-10-17 01:17 | YouTube Shorts | AmberOne (https://www.youtube.com/@AmberOne-i2t) | bio-sample: "Cellular respiration: notes in, flashcards and a quiz out" | https://www.youtube.com/shorts/dsbz_AhX74s |

Four public posts in all (3 rows in LAUNCH-LEDGER.md), each read back by a GitHub runner. New since the last report: the first YouTube Short (01:17Z, channel AmberOne, verified by the runner's oEmbed read). The YouTube slot is daily at 22:00Z (the next upload is the lane's own; the 22:45Z check-in verifies it); PeerTube and Mastodon keep one post a day at 19:00Z and 18:00Z.

## What changed overnight

- **Video (your Remotion request)**: the official Remotion plugin is installed; one 30-second vertical Short from the reviewed BIO 101 material (bio-30s, "Cellular respiration: notes in, flashcards and a quiz out") is rendered, inspected frame by frame and in the lane's library; the cloud render workflow (`.github/workflows/sp-video-render.yml`) renders it with the laptop off — measured: 544 s on the 2-vCPU runner, 621 s for the whole run, about 10.4 runner-minutes per 30-second Short (0 ms billable inside the repository's included minutes), artifact kept 14 days and the MP4 pushed to branch `video/render-39002570204`. Distinct compositions for LaunchReady (launchreadyal.com) and Reelo (myreelo.com, Story Book inside it) are drafted from their live pages and merged, not published: they wait for your word on which products are active (launchready.ai or launchreadyal.com; DateWise's page is a Flutter canvas the runner cannot read).
- **Promotion boards (the registrar)**: AnunțGratuit.ro — registered and verified, held for good under your place rule (the board files every ad at a county and locality; nothing posted). Kowika.nl — five registrations over two days drew no confirmation mail; the registrar now stops after two per board (amberai #872) and the line reads "no further one is sent — the owner's word decides". Casinuevo Colombia — registered at 04:36Z, then found to have a reCAPTCHA-protected login; Amber never solves or evades one, so the board is skipped (its ad-form mapping is written and parked). c7.io (Mastodon) — the confirmation mail never arrives and the server refuses to send it again (HTTP 401); the registrar stops asking after two refusals (#871) and keeps checking the mailbox. uri.life (Mastodon, Korea) — your CAPTCHA step; the link is in the vault as MASTODON_KR_CONFIRMATION_LINK.
- **Code merged in amberai** (each on green CI, under your standing authorization): #865 the Short and its library entry; #866 the LaunchReady and Reelo compositions; #867 the place rule in the board adapters; #868 the render lockfile; #869 Casinuevo as a registrar board; #870 ffprobe on the render runner; #871 the Mastodon registrar's refused-ask cap; #872 the board registrar's two-registration cap and login-CAPTCHA rule. Each worker deploy costs the promotion tracker 8–30 minutes of ticks (the first tick after a restart comes late); deploys are worth batching.
- **Paid tasks**: fresh passes 10, 11 and 12 (02:41Z, 04:31Z, 06:41Z) found nothing payable. Noted with the hold: four Opire-funded Claude Code bounties (claude-builders-bounty #1 $50, #2 $75, #3 $100, #5 $200 — a CHANGELOG skill, a CLAUDE.md template, a pre-tool-use hook, an n8n workflow) that Amber could build, but payment runs through Opire (Stripe) and needs an account and payout identity in your name; the issues have been open since March with 1,264–2,354 claim comments each and no merge. An Algora wildcard reward (Go-Hybrid #378) needs your Stripe identity as before.

## Region scan: totals

6,546 site rows across the 54 countries and the fediverse (`STUDYPROOFS-EXPERIMENT-2026-10-11/REGION-SCAN-2026-10-16.csv`, regenerated 04:56Z from the runner reads and the hand-written verdicts in `scan/review/verdicts.json`; diagnostic reads are no longer counted). Chunks 10–15 of the search discovery were judged overnight (about 70 new verdicts); the avisos/ciudadanuncios network and three Classicads boards are deferred (script-only forms).

| Region | Sites | Qualified | Conditional | Rules prohibit | Skipped | Not read | No rule found |
|---|---|---|---|---|---|---|---|
| North America | 694 | 0 | 1 | 9 | 532 | 78 | 74 |
| Northern Europe | 413 | 0 | 9 | 9 | 272 | 90 | 33 |
| Oceania | 72 | 0 | 0 | 0 | 36 | 31 | 5 |
| Western Europe | 1725 | 4 | 10 | 22 | 1418 | 104 | 167 |
| Southern Europe | 390 | 0 | 5 | 7 | 252 | 45 | 81 |
| Central & Eastern Europe | 261 | 1 | 11 | 2 | 89 | 74 | 84 |
| South Asia | 93 | 0 | 4 | 2 | 28 | 28 | 31 |
| Latin America | 316 | 4 | 28 | 8 | 93 | 83 | 100 |
| Southeast Asia | 178 | 0 | 6 | 3 | 84 | 46 | 39 |
| Sub-Saharan Africa | 138 | 5 | 1 | 0 | 52 | 41 | 39 |
| Middle East & North Africa | 194 | 2 | 13 | 2 | 65 | 52 | 60 |
| East Asia | 345 | 1 | 10 | 1 | 208 | 53 | 72 |
| Global (directories, protocols) | 125 | 0 | 4 | 6 | 41 | 45 | 29 |
| Fediverse servers outside the 54 countries | 1602 | 2 | 16 | 17 | 1033 | 204 | 330 |
| All | 6546 | 19 | 118 | 88 | 4203 | 974 | 1144 |

Skipped, by reason (sites): approval 2452, closed 908, captcha 514, fit 141, phone 71, age 51, identity 42, payment 19, ai 3, automation 2. "Not read" is blocked, unreachable or missing; "No rule found" is read but without a rule about promotion (unverified, unclear sign-up forms, open relays).

## Skipped sites and why (the night's judgements)

- **Login or sign-up CAPTCHA** (never solved or evaded): Casinuevo Colombia (login), uri.life (confirmation page), and 512 more rows.
- **Local place required** (your place rule): AnunțGratuit.ro (county and locality on every ad; account kept, nothing posted); the avisos/ciudadanuncios network and Bazik judged the same way from their forms.
- **No confirmation mail**: Kowika.nl (five registrations, none confirmed; capped).
- **Phone, date of birth, identity or payment at sign-up**: 183 rows (phone 71, age 51, identity 42, payment 19).
- **Rules prohibit** business ads, links or automation: 88 rows.
- **Admin approval or closed registration**: 3360 rows (the bulk of the fediverse).

## What needs your word (nothing else is blocked)

1. **Active products for the videos**: launchready.ai or launchreadyal.com; DateWise AI's features (its page cannot be read by the runner). The LaunchReady and Reelo Shorts render in the cloud the moment you confirm.
2. **uri.life**: the one-time CAPTCHA on the confirmation page (link in the vault).
3. **myproduct.co.il**: stays stopped until `studyproofs-promo: resume` on #105.
4. **Kowika.nl**: drop it, or say if another mailbox should receive its mail; nothing more is sent on its own.
5. **Paid work behind a payout identity**: Algora and Opire bounties need a Stripe account in your name; the hold stands until you say otherwise.
6. **Next registrar board**: aggelioforos.gr (Greece, a Listivo board: username, e-mail, password, no CAPTCHA marker, terms without a ban) — its ad form sits inside the member panel, so the place field is read after a registration under your existing authorization; it is held like AnunțGratuit if the field demands a locality. I proceed unless you say no.

Evidence and times for everything above: `SPRINT-TEN-OFFERS-2026-10-10/HANDOFF.md` (addenda 02:55Z–07:15Z), `PAID-TASKS-2026-10-16/VERIFICATION.md` §7, `STUDYPROOFS-EXPERIMENT-2026-10-11/LAUNCH-LEDGER.md`, tracker comment 6113510213 on amberai #105.
