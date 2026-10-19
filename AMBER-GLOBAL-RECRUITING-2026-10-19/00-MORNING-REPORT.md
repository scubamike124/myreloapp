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
