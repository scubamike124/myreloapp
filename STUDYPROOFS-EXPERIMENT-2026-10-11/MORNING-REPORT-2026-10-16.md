# StudyProofs and Amber: morning report, 2026-10-16 (sent 12:3xZ; numbers as of the 11:4xZ rebuild)

## Live posts (publicly verified)

| Time (UTC) | Platform | Account | Post | Public URL |
|---|---|---|---|---|
| 2026-10-15 23:47:13 | PeerTube (stream.indieagora.com) | StudyProofs | quiz-graded | https://stream.indieagora.com/videos/watch/d552d5a1-e998-4c88-9153-838b4d6798ce |
| 2026-10-16 07:19:40 | Mastodon (101010.pl) | @studyproofs (bot-flagged, AI disclosure in the bio) | notes-with-sources | https://101010.pl/@studyproofs/117449371188624497 |

Both were read back publicly by a GitHub runner (PeerTube 23:56Z, privacy public; Mastodon 07:26Z, visibility public). Next slots: Mastodon 18:00Z, PeerTube 19:00Z, one post a day per channel; I verify each publicly after it posts and add it to LAUNCH-LEDGER.md.

Two code changes went up for review and merge this morning (amberai): #850 (the five-day window for paid tasks) and #851 (the classified-boards publisher, first board myproduct.co.il). At 11:33Z you withdrew the five-day rule, so #850 was closed unmerged (its CI had passed; nothing deployed). #851 is held unmerged until you say so.

## Region scan: totals

4,831 distinct sites (6,595 read-only probes, 5,423 pages and servers) across the 54 countries in the code's list, read by GitHub runners overnight and reviewed by hand (552 hand-written verdicts with the site's own words). Standard: a site counts as qualified only when its own current rules or posting page allow a free StudyProofs listing and nothing asks for a date of birth, phone, identity check, payment, CAPTCHA or an admin's approval.

| Region | Sites | Qualified | Conditional | Rules prohibit | Skipped | Not read | No rule found |
|---|---|---|---|---|---|---|---|
| North America | 627 | 0 | 1 | 9 | 511 | 52 | 54 |
| Northern Europe | 310 | 1 | 2 | 8 | 235 | 54 | 10 |
| Oceania | 54 | 0 | 0 | 0 | 34 | 16 | 4 |
| Western Europe | 1556 | 0 | 3 | 15 | 1371 | 80 | 87 |
| Southern Europe | 271 | 0 | 2 | 6 | 231 | 20 | 12 |
| Central & Eastern Europe | 107 | 1 | 3 | 1 | 57 | 27 | 18 |
| South Asia | 41 | 1 | 3 | 1 | 14 | 17 | 5 |
| Latin America | 88 | 1 | 3 | 1 | 36 | 33 | 14 |
| Southeast Asia | 80 | 0 | 0 | 3 | 45 | 23 | 9 |
| Sub-Saharan Africa | 41 | 1 | 0 | 0 | 12 | 27 | 1 |
| Middle East & North Africa | 69 | 1 | 5 | 1 | 25 | 27 | 10 |
| East Asia | 256 | 2 | 5 | 1 | 185 | 23 | 40 |
| Global (directories, protocols) | 97 | 0 | 3 | 5 | 33 | 31 | 9 |
| Fediverse servers outside the 54 countries | 1234 | 0 | 7 | 13 | 980 | 127 | 107 |
| All | 4831 | 8 | 37 | 64 | 3769 | 557 | 380 |

Skipped, by reason (sites): approval 2441, closed 902, captcha 293, fit 73, age 42, phone 24, identity 15, payment 13, ai 3, automation 1.

Examples: phone required — Craigslist (US), Kleinanzeigen (DE), Jodel (DK/NO/SE/FI), ParuVendu (FR), IklanGratiz (ID, its free form marks the phone as required), ÖH Schwarzes Brett (AT); date of birth — Kijiji (CA), Bluesky, willhaben (AT); identity — Marktplaats (NL), 2dehands (BE), Quoka (DE), Evisos (AR); CAPTCHA — Alo.bg, Lento.pl, Publi24 (RO), Citiboard (SE), FreeList (GR), Vivastreet, Studencior (PL), Foititis (GR), Save the Student (GB), Share Your Startup; admin approval — most fediverse servers (approval-required registration) and institutional boards; closed registration — 902 servers and sites; fit — forums for one university, medical-student forums, note-sharing competitors; AI/bot rules — mastodon.nu, mastodon.au, fairy.id.

The "36 regions" list: there is none in the code or the reports. The scout network has 12 regions and 54 countries (`src/lib/scout-network/country-registry.ts`, `countries.ts`); the earnings registry has 3 jurisdictions. Every one of the 54 countries has sites in the scan; the thinnest are Zimbabwe, Senegal, Ghana, Kenya, Egypt, Morocco, the Philippines and New Zealand (under five readable sites each), where the discovery passes found no free student-reaching venue.

## Qualified (8) and what happens on each

- **stream.indieagora.com** (PeerTube, GB) — live, one video a day.
- **101010.pl** (Mastodon, PL) — live, one post a day.
- **social.citad.org.ng** (Mastodon, NG) — Amber's account is registered; the confirmation mail never arrived; the registrar re-asks hourly for three hours, then moves on (#848).
- **uri.life** (KR) and **c7.io** (TW) — next Mastodon candidates if the lane needs a new server.
- **myproduct.co.il** (IL) — free 12-hour listings through the home page's quick form, no account, no admin; the publisher is PR #851 (Mondays and Thursdays 09:00Z once merged and deployed). The longer listings wait for an admin and are not used.
- **Colombia Move** (CO) — free, e-mail magic link, no password, three-step browser wizard; needs the browser publisher (next build after #851).
- **List.com.pk** (PK) — free, e-mail + password with a confirmation link; the ad form sits behind the login; next build after Colombia Move.

Dropped from last night's list: **IklanGratiz** (ID) — the browser read shows the free form requires a telephone number; the "optional phone" was the paid link-ad form on the same page.

## Conditional (36): the ones worth an owner decision

- **DSB — Das Schwarze Brett (dsble.de, DE/AT/CH students)**: its price list says private and commercial ads are free, no account needed, categories include "Kurse & Sprachen" and "Sonstiges", city "überregional". Two conditions in its own rules: every ad is reviewed before it appears (a delay; spam-looking ads are not published), and a commercial advertiser must put an Impressum in the ad (legal name, address, representative, e-mail, register and VAT numbers). If you give me the Impressum lines and accept the review delay, the adapter is small and I will add it.
- **PerStudenti.com** (IT students): business accounts offered, e-mail + password, no CAPTCHA seen; "Pubblica un annuncio gratis". Its FAQ (read by clicking each question): business accounts are welcome, basic listings are free for 30 days, registration is name, surname, e-mail and password with a confirmation link, and every listing is reviewed by the site's team before it appears (usually a few hours). The review is the one condition; say whether a listing that waits a few hours for a human review counts, and the adapter follows.
- **studenten-rabatte.de** (DE), **AI Student Discount** (US), **TodoStudents** (PE), **Destu** (MX): student-discount directories; a listing needs an actual student offer from StudyProofs — your pricing decision.
- **mastodon.com.pl** (PL), **qdon.space** (KR, Korean-language posts required), **gs.leftic.club** (FR, political club): open servers whose rules allow labelled bots or honest ads; not used (one Mastodon account is enough for the fediverse, and the Korean and French fits are poor).
- The rest are general classifieds with unread posting rules or forms behind a login (GulogGratis, Speurders, FreeTrade, Mourjan, Tablón, India-Classifieds, Startup.pk, e3lanfree, Serinilan, Anunciar, Expat.com Peru, YBOX, Notatek, FOK!forum, phdkim.net, GeekNews Show GN, UNO Directory, SourceForge, Educational App Store, G2, Startup Portugal, Telegraph, WordPress.com, TabNews, Ingyen-aprohirdetes, したらば, なんでも宣伝 wiki). They stay on the list; the browser probe reads their forms in the next passes.

## Paid-task lane (continuous)

Your 11:33Z question is answered in `PAID-TASKS-2026-10-16/VERIFICATION.md`: Amber looks all day at about 30 sources plus 39 agent boards; 26 of the 54 countries have a source (almost all government tender portals), 28 have none; of 2,000 ledger rows 83% are tenders only a registered person can bid on; the agent boards hold 831 live tasks, 5 both doable and submittable (owockibot, whose board refuses claims); a runner's re-check of all 87 linked tasks found 22 gone, walled or dead, including the ten MoltJobs rows at the top of her own ranking; her site discovery found 0 new sites this sweep.

What exists and runs: discovery every 15 minutes (scout network, 54 countries), verification every 5, the earnings tick every 10 (MoltJobs, TaskBounty, Toku, government portals, Algora, the acquired sources), the platform push every 15 (39 connectors); the Money Trail, Money Hunt, Pursuit Proof and Revenue Dashboard comments on amberai #105 are rewritten every few minutes.

What the owner's rules hold: every bid, claim and submission waits for the owner's approval words (`OWNER_APPROVED_LANES` is empty by the 2026-09-30 rule), so executable now is 0 by design. The single ready item: the TaskMarket pitch (25 USDC task) needs the approval words naming the draft SHA, a 0.001 USDC fee approval, about $1 in Amber's wallet 0x409f…1f16 (balance 0) and permission to build the x402 payment step.

Added today: #850 — tasks posted or updated in the last five days are worked first, older ones only while the platform's latest read still lists them open, and the Money Hunt shows the count of each (there was no age rule before). No 36-region list exists in this lane either.

Owner-only items, unchanged: Dealwork identity claim, SAM_UEI (government bids), Algora's Stripe identity, TOKU_PAYOUT_DESTINATION, FREELANCER_OAUTH_TOKEN, KAGGLE_API_TOKEN; delete branch claude/db-host-check in founder-launch-coach (I cannot delete branches); Apify invoices; the three directory submissions that need your name (AI Study Master, ISTE EdTech Index, Edtech Insiders).

Rules kept: no money spent, no cold outreach, no identity invented, no CAPTCHA or verification evaded, no birthday entered, no DNS/Railway/Resend change, no AI replies to customers, no owner address used publicly.
