# Ten pilot offers: offer design

Generated from the offer registry (`src/lib/offers/registry.ts` on branch `claude/ten-offers-pilots`), which the live pages read, so this document and the pages say the same thing. Every price except offer 6's is a **test price (hypothesis)**: no buyer has paid it yet. The price-basis notes summarise the buyer-evidence files in `../evidence/`, whose facts are search snippets until the worker's live-page check marks them found.

Shown on every offer page:

- This is a pilot: a small, hands-on version of the service while we learn what works for buyers. It is not a finished product. A person reviews every report before it goes to you.
- Nothing is charged on this page. If the pilot fits, we confirm the scope, the price and a delivery date with you by email before you send any files or pay anything.
- Send only what the pilot needs. Your files are used only to prepare your report, are kept only while the pilot runs, and are deleted when you ask. We never log into your systems for a pilot.

## 1. Missed-Call and Web-Inquiry Follow-Up List

*Every missed call and unanswered website inquiry in one list, most urgent first, with a draft reply for each.*

- **Status:** pilot.
- **Buyer:** Owners and office managers of home-service businesses (plumbing, HVAC, electrical, roofing, cleaning, landscaping) that take work by phone and web form.
- **Problem:** Calls come in while everyone is on a job, website inquiries sit in an inbox, and nobody can see which ones never got a reply.
- **Page:** https://hq.amberoneai.com/offers/missed-call-follow-up (sample: /offers/missed-call-follow-up/sample)

**Deliverable**

- A list of every missed call and website inquiry with no recorded reply, most urgent and oldest first, with the reason for each urgency flag.
- Repeat calls from the same number grouped into one lead, with the number of attempts.
- When your missed calls cluster by time of day, and how long replies took for the leads that did get one.
- A draft text or email reply for each open lead, written for you to review, edit and send yourself.
- Calls that mention a safety problem (gas smell, smoke, sparking) listed for a call back by a person, with no written draft.

**Pilot scope**

- One location.
- Your last 30 days of calls and web inquiries, then two weekly refreshes from new exports: three lists over two weeks.
- Up to 500 calls and 100 web inquiries per export.

**Exclusions**

- Amber does not call, text or email your customers. You send any reply yourself.
- No connection to your phone system, website or CRM: you send exports.
- No call answering and no text-message registration.
- Drafts never promise prices or arrival times.

**Onboarding: what the client sends**

- A call-log export (CSV) from your phone provider for the period.
- Your website form submissions, as an export or forwarded copies.
- Replies you already made (outbound calls, sent texts or emails), so those leads are not listed again.
- Your business hours, services and the name to sign drafts with.

**Test price:** $199 for the two-week pilot (three lists) (hypothesis).

**Price basis:** Research hypothesis $199 one-time (test $149–$249). Basis weak to moderate: comparables are subscriptions (live answering $250–$450/mo, Podium about $289/mo) or cheap text-back setups ($25–$100); no one-time missed-lead audit with a public price was found. Buyers pay for real-time response, which this pilot is not.

## 2. Stale Estimate Follow-Up List

*A weekly list of estimates that have gone quiet, the dollar value waiting, and a draft follow-up for each.*

- **Status:** pilot.
- **Buyer:** Contractors and home-service companies that send ten or more estimates a month (remodelers, roofers, HVAC, landscapers, painters).
- **Problem:** Estimates go out, the crew gets busy, and nobody follows up until the customer has hired someone else.
- **Page:** https://hq.amberoneai.com/offers/stale-estimate-follow-up (sample: /offers/stale-estimate-follow-up/sample)

**Deliverable**

- Every open estimate with no contact for 7 days or more, grouped 7–13, 14–29 and 30+ days, with the dollar value waiting in each group.
- A suggested next step for each estimate.
- A draft follow-up email or text for each, naming the job and estimate number, for you to review and send.
- A list of estimates not chased, and why: won, lost, asked not to be contacted, or too old to chase.

**Pilot scope**

- Up to 200 open estimates.
- Four weekly lists, each from that week's export.

**Exclusions**

- Amber does not contact your customers. You send any follow-up yourself.
- Drafts never change your price or offer a discount.
- No edits to your estimating software or CRM.

**Onboarding: what the client sends**

- An export of open estimates (customer, contact, job, amount, date sent, status, last contact date) from your estimating software or a spreadsheet.
- Anyone who asked not to be contacted.
- How you sign off your messages.

**Test price:** $249 for four weekly lists (hypothesis).

**Price basis:** Research hypothesis $249 for 4 weeks (test $199–$399). Basis weak: wages of a follow-up coordinator (about $15/h) and bundled platform tiers (Jobber Connect $99/mo includes quote follow-ups).

## 3. Job-Cost Exception Report

*Budget against actual for each job, and a short list of costs worth a second look, with the transactions behind each.*

- **Status:** pilot; bookkeeping-related: read-only, no tax advice, no entries, no money movement.
- **Buyer:** Owners, project managers and bookkeepers of small construction firms (general contractors, remodelers, specialty subcontractors) with 3 to 30 active jobs.
- **Problem:** Overruns and miscoded costs often surface only when a job is closed and the money is already spent.
- **Page:** https://hq.amberoneai.com/offers/job-cost-exceptions (sample: /offers/job-cost-exceptions/sample)

**Deliverable**

- For each job: budget, amount spent, percent spent and the percent complete you give us, side by side.
- Budget against actual by cost code.
- Exceptions for review: cost codes over budget, costs on codes outside a job's budget, costs on closed jobs, possible duplicate bills, and jobs where spending runs well ahead of progress.
- Each exception lists the transactions behind it and who should look at it.

**Pilot scope**

- Up to 10 active jobs.
- One month of costs: one report, then one refresh from a new export.

**Exclusions**

- Read-only: nothing is posted, recoded, paid or changed in your books.
- Not accounting, tax or legal advice, and not an audit. It flags items for you or your bookkeeper to decide.
- No login to your accounting or project software.

**Onboarding: what the client sends**

- Job budgets by cost code, as an export or spreadsheet.
- The month's cost transactions with job, cost code, vendor and amount (for example a job-cost detail export).
- Percent complete per job from your project manager.
- Your cost-code list.

**Test price:** $449 for up to 10 jobs: the report and one refresh (hypothesis).

**Price basis:** Research hypothesis $450 one-time for up to 10 jobs (test $350–$750). Basis moderate: outsourced construction bookkeeping $500–$1,200/mo, one-time cleanups $300–$1,000, job-costing software $199–$340/mo.

## 4. Receipt and Invoice Match Review

*A month of card and bank transactions matched to receipts and invoices, with every exception explained for your bookkeeper.*

- **Status:** pilot; bookkeeping-related: read-only, no tax advice, no entries, no money movement.
- **Buyer:** Bookkeepers, and owners of small businesses who chase missing receipts at month end.
- **Problem:** Month-end close stalls on missing receipts, amounts that do not match, and charges nobody recognizes.
- **Page:** https://hq.amberoneai.com/offers/receipt-invoice-matching (sample: /offers/receipt-invoice-matching/sample)

**Deliverable**

- Matched pairs: each transaction with its receipt or invoice.
- Exceptions, each explained: payments with no document, documents with no payment found, amounts that differ (a tip or a partial payment), possible duplicate charges or invoices, and documents in another currency.
- For each exception, the question your bookkeeper needs to decide.

**Pilot scope**

- One month: up to 300 transactions and their receipts and invoices.

**Exclusions**

- Read-only: nothing is categorized, posted or changed in your books.
- No tax advice, and no decisions about how anything is treated.
- No contact with your vendors.
- Receipts that cannot be read are listed, never guessed.

**Onboarding: what the client sends**

- A transaction export (CSV) for the month from your bank or card account.
- The month's receipts and invoices (PDFs or photos), or an export from your receipt tool.

**Test price:** $99 for one month of one business (bookkeepers: $149 for three client-months) (hypothesis).

**Price basis:** Research hypotheses $99 for one month (owner) or $149 for three client-months (bookkeeper). Basis moderate and pointing down: Hubdoc is free with Xero, Fiverr reconciliation $10–$56, Booke AI $129/mo.

## 5. Unpaid Invoice Tracker with Draft Reminders

*A weekly aging report, which invoices need a reminder this week and why, and a draft reminder for each.*

- **Status:** pilot; bookkeeping-related: read-only, no tax advice, no entries, no money movement.
- **Buyer:** Owners and office managers of small service businesses, agencies and trades with 20 or more open invoices.
- **Problem:** Overdue invoices slip because chasing them is awkward and nobody has a clear list each week.
- **Page:** https://hq.amberoneai.com/offers/unpaid-invoice-tracking (sample: /offers/unpaid-invoice-tracking/sample)

**Deliverable**

- An aging report (current, 1–30, 31–60, 61–90 and 90+ days past due) and the total owed by each customer.
- The invoices that need a reminder this week, and why.
- A draft reminder for each, friendly at first and firmer later, never threatening, with the exact invoice number, balance and due date, for you to review and send.
- A list of invoices not chased, and why: disputed, reminded recently, or paid.

**Pilot scope**

- Up to 200 open invoices.
- Four weekly reports, each from that week's export.

**Exclusions**

- Read-only: nothing changes in your accounting system, and no payment is taken.
- Amber does not contact your customers. You send any reminder yourself.
- No late fees, collections or legal language in the drafts. Not legal advice.

**Onboarding: what the client sends**

- An open-invoices export (number, customer, contact, issue date, due date, amount, amount paid) from your accounting software or a spreadsheet.
- Your payment terms and how customers can pay.
- Any disputed invoices, or customers not to contact.

**Test price:** $149 for four weekly reports (hypothesis).

**Price basis:** Research hypothesis $149 for 4 weeks (test $99–$199). Basis moderate: reminder tools $49–$199/mo with real review counts (Chaser, Paidnice, InvoiceSherpa); built-in reminders in QuickBooks, Xero, FreshBooks and Jobber are free.

## 6. Website Health, Accessibility and Booking-Form Check

*The Website Snapshot Report, live at $49, with a new pilot check of your booking and contact forms.*

- **Status:** live report with a pilot addition.
- **Buyer:** Small businesses whose website takes bookings or inquiries: clinics, salons, trades, studios.
- **Problem:** Booking and contact forms quietly put people off: missing labels, the wrong field types, too many fields, and no sign the message went through.
- **Page:** https://hq.amberoneai.com/offers/website-health-report (sample: /offers/website-health-report/sample)

**Deliverable**

- The Website Snapshot Report: up to 5 public pages checked from their HTML for five common accessibility problems, basic site-health items, and a plain-English fix checklist.
- Pilot addition: each booking or contact form checked for field labels, field types (phone, email, date), required markers, the number of fields, the submit wording, spam protection and a confirmation message, each with a suggested fix.

**Pilot scope**

- Up to 5 public pages and the forms on them.

**Exclusions**

- Not a WCAG, ADA, legal, security or compliance audit, and not a certification of any kind.
- No form is submitted and nothing on your site is changed.
- Public pages only: no logins or admin areas.

**Onboarding: what the client sends**

- Up to five page addresses, including your booking or contact page.
- Confirmation that you own the site or are authorized to ask for the checks.

**Test price:** $49 for up to 5 pages (the form check is included during the pilot) (existing live price).

**Price basis:** Live price $49 kept (it sits at the bottom of $50–$400 freelance audits). Research suggests testing a $79 report-plus-form bundle later; changing the live price needs the owner. Booking-form comparables are monitoring services at €10–$30/month.

## 7. CRM Duplicate and Data-Quality Check

*Duplicate contacts grouped with a suggested record to keep, plus bad emails and phones and stale leads, as a review sheet.*

- **Status:** pilot.
- **Buyer:** Small sales teams, agencies and service businesses with 1,000 to 20,000 contacts in a CRM or a spreadsheet.
- **Problem:** The same lead sits in the CRM three times under different owners, so follow-ups double up or fall through.
- **Page:** https://hq.amberoneai.com/offers/crm-cleanup (sample: /offers/crm-cleanup/sample)

**Deliverable**

- Duplicate groups (same email, same phone, same name at the same company, near-identical names), with how sure each match is and why.
- A suggested record to keep in each group, and the reason.
- Conflicts inside a group, such as different owners or stages, flagged for a person to decide.
- Data-quality issues: invalid or missing emails and phones, formatting, state codes, and stale leads.
- A proposed-changes sheet you review and apply in your own CRM.

**Pilot scope**

- One export of up to 5,000 records; one report.

**Exclusions**

- Nothing is merged, deleted or edited by Amber. You apply any change in your CRM.
- No CRM login: you send an export.
- No emailing your contacts, and no list buying or enrichment.

**Onboarding: what the client sends**

- A contacts or leads export (CSV) with name, company, email, phone, owner, stage, source, and created and last-activity dates.
- Before you send it, we agree in writing how your contacts' data is handled and when it is deleted.

**Test price:** $99 for one report on up to 5,000 records (hypothesis).

**Price basis:** Research hypothesis $99 up to 5,000 contacts ($149 up to 20,000). Basis moderate: Upwork cleanups $120–$620 that include merging, review-only audits $250–$750, dedupe apps $32–$125/mo.

## 8. Support Inbox Triage with Reply Drafts

*A week of support email sorted by type and urgency, with a reply draft for each message that needs one.*

- **Status:** pilot.
- **Buyer:** Small e-commerce, software and service teams with a shared support inbox of 50 to 500 emails a week.
- **Problem:** Urgent messages get buried under routine ones, and the same answers get typed again and again.
- **Page:** https://hq.amberoneai.com/offers/inbox-triage (sample: /offers/inbox-triage/sample)

**Deliverable**

- Every message sorted into one type: order status, billing, refund request, technical, complaint, sales question, spam or other.
- Urgency flagged with the reason, such as a double charge, a cancellation or a long wait.
- A reply draft for each message that needs one, following your policies, for your team to edit and send.
- Messages about legal threats or safety flagged for a person, with no draft.
- What customers wrote about most that week.

**Pilot scope**

- One week of support email, up to 150 messages; one report with drafts.

**Exclusions**

- Amber does not send replies or touch your inbox. You send any reply yourself.
- Drafts never promise refunds, credits or discounts.
- No access to your help desk or store: you send an export or forwarded copies.

**Onboarding: what the client sends**

- An export of a week of support email, or forwarded copies.
- Your refund and shipping policies, your tone and your sign-off.
- Before you send anything, we agree in writing how your customers' messages are handled and when they are deleted.

**Test price:** $79 for one week of email, up to 150 messages (hypothesis).

**Price basis:** Research hypothesis $79 for one week up to 150 emails ($149 up to 500). Basis weak to moderate: AI resolutions about $0.75–$1.00 each, VAs $7–$8/h, one-off support audits $160–$1,100.

## 9. Product Catalog Cleanup and Cross-Store Check

*Two stores' product exports checked for missing fields, bad barcodes, and price or stock differences, with proposed fixes.*

- **Status:** pilot.
- **Buyer:** E-commerce sellers on two or more sales channels, such as an online store plus a marketplace, with 100 to 5,000 SKUs.
- **Problem:** Prices, titles and stock drift apart between stores, and missing barcodes or images get listings rejected.
- **Page:** https://hq.amberoneai.com/offers/catalog-cleanup (sample: /offers/catalog-cleanup/sample)

**Deliverable**

- Missing required fields per store: barcode, images, description.
- Barcodes that fail the check-digit test.
- Duplicate SKUs, SKUs in one store only, and price or stock differences between stores.
- Titles over a store's length limit, and inconsistent variant names (XL, X-Large, Extra Large).
- A proposed-changes sheet you review and import yourself.

**Pilot scope**

- Up to 1,000 SKUs across two stores; one report.

**Exclusions**

- Nothing is changed in your stores, and no store login is needed.
- No pricing decisions: differences are listed for you to decide.
- Not marketplace-policy or legal advice.

**Onboarding: what the client sends**

- A product export (CSV) from each store.
- Which store is your source of truth.

**Test price:** $99 for one report on up to 1,000 SKUs (hypothesis).

**Price basis:** Research hypothesis $99 up to 1,000 SKUs ($199 up to 5,000). Basis moderate to weak: Upwork cleanups $50–$400 by size (doing the edits), feed tools $64–$84/mo; audit-only apps show no paid traction.

## 10. Short-Form Ad Variations from Your Video

*Three vertical 15-second cuts of a video you own, each with a different opening hook and captions.*

- **Status:** pilot.
- **Buyer:** Local businesses and small brands with existing video footage who post short vertical video.
- **Problem:** One good video, but each platform wants short vertical cuts with a hook in the first seconds and captions, and editing takes time.
- **Page:** https://hq.amberoneai.com/offers/video-ad-variations (sample: /offers/video-ad-variations/sample)

**Deliverable**

- Three vertical (9:16) variations of up to 15 seconds, each opening with a different hook line.
- Burned-in captions, plus caption files (SRT).
- A cut sheet showing which parts of your video each variation uses.
- One round of revisions.

**Pilot scope**

- One source video up to 3 minutes; three variations; one revision round.

**Exclusions**

- No ad buying, and no access to your ad or social accounts.
- No new filming, stock footage, voiceover or music licensing.
- No promises about views, clicks or sales.

**Onboarding: what the client sends**

- The video file, and confirmation that you own it or are authorized to use it.
- Your offer, the three points you want across, and any brand colors or logo.

**Test price:** $99 for three variations (hypothesis).

**Price basis:** Research hypothesis $99 for three variations (test $149). Basis moderate: per-video edits $40–$100, an Upwork buyer post at $225 for 3–4 variations, UGC $99–$150 per video including filming.

