# Five opportunities for Amber: the decision (corrected 2026-10-13)

> **Correction notice (2026-10-13, after the owner's review; updated when the owner's sample arrived).**
>
> 1. **The first Austin numbers came from the wrong data.** They were computed on a 20-row third-party fixture, not on the owner's sample. That
>    fixture's "no phone, email, licence or owner column" finding described its own filter and is **withdrawn**. The owner's sample (pasted into the
>    session as report text on 2026-10-13: 50 commercial building permits above $100,000 and 50 recent mechanical/electrical permits, with recorded
>    contractor details and source links, collected by the owner's other tool on 2026-10-12) has now been analysed. Results are in "What the owner's
>    sample shows".
> 2. **The pool-service buyer was a method error.** It was chosen because the fixture's contact and valuation fields were weak, not from evidence about
>    pool-service buyers. The owner's original target is **commercial HVAC and electrical suppliers**. Pool service is an *untested alternative*.
> 3. **The first test thresholds were guesses and one is falsified.** I had guessed that a useful list needs at least 15 qualifying projects a week. The
>    sample shows about 3 independent projects a week above $100,000. The thresholds below are rebuilt from the sample.
>
> Evidence labels: **[P]** production observation (Amber's own reports and counters), **[T]** tested in this sandbox by me or an agent, **[E]**
> estimate or assumption, **[R]** reported by a third-party source or by the owner's other tool and not independently verified.
>
> What the production audit shows and does not show: customer acquisition and delivery are **unproven**. It does not show that the businesses cannot
> sell. Amber has never offered a paid report to a real buyer, so there has been no real test either way.

Assessment of 2026-10-12/13. Research, read-only inspection and small tests only. **Nothing was built, spent, sent or launched.**
The deploy sequence was not touched. This is an evaluation, not authorization to start a business.

## The answer in four lines

1. **None of the five is ready to build.** None has a buyer who has said yes, and Amber has never delivered a paid report to a real buyer [P].
2. **Strongest candidate to test first: #1, Austin construction-permit intelligence, for commercial HVAC/electrical suppliers (the owner's own
   target).** Runner-up: #3, hiring signals. It is a close call. The owner's sample makes the data and the contact fields real [T on the sample] but shows
   thin volume, noisy valuations and no visible link between new building permits and trade permits, and demand is still unproven.
3. **Reject for now:** #4 multi-location audits (third), #2 the utility API (fourth), #5 weather monitoring (fifth).
4. **The binding constraint is reach, not product.** All five score 2 of 5 [E] on reaching buyers without paid ads or cold outreach, and
   Amber's production record is $0 revenue and no customers or replies after 66 days [P]. The next step is a conversation test, not a build.

## Comparison table

Scores are 1 (worst) to 5 (best) and are my judgments [E] from the evidence in this folder. Order of criteria, as asked: demand evidence,
owner time, delivery reliability, cost, reach.

| Rank | Opportunity | One buyer -> deliverable | Paying-demand evidence (dated) | Owner time / delivery / cost / reach [E] | Tested here |
|---|---|---|---|---|---|
| **1** (close call) | #1 Permits (Austin) | Commercial HVAC/electrical supplier -> a daily or weekly digest of (a) new commercial building projects and (b) the mechanical/electrical contractors pulling permits, de-duplicated, with scope, contractor details as recorded and source links | **2-3.** Category proven by others: Construction Monitor sells Austin permits at $500/mo, about 1,500 subscribers, about MUSD 6 forecast turnover (2023-11-07, acquirer's release) [R]; Shovels $5M seed (2025-06) [R]. Supplier-specific: BuildMapper (British Columbia) says 135+ paying customers, $480K ARR (company-supplied, undated) [R]. **No named Austin supplier customer found** | 4 / 3 / 5 / 1-2 | **[T] the owner's 100-row sample analysed** (13 of 13 figures in its own summary re-computed). Live API not re-pulled (sandbox has no access) |
| **2** | #3 Hiring signals | Boutique tech recruiters, one metro -> weekly open-requisition watchlist | **3.** Signalbase Pro EUR 99/mo; TheirStack $59/mo plus a free tier; PredictLeads G2 4.8 (35 reviews, 2026-03) [R]. None for this buyer | 3 / 3 / 4 / 2 | [T] 0 of 6 hosts reachable |
| 3 | #4 Multi-location audits | Agency with 5-30 dental sites -> weekly booking-path report | **2.** Category pays (Yext FY26 revenue $446.6M, ARR -1%; Synup $79/mo) [R]. No vendor found testing booking links | 3 / 3 / 4 / 2 | [T] none |
| 4 | #2 Utility API | Amber's Business Risk API -> JSON screening | **1-2.** Amber's APIs: 0 customers, calls unmeasured, 0 marketplaces approved [P]. No revenue evidence for marketplace, MCP or x402 listings [R] | 3 / 2 / 4 / 2 | [T] offline code run of the real code |
| 5 | #5 Weather monitoring | Property manager, 6-40 buildings -> per-site NWS alert relay | **2.** iAlert $5.75/site/month, 5-site cap [R]; no dated proof small businesses pay | 2-3 / 2 / 4 / 2 | [T] none |

## What the owner's sample shows [T on the sample as pasted; the pull itself is [R], collected 2026-10-12 from the City's Socrata API]

I transcribed the two tables of the report into a private file and recomputed every figure the report states: **13 of 13 agree** (50 rows, 48 distinct address strings, 13 master
ids, 46 New / 2 Shell / 2 Addition and Remodel, 15 mechanical / 23 electrical / 12 without contractor, 39 with master ids, 2 Final, issue dates 2026-09-15 to 2026-10-11). The report's
population counts (345 commercial building permits issued 09-12 to 10-12; valuation present on 124, 35.9%; company on 316; phone on 344) could not be recomputed here. Row-level data
stays out of this public repository; the profile script and its aggregate output are in `tests/austin-permits/`.

**Confirmed, and it reverses my first claim**
- **Contractor contact fields are real.** Company and phone are recorded on 50 of 50 building permits and on 38 of 50 trade permits. Every one of the 12 trade permits without a contractor is a
  **sign permit**. Phone values in a valid 10-digit shape: 49 of 50 building permits and 33 of 38 trade permits. Nobody has called them, so "reachable" is unproven.
- **Source links and dates are present** on every row, and the newest row was issued the day before extraction.

**Problems the sample exposes**
- **Volume is thin.** The 50 building permits are only **13 independent projects** (13 master ids), about **3.4 a week** over the 3.9-week span. One apartment complex accounts for **35 of the 50 rows (70%)**.
  The report also notes that only 35.9% of commercial building permits carry a valuation at all, so the ">$100,000" filter drops at least 64% of them (every permit with no valuation) before it applies the threshold.
- **Valuation is unreliable at row level.** 37 of 50 rows carry exactly $1,000,000. 29 rows describe small site structures (trash enclosures, carports, detached garages, a dumpster enclosure, retaining
  walls) and 28 of those are valued at $1,000,000 or more. Permits that share a master id repeat the same valuation (4 of 4 multi-permit projects), so adding rows **overstates value 2.13 times**
  ($196.5M counting rows against $92.1M counting each master id once).
- **Out-of-area and malformed contacts.** 5 of the 13 projects' contractors have non-Austin area codes; one phone value is just "512"; five trade-permit phone values have 12 digits; one name carries
  stray asterisks and one has words run together.
- **Trade permits do not line up with the new building permits.** The two samples share **0** master ids; the report's lookup found one linked electrical record, issued five months before its building permit.
  The wedge I had suggested (mechanical and electrical permits grouped under their parent project) is **not visible in this data**.
- **Many trade permits are not what a distributor sells to.** 17 of 50 are sign permits (34%); 5 of 15 mechanical permits are change-outs where the replacement equipment may already be ordered; 8 are
  interior remodels; trade permits carry no `total_job_valuation` (15 of 50 do carry an `electrical_valuation_remodel`, 7 of them at $100,000 or more, and four sibling permits at one address repeat the same $1.6M).
- **What is useful:** 27 distinct mechanical and electrical contractors appeared on 38 contractor-linked trade permits in four issue days (26 on non-sign permits), with the scope text and a permit link. Four
  companies pulled 2 to 5 permits each. EV-charging installations, a hospital generator and switchboard project, a self-storage building and apartment shells are visible in the building list.

**Reading [E]:** a de-duplicated, scope-filtered digest is feasible and cheap to produce. It would carry about 3 to 4 large new projects a week and about 25 trade contractors a week. That is a modest
product for an Austin-only buyer set of about 8 supplier brands, which at an assumed $99 to $149 a month is a ceiling of roughly $0.8k to $1.2k a month. Whether anyone pays is the open question.

## Strongest recommendation: #1, as a test and not a build

- **Why it ranks first.** (a) A direct, priced, dated market exists for near-identical products (Construction Monitor, ConstructConnect, Shovels) [R]. (b) Dates, permit numbers and links come from an official
  feed, so producing a row needs no judgment [T on the sample]. (c) Data costs $0 and needs no model calls [E]. (d) The contact fields exist and the owner already has a real pull [T on the sample].
- **What it still has to prove.** (a) *Contactability:* the phones are recorded, not verified. (b) *Timing:* the owner's report says it plainly: trade selection can predate the building permit, and neither record
  proves that materials are still being bought. (c) *Supplier demand:* no dated evidence yet that suppliers pay; the owner's report notes that ConstructConnect and Building Radar already advertise daily updates and
  trade matching, so freshness alone is not a differentiator [R]. (d) *Price and owner time:* the owner's report calls $99 a month and under 30 minutes of owner time hypotheses, and so do I.
- **Why not simply build it.** The edge is price and packaging (Apify already sells raw Austin records from $0.10 per 1,000 rows [R]); the City's licence label and its terms disagree, so paid reuse needs a written read first
  [R]; and no free channel to supplier buyers has been established yet.

## Runner-up: #3, hiring signals

Same shape (public feeds -> weekly report with source links) and the same proven Amber plumbing [P] (scheduled public-source ingestion, quote-checked links,
email delivery). It has no Austin licence question, and keyless Greenhouse and Lever endpoints exist (Lever's README says "These jobs may be scraped by third
parties") [R]. It ranks second because the "dated" evidence is weaker than it sounds (Greenhouse `updated_at` is the last edit; Lever documents no date, so
first-seen dates need a 4-8 week archive) [R], TheirStack's free tier is the real rival [R], and no channel to boutique recruiters was found.

## Why the other three are rejected for now

- **#4 Audits (third).** Needs browser rendering that production lacks (reports use pdfkit, no browser) [P]; the incumbents are large [R]; the wedge (does the
  booking link work) is untested. Amber's existing audit product (Website Snapshot, $49) has 0 orders but was never really offered (0 of 57 reviewed prospect
  drafts sent, live payments off) [P]. That zero is a reach gap, not a demand test.
- **#2 API (fourth).** Zero customers and zero measured calls on any Amber API [P]. An offline run of the real code [T] found a Statute API that scores a
  near-empty questionnaire 100 and counts HTTP 404 pages as findings, and a Business Risk API that fails to match "Societe Generale" with an accent or
  "Wagner" with "WAGNER GROUP". A false "clear" in a screening product is the failure that matters. The Delaware premise also needs correcting (HB 380 takes
  effect 2027-01-01; HB 381 is reported to be a breach-notification amendment; thresholds conflict across sources) [R]. *Smallest proof that would change
  this:* one paid, authenticated, metered call.
- **#5 Weather (fifth).** Reliability is the product, and the dependencies fail it: NWS has no SLA and delayed alerts 20+ minutes on 2026-08-11 while Weather
  Radio kept working [R, re-checked]; most watches are zone-based and cannot say "at this address" [R]; Amber's own services restart on every merge (eight in
  24 hours) and the web service sits near its memory limit [P]; a missed alert becomes Amber's liability.

## Buyer niche check: commercial HVAC/electrical suppliers versus pool service

One research pass on 2026-10-13 (search summaries only, no page opened), a read of the dataset's column list and the City's terms, and now the owner's sample.

**How the switch happened, stated plainly.** I asked a research agent to name "one specific buyer" and told it that the sample "contains duplicate-project
risks, missing valuations and trade-contact limitations". It chose a buyer who needs none of those fields. I then copied that choice into the
recommendation without checking it against your original target or against the sample. The choice was driven by the weaknesses of the wrong sample.

| | Commercial HVAC/electrical suppliers (your target) | Pool-service owners (my first-pass choice) |
|---|---|---|
| Paying-demand evidence | Vendors court suppliers: Construction Monitor markets to suppliers and a 2024-10-07 post says HVAC and lumber suppliers use permits; Shovels names material suppliers among its customers; ConstructConnect has a suppliers section [R]. Only quantified supplier signal: BuildMapper (British Columbia), "over 135 paying customers" and "$480K ARR" (company-supplied, undated), about $300/mo each (derived), "expanding soon to Texas" [R]. **No named Austin supplier customer, dated case study or review count found** | Construction Monitor sells a pool-permit product at $250/mo; Apify sells new-pool leads from about $30 [R]. No pool-service buyer evidence was ever gathered |
| Price anchors | ConstructConnect $117-$199 per seat; Construction Monitor $250-$500; Zabalist $19-$99 [R] | $30-$250 a month [R] |
| Contact data the buyer needs | Contractor company and phone are recorded on 50 of 50 building and 38 of 50 trade permits in your sample [T on the sample]; not verified by calling | Homeowner contact: not in the dataset [R] |
| How many buyers | About 8 brands and 13 Austin-area branches confirmed (Johnstone, Ferguson HVAC, Graybar, Rexel, Wesco, City Electric Supply, Lonestar Electric Supply, Century HVAC) [R]. At $99 to $149 a month each that is a ceiling near $0.8k to $1.2k a month [E] | Not researched |
| Reach without ads or outreach | Poor: associations are paid (HARDI associate tier $5,500) or unconfirmed [R] | Not researched |
| Can your sample test it? | Yes, and it was tested (above) | No: it holds commercial building and trade permits, no residential pools |

**Conclusion [E].** Suppliers are the better-fitting hypothesis: the contractor contact fields exist in your sample, the price anchors are higher, and it was your target. It is
**not a demonstrated better market**: pool demand is equally unproven, and no source shows an Austin supplier paying for a weekly permit list while Construction Monitor,
ConstructConnect, Dodge, Zabalist and (entering Texas) BuildMapper already exist. Two consequences. First, an Austin-only supplier list has a small ceiling, so it is a *test of whether suppliers pay at
all*, not yet a business; a business would need more cities (each needs a column map and a terms check, about a day [E]) or a second buyer type such as contractors. Second, the pool-service idea is not
rejected, only unsupported; the reason I gave for choosing it was wrong.

**Differentiators.** Not differentiators: contractor phone (Shovels and BuildZoom carry contractor profiles), source links, daily or weekly cadence (Construction Monitor is weekly; ConstructConnect and Building
Radar advertise daily), price (Zabalist lists $19-$99), "AI-run". Possibly useful: removing the noise the sample shows (signs, placeholder valuations, repeated sibling permits, change-outs) and saying plainly what is
unknown. That is a quality claim a branch manager can check against the permit links; it is not proof of demand.

## The smallest buyer-validation test (no spend, no build, nothing sent by Amber)

1. **Done:** the sample arrived and was analysed (above).
2. **Me (about one hour, no network needed):** build **one real sample digest from your sample**, labelled as a sample, in two parts: (a) the 13 independent building projects, de-duplicated by master id, with
   scope text, the general contractor and phone as recorded, and the permit link, flagged where the valuation looks like a placeholder; (b) the 33 non-sign trade permits grouped by contractor (26 companies), with
   scope, square footage where the record has it, any trade valuation, and the permit link. No numbers added that the record does not hold.
3. **Owner (about one to two hours):** show it, in person or by your own message, to **five** supplier contacts you already know (the whole Austin market is only about eight brands and thirteen branches [R]). Ask what
   your report suggests: which of these projects would they pursue, does an alert on the day of issue come before they buy, which fields are missing, and **would they pay $99 a month** for it every week. Amber
   sends nothing.
4. **Pass [E]:** at least 3 of 5 name at least one project or contractor they would phone this week, at least 2 accept a free four-week pilot delivered by hand and name the decision-maker, and at least 1 names $99 a
   month or more. **A positive reply alone is interest; a paid engagement is stronger evidence,** and revenue counts only once a payment is verified. **Stop:** fewer than 2 interested, or all say an incumbent tool already
   covers it. Then run the same test on #3, or stop. If you cannot name five reachable buyers, that is the finding.
5. **Before any charge:** get the City's written reuse terms and settle the compliance questions below. Do not promise exclusivity, available contracts or verified phone reachability.

**Compliance flags for a list that carries contractor phone numbers (summary, not legal advice) [R].** The City's terms say the data are "offered free and without restriction" and "should not include
controls over its end use", ask for credit to the City and the department, but also say "The City may require the termination of any and all displays, distribution, or other use ... for any reason" and
create no enforceable right (read directly from another team's quotation of the City page; that team put paid reuse on HOLD). Texas rules on data brokers (Bus. & Com. Code ch. 509; "personal data" excludes
publicly available government-record information, so a list drawn only from City records plausibly fits the carve-out, enrichment from other sources may not), telephone solicitation and texting (ch. 302,
SB 140), the TCPA and CAN-SPAM mostly attach to whoever calls, texts or emails, so they bind the supplier more than the list publisher, but a publisher that adds email or text features takes them on.
**Smallest safe design:** company-named contractors only; phone shown only where the record has a company name, labelled "as published by the City"; no person-only rows, no email or mobile enrichment,
no texting or dialer features; attribution to the City and the department, an "informational use" disclaimer and the pull date; a removal-request page; a kill switch if the City withdraws permission.

## What only the owner can do

- Run the conversations in step 3 (Amber never sends cold outreach, and this assessment did not authorise any). Say if your research names suppliers and how you would reach them.
- Optional: add `data.austintexas.gov`, `boards-api.greenhouse.io`, `api.lever.co` and `api.weather.gov` to the cloud environment's allowed domains so a live re-pull and the other tests can run (about 40
  requests, $0). Every live test here failed on network policy, not on the services.
- Confirm the City's reuse terms before charging.

## Files

- `OPPORTUNITIES.md`: one sheet per opportunity (buyer, competitors with dated evidence, sources and reuse limits, Amber components, costs, reach, risks).
- `AMBER-PRODUCTION-REALITY.md`: what Amber actually runs, autonomous versus Claude-built, registered versus active.
- `CAPABILITY-TESTS.md`: every test, what was blocked and why, the fixture and owner-sample numbers, the offline API findings.
- `tests/austin-permits/`: `analyze_owner_sample.py` and its aggregate output `results/owner_sample_profile_2026-10-13.txt` (counts only; its input file holds contractor names and phones and is kept out of this repository),
  `analyze_sample_html.py` (for an HTML export; self-test on an invented page), `analyze_permits.py` (for Socrata JSON), `fetch_sample.sh` (never run live), and the fixture results.

## Limits of this evidence

- No web page could be opened; every competitor and price fact comes from a search summary [R]. Prices are snapshots, review counts are weak proof of paying
  customers, and legal points are summaries, not legal advice.
- The owner's sample is a selected, non-random pull (most recent by issue date, filtered on valuation) collected by another tool; I could not re-pull it, and I transcribed its two summary tables rather than reading
  its raw JSON line by line (the raw records were used only to confirm field names, statuses and the trade-valuation fields). Weekly rates come from one 26-day window. No phone has been called.
- No live Greenhouse, Lever or NWS data was collected [T: 0 of 6 hosts reachable].
- Cost, support and owner-time figures are [E] unless marked otherwise. The only measured numbers are Amber's own production counters [P], which are not independent.
