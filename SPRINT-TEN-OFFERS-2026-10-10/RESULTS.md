# Ten pilot offers: results

Generated 2026-10-10T21:03Z from the code (registry and demo QA), the research files, and two reports Amber's worker publishes on #105: the live buyer-evidence check (as of 2026-10-10T20:57:49.734Z) and the offer tracker (as of 2026-10-10T21:02:54.515Z).

**Revenue: $0.00.** Revenue counts only when payment or escrow is verified. No payment was taken during the sprint, and no pilot is a finished production service.

## Results table

| # | Offer | Test price (hypothesis) | Buyer evidence: research score, live check | Status | Direct cost | Tracker: visits · inquiries · qualified · paid | Blocker |
|---|---|---|---|---|---|---|---|
| 1 | Missed-Call and Web-Inquiry Follow-Up List | $199 for the two-week pilot (three lists) | 4 if the search results hold; live check: 4 of 7 found | Pilot page and sample; sample QA 17/17 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Buyers pay for real-time response; this pilot is a reviewed list the owner acts on later. |
| 2 | Stale Estimate Follow-Up List | $249 for four weekly lists | 3 if the search results hold; live check: 5 of 7 found | Pilot page and sample; sample QA 15/15 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Competes with follow-up features already in Jobber and Housecall Pro. |
| 3 | Job-Cost Exception Report | $449 for up to 10 jobs: the report and one refresh | 3 if the search results hold; live check: 4 of 5 found | Pilot page and sample; sample QA 14/14 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Percent complete is rarely in any export; the client must supply it. Read-only. |
| 4 | Receipt and Invoice Match Review | $99 for one month of one business (bookkeepers: $149 for three client-months) | 3 if the search results hold; live check: 4 of 7 found | Pilot page and sample; sample QA 13/13 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Reads extracted receipt fields, not images. Read-only. |
| 5 | Unpaid Invoice Tracker with Draft Reminders | $149 for four weekly reports | 4 if the search results hold; live check: 7 of 7 found | Pilot page and sample; sample QA 18/18 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Free built-in reminders exist; the pilot must win on which invoices to chase and how the draft reads. |
| 6 | Website Health, Accessibility and Booking-Form Check | $49 for up to 5 pages (the form check is included during the pilot) (existing price) | 4 if the search results hold; live check: 5 of 7 found | Pilot page and sample; sample QA 13/13 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | The site's own checkout is in Stripe test mode, so Ko-fi is the live payment path. |
| 7 | CRM Duplicate and Data-Quality Check | $99 for one report on up to 5,000 records | 4 if the search results hold; live check: 2 of 7 found | Pilot page and sample; sample QA 12/12 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Contact exports are personal data and need a data-handling agreement first. |
| 8 | Support Inbox Triage with Reply Drafts | $79 for one week of email, up to 150 messages | 3 if the search results hold; live check: 4 of 6 found | Pilot page and sample; sample QA 14/14 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Customer emails are personal data and need a data-handling agreement; export only, no mailbox access. |
| 9 | Product Catalog Cleanup and Cross-Store Check | $99 for one report on up to 1,000 SKUs | 3 if the search results hold; live check: 4 of 6 found | Pilot page and sample; sample QA 11/11 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Needs two exports; buyers mostly pay for ongoing sync, not audits. |
| 10 | Short-Form Ad Variations from Your Video | $99 for three variations | 4 if the search results hold; live check: 2 of 6 found | Pilot page and sample; sample QA 14/14 | $0 (no model or paid API) | 0 · 0 · 0 · 0 | Needs customer video with usage rights; the pilot cuts and captions only. |

Research score: the 1 to 5 rubric in the evidence files, given "if the search results hold up". The strict score is 1 for every offer, because this session could not open the cited pages. The live check is the worker opening each cited page once, with robots.txt honoured, and looking for the quoted text. Only "found" counts as verified.

## Recommendation: the two offers for the next build cycle

The rule was written down before the live check ran, and uses buyer evidence only:

1. Real buyer behaviour on the tracker comes first: a paid pilot, then a qualified reply, then an inquiry.
2. Then the research score, counted at face value only when at least half of the offer's evidence items were found on the live pages. Otherwise the strict score of 1 applies.
3. Then the number of items found.
4. Then price fit: whether the test price sits inside what buyers already pay for comparable one-off work.

| Rank | Offer | Paid · qualified · inquiries | Effective score | Items found | Price fit |
|---|---|---|---|---|---|
| 1 | Unpaid Invoice Tracker with Draft Reminders | 0 · 0 · 0 | 4 | 7 of 7 found | inside: reminder tools cost $49 to $199 a month; the pilot is $149 for a month of weekly reports |
| 2 | Website Health, Accessibility and Booking-Form Check | 0 · 0 · 0 | 4 | 5 of 7 found | inside: freelance audits sell for $25 to $600; free scanners cap the low end |
| 3 | Missed-Call and Web-Inquiry Follow-Up List | 0 · 0 · 0 | 4 | 4 of 7 found | partial: buyers pay $29 to $1,725 a month, but for real-time answering; one-off text-back setups sell for $25 to $100 |
| 4 | Stale Estimate Follow-Up List | 0 · 0 · 0 | 3 | 5 of 7 found | weak: mostly bundled into $25 to $299 a month software; no standalone paid report found |
| 5 | Job-Cost Exception Report | 0 · 0 · 0 | 3 | 4 of 5 found | inside: one-time construction bookkeeping cleanups sell for $300 to $1,000 |
| 6 | Product Catalog Cleanup and Cross-Store Check | 0 · 0 · 0 | 3 | 4 of 6 found | inside: Upwork catalog cleanups $50 to $1,200; buyers mostly pay for ongoing sync |
| 7 | Support Inbox Triage with Reply Drafts | 0 · 0 · 0 | 3 | 4 of 6 found | thin: one-off support audits $160 to $1,100, but only one buyer post was found; drafts are built into helpdesks |
| 8 | Receipt and Invoice Match Review | 0 · 0 · 0 | 3 | 4 of 7 found | weak: comparable one-off reconciliation sells for $10 to $56 on Fiverr; Hubdoc is free with Xero |
| 9 | CRM Duplicate and Data-Quality Check | 0 · 0 · 0 | 1 | 2 of 7 found | inside: Upwork cleanups $25 to $620; review-only audits $250 to $750 |
| 10 | Short-Form Ad Variations from Your Video | 0 · 0 · 0 | 1 | 2 of 6 found | inside: Upwork buyers posted $150 and $225 for 3 to 4 hook variations; edited videos $40 to $200 each |

**Recommended: Unpaid Invoice Tracker with Draft Reminders and Website Health, Accessibility and Booking-Form Check.** They rank first on the rule above. The ranking will change as soon as a real buyer replies or pays, because the tracker outranks research.

Not ruled out by evidence against them: CRM Duplicate and Data-Quality Check (4 of 7 cited pages blocked the check); Short-Form Ad Variations from Your Video (4 of 6 cited pages blocked the check). Their evidence leans on marketplace pages that answer automated readers with a bot challenge, so their low verified counts reflect the check's reach. Opening those pages by hand would settle it.

What this rests on: the verified items are asking prices, review counts on paid tools, published surveys and buyers' complaints. None of them is a sale of these pilots. Inquiries so far: 0.

Offer 6 already has a live paid path: the $49 Website Snapshot Report on Ko-fi. Its next build cycle is the booking-form check inside that paid report, not a new product.

## Per offer: what the live check verified, and the main risk

Each line under "Verified" is a fact whose quoted text the worker found on the cited page. "Not verified" lists the rest with the reason; a bot-challenge page (HTTP 403) was never fetched around. The research summary after them comes from search results and is unverified where its items are.

### 1. Missed-Call and Web-Inquiry Follow-Up List

Verified (4 of 7):
- Yelp's SEC-filed Q2 2026 shareholder letter reports that Hatch, the AI lead follow-up platform for services businesses that Yelp bought, grew annual run-rate revenue 59% to $35 million (spend on lead follow-up software in general, not on this offer). (https://www.sec.gov/Archives/edgar/data/0001345016/000134501626000059/yelpq22026ex992lettertos.htm)
- Ruby's pricing page lists a $1,725 plan (its 500-minute monthly live-receptionist plan, per the search snippet); an asking price, not a sale. (https://www.ruby.com/plans-and-pricing/)
- A plumber on the PlumbingZone forum says his answering service costs about $450 a month (one owner's old post; buyer-side spend on answering calls). (https://www.plumbingzone.com/threads/anyone-have-any-advice-for-hiring-an-answering-service.31658/)
- A later post in the same thread says 40 of those missed calls were telemarketers, so most missed calls were not lost leads (a caveat on the size of the problem). (https://www.plumbingzone.com/threads/anyone-else-losing-jobs-to-missed-calls.91027/)

Not verified (3):
- Yelp's press release states the price it agreed to pay for Hatch, an AI lead-management platform for services businesses: about $270 million in cash.: challenge page (https://www.yelp-ir.com/news/press-releases/news-release-details/2026/Yelp-Accelerates-Strategy-with-Acquisition-of-AI-Lead-Management-Platform-Hatch/default.aspx)
- Jobber's help article for its paid AI Receptionist add-on states an included allowance of 30 conversations (the snippet gave the add-on price as $29 per month, which this quote does not itself show).: challenge page (https://help.getjobber.com/hc/en-us/articles/25315927533847-Receptionist-powered-by-Jobber-AI)
- A small plumbing business owner on PlumbingZone reports 47 missed calls in one month (his own count).: not found; HTTP 200; 546,231 characters read; quote not on the page (https://www.plumbingzone.com/threads/anyone-else-losing-jobs-to-missed-calls.91027/)

Research summary: Yelp bought Hatch (AI lead follow-up for service businesses) for about $270M cash; Yelp's filings put Hatch at about $35M run-rate revenue (June 2026). Smith.ai, Ruby, Podium and Jobber publish prices; owners describe paying $100–$450/month for answering. Buyers pay: $29/month (Jobber AI add-on) to $1,725/month (Ruby); Fiverr text-back setups $25–$100. Risk: Buyers pay for real-time response; a reviewed list the owner sends later is slower than every paid alternative. One owner's 47 missed calls held about 7 real leads.

### 2. Stale Estimate Follow-Up List

Verified (5 of 7):
- A roofing contractor's job post offers $10 to $15 an hour for a remote inside-sales role centred on customer follow-up (a posted wage for follow-up work, not specifically estimate follow-up). (https://alliedroofingconstruction.discovered.ai/job-details/69946)
- A ServiceTitan customer story (vendor content) says a roughly $20M contractor's dedicated follow-up coordinator brought in $1 million from unsold estimates in 2024 (the company's own claim). (https://www.servicetitan.com/blog/success-story-above-beyond-field-pro)
- Hatch's blog (vendor data) says it analysed 163,000 HVAC two-day estimate follow-up campaigns. (https://www.usehatchapp.com/blog/hvac-estimate-follow-up-response-rates)
- Housecall Pro's help center documents a built-in automation that resends unanswered estimates and marks them First Follow-Up (a competing feature, not evidence of spend). (https://help.housecallpro.com/en/articles/6185127-getting-started-with-pipeline)
- A ContractorTalk thread is titled 'Silence after giving quotes', a contractor describing quotes that go unanswered. (https://www.contractortalk.com/threads/silence-after-giving-quotes.196530/)

Not verified (2):
- Jobber's pricing page lists automated quote and invoice follow-ups as a feature of its paid plans (the Connect tier and up, per the snippets); a listed feature, not proof of use.: challenge page (https://www.getjobber.com/pricing/)
- Jobber users have a community thread on how they follow up on unscheduled quotes (buyers discuss the problem; not evidence of spend).: challenge page (https://community.getjobber.com/discussions/marketing-forum/what%E2%80%99s-your-process-for-following-up-on-unscheduled-quotes/2237)

Research summary: Jobber puts automated quote follow-ups in its $99/month Connect tier; roofing job posts pay $10–$16/hour for follow-up coordinators; a ServiceTitan case study names a dedicated unsold-estimate coordinator. Buyers pay: $25–$100/month add-ons; $99–$299/month platforms; $10–$16/hour staff. Risk: Mostly bundled into software contractors already pay for; no standalone paid estimate-follow-up report found.

### 3. Job-Cost Exception Report

Verified (4 of 5):
- A QuickBooks user titled a community thread 'PROJECT COSTING DOES NOT WORK PERIOD', complaining that project-costing reports are inaccurate. (https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/project-costing-does-not-work-period-again-inaccurate-reporting/00/1319526)
- A QuickBooks user reports that the Job Profitability Report is still not right (buyer words about wrong job-cost reports). (https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/job-profitability-report-still-not-right/00/1095737)
- A contractor shopping for job-costing software says he wants to compare estimates with actuals over time to refine his quotes (buyer words about the need). (https://www.contractortalk.com/threads/need-recommendation-for-job-costing-software.457514/)
- A contractor praises Knowify's job costing, which the same post prices at about $99/month (one buyer's opinion; the price is outside this quote). (https://www.contractortalk.com/threads/need-recommendation-for-job-costing-software.457514/)

Not verified (1):
- Catalyst CPA's construction bookkeeping page states a monthly fee that runs up to $1,200 depending on job volume (job costing and WIP are in its scope per the snippet); an asking price, not a sale.: http error; HTTP 526 (https://catalyst-cpa.com/construction-bookkeeping/)

Research summary: Construction bookkeeping with job costing sold at $500–$1,200/month (Catalyst CPA); job-costing tiers $199–$340/month; a $1,200 fixed-price Upwork construction-bookkeeper post. Buyers pay: $199–$1,200/month; one-time cleanups $300–$1,000. Risk: Hardest data to assemble: percent complete is rarely in any export; 'my bookkeeper already does this'.

### 4. Receipt and Invoice Match Review

Verified (4 of 7):
- Dext, a paid receipt-capture tool, has 1116 reviews on its US Xero App Store listing (count as of the snippet; it drifts). (https://apps.xero.com/us/app/dext/reviews)
- AutoEntry, a paid document-capture tool, has 465 reviews on its US Xero App Store listing (count as of the snippet; it drifts). (https://apps.xero.com/us/app/autoentry/reviews)
- A QuickBooks user asks how to see which categorized transactions have no receipt attached, the gap an exceptions list fills. (https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/is-there-a-way-to-see-which-categorized-transactions-don-t-have/00/1406619)
- A QuickBooks user reports that matching receipts to bank transactions does not work for them. (https://quickbooks.intuit.com/community/banking-4/receipt-matching-to-bank-transactions-doesn-t-work-24245)

Not verified (3):
- Dext's US business pricing page lists $25.21 (per month on annual billing, per the snippet); an asking price, not a sale.: not found; HTTP 200; 316,841 characters read; quote not on the page (https://dext.com/us/business/pricing)
- An Upwork client posted monthly QuickBooks cleanup and reconciliation work with a $15.00 fixed-price budget (a posted budget, showing how low some buyers price this work).: challenge page (https://www.upwork.com/freelance-jobs/apply/Bookkeeper-for-monthly-QuickBooks-cleanup_~022101019768267243801/)
- AccountingWEB reports a survey of UK practitioners in which 67% named getting information from clients as their biggest difficulty after the first MTD quarterly deadline (trade-press report of a survey).: challenge page (https://www.accountingweb.co.uk/tech/practice-software/reveal-sets-sights-on-ending-the-client-document-chase)

Research summary: Dext has 1,116 Xero App Store reviews and AutoEntry 465; bookkeepers pay $5–$50 per client/month for Keeper, Uncat, Dext; Booke AI $129/business/month. Buyers pay: Fiverr reconciliation $10–$56; capture tools $12–$450/month; Hubdoc free with Xero. Risk: Commoditised and cheap; Hubdoc is free with most Xero plans.

### 5. Unpaid Invoice Tracker with Draft Reminders

Verified (7 of 7):
- Chaser, a paid accounts-receivable reminder tool, has 374 reviews on its US Xero App Store listing (count as of the snippet; it drifts). (https://apps.xero.com/us/app/chaser/reviews)
- Paidnice, a paid invoice-reminder tool, has 83 reviews on its US Xero App Store listing (count as of the snippet; it drifts). (https://apps.xero.com/us/app/paidnice/reviews)
- Intuit's 2026 late-payments survey (vendor research) reports that 59% of surveyed owners paid extra fees to get money they had already earned. (https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/)
- Intuit's 2026 late-payments survey (vendor research) reports that businesses with unpaid invoices are owed an average of $17.7K. (https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/)
- InvoiceSherpa's pricing page describes a paid plan tier sized at up to 100 open invoices ($49/month per the snippet, which this quote does not itself show); an asking price, not a sale. (https://www.invoicesherpa.com/pricing)
- Paidnice's pricing page describes an Essentials tier sized at 150 invoices monitored per month (69 USD/month per the snippet, which this quote does not itself show); an asking price. (https://www.paidnice.com/pricing)
- A QuickBooks user calls the built-in automatic invoice-reminder email awful and prefers their own template (buyer words about tone, not about spend). (https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/how-do-i-turn-off-the-feature-that-generates-emails-for-invoice/00/1498858)

Not verified (0):
- none

Research summary: Chaser (374) and Paidnice (83) Xero App Store reviews; InvoiceSherpa $49–$199/month; QuickBooks' 2026 survey: average $17.7K owed, 59% paid extra fees to get paid sooner; owners complain built-in reminders read badly. Buyers pay: $49/month (InvoiceSherpa) to £899/month (Chaser); agencies take 10–50% contingency. Risk: QuickBooks, Xero, FreshBooks and Jobber send reminders for free; the pilot must win on which invoices to chase and how the message reads.

### 6. Website Health, Accessibility and Booking-Form Check

Verified (5 of 7):
- Equalize Digital lists its single-site Accessibility Checker Professional plan at $190 per year (a list price). (https://equalizedigital.com/accessibility-checker/pricing/)
- An Irish web agency publishes a page selling daily testing of contact and booking forms (its price is not part of this quote). (https://flyingfish.ie/daily-form-testing/)
- A Milwaukee TV investigation reports small-business owners frustrated by ADA website lawsuits. (https://www.tmj4.com/about-us/lighthouse/it-gets-under-my-skin-businesses-frustrated-with-what-they-call-frivolous-ada-website-lawsuits)
- WebAIM's 2025 Million report lists missing form input labels among the most common detected failures on home pages. (https://webaim.org/projects/million/2025)
- A law-firm analysis republished on JD Supra reports that federal website accessibility lawsuit filings rose again in 2025. (https://www.jdsupra.com/legalnews/federal-court-website-accessibility-1182174/)

Not verified (2):
- AudioEye's FY2025 results post reports about 131,000 customers for its web accessibility products.: blocked by robots.txt; Could not read https://www.audioeye.com/robots.txt (HTTP 429, the site asked us to slow down) — treating as disallowed rather than assuming permission; it is retried later. (https://www.audioeye.com/post/audioeye-reports-record-fourth-quarter-and-full-year-2025-results)
- A site owner reported on Brizy's community forum that contact form submissions stopped working.: challenge page (https://support.brizy.io/hc/en-us/community/posts/360075634391-Contact-form-submission-stopped-working-loss-of-emails)

Research summary: AudioEye reports about 131,000 customers (FY2025); overlay tools about $490/year; Fiverr accessibility audits $50–$400; an Upwork audit-and-fix package from $49; form monitoring sold at €10–$30/month. Buyers pay: Free (WAVE, Lighthouse, agency lead magnets) to $25–$600 freelance audits; $190–$490/year tools. Risk: Free automated audits are everywhere; accessibility claims are a legal trap (FTC's $1M order against accessiBe). The booking-form angle is the distinct part.

### 7. CRM Duplicate and Data-Quality Check

Verified (2 of 7):
- Hivehouse Digital lists a one-off HubSpot portal audit at $750 (an asking price). (https://inbound.hivehousedigital.com/hubspot-portal-audit)
- Vantage Point lists a HubSpot portal audit package at $3,500 (an asking price). (https://vantagepoint.io/packages/hubspot-portal-audit)

Not verified (5):
- An Upwork seller lists a HubSpot dedupe and cleanup package whose Advanced tier is $620 (an asking price, not a sale).: challenge page (https://www.upwork.com/services/product/development-it-cleaned-and-deduplicated-hubspot-crm-data-2009658109512520054)
- Insycle's HubSpot Marketplace listing prices its data-cleanup app by database size with a 25,000-record minimum.: not found; HTTP 200; 54,514 characters read; quote not on the page (https://ecosystem.hubspot.com/marketplace/apps/insycle)
- HubSpot users keep a feature-request thread for bulk merging of duplicates in HubSpot's own community.: challenge page (https://community.hubspot.com/t/new-feature-bulk-merge-for-duplicates/14929)
- A HubSpot user asked in HubSpot's community for a more efficient way to find and merge duplicate contacts.: challenge page (https://community.hubspot.com/t/more-efficient-way-to-find-and-merge-duplicate-contacts/485)
- An Upwork seller's HubSpot audit and cleanup package includes a full written CRM audit report as a deliverable.: challenge page (https://www.upwork.com/services/product/admin-customer-support-hubspot-crm-audit-cleanup-pipeline-rebuild-7days-2031500511377874482)

Research summary: Insycle 4.7 from 192 G2 reviews and about 7K HubSpot installs; Koalify 3–4K installs; five Upwork sellers at $120–$620 per cleanup; review-only HubSpot audits $250–$750. Buyers pay: Dedupe apps $32–$125/month; Upwork $25–$620; consultancy audits $250–$3,500. Risk: Buyers' pain is the manual merging, which the pilot leaves to them; contact exports are personal data (needs a data-handling agreement).

### 8. Support Inbox Triage with Reply Drafts

Verified (4 of 6):
- Gorgias's About page states it serves over 16,400 merchants (a self-reported count). (https://gorgias.com/about-us)
- Gorgias's Shopify App Store listing charges $0.40 per additional ticket on its Starter plan (a list price). (https://apps.shopify.com/helpdesk)
- A small Shopify store owner (about 600 orders a month, two-person team) describes running support from email. (https://community.shopify.com/t/managing-customer-emails/621681)
- A participant in the same Shopify thread says support conversations get buried fast with a small team. (https://community.shopify.com/t/managing-customer-emails/621681)

Not verified (2):
- A buyer posted a $200 fixed-price Upwork job for a Gorgias support audit and KPI setup (a budget, not a completed payment).: challenge page (https://www.upwork.com/freelance-jobs/apply/Gorgias-Audit-Customer-Support-KPI-Setup_~022064642553080951446/)
- An Upwork seller lists Zendesk or Shopify ticket-backlog clearing with a $1,350 tier (an asking price).: challenge page (https://www.upwork.com/services/product/admin-customer-support-i-will-clear-your-zendesk-or-shopify-customer-support-ticket-backlog-2060172646883376412)

Research summary: Gorgias says it serves over 16,400 merchants with 629–705 Shopify reviews; Help Scout AI Drafts from $45/user/month; an Upwork buyer post at $200 for a support audit. Buyers pay: Helpdesks $10–$60/month; AI $0.75–$1 per resolution; VAs $7–$8/hour; one-off support audits $160–$1,100. Risk: AI reply drafts are already built into the helpdesks and into Gmail; little evidence of paying for a one-off version; customer emails are personal data.

### 9. Product Catalog Cleanup and Cross-Store Check

Verified (4 of 6):
- DataFeedWatch's Shopify listing charges $5 for every extra 1,000 products (an overage list price). (https://apps.shopify.com/datafeedwatch)
- Trunk's Shopify listing prices multichannel stock sync at $45 a month for 101-200 orders a month (a list price). (https://apps.shopify.com/trunk)
- A Shopify app markets automated catalog audits that flag missing SKUs, images and descriptions. (https://apps.shopify.com/cleancatalog)
- A brand owner posted on Amazon's seller forums about GTIN exemption problems with their listings. (https://sellercentral.amazon.com/seller-forums/discussions/t/8d796ce6-3a0e-4c1e-89f1-162b45022690)

Not verified (2):
- A Shopify app markets catalog audits that flag duplicate SKU signals, the closest app match to the pilot's single-store checks.: not found; HTTP 200; 99,225 characters read; quote not on the page (https://apps.shopify.com/catalog-health-2)
- Trade press reports that Amazon told sellers to fix their GTINs or have listings removed.: not found; HTTP 200; 5,870 characters read; quote not on the page (https://www.ecommercebytes.com/?p=17981)

Research summary: Sync apps with large review bases (Marketplace Connect about 1,700–2,000, CedCommerce Etsy 1,185, Trunk about 390); DataFeedWatch from $64/month; Upwork catalog cleanups $50–$1,200. Buyers pay: Sync apps $9–$89/month; feed tools $64–$239/month; Upwork $50–$1,200. Risk: Buyers pay for ongoing sync, not audits: the audit-only apps closest to the pilot show 0 reviews.

### 10. Short-Form Ad Variations from Your Video

Verified (2 of 6):
- A DTC Shopify brand's paid editor job post on OnlineJobs.ph asks for variations of proven-winning ads. (https://www.onlinejobs.ph/jobseekers/job/1620342)
- A Contra freelancer lists short-form Reels/TikTok ad edits at $40 per video (an asking price). (https://contra.com/s/2emZQqcl-short-form-video-ads-reels-and-tik-tok)

Not verified (4):
- This buyer's Upwork job post for ongoing Meta/UGC ad edits lists a $150 fixed-price budget (a budget, not a completed payment).: challenge page (https://www.upwork.com/freelance-jobs/apply/Meta-Ads-UGC-Video-Editor-for-Fashion-Brand-Ongoing_~022103828460516379060/)
- The same buyer's job post asks for hook variations of the same ad footage, which is the pilot's deliverable.: challenge page (https://www.upwork.com/freelance-jobs/apply/Meta-Ads-UGC-Video-Editor-for-Fashion-Brand-Ongoing_~022103828460516379060/)
- A buyer posted an Upwork job seeking an editor for high-volume ad creatives (the budget is not part of this quote).: challenge page (https://www.upwork.com/freelance-jobs/apply/Video-Editor-for-High-Volume-Creatives-100-Videos-Week_~022065162640761769665)
- A Fiverr video-ad seller's profile claims 1200+ satisfied clients (the seller's own claim, not a verified count).: challenge page (https://www.fiverr.com/softbright)

Research summary: Upwork buyer job posts with budgets ($150, and $225 for 3–4 hook variations from the same footage with captions); Fiverr video-ad sellers with 1,378 and 442 reviews. Buyers pay: $40–$200 per edited video; $99–$150 per UGC video; AI tools $15–$99/month. Risk: Meta now rewards genuinely different concepts, so hook-only cuts may count as near-duplicates; Meta's own tools, OpusClip and CapCut cap prices.
