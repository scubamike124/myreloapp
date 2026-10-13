# Five opportunities for Amber: the decision (corrected 2026-10-13)

> **Correction notice (2026-10-13, after the owner's review).** Two things in the first version were wrong or unverified.
>
> 1. **The Austin numbers came from the wrong data.** They were computed on a 20-row third-party fixture, not on the owner's sample
>    (about 50 commercial building permits above $100,000 and 50 mechanical/electrical permits, with recorded contractor details
>    including phone numbers, and source links). The fixture's "no phone, email, licence or owner column" finding described that
>    fixture's filter, not the dataset and not the owner's sample, and is **withdrawn**. The owner's file
>    (`Austin-Permit-Sample-2026-10-12.html`) had not reached this session when this was written; nothing here has been run on it.
> 2. **The pool-service buyer was a method error.** The research pass chose pool-service owners because the fixture's contact and
>    valuation fields were weak, not because there was evidence about pool-service buyers. The owner's original target was
>    **commercial HVAC and electrical suppliers**. Pool service is now an *untested alternative*. The supplier niche is being
>    verified (section "Buyer niche check").
>
> Evidence labels: **[P]** production observation (Amber's own reports and counters), **[T]** tested in this sandbox by me or an agent,
> **[E]** estimate or assumption, **[R]** reported by a third-party source and not independently verified.
>
> What the production audit shows and does not show: customer acquisition and delivery are **unproven**. It does not show that the
> businesses cannot sell. Amber has never offered a paid report to a real buyer, so there has been no real test either way.

Assessment of 2026-10-12/13. Research, read-only inspection and small tests only. **Nothing was built, spent, sent or launched.**
The deploy sequence was not touched. This is an evaluation, not authorization to start a business.

## The answer in four lines

1. **None of the five is ready to build.** None has a buyer who has said yes, and Amber has never delivered a paid report to a real buyer [P].
2. **Strongest candidate to test first: #1, Austin construction-permit intelligence, provisionally for commercial HVAC/electrical
   suppliers (the owner's own target).** Runner-up: #3, hiring signals. The ranking of #1 depends on the owner's sample, which I have not yet seen.
3. **Reject for now:** #4 multi-location audits (third), #2 the utility API (fourth), #5 weather monitoring (fifth).
4. **The binding constraint is reach, not product.** All five score 2 of 5 [E] on reaching buyers without paid ads or cold outreach, and
   Amber's production record is $0 revenue and no customers or replies after 66 days [P]. The next step is a conversation test, not a build.

## Comparison table

Scores are 1 (worst) to 5 (best) and are my judgments [E] from the evidence in this folder. Order of criteria, as asked: demand evidence,
owner time, delivery reliability, cost, reach.

| Rank | Opportunity | One buyer -> deliverable | Paying-demand evidence (dated) | Owner time / delivery / cost / reach [E] | Tested here |
|---|---|---|---|---|---|
| **1** (provisional) | #1 Permits (Austin) | Commercial HVAC/electrical supplier -> weekly list of new commercial projects and the mechanical/electrical contractors pulling permits on them, with source links. *Provisional: under verification* | **3.** Construction Monitor sells Austin permits at $500/mo (pool permits $250/mo), about 1,500 subscribers, about MUSD 6 forecast turnover (2023-11-07, acquirer's release) [R]; ConstructConnect $129-$199/mo [R]; Shovels $5M seed (2025-06) [R]. No dated evidence yet for *supplier* customers | 4 / 3 / 5 / 2 | **[T] nothing on the owner's sample yet.** The 20-row fixture shows only that duplicates and missing valuations exist in some filters |
| **2** | #3 Hiring signals | Boutique tech recruiters, one metro -> weekly open-requisition watchlist | **3.** Signalbase Pro EUR 99/mo; TheirStack $59/mo plus a free tier; PredictLeads G2 4.8 (35 reviews, 2026-03) [R]. None for this buyer | 3 / 3 / 4 / 2 | [T] 0 of 6 hosts reachable |
| 3 | #4 Multi-location audits | Agency with 5-30 dental sites -> weekly booking-path report | **2.** Category pays (Yext FY26 revenue $446.6M, ARR -1%; Synup $79/mo) [R]. No vendor found testing booking links | 3 / 3 / 4 / 2 | [T] none |
| 4 | #2 Utility API | Amber's Business Risk API -> JSON screening | **1-2.** Amber's APIs: 0 customers, calls unmeasured, 0 marketplaces approved [P]. No revenue evidence for marketplace, MCP or x402 listings [R] | 3 / 2 / 4 / 2 | [T] offline code run of the real code |
| 5 | #5 Weather monitoring | Property manager, 6-40 buildings -> per-site NWS alert relay | **2.** iAlert $5.75/site/month, 5-site cap [R]; no dated proof small businesses pay | 2-3 / 2 / 4 / 2 | [T] none |

## Strongest recommendation: #1, as a test and not a build

- **Why it ranks first.** (a) A direct, priced, dated market exists for near-identical products (Construction Monitor, ConstructConnect, Shovels) [R].
  (b) Issue dates and permit numbers come from an official feed, so producing a row needs no judgment [R]. (c) Data costs $0 and needs no model
  calls [E]. (d) Real data already exists on the owner's side (owner-reported; not yet seen by me).
- **What it still has to prove.** (a) *Contactability:* the owner reports contractor phone numbers in the sample; I have not seen them, so I make no claim
  either way. (b) *Duplicates:* a building permit and its trade permits are one project, and `project_id` was one-per-permit in the only rows I tested
  [T, 20-row fixture]; the sample's own rollup rate is unknown. (c) *Valuation:* the "above $100,000" filter selects on valuation, so building permits in the
  sample have one by construction; trade permits often do not [E]. (d) *Supplier demand:* no dated evidence yet that suppliers (as opposed to contractors) pay.
- **Why not simply build it.** The edge is price and packaging (Apify already sells raw Austin records from $0.10 per 1,000 rows [R]); the City's licence
  label and its terms disagree, so paid reuse needs a written read first [R]; and no free channel to supplier buyers has been established yet.

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

## Buyer niche check (commercial HVAC/electrical suppliers vs pool service)

*Status: in progress. Two bounded research passes (supplier demand and competitors; dataset fields, legal flags and free reach) are running, and the owner's
sample has not arrived. This section will be completed in this file, with each claim labelled.*

How the switch happened, stated plainly: I asked a research agent to name "one specific buyer" and told it that the sample "contains duplicate-project
risks, missing valuations and trade-contact limitations". It chose a buyer who needs none of those fields. I then copied that choice into the recommendation
without checking it against your original target or against the sample. The choice was driven by the weaknesses of the wrong sample.

## The smallest buyer-validation test (no spend, no build, nothing sent by Amber)

1. **Owner (5 minutes):** transfer `Austin-Permit-Sample-2026-10-12.html` to the session. If your research names the suppliers you intended to approach and how
   you would reach them (your own contacts only), include that.
2. **Me (about one hour, no network needed):** run `tests/austin-permits/analyze_sample_html.py` on it and report [T]: rows -> projects; the share of rows
   with a contractor phone, a source link and a known valuation; how many trade permits attach to a listed commercial project (the supplier signal); distinct
   contractors; duplicate risk. **Pass thresholds are assumptions [E]:** at least 90% of rows with a source link and issue date, at least 70% of trade permits
   with a contractor phone, and at least 30 distinct mechanical/electrical contractors. **Fail:** change the segment or drop it.
3. **Me:** produce one real sample list from your file, labelled as a sample, with no personal data beyond what the permit record itself publishes.
4. **Owner (about two hours), only if step 2 passes:** show it, in person or by your own message, to ten supplier contacts you can reach yourself (branch or
   outside-sales managers at HVAC or electrical distributors) and ask: "Would you pay $X a month for this every week? What is missing?" Set X from the
   anchors, for example $149 [E] against ConstructConnect $129-$199 and Construction Monitor Austin $500 [R]. Amber sends nothing.
5. **Pass:** at least 3 of 10 say yes **and** at least 1 pays or signs a written pre-commitment (revenue counts only once payment is verified). **Stop:** 0 or 1
   yes. Then run the same test on #3, or stop. If you cannot name ten reachable buyers, that is the finding.
6. **Before any charge:** get the City's written reuse terms, and settle the compliance questions that arise once a list carries contractor phone numbers.

## What only the owner can do

- Transfer the sample file to the session (step 1).
- Run the conversations in step 4 (Amber never sends cold outreach, and this assessment did not authorise any).
- Optional: add `data.austintexas.gov`, `boards-api.greenhouse.io`, `api.lever.co` and `api.weather.gov` to the cloud environment's allowed domains so the
  live tests can run (about 40 requests, $0). Every live test here failed on network policy, not on the services.
- Confirm the City's reuse terms before charging.

## Files

- `OPPORTUNITIES.md`: one sheet per opportunity (buyer, competitors with dated evidence, sources and reuse limits, Amber components, costs, reach, risks).
- `AMBER-PRODUCTION-REALITY.md`: what Amber actually runs, autonomous versus Claude-built, registered versus active.
- `CAPABILITY-TESTS.md`: every test, what was blocked and why, the fixture numbers, the offline API findings.
- `tests/austin-permits/`: `analyze_sample_html.py` (for the owner's HTML report; stdlib only, no network; its self-test uses an invented page),
  `analyze_permits.py` (for Socrata JSON), `fetch_sample.sh` (never run live), and the fixture results.

## Limits of this evidence

- No web page could be opened; every competitor and price fact comes from a search summary [R]. Prices are snapshots, review counts are weak proof of paying
  customers, and legal points are summaries, not legal advice.
- No live Austin, Greenhouse, Lever or NWS data was collected [T: 0 of 6 hosts reachable]. The owner's sample has not been analysed.
- Cost, support and owner-time figures are [E] unless marked otherwise. The only measured numbers are Amber's own production counters [P], which are not
  independent.
