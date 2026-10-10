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
| 1 | Buyer evidence, offers 1–5 | research agent | running |
| 2 | Buyer evidence, offers 6–10 | research agent | running |
| 3 | Offer design (deliverable, scope, exclusions, onboarding, test price) | lead | v1 in the registry; prices updated from evidence |
| 4 | Demos 1, 2, 5 (follow-up family) | demo agent | running |
| 5 | Demos 3, 4 (bookkeeping, read-only) | demo agent | running |
| 6 | Demos 7, 8, 9 (data cleanup, triage) | demo agent | running |
| 7 | Demos 6, 10 (website booking form, video variations) | demo agent | running |
| 8 | Organic posts, ad copy, connected-channel check | ads agent | running |
| 9 | Registry, pages, intake + attribution, visit counter, tracker on #105 | lead | in progress |
| 10 | CI, merge, deploy, live verification, proofs on #105 | lead | not started |
| 11 | Results table, recommendation, handoff | lead | not started |

## Log

- 16:47Z: #788 (worker image chosen inside the shared Dockerfile) verified: the worker beacon reports `browser.ok: true`, Chromium 151.0.7922.34, Ubuntu 24.04.4. Sprint begins.
