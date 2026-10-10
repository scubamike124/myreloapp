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
| 10 | CI, merge, deploy, live verification, proofs on #105 | lead | PR #789 (d83eab6) open, CI running |
| 11 | Results table, recommendation, handoff | lead | not started |

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
