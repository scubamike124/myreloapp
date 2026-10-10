# Ten pilot offers: organic launch posts and ad copy

Sprint workstream 8 (ads), 2026-10-10. **Nothing here has been posted, and the ad variants are not to be bought.** The owner decides what is published.

- Source of truth: `src/lib/offers/ad-copy.ts` in amberai (merged in #789). This file is generated from it; if the copy changes there, regenerate this file rather than editing it by hand.
- Checks: `src/lib/offers/__tests__/ad-copy.test.ts` (run `npx tsx --test src/lib/offers/__tests__/ad-copy.test.ts`). It enforces the owner's rules on every string: `claimIssues` from `qa.ts` is empty; every post says pilot; no prices or `$`; no "DM", "direct message", "email us", "inbox us"; no guarantee, certified, compliant, partner, trusted or hype words; no unmeasured results, percentages or customer counts; no emojis, no em or en dashes, no hashtag walls, at most one exclamation mark in all ten offers (there are none); the length limits below.
- Channel status: see `CHANNELS.md` in this folder. **No owner-owned business page is verified as connected for organic posting**, so these posts are ready to publish but not scheduled.

## How to post

1. **Organic only, and only on owner-owned business channels that are already connected.** Post as the business on its own pages (for example Amber One AI's LinkedIn or Facebook page, or its X, Threads or Bluesky account). No boosting, no promoted posts, no paid placement, no spend of any kind. The owner can also paste any post here by hand on their own pages.
2. **Not in groups, communities, forums or other people's pages**, and no tagging people or businesses to reach them. Those are not owner-owned channels.
3. **One offer per post.** Space posts out: at most one or two offers a day on one page, a few hours apart. (The only measured burst on record, four videos to one TikTok account in about twenty minutes on 2026-08-01, left three of them held for review for a while: commit `602fe0e`.)
4. **Replace `{link}` with the offer link for that channel**: `https://hq.amberoneai.com/offers/<offer>?src=<channel>&utm_campaign=pilot-launch-2026-10`, built by `offerLink(offer, channel)`. Use these channel names: `linkedin-page`, `facebook-page`, `x`, `threads`, `bluesky` (lowercase letters, digits and hyphens, at most 40 characters; `offerLink` cleans or refuses anything else). The offer page passes `src` and `utm_campaign` to the visit counter and the inquiry form (`src/app/offers/visit-ping.tsx`, `src/app/offers/inquiry-form.tsx`), so the inquiry tracker attributes each visit and inquiry to the post's channel. A link without `?src=` is counted as direct.
5. **Which text where.** The launch post is for a LinkedIn or Facebook business page (each is at most 700 characters). The short post is for X, Threads or Bluesky: at most 260 characters with the link counted as 23, as X counts it; Bluesky counts the link as written, and every short post still fits Bluesky's 300 with the full `bluesky` link. Instagram and TikTok captions do not carry a clickable link, so these text posts are not meant for them.
6. **Post the text as it is.** Do not add prices, results, testimonials, emojis or hashtags. If a word has to change, change it in `ad-copy.ts` and rerun the test.
7. **Questions go to the form on the page.** If someone comments, answer in the comment thread or point to the form; do not move the conversation to a direct message or email during the sprint.
8. **Keep a record.** For each post: the time, the channel, the offer, the post's URL and the exact link used. List them in a comment on #105.

Ad variants: written to Meta's recommended lengths (headline at most 40 characters, primary text at most 125, description at most 30) so they are ready if the owner ever approves paid ads. They are not to be bought in this sprint. Each one says pilot.

## The ten offers

### 1. Missed-Call and Web-Inquiry Follow-Up List (`missed-call-follow-up`)

Page: https://hq.amberoneai.com/offers/missed-call-follow-up

**Who it is for, and where:** For owners and office managers of home-service businesses (plumbing, HVAC, electrical, roofing, cleaning); post it on our own Facebook page first, then our LinkedIn page.

**Launch post** (LinkedIn or Facebook page; 676 characters before the link is filled in)

> New pilot for home-service businesses: one follow-up list for missed calls and website inquiries.
>
> You send a call-log export from your phone provider and your website form submissions. We send back a list of every missed call and inquiry with no recorded reply, sorted by urgency and age, with a draft text or email reply for each. Calls that mention a safety problem are flagged for you to call back instead. You review the drafts and send the ones you want yourself. We never log into your systems or contact your customers, and a person reviews every list.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/missed-call-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/missed-call-follow-up?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 220 characters as X counts it

> Pilot for home-service businesses: send your call log and web form export, get every missed call and inquiry with no reply, most urgent first, with draft replies to review. Sample (invented data): https://hq.amberoneai.com/offers/missed-call-follow-up?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Missed calls, sorted for follow-up | Pilot: send your call log and web form export. Get every unanswered lead, most urgent first, with draft replies. | Pilot. You send every reply. |
| B | Which callers never heard back? | A pilot for home-service businesses: one list of calls and inquiries with no reply, plus drafts you review and send. | Sample made from invented data |

### 2. Stale Estimate Follow-Up List (`stale-estimate-follow-up`)

Page: https://hq.amberoneai.com/offers/stale-estimate-follow-up

**Who it is for, and where:** For owners and office staff at contracting firms that send ten or more estimates a month; post it on our own LinkedIn and Facebook business pages.

**Launch post** (LinkedIn or Facebook page; 654 characters before the link is filled in)

> Contractors: we are starting a small pilot of a weekly list of the estimates that have gone quiet.
>
> Each week you send an export of your open estimates from your estimating software or a spreadsheet. We send back the ones with no contact for 7 days or more, grouped by age, the dollar value waiting in each group, and a draft follow-up for each that names the job and the estimate number. You review the drafts and send them yourself. We never contact your customers, the drafts never change your price, and a person reviews every list.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/stale-estimate-follow-up?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/stale-estimate-follow-up?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 198 characters as X counts it

> Pilot for contractors: send a weekly export of open estimates, get back the ones gone quiet, the dollar value waiting, and a draft follow-up for each. Sample (invented data): https://hq.amberoneai.com/offers/stale-estimate-follow-up?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Estimates gone quiet, listed weekly | Pilot for contractors: a weekly list of quiet estimates, the dollar value waiting, and a draft follow-up for each. | Pilot. You send each follow-up |
| B | Which estimates need a follow-up? | Send an export of open estimates. This pilot returns the quiet ones by age, with drafts you review and send. | Sample made from invented data |

### 3. Job-Cost Exception Report (`job-cost-exceptions`)

Page: https://hq.amberoneai.com/offers/job-cost-exceptions

**Who it is for, and where:** For owners, project managers and bookkeepers at construction firms with 3 to 30 active jobs; post it on our own LinkedIn page first, then our Facebook page.

**Launch post** (LinkedIn or Facebook page; 673 characters before the link is filled in)

> New pilot for small construction firms: a job-cost exception report.
>
> You send job budgets by cost code, a month of cost transactions and the percent complete for each job, as exports or spreadsheets. We send back budget against actual for each job and cost code, and a short list of exceptions to review: codes over budget, costs on closed jobs and possible duplicate bills, each with the transactions behind it. It is read-only, nothing in your books is changed, and it gives no tax or accounting advice. A person reviews the report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/job-cost-exceptions?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/job-cost-exceptions?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 214 characters as X counts it

> Pilot for small construction firms: send job budgets and a month of costs, get budget against actual by cost code and a short list of exceptions to review. Read-only. Sample (invented data): https://hq.amberoneai.com/offers/job-cost-exceptions?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Job-cost exceptions, ready to review | Pilot for small builders: budget against actual by cost code, plus codes over budget and possible duplicate bills. | Read-only pilot report |
| B | Which job costs need a second look? | A read-only pilot: send budgets and a month of costs, get a short exception list with the transactions behind each. | Sample made from invented data |

### 4. Receipt and Invoice Match Review (`receipt-invoice-matching`)

Page: https://hq.amberoneai.com/offers/receipt-invoice-matching

**Who it is for, and where:** For bookkeepers, and owners of small businesses who chase receipts at month end; post it on our own LinkedIn page first, then our Facebook page.

**Launch post** (LinkedIn or Facebook page; 684 characters before the link is filled in)

> For bookkeepers and small businesses, a new pilot: a receipt and invoice match review for one month.
>
> You send one month of bank or card transactions as a CSV, with that month's receipts and invoices. We match transactions to their documents and list the exceptions for your bookkeeper to decide: payments with no receipt, documents with no payment, amounts that differ and possible duplicates, each with the question to answer. Receipts we cannot read are listed, never guessed. It is read-only and gives no tax or accounting advice, and a person reviews it before it reaches you.
>
> You can see a sample made from invented data on the page, and ask a question through its form: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/receipt-invoice-matching?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/receipt-invoice-matching?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 217 characters as X counts it

> Pilot for bookkeepers: send a month of bank or card transactions plus receipts and invoices, get them matched and every exception explained for you to decide. Read-only. Sample (invented data): https://hq.amberoneai.com/offers/receipt-invoice-matching?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Missing receipts, listed and explained | Pilot: a month of transactions matched to receipts and invoices, with each exception explained for your bookkeeper. | Read-only pilot review |
| B | Month-end receipts, matched | A read-only pilot for bookkeepers: the matched pairs, then the exceptions, each with the question you need to decide. | Sample made from invented data |

### 5. Unpaid Invoice Tracker with Draft Reminders (`unpaid-invoice-tracking`)

Page: https://hq.amberoneai.com/offers/unpaid-invoice-tracking

**Who it is for, and where:** For owners and office managers of small service businesses, agencies and trades with 20 or more open invoices; post it on our own LinkedIn and Facebook business pages.

**Launch post** (LinkedIn or Facebook page; 655 characters before the link is filled in)

> New pilot for small service businesses: an unpaid invoice tracker with draft reminders.
>
> Each week you send an export of your open invoices from your accounting software or a spreadsheet. We send back an aging report, the invoices that need a reminder and why, and a draft reminder for each: friendly at first, firmer later, never threatening. You review the drafts and send them yourself. It is read-only: nothing changes in your accounting system, and we never contact your customers. A person reviews every report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 214 characters as X counts it

> Pilot for small service businesses: send a weekly open-invoices export, get an aging report, the invoices that need a reminder and why, and a draft reminder for each. Sample (invented data): https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Overdue invoices, one list a week | Pilot: a weekly aging report and a draft reminder for each invoice that needs one. You review and send them yourself. | Read-only pilot report |
| B | Which invoices need a reminder? | A read-only pilot for service businesses: send an open-invoices export, get the ones to chase this week and why. | Sample made from invented data |

### 6. Website Health, Accessibility and Booking-Form Check (`website-health-report`)

Page: https://hq.amberoneai.com/offers/website-health-report

**Who it is for, and where:** For small businesses whose website takes bookings or inquiries, such as clinics, salons, trades and studios; post it on our own Facebook and LinkedIn business pages.

**Note for offer 6:** these posts say the Website Snapshot Report is live and the form check is the pilot, as the owner's offer list says. The report is orderable through the owner's published Ko-fi Commission (commit `c5a1d20`, #774; #105 comment 6092677936: the owner reached Ko-fi's payment screen, no test payment made); the #105 listings comment (id 6074182151, as of 2026-10-10 17:01Z) says the site's own checkout is still in test mode. The posts send people to the offer page and its form, not to a checkout.

**Launch post** (LinkedIn or Facebook page; 693 characters before the link is filled in)

> Our Website Snapshot Report is live: up to five public pages checked from their HTML for common accessibility problems and basic site-health items, with a plain-English fix list. It is a first-pass screen, not a WCAG or ADA audit.
>
> New, as a pilot: we also check booking and contact forms for labels, field types, required markers, submit wording and a confirmation message, each with a suggested fix. You send up to five page addresses and confirm you own the site or may ask for the checks. We never submit your forms or change your site, and a person reviews every report.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/website-health-report?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/website-health-report?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 218 characters as X counts it

> Our Website Snapshot Report is live, and we are adding a pilot check of booking and contact forms: labels, field types and confirmation messages. Not a WCAG or ADA audit. Sample (invented data): https://hq.amberoneai.com/offers/website-health-report?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | A closer look at your booking forms | A pilot check of your booking and contact forms, added to our Website Snapshot Report. Not a WCAG or ADA audit. | Pilot form check included |
| B | Website check plus a form review | Up to five public pages checked from their HTML, with a plain-English fix list and a new pilot check of your forms. | Sample made from invented data |

### 7. CRM Duplicate and Data-Quality Check (`crm-cleanup`)

Page: https://hq.amberoneai.com/offers/crm-cleanup

**Who it is for, and where:** For small sales teams, agencies and service businesses with 1,000 to 20,000 contacts in a CRM or a spreadsheet; post it on our own LinkedIn page first, then our Facebook page.

**Launch post** (LinkedIn or Facebook page; 669 characters before the link is filled in)

> New pilot for small sales teams and service businesses: a CRM duplicate and data-quality check.
>
> You send a contacts or leads export (CSV) from your CRM or spreadsheet. We send back a review sheet: duplicate groups with a suggested record to keep and the reason, bad or missing emails and phones, and stale leads. Conflicts, such as two owners on one contact, are flagged for a person to decide. Nothing is merged, deleted or edited by us; you apply any change in your own CRM, and we never log into it. A person reviews the sheet before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/crm-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/crm-cleanup?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 225 characters as X counts it

> Pilot for small sales teams: send a CRM export, get a review sheet of duplicate groups with a suggested record to keep, bad emails and phones, and stale leads. We merge nothing. Sample (invented data): https://hq.amberoneai.com/offers/crm-cleanup?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Duplicate contacts, grouped for review | Pilot: send a CRM export, get duplicate groups with a suggested record to keep, plus bad emails, phones and stale leads. | Nothing is merged for you |
| B | Same lead in your CRM three times? | A pilot review sheet of duplicates and data issues. You decide, and you apply any change in your own CRM. | Sample made from invented data |

### 8. Support Inbox Triage with Reply Drafts (`inbox-triage`)

Page: https://hq.amberoneai.com/offers/inbox-triage

**Who it is for, and where:** For small e-commerce, software and service teams with a shared support inbox of 50 to 500 emails a week; post it on our own LinkedIn page first, then our Facebook page.

**Launch post** (LinkedIn or Facebook page; 673 characters before the link is filled in)

> Small support teams: we are starting a pilot of inbox triage with reply drafts.
>
> You send a week of support email, as an export or forwarded copies, with your refund and shipping policies. We send back every message sorted by type and urgency, with the reason for each urgent flag, and a reply draft for each message that needs one, for your team to edit and send. Legal threats and safety issues are flagged for a person, with no draft. We never touch your inbox or send anything, and the drafts never promise refunds. A person reviews the report before it reaches you.
>
> You can see a sample made from invented data on the page, and ask a question through its form: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/inbox-triage?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/inbox-triage?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 222 characters as X counts it

> Pilot for small support teams: send a week of support email, get it sorted by type and urgency, with a reply draft where one is needed. Legal or safety mail goes to a person. Sample (invented data): https://hq.amberoneai.com/offers/inbox-triage?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | A week of support email, sorted | Pilot: a week of support email sorted by type and urgency, with reply drafts your team edits and sends. | We never send replies |
| B | Urgent support emails, flagged | A pilot for small support teams: send a week of email, get it sorted with reply drafts. Legal and safety go to a person. | Sample made from invented data |

### 9. Product Catalog Cleanup and Cross-Store Check (`catalog-cleanup`)

Page: https://hq.amberoneai.com/offers/catalog-cleanup

**Who it is for, and where:** For e-commerce sellers on two or more sales channels with 100 to 5,000 SKUs; post it on our own LinkedIn and Facebook business pages, and on X or Threads if we have an account there.

**Launch post** (LinkedIn or Facebook page; 667 characters before the link is filled in)

> New pilot for sellers on two stores: a product catalog cleanup and cross-store check.
>
> You send a product export (CSV) from each store and tell us which one is your source of truth. We check both for missing fields, barcodes that fail the check-digit test, duplicate SKUs, and price or stock differences between the stores, and send back a sheet of proposed changes that you review and import yourself. Nothing is changed in your stores, no store login is needed, and pricing decisions stay with you. A person reviews the report before it reaches you.
>
> The page has a sample made from invented data. Take a look, or ask a question through the form on the page: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/catalog-cleanup?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/catalog-cleanup?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 214 characters as X counts it

> Pilot for sellers on two stores: send both product exports, get missing fields, bad barcodes, and price or stock differences, with proposed fixes you import yourself. Sample (invented data): https://hq.amberoneai.com/offers/catalog-cleanup?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Two stores, one catalog check | Pilot: send both stores' product exports, get missing fields, bad barcodes and price or stock differences listed. | You review and import |
| B | Prices drifting between your stores? | A pilot catalog check with proposed fixes in a sheet you review. Nothing in your stores is changed by us. | Sample made from invented data |

### 10. Short-Form Ad Variations from Your Video (`video-ad-variations`)

Page: https://hq.amberoneai.com/offers/video-ad-variations

**Who it is for, and where:** For local businesses and small brands that already have video and post short vertical clips; post it on our own Facebook and LinkedIn pages, since Instagram and TikTok captions do not carry a clickable link.

**Launch post** (LinkedIn or Facebook page; 687 characters before the link is filled in)

> A new pilot for local businesses and small brands: short ad variations cut from a video you already own.
>
> You send the video file, confirm you own it or may use it, and tell us your offer and the points you want across. We send back three vertical 15-second cuts, each opening with a different hook, with captions burned in, caption files, and a cut sheet showing which parts of your video each one uses. One round of revisions is included. We do not buy ads or touch your ad or social accounts, and we make no promises about views or sales. A person reviews every cut.
>
> There is a sample on the page, made from invented data. Have a look, or use the form there to ask a question: {link}

Link for the launch post: Facebook page `https://hq.amberoneai.com/offers/video-ad-variations?src=facebook-page&utm_campaign=pilot-launch-2026-10` · LinkedIn page `https://hq.amberoneai.com/offers/video-ad-variations?src=linkedin-page&utm_campaign=pilot-launch-2026-10`

**Short post**, shown with the final link for X (`src=x`); 220 characters as X counts it

> Pilot for small brands with video: send a video you own, get three vertical 15-second cuts, each with a different opening hook, plus captions and a cut sheet. No ad buying. Sample (invented data): https://hq.amberoneai.com/offers/video-ad-variations?src=x&utm_campaign=pilot-launch-2026-10

**Ad variants** (prepared for later; not bought)

| | Headline | Primary text | Description |
|---|---|---|---|
| A | Three short cuts from your video | Pilot: three vertical 15-second cuts of a video you own, each with a different opening hook and captions. | No access to your accounts |
| B | One video, three opening hooks | A pilot for small brands: send your video, get three captioned vertical cuts and a cut sheet. One revision round. | Sample made from invented data |
