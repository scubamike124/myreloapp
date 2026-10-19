# Amber Global Recruiting

An AI-assisted recruiting business based in Los Angeles, started on 18 Oct 2026 (Pacific) at a $0 budget, built on Amber's existing worker, database and HQ. This folder is everything that was decided, built, tested and written that night. **It has no clients, no candidates and no revenue, and nothing here claims otherwise.**

## Start here

1. The morning report, `00-MORNING-REPORT.md`, is in the reports repository. It lists what was completed, tested, working and blocked, what it cost, and what remains before the first paying client.
2. [07-owner-approvals.md](07-owner-approvals.md): what only the owner can decide, in the order it blocks things.
3. [09-viability.md](09-viability.md): is it worth doing, and what stands in the way.

## What is in the folder

| File | What it is |
|---|---|
| [01-existing-infrastructure.md](01-existing-infrastructure.md) | What Amber already had and what the recruiting lane reuses; what was looked at and not reused |
| [02-voice-and-compliance.md](02-voice-and-compliance.md) | Every rule the system enforces on wording and on who may be written to, in plain words |
| [03-lead-sources.md](03-lead-sources.md) | Where employers and staffing businesses are found, what is built, what is left out, and the first live read |
| [04-workflow.md](04-workflow.md) | The workflow: discover openings, sell the list, employers' applicants, candidates and introductions; who decides what |
| [05-revenue-plan.md](05-revenue-plan.md) | What is sold, the price estimates, how money arrives, the scenario tables, referral arrangements, tripwires |
| [06-marketing/](06-marketing/README.md) | Messages, replies, a one-page offer, public posts, six video scripts; employer and candidate notes (held) |
| [07-owner-approvals.md](07-owner-approvals.md) | Decisions and approvals for the owner |
| [08-runbook.md](08-runbook.md) | Turning it on, the first live check, switches, troubleshooting, the checks that were run |
| [09-viability.md](09-viability.md) | Commercial viability, legal and technical barriers, the verdict |
| [10-review-and-limits.md](10-review-and-limits.md) | What an independent code review found, what was fixed and tested, and the limits that remain |
| [11-live-demo.md](11-live-demo.md) | The demonstration before launch: real employer to tracked prospect; how to run it live (`npm run demo:recruiting`), what counts as a pass |
| [research/](research/) | The three research reports as written by the research agents, with their evidence labels, plus the compliance matrix and the source assessments |

## The code

`src/lib/recruiting/` (30 modules and 22 test files), `src/app/dashboard/recruiting/page.tsx`, `src/app/api/recruiting/`, the worker job `RECRUITING_TICK` in `src/lib/cloud/work-queue.ts`, and scripts under `scripts/recruiting-*.ts`. Run `npm run test:recruiting` for the tests.

## Five facts to hold on to

1. **Amber sends nothing.** There is no sending code. The owner reads, approves, sends from their own mail, and records it.
2. **The first product is a list of employers whose public job listings have stayed open for 45 days or more, sold to small staffing agencies.** No candidates, no named people, no fee tied to a hire.
3. **The research was done from search-result excerpts**, because the research environment could not open any web page. Every fact is labeled; none was read in full. Nothing was read from a live job source either.
4. **Money counts only with proof and the owner's confirmation.** Today: $0.00 confirmed, $0.00 spent.
5. **This is a conditional go as a small, slow side business, and a no-go as a hands-off money machine** (09-viability).
