# Amber Global Recruiting: what already exists and what is reused

Written 18 Oct 2026 (Pacific), from a read of the code on `main` at f1f769e0. Nothing here is deployed.

## The rule that shaped the design

The owner's rules for this project: $0 startup cost, use existing systems first, nothing sent to anyone until the messaging and compliance process is approved, and no claim of clients, candidates or revenue without evidence. So the recruiting lane is built the way the existing outreach lane is built: it reads public pages, prepares drafts, and puts them in front of the owner. It has no sending code at all.

## Reused as it is

| Need | Existing piece | How the recruiting lane uses it |
|---|---|---|
| Run work on a schedule in the cloud | `ScheduledJob` rows and `CLOUD_JOB_KINDS` in `src/lib/cloud/work-queue.ts`; the worker (`scripts/cloud-os-worker.ts`) runs due jobs one at a time | One new kind, `RECRUITING_TICK`. It does nothing unless the worker has `AMBER_RECRUITING_LANE=1`. |
| A lane that must not run twice at once | `claimLane` / `runClaimedLane` in `amber-earnings/background-lane.ts` | Same single-flight claim. |
| Memory that survives a deploy (the worker has no volume) | The outreach lane mirrors its state into one `DevMemory` row (`amber-earnings/outreach/store.ts`) | Two rows of the same kind of store: one the worker writes (prospects, openings), one the owner's actions write (approvals, conversations, ledger). Two writers never share a row. No schema change, no migration. |
| Read a public page politely | `research/robots.ts` (`checkRobots`: unreachable robots.txt counts as a refusal), `registrableDomain` | Used before any company page is read. |
| A published contact address, never a guessed one | `customer-acquisition/website-contact-finder.ts` (`pickBest`, placeholder filtering) | Same rule: only an address printed on the company's own site, and only role addresses (jobs@, careers@, hello@) are kept. |
| Opt-out list | `customer-acquisition/suppression.ts` (hashed contacts) | Checked by the compliance gate before any draft is allowed. |
| Sort a reply | `customer-acquisition/reply-classifier.ts` (keyword rules; legal questions and wrong-contact escalate to a human) | The owner pastes a reply into the page; it is classified the same way. |
| Real money, real proof | `amber-earnings/earning-source-interface.ts` (`EarningEvent`, `paymentEvidence`, `isTest`) | The recruiting ledger only produces an earning event from an entry the owner has marked as confirmed with a reference. Nothing is reported tonight. |
| The owner-only page and API | `requireApiContext()` in `src/lib/api-auth.ts`; the pattern of `/dashboard/kdp-desk` | `/dashboard/recruiting` and `/api/recruiting`. |
| A recorded owner decision that a feature checks before it acts | `kdp/cloud/authorization/amazon.json` | The recruiting lane keeps the same kind of decision in the owner's decision log instead of a file: the page's "Approve the process" entry, with its date and scope, which can be withdrawn. Until it exists, every message is held. |

## Looked at and not reused

- **Scout Network** (`scout-network/`, about 100 modules): territory-scoped discovery of paid tasks, bounties and government bids for the earnings ledger. It finds work for Amber, not employers who are hiring, so its search code does not apply. Its country registry could be used later for region labels; the recruiting lane carries its own small region table because the rules differ by country.
- **Sending** (`customer-acquisition/engine.ts` and the outreach ticks): sends through the mail provider once two vault values exist (a mailing address and an unsubscribe secret). The recruiting lane does not connect to it. Every first message is sent by the owner from their own mail, after approving it on the page.
- **Reelo's Business Center**: it reads HQ through the bridge routes under `src/app/api/internal/`. It lives in another product. The recruiting numbers are on HQ's own page for now; adding them to the bridge is a follow-up that needs the owner's word.

## What cannot be done from the build environment

- The build container's network proxy refuses the job-board hosts, and the page-fetch tool cannot resolve any host. So no job feed was called tonight. Parsers are written against the vendors' documented response shapes and tested on fixtures. The first real read happens on the production worker, after the owner approves a deploy.
- GitHub Actions will not start jobs (billing), so nothing here has run through CI. All tests were run locally.
