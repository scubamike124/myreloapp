# Five opportunities for Amber: the decision

Assessment of 2026-10-12/13. Research, read-only inspection and small tests only. **Nothing was built, spent, sent or launched.**
The deploy sequence was not touched.

## The answer in four lines

1. **None of the five is ready to build.** None has a buyer who has said yes, and Amber has never delivered a paid report to a real buyer.
2. **Strongest candidate to test first: #1, Austin construction-permit intelligence, narrowed to one trade.** Runner-up: #3, hiring signals.
3. **Reject for now:** #4 multi-location audits (third), #2 the utility API (fourth), #5 weather monitoring (fifth).
4. **The binding constraint is reach, not product.** All five score 2 of 5 on reaching buyers without paid ads or cold outreach, and Amber's
   production record is 0 customers, 0 replies, $0 after 66 days. The next step is a conversation test, not a build.

## Comparison table

Scores are 1 (worst) to 5 (best) and are my judgments from the evidence in this folder, not measurements. Order of criteria, as asked:
demand evidence, owner time, delivery reliability, cost, reach.

| Rank | Opportunity | One buyer -> deliverable | Paying-demand evidence (dated) | Owner time | Reliability | Cost | Reach | Tested here |
|---|---|---|---|---|---|---|---|---|
| **1** | #1 Permits (Austin) | Pool-service owner (1-10 techs) -> Monday list of new pool projects, one row per project, no contact data | **3.** Construction Monitor sells Austin permits at $500/mo and pool permits at $250/mo, about 1,500 subscribers, about MUSD 6 forecast turnover (2023-11-07, acquirer's release); Shovels $5M seed (2025-06). None for the pool-service buyer | 4 (about 1 h/week at 20 subscribers, assumed) | 3 (official daily feed, "informational only") | 5 ($0 data, no model calls) | 2 | 20-row third-party fixture only |
| **2** | #3 Hiring signals | Boutique tech recruiters, one metro -> weekly Open-Req Watchlist, a primary link on every row | **3.** Signalbase Pro EUR 99/mo; TheirStack $59/mo with a free 200-credit tier; PredictLeads G2 4.8 (35 reviews, 2026-03). None for this buyer | 3 | 3 (but "dated" is not what the feeds give: Greenhouse `updated_at` is the last edit; Lever documents no date) | 4 | 2 | 0 of 6 hosts reachable |
| 3 | #4 Multi-location audits | Agency running 5-30 dental sites -> weekly Booking Path Report with screenshot and timestamp per finding | **2.** Category pays (Yext FY26 revenue $446.6M, ARR -1%; Synup $79/mo). No vendor found testing booking URLs (absence is not proof) | 3 | 3 (third-party widgets, bot walls) | 4 | 2 | 0 |
| 4 | #2 Utility API | Existing Business Risk Intelligence API -> JSON + PDF screening | **1-2.** Amber's APIs: 0 customers, calls unmeasured, 0 marketplaces approved. Category prices exist (OpenSanctions EUR 0.10/query); no revenue evidence for marketplace, MCP or x402 listings | 3 | 2 as built (offline run found recall gaps and scoring bugs) | 4 | 2 | Offline code run only |
| 5 | #5 Weather monitoring | Property manager with 6-40 buildings -> per-site NWS alert relay | **2.** iAlert $5.75/mo per site (5-site cap, free tier); no dated proof small businesses pay | 2-3 (24/7 duty) | 2 (no SLA; NWS outage 2026-08-11 delayed alerts 20+ minutes) | 4 | 2 | 0 of 2 hosts reachable |

## Strongest recommendation: #1, as a test and not a build

- **Why it ranks first.** It is the only option with a direct, priced, dated market for a near-identical deliverable (Construction Monitor,
  Shovels). The dates and ids come from an official feed, so no judgment is needed to produce a row. It costs $0 in data and nothing in
  model calls. And real data already exists on the owner's side ("we already pulled real Austin data").
- **What it is not.** In the only rows seen, there is no phone, email, licence or owner column. This is a permit-derived *project list*
  that suits downstream trades and suppliers, not a contactable lead list. Twenty rows collapsed to 14 projects and 19 of 20 had no
  usable valuation, so not every permit is a lead.
- **Why not simply build it.** The edge is price and packaging only (Apify already sells raw Austin records from $0.10 per 1,000 rows);
  the City's licence label and its terms disagree, so paid reuse needs a written read first; and no free channel to pool-service owners
  was found.

## Runner-up: #3, hiring signals

Same shape (public feeds -> weekly report with source links) and the same proven Amber plumbing (scheduled public-source ingestion,
quote-checked links, email delivery). It has no Austin licence question, and keyless Greenhouse and Lever endpoints exist (Lever's README
says "These jobs may be scraped by third parties"). It ranks second because the "dated" evidence is weaker than it sounds (first-seen dates need a 4-8
week archive), TheirStack's free tier is the real rival, and no channel to boutique recruiters was found.

## Why the other three are rejected for now

- **#4 Audits (third).** Needs browser rendering that production lacks (reports use pdfkit, no browser); the incumbents are large; the
  wedge (does the booking link work) is untested; and Amber's existing audit product (Website Snapshot, $49) has 0 orders but was never
  really offered (0 of 57 reviewed prospect drafts sent, live payments off). That zero is a reach gap the new product would inherit,
  not a demand test.
- **#2 API (fourth).** Zero customers and zero measured calls on any Amber API. The offline run found a Statute API that scores a near-empty
  questionnaire 100 and counts HTTP 404 pages as findings, and a Business Risk API that fails to match "Societe Generale" with an accent
  or "Wagner" with "WAGNER GROUP". A false "clear" in a screening product is the failure that matters. The Delaware premise also needs
  correcting (HB 380 takes effect 2027-01-01; HB 381 is reported to be a breach-notification amendment; thresholds conflict across sources).
  *Smallest proof that would change this:* one paid, authenticated, metered call (checkout, key, call, usage row).
- **#5 Weather (fifth).** Delivery reliability is the product, and the dependencies fail it: NWS has no SLA and delayed alerts on
  2026-08-11 while Weather Radio kept working; most watches are zone-based and cannot say "at this address"; Amber's own services restart on
  every merge (eight in 24 hours) and the web service sits near its memory limit; a missed alert becomes Amber's liability; free substitutes exist.

## The smallest buyer-validation test (no spend, no build, nothing sent by Amber)

1. **Owner (5 minutes):** say where the prepared Austin permit pull lives, or commit the file to this repository. I could not find it.
2. **Me (about one hour, no network needed):** run `tests/austin-permits/analyze_permits.py` on it and report rows -> projects, the share
   with a known valuation and a named builder, and how many pool-related projects a week exist. **Pass:** at least 10 a week with at least
   90% having address, date and status (assumed thresholds). **Fail:** change the segment or drop it.
3. **Me:** produce one real sample list for the last full week, source-linked, no personal data, labelled as a sample.
4. **Owner (about two hours), only if step 2 passes:** show it, in person or by your own message, to ten pool-service owners you can
   reach yourself and ask one question: "Would you pay $49 a month for this every Monday? What is missing?" Amber sends nothing.
5. **Pass:** at least 3 of 10 say yes **and** at least 1 pays or signs a written pre-commitment (revenue counts only once payment is
   verified). **Stop:** 0 or 1 yes. Then run the same test on #3, or stop. If you cannot name ten reachable buyers, that is the finding.
6. **Before any charge:** get the City's written reuse terms (the dataset's "Public Domain U.S. Government" label and the catalog's
   deference to the City's own terms disagree).

## What only the owner can do

- Point me to the prepared Austin sample (step 1).
- Run the conversations in step 4 (Amber never sends cold outreach, and this assessment did not authorise any).
- Optional: add `data.austintexas.gov`, `boards-api.greenhouse.io`, `api.lever.co` and `api.weather.gov` to the cloud environment's allowed
  domains so the live tests can run (about 40 requests, $0). Every live test here failed on network policy, not on the services.
- Confirm the City's reuse terms before charging.

## Files

- `OPPORTUNITIES.md`: one sheet per opportunity (buyer, competitors with dated evidence, sources and reuse limits, Amber components, costs,
  reach, risks).
- `AMBER-PRODUCTION-REALITY.md`: what Amber actually runs, autonomous versus Claude-built, registered versus active.
- `CAPABILITY-TESTS.md`: every test, what was blocked and why, the Austin fixture numbers, the offline API findings.
- `tests/austin-permits/`: `analyze_permits.py` (stdlib only, no network), `fetch_sample.sh` (never run live), and the fixture results.

## Limits of this evidence

- No page could be opened; every competitor and price fact comes from a search summary (tagged vendor / independent / unverified). Prices
  are snapshots, review counts are weak proof of paying customers, and legal points are summaries, not legal advice.
- No live Austin, Greenhouse, Lever or NWS data was collected. The 20-row fixture is another team's commercial-only filter; it shows
  problems exist but gives no rates.
- The cost, support and owner-time figures are assumptions unless marked measured. The only measured numbers are Amber's own production
  counters, which are not independent.
