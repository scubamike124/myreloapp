# Running a pilot on a client's files

Generated from the importers in the code (amberai PR #791), so the file and option names below are exactly what the command reads. Nothing is sent, posted, charged or changed: the command writes a report file for a person to review.

```
npx tsx scripts/offers-run.ts <offer> --as-of YYYY-MM-DD --business "Client name" \
  --file <key>=<path> [--file ...] [--opt <key>=<value> ...] \
  --authorized "client, how they authorised it, date" --out report.md
```

- Use `--authorized` only with the client's written permission to use these files. For invented test data use `--synthetic` instead; it is refused when the files hold a real-looking email address or phone number.
- Exit 0: every check passed. Exit 1: the report is written but marked "not ready to send". Exit 2: a usage or file problem, explained. Exit 3: refused.

## 1. Missed-Call and Web-Inquiry Follow-Up List (`missed-call-follow-up`)

Files to ask the client for:

- `--file calls=…`: Call log. CSV call-log export from your phone system (RingCentral, CallRail, Dialpad, OpenPhone, Grasshopper or similar): date and time, caller number, status or duration, direction.
- `--file inquiries=…` (optional): Website inquiries. CSV of website form submissions: date and time, name, email or phone, service, message.
- `--file replies=…` (optional): Follow-ups made. CSV of follow-ups you already made: date and time, to (phone or email), type (call, text or email).

Options:

- `--opt signOff=…` (required): How the replies are signed (use \n for a new line).
- `--opt services=…`: Services you offer, comma-separated.
- `--opt hours=…`: Opening hours (HH:MM-HH:MM) (default: 07:00-18:00).
- `--opt days=…`: Days open (1 = Mon … 7 = Sun, e.g. 1-6 or Mon-Sat) (default: 1-6).

## 2. Stale Estimate Follow-Up List (`stale-estimate-follow-up`)

Files to ask the client for:

- `--file estimates=…`: Estimates export. CSV of your estimates or quotes (Jobber, Housecall Pro, QuickBooks, ServiceTitan or a spreadsheet): number, customer, job, total, date sent, status.

Options:

- `--opt signOff=…` (required): How the follow-ups are signed (use \n for a new line).
- `--opt trade=…`: Your trade (for example: kitchen and bath remodeling).
- `--opt staleAfterDays=…`: Follow up after this many days without contact (default: 7).
- `--opt doNotContact=…`: Estimate numbers or customer names not to chase, comma-separated.

## 3. Job-Cost Exception Report (`job-cost-exceptions`)

Files to ask the client for:

- `--file budgets=…`: Job budgets. CSV or spreadsheet with a row per job and cost code (Job, Cost Code, Budget), or a row per job with a column per cost code.
- `--file transactions=…`: Job cost detail. CSV from QuickBooks (Job Cost Detail, or Transaction Detail by Customer with one row per transaction), Buildertrend or a spreadsheet: Date, Customer:Job (or Job), Item (or Cost Code), Vendor, Memo, Amount.
- `--file jobs=…`: Job list. Job, Status (active or closed), Percent Complete (the PM's estimate), and Closed On if known.
- `--file codes=…` (optional): Cost-code list. Code and Name; without it, the list is built from the codes in the budgets and the costs.

Options:

- `--opt overBudgetPct=…`: Flag a cost code over budget by more than this percent of its budget (default: 10).
- `--opt overBudgetMinDollars=…`: ...and by more than this many dollars (default: 500).
- `--opt burnGapPoints=…`: Flag an active job whose percent spent is more than this many points ahead of its percent complete (default: 15).
- `--opt duplicateWindowDays=…`: Flag the same vendor and amount on one job within this many days (default: 3).

## 4. Receipt and Invoice Match Review (`receipt-invoice-matching`)

Files to ask the client for:

- `--file transactions=…`: Bank or card export. CSV of the review period from your bank, card or accounting software: date, description or payee, amount (or debit and credit columns), and the account if it has one.
- `--file documents=…`: Receipts and invoices export. CSV from your receipt tool (Dext, Hubdoc, Expensify) or a spreadsheet: supplier, date, total, invoice number, currency, type (receipt or invoice) and file name, as read from each document.

Options:

- `--opt periodFrom=…`: First day of the review period (YYYY-MM-DD); default: the first date in the bank export.
- `--opt periodTo=…`: Last day of the review period (YYYY-MM-DD); default: the last date in the bank export.
- `--opt toleranceDays=…`: Match a payment and a document dated up to this many days apart (default: 3).
- `--opt vendorAliases=…`: Bank text to vendor name, as BANK TEXT=Vendor;BANK TEXT=Vendor (e.g. AMZN MKTP US=Amazon).
- `--opt spendingSign=…`: With one amount column, spending is shown as: negative (most bank exports; the default) or positive (American Express, Discover, some card exports).
- `--opt account=…`: Name for the account when the export has no account column (e.g. Card 4417).

## 5. Unpaid Invoice Tracker with Draft Reminders (`unpaid-invoice-tracking`)

Files to ask the client for:

- `--file invoices=…`: Open-invoices export. CSV from your accounting software (open invoices or receivables aging detail) or a spreadsheet: invoice number, customer, dates, amounts.

Options:

- `--opt signOff=…` (required): How the reminders are signed (use \n for a new line).
- `--opt paymentInstructions=…` (required): How customers can pay.
- `--opt terms=…`: Payment terms (default: Net 30).
- `--opt disputed=…`: Invoice numbers in dispute, comma-separated.

## 6. Website Health, Accessibility and Booking-Form Check (`website-health-report`)

Files to ask the client for:

- `--file page1=…`: First page's HTML. The page saved as HTML (in a browser: Save Page As, HTML only), usually the home page.
- `--file page2=…` (optional): Page 2's HTML. Another page saved as HTML, such as the booking or contact page.
- `--file page3=…` (optional): Page 3's HTML. Another page saved as HTML, such as the booking or contact page.
- `--file page4=…` (optional): Page 4's HTML. Another page saved as HTML, such as the booking or contact page.
- `--file page5=…` (optional): Page 5's HTML. Another page saved as HTML, such as the booking or contact page.
- `--file headers=…` (optional): First page's response headers. The output of `curl -sI <first page address>`; without it the site-health table is left out.

Options:

- `--opt urls=…` (required): The pages' addresses, comma-separated, in the same order as page1, page2….
- `--opt site=…`: The site's main address (defaults to the first page's).

## 7. CRM Duplicate and Data-Quality Check (`crm-cleanup`)

Files to ask the client for:

- `--file contacts=…`: Contacts export. CSV of contacts or leads from your CRM (HubSpot, Pipedrive, Zoho, Salesforce) or a spreadsheet: names, emails, phones, company, owner, stage, created and last-activity dates.

Options:

- `--opt source=…`: Where the contacts came from, as the report names it (e.g. "HubSpot contacts export") (default: the contacts export).
- `--opt staleAfterDays=…`: Days without activity before an open lead counts as stale (default: 120).
- `--opt defaultStage=…`: Stage for rows whose stage is blank or not recognised: lead, qualified, customer or lost (without it those rows are skipped).

## 8. Support Inbox Triage with Reply Drafts (`inbox-triage`)

Files to ask the client for:

- `--file messages=…`: Messages export. CSV of support email from your mail or help-desk tool (date, from, subject, body), or an mbox file such as a Google Takeout export of the support inbox.

Options:

- `--opt signOff=…` (required): How the reply drafts are signed (use \n for a new line).
- `--opt refundWindowDays=…`: Days after delivery that returns are accepted (your refund policy) (default: 30).
- `--opt shippingTime=…`: Your usual shipping time, as the drafts say it (default: 3–5 business days).
- `--opt ownAddresses=…`: Your own addresses or domain, comma-separated: messages from them (your team's replies) are left out.

## 9. Product Catalog Cleanup and Cross-Store Check (`catalog-cleanup`)

Files to ask the client for:

- `--file storefront=…`: Storefront export. CSV product export from your online store, such as Shopify's product export (handle, title, variant SKU, price, inventory, barcode, images).
- `--file marketplace=…`: Marketplace export. Listing export from the marketplace, such as Amazon's All Listings Report or inventory file, or an Etsy, eBay or Walmart listing export (SKU, title, price, quantity, barcode, images).

Options:

- `--opt storefrontName=…`: The storefront's name in the report (default: Storefront).
- `--opt marketplaceName=…`: The marketplace's name in the report (default: Marketplace).
- `--opt sourceOfTruth=…`: Which store is right when they differ (only "storefront" is supported) (default: storefront).
- `--opt storefrontTitleMax=…`: Longest title the storefront allows (default: 255).
- `--opt marketplaceTitleMax=…`: Longest title the marketplace allows (default: 200).
- `--opt requireGtin=…`: Where a barcode (GTIN) is required: marketplace, storefront, both or none (default: marketplace).
- `--opt requireBrand=…`: Where a brand is required: marketplace, storefront, both or none (default: marketplace).
- `--opt minDescriptionChars=…`: Shortest description that counts as complete, in characters (default: 50).
- `--opt priceToleranceCents=…`: Price difference allowed between the stores, in cents (default: 0).

## 10. Short-Form Ad Variations from Your Video (`video-ad-variations`)

Files to ask the client for:

- `--file transcript=…`: Transcript of the client's video. An .srt or .vtt caption file of the video, as a caption tool or editor exports it.

Options:

- `--opt fileName=…` (required): The video's file name.
- `--opt durationSec=…` (required): The video's length in seconds.
- `--opt width=…` (required): The video's width in pixels.
- `--opt height=…` (required): The video's height in pixels.
- `--opt fps=…` (required): The video's frame rate.
- `--opt rightsConfirmed=…` (required): The client confirmed in writing that they own the video or may use it (yes/no).
- `--opt offer=…` (required): What the ad sells.
- `--opt audience=…` (required): Who it is for.
- `--opt hooks=…` (required): Three opening hooks, separated by |.
- `--opt cta=…` (required): The call to action on the end card.
- `--opt platforms=…`: Platforms, comma-separated (default: Instagram Reels, TikTok, YouTube Shorts).
- `--opt maxSec=…`: Longest variation in seconds (default: 15).
- `--opt captionMaxChars=…`: Most characters on a caption line (default: 32).
- `--opt captionMaxLines=…`: Most lines on a caption card (default: 2).

