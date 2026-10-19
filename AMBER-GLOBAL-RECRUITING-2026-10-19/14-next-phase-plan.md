# Next phase: from a prospect list to a recruiting business (plan, status, and what the law lets us build)

Written 19 Oct 2026 (UTC), from the owner's consolidated assignment. Status words are exact: **built** = code with tests, disabled or unwired; **designed** = written here, not built; **blocked** = needs the owner, the network or a lawyer. Nothing here is deployed, enabled or sent.

## What already exists and is reused (not rebuilt)

| Need | Existing piece |
|---|---|
| Discovery of companies from job feeds, company boards, Hacker News, map data; dedupe by website; 45-day roles; contact finding with robots.txt first | `src/lib/recruiting/` sources, discover, contacts, site, agencies |
| Notice and opt-out readers; permanent suppression across a business's records | `notice.ts`, `optout.ts`, decision log |
| Wording check, batch similarity, compliance gate by region and service | `voice.ts`, `drafts.ts`, `compliance.ts` |
| Consent-first candidate rules (self-submitted, 12-month retention, deletion in 30 days, no scoring) | `candidates.ts` (rules only; no form, no storage) |
| Worker job, owner-only page and API, decision log, evidence-based money ledger | `work-queue.ts`, page, `api.ts`, `ledger.ts` |
| Deliverability checks, send planner, bounce classes | `deliverability.ts` (13-email-deliverability.md) |

## Built in this step (tested, nothing wired to a sender or the page)

- **Placement-claim rule in the compliance gate** (`PLACEMENT_CLAIM`): any text that advertises placement, contingency or referral fees, "no upfront fee / pay only after placement", a percentage of salary, or sending candidates is **blocked** unless the placement service is switched on *and* the region needs no agency licence. This is how "do not advertise placement services until the legal questions are resolved" is enforced in code, not by habit.
- **Inbound mail classifier** (`inbound.ts`): a request to stop wins over everything and is never answered beyond one confirming line; sender kind (agency, employer, school, candidate, client, unknown) from the record first, wording second; legal, money/terms, placement promises, complaints, data requests, requests for candidate details and unknown senders go to the owner; replies are drafts and `autoSendAllowed` is false for every class. `replyProblems` refuses drafts that commit, quote money or expose a candidate's details.
- **Per-channel business model** (`channels.ts`): research list, agency referral, employer contingency, trade school, each with discovered, verified contacts, emails, replies, interested, agreements, customers, matches, interviews, placements, invoiced, collected, expenses, profit; simulated and production in separate blocks; only collected money with a proof reference and the owner's confirmation is revenue; a placement without a prior signed agreement is listed as unattributed. The decision log has no events for agreements, candidates, matches, interviews, placements or invoices yet, so this is not on the phone page.

## What the owner's brief asks that the law shapes (decisions, not code)

1. **Placement and referral fees ($1,000 to $3,000 per referral; 15 to 25% of salary; no upfront fee).** These are employment-agency / recruiter activity. Licensing or registration is required in some US states (09-viability lists California, New York, New Jersey, Massachusetts, Illinois and others) and in many other countries, and fee-splitting with an unlicensed party can itself be unlawful. Until a lawyer has answered for each place, the gate blocks the wording (above) and the service stays off. **Decision: a lawyer's hour, and which places first.**
2. **Matching candidates to jobs by skills is an automated employment decision tool** under New York City Local Law 144 (bias audit and notice), Illinois' AI Video Interview and 2026 AI-in-employment rules, Colorado's AI Act, and the EU AI Act (high risk), among others. The existing design deliberately shows a human what the candidate wrote against each criterion and never ranks or scores. **Decision: keep it that way (a "match view": evidence per criterion, a named person decides), or commission an audit before any scoring.** I will build the match view, not a ranking.
3. **Candidate sources.** Permitted: a candidate registration page Amber owns; opt-in programs with schools and employers' referral programs; people who write in. **Not permitted or not allowed to be assumed:** scraping LinkedIn or Facebook profiles or groups (their terms forbid automated collection; LinkedIn litigates), harvesting Reddit users (API terms, privacy law), buying lists, cold-messaging individual job seekers (the gate already blocks it). Posting a role or the registration link in a community where the rules allow it is possible, by hand or through an approved account, and is the owner's to approve per community.
4. **Trade-school lane.** Schools are businesses, so discovery and a first note follow the same rules as agencies (published role mailbox, robots.txt, notice, opt-out). Graduate placement through a school needs the graduates' own opt-in (consent), organised by the school, and counts as the candidate channel plus the placement-fee question in item 1. Helping a school recruit instructors is an employer-side service and the same licensing question. Education data (student records) is regulated (FERPA in the US; GDPR elsewhere): Amber never receives student lists; the school sends the registration link.
5. **Cross-border outreach.** Cold B2B email is blocked or held in Germany, Spain, Italy, Canada, Australia, Japan, South Korea, South Africa and others by the existing region rules; "worldwide" outreach therefore means discovery everywhere and sending only where cleared.

## Free software and international sources (evaluation; statements marked "from memory" were not checked: no network)

| Source | Role | Notes |
|---|---|---|
| Greenhouse, Lever, Ashby, SmartRecruiters, Workable public job-board APIs | Employers' open roles | Already built as readers; **never live-tested** (blocked) |
| OpenCATS (open-source applicant tracking, GPL, PHP, self-hosted; from memory) | An ATS to run, not a data source | Would mean hosting a PHP application and its database: an operating cost and a security surface; Amber's own decision log and a registration page cover the need at $0. Not recommended now |
| Remotive, Jobicy, Arbeitnow, Remote OK | Job feeds | Built; terms for commercial reuse unclear (03-lead-sources) |
| Adzuna, Jooble, Bundesagentur für Arbeit (DE), France Travail (FR), EURES (EU), national job banks (from memory) | International job APIs | Several need a free API key or registration, which is an account the owner must authorise. Terms and quotas unverified. Not started |
| OpenStreetMap / Overpass (`amenity=school`, `college`, `office=employment_agency`) | Schools, agencies, employers with websites | Reader exists for agencies; schools need a tag mapping and the same Overpass fair-use limits |
| Government and school directories (US NCES, state licensing boards, UK GIAS, national registers; from memory) | Authoritative lists of schools | Public data, per-country formats; the first live demonstration decides which are worth building |
Everything above must be tested for real data, legal access, reliability, duplicates and usefulness **after** the network is open; none was tested.

## Built after the owner's decisions (19 Oct, later), all disabled or unreachable, each independently reviewed and fixed

- **Sharded discovery store** (no business-count limit; 256 shard rows, changed shards only; 250,000-business memory guard; damaged or duplicate shard rows no longer lose or resurrect businesses). Measured on an in-memory fake: 30,000 businesses save and load in about 0.2 s; the page's practical ceiling is about 30,000 to 50,000 businesses (a click about 1.5 s at 30,000). Not run against the real database.
- **Automatic sender** (`sender.ts`): off unless the worker switch is on AND the owner's authorization records authentication verified, inbox tests passed and suppression verified; then every message must be an approved one, pass the message checks, and be allowed by the send planner. Provider errors are never recorded as recipient bounces; a timed-out send is recorded as attempted and stops the run; per-recipient https one-click unsubscribe. Nothing imports it; no job, route or owner action exists.
- **Candidate registration, consent per introduction, school links, match view gate** (`candidate-intake.ts`, `candidate-db.ts`): double opt-in, unconfirmed records expire in 7 days, introductions need the candidate's confirmation for that business and role and cannot be re-granted from an old link, nothing is shared past retention, schools get counts of 5 or more only, matching is off everywhere until cleared and needs an audited clearance in New York City, Illinois, Colorado, the EU/EEA, Switzerland, the UK, Canada and any unrecognised country. No route or page; making it public needs a shared-middleware change that has not been made.
- **Incoming mail** (`inbound.ts`, `inbox.ts`): classification, escalation, suppression actions and drafted replies; auto-send off; the mailbox reader is not built (needs credentials and network).

## Implementation sequence

| # | Piece | Status |
|---|---|---|
| 1 | Placement-claim guard, inbound classifier, channel model | **built** (this step) |
| 2 | Live demonstration of the 12 sources (round 1, round 2) | **blocked**: network |
| 3 | Deliverability proof (DNS, seed inboxes over several days) | **blocked**: DNS, mailbox access |
| 4 | Discovery at any size: sharded record | **built and reviewed** (see above); a lighter page read path is the next step past about 50,000 businesses |
| 5 | Automatic sender | **built, disabled, reviewed**; wiring to a job and to an owner authorization action is NOT done. The lane's "no send path" claim in earlier documents is now true only because nothing imports the sender |
| 6 | Inbox monitoring (authorized mailbox read over IMAP or Resend inbound, classification, conversation log, drafted replies) | classifier **built**; connection **blocked** (credentials, network) |
| 7 | Candidate registration page, consent ledger, match view (no ranking) | rules exist; page and storage **not built**; legal review first |
| 8 | Trade-school discovery lane | **designed** (above); reader after the first live Overpass result |
| 9 | Per-channel phone dashboard fed by agreement, candidate, match, interview, placement and invoice events | model **built**; events and page **not built** |
| 10 | Independent review of each piece; shared-code regression runs | continuing |

## What genuinely needs the owner

A lawyer for placement and referral fees (item 1); confirmation that matching shows evidence and does not rank (item 2); which communities may be posted in and by whom (item 3); free API keys or registrations for international sources; network access (12 domains, then the email seed test); DNS and mailbox access; the decision to build the sender (step 5) and, separately, to switch it on after inbox placement is proven.
