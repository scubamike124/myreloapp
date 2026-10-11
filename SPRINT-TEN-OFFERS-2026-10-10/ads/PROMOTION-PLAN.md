# Promotion plan 2026-10-11.1: the ten pilot offers on Facebook Page

Generated from `src/lib/offers/promotion.ts`; the worker builds each post with the same code. Nothing here has been posted.

## Rules that must all hold before a post is created

1. The offer is marked **ready** in `src/lib/offers/readiness.ts` (the pilot runner was run on invented data through the whole path and the result read). An offer without that record is never promoted and its page takes no orders.
2. A Facebook Page account is connected (derives CONNECTED and has a chosen Page), and the Page's name matches /amber/i or the owner named it with `promo-page: <name>` on #105. A Page for another brand is never posted to.
3. The owner has not written `promo: pause` on #105 (a later `promo: resume` lifts it). If #105 cannot be read, nothing is created.
4. It is a weekday slot at 14:00 UTC (10:00 Eastern, 07:00 Pacific), at least 20 hours after the last post was queued, no more than 7 posts in 7 days, and a slot missed by more than 8 hours waits for the next one. The publish queue also paces posts on one account (Facebook: 20 minutes).
5. Nothing else is in flight on the channel, and the last two finished posts did not both fail (the owner's `promo: resume` clears that stop).
6. The post has never been created before: each post is created once and never again, whatever became of it.

Every state change is written to a ledger and shown in the offer tracker on #105 with the post's live link or its exact error. Advertising counts as started on a channel only when a post there is live with its link recorded.

## The owner's switches (plain lines in a #105 comment from the owner's account)

- `promo: pause` stops new posts and cancels any not yet sent. `promo: resume` starts again.
- `promo-page: <Page name>` allows a connected Page whose name does not contain "amber".

## Order, readiness and text

| # | Offer | Ready today | Tracked link |
|---|---|---|---|
| 1 | Website Health, Accessibility and Booking-Form Check | needs-work | https://hq.amberoneai.com/offers/website-health-report?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 2 | Missed-Call and Web-Inquiry Follow-Up List | ready | https://hq.amberoneai.com/offers/missed-call-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 3 | Unpaid Invoice Tracker with Draft Reminders | ready | https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 4 | Product Catalog Cleanup and Cross-Store Check | ready | https://hq.amberoneai.com/offers/catalog-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 5 | Stale Estimate Follow-Up List | ready | https://hq.amberoneai.com/offers/stale-estimate-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 6 | CRM Duplicate and Data-Quality Check | ready | https://hq.amberoneai.com/offers/crm-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 7 | Support Inbox Triage with Reply Drafts | needs-work | https://hq.amberoneai.com/offers/inbox-triage?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 8 | Receipt and Invoice Match Review | ready | https://hq.amberoneai.com/offers/receipt-invoice-matching?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 9 | Job-Cost Exception Report | ready | https://hq.amberoneai.com/offers/job-cost-exceptions?src=facebook-page&utm_campaign=pilot-launch-2026-10 |
| 10 | Short-Form Ad Variations from Your Video | not-deliverable | https://hq.amberoneai.com/offers/video-ad-variations?src=facebook-page&utm_campaign=pilot-launch-2026-10 |

### facebook-page:website-health-report

> Our Website Snapshot Report is live: up to five public pages checked from their HTML for common accessibility problems and basic site-health items, with a plain-English fix list. It is a first-pass screen, not a WCAG or ADA audit.
>
> New, as a pilot: we also check booking and contact forms for labels, field types, required markers, submit wording and a confirmation message, each with a suggested fix. You send up to five page addresses and confirm you own the site or may ask for the checks. We never submit your forms or change your site, and a person reviews every report.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: https://hq.amberoneai.com/offers/website-health-report?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:missed-call-follow-up

> New pilot for home-service businesses: one follow-up list for missed calls and website inquiries.
>
> You send a call-log export from your phone provider and your website form submissions. We send back a list of every missed call and inquiry with no recorded reply, sorted by urgency and age, with a draft text or email reply for each. Calls that mention a safety problem are flagged for you to call back instead. You review the drafts and send the ones you want yourself. We never log into your systems or contact your customers, and a person reviews every list.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: https://hq.amberoneai.com/offers/missed-call-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:unpaid-invoice-tracking

> New pilot for small service businesses: an unpaid invoice tracker with draft reminders.
>
> Each week you send an export of your open invoices, with customer contact names and emails, from your accounting software or a spreadsheet. We send back an aging report, the invoices that need a reminder and why, and a draft reminder for each: friendly at first, firmer later, never threatening. You review the drafts and send them yourself. It is read-only: nothing changes in your accounting system, and we never contact your customers. A person reviews every report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:catalog-cleanup

> New pilot for sellers on two stores: a product catalog cleanup and cross-store check.
>
> You send a product export (CSV) from each store, and we treat your online store as the source of truth. We check both for missing fields, barcodes that fail the check-digit test, duplicate SKUs, and price or stock differences between the stores, and send back a review sheet of proposed changes that you apply yourself. Nothing is changed in your stores, no store login is needed, and pricing decisions stay with you. A person reviews the report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: https://hq.amberoneai.com/offers/catalog-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:stale-estimate-follow-up

> Contractors: we are starting a small pilot of a weekly list of the estimates that have gone quiet.
>
> Each week you send an export of your open estimates from your estimating software or a spreadsheet. We send back the ones with no contact for 7 days or more, grouped by age, the dollar value waiting in each group, and a draft follow-up for each that names the job and the estimate number. You review the drafts and send them yourself. We never contact your customers, the drafts never change your price, and a person reviews every list.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: https://hq.amberoneai.com/offers/stale-estimate-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:crm-cleanup

> New pilot for small sales teams and service businesses: a CRM duplicate and data-quality check.
>
> You send a contacts or leads export (CSV) from your CRM or spreadsheet. We send back a review sheet: duplicate groups with a suggested record to keep and the reason, bad or missing emails and phones, and stale leads. Conflicts, such as two owners on one contact, are flagged for a person to decide. Nothing is merged, deleted or edited by us; you apply any change in your own CRM, and we never log into it. A person reviews the sheet before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: https://hq.amberoneai.com/offers/crm-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:inbox-triage

> Small support teams: we are starting a pilot of inbox triage with reply drafts.
>
> You send a week of support email as an export, with your refund and shipping policies. We send back every message sorted by type and urgency, with the reason for each urgent flag, and a reply draft for each message that needs one, for your team to edit and send. Legal threats and safety issues are flagged for a person, with no draft. We never touch your inbox or send anything, and the drafts never promise refunds. A person reviews the report before it reaches you.
>
> You can see a sample made from invented data on the page, and ask a question through its form: https://hq.amberoneai.com/offers/inbox-triage?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:receipt-invoice-matching

> For bookkeepers and small businesses, a new pilot: a receipt and invoice match review for one month.
>
> You send one month of bank or card transactions as a CSV, with that month's receipts and invoices as a receipt-tool export or spreadsheet (not PDFs or photos). We match transactions to their documents and list the exceptions for your bookkeeper to decide: payments with no receipt, documents with no payment, amounts that differ and possible duplicates, each with the question to answer. It is read-only and gives no tax or accounting advice, and a person reviews it before it reaches you.
>
> You can see a sample made from invented data on the page, and ask a question through its form: https://hq.amberoneai.com/offers/receipt-invoice-matching?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:job-cost-exceptions

> New pilot for small construction firms: a job-cost exception report.
>
> You send job budgets by cost code, a month of cost transactions and the percent complete for each job, as exports or spreadsheets. We send back budget against actual for each job and cost code, and a short list of exceptions to review: codes over budget, costs on closed jobs and possible duplicate bills, each with the transactions behind it. It is read-only, nothing in your books is changed, and it gives no tax or accounting advice. A person reviews the report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: https://hq.amberoneai.com/offers/job-cost-exceptions?src=facebook-page&utm_campaign=pilot-launch-2026-10

### facebook-page:video-ad-variations

> A new pilot for local businesses and small brands: short ad variations cut from a video you already own.
>
> You send the video file, confirm you own it or may use it, and tell us your offer and the points you want across. We send back three vertical 15-second cuts, each opening with a different hook, with captions burned in, caption files, and a cut sheet showing which parts of your video each one uses. One round of revisions is included. We do not buy ads or touch your ad or social accounts, and we make no promises about views or sales. A person reviews every cut.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: https://hq.amberoneai.com/offers/video-ad-variations?src=facebook-page&utm_campaign=pilot-launch-2026-10

