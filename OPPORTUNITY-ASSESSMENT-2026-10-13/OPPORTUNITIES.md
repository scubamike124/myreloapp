# The five opportunities, one sheet each

Research done 2026-10-12/13. **Read this first:** no research agent could open a web page. Every host except GitHub
failed with `getaddrinfo ENOTFOUND` (the sandbox's network policy), so each fact below comes from a WebSearch
summary of the cited page, not from the page itself. Tags: **[V]** vendor claim, **[I]** independent or official source,
**[U]** unverified. "Undated" means the source gave no date. Prices and customer counts are a snapshot, not a
guarantee. Scores are 1 (worst) to 5 (best) and are judgments from this evidence, not measurements.

**Corrected 2026-10-13.** Sheet 1 originally used pool-service owners as the buyer and a 20-row third-party fixture as the
"sample". Both were wrong: the owner's original target is commercial HVAC/electrical suppliers, and the owner's real sample
(about 50 commercial building permits above $100,000 and 50 mechanical/electrical permits, with recorded contractor phones and source
links) had not been analysed. Sheet 1 below is corrected and marked provisional. Label key used in `README.md`: **[P]** production
observation, **[T]** tested in this sandbox, **[E]** estimate or assumption, **[R]** reported by a third party and not independently
verified (the **[V]/[I]/[U]** tags in the sheets are the finer-grained version of [R]).

Three claims were re-checked by a second, independent search (2026-10-13): Construction Monitor's ~1,500 subscribers and
~MUSD 6 forecast turnover (acquirer's release, 2023-11-07); the Austin dataset's licence ambiguity; TheirStack's free tier
(200 API credits a month, $59 for 1,500). Also re-checked: the 2026-08-11 NWS outage, Delaware HB 380 (signed 2026-09-02,
effective 2027-01-01), Signalbase Pro at €99 a month, and Shovels' $5M seed (June 2025).

---

## 1. Construction permit and planning intelligence (Austin)

**Buyer (provisional, under verification).** A commercial HVAC or electrical supplier with an Austin branch: the owner's original target.
The person who would use it is an outside-sales or branch manager who wants to know which mechanical and electrical contractors are pulling
permits on which commercial projects. Which job titles buy such lists, and what they pay, is **[E]** until the supplier research pass is read
(see `README.md`, "Buyer niche check").
**Problem.** Knowing early which contractors have active commercial work, so the supplier can call on them before the equipment and materials are bought.
**Deliverable (draft [E]).** A weekly email plus CSV, one row per *project* (building permit and its trade permits rolled up): project id, address,
ZIP, issued date, status, valuation (blank if missing), the named mechanical and electrical contractors with the business phone exactly as the
permit record shows it, and a link to each permit. City limits only (suburbs are separate jurisdictions; inference).

*Withdrawn alternative: pool-service owners.* The first version picked a 1-10-technician pool-service company because the 20-row fixture's contact
and valuation fields were weak. No evidence about pool-service buyers was gathered beyond competitor prices, and the owner's sample contains no
residential pool permits to test it on (commercial building permits and trade permits). It stays on file as an untested alternative.

**Competitors and dated evidence of paying customers**

| Product | Public price | Evidence | Gap |
|---|---|---|---|
| Construction Monitor | Austin all permits $500/mo; commercial, solar, pool $250 each (may be stale) [V] shop.constructionmonitor.com | About 1,500 subscription customers, forecast 2023 turnover about MUSD 6, subscriptions over 90% of revenue; acquirer's release 2023-11-07 [V, semi-independent, a forecast not an actual] storage.mfn.se/eb6068f5-45cf-40e5-83cc-b99661cc4923/byggfakta-group-continues-expansion-in-the-us.pdf | Pricey for a small trade |
| Shovels | Free; $599; $999/mo [V] shovels.ai/pricing | $5M seed, June 2025 [I] commercialobserver.com/?p=523692; "$250K MRR" is a Sacra estimate [U] | $599 floor |
| ConstructConnect | $129 / $199 per month [V] | G2 72-117 reviews, undated [I] | Commercial bids |
| Dodge, ATTOM, BuildZoom | Dodge "customized"; ATTOM none (300M+ permits, monthly); BuildZoom $5-$100 per lead or $29-$179/mo [V] | None found [U] | Sales-led / sells jobs |
| Apify Austin actors | $0.10-$150 per 1,000 records; new-pool leads from $30 [V] apify.com/ralarcon/austin-permit-leads/api/openapi | Usage unseen [U] | Raw developer tools |

**Supplier-specific evidence (added 2026-10-13; search summaries, no page opened).**
- Construction Monitor markets to suppliers; a post dated 2024-10-07 says HVAC and lumber suppliers use permit data [V] blog.constructionmonitor.com. Shovels names material suppliers
  among its customers [V] thesys.dev/customers/shovels. ConstructConnect has a Suppliers & Distributors section; third-party prices: Starter $117-$129 a month, Professional from
  $199 per market and seat, Premium from $10,000 a year [U] constructionbids.ai/blog/constructconnect-pricing-guide-2026 (2026). Dodge is custom-quote only [V]. BuildZoom sells custom
  feeds to manufacturers and distributors [V]. Zabalist (Texas; Austin/Travis) lists $19 / $39 / $99 a month [V] zabalist.com/pricing.
- **BuildMapper** (British Columbia; pitches "branch reps" daily alerts and matching a branch's customer list to local permits): "over 135 paying customers" and "$480K ARR", with large
  BC and Alberta suppliers [company-supplied, undated] newventuresbc.com/top-25-spotlight-buildmapper; about $300 a month per customer (derived, [U]); an app listing says "expanding soon to
  Texas and Florida" [V]. It is the only quantified supplier signal found, and it is Canadian.
- **Gap:** no named paying Austin supplier or distributor, no dated case study, testimonial or review count for any of these.
- **Austin-area branches confirmed [V/I], about 8 brands and 13 locations by the agent's count:** Johnstone Supply, Ferguson HVAC, Graybar, Rexel, Wesco, City Electric Supply, Lonestar Electric
  Supply, Century HVAC Distributing. Not confirmed: Gemaire/Watsco, Carrier Enterprise, CED, Crescent, Locke, Border States. Several branches sit outside the City limits (Round Rock, Pflugerville,
  Manor, Lakeway), which this dataset does not cover. At $149 a month each, the 8 brands give a ceiling near $1,190 a month [E].

**Why would they choose Amber?** Weak so far. The possible edges are linking each mechanical or electrical permit to its parent commercial
project, showing the contractor's phone and source link on one line, a weekly cadence, and a price below Construction Monitor's $500/mo
and Shovels' $599 floor. The city data is free and Apify already sells raw Austin records, so any edge is packaging and price, not structure.
Whether suppliers value that enough to pay is the open question.

**Sources and reuse limits**
- *Austin Issued Construction Permits* (Socrata id 3syk-w9eu): free, daily, 2.38M rows, 68 columns [I per catalog listing].
  The dataset's licence label reads "Public Domain U.S. Government" (USGOV_WORKS), and the page says "informational use only
  and may differ from official department data". The data.gov record, however, points to the *City's* terms, not a federal
  grant, and the resource-level licence reads "other-license-specified". Another team (HomeSignalG/homesignal-site PR 1414)
  put paid reuse on hold for exactly this reason: the City's terms create no enforceable right and the City may end any
  use. **Get the City's written terms or permission before charging.**
- **Columns (added 2026-10-13) [R, from the City's own CSV export header via a search summary, header cut off after "Contractor Address 2"]:** Permit Type, Permit Type Desc, Permit Class Mapped,
  Permit Class, Work Class; Permit Num, Project Name, Project ID, Master Permit Num, Link; Applied Date, Issued Date, Status Current, Status Date, Expires Date, Completed Date; Description; Original
  Address 1, Council District, Jurisdiction, Latitude, Longitude; Total Job Valuation and per-trade valuations (Building, Electrical, Mechanical, Plumbing, MedGas, each with a Remodel twin);
  and contractor columns **Trade, Company Name, Full Name, Phone, Address 1, Address 2**. Not seen (absence unproven): applicant columns, contractor email, licence number. Third-party code
  says `project_id` is one per permit and `masterpermitnum` is the project key. The City publishes no fill rates; an Apify seller says contractor and valuation fields are filled on only part of
  the file. How many new mechanical/electrical permits a week carry a company name plus a phone is the key unknown, and the owner's sample is the first evidence on it.
- No published rate limit; Socrata does not throttle requests that carry an app token unless abusive (dev.socrata.com/docs/app-tokens).
  Anonymous calls share a per-IP pool and can see HTTP 429 (secondary reading).
- **City terms, quoted by another team (read directly from raw GitHub) [R]:** data are "offered free and without restriction"; "Data accessed through the City of Austin Open Data Portal do not, and should
  not, include controls over its end use"; credit the City and the department; but "The City may require the termination of any and all displays, distribution, or other use of any or all of the data for
  any reason", and the policy "does not, create any right or benefit ... enforceable at law or in equity". That team's verdict for a paid report was HOLD (PR 1414, merged 2026-09-27).
- **Lists with contractor phones (summary, not legal advice) [R]:** Texas data-broker registration (Bus. & Com. Code ch. 509, $300; "personal data" excludes publicly available government-record
  information, so a list drawn only from City records plausibly fits the carve-out, enrichment may not); telephone solicitation and texting (ch. 302, SB 140; registration $200 plus a $10,000
  bond); the TCPA (business lines generally outside Do-Not-Call; texts and autodialed calls to cell phones need consent; sole proprietors unsettled); CAN-SPAM (no B2B exception). The
  sender-side rules attach to whoever calls, texts or emails, mostly the supplier; a publisher that adds email or text features takes them on. **Smallest safe design:** company-named contractors only;
  phone only where the record has a company name, labelled "as published by the City"; no person-only rows, email or mobile enrichment, texting or dialer; attribution, disclaimer, pull date; a
  removal-request page; a kill switch.
- Planning stage: "Site Plan Cases" (status, proposed use, applicant, owner, location) was seen only as a mirror listing.
  No zoning or subdivision dataset found.
- Second metro: Socrata cities need a column map plus a terms check (about a day, assumed). Fort Worth (ArcGIS) and Houston
  need custom scrapers. Houston reportedly stopped publishing on 2025-12-01 [U].
- Email law if a list were ever mailed: CAN-SPAM has no B2B exemption (postal address, opt-out, up to $53,088 per email) [I];
  Texas SB 140 (2025-09-01) extends solicitation rules to texts [I]. Mitigation: no personal data in the list; email opted-in
  subscribers only.

**Amber parts to reuse:** scheduler (`src/lib/cloud/work-queue.ts`), public-source connectors (`src/lib/amber-earnings/government*.ts`
reads SAM, grants.gov, TED and others; 833 listings in three ticks), polite fetch (`src/lib/research/robots.ts`,
`scout-network/shared-fetch.ts`), source-linked evidence checks (`src/lib/offers/evidence.ts`), Resend sending, Ko-fi /
Stripe checkout. A generic Socrata reader exists (`socrataListings` in `government.ts`, used for NYC City Record procurement
notices) and could be adapted. **Missing:** an Austin or permit connector (no `data.austintexas` or "building permit" string
exists in `src` or `scripts`), project roll-up, a trade classifier (the test script only defines roofing), a weekly delivery
job, a paid-subscription path with live payments on.

**What the small test showed** (details in `CAPABILITY-TESTS.md`). **[T] on a 20-row third-party fixture only, not on the owner's sample:** the
fixture (all commercial, another team's filter, phone fields not requested) had 19 of 20 rows with missing or zero valuation, 20 rows collapsing to
14 projects, two same-address groups needing a human, and 19 of 20 with a contractor company named (4 with stray characters). Its lack of phone,
email, licence and owner columns described *that filter* and is **withdrawn as a finding about the dataset**. The owner reports that the real sample
carries recorded contractor phone numbers; I have not seen it. The three conclusions that survive: building and trade permits for one project must
be rolled up; valuation is often absent on trade permits; and an issued permit usually means the builder is already hired (inference), which is why
the supplier, who sells to the contractors, is a better fit than a homeowner-facing trade.

**Cost and time (assumptions).** Data $0; compute and email about $0.10-$0.50 per list; card fees about $1.72 on a $49 sale.
Onboarding 0 min; support 5 min a customer a month; maintenance 30 min a week; 20 customers = $980/mo and about 55 min a
week. Separately, the sample test estimated 20-45 minutes a week of human correction per about 300 raw rows plus 1-2 hours of
initial tuning (a guess, unmeasured).

**Reaching buyers without paid ads.** A weekly Austin page with opt-in (crowded: Levelset, Zabalist, BuildZoom; Google's
scaled-content-abuse policy limits mass pages). HBA Austin associate dues are $875/yr (a paid listing, excluded). Channels to
suppliers (trade associations, supplier events) are being researched; approaching strangers is outreach and is the owner's decision.
**No proven free channel yet.**

**Risks and invalidators.** Too few commercial projects with mechanical/electrical permits per week; contractor phone coverage below
what a supplier needs; nobody pays; the City's terms bar resale; rules on lists that carry phone numbers (under research).

**Scorecard [E].** Paying-demand evidence 3 (category proven by other vendors, supplier buyer not yet). Owner time 4. Delivery
reliability 3. Cost 5. Access without paid ads 2. Confidence: low, and the ranking of this opportunity is provisional until the
owner's sample has been analysed.

**Top evidence**
1. https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu
2. https://storage.mfn.se/eb6068f5-45cf-40e5-83cc-b99661cc4923/byggfakta-group-continues-expansion-in-the-us.pdf
3. https://www.newventuresbc.com/top-25-spotlight-buildmapper/ (the one quantified supplier signal)
4. https://raw.githubusercontent.com/HomeSignalG/homesignal-site/main/docs/corporate-output-austin-issued-permits-2026-09-27.md (City terms, quoted; reuse hold)
5. https://www.zabalist.com/pricing

---

## 2. A specialised utility API (Amber's existing APIs)

**Buyer, problem, deliverable (three candidate shapes researched).** A: a multi-state privacy-rules feed for a consent/DSAR
SaaS product manager (JSON applicability result plus change webhook). B: public-record normalisation (entities, sanctions)
for a fintech KYB developer. C: vertical document extraction for a vertical-SaaS developer. Amber's own closest product is
**B: the Business Risk Intelligence API** ($49/$149/$399, `POST /api/v1/risk/check`, sanctions, federal exclusions, SEC
filers, domain checks, evidence per hit).

**Competitors** (price | customer evidence)
- A: LegiScan free tier 10k queries/mo, $1,000/yr to $12k Push | none found. Open States free. PrivacyLawMap free applicability
  calculator ("verified 2026-08-04"). Termly from $14/mo, iubenda about €5-80. OneTrust quote-only | "14,000+ customers" [V].
- B: sec-api.io $49 / $199 a month | "1,000+ customers" logos [V]. OpenSanctions €0.10/query. OpenCorporates £225-1,200/mo
  (pages conflict). Cobalt about $0.75/lookup; Middesk $8k-15k/yr (per Cobalt's own comparison).
- C: Mindee about $0.044/credit; Veryfi $0.16/invoice; Nanonets $0.30/page. Customer proof not retrieved.
- Marketplaces publish no revenue or conversion data. RapidAPI keeps 25%; Zyla 20% plus fees. One self-reported thread: best
  of three APIs earned $400-500 a month after a year, the others about $50 combined, "discovery sucks". x402 (agent
  payments): about $28k/day, roughly half gamed (CoinDesk, 2026-03-11); a 2026-07-15 report claims 75M payments = $24M in 30
  days at $0.32 average (self-reported); Artemis: 64% gamed. Apify claims $500k+/month paid to developers (unaudited).

**The Delaware premise needs correcting.** HB 380 was signed 2026-09-02 and takes effect 2027-01-01 (re-checked). The agent
reports HB 381 is a *breach-notification* amendment, already effective 2026-09-02, not a 2027 privacy rule (not re-checked).
The applicability threshold conflicts between sources: law-firm blogs say 10,000 Delaware residents, the agent says the official bill
synopsis says 15,000. Resolve against the enrolled text. January 2027 is a one-off spike; 24 state privacy laws existed by June
2026, so a Delaware-only product is thin.

**Why Amber?** No edge found. A free applicability tool exists; generators cost $5-80/mo; LegiScan covers bills at $1k/yr.
Untested edge: a cited, machine-readable, multi-state change feed. No public evidence that law firms or SaaS compliance
teams buy such an API.

**Reuse limits.** Delaware Code: no reuse licence found; footer "© 2015 All Rights Reserved" [U]; prefer enrolled bills and
link out. LegiScan data is CC BY 4.0, white-label only at the Push tier. Open States bulk is public domain. OFAC and UN lists
are public. SAM.gov uses a shared vault key (terms uncertain).

**Liability.** The FTC's DoNotPay order (2025-02-11, $193k) bars unsubstantiated "AI lawyer" claims; its complaint also hit a
website legal-violation scanner. Unauthorised-practice-of-law: *Nippon Life v. OpenAI* is pending; Colorado's non-prosecution
policy requires lawyer supervision and disclosure; Delaware's stance not found. Polar's acceptable-use policy excludes
"regulated services".

**What Amber actually has** (full inventory in `AMBER-PRODUCTION-REALITY.md` and `CAPABILITY-TESTS.md`): Statute API,
Business Risk API and Agent Ops API, built 2026-09-03 to 09-06 by Claude sessions; hero compliance modules from the
owner's earlier commits; nine of fifteen catalog APIs deliverable per Amber's own OpenAPI check; **zero customers, zero
live listings, zero approved marketplaces; keys, calls and sign-ups are not measured anywhere** (uncertain, not proven zero).

**Cost and time (assumptions).** About $0 compute per rules call; $5-20/mo hosting; 1-2 h a month support per customer;
2-6 h a month upkeep per state. Net of fees on $49/$149/$299: Polar Starter 5% + 50¢ gives $46.05 / $141.05 / $283.55;
RapidAPI $36.75 / $111.75 / $224.25; Zyla about $37 on $49; AWS $47.53. KYC through Stripe/PayPal/W-9; the owner still files
income tax.

**Reaching buyers.** Free listings: official MCP Registry (preview index, no billing), Smithery, Glama, Postman API Network,
RapidAPI/Zyla, Apify. Realistic yield: a trickle of free keys. SEO explainers are the only compounding channel. Polar is
billing, not discovery.

**Risks and invalidators.** No paid conversion in 60-90 days; Polar offboarding holds payouts; output judged legal advice;
a free competitor adds an API; wrong thresholds; code-reuse limits.

**Scorecard.** Paying-demand evidence 2 (I would say 1-2 for Amber's own APIs: none). Owner time 3. Delivery reliability 2 as
built (4 if the defects in `CAPABILITY-TESTS.md` are fixed). Cost 4. Access 2. Confidence: low-medium on market structure
and fees, low on demand size.

**Top evidence**
1. https://privacylawmap.com/ 2. https://legis.delaware.gov/BillDetail/143107 (HB 381)
3. https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-finalizes-order-donotpay-prohibits-deceptive-ai-lawyer-claims-imposes-monetary-relief-requires
4. https://docs.polar.sh/merchant-of-record/acceptable-use
5. https://www.coindesk.com/tech/2026/07/15/visa-mastercard-and-ripple-join-the-standard-letting-ai-agents-pay-in-stablecoins

---

## 3. Hiring and business-expansion signals

**Buyer.** Boutique (1-10 recruiter) contingency tech-recruiting agencies in **one** US metro (for example Austin).
**Problem.** Spotting local employers with many or long-open software and data-engineering requisitions (business-development
targets) without paying €99-£700/mo for signal tools or running scrapers.
**Deliverable.** Weekly "Open-Req Watchlist" (CSV + HTML), one row per employer: company; careers-board URL; ATS; open-role
count (role family, metro); new-this-week count; **first-seen date (Amber's first snapshot containing the job id, not the
employer's posted date)**; oldest-open age in days; up to five dated posting links; snapshot timestamp; source endpoint.
Company-level only; no ROI promises.

**Competitors**

| Product | Public price | Dated paying-customer evidence | Gap |
|---|---|---|---|
| TheirStack (job + tech data) | Free 200 credits/mo; $59 / 1,500; $400 / 50k [I, re-checked] | EnergyHire, Clay.com (undated, [V]) | The free tier is the real rival |
| PredictLeads | Free 100 calls; $0.04/credit, $40 min | G2 4.8 from 35 reviews, 2026-03 [I] | Developer-grade |
| Coresignal | $49/mo (250 credits), Pro $800, up to $5,000 | Only an anonymous 2022 case study [V] | Raw credits |
| Signalbase, SignalsAPI, Sector Radar | €99/mo (vendor page, re-checked); £700/mo; about $49/mo | Unverified | Direct rivals, no gap proven |
| Clay | Launch $185/mo ... Enterprise $30K+/yr (sources conflict) | $100M Series C, 10,000+ customers, 2025-08-05 [V] | A do-it-yourself build |
| ZoomInfo, Sales Navigator, Apollo | ~$15K-40K+/yr est.; ~$120-160/mo; $49-119/user/mo | Secondhand | Cost / no export |

**Why Amber?** None proven. Upstream lifecycle data likely exists elsewhere (PredictLeads webhooks cover posting creation
and deletion). Any edge is packaging: one metro x one role family, a primary link on every row, and a price under €99 and $59.

**Sources and reuse**
- *Greenhouse* job-board GET endpoints need no authentication (search-summary paraphrase); a board token per company is
  required; no rate-limit or reuse clause found. `updated_at` is the **last-edit time, not the posting date**.
- *Lever* postings API is keyless. Verbatim from the official README: "These jobs may be scraped by third parties." The only
  documented 429 is for more than 2 application POSTs per second. **No date field is documented**, so Amber must self-stamp.
- *Ashby* is keyless per guides with no discovery endpoint; SmartRecruiters and Workable unresolved.
- SEC EDGAR (10 requests a second, declare a User-Agent) and DOL LCA files (quarterly, months of lag) are corroboration only.
- **Do not scrape LinkedIn or Glassdoor**: their terms bar automated access (secondary sources); in *hiQ v. LinkedIn* the court
  sided with hiQ on the federal computer-fraud claim but later enforced the terms as a contract and the case ended in a
  $500,000 consent judgment. Contract risk survives. Not legal advice.
- A 4-8-week archive is needed before "oldest open" means anything. Expect ghost or evergreen requisitions, reposts,
  "Remote" geography and unlisted boards; re-check each link before sending.

**Amber parts to reuse:** the same scheduler, polite fetch, evidence checks, and Resend sending as above. **Missing:** an ATS
connector (no `greenhouse`, `lever.co` or `boards-api` string exists in `src` or `scripts`), a company-to-board-token list,
a snapshot archive and diff, a metro/role classifier, report rendering on real data.

**Cost and time (assumptions).** Data $0; hosting $5-15/mo; LLM $1-3 a report. Poll at most 1 request a second per host with
daily snapshots. Onboarding 10 min a subscriber; support 10 min a subscriber a month; maintenance 2-4 h a month; weekly QA
15-30 min. 20 subscribers x $49 = $980/mo against about $30-60 cash cost; owner hours, not cash, are the constraint.

**Reaching buyers.** Show HN (must be tryable without signup; vote-asking banned); a free G2/Capterra listing; SourceCon
(a pitch to a stranger, so the owner decides under the no-cold-outreach rule); a few original SEO pages. **No channel found that
reliably reaches boutique recruiters free.**

**Invalidated if:** fewer than 3 of 10 qualified inbound recruiters would pay $29+; they are content with TheirStack's free
tier; Greenhouse, Lever or Ashby add keys or blocks; the seed list covers under 60% of the employers buyers name.

**Scorecard.** Paying-demand evidence 3. Owner time 3. Delivery reliability 3 (2 on "dated"). Cost 4. Access 2. Confidence:
low-medium (about 35%).

**Top evidence**
1. https://www.trysignalbase.com/pricing 2. https://theirstack.com/en/pricing 3. https://github.com/lever/postings-api
4. https://developers.greenhouse.io/job-board
5. https://www.privacyworld.blog/2022/12/linkedins-data-scraping-battle-with-hiq-labs-ends-with-proposed-judgment/

---

## 4. Multi-location listing and website audits

**Buyer.** Small agencies running marketing for dental groups with 5-30 sites (the agency pays Amber and bills the group).
Chains buy from sales-led vendors; agencies buy cheap white-label tools. Dental fits: 13-14% of US dentists were
DSO-affiliated in 2022-23 data [I]. The number of 5-30-site groups, and other verticals, is **[U]**.
**Problem.** The listing -> location page -> booking path silently breaks at one of N sites.
**Deliverable.** Weekly "Booking Path Report" from a customer master CSV (name, address, phone, hours, booking URL): status,
redirects and final URL of each listed website and booking link; a headless render of the location page and booking widget
up to the availability step (never submits); visible and JSON-LD name/address/phone/hours versus the master; per finding: URL,
full-page screenshot, HAR excerpt, UTC timestamp, repro steps, pass/fail/needs-review and the change since last week.

**Competitors**

| Product | Price | Dated evidence | Gap |
|---|---|---|---|
| Yext | $199 / $449 / $499 / $999 per location a year [I, Aug 2026] | FY26 revenue $446.6M, ARR $444.3M (2026-03-09); net retention 95% (2025-12-08) [V] | ARR -1% year on year; no booking-URL test found |
| Uberall | Unpublished; 25+ location entry | None found | Pushes appointment URLs to Google; no validation found |
| Birdeye | Unpublished (trackers: $299-449/loc/mo [U]) | "#1 on G2, 17 quarters", Fall 2026 [V] | Enterprise contracts |
| Synup | $79/mo (25 locations), $199 (100), $799 (500) [I] | G2 about 335 reviews, 2026 | Syncs, no testing |
| BrightLocal, Moz Local, Semrush Local, Whitespark | $39-59/mo + ~$20 per extra location (conflicting); $16/$24/$33 per location; $30/$60 per location; $33-149/mo | Capterra 281 and G2 about 475 reviews (2026) | Citation and sync, not booking |
| Pingdom, UptimeRobot, Conductor | Pingdom ~$15/mo (transaction checks priced separately, U); UptimeRobot $0-$79; Conductor from $139/feature | Unknown | Flows are do-it-yourself |

Review counts are weak proof of paying customers.

**Why Amber?** Possible edge: zero-configuration proof that each location's booking flow works, priced below the suites.
Incumbents already cover cross-listing consistency. I found no vendor that tests whether the booking URL works (absence of
evidence, not proof). It is thin: Playwright monitors or an incumbent could copy it. **Narrow, unproven.**

**Sources and terms.** Public location and booking pages (honour robots.txt, stop before submitting); status codes; JSON-LD.
Scraping public pages is probably not a federal "without authorisation" violation (*hiQ v. LinkedIn*), but contract claims
survive. Customer's own site: get written permission and allowlist. Google Places: no caching beyond exceptions, place ids
storable, attribution required; Business Profile API needs the owner's OAuth consent; Yelp: 24-hour cache, no scraping;
Apple and Bing: partner programmes (skip). OSM (ODbL) is unneeded if customers supply locations.

**Amber parts to reuse:** Website Snapshot (a $49 five-page, human-reviewed PDF; checkout, intake, review gate exist; **0 orders,
checkout in test mode**), polite fetch and robots reading, `url-guard.ts` (SSRF guard), pdfkit rendering, outreach lane
(OSM -> three-page preview -> draft; 57 reviewed drafts waiting on the owner). **Missing:** browser rendering in the
production worker (reports use pdfkit, no browser; Playwright scripts exist only for captures), a booking-widget stepper, a
location master importer, a week-over-week diff, bot-wall handling.

**Cost and time (assumptions).** About 6 pages per location weekly; compute plus failure-only LLM triage $0.10-$0.50 per
location a month; no paid APIs. Assume a price of $6-10 per location a month: 20 locations = $120-200/mo; three customers =
$360-600/mo. Onboarding 1-2 h a customer; 2-5% false alerts before tuning at about 10 minutes each (alert after two
consecutive failures; needs-review on captcha or bot walls).

**Reaching buyers.** A free G2 profile (1-3 day review); a free three-location checker as an inbound page; HighLevel
Marketplace (7-10 day review, OAuth build, reaches partner agencies); Vendasta (paid vendor subscription: too heavy). Local
Search Forum allows promotion only in signatures. **Slow and uncertain.**

**Risks.** Zero Website Snapshot sales mostly generalise: the constraint was reach, not the $49 price. A mature, price-pressured
category. Pain evidence is old (BrightLocal survey, c. 2016-2018). Booking vendors may block bots. Never submit forms (health
information). No certification or guarantee claims.

**Scorecard.** Paying-demand evidence 2. Owner time 3. Delivery reliability 3. Cost 4. Access 2. Confidence: low-medium.

**Top evidence**
1. https://www.businesswire.com/news/home/20260309263268/en (Yext FY26)
2. https://toolradar.com/tools/synup/pricing
3. https://uberall.com/en-us/resources/blog/google-appointment-links
4. https://developers.google.com/maps/documentation/places/web-service/policies
5. https://developers.google.com/my-business/content/implement-oauth

---

## 5. Weather-impact monitoring for business sites (official sources only)

**Buyer.** Property manager with 6-40 fixed buildings (operations lead plus on-call maintenance). Fixed addresses mean one CSV
and no integrations; above iAlert's 5-site cap, far below enterprise tools; low-stakes response. Rejected: Texas youth camps
(SB 1 mandates weather-radio monitoring: life-safety liability and radios already comply).
**Problem.** "Which of my addresses is under an official watch or warning now, and what does it say?"
**Deliverable.** Email (optional SMS) per site per NWS alert id: address, matched zone, event, headline, severity, urgency,
certainty, effective and expiry times, sender, areaDesc, the verbatim description and instruction, the alert link, and
update/cancel follow-ups. Poll every 60-120 s (NWS asks for no more than every 30 s); a weekly "monitor running" note, **never
"all clear"**.

**Competitors**

| Product | Price | Dated evidence | Gap |
|---|---|---|---|
| Free: NOAA Weather Radio, WEA, the NWS API | $0 | n/a | No portfolio view |
| iAlert.com | $5.75/mo (1 site), $21.75 (max 5), $38 (event-type); free ad-supported tier; pages conflict | None found | 5-site cap |
| Tomorrow.io, DTN WeatherSentry, AccuWeather SkyGuard | Quote-only / no public price | None found; a municipal-league group rate (2025-02-11) | Sales-led |
| Baron Threat Net | About $89.97/mo user-reported 2018-19 | University of Mississippi, 2019 [I] | Complex |
| Everbridge, AlertMedia, Samdesk, Dataminr | AlertMedia median $12,312/yr, 2026 SMB average $15,123/yr | Vendr: 30 purchases; SpendHound: 160 customers (2026); Everbridge buyout closed July 2024 | About 10x a 20-site relay |
| Hail Drive | $29.99/mo, hail tracking for roofers | None | Niche |

No dated proof that anyone pays for an NWS relay at small-business scale.

**Why Amber?** Partial: six to 40 sites, a shared inbox, per-site de-duplication, a timestamped relay log. iAlert stops at five
sites; AlertMedia-class costs $12-15k a year; DIY scripts are free.

**Sources and terms.** api.weather.gov: User-Agent with contact required (403 without); rate limit not public; alerts keep 7 days;
no SLA found. **On 2026-08-11 a National Weather Service internal software problem delayed products being issued; some
alerts reached apps and phones 20 minutes or more late while NOAA Weather Radio kept working** (re-checked: iHeart, WSAZ,
WYMT). NWS disclaimer: public domain unless noted; do not claim it as yours, imply NWS/NOAA endorsement, or alter and
present as official; "The user assumes the entire risk related to its use". Zone-based alerts (most watches and advisories)
support "NWS issued this for the zone or county containing the site", not "at this address"; only some warnings carry
polygons. OpenFEMA requires the sentence "...but is not endorsed by FEMA". IPAWS needs registration and a memorandum of
agreement. Wording for a paid relay (counsel needed): quote alerts unaltered with sender and times and "Source: NWS"; never
"safe", "predict", "route", "all clear", "compliant" or "guaranteed".

**Amber parts to reuse:** scheduler, Resend sending. **Missing:** everything NWS (`weather.gov` appears nowhere in `src` or
`scripts`), address-to-zone geocoding, per-alert de-duplication and update tracking, SMS (Twilio 10DLC registration), 24/7
uptime. Amber's web and worker services redeploy on every merge (eight merges in the last 24 hours) and the web service sits
near its memory limit, which is a structural mismatch with a product that must be up when the weather is bad.

**Cost and time (assumptions).** API $0. SMS $0.0083 per segment plus carrier fees; 10DLC brand registration $4.50-46 once.
For 20 sites x 15 events x 2 phones x 2 segments, about 1,200 segments or $15 a year ($0.06 per site-month). Parity with iAlert
implies $87-115 a month per customer. Owner time 1-3 h a week at 20 customers (duplicates, geocoding errors, SMS filtering,
24/7 uptime). A missed alert has no upstream warranty, so claims land on Amber.

**Reaching buyers.** Show HN or Product Hunt (wrong audience); the NWS Weather-Ready Nation Ambassador programme (credibility, not
leads; never present it as endorsement); a free "official alerts at this address" lookup page. Reddit excluded.

**Risks.** Free substitutes may zero willingness to pay; upstream outages make a relay late when needed; reliance creep into
life-safety. Invalidated by under five qualified sign-ups, an adverse counsel view, or tighter API terms.

**Scorecard.** Paying-demand evidence 2. Owner time 2-3. Delivery reliability 2. Cost 4. Access 2. Confidence: low (about 30%).

**Top evidence**
1. https://www.iheart.com/content/2026-08-12-weather-warnings-delayed-by-software-glitch-amid-deadly-midwest-storms/
2. https://www.weather.gov/disclaimer 3. https://www.weather.gov/documentation/services-web-api
4. https://www.ialert.com/services 5. https://capitol.texas.gov/tlodocs/892/analysis/pdf/SB00001F.pdf
