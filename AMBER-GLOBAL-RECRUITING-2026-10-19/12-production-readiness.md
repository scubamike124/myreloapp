# Production readiness: what is prepared, what is proven, what is not

Written 19 Oct 2026 (UTC) for the owner's final approval. **Nothing has been merged, deployed, published or switched on, and nothing has been sent to anyone.** This page says what a merge would change, how to undo it, who can see what, which checks were run (with their results), and what is still open.

## The verdict in one paragraph

**Ready to merge dark; not ready to switch on.** Merged, the branch adds one owner-only page, two owner-only API routes, one HQ tile and one dormant worker job, and changes nothing else that other lanes depend on except the small, tested fixes to the shared robots.txt reader. It makes no network request and writes nothing until the worker is given `AMBER_RECRUITING_LANE=1`. What stops it being switched on is not the code: **no live source has ever been read** (the build environment's network policy refuses every job site and every company site, and only the owner can change it), so the twelve source readers, the contact reader and the demonstration are proven against documented samples and invented servers only. The first live read is the real test of this lane, and it is the owner's one action (below).

## What a merge changes

| Part | What it is | Effect when merged and the switch is off |
|---|---|---|
| `src/lib/recruiting/` (29 files) | The lane: sources, discovery, contact reader, notice reader, reply reader, composer, gate, decision log, view, lead list | Nothing runs; nothing imports it except the page, the API and the worker job |
| `src/app/dashboard/recruiting/page.tsx` | The owner's page | Shows "The lane has not run yet" and zeros |
| `src/app/api/recruiting/route.ts`, `leads/route.ts` | The page's API and the sample-list export | Owner and admin sessions only |
| `src/components/hq/hq-actions.ts` | One tile on the HQ home | A link to the page |
| `src/lib/cloud/work-queue.ts` | One job kind `RECRUITING_TICK` and its seed, half-hourly | The job answers "off; nothing read" until the variable is set |
| `src/lib/research/robots.ts` (+ test) | Shared robots.txt reader: cache keyed by site and bot name; a file that does not fit is unreadable and counts as a refusal; over-long rules skipped; wildcard matching bounded | Other lanes use it: the 76 other-lane test files the reviewer ran gave the same results as `main` |
| `src/lib/dev/memory-filter.ts`, `src/app/api/dev/memory/route.ts` | The generic memory API no longer lists rows whose kind starts with `RECRUITING_` | Hides the lane's rows from every signed-in member of the organisation (they were open to all members). A deny-list: the owner's call whether to keep it (see D6 in 10) |
| `package.json`, `.gitignore`, `.github/workflows/ci.yml` | Two scripts (`test:recruiting`, `demo:recruiting`), an ignore rule, one CI job | The CI job cannot run until the account's billing is sorted |
| `scripts/recruiting-*.ts` | Rehearsal, live probe, live demonstration, revenue model, document generator | Run by hand; none runs in production |
| `docs/recruiting/` | These documents | Owner's reading |

The branch is `claude/amber-global-recruiting` in the private `amberai` repository; it merges into `main` with no conflict (checked with `git merge-tree` against the current `main`, which has not moved since the branch was cut). 135 files (most of them tests and fixtures); none outside the list above.

## Database: no migration, and how to undo

**There is no schema change and no migration.** The lane keeps its records as rows of the existing `DevMemory` table, in two kinds:

| Kind | Rows | Written by |
|---|---|---|
| `RECRUITING_PROSPECTS` | one: the board list, source health, run log, tallies and the shard count | the worker, single-flight |
| `RECRUITING_PROSPECT_SHARD` | up to 256: the businesses and their open roles, bucketed by a hash of the business id; only changed shards are written (a save is not atomic: a page read during a save can briefly show a half-updated set; it cannot lose a business) | the worker |
| `RECRUITING_DECISION` | one per owner action, never changed after it is written (append-only; capped at 20,000 with a reserve for opt-outs, replies and withdrawals) | the page's API |

| To undo | Do | What remains |
|---|---|---|
| Stop all reading, now | Unset `AMBER_RECRUITING_LANE` on the worker | Everything recorded; the next tick says "off; nothing read" |
| Stop all messages | "Withdraw approval" on the page | Approvals stay on record but nothing shows as ready |
| Take the code out | Revert the merge commit | The lane's rows (prospects, shards, decisions, candidates) stay in `DevMemory`, unread; older code that meets a sharded record sees an empty business list and rediscovers from scratch, and rolling forward again reads the shards back; the generic memory API lists them again once the filter is reverted (they are then visible to every signed-in member: delete them first if that matters) |
| Remove the lane's data | `DELETE FROM "DevMemory" WHERE kind IN ('RECRUITING_PROSPECTS','RECRUITING_PROSPECT_SHARD','RECRUITING_DECISION','RECRUITING_CANDIDATE');` | Nothing of the lane. Do this only after reading the next row: it removes every opt-out the owner has recorded |
| Remove the dormant job | Delete the `RECRUITING_TICK` row from the job table, and the seed in `work-queue.ts` | Nothing |

Rollback was exercised the only way it can be here: the tests run the lane against an in-memory store and against a real SQLite database through Prisma for the memory filter (the reviewer's check), the job answers "off" without the variable (test), and a decision log with damaged rows is read with the damaged rows counted and left out (test). It was **not** run against the production database, because nothing here can reach it.

## Privacy and access

| Question | Answer, and how it is enforced |
|---|---|
| Who can open the page and call the API? | Owner and admin sessions only: both routes check the role after the session check, and a POST must also come from this site (Origin check), be JSON, and be under 64,000 bytes (declared and read size, both) |
| Can anything else read the lane's rows? | The generic memory API hides them (`memory-filter.ts`; a test asserts the filter is always present and covers every kind the lane writes). The page's own API is the only reader |
| What is stored about people? | The lane looks for **businesses**. It keeps a business's name, website, a published role mailbox (`info@`, `jobs@`, `hr@`...) printed on its own site, and the open roles it lists. Personal addresses and named people are not sought, listed or profiled: the reader keeps role mailboxes only and drops what a person's address looks like; Hacker News poster names and emails are dropped when a post is read. A few ways of writing a phone number or an address still pass the scrubber (L5 in 10) |
| What of a person can get in? | What the **owner pastes**: a reply's text (up to 4,000 characters, which may carry a name, a title and a phone number in its signature). It is kept in the decision log and shown only on the owner's page |
| A request to erase | Record "Never contact them" for the business first (the permanent entry), then delete the row holding the reply text from `DevMemory`. Deleting the row without the entry would lift the opt-out the reply had set |
| Regions | Cold email to a business is blocked by default where the law needs prior consent (Germany, Spain, Italy, Canada, Australia, Japan, South Korea, South Africa) and in four US states for placement; the owner's settings can clear a region only after advice (see 02) |
| Does the lane send, post or contact anyone? | **No.** There is no sending code. The only network calls are the guarded `GET`s of public pages and job feeds and one map-data query (a `POST`, never followed to a second address). The "email" button is a `mailto:` link the owner presses; a contact form on a company's site is detected and never filled in. Four independent searches (two reviews, two of mine) found no other path, and a run of the whole suite with every outside connection refused and recorded made none |
| How does it identify itself? | `AmberRecruitingBot/1.0 (+https://hq.amberoneai.com; support@amberoneai.com)`, at low request rates, at most 110 requests and about two minutes per pass, with the sites' robots.txt read first (unreadable counts as refused) |
| Secrets | None are used or stored by the lane: no keys, no accounts, no paid service |

## The checks, and their results

All were run on the final code of this branch in the build environment (no database, no outside network). GitHub Actions cannot start jobs on this account (billing), so none of this has been through the project's CI.

| Check | Result |
|---|---|
| `npm run test:recruiting` (lane tests and the shared robots.txt matcher test) | **625 of 625 pass** in 41 files (37 lane files and the robots.txt wildcard file), about two minutes |
| Shared tests that use the robots.txt code, the web-hazard ratchet (37 tests) and the work-queue scope test: 32 files, 615 tests, run on this branch and on `main` | identical file by file: 607 pass; the 8 that fail, all in `source-acquisition.test.ts`, fail on `main` too and need a database. The fifth reviewer's run of 76 other-lane files matched `main` as well |
| Type check (`tsc`, the lane's folders and the page) | clean |
| Lint (`eslint`, the lane, the page, the API, the tile, the scripts) | clean |
| Production build (`next build --webpack`, with placeholder database and sign-in variables) | compiled successfully (2.2 minutes), 461 of 461 pages generated, the page and both API routes are in the route list, exit 0. Next skips its own type validation in this project, so the type check above is what covers types. One warning, about the name of the `middleware` file, is older than this branch |
| The owner's page driven in a headless browser against the real page, the real API and the raw record (phone viewport): settings, approvals, "I sent it", replies, opt-outs, release of a probable notice, sample list, money, withdrawal (`scripts/recruiting-ui-check/`, run by hand; not part of the product) | 575 checks pass; a deliberate break of each rule that the page shows was caught (mutation-proven), including the "Waiting for you to read" panel |
| Invariants over random histories (seeded): a business that has replied or been set aside is never queued; one first note per business; no stale role is shown as current; nothing the owner recorded is lost; every total equals what the record says; notices on a website and their release; no network attempt | pass |
| Mutation checks (a rule broken on purpose, the tests must fail) | every rule added in this round and the rounds before: caught |
| Hostile input (a repeated word list at 9,000 characters through both readers; 133,225 pairs of words through the reply reader; 150,000 random sentences through the notice reader) | slowest answer under 60 ms on first run (warm-up), median 0.02 ms; the tests fail only if a probe takes 50 ms or more every time it is tried |
| Offline rehearsal of the whole lane on the documented sample payloads | 11 of 11 documented shapes read; revenue $0.00; no network |
| Live demonstration (`npm run demo:recruiting`) | **Not run: it needs the twelve domains** (below) |

## Independent reviews

Six sessions that had not written the code have reviewed it: the first of the lane, the second of its fixes, the third of the live-demonstration commit, the fourth of everything since (D1 to D13, none critical or high) the fifth of the fourth's fixes (R5-1 to R5-14: no critical and one high, which was that the page and the code behind its buttons reached only the first 150 businesses, so a held business could not be released and a wrong opt-out could not be undone at the lane's real size; fixed and tested, the rest fixed, fixed in part or accepted with the reason) and the sixth of the fifth's fixes. A sixth review of the fifth's fixes found no critical and no high problem and five medium ones (three of them regressions of the fifth round's changes), all fixed and tested; its low findings that were not fixed are listed in 10. Each finding was reproduced before anything was changed, and each fix has a test named for it. The record, with every finding and how it stands, is **10-review-and-limits.md**. The readers' honest numbers (first readings on text nobody had tuned them on, by three authors) are in the same document and are lower than the tuned-on numbers: about 70% of fresh notice sentences held, about 80% of requests to stop filed. The design does not rest on them alone (see limit 7 there).

## What the network blocks, and the one thing the owner does

Every host the lane reads is refused by the cloud environment's network policy ("Limited"), and so are all the company sites. Nothing available to the session can change that: the policy is edited only from the owner's account, and the session's other tool for reading a web address (`WebFetch`) fails at name resolution too (`ENOTFOUND remotive.com`). A watcher has asked the proxy about all twelve domains every fifteen minutes since 11:30 UTC: **0 of 12 open** at every check so far (the last is in the log under the scratch folder).

**The one action:** in the Claude app open the cloud environment menu in the session's title bar, choose **Edit**, and under **Network access** add these twelve names to **Allowed domains** (no wildcard, no change to the access level), then say "go":

`hacker-news.firebaseio.com`, `hn.algolia.com`, `remotive.com`, `jobicy.com`, `boards-api.greenhouse.io`, `api.lever.co`, `api.ashbyhq.com`, `api.smartrecruiters.com`, `www.workable.com`, `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de`

Round 1 then takes a few minutes and writes a list of at most twenty company-site names for a second, equally small change (11-live-demo). Remove the names afterwards. The other route needs no policy change: run `npm run demo:recruiting` on your own computer (11-live-demo, Option B).

## What remains before a first message can go out

0. **Email deliverability proof (owner's requirement, 13-email-deliverability.md): not met.** No real inbox test has been run (0 deliveries), the sending domain's SPF/DKIM/DMARC has not been read (DNS is blocked here), and the shared mailer falls back to `onboarding@resend.dev` when `MAIL_FROM` is unset. No outreach, and no bulk sender, until that gate is passed and the owner authorizes sending.

1. The live demonstration passes (network, above). The first live read will show which of the twelve source readers need a fix; nine were written from documentation or search excerpts.
2. The merge, after you have read the pull request. Merge it dark; set `AMBER_RECRUITING_LANE=1` only after step 1.
3. The decisions that are yours (07-owner-approvals): the hold policy for probable notices (soft, as built), the deny-list in shared code (D6), the promises written in your voice ("I go through what it finds", "I read every message"), and which regions to clear.
4. A lawyer's read of the points in 02 before volume. Not spent, not required for the first handful of notes the owner reads and sends by hand.

## What was not checked, and said so

Any live behaviour; the production database; the deployed worker job; sending and receiving real mail; the project's CI; the first week of real replies. The reviews were other sessions of the same kind of model in the same environment, with sets they wrote themselves.
