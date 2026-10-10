# Ten-offer sprint: checkpoint

Started 2026-10-10 16:50Z, runs to about 02:50Z on 2026-10-11. This file is the resume point after any interruption: read it, check the branches below, carry on.

## Where everything lives

- **Code:** repo `scubamike124/amberai`, branch `claude/ten-offers-pilots`, worktree `/home/user/wt-offers` (re-create with `git -C /home/user/amberai worktree add /home/user/wt-offers claude/ten-offers-pilots` and `ln -s /home/user/amberai/node_modules node_modules`).
  - `src/lib/offers/types.ts`, `qa.ts`: shared types and QA (written 16:55Z).
  - `src/lib/offers/demos/<slug>.ts`: one demo per offer, invented data, own QA checks; tests in `src/lib/offers/__tests__/`.
  - Registry, pages (`/offers`, `/offers/<slug>`, `/offers/<slug>/sample`), intake API, visit counter, tracker: written by the lead.
- **Reports:** this folder (myreloapp branch `claude/amber-source-promotion-lifecycle-wwlq13`): `evidence/` buyer evidence, `design/` offer design, `ads/` organic posts and ad copy, `qa/` QA results, `RESULTS.md`, `HANDOFF.md`.

## Owner's guardrails (2026-10-10 sprint message, summarised; the message is the authority)

Synthetic or redacted data only; client systems stay client-owned, least privilege; bookkeeping offers read-only (flag and explain, no entries, no money, no tax advice, no financial decisions); no certification, affiliation, compliance, guaranteed savings or revenue claims; no live payment changes, charges, refunds, tool purchases or paid ads; demos and pilots never presented as finished production services; nothing sends by email or direct message; organic posts allowed only on already-connected, owner-owned business channels; revenue counts only when payment or escrow is verified. Blockers are logged, never waited on.

## Workstreams

| # | Workstream | Owner | Status |
|---|---|---|---|
| 1 | Buyer evidence, offers 1–5 | research agent | running (file growing) |
| 2 | Buyer evidence, offers 6–10 | research agent | done: every fact is a search snippet (this session cannot fetch pages); now preparing items for the worker's live-page check |
| 3 | Offer design (deliverable, scope, exclusions, onboarding, test price) | lead | v1 in the registry; prices updated from evidence |
| 4 | Demos 1, 2, 5 (follow-up family) | demo agent | done: 44 tests; samples 17/17, 15/15, 18/18 |
| 5 | Demos 3, 4 (bookkeeping, read-only) | demo agent | done: 41 tests; samples 14/14, 13/13 |
| 6 | Demos 7, 8, 9 (data cleanup, triage) | demo agent | done: 57 tests; samples 12/12, 14/14, 11/11 |
| 7 | Demos 6, 10 (website booking form, video variations) | demo agent | done: 92 tests; samples 13/13, 14/14; three rendered format previews |
| 8 | Organic posts, ad copy, connected-channel check | ads agent | done: copy for all ten (27 tests); BLOCKER: no connected owner-owned business page, and the pipeline posts video only |
| 9 | Registry, pages, intake + attribution, visit counter, tracker on #105 | lead | built and tested (commit bbbb656 on `claude/ten-offers-pilots`): 23 core and evidence tests pass; pages render locally; storage verified against a real Prisma client (SQLite) |
| 10 | CI, merge, deploy, live verification, proofs on #105 | lead | #789 merged 18:12Z (115ed6d), deployed and verified, proof on #105 (6101970273); #790 (self-test retry) merged 20:49Z (27d3cc2), deploying |
| 12 | Pilot runner: a client's own files to a reviewed report, all ten offers | lead + 3 importer agents (stopped by a usage limit, finished by the lead) | #791 merged 21:13Z (e6324a9), deploying; 389 offers tests; end-to-end runs on fresh export shapes for offers 1, 2, 3, 7, 8 and 9 |
| 13 | Evidence: one reachable replacement per unverified item, every offer alike; the report carries its item-list fingerprint | research agent + lead | research running; fingerprint change on `claude/offers-evidence-alt` |
| 11 | Results table, recommendation, handoff | lead | RESULTS.md (generated; rule declared before the live check) and a first HANDOFF.md written; final versions at the end |

## Log

- 16:47Z: #788 (worker image chosen inside the shared Dockerfile) verified: the worker beacon reports `browser.ok: true`, Chromium 151.0.7922.34, Ubuntu 24.04.4. Sprint begins.
- 17:12Z (commit 480d4ff): shared core written (types, QA, registry, store, inquiries, visits, failures, owner records, tracker); pages and API routes; tracker wired into the worker's platform push.
- 17:19Z (commit bbbb656): found and fixed before any deploy: the middleware's login gate would have refused every inquiry (401); both offers API routes are now on its public list, pinned by a test.
- 17:15Z: storage verified end to end with a real Prisma client on SQLite: an inquiry, a visit and a failure saved and counted by the tracker.
- 17:19Z: this session's network blocks page fetches (only search works). Added a worker check that opens each cited page once (robots.txt honoured) and reports whether the quoted text is there: search snippets become verified facts only when found.
- 17:19Z: the worker's production page probe now reads the offer pages (index every round, one offer and its sample per round), so production status is visible on the beacon.
- 17:22Z (commit b067a09): test prices set from the buyer evidence (all hypotheses); offer design generated from the registry; both research files done (search-snippet level).
- 17:23Z: sprint status comment posted on #105 (6100207146), updated in place.
- Note: log times before 17:23Z were first written from an estimate and corrected against the commit times.
- 17:44Z: all ten demos and tests present; 286 offers tests pass; demo QA report: 141 checks, 0 failing (`qa/DEMO-QA-REPORT.md`).
- 17:46Z: full-repository tsc and CI's qa:typecheck pass; all 21 pages render locally with the pilot notice, the form, the no-charge note and each sample's checks; screenshots in `qa/screenshots/`.
- 17:47Z: PR #789 opened.
- 17:54Z: PR #789's first CI: qa-engine passed; the earnings tests failed one test of 3,356: the ratchet that pins every module reading #105's comments (the offer tracker is a new reader). Main passes that step, so the failure was this PR's.
- 18:02Z (commit b32c035): fixed and hardened. Every #105 comment, Amber's automated reports included, is posted with the owner's credential, so the author cannot tell them apart. The tracker now never reads a comment that carries an Amber report marker (its own how-to example "offer-record: inbox-triage cost $2.40" would otherwise have counted as a real cost), lists record-like lines inside code blocks as "not applied", and edits only the comment that starts with its marker. A decoy test proves an owner "directive", a non-owner $5,000 "paid" line and a quoted marker change nothing; verified revenue stays $0.00. 295 tests pass.
- 18:08Z: second CI run: the test job now fails only at the pre-existing unit-test step (same as main); qa-engine running.
- 18:10Z (commit 62c9630, branch `claude/offers-pilot-runner`): pilot runner checkpoint. Every run must declare its data: `--authorized "client, how, when"` for a client's files, or `--synthetic` for invented data, which is refused when any email address or phone number in the files is not a reserved example. A real export can hold no contact details, so their absence never counts as "invented". 26 tests.
- 18:12Z: #789 squash-merged as 115ed6d (CI matched main). Railway: worker 18:15Z, web 18:20Z.
- 18:17Z: the tracker published on #105 (6100695261). Its live form self-test met the old web build (HTTP 401) because the worker finished deploying first, and it ran only once per process.
- 18:22Z: the worker's buyer-evidence check published (6100741402): 41 of 65 facts found on their pages; 17 bot-challenge pages; 5 quotes not on their pages. Saved as `evidence/EVIDENCE-LIVE-CHECK.md`.
- 18:2xZ: `RESULTS.md` generated from the registry, the research summary, the live check and the tracker, with the ranking rule written down before the check ran: Unpaid Invoice Tracker (7 of 7 verified) and Website Health and Booking-Form Check (5 of 7). First `HANDOFF.md`.
- 18:35Z: #789 deploy verified: 12 clean probes, web memory peak 1,238 MB, event loop max 2,710 ms (p99 55 ms), earnings tick clean.
- 19:11Z: all 21 offer pages probed live (HTTP 200, pilot notice, every sample's checks passing).
- About 18:30Z to 20:38Z: the session and its three importer agents stopped at a usage limit (it reset at 20:10Z). The agents' importers for offers 1, 2, 3, 7, 8 and 9 were on disk with tests; offer 4's tests were missing.
- 20:42Z: proof for #789 posted on #105 (6101970273). #790 (self-test retry) opened from main.
- 20:48Z: the importers finished by the lead: job-cost fixture fixed and skipped jobs recognised by name; contacts listed from every row; offer 4 tests written, and a guard added after the tests showed a card export with positive spending would have reported the card payment as the only spending. 379 offers tests pass.
- 20:49Z: #790 merged as 27d3cc2 (CI matched main); deploy watch running. 21:0xZ: runner rebased onto main, PR #791 opened (2a8ff47), CI running.
- 20:53Z: **the live form round trip is proven**: after #790 deployed, the worker's self-test visit (HTTP 204) and inquiry (HTTP 200) were read back from the database by the tracker. Never counted.
- 20:57Z: the evidence check re-ran on the deploy restart (the old once-per-process rule): every offer's counts identical to 18:22Z.
- 21:01Z to 21:03Z: end-to-end runs of the runner on fresh export shapes (HubSpot contacts, an mbox inbox, Shopify plus a marketplace, a phone-system call log, Jobber-style quotes, a wide budget sheet): all reports produced with every check passing. One real gap found and fixed: a call log that marks direction only in an Action column read the business's callback as an inbound call, so an already-called-back caller was listed as an open lead with a drafted text.
- 21:05Z: the disk allowance filled (no space for a new worktree). Removed five old worktrees that were clean and whose branches were on GitHub at the same commit; nothing unsaved was removed.
- 21:12Z: #790 deploy verified (12 clean probes, memory peak 1,226 MB, event loop max 3.1 s, earnings tick clean); proof on #105 (6102230458).
- 21:13Z: #791 (pilot runner) merged as e6324a9 after CI matched main.
- 21:0xZ: a research agent is finding one reachable source per unverified evidence item (24 items, every offer alike, each offer's item count unchanged). The evidence report will carry its item-list fingerprint, so a changed list is checked at the next run instead of a day later.
- 21:15Z to 21:35Z: #791 deployed (Railway: worker 21:15:41Z, web 21:23:25Z). The worker's self-test passed at 21:17Z (inquiry `oi_e0fd2f314e8e6a93` read back; it ran before the web swap, and #791 changed no page or route). The buyer-evidence report still read "As of 20:57:49Z" after the restart, so the once-a-day rule held across a deploy. At 21:23:08Z one earnings tick and one platform push got HTTP 502, about ten seconds before the new web process started; both were clean on their next run (21:33Z). Deploy watch: 12 clean probes, memory peak 1,205 MB during the first earnings tick, earnings tick 21:35Z clean.
- 21:27Z: the research agent returned replacements for 23 of the 24 unverified items; the inbox-triage backlog item has none and stays. The PlumbingZone "47 missed calls" quote was already worded as the search snippet showed, yet it was not on the 546,231-character page, so it is replaced under the same rule as every other item rather than kept.
- 21:35Z: PR #792 opened (7bd05c5): the 23 replacements (each offer keeps its item count; each line names the item it replaces) and the item-list fingerprint (`082baae647c7` to `63a671d4fa7a`), so the worker re-checks the new list at its next run. 384 offers tests pass; tsc, qa:typecheck and eslint clean. A replacement counts only when the worker finds its quote on the live page.
- 21:41Z: #791 proof posted on #105 (6102472873): 17 clean probes, web memory peak 1,205 MB during the first earnings tick, event loop max 3,526 ms (p99 52 ms), earnings tick clean, and four offers' pages read on the new build with every sample check passing (website health 13/13; its demo changed in #791). Sprint status comment updated.
- Correction (21:39Z): the "389 offers tests" quoted for #791 could not be reproduced. A recount on main gives 383 offers and importer tests (390 with the earnings ratchet test); the handoff now quotes 383.
- 21:42Z: PR #792's CI: the test job failed only at the pre-existing `test:unit` step, with the earnings suite (which holds the offers tests) passing; qa-engine running.
- 21:44Z: CI on #792 matched main (qa-engine passed; the test job failed only at `test:unit`). #792 squash-merged at 21:44:49Z as 0222c67. Watching the deploy, and the worker's re-check of the new item list (`63a671d4fa7a`).
