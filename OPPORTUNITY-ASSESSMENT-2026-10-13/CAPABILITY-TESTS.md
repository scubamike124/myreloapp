# Small capability tests: what ran, what was blocked, what it showed

> **Updated 2026-10-13 (owner's sample received).** Section 1a analyses the owner's real sample, pasted into the session as report text. Section 1 below describes a
> **20-row third-party fixture, not the owner's sample** (about 50 commercial building permits
> above $100,000 and 50 mechanical/electrical permits, with recorded contractor details including phone numbers, and source links, in
> `Austin-Permit-Sample-2026-10-12.html`, not yet transferred to this session). The fixture's "no phone, email, licence or owner column" result
> described that fixture's filter and is **withdrawn as a statement about the dataset or the owner's sample**. Labels: **[P]** production
> observation, **[T]** tested in this sandbox, **[E]** estimate, **[R]** third-party report not independently verified.

**The headline is a limit, not a result.** The sandbox these tests ran in can reach GitHub and nothing else. Every other host
failed with `getaddrinfo ENOTFOUND`, or with HTTP 403 on the proxy's CONNECT step (`data.austintexas.gov`, `api.weather.gov`,
`boards-api.greenhouse.io`, `api.lever.co`, `api.ashbyhq.com`, `hq.amberoneai.com`, `amberoneai.com`, `legis.delaware.gov`,
`apify.com`, `catalog.data.gov`). Nobody tried to route around the policy. So **no live API data was collected and no
measured error rate, latency or field-quality figure on live data exists.** No mock data was substituted for a measurement.
Amber's own code cannot run from here; Amber's numbers below come from her production reports.

| Test | Planned | Tried | Worked | Failed | Result |
|---|---|---|---|---|---|
| Find the prepared Austin permit sample | 1 | 5 searches (amberai `origin/main` docs and data, `/home/user` filenames, the scratchpad) | 0 | - | **Not accessible at the time** (the owner has since named the file, `Austin-Permit-Sample-2026-10-12.html`, and will transfer it). Only code mentions, the fictional Harborline Home Care site, and an idea note were found |
| Analyse the owner's sample (pasted report text, 2026-10-13) | 1 | 1 | 1 | 0 | 100 rows (50 building, 50 trade) transcribed into a private file; 13 of 13 figures in the report's own summary re-computed and agree (section 1a) |
| Live Austin pull (about 300 rows) | 1 | 4 fetches + 1 curl | 0 | 5 | Blocked by network policy |
| Analyse a public Austin fixture | 1 | 1 | 1 | 0 | 20 real rows, not representative (below) |
| Greenhouse / Lever / Ashby endpoints (one each) | 12 | 3 | 0 | 3 | Blocked |
| NWS alerts and points (Houston) + NWS docs | 25 | 3 | 0 | 3 | Blocked |
| Control: GitHub raw via WebFetch | - | 1 | 1 | 0 | Works, so the block is per host |
| Amber APIs: live GETs to `hq.amberoneai.com` | - | 1 plain GET | 0 | 1 | Proxy refused (403 `connect_rejected`); stopped |
| Amber APIs: offline run of the real code, network stubbed | 3 APIs | 3 | 3 | 0 | Findings below |
| WebSearch (research and spot checks) | - | 100+ | all answered | 0 | Summaries only; no page read |

Failure rate against the target hosts: 6 of 6 for the data sources (100%). That describes this environment, not those
services' reliability.

## 1a. The owner's sample (received 2026-10-13 as pasted report text) [T on the sample; the pull itself is [R]]

**What it is.** A report collected on 2026-10-12 by the owner's other tool from the City's public Socrata API (no key needed): the 50 most recently issued Commercial-mapped building permits with
`total_job_valuation` above $100,000 (issue dates 2026-09-15 to 2026-10-11), plus 50 recent Commercial mechanical and electrical permits (2026-10-07 to 2026-10-11), plus the one trade permit linked
by identifier. It is a **selected sample, not a random one**. I transcribed the two summary tables (permit, site, work class, value, contractor, trade, phone, master id, scope) into a private file,
added the status and trade-valuation fields from the raw JSON, and ran `tests/austin-permits/analyze_owner_sample.py`. The input file holds contractor names and phone numbers and is not in this repository;
the aggregate output is in `tests/austin-permits/results/owner_sample_profile_2026-10-13.txt` (it prints no phone number and no personal name).

**Integrity check.** 13 of 13 figures that the report states about the sample (rows, distinct address strings, master ids, work-class split, mechanical/electrical/missing split, master-id count, Final statuses,
date range) were recomputed from my transcription and agree. The report's population counts (345 commercial building permits issued 09-12 to 10-12; valuation on 124; company on 316; phone on 344) could not be recomputed.

| Measure | Result |
|---|---|
| Building sample: rows / distinct address strings / master ids | 50 / 48 / **13** |
| Largest master id | 35 of 50 rows (70%): one apartment complex with trash enclosures, carports, garages and 9 apartment buildings |
| Independent projects per week | about 3.4 (13 over 3.9 weeks; the 50-row limit cuts off the first week) |
| Rows valued at exactly $1,000,000 | 37 of 50; 28 of 29 small site structures are valued at $1,000,000 or more |
| Valuation if rows are counted / if each master id is counted once | $196.5M / $92.1M (2.13 times overstated); 4 of 4 multi-permit projects repeat one value |
| Master-level valuations | median $2.05M; 9 of 13 at $1M or more |
| Contractor company and phone present | 50 of 50; valid 10-digit shape 49 of 50 ("512" is not a phone); 5 of 13 projects have a non-Austin area code |
| Work classes | 46 New, 2 Shell, 2 Addition and Remodel; all 50 Active |
| Scope of the 13 projects (by master id) | 4 small site structures; 4 office, storage, industrial or club buildings; 3 multifamily; 2 EV-charging; 2 garage structures; 1 hospital generator and switchboard; 1 restaurant change of use (first match wins, so counts overlap by one) |
| Trade sample: mechanical / electrical / no contractor | 15 / 23 / 12; the 12 are all sign permits |
| Sign permits | 17 of 50 (34%) |
| Mechanical work classes | 8 remodels, 5 change-outs, 1 addition and remodel, 1 repair |
| Contractor-linked trade permits / distinct companies | 38 / 27 (26 on non-sign permits); 4 companies with 2 to 5 permits |
| Trade phone in valid shape | 33 of 38 (the 5 others are one company's 12-digit value, all on sign permits) |
| Trade valuation | none has `total_job_valuation`; 15 have `electrical_valuation_remodel` (7 at $100,000 or more; four siblings at one address repeat $1.6M); mechanical permits show none |
| Master ids on trade permits | 39 of 50; **0 shared with the building sample**; the one linked record (found by trade master id = building project id) was issued five months before its building permit |
| Status | 2 Final among the trade permits; one Active record shows a completed date before its issue date (a data anomaly) |

**What this does and does not establish.** It establishes that the City's data carries recorded contractor company and phone for most commercial permits, that source links and dates are present, and that the
raw feed is noisy in specific, checkable ways (placeholder valuations, repeated sibling permits, sign permits, out-of-area and malformed contacts). It does **not** establish that the numbers are reachable (nobody
called), that the feed is complete (one 26-day window; the building list is truncated at 50 rows), that suppliers would use it, or that the dataset's terms allow resale.

## 1. The Austin permit data (opportunity 1): the 20-row third-party fixture

**The fixture (not the owner's sample).** The owner's prepared sample was not found at the time. Instead, 20 real rows were taken from a public test fixture in an
unrelated repository (`beford782/Silverline-Sleep-Procurement`, PR 191, `tests/fixtures/austin_permits_sample.json`). It is
**not a sample of the dataset**: it reflects another team's hotel and senior-living filter, all Commercial, 12 building / 5
electrical / 3 plumbing permits issued 2026-06-16 to 2026-09-01 (none in the last 30 days), 24 columns, phone fields not
requested. A 20-row sample can say a problem *exists*; it cannot give a rate.

| Measure (n = 20, not representative) | Count |
|---|---|
| `total_job_valuation` missing or zero | 19 of 20 (11 of 12 building-permit rows) |
| Rows with `masterpermitnum` | 19 of 20 |
| Distinct `project_id` | 20 of 20: one id per permit, so it is **not** a project key |
| Projects after de-duplication (master permit, parent link, permit-number stem) | **14**; three multi-permit projects hold 9 rows; 2 mixed-trade projects |
| Same-address groups needing a human | 2 groups, 6 rows |
| Contractor company named | 19 of 20; 4 names carry stray characters such as `*MAIN**` |
| Phone, email, licence, owner columns | None present **in this fixture**, because that team's filter did not request them (withdrawn as a finding about the dataset or the owner's sample) |
| Qualified roofing leads (residential building permit, new or addition, active, at least $100,000, named builder, last 30 days) | **0 of 20** (still 0 with a 130-day window; the fixture has no residential rows) |

Two of the three limits the owner named show up in these 20 rows [T]: duplicate projects (one project spread over several permits) and
missing valuations. The third, trade-contact limits, **cannot be judged from this fixture**; it depends on the owner's sample, which carries
recorded contractor phone numbers by the owner's account. Treat each permit as a *signal about a project*, not as a qualified lead.

**Cost and correction time.** The analysis ran in under a second with no model calls and no human corrections (rule-based).
A weekly summary of about 25 projects would need roughly 2.5k input and 1k output tokens, generated once per trade
(estimate). Human correction time was **not measured**; the estimate is 20-45 minutes a week per about 300 raw rows, plus 1-2
hours of initial tuning (a guess).

**Reuse restriction found.** The dataset's licence label reads "Public Domain U.S. Government" while the catalog record defers
to the City's own open-data terms and the resource-level licence reads "other-license-specified". See `OPPORTUNITIES.md` (1).

**To finish the test:** either the owner transfers `Austin-Permit-Sample-2026-10-12.html` to the session, or the
sandbox's network policy allows `data.austintexas.gov`. For the HTML report:

```
python3 -I tests/austin-permits/analyze_sample_html.py Austin-Permit-Sample-2026-10-12.html --asof "$(date -u +%F)"
```

`analyze_sample_html.py` reads the report's tables (matching columns by header words), prints counts and fill rates only (never a phone number,
email address or name), joins trade permits to building permits, and writes row-level output only if asked with `--rows-csv` (keep that file out
of any repository). Its `--selftest` runs on an invented page and proves only that the code works. For live Socrata JSON:

```
bash tests/austin-permits/fetch_sample.sh OUT_DIR 45 1000
python3 -I tests/austin-permits/analyze_permits.py OUT_DIR/all.json --asof "$(date -u +%F)" --window-days 30
```

`analyze_permits.py` is stdlib-only with no network access; its `--selftest` passes (logic on hand-made rows, not data).
`fetch_sample.sh` was never run against the live host. The analysis script defines only a roofing rule; a pool rule needs a
keyword match on the free-text fields, which the fixture cannot test. Output of the fixture run:
`tests/austin-permits/results/`.

## 2. Amber's existing APIs (opportunity 2)

An inventory and an offline run of verbatim copies of the real code with the network stubbed (`origin/main` f15f7ac4; the
deployed commit is uncertain).

**Inventory.** Statute API (Delaware HB 380/381 readiness score, $49/$149/$299), Business Risk Intelligence API (sanctions,
federal exclusions, SEC filers, domains; $49/$149/$399), Agent Ops API ($49/$199/$599), compliance-autopilot and four more
"hero" modules plus a bundle ($99-$999), MotorBridge vehicle-log normaliser (lives in the Reelo repo), 23 venture-factory micro-APIs
(nothing published) and the Website Snapshot report ($49). All were built by Claude sessions or the owner's own commits, none
authored by Amber. **Usage evidence for every one: zero.** Revenue is $0; 54 listings, 1 published (a Ko-fi Website Snapshot,
not an API); 0 inquiries; none of 14 marketplaces approved; API keys, calls and sign-ups are not measured in any report
(uncertain, not proven zero).

**Closest to a repeatable utility: Business Risk Intelligence.** Deterministic, no model calls, free official lists, usage per
counterparty so it can recur, and anyone can check a hit against the OFAC or UN register. It is not yet a product: no customers,
no re-screen or alerts, recall gaps, unenforced quotas.

**Defects found offline (this is the "reliable delivery" evidence)**
- *Statute API:* a near-empty questionnaire scores **100**; the developers-page example payload also scores 100. A 9,000-consumer
  firm with no breach process gets PRIV-009 NOT_APPLICABLE although the archived HB 381 text says it applies "regardless of the
  number of Delaware residents". A policy URL returning HTTP 404, 403 or 503 yields `ok:true` plus six potential gaps because the
  fetch never checks the status code, contradicting the disclaimer page; the Delaware cold-email code reuses this ("we reviewed
  your privacy policy" while scanning the homepage). "Unsubscribe" passes the opt-out check. The result carries no rule-pack
  version; tier features and scans per month are unenforced; copy says "never bypasses robots" but no robots.txt is read.
- *Rule items against the repo's archived quotes (not against legis.delaware.gov):* five items match (10,000 threshold, four-part
  sale test, 50,000, 60 days); four supporting claims are secondary-sourced or absent from the archive. Human check against the
  enrolled text: 60-90 minutes (estimate).
- *Business Risk:* "Société Générale" does not match "SOCIETE GENERALE", "Müller Handels GmbH" does not match "MULLER HANDELS"
  (non-ASCII is stripped); "Wagner" does not match "WAGNER GROUP"; no alias lists; SAM.gov hits are always "HIGH" without name
  matching. A false "clear" in a screening product is the failure that matters.
- *Accessibility scan:* a correct form with implicit labels gives "critical x3"; two unlabeled inputs plus two stray `label[for]`
  give nothing.
- *Fix-time estimates (one developer, no legal review):* status handling 30 min; rule-pack version 20 min; "incomplete" score
  45 min; PRIV-009 gating 20 min plus a 45-min legal read; accent normalisation 30 min; aliases 3-5 h; quota enforcement 2-3 h.
- *Business plumbing:* the pricing pages list `sales@` and `support@amberoneai.com`; neither can receive mail (Resend reports the
  domain failed, 4 of 4 DNS records unpublished, sending refused). The Stripe webhook once pointed at the apex domain
  produced 74 failed deliveries (current state uncertain). `src/app/terms/page.tsx` is a placeholder.

**Cost and failure.** No report gives a per-call cost or an API failure rate. Statute and Business Risk make zero model calls;
Agent Ops does (capped at $100 per rolling 7 days in code; no figures published). Amber's own probes: the health route answered
30 of 30 with HTTP 200, slowest 3,300 ms, typical 0.3-0.7 s ([B](https://github.com/scubamike124/amberai/issues/105#issuecomment-5737077514));
nothing probes `/statute-api`, `/business-risk` or `/agent-ops`. Estimates: a Statute call about $0.001; Business Risk 4-5
outbound calls, about $0, but its SAM.gov key is shared (quota uncertain); an Agent Ops task $0.004-0.07.

**Smallest missing evidence:** one authenticated, paid, metered `POST /api/v1/risk/check` call (checkout, key, call, usage row).
No report shows a customer-key call. **Next capability:** re-screening a saved list with change alerts.

## 3. Hiring-signal and weather sources (opportunities 3 and 5)

Not testable from here: 0 of 6 attempts reached a host. A twelve-company, three-vendor (Greenhouse, Lever, Ashby) test and a
twelve-site Houston NWS test are written up and ready to re-run (about 40 requests) once those hosts are allowed.
What the documentation says, read from the official pages where available:

- *Lever*, verbatim from the official README: "Note that all job postings in the `published` state are publicly viewable. These
  jobs may be scraped by third parties." The documented rate limit is for application POSTs only (429 above 2 per second, "may
  also be changed without warning"). No date field is documented.
- *Greenhouse* (search-tool paraphrase): GET endpoints need no authentication; fields include id, title, `updated_at`, location,
  `absolute_url`; `updated_at` is the last edit, not the posting date; no rate-limit or reuse text found.
- *NWS* (paraphrase, verify on the pages): User-Agent required (403 without); rate-limiting firewall, poll alerts no more than
  every 30 s; reuse "for any lawful purpose" provided you do not claim it as your own, imply endorsement, or alter and present as
  official; no SLA; the service has had outages (2026-08-11). Only some warnings carry polygons; most watches and advisories
  are zone-based, so a message may say "issued for the zone or county containing the site", not "at this address".

## 4. What would complete these tests

| Need | Who | Cost |
|---|---|---|
| Point to the prepared Austin sample (or commit it to this repository) | Owner | $0 |
| Allow `data.austintexas.gov`, `boards-api.greenhouse.io`, `api.lever.co`, `api.weather.gov` (and, for documentation, `developers.greenhouse.io`, `developers.ashbyhq.com`, `www.weather.gov`) in the cloud environment's network access | Owner (environment settings) | $0 |
| Enough permission to run a one-off read-only script in Amber's production worker, which can already reach public hosts | Owner decision (it would add code to the deploy sequence) | $0 |

None of this is requested as a build; each is a way to replace the estimates above with measurements.
