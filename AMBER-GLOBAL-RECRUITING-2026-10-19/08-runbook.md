# Runbook: turning Amber Global Recruiting on, checking it, and turning it off

Written 18 Oct 2026 (Pacific). For the owner and for whoever works on this next. Nothing below has been done in production.

## Where things are

| What | Where |
|---|---|
| The code | Private repo `amberai`, branch `claude/amber-global-recruiting`. Library `src/lib/recruiting/`, owner's page `src/app/dashboard/recruiting/page.tsx`, API `src/app/api/recruiting/`, HQ tile in `src/components/hq/hq-actions.ts`, worker job in `src/lib/cloud/work-queue.ts` (kind `RECRUITING_TICK`) |
| The page | `/dashboard/recruiting` on HQ, owner and admin sessions only. Also a tile on the HQ home: "Amber Global Recruiting" |
| What the worker writes | One `DevMemory` row of kind `RECRUITING_PROSPECTS` (prospects, open roles, board list, source health, run log). Written only by the worker |
| What the owner writes | One `DevMemory` row of kind `RECRUITING_DECISION` per action (settings, approvals, sends, replies, opt-outs, money). Written only by the page's API; never changed afterwards |
| Which organization | The oldest one, the same as the worker queue and the KDP desk |
| Documents | `docs/recruiting/` (this folder); research in `docs/recruiting/research/`; marketing copy in `docs/recruiting/06-marketing/` |
| Limits | 3,000 prospects, 25 roles per prospect, 40 run records, 30 days of tallies, 3,000 boards, 20,000 decisions. The oldest roles drop first |

## Turning it on

Nothing changes on merge except that the page, the API, the tile and one dormant job kind exist. The job reads nothing unless the worker has `AMBER_RECRUITING_LANE=1`.

1. **Merge and deploy** (the owner's word). Confirm the worker seeds `RECRUITING_TICK` and the tile appears on HQ.
2. **Set `AMBER_RECRUITING_LANE=1`** on the worker service and let it restart. This is the only switch. It costs nothing.
3. **Open the page.** Under "What Amber reads, and how it is going" the lane shows "Last pass ..." after the next half-hour tick. Until it runs, the page shows zero found and says so.
4. **Run the live probe** from any machine with open internet and this repo (the build container's proxy blocks these hosts, so not there):
   `npx tsx scripts/recruiting-live-probe.ts`
   It makes one request per source at the lane's pace and prints status, roles read, three role titles, and the shape of each answer (key names only). It writes and sends nothing. Add boards with `greenhouse:name lever:name` and so on, or limit it with `--only=remotive,jobicy`.
5. **Compare** the probe with the page's sources panel. A source marked `FORMAT CHANGED` or `FAILED` is paused for the moment, not trusted.
6. **Fix what the probe shows.** The shape lines are enough to correct a parser without copying any data: edit the adapter in `src/lib/recruiting/sources/adapters.ts`, add the corrected sample (values removed) to `__tests__/samples/`, add a test, run the suite.
7. **Leave the unverified sources off** (Recruitee, We Work Remotely) until the probe has shown their shape.
8. **Only then** does the owner start approving messages; by then the queue holds real businesses.

### What to look at first on the live read

| Source | Question the first read answers |
|---|---|
| Greenhouse | Is the board listing shaped as `{ jobs: [...] }`, and are job fields as documented? |
| Lever | Is the list a bare array? |
| Ashby | Where does compensation sit; how is the postal address spelled? |
| SmartRecruiters | Does the list answer without a key? Is the list under `content`? |
| Workable | Which of `url` and `application_url` is the job page, and what wraps the jobs? |
| Personio | Is the XML shaped as the sample (a `position` per role)? |
| Remote OK | The first array element is a legal notice, not a job: is it skipped? |
| Remotive | Is the response `{ jobs: [...] }`, and does the 24-hour delay matter? |
| Arbeitnow | Is the response `{ data: [...] }` with a `created_at` in seconds? |
| Jobicy | Is the response `{ jobs: [...] }`, and does a company page link back? |
| Hacker News | Are the hits shaped as `{ children: [{ text, created_at }] }`, and does the title of the monthly thread match "Who is hiring"? |
| Map data (Overpass) | Do the tags carry `website`, `name` and an address? Is the request within the service's fair use? |

## Turning it off

Any one of these is enough. None deletes anything.

| To stop | Do |
|---|---|
| All reading | Unset `AMBER_RECRUITING_LANE` on the worker. The next tick says "off; nothing read" |
| One source | Untick it under Settings, "Sources Amber may read" |
| One company | On its card, "Record something", then "Never contact them" (permanent) |
| All messages | "Withdraw approval" in the process panel. Every message goes back to waiting; approvals stay on record but nothing shows as ready |
| A vendor's objection | Switch that source off at once and tell the vendor so; keep its terms text with the decision |
| Everything, for good | Remove the job kind from `CLOUD_JOB_KINDS` and the seed in `work-queue.ts` (a code change) |

## Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| The page says it is not allowed | Not an owner or admin session | Sign in as the owner. The API checks the role and the site of the request |
| "The lane has not run yet" a day after switching on | The worker did not restart with the variable, or the job is not seeded | Check the worker's variables; check the job list for `RECRUITING_TICK` |
| Zero prospects after several passes | No board is known, the feeds failed, or the Hacker News thread was not found | Look at the sources panel; run the probe; add a few boards by hand ("Add a job board by hand") |
| A source shows `FAILED` | The host refused, timed out or rate-limited | The lane backs off and pauses a board for seven days after three failures; do not retry in a loop. Read the note under the source |
| A source shows `FORMAT CHANGED` | The vendor changed its response | Run the probe for that source, fix the adapter from the shape, add a test |
| Many businesses, no messages ready | No published address found yet, region not cleared, or the process is not approved | Open a business card: it says why. Contact lookups run six per pass in cleared regions only |
| A message is "held" with a state named | Its roles are in New York, New Jersey, Massachusetts or Illinois | Leave it, or clear the state in Settings after taking advice |
| A message is "blocked" | The wording check or the gate refused it | The card shows the reason; edit and the checks run again |
| Days open look too low for a feed role | The feed gives no posting date, so the count starts when Amber first saw it | Expected. The sheet says "first seen" for those rows |
| A number on the page looks wrong | Check the decision log: every figure is folded from it | Ask Claude to read the `RECRUITING_DECISION` rows and the `RECRUITING_PROSPECTS` document |
| The page says the record of your actions is full or nearly full | The log holds 20,000 entries; a full log refuses new actions instead of accepting ones that would never be read back | Tell Claude: the older entries can be archived (nothing is lost; a copy is kept) |
| The page says N entries could not be read and were left out | A row of the log was damaged, written by hand, or written by another version of the code | Everything else is shown as recorded; ask Claude to read those rows before you send anything |
| "Clients with proof" is lower than "Marked as won" | A click on "won" is your word, not evidence. A client is a business with a signed agreement or counted revenue recorded against it | Record the agreement or the payment under Money, and choose the business |

## Checks that were run, and how to run them again

| Check | Command | Last result (18 Oct 2026, Pacific) |
|---|---|---|
| Unit and integration tests | `npm run test:recruiting` | all 329 pass (includes the robots.txt matcher test that protects the worker from freezing, and the demonstration script run offline) |
| Type check | `npx tsc -p <a tsconfig that includes the recruiting folders>` | clean |
| Lint | `npx eslint src/lib/recruiting src/app/dashboard/recruiting src/app/api/recruiting src/components/hq/hq-actions.ts scripts/recruiting-*.ts` | clean |
| Offline rehearsal of the whole lane on the documented sample payloads | `npx tsx scripts/recruiting-rehearsal.ts` | 11 of 11 documented shapes read; on the day of the first read no message is written (no role has been listed for 45 days, so there is no sample to offer); fifty days on, if the same roles are still listed, 1 message composed and ready; 0 wording errors; 0 template-like pairs; revenue $0.00 |
| Revenue tables | `npx tsx scripts/recruiting-revenue-model.ts` | matches 05-revenue-plan |
| Regenerate the marketing pages | `npx tsx scripts/recruiting-docs.ts` | matches `06-marketing/` |
| The owner's page in a phone viewport | a local harness drove the whole flow in a headless browser: settings, process approval, message approval, "I sent it", reply, opt-out, sample list, money | worked; no console errors |
| GitHub Actions | not run: the account cannot start jobs (billing) | not a pass and not a fail |

## What has never been tested

Any live read of any source; the deployed worker job; the page against the production database; sending and receiving real mail. Everything above was run against fixtures, made-up servers and an in-memory store.
