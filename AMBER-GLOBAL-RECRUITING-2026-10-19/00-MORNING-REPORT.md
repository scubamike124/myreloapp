# Amber Global Recruiting: morning report

Updated Monday 19 Oct 2026, about 15:20 UTC. Code: branch `claude/amber-global-recruiting` in the private `amberai` repository, **draft pull request #930**. Nothing has been merged, deployed, published, sent or activated, and nobody has been contacted. New spend: $0.00.

## The one thing that needs you

**Open the network for the live demonstration.** I cannot change the cloud environment's network policy and did not try to get around it. In the Claude app: environment menu in the session title bar → **Edit** → **Network access** → **Allowed domains**, add these twelve names (no wildcards, no change to the access level), then say "go":
`hacker-news.firebaseio.com`, `hn.algolia.com`, `remotive.com`, `jobicy.com`, `boards-api.greenhouse.io`, `api.lever.co`, `api.ashbyhq.com`, `api.smartrecruiters.com`, `www.workable.com`, `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de`.
Round 1 takes a few minutes; it writes a list of at most twenty company sites for a second, equally small change. Remove the names afterwards. (Alternative with no policy change: run `npm run demo:recruiting` on your own computer; see 11-live-demo.md.)

## Answers to your questions

| Question | Answer |
|---|---|
| Is the network restriction resolved? | **No.** 0 of 12 domains open at every check since 11:30 UTC (last 15:06). The session's other page-fetch tool is blocked too, so there is no permitted alternative route. |
| Did a real live demonstration succeed? | **No: it has not run.** Nothing live has ever been read. What exists is proof on documented sample responses, invented servers and made-up data (clearly separate from live results). |
| Is it ready for production? | **Ready to merge dark; not ready to switch on.** Merged, it adds an owner-only page, two owner-only API routes, a tile and a dormant job; it reads nothing until `AMBER_RECRUITING_LANE=1`. What stops switching it on is the missing live read, which is the real test of the twelve source readers. |
| Tests | Lane: **485 of 485 pass** (30 files), and still 485 with every outside connection refused and recorded (zero attempts). Shared files that use the robots.txt code, the web-hazard ratchet and the work-queue (32 files, 615 tests): **identical to `main`** (607 pass; the 8 that fail are in one file and fail on `main` too, they need a database). Type check clean, lint clean, production build succeeds (461/461 pages), the owner's page driven in a headless browser against the API and the raw record: 575 checks pass. GitHub Actions cannot run on this account (billing), so no CI. |
| Independent reviews | **Six**, each by a session that had not written the code. Fifth: no critical, one high (the page and its buttons reached only the first 150 businesses, so a held business could not be released and a wrong opt-out could not be undone at real size): fixed and tested. Sixth (of those fixes): **no critical, no high**, five medium (three were regressions of my own fixes), all fixed and tested. Low findings not fixed are listed in 10-review-and-limits.md. Every finding was reproduced before changing anything. |
| Shared-code regressions | Checked by reviews 3 to 6: safe to merge while the lane is off. The shared changes are the robots.txt reader (bounded matching, cache per site and bot, unreadable = refusal), the memory-API filter, one job kind, one tile, two scripts, one CI job. No schema change, no migration; rollback steps in 12-production-readiness.md. |

## What works (on test data and documented samples)

Find employers whose listings stay open 45 days or more; find staffing businesses and the hiring address each prints on its own site (robots.txt first; unreadable counts as refusal); qualify and rank them; read a company's own website for a "no agencies / no vendors" sentence and hold the business (you read and release a probable one; a plain one is never releasable); prepare one short personal note per business, checked for machine-sounding wording and for the legal rules; **no sending code exists**: you read, approve, send by hand and record it; replies you paste are sorted and any reply ends the cold messages to that business; opt-outs are permanent and cover every record of the same website; a role counts as open only if a read saw it listed in the last 14 days; the page's numbers equal the raw record after every action (browser check).

## What failed or is weak (honest numbers)

- **The two readers are rule lists, not understanding.** On text nobody had tuned them on (three authors, plus the sixth reviewer's 100 sentences) they held 65% to 82% of sentences that are notices and filed about 78% to 94% of requests to stop; they flagged 2% to 4% of ordinary sentences and wrongly filed 0 to 1 of 50 to 83 replies that wanted something. Higher numbers on the sets I tuned on are not estimates. Known gaps: a heading followed by an instruction is not read; notices in languages other than English are not read; indirect legal wording passes. The design does not rest on them: nothing is sent by software, you read every note and paste every reply, "Never contact them" is one click.
- **No live source has been read.** Nine of twelve source readers were written from documentation or search excerpts; expect some to need a fix after the first live read.
- The research rests on search-result excerpts; the legal points need a lawyer before volume.

## Decisions that are yours (07-owner-approvals.md)

Merge/deploy and the switch; your name, business, postal and reply address; approving the process on the page; price; hold policy for a sentence the reader is unsure of (soft, as built); the deny-list in shared code (D6); the promises written in your voice ("I go through what it finds"), which are true only if you do them; regions and a lawyer's hour before volume.

## What remains before production

1. Network opened → live demonstration (round 1, then round 2) → fix what the first live read shows.
2. Your decisions above; read PR #930; merge dark; set `AMBER_RECRUITING_LANE=1` only after the demonstration.
3. Employer-side notes and candidate intake stay held (need a lawyer and your decision).

## Where things are

Docs in this folder (start with 12-production-readiness.md, 07-owner-approvals.md, 10-review-and-limits.md). Code: `amberai`, branch `claude/amber-global-recruiting`, PR #930 (draft). Browser check: `scripts/recruiting-ui-check/`. KDP work is untouched and as you left it.

---

## Update after the owner's latest message (tested / built offline / deployed, kept apart)

**Deployed to production: nothing.** PR #930 is a draft; nothing is merged, sent or published. **Live network demonstration: not run** (0 of the 12 allowed hosts open at every check). **Email deliverability: not verified** (no real delivery, no DNS or mailbox access).

**Tested offline (in-memory database, fixtures, headless browser against test data):** 625 of 625 lane tests, type check, lint, production build, 575 of 575 dashboard browser checks, 21 of 21 shared middleware tests.

**Built offline and switched off:**
- Public candidate registration (3 routes, 2 pages, 3 exact middleware entries): 404 unless `AMBER_CANDIDATE_INTAKE=1`, 503 without its secret, no mailer wired (registering keeps nothing), rate limits, size and type checks. Independent review found no critical or high issue; 5 medium and 6 low were fixed except two noted in doc 15. Still needs a real mailer, a sweeper schedule, privacy/legal reading and your decision.
- Lighter read path for large stores: repeat page loads skip re-reading the businesses; a first build at 100,000 businesses is about 2.4 s (was 3.2 s) on test data. Not measured on the real database.
- Trade-school discovery parser (OpenStreetMap), tested on a hand-written sample, not on a live answer, not connected to the lane.
- Dashboard panel for the four channels: businesses found are real counts; agreements, interviews, placements and invoices are zero because nothing records them yet.

**Still disabled by design:** automatic email sending, candidate matching, placement advertising and fees. **No new spend; no network restrictions bypassed.** Rollback steps are in doc 15 and doc 12.

---

## Update 3 (2026-10-19, after the merge)

**Merged to main as 3938cf57 (PR #930), every new feature switched off.** Reviewed before merge: a deploy-safety review and a second independent review (all confirmed findings fixed), 678 of 678 lane tests, 583 of 583 dashboard browser checks, type check, lint, build, and CI green on the merged code's final commit (recruiting, qa-engine, test, coloring).

**Not verified:** the deploy itself (the production deploy and the post-merge CI run on main were still in progress when this was written; from this environment no production address can be reached), every live source, the map servers, email delivery, inbound mail, the real database at scale.

**Still off:** the worker's discovery pass (`AMBER_RECRUITING_LANE`), public candidate registration and its mail, incoming-mail reading, automatic sending, candidate matching, placement advertising and fees.

What only the owner can provide is listed in 16-owner-actions.md.
