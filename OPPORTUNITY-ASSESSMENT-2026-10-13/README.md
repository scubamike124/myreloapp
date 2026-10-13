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
2. **Strongest candidate to test first: #1, Austin construction-permit intelligence, for commercial HVAC/electrical suppliers (the owner's
   own target).** Runner-up: #3, hiring signals. It is a close call, decided mainly by what can be tested now and by cost and owner time, not
   by proof of demand. The ranking of #1 depends on the owner's sample, which I have not yet seen.
3. **Reject for now:** #4 multi-location audits (third), #2 the utility API (fourth), #5 weather monitoring (fifth).
4. **The binding constraint is reach, not product.** All five score 2 of 5 [E] on reaching buyers without paid ads or cold outreach, and
   Amber's production record is $0 revenue and no customers or replies after 66 days [P]. The next step is a conversation test, not a build.

## Comparison table

Scores are 1 (worst) to 5 (best) and are my judgments [E] from the evidence in this folder. Order of criteria, as asked: demand evidence,
owner time, delivery reliability, cost, reach.

| Rank | Opportunity | One buyer -> deliverable | Paying-demand evidence (dated) | Owner time / delivery / cost / reach [E] | Tested here |
|---|---|---|---|---|---|
| **1** (close call) | #1 Permits (Austin) | Commercial HVAC/electrical supplier -> weekly list of new commercial projects and the mechanical/electrical contractors pulling permits on them, with source links | **2-3.** Category proven by others: Construction Monitor sells Austin permits at $500/mo, about 1,500 subscribers, about MUSD 6 forecast turnover (2023-11-07, acquirer's release) [R]; Shovels $5M seed (2025-06) [R]. Supplier-specific: BuildMapper (British Columbia) says 135+ paying customers, $480K ARR (company-supplied, undated) [R]. **No named Austin supplier customer found** | 4 / 3 / 5 / 1-2 | **[T] nothing on the owner's sample yet.** The 20-row fixture shows only that duplicates and missing valuations exist in some filters |
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

## Buyer niche check: commercial HVAC/electrical suppliers versus pool service

One research pass on 2026-10-13 (search summaries only, no page opened), plus a read of the dataset's column list and the City's terms.

**How the switch happened, stated plainly.** I asked a research agent to name "one specific buyer" and told it that the sample "contains duplicate-project
risks, missing valuations and trade-contact limitations". It chose a buyer who needs none of those fields. I then copied that choice into the
recommendation without checking it against your original target or against the sample. The choice was driven by the weaknesses of the wrong sample.

| | Commercial HVAC/electrical suppliers (your target) | Pool-service owners (my first-pass choice) |
|---|---|---|
| Paying-demand evidence | Vendors court suppliers: Construction Monitor markets to suppliers and a 2024-10-07 post says HVAC and lumber suppliers use permits; Shovels names material suppliers among its customers; ConstructConnect has a suppliers section [R]. Only quantified supplier signal: BuildMapper (British Columbia), "over 135 paying customers" and "$480K ARR" (company-supplied, undated), about $300/mo each (derived), "expanding soon to Texas" [R]. **No named Austin supplier customer, dated case study or review count found** | Construction Monitor sells a pool-permit product at $250/mo; Apify sells new-pool leads from about $30 [R]. No pool-service buyer evidence was ever gathered |
| Price anchors | ConstructConnect $117-$199 per seat; Construction Monitor $250-$500; Zabalist $19-$99 [R] | $30-$250 a month [R] |
| Contact data the buyer needs | Contractor company, name and phone are columns in the dataset (City CSV header, via search summary) [R]; fill rate unknown | Homeowner contact: not in the dataset [R] |
| How many buyers | About 8 brands and 13 Austin-area branches confirmed (Johnstone, Ferguson HVAC, Graybar, Rexel, Wesco, City Electric Supply, Lonestar Electric Supply, Century HVAC) [R]. At $149 a month each that is a ceiling near $1,190 a month [E] | Not researched |
| Reach without ads or outreach | Poor: associations are paid (HARDI associate tier $5,500) or unconfirmed [R] | Not researched |
| Can your sample test it? | Yes: it holds the two lists a supplier would use | No: it holds commercial building and trade permits, no residential pools |

**Conclusion [E].** Suppliers are the better-fitting hypothesis: the contractor contact fields exist in the dataset, the price anchors are higher, and it was your target. It is
**not a demonstrated better market**: pool demand is equally unproven, and no source shows an Austin supplier paying for a weekly permit list while Construction Monitor,
ConstructConnect, Dodge, Zabalist and (entering Texas) BuildMapper already exist. Two consequences. First, an Austin-only supplier list has a small ceiling (about $1.2k a month
at the assumed price), so it is a *test of whether suppliers pay at all*, not yet a business; a business would need more cities (each needs a column map and a terms check, about
a day [E]) or a second buyer type such as contractors. Second, the pool-service idea is not rejected, only unsupported; the reason I gave for choosing it was wrong.

**Wedges that might matter, and ones that do not.** Possible: mechanical and electrical permits grouped under their parent commercial project (no competitor claims it, but the
dataset's project key is unconfirmed) and a branch-territory weekly sheet. Not differentiators: contractor phone (Shovels and BuildZoom carry contractor profiles), source links, weekly cadence
(Construction Monitor is weekly), price (Zabalist lists $19-$99), "AI-run".

## The smallest buyer-validation test (no spend, no build, nothing sent by Amber)

1. **Owner (5 minutes):** transfer `Austin-Permit-Sample-2026-10-12.html` to the session. If your research names the suppliers you meant to approach and how you would
   reach them (your own contacts only), include that.
2. **Me (about one hour, no network needed):** run `tests/austin-permits/analyze_sample_html.py` on it and report [T]: rows -> projects; the share of rows with a
   contractor phone, a source link and a known valuation; how many trade permits attach to a listed commercial project (the supplier signal); distinct contractors;
   duplicate risk; and the weekly rate implied by the sample's date span. **Pass thresholds are assumptions [E]:** a median of at least 15 qualifying commercial
   projects a week, at least 70% of trade permits with a contractor phone, at least 50% attached to a parent project, newest row no older than 7 days. **Fail:** change
   the segment or drop it. (The same counts over 12 weeks of the live dataset would settle it better and need network access.)
3. **Me:** produce one real sample list from your file, labelled as a sample, showing only what the permit record itself publishes (company-named contractors, phone as published, permit link).
4. **Owner (about one to two hours), only if step 2 passes:** show it, in person or by your own message, to **five** supplier contacts you already know (the whole Austin market is only
   about eight brands and thirteen branches [R]). Ask: "Would you phone at least three of these contractors a week? Would you take a free four-week pilot, delivered by hand? What would
   you pay?" Amber sends nothing.
5. **Pass [E]:** at least 3 of 5 say they would phone at least 3 listed contractors a week, at least 2 accept the pilot and name the decision-maker, and at least 1 names $99 a month or more.
   **Stop:** fewer than 2 interested, or all say an incumbent tool already covers it. Then run the same test on #3, or stop. If you cannot name five reachable buyers, that is the finding.
   Revenue counts only once a payment is verified.
6. **Before any charge:** get the City's written reuse terms and settle the compliance questions below.

**Compliance flags for a list that carries contractor phone numbers (summary, not legal advice) [R].** The City's terms say the data are "offered free and without restriction" and "should not include
controls over its end use", ask for credit to the City and the department, but also say "The City may require the termination of any and all displays, distribution, or other use ... for any reason" and
create no enforceable right (read directly from another team's quotation of the City page; that team put paid reuse on HOLD). Texas rules on data brokers (Bus. & Com. Code ch. 509; "personal data" excludes
publicly available government-record information, so a list drawn only from City records plausibly fits the carve-out, enrichment from other sources may not), telephone solicitation and texting (ch. 302,
SB 140), the TCPA and CAN-SPAM mostly attach to whoever calls, texts or emails, so they bind the supplier more than the list publisher, but a publisher that adds email or text features takes them on.
**Smallest safe design:** company-named contractors only; phone shown only where the record has a company name, labelled "as published by the City"; no person-only rows, no email or mobile enrichment,
no texting or dialer features; attribution to the City and the department, an "informational use" disclaimer and the pull date; a removal-request page; a kill switch if the City withdraws permission.

## What only the owner can do

- Transfer the sample file to the session (step 1), plus your supplier research if it names suppliers and how to reach them.
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
