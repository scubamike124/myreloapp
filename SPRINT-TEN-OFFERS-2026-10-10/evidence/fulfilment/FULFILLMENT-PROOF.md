# Fulfilment proof: the ten Amber One AI pilot offers

Audit date 2026-10-11 (the as-of date of every run). Worktree `/home/user/wt-fulfil`, branch `claude/offers-fulfillment-gaps`, based on main `a189d44`; 12 local commits, none pushed. Everything below was run and seen; nothing is claimed that was not.

**How to read this file.** Phase 1 (the audit) was written first, at 04:39 UTC, before any code changed (the first commit is 04:49 UTC); a copy of that first version is `_doc/proof-phase1-as-written.txt`. Phase 2 fixed the small gaps, each with tests, and re-ran every recorded run. The table in section 2 is the **final** state. Section 4 says, offer by offer, what Phase 1 found, what Phase 2 changed and what is still open. Section 8 lists the commits and the checks.

---

## 1. What was audited, how, and the rules kept

**Question.** Can each of the ten pilot offers be delivered end to end by the existing pilot runner (`scripts/offers-run.ts`), on clearly invented data? A demo page or passing sample checks alone does not count, so each offer got: realistic buyer-shaped input with a countable set of planted problems, a messy-but-valid variant, a negative set, the documented command, an independent check of the output against what was planted, a look at the file a buyer would actually receive, and an honest look at the human steps around it.

**Rules kept.**
- Invented data only: people, businesses, `example.*` / `.example` domains, phone numbers 555-0100 to 0199. The only exceptions are the negative-test files, which deliberately hold one not-reserved invented address (`negative.test@audit-fixture-notreal.com`, `(303) 555-0299`, `www.acme-candles-notreal.com`, `TOOLBOX-NOTREAL.COM`) to prove the runner refuses them. One Phase 1 fixture briefly held two real brands' domain names as bank text (`GITHUB.COM`, `ZOOM.US`) to see the runner refuse them; it was replaced with the invented `...-NOTREAL` names and nothing was fetched from or sent to either. Nothing was sent anywhere.
- No network call, no secret read, no message sent, nothing charged, nothing pushed, no PR, no production touched. The worktree was changed only in Phase 2, by local commits.
- The runner only produces client-facing wording for a run that names an authorisation, so each offer has one `client-mode` run with `--authorized "AUDIT ONLY: invented fixture, no real client, nothing sent, 2026-10-11"`. Offer 7 also has one `full-defects-audit-only` run the same way, because a malformed phone number cannot pass the `--synthetic` rule (it demands exact 555-01xx numbers), so the phone-length check could not otherwise be tried.
- Ground truth was written into each generator (`_gen/gen-N.mjs`) from the plan, not read from the product's output; the checkers (`_tools/verify-N.mjs`) compare the report with it.

**Where everything is** (`F` = `/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil`):
- `F/<slug>/inputs/` invented inputs and `truth.json` (what was planted); `F/<slug>/outputs/` reports (`main.md` is Phase 1, `p2-main.md` is Phase 2); `F/<slug>/bundle-p2-main/` the delivery folder and `F/<slug>/bundle-p2-main.reviewer-notes.txt` the reviewer's notes; `F/<slug>/logs/<label>.{cmd,stdout,stderr,exit,secs}` the exact command, exit code, wall seconds, stdout and stderr of every run (`p2-<label>` is the same run at the final code).
- `F/run.sh`, `F/rerun.sh`, `F/rerun-all.sh` the harness; `F/_gen/` generators; `F/_tools/` checkers (`verify-N.mjs`; `claims.ts`, which applies `claimIssues`, `unnegatedMatches(SENT_CLAIMS|TAX_ADVICE|MONEY_ACTIONS)` from `src/lib/offers/qa.ts`; `compare-p1-p2.py`); `F/p1-vs-p2.tsv` every run, before and after; `F/phase2-verification.txt`, `F/bundle-check.txt`, `F/claims-scan-p2.jsonl`; `F/claims-scan-all.jsonl` (Phase 1 scan of 66 reports); `F/_doc/` the Phase 1 version as written (`proof-phase1-as-written.txt`) and the template and script that built this file from the logs and git.
- 151 runs were recorded in Phase 1 (main, messy, scale, negative, gate, client-mode, probes). All 151 were re-run at the final code, plus the 10-job offer 3 case.

**Independent checks of the delivery folders.** Python's `csv` module and `html.parser`, not the repo's own reader. No spreadsheet application and no browser is installed on this machine (LibreOffice is installed only as `libreoffice-core` and failed to load even a two-line CSV), so "opens in Excel" and "opens in a browser" are inferred from the format and were not seen.

**Classification rubric (mine, stated so the verdicts can be checked).** READY FOR A PAID PILOT needs all of: (1) the planted problems found with no false findings; (2) the QA gate behaving (passing when it should, "not ready" when it should); (3) the file the buyer receives can be opened by a non-technical small-business buyer and matches what the page promises; (4) everything the page asks the buyer to send can be read by the runner, or the manual conversion step is stated; (5) no way found to produce a wrong report that still passes every check; (6) a human-review step is defined. Anything short of that is NEEDS WORK with the exact missing step and its size (S under 150 lines or an owner wording/ops step; M a day or two; L several days or a new dependency), or NOT DELIVERABLE YET if the promised deliverable cannot be produced by the path at all. The classification is about delivery. The terms text that every pilot page lacks (section 7) and the manual intake steps (section 6) apply to all ten and are listed once, not repeated as a missing step on each.

---

## 2. Verdicts at a glance (final, after Phase 2)

Seconds are the wall time of the whole command (including Node and tsx start-up and writing the delivery folder), warm, for the `p2-main` run; the processing itself is 33 ms to 445 ms (section 5). "Planted found/total" is the checker's count against what was planted. Exact commands are in section 4 and in `F/<slug>/logs/p2-main.cmd`.

| # | Offer | Inputs (invented) | Command (main flags) | Exit | Secs | Planted found/total | False findings | QA passed/total | Files produced (format) | Promise vs delivered | Classification (Phase 1, then final) | Exact missing step |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Missed-call follow-up | call log 41 rows, 8 form rows, 4 replies | `missed-call-follow-up --file calls= inquiries= replies= --opt signOff= services= hours= days= --synthetic --out --bundle` | 0 | 1.52 | 20/20 checks: 12/12 open leads, 2/2 safety, 4/4 followed, 13/13 missed calls, 5/5 after hours, 10/10 drafts | 0 | 17/17 | `.md`; folder: `report.html`, 5 `.csv`, `README.txt`; `.reviewer-notes.txt` | all five promised parts delivered and verified; "forwarded copies" of web forms cannot be read | NEEDS WORK, small; then NEEDS WORK, small | page line "export or forwarded copies" must say "export" (or say who retypes copies); the intake step is unwritten; 6 left-out-line notes are only in the reviewer file |
| 2 | Stale estimate follow-up | Jobber-style 27 rows | `stale-estimate-follow-up --file estimates= --opt signOff= doNotContact= --synthetic --out --bundle` | 0 | 1.58 | 14/14 checks: 12/12 stale, 3/3 buckets and values, 9/9 drafts, 2/2 re-quote, 1/1 no contact, 10/10 not chased | 0 | 15/15 | `.md`; folder: `report.html`, 3 `.csv`, `README.txt`; notes | all four promised parts present, but "too old to chase" sits in the main table, not in the not-chased list the page describes | NEEDS WORK, small; then NEEDS WORK, small | page wording for "too old to chase" (proposal in section 7), or move those rows to the not-chased list (S, changes the sample page) |
| 3 | Job-cost exceptions | QuickBooks-style cost detail 44 rows, budgets 27 lines, 6 jobs (and 10 jobs, 66 rows) | `job-cost-exceptions --file jobs= budgets= transactions= codes= --synthetic --out --bundle` | 0 | 1.58 | 26/26 checks: 9/9 exceptions, 6/6 job totals, 5/5 near misses not flagged; at 10 jobs every clone equals its original | 0 | 14/14 | `.md`; folder: `report.html`, 3 `.csv`, `README.txt`; notes | all four promised parts present; the report now says how many cost rows were not included | NEEDS WORK, small; then READY FOR A PAID PILOT | none in the product; owner steps in section 6 |
| 4 | Receipt and invoice match | bank 39 rows, documents 37 rows | `receipt-invoice-matching --file transactions= documents= --opt periodFrom= periodTo= vendorAliases= account= --synthetic --out --bundle` | 0 | 1.44 | with the one alias: 11/11 (26 pairs, 13 exceptions); without it 7/11 (25 pairs, 2 extra exceptions, now self-explaining) | 0 with alias | 13/13 | `.md`; folder: `report.html`, 2 `.csv`, `README.txt`; notes | matched pairs, exceptions and bookkeeper questions present; the page promises "PDFs or photos" and nothing reads them | NEEDS WORK, large; then NEEDS WORK, large | reading PDFs and photos (L: OCR or typing each document into a sheet), or narrow the page to a receipt-tool export or spreadsheet (owner wording, S) |
| 5 | Unpaid invoices and reminders | open invoices 22 + 2 unreadable rows | `unpaid-invoice-tracking --file invoices= --opt signOff= paymentInstructions= --synthetic --out --bundle` | 0 | 1.38 | 15/15 checks: 5/5 buckets, 12/12 reminders, 12/12 drafts, 12/12 tones, 7/7 not-chased reasons | 0 | 18/18 | `.md`; folder: `report.html`, 5 `.csv`, `README.txt`; notes | aging, reminders, drafts, not-chased all present; two unreadable invoices are missing from the aging (named only in the reviewer file) | NEEDS WORK, small; then NEEDS WORK, small | page must say "contact name and email" (a stock QuickBooks report has no emails, so no drafts); show unreadable invoices in the report (M) |
| 6 | Website health + form check | 4 saved pages, headers | `website-health-report --file page1= page2= page3= page4= headers= --opt urls= --synthetic --out --bundle` | 0 | 1.39 | 9/9 checks: 7/7 accessibility groups, 14/14 booking-form findings, 1/1 contact finding, site-health values | 0 | 13/13 | `.md`; folder: `report.html`, 4 `.csv`, `README.txt`; notes | every promised part present; the buyer sends addresses, but this path needs the pages saved as HTML first | NEEDS WORK, small to medium; then NEEDS WORK, medium | the saving of pages and headers is manual and unwritten; the live Snapshot (PDF) has no form check (M: wire the form check into the live fetch flow) |
| 7 | CRM duplicate check | 320 contacts (and 5,340) | `crm-cleanup --file contacts= --opt source= staleAfterDays=120 --synthetic --out --bundle` | 0 | 1.52 | 10/10 checks: 19/19 groups, 19/19 confidence, 19/19 keep suggestion, 19/19 conflicts, 21/21 quality, 8/8 stale | 0 | 12/12 | `.md`; folder: `report.html`, 4 `.csv` (incl. 260 proposed changes), `README.txt`; notes | the "proposed-changes sheet" is now a CSV a CRM admin can filter and review | NEEDS WORK, small; then READY FOR A PAID PILOT | none in the product; owner steps in section 6 (the written data agreement is by email) |
| 8 | Support inbox triage | 52 messages in natural wording | `inbox-triage --file messages= --opt signOff= --synthetic --out --bundle` | 0 | 1.47 | category 33/52 (all 19 misses fall to "other"); legal/safety 8/8; spam 5/5; urgent 14/15 | 0 wrong flags; 1 draft that need not exist (a thank-you) | 14/14 | `.md`; folder: `report.html`, 4 `.csv`, `README.txt`; notes | types, urgency and reasons, themes present; drafts are standard replies by type, 10 of 36 are one general sentence | NEEDS WORK, large; then NEEDS WORK, large | classifier recall on natural wording (L) or page wording that says "standard reply drafts; some messages filed as other" (owner, S) |
| 9 | Catalog cleanup | Shopify export (123 rows) + Amazon-style TSV (118); 1,050 SKUs too | `catalog-cleanup --file storefront= marketplace= --opt storefrontName= marketplaceName= --synthetic --out --bundle` | 0 | 1.47 | 35/35 checks: issues 78/78, differences 44/44, proposed changes 51/51, one-store 16/16 | 0 | 11/11 | `.md`; folder: `report.html`, 4 `.csv`, `README.txt`; notes | the "sheet you import yourself" is a review sheet (store, SKU, field, current, proposed, reason), not a store import template; only the storefront can be the source of truth | NEEDS WORK, small; then NEEDS WORK, small | page wording on "import yourself" and "source of truth" (S, owner); store-specific import files (M) |
| 10 | Video ad variations | 32-cue SRT, brief | `video-ad-variations --file transcript= --opt fileName= durationSec= width= height= fps= rightsConfirmed= offer= audience= hooks= cta= --synthetic --out --bundle` | 0 | 1.36 | 10/10 mechanical checks (cuts, 9:16 crop, caption limits, hooks); hook text used for 1 of 3 hooks | 0 (end-card URL split fixed) | 14/14 | `.md`; folder: `report.html`, 3 `.csv`, `README.txt`, `render.sh` and 9 variation files (`.srt`, `-hook.txt`, `-cta.txt`); notes | the promised videos are not produced; the folder is a plan, caption files and a script that was only syntax-checked | NOT DELIVERABLE YET; then NOT DELIVERABLE YET | a render of captions plus sound on a real clip, proven on a machine with ffmpeg (L); a caption source for a bare video (L); a way to move large video files (M) |

**Before and after.** Phase 1 verdicts: NEEDS WORK, small for offers 1, 2, 3, 5, 7 and 9; NEEDS WORK, small to medium for offer 6; NEEDS WORK, large for offer 4; NEEDS WORK, small and large for offer 8; NOT DELIVERABLE YET for offer 10. Final: **2 READY FOR A PAID PILOT (offers 3 and 7), 7 NEEDS WORK (1, 2, 4, 5, 6, 8, 9), 1 NOT DELIVERABLE YET (offer 10)**. Offers 3 and 7 moved because the gaps that held them back were all code and are fixed and re-verified; the other seven each still have a page-wording or ops step the owner must settle, or (4, 6, 8) a larger piece of work, or (10) no render.

**Prerequisites that apply to all ten** (not repeated per offer): the shared terms text of section 7 on every page before money is taken; a person who runs the command (Node 22 and this repository), the intake by email of section 6, and deletion of the client's files by hand when asked.

---

## 3. Findings that cut across the offers, and what happened to each

**F1. The buyer received one Markdown file.** `runPilot` wrote exactly one file, a `.md` whose first line is an internal comment. Opened by double-click it is plain text with pipe characters, not a table. Pages promise lists, sheets and drafts: "a proposed-changes sheet you review and apply" (offers 7, 9) was a 260-row to 4,337-row Markdown table. **Fixed in `3cffb63`:** `--bundle <folder>` writes `report.html` (one self-contained page, prints to PDF), one UTF-8 CSV per table, list and set of drafts, and `README.txt`; the Markdown report is unchanged byte for byte. Checked on all ten offers: 10 HTML files well-formed with nothing loaded from outside, 37 CSV files each with one row width, a byte-order mark and CRLF. Not done: a native PDF (the live Snapshot builds one with pdfkit; reusing it for these reports is M).

**F2. Everything the importer left out was only on the terminal.** Skipped rows, their reasons and the assumptions went to stderr. The reports counted what survived ("25 estimates in the export" for a 27-row file; offer 3 said "Every transaction in the export was placed" after 5 rows were left out). **Partly fixed:** `<folder>.reviewer-notes.txt` keeps every note with the left-out rows listed first, and the run ends with a line counting them (`02f69d7`, `3cffb63`); offer 3's report now says how many cost rows were not included and stops claiming completeness (`b4c5b06`). **Open (M):** for the other nine the buyer-facing report still counts only what was read; each importer needs to report a count of unreadable rows into the report, as offer 3 now does.

**F3. A file that is not an export was not rejected plainly.** A PDF or JPEG as the receipts file exited 2 with "no column for vendor" and binary bytes in a note; a picture, a note, a bot-check page and a 404 page given as the "page" of offer 6 all exited 0 with 13 of 13 checks. **Fixed** (`02f69d7`, `509fccf`): the runner names a PDF, a photo, an image, a workbook, a UTF-16 file or a binary file, and offer 6 refuses a page with no HTML, a bot-check or an error title. Excel's UTF-16 "Unicode Text" is now read.

**F4. Wrong reports that passed every check.** (a) Offer 4, a card export with spending as positive amounts, run without `spendingSign`: "0 matched pairs, 36 exceptions", exit 0, 13/13. (b) Offer 6 junk pages. **Fixed** (`8783ef3`, `509fccf`): both now stop with exit 2 and a sentence saying what to do. The sign guard fires when at least five documents match rows read as money in and more than twice as many as match money-out rows.

**F5. Greeting bugs ("Hi Dr.,", "Hi Mr.,", "Hi Harborview,") in offers 1, 2, 5 and 8.** **Fixed** (`86faa13`): the first name, a title with a surname when that is all there is, "Hi there," for a business, a team, an address, an initial or a one-word contact copied from the customer column.

**F6. The wording scans read the client's own words.** Nine company, product, job, vendor, field-label and bank-text names turned clean reports into "Not ready to send". **Fixed for six of the nine** (`0c38e4b`): a flagged word inside text the client's files hold (or the business name), as the report quotes it, is not counted; a word the report or the operator adds still is. Three still stop on purpose: a customer's "free estimate" echoed into an offer 1 draft, a card "fee" typed into the offer 5 payment instructions, and "Legal" in an offer 5 sign-off that does not carry the business name. A scan of all 90 Phase 2 reports and READMEs with the repo's own claim checks found only the four client-word files, which the runner now passes.

**F7. An empty required file said "No X export was given".** **Fixed** (`02f69d7`): "it is empty", the file's name and what was expected, exit 2 as before.

**F8. The first line of a Markdown report is an internal comment** (script name, authorisation note, "Review before sending"). **Open (S):** the delivery folder has no such comment; the Markdown still does, so the Markdown is for the person, the folder for the buyer.

**F9. Line numbers in the notes ignore blank lines** for offers 1, 2, 5, 7, 8 and 9 (offers 3 and 4 count real lines). **Open (S/M).**

**F10. The human and ops path is manual and partly undefined** (section 6). **Partly addressed:** the reviewer notes carry a checklist and the left-out rows; intake, payment, the written data agreements and deletion remain owner steps with no tool.

---

## 4. Offer by offer

Each section: the promise; what the buyer sends, scope and price; the inputs; the exact command; Phase 1 findings; Phase 2 changes and results; negatives; the file the buyer gets; verdict; turnaround. Commands are shown with `F` as above; the quoting is the shell's.

### Offer 1. Missed-Call and Web-Inquiry Follow-Up List ($199 for the two-week pilot, three lists)

**Promise** (page, `registry.ts`): every missed call and unanswered web inquiry with no recorded reply, most urgent and oldest first with the reason for each urgency flag; repeat calls from one number as one lead with the attempts; when misses cluster by time of day and how long replies took; a draft text or email for each open lead; calls mentioning a safety problem listed for a person to call back, with no draft. **Buyer sends:** call-log export (CSV), form submissions "as an export or forwarded copies", replies already made, hours, services and sign-off. **Scope:** one location, the last 30 days then two weekly refreshes (three lists), up to 500 calls and 100 inquiries per export. **Page terms:** price and unit shown; no turnaround; no refund; one shared line says scope, price and a delivery date are confirmed by email before files or payment.

**Inputs built** (`F/missed-call-follow-up/inputs/`): `calls.csv` (RingCentral-style, 41 rows: 18 answered, 13 missed rows, 4 outbound, 6 rows that must be skipped: spam caller ID, blocked, fax, internal, incoming SMS, a call after the as-of time), `inquiries.csv` (8 rows, one after the as-of time and one with no contact), `replies.csv` (4, one older than the call it would otherwise close). Planted: 12 open leads (2 urgent, 2 safety, 5 first contact after hours, one lead with 3 calls, one phone-plus-form merge, one 4-second "answered" call that must count as missed), 4 followed, time-of-day split 2/5/3/2/1. Messy variant: BOM, CRLF, other headers, US dates, `+1` phones, m:ss durations, a blank row, a total row.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts missed-call-follow-up --as-of 2026-10-11 --business Invented\ Test\ Co --file calls=$F/missed-call-follow-up/inputs/calls.csv --file inquiries=$F/missed-call-follow-up/inputs/inquiries.csv --file replies=$F/missed-call-follow-up/inputs/replies.csv --opt signOff=Dana\\nInvented\ Test\ Co --opt services=plumbing\ repairs\,water\ heaters\,drain\ cleaning\,heating --opt hours=07:00-18:00 --opt days=1-6 --synthetic --out $F/missed-call-follow-up/outputs/p2-main.md --bundle $F/missed-call-follow-up/bundle-p2-main
```

**Phase 1 found.** All planted problems found with no false lead (checker 20/20, 17 of 17 QA checks); a scale run at the pilot limit (492 call rows, 96 inquiries, 48 replies) gave exactly 12 times the base result. Drafts read naturally and promise no price or arrival time. Defects: Markdown only (F1); the skipped lines (spam, fax, the 4-second call) only on the terminal (F2); "Hi Mr., this is ..." (F5); an empty file reported as "No call-log export was given" (F7).

**Phase 2 changed.** Greeting fixed (`86faa13`; the `greeting-title` run now opens "Hi Tom,"). Delivery folder (`3cffb63`): `report.html`, 5 CSV (open leads, already followed up, missed calls by time of day, draft replies, call back by a person), `README.txt`, and reviewer notes listing 6 left-out-line notes first. Plain messages for a PDF, a photo or an empty file (`02f69d7`).

**Results at the final code.** main 17/17 and checker 20/20; `messy` exit 0, 17/17 checks; `client-mode` exit 0, 17/17 checks; `scale-492-calls` exit 0, 17/17 checks; `greeting-title` exit 0, 17/17 checks. The `messy` and `scale-492-calls` reports are byte-identical to Phase 1; only `greeting-title` differs, in its greeting. `gate-promise` (a form "service" of "Free estimate on a water heater" echoed into a draft) still stops with exit 1, on purpose: a draft that repeats a customer's "free estimate" or a price would be making the promise.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-asof` 2, `neg-bad-path` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-missing-option` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` (Markdown, unchanged in form) and the folder `bundle-p2-main/` (HTML, CSV, README). All five promised parts are present, each checked bullet by bullet by the verifier. Not delivered: forms sent as "forwarded copies" cannot be read; safety listing works only from voicemail text, which the export must hold.

**Verdict.** **NEEDS WORK, small.** Missing: (1) the page line "export or forwarded copies" must say "export", or say who retypes copies into a CSV (owner wording; proposal in section 7); (2) the intake step is unwritten (section 6); (3) the 6 left-out-line notes are only in the reviewer file (M, F2).

**Turnaround.** Measured: the command takes about 1.5 s; the person steps (scope agreement, receiving files, converting copies, review, sending) were not measured. Say "we confirm the date in writing before you pay".

---

### Offer 2. Stale Estimate Follow-Up List ($249 for four weekly lists)

**Promise** (page, `registry.ts`): every open estimate quiet 7 or more days, grouped 7 to 13, 14 to 29 and 30+, with the dollar value per group; a suggested next step; a draft follow-up naming the job and estimate number; a list of estimates not chased and why ("won, lost, asked not to be contacted, or too old to chase"). **Buyer sends:** estimates export, who asked not to be contacted, sign-off. **Scope:** up to 200 open estimates, four weekly lists. **Page terms:** as offer 1.

**Inputs built** (`F/stale-estimate-follow-up/inputs/`): Jobber-style `estimates.csv`, 27 rows: 12 stale (boundaries at 7, 14, 30 days), 3 open but not yet stale, 4 do-not-contact (by column, by note text, by estimate number option, by customer-name option), 6 closed (won, approved, lost, declined, expired, archived), 1 draft never sent, 1 "On hold", 2 re-quote (sent over 60 days), 1 with no email or phone. Messy: BOM, CRLF, alias headers, mixed date styles, plain numbers, an "Invoice" row, a repeated estimate number, blank and total rows.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts stale-estimate-follow-up --as-of 2026-10-11 --business Invented\ Test\ Co --opt signOff=Sam\\nInvented\ Test\ Co --opt trade=kitchen\ and\ bath\ remodeling --file estimates=$F/stale-estimate-follow-up/inputs/estimates.csv --opt doNotContact=E-2018\,Pine\ Street\ Dental --synthetic --out $F/stale-estimate-follow-up/outputs/p2-main.md --bundle $F/stale-estimate-follow-up/bundle-p2-main
```

**Phase 1 found.** Checker 14/14 (stale ids, days quiet, bucket counts and values to the cent: 4 / $17,650.50, 4 / $22,050, 4 / $47,250; 9 drafts for exactly the draftable ones; 10 not-chased with the right reasons); 15/15 QA. Drafts quote the job, the estimate number and the exact amount and offer no price change. Defects: "Hi Dunmore," for a company and "Hi Dr.," (F5); the "too old to chase" estimates (E-2010, E-2011) sit in the main table marked "Confirm whether to re-quote; no draft", not in the not-chased list; the "On hold" estimate and the draft never sent are gone from the report; the report says "25 estimates in the export" for 27 rows (F2); a job called "Kitchen promo signage" made `estimates.no-discount-words` fail (F6).

**Phase 2 changed.** Greetings fixed (`86faa13`: "Hi there," for a company, "Hi John," for "Mr. John ..."). Delivery folder: `report.html`, 3 CSV (estimates gone quiet, draft follow-ups, not chased), README, notes (2 left-out notes). The job-name gate now passes (`0c38e4b`).

**Results at the final code.** main 15/15 and checker 14/14; `messy` exit 0, 15/15 checks; `client-mode` exit 0, 15/15 checks; `scale-216-estimates` exit 0, 15/15 checks; `gate-promo` exit 0, 15/15 checks; `greeting-title-and-business` exit 0, 15/15 checks.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-option` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-missing-option` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. All four promised parts are present. Not as promised: "too old to chase" is in the main list; the report counts estimates it read, not the export's rows.

**Verdict.** **NEEDS WORK, small.** Missing: page wording for "too old to chase" (proposal in section 7), or moving those two rows into the not-chased list (S, but it changes the sample page); the intake step (section 6).

**Turnaround.** Measured: the command takes about 1.6 s; the rest is person time (weekly refreshes need a new export each week from the buyer).

---

### Offer 3. Job-Cost Exception Report ($449, report plus one refresh)

**Promise** (page, `registry.ts`): per job the budget, spent, % spent and the PM's % complete; budget against actual by cost code; exceptions (over budget, cost code outside budget, costs on closed jobs, possible duplicate bills, spending ahead of progress), each listing the transactions and who should look. Read-only, no tax or legal advice. **Buyer sends:** budgets by cost code, the month's cost transactions, % complete per job, the cost-code list. **Scope:** up to 10 active jobs, one month, one report and one refresh. **Page terms:** as offer 1.

**Inputs built** (`F/job-cost-exceptions/inputs/`): QuickBooks-style Job Cost Detail with three title lines, `Customer:Job` names, items written as codes, "code name" or only a name, credits (negative), 44 data rows of which 5 must be skipped (a customer invoice row, a voided bill, a cost dated after the as-of date, a cost on a job not in the job list, a row with no cost code) and a Total row; budgets as a row per job and code (27 lines); a jobs file with %, status and closed date; a cost-code list (12 codes). Planted: 9 exceptions (2 over budget, 1 ahead of progress, 1 duplicate, 2 on a closed job, 2 with no budget, 1 unknown code) and 5 near misses that must not be flagged ($450 over and 9%, $400 over and 20% under $500, $490 over, a repeat bill 5 days apart, a 13-point gap). Messy: QuickBooks Desktop layout, a wide budget sheet with a column per cost code, `(300.00)` credits, fractions for % complete, BOM, CRLF. **Pilot limit:** `jobs-10.csv`, `budgets-10.csv`, `transactions-10.csv` clone four jobs under new names for 10 jobs and 66 cost rows.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts job-cost-exceptions --as-of 2026-10-11 --business Invented\ Test\ Co --file budgets=$F/job-cost-exceptions/inputs/budgets.csv --file transactions=$F/job-cost-exceptions/inputs/transactions.csv --file jobs=$F/job-cost-exceptions/inputs/jobs.csv --file codes=$F/job-cost-exceptions/inputs/codes.csv --synthetic --out $F/job-cost-exceptions/outputs/p2-main.md --bundle $F/job-cost-exceptions/bundle-p2-main
```

**Phase 1 found.** Checker 26/26 (9/9 exceptions with the right job, code and cited transactions; all six job rows to the dollar and point; 6 jobs, $106,505.00 of $137,900.00, 77%; the five skipped rows' amounts appear nowhere; near misses not flagged); 14/14 QA. Defects: the report said "Every transaction in the export was placed on a job and cost code" after 5 rows were left out (only the terminal said so); "2 transactions totalling $1,500.00 is coded to it"; "Move the Lumber Co" as a vendor failed `jobcost.no-action-wording` (F6).

**Phase 2 changed.** `b4c5b06`: the importer counts the cost rows it left out (dated after the as-of date, a job not in the job list, no cost code, unreadable; voided bills, customer invoices, payments and totals are not costs) and the report says "3 other cost rows in the export were not included: ... The person who prepared this report has the list" and "Every transaction that was read was placed ..."; the verbs agree ("are coded", "use it"). `0c38e4b`: the vendor gate passes. Delivery folder: 3 CSV (jobs at a glance, budget vs actual by cost code, exceptions), README, notes.

**Results at the final code.** main 14/14 and checker 26/26; `messy` exit 0, 14/14 checks; `client-mode` exit 0, 14/14 checks; `no-codes-file` exit 0, 14/14 checks; `gate-vendor` exit 0, 14/14 checks. **At the pilot limit** (`p2-scale-10-jobs`, command below): exit 0, 14/14, 10 jobs (8 active, 2 closed), 66 cost rows, 17 exceptions, and each clone job's totals and exceptions equal its original's (`_tools/verify-3-scale.mjs`). Only the three sentences above differ from Phase 1.

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts job-cost-exceptions --as-of 2026-10-11 --business Invented\ Test\ Co --file jobs=$F/job-cost-exceptions/inputs/jobs-10.csv --file budgets=$F/job-cost-exceptions/inputs/budgets-10.csv --file transactions=$F/job-cost-exceptions/inputs/transactions-10.csv --file codes=$F/job-cost-exceptions/inputs/codes.csv --synthetic --out $F/job-cost-exceptions/outputs/p2-scale-10-jobs.md
```

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-option` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-real-web` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. All four promised parts present, with the read-only and not-advice paragraphs. A second export for the one refresh is run the same way.

**Verdict.** **READY FOR A PAID PILOT** (was NEEDS WORK, small). Everything the page promises is delivered and verified on invented QuickBooks-style files, including the 10-job limit; the report is honest about rows left out; unreadable files fail safely. Owner steps: section 6.

**Turnaround.** Measured: the command takes about 1.6 s; a refresh needs a second export from the buyer; the rest is person time.

---

### Offer 4. Receipt and Invoice Match Review ($99 one business-month; $149 for three client-months)

**Promise** (page, `registry.ts`): matched pairs; exceptions each explained (payment with no document, document with no payment, amount differs, possible duplicate charge or invoice, other currency); for each, the question for the bookkeeper. Read-only, no tax advice. **Buyer sends:** a bank or card CSV and "the month's receipts and invoices (PDFs or photos), or an export from your receipt tool". **Scope:** one month, up to 300 transactions and their documents. **Page terms:** as offer 1.

**Inputs built** (`F/receipt-invoice-matching/inputs/`): Chase-style `bank.csv` (39 rows: 34 payments, 3 deposits, 2 outside the month; processor prefixes such as `SQ *`, `TST*`, `PAYPAL *`, `ACH DEBIT`, store numbers) and Dext-style `documents.csv` (37 rows: 33 usable, plus a credit note, a statement, one outside the month, one with an unreadable date). Planted: 26 matched pairs and 13 exceptions: 2 amount differs (a tip at 18%, a part payment at exactly 20%), 1 duplicate charge, 1 duplicate document, 5 payment with no document (one whose receipt is 6 days away, one whose invoice is in euros), 3 document with no payment, 1 different currency. Messy: a card export with title lines, positive spending, `($5,000.00)` credits, `Account #`, BOM, CRLF, a Total row, plus an Expensify-style documents file.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts receipt-invoice-matching --as-of 2026-10-11 --business Invented\ Test\ Co --opt periodFrom=2026-09-01 --opt periodTo=2026-09-30 --file transactions=$F/receipt-invoice-matching/inputs/bank.csv --file documents=$F/receipt-invoice-matching/inputs/documents.csv --opt vendorAliases=AMZN\ MKTP\ US=Amazon --opt account=Checking\ 2290 --synthetic --out $F/receipt-invoice-matching/outputs/p2-main.md --bundle $F/receipt-invoice-matching/bundle-p2-main
```

**Phase 1 found.** With only `AMZN MKTP US=Amazon` aliased (as the documentation shows): 25 pairs and 15 exceptions, because the Zoom charge (bank text "ZOOM VIDEO") and the invoice from "Zoom" fail the name rule; with the one extra alias 26 pairs and 13 exceptions, checker 11/11. Defects: a PDF or JPEG as the documents file exited 2 with "no column for vendor" and bytes in a note (F3); **a card export with spending as positive amounts, run without `spendingSign`, gave "0 matched pairs, 36 exceptions" with exit 0 and 13/13 checks (F4a)**; an `IRS USATAXPYMT` payment in the bank text failed the tax-words checks (F6); "34 bank and card transactions" for a 39-row export (F2).

**Phase 2 changed.** `8783ef3`: the sign guard (see F4) stops the wrong-sign file with exit 2: "27 of the 33 receipts and invoices match the amount of a row read as money in, and 0 match a money-out row ... run again with spendingSign=positive". `facf566`: each half of a same-amount, same-week pair under different names now points at the other ("Invoice D-16 from Zoom is for the same amount and 0 days away, but the name differs; it may be the same business written another way"), so the two extra exceptions explain themselves. `02f69d7`: "it is a PDF, not a text export. This file should be: Receipts and invoices export (CSV from your receipt tool ...)". `0c38e4b`: the IRS gate passes. Delivery folder: 2 CSV (matched, exceptions for review), README, notes (6 left-out notes).

**Results at the final code.** `p2-main-with-alias` (the audit's command plus `ZOOM VIDEO=Zoom`, below) is byte-identical to Phase 1 and passes the checker 11/11; `p2-main` (the documented alias only) passes 7/11 as before, now with the two Zoom rows pointing at each other. `messy` exit 0, 13/13 checks; `client-mode` exit 0, 13/13 checks; `scale-306-transactions` exit 0, 13/13 checks; `gate-irs` exit 0, 13/13 checks; `wrong-sign-default` exit 2.

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts receipt-invoice-matching --as-of 2026-10-11 --business Invented\ Test\ Co --opt periodFrom=2026-09-01 --opt periodTo=2026-09-30 --file transactions=$F/receipt-invoice-matching/inputs/bank.csv --file documents=$F/receipt-invoice-matching/inputs/documents.csv --opt vendorAliases=AMZN\ MKTP\ US=Amazon\;ZOOM\ VIDEO=Zoom --opt account=Checking\ 2290 --synthetic --out $F/receipt-invoice-matching/outputs/p2-main-with-alias.md --bundle $F/receipt-invoice-matching/bundle-p2-main-with-alias
```

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-period` 2, `neg-empty` 2, `neg-merchant-domains` 3, `neg-missing-file` 2, `neg-no-declaration` 3, `neg-pdf-receipts` 2, `neg-photo-receipts` 2, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2, `wrong-sign-default` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. The CSV path delivers every promised section with the bookkeeper question on each row. **The PDF/photo path is not delivered at all**: nothing extracts vendor, date and total from a document, so for 300 transactions someone must type each document into a sheet first, none of it covered by the runner.

**Verdict.** **NEEDS WORK, large.** Missing: reading PDFs and photos (L), or narrowing the page to a receipt-tool export or a spreadsheet (owner wording, S, proposal in section 7). With that wording the CSV path is deliverable today. Vendor-name matching still needs the operator to add an alias when two names share no word (now flagged by the hint).

**Turnaround.** Measured: the command takes about 1.5 s; the document-extraction step is unmeasured and may dominate.

---

### Offer 5. Unpaid Invoice Tracker with Draft Reminders ($149 for four weekly reports)

**Promise** (page, `registry.ts`): an aging report (current, 1 to 30, 31 to 60, 61 to 90, 90+) and total per customer; invoices needing a reminder this week and why; a draft reminder for each, friendly then firmer, never threatening, with exact number, balance and due date; a list not chased and why. Read-only. **Buyer sends:** open-invoices export "(number, customer, contact, issue date, due date, amount, amount paid)", terms and how to pay, disputes. **Scope:** up to 200 open invoices, four weekly reports. **Page terms:** as offer 1.

**Inputs built** (`F/unpaid-invoice-tracking/inputs/`): FreshBooks-style `invoices.csv`, 22 invoices plus two unreadable rows (due date written "next friday"; amount "TBD") and a Total row: 20 open ($52,755.50; 17 overdue $49,505.50), 12 reminders due (boundaries at 1, 30, 31, 60, 61 days; one reminded exactly 14 days ago is due, one 13 days ago is not), tones 5 / 3 / 4, a part payment, 2 disputed (one by column, one by option), 1 with no email, 1 paid, 1 credit balance, 3 not yet due. Variants: messy (BOM, CRLF, alias headers, mixed dates, `-` for no payment, grand total), `invoices-qbo-no-email.csv` (stock QuickBooks Online "Open Invoices" columns), and the same export without the contact-name column.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts unpaid-invoice-tracking --as-of 2026-10-11 --business Invented\ Test\ Co --opt signOff=Lena\\nInvented\ Test\ Co --opt paymentInstructions=Pay\ online\ at\ https://pay.example.com/invented-test-co\ or\ by\ check\ to\ the\ address\ on\ the\ invoice. --opt terms=Net\ 30 --opt disputed=I-3016 --file invoices=$F/unpaid-invoice-tracking/inputs/invoices.csv --synthetic --out $F/unpaid-invoice-tracking/outputs/p2-main.md --bundle $F/unpaid-invoice-tracking/bundle-p2-main
```

**Phase 1 found.** Checker 15/15 (every figure, tone and reason; the part-payment draft says "the remaining $1,275.50 ... thank you for the $1,000.00"); 18/18 QA. Defects: "Hi Dr.,", and "Hi Harborview," with no contact column (F5); a stock QuickBooks report has no email column, so all 17 overdue invoices were "not chased: no usable email", 0 drafts, exit 0, nothing said why; the two unreadable invoices are missing from the aging and from the report (F2); a card "fee" in the payment instructions or "Legal" in a sign-off trips `invoices.no-threat-words`.

**Phase 2 changed.** Greetings (`86faa13`): "Hi Anita,", "Hi there," for a business. `4077369`: the importer notes "there is no email column, so no reminder draft can be written" (or "the Email column is empty on every invoice"). Delivery folder: 5 CSV (aging, outstanding by customer, reminders due, draft reminders, not chased), README, notes (2 left-out notes: the unreadable invoices).

**Results at the final code.** main 18/18 and checker 15/15; `messy` exit 0, 18/18 checks; `client-mode` exit 0, 18/18 checks; `scale-220-invoices` exit 0, 18/18 checks; `no-contact-name` exit 0, 18/18 checks; `qbo-no-email` exit 0, 18/18 checks; `gate-fee` exit 1, 17/18 checks; `gate-legal-name` exit 1, 17/18 checks. `gate-fee` and `gate-legal-name` still stop with exit 1 on purpose: the text is the operator's own (payment instructions, a sign-off without the business name), not the client's data.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-empty` 2, `neg-missing-file` 2, `neg-missing-option` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. Aging, reminders, drafts and not-chased are all present. Not as promised: unreadable invoices are not in the aging (reviewer notes only); an export with no email address yields no drafts.

**Verdict.** **NEEDS WORK, small.** Missing: page wording "contact name and email" (proposal in section 7); showing unreadable invoices in the buyer's report (M); the intake step.

**Turnaround.** Measured: the command takes about 1.4 s; weekly refreshes need a new export each week from the buyer.

---

### Offer 6. Website Health, Accessibility and Booking-Form Check ($49, Website Snapshot plus form check)

**Promise** (page, `registry.ts`): the Website Snapshot Report (up to 5 public pages, five accessibility checks, basic site health, a plain-English fix list) plus, for each booking or contact form, labels, field types, required markers, field count, submit wording, spam protection and confirmation message, each with a fix. Not an audit, no certification, no form submitted. **Buyer sends:** up to five page addresses and confirmation of ownership. The page links the live Ko-fi order. **Page terms:** the Snapshot's own terms are separate.

**Inputs built** (`F/website-health-report/inputs/`): An invented salon site at `invented-salon.example`: `page1.html` (home: 3 images without alt, no `lang`, h1 then h4, a pale inline colour, an unlabelled newsletter field), `page2.html` (booking form: 12 fields, 3 placeholder-only fields, email and phone typed as text, a free-text date, required fields with no marker, "Submit" button, no spam protection, no confirmation wording), `page3.html` (contact form with exactly one fault: phone typed as text), `page4.html` (clean page, no form), `headers.txt` (HSTS and X-Frame-Options present; CSP and Referrer-Policy absent). Messy: BOM, CRLF, upper-case tags, unquoted attributes, a form built by script (must not be seen), an unclosed label.

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts website-health-report --as-of 2026-10-11 --business Invented\ Test\ Co --file page1=$F/website-health-report/inputs/page1.html --file page2=$F/website-health-report/inputs/page2.html --file page3=$F/website-health-report/inputs/page3.html --file page4=$F/website-health-report/inputs/page4.html --file headers=$F/website-health-report/inputs/headers.txt --opt urls=https://invented-salon.example/\,https://invented-salon.example/book\,https://invented-salon.example/contact\,https://invented-salon.example/about --synthetic --out $F/website-health-report/outputs/p2-main.md --bundle $F/website-health-report/bundle-p2-main
```

**Phase 1 found.** Checker 9/9 (all 7 accessibility groups, all 14 booking-form findings, the single contact finding, site-health values, third-party domains, "No forms found on: about page"; the newsletter form read as "other, not checked"; the script-built form never appears; no false finding on the clean contact form); 13/13 QA. **Defects (F3, F4b): a JPEG, a plain-text note, a bot-check page ("Just a moment...") and a 404 page saved as the "page" all exited 0 with 13/13 and "No findings from the five checks on this page"**; a form field labelled "Certification number" failed `web.no-compliance-claims`.

**Phase 2 changed.** `509fccf`: those four now stop with exit 2 and "Page 1 (https://invented-salon.example/) looks like an error or bot-check page (its title is "Just a moment..."), not the site's own page. Open the real page in a browser, wait until it has loaded, choose Save Page As (HTML only), and run again." (the JPEG is stopped earlier, by `02f69d7`, as "a photo (JPEG), not a text export"); the sample pages' report is byte-identical. `0c38e4b`: the field-label gate passes. Delivery folder: 4 CSV (accessibility checks, site health, booking and contact forms, fix checklist), README, notes.

**Results at the final code.** main 13/13 and checker 9/9; `messy` exit 0, 13/13 checks; `client-mode` exit 0, 12/12 checks; `five-pages` exit 0, 13/13 checks; `gate-field-label` exit 0, 13/13 checks.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `junk-404-page` 2, `junk-blocked-page` 2, `junk-image` 2, `junk-plain-text` 2, `neg-bad-url` 2, `neg-empty` 2, `neg-gap` 2, `neg-missing-file` 2, `neg-no-declaration` 3, `neg-no-urls` 2, `neg-real-domain` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-url-mismatch` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. Every promised part is present. Two separate flows exist: the live `npm run snapshot:report` fetches pages and writes the PDF the Snapshot terms promise, with no form check; `offers-run website-health-report` has the form check but reads HTML a person must first save (and headers from `curl -sI`).

**Verdict.** **NEEDS WORK, medium.** Missing: the saving of up to five pages and one header block is manual and unwritten, and the form-check report has no PDF; joining the live fetch flow and the form check is M. A buyer who sends addresses (as the page asks) cannot get this report without that person step.

**Turnaround.** Measured: the live product states 2 business days after payment and a valid URL list; the form check adds person time (saving pages) that was not measured.

---

### Offer 7. CRM Duplicate and Data-Quality Check ($99, up to 5,000 records)

**Promise** (page, `registry.ts`): duplicate groups with confidence and why; a suggested record to keep and the reason; conflicts (owners, stages); data-quality issues (emails, phones, formatting, state codes, stale leads); "a proposed-changes sheet you review and apply in your own CRM". Nothing is merged. **Buyer sends:** a contacts CSV, and "before you send it, we agree in writing how your contacts' data is handled and when it is deleted". **Scope:** one export, up to 5,000 records, one report. **Page terms:** as offer 1.

**Inputs built** (`F/crm-cleanup/inputs/`): Spreadsheet-style `contacts.csv`, 320 records: 19 planted groups (7 certain: 6 by email with different case and a trailing space plus one 3-record chain; 9 likely: same phone in another format, same name and company, same name at the company's email domain; 3 possible: last names one letter apart), owners and stages differing inside groups, 21 quality defects (5 malformed emails, 4 with neither email nor phone, 4 ALL CAPS and 3 lower-case names, 3 states written "Texas", 2 "Tex."), 8 stale leads and, as near misses, 3 at 119 days, 3 at exactly 120 days and 5 old customers or lost (none may be listed). `contacts-full-defects.csv` adds 4 phone numbers of the wrong length (audit-only run). `contacts-5000.csv`: 5,340 records, the same pattern 17 times. Messy: HubSpot-style (BOM, CRLF, `Lifecycle Stage` words, `2025/09/14 10:20` dates, a blank row, a total row).

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts crm-cleanup --as-of 2026-10-11 --business Invented\ Test\ Co --file contacts=$F/crm-cleanup/inputs/contacts.csv --opt source=Sales\ spreadsheet\ export\ \(invented\) --opt staleAfterDays=120 --synthetic --out $F/crm-cleanup/outputs/p2-main.md --bundle $F/crm-cleanup/bundle-p2-main
```

**Phase 1 found.** Checker 10/10 (member sets of all 19 groups, confidence, the keep suggestion by the stated rule, conflicts, the 21 issue rows by kind, the 8 stale ids, near misses absent, proposed changes never delete or merge); 12/12 QA; 5,340 records in 2.3 s, 323 groups all found; the audit-only run adds the 4 phone-length rows. Defects: the "sheet" was a Markdown table (260 rows at 320 contacts, 4,337 rows and a 515 KB file at 5,340); a stale lead at "Certified Auto Repair" failed `std.no-banned-claims` (F6).

**Phase 2 changed.** Delivery folder (`3cffb63`): `03-proposed-changes.csv` (record, field, current, proposed, reason: 260 rows), `01-duplicate-groups.csv`, `02-data-quality-issues.csv`, `04-stale-leads.csv`, `report.html`, README. `0c38e4b`: the company-name gate passes.

**Results at the final code.** main 12/12 and checker 10/10; `messy` exit 0, 12/12 checks; `client-mode` exit 0, 12/12 checks; `scale-5340` exit 0, 12/12 checks; `full-defects-audit-only` exit 0, 12/12 checks; `gate-company-name` exit 0, 12/12 checks. The 5,340-record report is byte-identical to Phase 1 and takes 1.88 s wall, 445 ms in-process with the folder.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-option` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-no-declaration` 3, `neg-no-stage-column` 2, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. Every promised analysis is present and correct; the sheet is now a CSV a CRM admin can filter and review.

**Verdict.** **READY FOR A PAID PILOT** (was NEEDS WORK, small). The one blocking gap, the sheet being a Markdown table, is closed and re-verified, including at 5,340 records. Owner steps: section 6, including the written data agreement the page promises (an email exchange is enough; the repository holds no template).

**Turnaround.** Measured: 5,000 records take about 2 seconds to process; reviewing thousands of proposed changes is person time.

---

### Offer 8. Support Inbox Triage with Reply Drafts ($79, one week, up to 150 messages)

**Promise** (page, `registry.ts`): every message sorted into one of the types; urgency with the reason; a reply draft for each message that needs one, "following your policies"; legal or safety messages flagged for a person with no draft; what customers wrote about most. **Buyer sends:** a week of support email (an export or "forwarded copies"), policies, tone, sign-off, and a written agreement on data handling first. **Page terms:** as offer 1.

**Inputs built** (`F/inbox-triage/inputs/`): 52 invented customer messages for an invented candle shop, written as customers write rather than to fit the rules, each with a human label: 8 legal or safety (lawyer, allergic reaction, fire, chargeback, a burn, a cut finger, "small claims", a Better Business Bureau and attorney-general threat), 5 spam, 15 urgent, plus billing, refund, order status, technical, complaint, sales, thanks, an out-of-office reply and two delivery-failure notices. Shapes: a help-desk CSV (`messages.csv`), a Gmail-tool CSV with BOM, CRLF, RFC dates, "Last, First" names and HTML bodies (`messages-gmail-messy.csv`), an mbox with HTML-only and quoted-printable mail and a Sent message (`support.mbox`), and an extras file (own reply, empty message, duplicate id).

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts inbox-triage --as-of 2026-10-11 --business Invented\ Test\ Co --opt signOff=Alex\\nInvented\ Test\ Co\ support --opt refundWindowDays=30 --opt shippingTime=3-5\ business\ days --opt ownAddresses=invented-test-co.example --file messages=$F/inbox-triage/inputs/messages.csv --synthetic --out $F/inbox-triage/outputs/p2-main.md --bundle $F/inbox-triage/bundle-p2-main
```

**Phase 1 found.** Measured against the human labels: category exactly right for 33 of 52 (all 19 misses fell to "other", never to a wrong specific type); legal/safety 5 of 8 (the three missed, "Burn", "Cut finger" and "Small claims", got a draft); spam 5/5; urgent 11 of 15; 42 drafts, 26 of them one general sentence, 4 to a thank-you, an out-of-office reply and two bounce notices. **Exit 1, 12/14 checks:** `inbox.order-number-in-drafts` failed because the general reply never repeated an order number, and `inbox.no-promises` failed because it read the draft's subject, which echoes the customer's own ("Re: Discount code error"); with those 12 messages removed (`qa-clean`) the same code passed 14/14. The mbox run silently lost 5 HTML-only customer emails, "Charged twice!!!" and the chargeback among them (F2).

**Phase 2 changed.** `b9a552b`: the general reply repeats the order number; the promise check reads the body only; an mbox message whose only text is HTML is read as text; bulk and auto-reply headers, out-of-office and "Undeliverable" subjects and mailer-daemon or postmaster senders are skipped with a note; "needs a person" also catches small claims, the Better Business Bureau, consumer protection, urgent care, ambulance, hospitalised, a trip to the hospital, poison, stitches, "burned my hand", "cut my finger" and "reporting you to" (everyday talk of candles that "burn evenly" does not match). `86faa13`: greetings. Delivery folder: 4 CSV (triage, draft replies, needs a person, themes), README, notes (3 left-out notes: the auto-replies).

**Results at the final code.** Same 52 messages: **exit 0, 14/14 checks**; category exact match 33/52 (unchanged: the classifier's limit); legal and safety **8/8** recall, 8/8 precision (was 5/8); spam 5/5; urgent 14/15 with no false alarm (was 11/15; the missed one is a "double billed" message); 36 drafts (was 42), the only draft that need not exist is the thank-you; 10 of the 36 are the one general sentence. The CSV, Gmail-style CSV and mbox exports now give the same triage (`messy-mbox`: 53 messages in the file, 49 read, 3 automatic skipped, the Sent one skipped). `messy-gmail-csv` exit 0, 14/14 checks; `messy-mbox` exit 0, 14/14 checks; `with-extras` exit 0, 14/14 checks; `scale-150` exit 0, 14/14 checks; `qa-clean` exit 0, 14/14 checks; `client-mode` exit 0, 14/14 checks.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-option` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-missing-option` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. Types, urgency with reasons, drafts and themes are present. The drafts are standard replies by message type, not written for each message; themes are keyword counts and can mislabel ("rude and hung up" counted as "slow or missing replies").

**Verdict.** **NEEDS WORK, large** (was NEEDS WORK, small and large). The false "not ready" gate, the dropped HTML mail, the auto-reply drafts and the safety recall are fixed. Still missing: 19 of 52 natural messages are filed as "other" and 10 get the one general sentence (classifier recall, L), or page wording that says so (owner, S); the written data agreement is an owner step; "forwarded copies" cannot be read (wording).

**Turnaround.** Measured: the command takes about 1.5 s; reviewing up to 150 drafts is person time.

---

### Offer 9. Product Catalog Cleanup and Cross-Store Check ($99, up to 1,000 SKUs)

**Promise** (page, `registry.ts`): missing required fields per store; bad barcodes (check digit); duplicate SKUs, SKUs in one store only, price and stock differences; titles over a length limit, inconsistent variant names; "a proposed-changes sheet you review and import yourself". **Buyer sends:** a product CSV from each store and "which store is your source of truth". **Scope:** up to 1,000 SKUs. **Page terms:** as offer 1.

**Inputs built** (`F/catalog-cleanup/inputs/`): A Shopify export (`storefront.csv`: repeated handles, extra image rows, HTML descriptions) and an Amazon All-Listings-style tab-separated file (`marketplace.txt`), 126 SKUs with 78 issue rows planted across both (no images, short descriptions, invalid, missing, letter, short and scientific-notation barcodes, long titles, duplicate SKUs, a `" hc-1090 "` SKU, an unreadable price, nonstandard sizes and colours, missing brand), 44 cross-store differences (price 10, stock 12, a real size difference 2, barcode 18, brand 2), 51 proposed changes, 16 SKUs in one store only; `storefront-1000.csv` and `marketplace-1000.txt` give 1,050 SKUs. Messy: BOM and CRLF Shopify plus an eBay-style CSV (`CustomLabel`, `UPC`, `PicURL`, `$` prices).

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts catalog-cleanup --as-of 2026-10-11 --business Invented\ Test\ Co --file storefront=$F/catalog-cleanup/inputs/storefront.csv --file marketplace=$F/catalog-cleanup/inputs/marketplace.txt --opt storefrontName=Hearth\ Shop --opt marketplaceName=Marketplace --synthetic --out $F/catalog-cleanup/outputs/p2-main.md --bundle $F/catalog-cleanup/bundle-p2-main
```

**Phase 1 found.** Checker 35/35 (issues by store and kind as SKU sets, differences by field, changes by field, one-store count, every change targets the marketplace unless it is a naming fix, inventory never proposed); 11/11 QA; 1,050 SKUs in 2.1 s. Defects: the "sheet you import yourself" was a Markdown table (429 rows at 1,000 SKUs); a storefront title "Satisfaction guaranteed Oak Tray" failed `std.no-banned-claims` (F6).

**Phase 2 changed.** Delivery folder: `03-proposed-changes.csv` (store, SKU, field, current, proposed, reason), `01-issues-by-product.csv`, `02-cross-store-differences.csv`, `04-skus-in-one-store-only.csv`, `report.html`, README. `0c38e4b`: the title gate passes.

**Results at the final code.** main 11/11 and checker 35/35; `messy` exit 0, 11/11 checks; `client-mode` exit 0, 11/11 checks; `scale-1000` exit 0, 11/11 checks; `gate-product-title` exit 0, 11/11 checks; `neg-source-marketplace` exit 2. The 1,050-SKU report is byte-identical to Phase 1.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-bad-option` 2, `neg-empty` 2, `neg-missing-file` 2, `neg-no-declaration` 3, `neg-real-email` 3, `neg-real-phone` 3, `neg-real-web` 3, `neg-source-marketplace` 2, `neg-wrong-columns` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/`. Every analysis promised exists. The sheet is a CSV review sheet, not a store import template; only the storefront can be the source of truth (`sourceOfTruth=marketplace` stops with exit 2 and an explanation).

**Verdict.** **NEEDS WORK, small.** Missing: page wording on "import yourself" and "source of truth" (proposal in section 7); store-specific import files (Shopify, Amazon), if the buyer expects to import without editing (M).

**Turnaround.** Measured: processing takes about 2 s; applying the changes is the buyer's work.

---

### Offer 10. Short-Form Ad Variations from Your Video ($99 for three variations)

**Promise** (page, `registry.ts`): three vertical 9:16 variations of up to 15 seconds, each opening with a different hook; burned-in captions plus SRT files; a cut sheet; one round of revisions. **Buyer sends:** the video file, ownership confirmation, offer, three points, brand colours or logo. **Page terms:** as offer 1.

**Inputs built** (`F/video-ad-variations/inputs/`): What the runner takes is not the video but a caption file (`.srt` or `.vtt`) of it and the video's length, size and frame rate as options. Inputs: an invented 118-second dog-groomer testimonial as `transcript.srt` (32 cues), a messy SRT (BOM, CRLF, a tag, a two-line cue, an empty cue), a WebVTT (`NOTE`, cue ids, dot separators, voice tags).

**Exact command** (`p2-main`; the Phase 1 run is the same with `--out .../main.md` and no `--bundle`):

```sh
F=/tmp/claude-0/-home-user-myreloapp/2ae6976b-817d-5e45-99d2-f95fe54aa7ec/scratchpad/fulfil
cd /home/user/wt-fulfil && npx tsx scripts/offers-run.ts video-ad-variations --as-of 2026-10-11 --business Invented\ Test\ Co --file transcript=$F/video-ad-variations/inputs/transcript.srt --opt fileName=maple-lane-testimonial.mp4 --opt durationSec=118 --opt width=1920 --opt height=1080 --opt fps=30 --opt rightsConfirmed=yes --opt offer=Full-service\ dog\ grooming\,\ booked\ online --opt audience=Dog\ owners\ within\ ten\ miles --opt hooks=Your\ dog\ deserves\ a\ spa\ day\|They\ called\ before\ the\ first\ clip\|Matted\ coat\ to\ mirror\ shine\ in\ one\ visit --opt cta=Book\ a\ groom\ at\ maplelanegrooming.example --synthetic --out $F/video-ad-variations/outputs/p2-main.md --bundle $F/video-ad-variations/bundle-p2-main
```

**Phase 1 found.** Checker 10/10 mechanical checks (every clip starts and ends on a caption boundary and lies inside the 118 s source; each variation 14.8 / 14.8 / 13.4 s against the 15 s limit including the 2-second end card; hooks exactly as given; captions at most 32 characters and 2 lines; caption words equal the words spoken in the chosen clips; centre crop 608x1080 at x=656 scaled to 1080x1920); 14/14 QA. Editorial: the hook that quotes an actual line used it; "They called before the first clip" fell back to the closing 12 seconds; variations 1 and 2 share three cues. **Bug:** the end card broke any word over 24 characters in the middle: `printf '%s\n' 'Book a groom at' 'maplelanegrooming.exampl' 'e' > variation-1-cta.txt`. The SRT files and the `printf` and `ffmpeg` lines were indented list text inside the Markdown for a person to copy out by hand.

**Phase 2 changed.** `f3c6ede`: hook and end-card text keep a long word whole and shrink to fit 90% of the frame width (a short card keeps its size; the sample's commands are unchanged), so the line now reads `'Book a groom at' 'maplelanegrooming.example'`. The delivery folder carries `variation-N.srt`, `variation-N-hook.txt`, `variation-N-cta.txt` and `render.sh` (the ffmpeg commands, headed "Amber did not run it"), each listed in the README; `sh -n render.sh` accepts it.

**Results at the final code.** main 14/14 and checker 10/10 (the only difference from Phase 1 is the end-card text); `messy-srt` exit 0, 14/14 checks; `messy-vtt` exit 0, 14/14 checks; `client-mode` exit 0, 13/13 checks; `short-video-length` exit 1, 13/14 checks. **`ffmpeg` is not installed here and there is no network, so no command was run and no video exists from this audit.** The earlier format previews (`public/offers/samples/video-ad-variations/README.txt`) were rendered silent and uncaptioned from a different clip with a hand-adjusted hook position and a font file path; the generated commands use `font=Sans`, which needs ffmpeg built with fontconfig. Captions plus sound plus end card from these commands have not been seen working.

**Negative set at the final code** (exit codes; 2 usage or file problem, 3 refused, 1 not ready): `neg-empty` 2, `neg-missing-file` 2, `neg-missing-option` 2, `neg-no-declaration` 3, `neg-not-captions` 2, `neg-real-domain` 3, `neg-real-email` 3, `neg-rights-not-confirmed` 1, `neg-two-hooks` 2.

**The file the buyer gets.** `p2-main.md` and `bundle-p2-main/` (3 CSV, `report.html`, `README.txt`, `render.sh`, and 9 variation files). The runner gives an editor a plan, caption files and a script, not the three videos the page promises.

**Verdict.** **NOT DELIVERABLE YET.** Missing: (1) a render with captions and sound on a real clip, proven on a machine with ffmpeg and a font (L); (2) a caption source for a bare video, since nothing in the path turns speech into an SRT (L); (3) a channel for large video files to and from the buyer (M); (4) revisions: a manual step with no tool. The negative that works: `rightsConfirmed=no` produces no cut plan (exit 1, "the client must confirm they own the video").

**Turnaround.** Measured: the plan takes about 1.4 s; everything that makes it a video is person time and unmeasured.


---

## 5. Time to produce, and an honest turnaround statement

**Measured.** Wall time of the whole command, warm: 1.36 to 1.58 seconds for every offer including the delivery folder (the ten `p2-main` runs; the first call after the folder was created took 7.6 s while TypeScript compiled). Bare `npx tsx -e 1` start-up alone is 0.8 s. In-process time, calling `runPilot` directly with `--bundle` (files held in memory): 33 ms for offer 1 (41 rows), 235 ms for offer 9 (1,050 SKUs), 445 ms for offer 7 (5,340 records; 358 ms before the bundle). Largest runs at the pilot limits, wall time at the final code: offer 7 5,340 records 1.88 s; offer 9 1,050 SKUs 1.57 s; offer 1 492 call rows 1.63 s; offer 3 at 10 jobs 1.48 s; offer 4 306 transactions and 297 documents 2.01 s; offer 8 150 messages 1.64 s; offer 2 216 estimates 1.54 s; offer 5 220 invoices 1.56 s. The demos use no paid service (`directCostUsd` is 0).

**Not measured (depends on a person):** replying to the inquiry and agreeing scope and date; the buyer sending files; any conversion the files need (forwarded copies into a CSV; PDFs and photos into a spreadsheet; pages saved as HTML for offer 6; a video into a caption file); reading the reviewer notes; reviewing the report and editing drafts; zipping and sending the folder; for offer 10 rendering and revisions.

**What can be said without promising a date:** "The analysis itself takes seconds once we have files we can read. The date we deliver depends on how soon we receive those files and how much preparation they need, so we confirm the delivery date in writing before you pay." (Section 7 gives the page text.)

---

## 6. The human and ops path, as it exists today

1. **Inquiry.** The page form records name, business, email, phone, message and consent through `/api/offers/inquiry`; it has no file upload; nothing is emailed. The owner reads it and replies by email (HANDOFF.md).
2. **Terms and payment.** The shared sentence promises scope, price and delivery date by email before files or payment. For offers 2 to 5 and 7 to 10 the owner sends a payment request by hand and records `offer-record: <id> paid $<amount> <reference>` on issue #105. Offer 6 has the live Ko-fi order.
3. **Files reach us.** Undefined beyond the owner's email thread (attachments or links). Offers 7 and 8 say a written agreement on data handling comes first; it can be an email exchange, and the repo holds no template for it.
4. **Who runs the command.** A person with the repository, Node 22 and `node_modules` runs `npx tsx scripts/offers-run.ts <offer> ... --authorized "client, how they authorised it, date" --out report.md --bundle ./deliver/<client>` (RUNNER.md lists the options per offer). The runner trusts the authorisation sentence.
5. **Who reviews.** The pages say a person reviews every report. What that person must check now exists: `./deliver/<client>.reviewer-notes.txt` states the data declaration, the checks (and any that failed), the rows or messages left out (first), everything the importer reported, and a before-sending list. The run also ends with a line counting the left-out notes.
6. **How the file gets back.** The owner zips the folder (the README tells the buyer what each file is and how to open it) and emails it by hand. Nothing here sends anything. There is no review-gate command and no order record of the kind the Snapshot has (`snapshot:review`, `snapshot:orders`).
7. **Recording.** `offer-record: <id> delivered <hours>h` on #105 ("hours from files received to report delivered"), plus `cost` lines.
8. **Deletion.** "Deleted when you ask" is a manual removal of the input files, the report, the folder and the notes from the machine; no tool.

**Owner steps for the two READY offers (3 and 7):** agree scope, price and a written delivery date by email; for offer 7 agree data handling in writing first; receive the exports by email; run the command with `--authorized` and `--bundle`; read the reviewer notes and the report; settle every failed check and every left-out row; zip the folder and send it; record the delivery on #105; delete the files when asked.

---

## 7. Terms check (report only; no page was edited)

**Compared with the Website Snapshot terms** (`src/app/website-snapshot/terms/page.tsx` and its offer page), which state: what you are buying and what it is not; what can and cannot be checked; your side (ownership confirmation); turnaround ("Payment comes first. You get the report within 2 business days after we have both your payment and a valid list of URLs"); refunds ("If none of your submitted pages can be read and no report can be produced, you get a full refund. Once a report has been delivered, there is no refund, because the work has been done"); delivery ("by email as a PDF ... or a plain Markdown text file"); your data (kept up to 60 days, then deleted; not sold). That terms page is hidden (404) unless Snapshot checkout is enabled.

**What each of the ten offer pages states today** (all ten share one template, `src/app/offers/[slug]/page.tsx`, filled from `registry.ts`):

| Item | State on all ten pages | Gap |
|---|---|---|
| Pilot scope | Clear lists under "The pilot", per offer | Offer-specific limits missing, listed below |
| Price | Clear: amount, unit, "a test price" note | None; offer 6 correctly points to the live $49 |
| Turnaround | None. One shared sentence says scope, price and a delivery date are confirmed by email before files or payment | No statement of when the clock starts or what happens if files are unreadable |
| Refunds | None on any pilot page; no pilot terms page | A paying buyer has no refund rule |
| Delivery format | Not stated | Buyer cannot tell what file they get (the runner now makes a folder: page, spreadsheets, README) |
| Data | One shared sentence ("kept only while the pilot runs, ... deleted when you ask") | Differs from the Snapshot's 60-day statement; no retention length |
| Ownership confirmation | Only offers 6 and 10 ask for it | Offers 1 to 5, 7 to 9 rest on `--authorized` typed by the operator |

**Offer by offer** (scope and price come from the page's own "The pilot" list and price line in `registry.ts`; "none" means the page has no such statement):

| # | Pilot scope as stated | Price as stated | Turnaround | Refund | Unclear or missing |
|---|---|---|---|---|---|
| 1 | One location; last 30 days of calls and inquiries, then two weekly refreshes (three lists); up to 500 calls and 100 inquiries per export | $199 for the two-week pilot (three lists) | none | none | which clock "two weeks" runs on, and when the refresh exports are due |
| 2 | Up to 200 open estimates; four weekly lists, each from that week's export | $249 for four weekly lists | none | none | what happens if the buyer misses a week's export |
| 3 | Up to 10 active jobs; one month of costs: one report, then one refresh from a new export | $449 for up to 10 jobs: the report and one refresh | none | none | when the refresh export is due |
| 4 | One month: up to 300 transactions and their receipts and invoices | $99 for one month of one business (bookkeepers: $149 for three client-months) | none | none | "PDFs or photos" cannot be read; whether the bookkeeper price is 300 transactions per client-month |
| 5 | Up to 200 open invoices; four weekly reports, each from that week's export | $149 for four weekly reports | none | none | as offer 2; the email column |
| 6 | Up to 5 public pages and the forms on them | $49 for up to 5 pages (form check included during the pilot) | none on the pilot page (the Snapshot says 2 business days, on a terms page that is hidden unless checkout is enabled) | none on the pilot page (the Snapshot refunds only if no page can be read) | the Snapshot's turnaround and refund are not repeated on this page |
| 7 | One export of up to 5,000 records; one report | $99 for one report on up to 5,000 records | none | none | when the written data agreement is signed relative to payment; how long files are kept |
| 8 | One week of support email, up to 150 messages; one report with drafts | $79 for one week of email, up to 150 messages | none | none | as offer 7; "forwarded copies" |
| 9 | Up to 1,000 SKUs across two stores; one report | $99 for one report on up to 1,000 SKUs | none | none | which store is the source of truth; what "import yourself" delivers |
| 10 | One source video up to 3 minutes; three variations; one revision round | $99 for three variations | none | none | how a large video file reaches us and goes back; what counts as one revision round; that the finished videos are not yet produced by the runner |

**Proposed shared text** (no date promised, the Snapshot's refund wording, to sit on every pilot page under the price; the owner chooses the retention length):

- *Turnaround.* "We confirm the delivery date in writing before you pay. We deliver by that date once we have both your payment and files we can read."
- *Refunds.* "If we cannot produce your report from the files you send, and you cannot send others we can read, you get a full refund. Once a report has been delivered, there is no refund, because the work has been done. If only some of your files can be read, the report covers those and lists the rest as not read."
- *Delivery.* "Your report arrives by email as a folder: a report you open in any web browser (it prints to PDF), the lists as spreadsheet files, and a short README. We send nothing to your customers and change nothing in your systems."
- *Your data.* "We use your files only to prepare your report. We keep them and the report for up to [60] days so we can answer questions, then delete them, or sooner if you ask. We do not sell your data."
- *Your side.* "By sending files you confirm they are yours to share with us." (offers 1 to 5, 7 to 9)

**Offer-specific wording problems and exact proposals** (the registry sentence to change is quoted first):
- Offer 1 `youSend`: "Your website form submissions, as an export or forwarded copies." The runner reads a CSV only. Proposed: "Your website form submissions as a spreadsheet or CSV export."
- Offer 2 `deliverable`: "...and why: won, lost, asked not to be contacted, or too old to chase." Too-old estimates are in the main list. Proposed: "A list of estimates not chased, and why: won, lost, or asked not to be contacted. Estimates sent more than 60 days ago stay in the main list, marked to confirm whether to re-quote."
- Offer 4 `youSend`: "The month's receipts and invoices (PDFs or photos), or an export from your receipt tool." The pilot cannot read PDFs or photos. Proposed: "The month's receipts and invoices as an export from your receipt tool (Dext, Hubdoc, Expensify) or a spreadsheet with supplier, date, total and invoice number."
- Offer 5 `youSend`: "(number, customer, contact, issue date, due date, amount, amount paid)". Drafts need an email address. Proposed: "(invoice number, customer, contact name and email, issue date, due date, amount, amount paid)".
- Offer 6 `youSend`: "Up to five page addresses..." is accurate for the live product; the form check needs the pages saved. Proposed addition: "We read the public pages; for the form check we may ask you to save a page as HTML if we cannot read it."
- Offer 8 `deliverable`: "A reply draft for each message that needs one, following your policies." The drafts are standard replies by message type. Proposed: "A standard reply draft for each message that needs one, in your sign-off and following your refund and shipping policies; your team writes the message-specific parts." And `youSend`: replace "or forwarded copies" with "or an mbox file".
- Offer 9 `youSend`: "Which store is your source of truth." Proposed: "In the pilot your online store is the source of truth: differences are resolved toward it, and the marketplace listing is what we propose to change." And `deliverable`: "a proposed-changes sheet you review and import yourself" is a review sheet (store, SKU, field, current, proposed, reason); proposed: "a proposed-changes sheet (a spreadsheet file) you review and then enter or import into your store yourself".
- Offer 10 `deliverable`: promises finished videos. Until a render is proven, proposed interim wording: "A cut plan, caption files and edit instructions for three vertical variations of up to 15 seconds, each with a different opening hook. We edit them from your video and send the finished files after we have checked them." (to be used only once the owner is satisfied the render works).

---

## 8. Phase 2: the local commits, the checks, the re-runs and what is still open

**Commits** (local, on `claude/offers-fulfillment-gaps`, oldest first; each message ends with the two required trailer lines, checked; source lines are without tests):

| Commit | Subject | Files | Source lines (+/-) | Test lines (+/-) |
|---|---|---|---|---|
| `86faa13` | Offers 1, 2, 5, 8: drafts greet a person by first name, never "Hi Dr.," or a business name | `__tests__/offers-greeting.test.ts`, `demos/inbox-triage.ts`, `demos/missed-call-follow-up.ts`, `demos/stale-estimate-follow-up.ts`, `demos/unpaid-invoice-tracking.ts`, `names.ts` | +50 / -7 | +90 / -0 |
| `02f69d7` | Offer runner: a PDF, photo or empty file stops the run with a plain sentence; UTF-16 exports are read; rows left out are flagged | `scripts/offers-run.ts`, `__tests__/offers-runner-files.test.ts`, `runner.ts` | +30 / -3 | +88 / -0 |
| `3cffb63` | Offer runner: --bundle writes a folder a buyer can open (web page, CSV per table, README) plus reviewer notes | `scripts/offers-run.ts`, `__tests__/offers-bundle.test.ts`, `bundle.ts`, `runner.ts` | +138 / -4 | +169 / -0 |
| `509fccf` | Offer 6: refuse a saved page that is a bot-check, an error page or not HTML, instead of reporting "no findings" | `importers/__tests__/website-and-video.test.ts`, `importers/website-health-report.ts` | +19 / -0 | +25 / -0 |
| `8783ef3` | Offer 4: ask for the amount sign when the receipts match the rows read as money in | `importers/__tests__/receipt-invoice-matching.test.ts`, `importers/receipt-invoice-matching.ts` | +19 / -1 | +26 / -0 |
| `b9a552b` | Offer 8: stop two false "not ready" checks, read HTML-only mbox mail, skip auto-replies, catch more safety and legal words | `__tests__/inbox-triage.test.ts`, `demos/inbox-triage.ts`, `importers/__tests__/inbox-triage.test.ts`, `importers/inbox-triage.ts` | +29 / -14 | +61 / -2 |
| `f3c6ede` | Offer 10: an end-card web address stays in one piece; the delivery folder carries the SRT, hook, end-card and render files | `__tests__/video-ad-variations.test.ts`, `bundle.ts`, `demos/video-ad-variations.ts`, `types.ts` | +32 / -10 | +54 / -1 |
| `b4c5b06` | Offer 3: do not say the whole export was placed when cost rows were left out; fix "is coded" and "uses" for several transactions | `__tests__/job-cost-exceptions.test.ts`, `demos/job-cost-exceptions.ts`, `importers/__tests__/job-cost-exceptions.test.ts`, `importers/job-cost-exceptions.ts` | +20 / -6 | +33 / -1 |
| `0c38e4b` | Offers: a name or word from the client's own files is not a claim the report makes | `__tests__/offers-client-words.test.ts`, `demos/catalog-cleanup.ts`, `demos/crm-cleanup.ts`, `demos/inbox-triage.ts`, `demos/job-cost-exceptions.ts`, `demos/receipt-invoice-matching.ts`, `demos/stale-estimate-follow-up.ts`, `demos/unpaid-invoice-tracking.ts`, `demos/website-health-report.ts`, `qa.ts`, `runner.ts` | +75 / -24 | +93 / -0 |
| `facf566` | Offer 4: say when an unmatched payment and an unmatched document look like one business written two ways | `__tests__/receipt-invoice-matching.test.ts`, `demos/receipt-invoice-matching.ts` | +5 / -2 | +20 / -0 |
| `4077369` | Offer 5: say when the export has no email addresses, so the run does not end quietly with no drafts | `importers/__tests__/unpaid-invoice-tracking.test.ts`, `importers/unpaid-invoice-tracking.ts` | +2 / -0 | +10 / -0 |
| `c353e21` | Offer runner --bundle test: check that the page loads nothing from outside by its attributes, not by any address in the text | `__tests__/offers-bundle.test.ts` | +0 / -0 | +4 / -1 |

**Checks run at the final commit** (`c353e21`, worktree clean): `npx tsx --test src/lib/offers/__tests__/*.test.ts src/lib/offers/importers/__tests__/*.test.ts` 437 tests in 103 suites, 437 pass, 0 fail (387 before; 50 new); `npx tsc --noEmit -p tsconfig.json` exit 0; `npm run -s qa:typecheck` exit 0; `npx eslint` on every changed `.ts` file: no output. No dependency was added (`package.json` and the lock file are untouched). The same four checks were run before committing: for `86faa13`, `02f69d7`, `3cffb63`, `0c38e4b` and `facf566`/`4077369` on each commit's tree; for `509fccf`, `8783ef3`, `b9a552b`, `f3c6ede` and `b4c5b06` together on the combined tree (they touch different files), then committed one by one; for the test-only follow-up `c353e21` with its own test file and eslint; and the full set once more at the final commit.

**Every recorded run, before and after** (`F/p1-vs-p2.tsv`, `F/_tools/compare-p1-p2.py`): 151 runs re-run at the final code.
- Exit code changed in 15, all intended: **10 went from 1 ("not ready") to 0** (six gate cases whose "claim" was the client's own name, and four offer 8 runs whose two failing checks were wrong); **5 went from 0 to 2** (the wrong-sign card export and the four junk web pages, which Phase 1 turned into clean-looking reports). Every other exit code is the same.
- Reports: 28 byte-identical to Phase 1; 33 differ, each reviewed line by line (greetings, the end-card text, offer 3's three sentences, offer 4's two hint sentences, offer 8's drafts and skipped auto-replies); 85 runs write no report either time (negative cases and refusals); 5 are the stopped runs above.
- The planted-problem checkers pass on the final outputs: `F/phase2-verification.txt` (offers 1, 2, 3, 5, 6, 7, 9, 10 all pass; offer 4 11/11 with the alias and 7/11 without, as in Phase 1; offer 8 category 33/52, legal/safety 8/8, spam 5/5, urgent 14/15).

**Still open, with sizes** (not done, by the brief: nothing large, no new dependency):

| Gap | Offer(s) | Size |
|---|---|---|
| Read PDFs and photos of receipts and invoices | 4 | L (OCR or a typing step per document) |
| Prove a render of the plan with captions and sound on a real clip; captions from audio; move large video files | 10 | L, L, M |
| Classifier recall on natural wording and message-specific drafts | 8 | L |
| Report unreadable or left-out rows in the buyer's report, not only the reviewer notes | 1, 2, 4, 5, 7, 8, 9 | M (one count per importer, as offer 3 now does) |
| Fetch pages and run the form check in one flow; native PDF for the form-check report | 6 | M |
| A native PDF for the other reports (the Snapshot already builds one) | all | M |
| Store-specific import files (Shopify, Amazon) for the proposed-changes sheet | 9 | M |
| Line numbers in notes count blank lines inconsistently | 1, 2, 5, 7, 8, 9 | S |
| Internal comment on the first line of the Markdown report | all | S |
| Page wording and terms text (section 7), written data agreements, intake and deletion steps | all | owner |
