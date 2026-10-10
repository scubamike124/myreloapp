# Ten pilot offers: demo QA report

Run 2026-10-10T17:45:05.662Z with `npx tsx scripts/offers-qa.ts`. Each demo runs on invented data; the shared checks (no banned claims, nothing says it was sent, drafts labelled, no empty sections, every stage completed, and for the bookkeeping offers no tax advice and read-only wording) are added to each demo's own checks. The contact check scans every email, phone number and web address in the output for invented-only values.

| # | Offer | QA | Failed stages | Contacts | Run time | Direct cost | Output |
|---|---|---|---|---|---|---|---|
| 1 | Missed-Call and Web-Inquiry Follow-Up List | 17 of 17 QA checks passed | 0 | all invented | 8.4 ms | $0.00 | 6 sections |
| 2 | Stale Estimate Follow-Up List | 15 of 15 QA checks passed | 0 | all invented | 4.6 ms | $0.00 | 4 sections |
| 3 | Job-Cost Exception Report | 14 of 14 QA checks passed | 0 | all invented | 6.0 ms | $0.00 | 6 sections |
| 4 | Receipt and Invoice Match Review | 13 of 13 QA checks passed | 0 | all invented | 7.5 ms | $0.00 | 4 sections |
| 5 | Unpaid Invoice Tracker with Draft Reminders | 18 of 18 QA checks passed | 0 | all invented | 5.6 ms | $0.00 | 7 sections |
| 6 | Website Health, Accessibility and Booking-Form Check | 13 of 13 QA checks passed | 0 | all invented | 17.4 ms | $0.00 | 6 sections |
| 7 | CRM Duplicate and Data-Quality Check | 12 of 12 QA checks passed | 0 | all invented | 7.0 ms | $0.00 | 5 sections |
| 8 | Support Inbox Triage with Reply Drafts | 14 of 14 QA checks passed | 0 | all invented | 9.9 ms | $0.00 | 5 sections |
| 9 | Product Catalog Cleanup and Cross-Store Check | 11 of 11 QA checks passed | 0 | all invented | 4.7 ms | $0.00 | 5 sections |
| 10 | Short-Form Ad Variations from Your Video | 14 of 14 QA checks passed | 0 | all invented | 5.2 ms | $0.00 | 6 sections |

**Total failing items: 0.**

## Every check, per offer

### 1. Missed-Call and Web-Inquiry Follow-Up List

Sample: missed-call follow-up list for Bluebird Plumbing & Heating (invented business and data). As of 2026-10-09. 32 calls in the call log, 12 of them missed, and 4 website inquiries, Fri 2 Oct to Thu 8 Oct 8 follow-ups (calls, texts and emails) from the business's own records Business hours: Mon to Sat, 7:00am to 6:00pm Services: plumbing repairs, water heaters, drain cleaning, heating

- PASS `missed.open-leads-once` Every open lead appears exactly once in the open-leads table
- PASS `missed.no-draft-for-replied-or-safety` No draft for a lead already replied to or on the call-back-now list
- PASS `missed.one-draft-per-open-lead` Each open lead not on the call-back list has exactly one draft (6 drafts for 6 leads)
- PASS `missed.urgent-reasons` Urgent and safety rows list the words that matched
- PASS `missed.text-length` Text message drafts are 320 characters or fewer
- PASS `missed.drafts-name-business` Every draft names the business
- PASS `missed.no-promises` No draft quotes a price or promises a discount, refund, credit or arrival time
- PASS `missed.channel-fits-contact` Text drafts go to a phone number; email drafts go to an email address and have a subject
- PASS `missed.summary-matches-tables` Summary counts equal the tables' row counts
- PASS `missed.attempts-sum` Attempt counts and the time-of-day table add up to the missed calls (attempts 12, time of day 12 (total row 12), missed calls 12)
- PASS `missed.safety-listed` Every safety lead is on the call-back-now list once and marked in the table
- PASS `missed.waiting-from-asof` Hours waiting are counted from the as-of time
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 2. Stale Estimate Follow-Up List

Sample: stale estimate follow-up list for Ridgeview Remodeling (invented business and data). As of 2026-10-09. 14 estimates in the export, 10 of them open (worth $100,740.75) Follow up after 7 days without contact; check whether to re-quote once an estimate is more than 60 days old Trade: kitchen, bath and interior remodeling

- PASS `estimates.buckets-reconcile` Bucket counts and totals match the table and add up to the stale total (stale total $92,340.75, buckets $92,340.75, table $92,340.75)
- PASS `estimates.threshold-respected` Every open estimate quiet 7+ days is listed once, and nothing quieter is listed
- PASS `estimates.days-quiet-from-asof` Days quiet are counted to the as-of date from the later of sent and last contact
- PASS `estimates.next-step-by-bucket` Each suggested next step fits how long the estimate has been quiet (or its age)
- PASS `estimates.no-draft-for-excluded` No draft for won, lost, declined, expired, do-not-contact, flagged or 60+ day estimates
- PASS `estimates.drafts-name-estimate-and-job` Each draft names its estimate number and job and goes to that customer (6 drafts for 6 estimates)
- PASS `estimates.price-unchanged` Every dollar figure in a draft is the estimate's own amount
- PASS `estimates.no-discount-words` No draft offers a discount, deal or special price
- PASS `estimates.not-chased-reasons` Every estimate not chased is listed once with its reason, and not in the follow-up table
- PASS `estimates.text-length` Text message drafts are 320 characters or fewer
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 3. Job-Cost Exception Report

Sample: job cost exceptions for Alder Creek Builders (invented business and data). As of 2026-10-09. 6 jobs with budgets by cost code, 13 codes in the cost-code list, 48 cost transactions dated through 2026-10-09 Flagged: a cost code over budget by more than 10% and more than $500.00; an active job whose % spent is more than 15 points ahead of % complete; same vendor and amount on one job within 3 days

- PASS `jobcost.actuals-reconcile` Placed transactions add up to the actuals by cost code and by job, to the cent (placed $118,885.05; by cost code $118,885.05; by job $118,885.05)
- PASS `jobcost.every-row-accounted` Every cost row is in the actuals or listed under Could not be placed (48 placed and 0 not placed, of 48 rows)
- PASS `jobcost.exceptions-referenced` Every exception names the transactions or budget line behind it
- PASS `jobcost.duplicates-once` Each possible duplicate pair meets the rule and is reported exactly once (1 reported, 1 expected)
- PASS `jobcost.flags-match-thresholds` Over-budget and ahead-of-progress flags match the thresholds and the numbers shown
- PASS `jobcost.percentages-from-shown` Every percentage, gap and remaining amount follows from the numbers shown
- PASS `jobcost.no-action-wording` No exception wording recommends posting, recoding, paying or writing off
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed
- PASS `std.no-tax-advice` No tax advice (read-only review: it flags and explains)
- PASS `std.read-only` Nothing says Amber posted an entry, moved money, paid, refunded or decided

### 4. Receipt and Invoice Match Review

Sample: receipt and invoice matching for Larkspur Design Studio (invented business and data). As of 2026-10-09. 19 bank and card transactions from 2 accounts (Card 4417, Checking 2290), 2026-09-01 to 2026-09-30 19 receipts and invoices, with vendor, date, total and invoice number as read from each document Tolerance: 3 days either way and $0.00 on the amount; 1 vendor alias for bank text

- PASS `receipts.transactions-one-bucket` Every transaction is in exactly one bucket (19 transactions, each in one bucket)
- PASS `receipts.documents-one-bucket` Every document is in exactly one bucket (19 documents, each in one bucket)
- PASS `receipts.matches-within-tolerance` Every matched pair agrees on amount and date within tolerance, and on vendor
- PASS `receipts.foreign-never-matched` No document in another currency is matched or paired
- PASS `receipts.no-tax-or-posting-words` No tax words, and no posting, categorising or payment language
- PASS `receipts.exceptions-explained` Every exception says what was found and ends with the bookkeeper's decision
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed
- PASS `std.no-tax-advice` No tax advice (read-only review: it flags and explains)
- PASS `std.read-only` Nothing says Amber posted an entry, moved money, paid, refunded or decided

### 5. Unpaid Invoice Tracker with Draft Reminders

Sample: unpaid invoice tracking for Harbor Lane Design Co. (invented business and data). As of 2026-10-09. 13 invoices in the open-invoices export, issued May 15 to Sept 25 Terms: Net 30. A reminder is due when an invoice is past due, not disputed, and has had no reminder in the last 14 days

- PASS `invoices.aging-reconciles` Aging buckets add up to the total outstanding, to the cent (buckets $22,695.50, total row $22,695.50, summary $22,695.50, expected $22,695.50)
- PASS `invoices.customers-reconcile` Outstanding by customer adds up to the total outstanding (customers $22,695.50 over 11 invoices; expected $22,695.50 over 11)
- PASS `invoices.overdue-reconciles` The overdue total equals the past-due aging buckets (summary 8 invoices, $16,545.50; buckets 8, $16,545.50)
- PASS `invoices.reminder-rule` Reminders listed exactly for past-due, undisputed invoices not reminded in the last 14 days
- PASS `invoices.drafts-exact` Each draft states its invoice number, balance and due date exactly as computed (5 drafts for 5 reminders)
- PASS `invoices.no-draft-for-excluded` No draft for disputed, paid, credit-balance, recently reminded, not-yet-due or flagged invoices
- PASS `invoices.no-threat-words` No draft mentions fees, interest, collections, legal action, credit reports or a final notice
- PASS `invoices.partial-payments` Drafts and the reminder table show what is still owed, after partial payments
- PASS `invoices.tone-by-age` Each draft's tone fits its age: friendly, then firm and polite, then firm with an offer to talk
- PASS `invoices.not-chased-reasons` Every invoice not chased is listed once with its reason, and not in the reminder table
- PASS `invoices.money-format` Every amount is written like $1,234.56
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed
- PASS `std.no-tax-advice` No tax advice (read-only review: it flags and explains)
- PASS `std.read-only` Nothing says Amber posted an entry, moved money, paid, refunded or decided

### 6. Website Health, Accessibility and Booking-Form Check

Sample: website health report with a booking and contact form check for Brightside Dental (invented business and data). As of 2026-10-09. 3 invented pages of Brightside Dental's site (brightside-dental.example): home page, /book page, contact page. The HTML was supplied with this sample; nothing was fetched. Response headers were supplied for the first page only, for the site-health checks. No form was submitted: the form checks read the HTML only. Report date: 2026-10-09.

- PASS `web.findings-named` Every form finding names its form and field (16 findings, each with its form and field)
- PASS `web.findings-have-fixes` Every form finding has a severity (high, medium or low) and a plain-English fix
- PASS `web.disclaimer` The disclaimer is present, and says no form was submitted and what happens after submit was not seen
- PASS `web.booking-form-detected` Every form that asks for a date, time or appointment is read as a booking form (/book page, form #appointment-request: read as booking)
- PASS `web.field-count` Every input, select and textarea in each form's HTML is accounted for (visible, hidden, honeypot or button)
- PASS `web.no-compliance-claims` Nothing claims the site is compliant, certified or accessible
- PASS `web.invented-data` Every address, email and phone number in the sample is invented (example domains, 555-01xx)
- PASS `web.pages-covered` Every page read has a row in the accessibility table
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 7. CRM Duplicate and Data-Quality Check

Sample: CRM cleanup review sheet for Lakeline Commercial Cleaning (invented business and data). As of 2026-10-09. 40 contact records from Contacts export (invented) Stages: 18 lead, 10 qualified, 11 customer, 1 lost Owners: Dee Walsh, Priya Nair, Sam Ortiz A lead or qualified contact counts as stale after 120 days without activity

- PASS `crm.one-group-per-record` Each record is in at most one duplicate group, and every group has two or more records
- PASS `crm.keep-in-group` The suggested record to keep is a member of its group
- PASS `crm.certain-share-email` Every certain group has records that share an email
- PASS `crm.changes-format-only` Proposed changes only fix formatting: none deletes, merges or rewrites a value
- PASS `crm.summary-counts` The summary's counts equal the rows in each section
- PASS `crm.stale-leads` Stale leads are exactly the leads and qualified contacts with no activity for more than 120 days
- PASS `crm.no-change-claims` Nothing says a record was merged, updated, applied or deleted
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 8. Support Inbox Triage with Reply Drafts

Sample: support inbox triage for Bramblewood Home Goods (invented business and data). As of 2026-10-09. 25 support emails from one week of a shared inbox Refund policy: returns within 30 days of delivery; usual shipping time 3–5 business days

- PASS `inbox.one-category` Every message appears once with exactly one known category
- PASS `inbox.drafts-where-needed` One draft for each message that needs a reply, and none for spam or needs-a-person messages
- PASS `inbox.order-number-in-drafts` Drafts include the order number when the message has one
- PASS `inbox.asks-for-order-number` Order-related drafts ask for the order number when the message has none
- PASS `inbox.no-promises` No draft promises a refund, credit, discount or compensation
- PASS `inbox.draft-length` Every draft is 1,200 characters or fewer
- PASS `inbox.high-has-reason` Every high-urgency message says why
- PASS `inbox.summary-counts` The summary's counts match the triage table, the drafts and the needs-a-person list
- PASS `inbox.no-change-claims` Nothing says a refund, cancellation or change was made
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 9. Product Catalog Cleanup and Cross-Store Check

Sample: two-store catalog cleanup for Larkfield Linen Co. (invented business and data). As of 2026-10-09. 16 rows from Online storefront and 17 rows from Marketplace listing export Rules: titles up to 255 characters in Online storefront and 200 in Marketplace listing export; descriptions of at least 50 characters; GTIN required in Marketplace listing export; brand required in Marketplace listing export; prices must match to the cent 5 prices given as text (such as "$26.00") read as numbers 1 SKU with extra spaces or lowercase letters matched after cleaning

- PASS `catalog.gtin-validator` The GTIN check accepts valid invented codes (8, 12, 13 and 14 digits, leading zeros kept) and rejects a wrong check digit, letters and wrong lengths
- PASS `catalog.issues-name-store-and-sku` Every issue names a store and a SKU
- PASS `catalog.cross-store-target` Changes that resolve a difference between stores target only Marketplace listing export, never the source of truth, and inventory is never changed
- PASS `catalog.bad-gtins-flagged` Every GTIN that fails the check is listed as an issue
- PASS `catalog.summary-counts` The summary's counts equal the rows in each section
- PASS `catalog.no-change-claims` Nothing says a listing was updated, applied or imported
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

### 10. Short-Form Ad Variations from Your Video

Sample: three 15-second vertical video ad cuts for Cedar Hollow Bike Repair (invented business and data). As of 2026-10-09. Source: cedar-hollow-testimonial.mp4, 52 s, 1920×1080 at 30 fps (invented). Owner confirmed: yes. Transcript: 13 lines of an invented customer testimonial. Brief: Bike tune-up, booked online; for Adults nearby with a bike they have stopped riding; 3 hooks; end card "Book a tune-up at cedarhollowbikes.example"; for Instagram Reels, TikTok, YouTube Shorts. Limits: 15 s per variation; captions at most 32 characters a line and 2 lines a card.

- PASS `video.owner-confirmed` The client confirmed they own the video or are authorised to use it
- PASS `video.length` Each variation is at most 15 seconds (clips plus the 2-second end card) (14.200 s, 13.800 s, 14.400 s)
- PASS `video.cuts-in-source` Every cut lies inside the source video, and clips do not overlap within a variation
- PASS `video.crop-9x16` The crop is even, fits inside the source frame, and the output is 9:16 (crop 608×1080 at x=656, y=0 from 1920×1080; output 1080×1920)
- PASS `video.caption-lines` Every caption line is at most 32 characters and every card at most 2 lines (read back from the SRT)
- PASS `video.caption-timing` Captions are timed inside each cut, in order, without overlapping
- PASS `video.claims` Hooks and the call to action make no guarantee, certification, compliance or results claim
- PASS `video.hooks-differ` The three variations open with three different hooks
- PASS `video.invented-data` Every address, email and phone number in the brief and transcript is invented
- PASS `std.no-banned-claims` No claims of guarantees, certification, compliance, affiliation or unmeasured results
- PASS `std.nothing-sent` Nothing says a message was sent (Amber drafts; a person sends)
- PASS `std.drafts-labelled` Every section of messages is labelled as drafts
- PASS `std.no-empty-sections` No empty section without a note saying why
- PASS `std.no-failures` Every stage of the demo completed

