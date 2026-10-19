# 15. Candidate registration (built, switched off), the lighter read path, trade schools, the channel panel

What is tested, what is only built offline, and what is deployed. Nothing here is deployed: PR #930 is a draft and nothing has been merged.

## Candidate registration: built and switched off

| | |
|---|---|
| Routes | `POST /api/candidates/register`, `/confirm`, `/erase` (only these three are in the middleware's public list) |
| Pages | `/candidates/register` and `/candidates/confirm?id=&token=&action=confirm|erase` (not indexed; opening the confirm page changes nothing, a button posts) |
| Flag | `AMBER_CANDIDATE_INTAKE` must be exactly `1`. Anything else: every route and page answers 404, before the secret, the database or any mailer is touched |
| Secret | `CANDIDATE_TOKEN_SECRET` (16+ characters). Missing or unreadable: 503, nothing stored |
| Mailer | none. The routes inject `noConfirmationSender`, which throws, so a registration nobody can confirm is not kept. The shared mailer is not used (it falls back to `onboarding@resend.dev` and sets no headers) |
| Limits | 5 per hour per connection (the proxy's last forwarded address, not one the caller wrote) and per address; confirm and erase limited too; 16 KB body (header first, then bytes); `application/json` only; at most 5,000 unconfirmed records |
| Erase | the confirmation mail and the "already registered" mail both carry the erase token; an erased record cannot be brought back by a late write |
| Sweeper | `sweepExpired(store, now)` erases unconfirmed records after 7 days and confirmed ones after 12 months of silence. **Not scheduled anywhere yet**; an expired unconfirmed record is also replaced when the same address registers again |

Independent review 10 (commit a4ed5f14): no critical or high finding. Five medium and six low findings, each reproduced by the reviewer. Fixed in a54f07bf: rate limit keyed on the forged first address (now the last), no per-address limit, confirm/erase unlimited, erase link never mailed, pending rows never purged, erase/confirm race, cross-site text/plain POST, size checked after buffering, 413 before 404 when off, prefix wider than the three routes. Not changed: the token is still in the confirm URL's query string (a fragment would keep it out of access logs; a decision for the page's final design), and the new-versus-existing address timing difference (the mail send dominates; not measured).

### What must be true before it is switched on (owner decisions, none made)
1. A real confirmation mailer that sets the unsubscribe headers, tested to a real inbox.
2. A scheduled sweeper, and a person who reads the privacy notice text and the retention period (12 months from last contact) and agrees them.
3. A lawyer's reading for each place where visitors will come from (consent wording, deletion within 30 days, children's data).
4. A shared (database-backed) rate limit if more than one web process runs.
5. Matching stays off per place until audited (`matchingStatus`), whatever the registration says.

### Rollback
- Switch off: unset `AMBER_CANDIDATE_INTAKE` (or set it to anything but `1`). The routes and pages are 404 at once; nothing else changes.
- Remove: revert the commit. The middleware lines are three exact paths, the routes are the three files under `src/app/api/candidates/`, the pages are under `src/app/candidates/`.
- Data (none exists until it is switched on): all rows are `DevMemory` rows of kind `RECRUITING_CANDIDATE`. To delete them: `DELETE FROM "DevMemory" WHERE kind = 'RECRUITING_CANDIDATE';` (run it only after looking at `SELECT count(*) ...` first). Erased records are already tombstones with no personal data.

## The lighter read path (tested offline against an in-memory database)

- `loadDocForView`: one small row (the main record) is read each time; every save writes a new `version` into it, last. If the version is the one already held, the shard rows are not read or parsed again. A damaged shard is never held. The lane's own `loadDoc` is never served from it.
- `getView` reuses the last page for a minute while the businesses, the log length and the last decision are unchanged; any save, decision, or new minute builds again.
- `normDomain` is remembered (bounded at 200,000 entries); it was the largest single cost.
- Measured on the in-memory fixture, unique domains: building the page at 100,000 businesses went from about 3.2 s to 2.4 s; a repeat request inside the minute with nothing changed costs one small row read plus the log. **Not measured against the real database.** A change of business still rebuilds the whole page, so the first request after a save or a minute still pays about 2.4 s at 100,000 and the work is still proportional to the number of businesses. The held copy is one extra copy of the businesses in the web process's memory (tens of megabytes at 100,000).
- Rollback: revert the commit. Older main rows have no `version` and are read as before; a row written by the new code with an extra `version` field is read by the old code (it ignores the field).

## Trade-school discovery (offline only)
`src/lib/recruiting/schools.ts`: an Overpass query for colleges, schools and training places with a website, a parser that keeps vocational ones, and trade tags from the school's own words (construction, electrical, plumbing, HVAC, welding, automotive, transportation, healthcare, manufacturing, technology, culinary). Tested on a hand-written sample of the documented response shape, **not on a recorded live answer** (the network is closed). Not connected to the lane, the prospect record or any message; it holds no student or person data. Wiring it is a separate step: a school prospect kind, the gate rules for a first note to a school, and the partnership workflow.

## International sources
No new source was built, because none can be tested while the network is closed. Free sources that need a key or a registration (Adzuna, Jooble, Bundesagentur, France Travail, EURES) are owner decisions: each key or registration is an account in the owner's or Amber's name.

## The channel panel
The dashboard shows the four channels side by side. Businesses found are real counts for agencies and employers; everything else (agreements, interviews, placements, invoices, collected) is zero and labelled "no events recorded", because nothing writes those events yet. Simulated figures are never mixed in. A found business is not a customer.

## Added in the second round (all offline; nothing deployed or sent)

| What | State | Flag |
|---|---|---|
| Candidate confirmation mail (`candidate-mail.ts`): confirm link, separate erase link, sender, postal address; a failed send keeps nothing | built, tested with an injected transport | `AMBER_CANDIDATE_MAIL=1` **and** `CANDIDATE_MAIL_FROM_NAME`, `CANDIDATE_MAIL_FROM`, `CANDIDATE_MAIL_REPLY_TO`, `CANDIDATE_MAIL_POSTAL`, `CANDIDATE_BASE_URL` (https) **and** a readable `RESEND_API_KEY`; otherwise the no-op mailer |
| Expiry sweep (`candidate-sweep.ts`), run in the worker's recruiting pass | built, tested; runs only while `AMBER_CANDIDATE_INTAKE=1` | `AMBER_CANDIDATE_INTAKE` |
| Incoming mail (`inbox-ingest.ts`): reads one message, files a reply or an unmatched-mail entry, prepares a draft reply for the owner, honours opt-outs, ignores automatic mail, files a message once | built, tested with fake messages; **no route, no mailbox, no webhook is connected** | `AMBER_RECRUITING_INBOX=1` |
| Provider feedback (`feedback.ts`): hard bounce, block, complaint become suppression decisions | built, tested; **not connected to any webhook or sender** | none |
| Judging the real inbox test (`seed-tests.ts`) | built, tested; it reads records someone enters, sends nothing | none |
| Steps recorded by hand (interested, interview, agreement with a reference, placement), real and rehearsal kept in separate tables | built, tested in the browser; money stays in the ledger | none (owner page) |
| Worldwide discovery by adaptive map boxes (`tiles.ts`): a full box is split, the queue is kept in the record, no cap on businesses found | built, tested offline; **never run against the real map servers** | the lane's `osm` source and `AMBER_RECRUITING_LANE=1` |
| Worker pass reads the lane switch before loading any recruiting code | done (deploy-safety review finding) | |
| `qa:typecheck` has a 4 GB heap | done (CI failure: the scripts project needs a little over 2 GB with the recruiting lane in its graph) | |

### Rollback for these
- Registration mail, sweep, inbox: unset the flags; nothing else changes. A `RECRUITING_CANDIDATE` row is erased by the sweep, or by the SQL in the section above.
- Tiles: the queue lives in the main `RECRUITING_PROSPECTS` row as an optional `tiles` field; older code ignores it. To restart discovery from the country boxes, remove that field or revert; businesses already found stay.
- Channel steps and unmatched mail are new decision types in the append-only log (`RECRUITING_DECISION`). Older code reading the log skips an entry type it does not know (it counts it as unreadable). To remove them: `DELETE FROM "DevMemory" WHERE kind = 'RECRUITING_DECISION' AND body LIKE '%"type":"channel-event"%'` (and the same for `unmatched-mail`), after looking at the count.

### Review 13 (second round) and what it changed
Independent review of ae432ceb..6a918cfb found nothing that blocks merging with the switches off. Fixed before the merge: a business found by a country box took that box's country (a Toronto agency was filed as US); inbox drafts skipped the fee/legal/complaint check; a display name could decide who wrote; a repeated message id skipped an opt-out; an unknown business that opted out was set aside by address only; a long subject could hide an escalation; a missing step mode meant "real"; the duplicate and evidence checks for steps were weak; map answers that the server cut short (a `remark`) counted as complete; a saved queue with a malformed box was trusted; mail settings accepted line breaks and odd base URLs; the inbox-test judge read passes inside comments and accepted a parent signing domain.

Known and left, for the owner's information:
- **Inbound mail is not authenticated.** Nothing checks that an inbound message really came from the address in its From line (no SPF/DKIM/DMARC result is read). A forged sender can file a reply against a business, or set an address aside. It cannot send anything or release a hold, and the owner reads everything before replying.
- **Older code reading the log:** a build from before this change skips the new decision types, but its page shows the orange "N entries could not be read" banner until the new code is back. It also drops the saved map queue, which then restarts from the country boxes.
- A placement recorded before its agreement is accepted but shows as zero until the agreement is recorded.
- The candidate confirmation path sends through the provider directly, gated by `AMBER_CANDIDATE_INTAKE` and `AMBER_CANDIDATE_MAIL`, not by `AMBER_RECRUITING_SEND`. It sends to any address a visitor types (5 per hour per address and per connection) and does not check the do-not-contact list. A daily cap and a suppression check should be added before registration goes public.
- The candidate sweep runs while `AMBER_CANDIDATE_INTAKE=1`, or while `AMBER_CANDIDATE_SWEEP=1` is left set after intake is switched off.
