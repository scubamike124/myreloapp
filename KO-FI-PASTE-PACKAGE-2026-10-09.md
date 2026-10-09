# Ko-fi paste package: Website Snapshot Report, $49

Your first channel (owner decision, 2026-10-09). Everything below is paste-ready. Amber publishes nothing; you do every tap. The labels come from Ko-fi's own help pages (help.ko-fi.com articles 360016170433 "What are Ko-fi Commissions?", 29017015021853 "Setting your terms", 360007522474 "How to connect a Stripe account", 360004182937 "Changing email notification settings"); some of those pages are years old, so a label may read slightly differently on your screen. The order of steps holds.

How Ko-fi Commissions work, in one line: the buyer agrees to your terms, orders, and pays at once; the money goes straight to your connected PayPal or Stripe; Ko-fi keeps 5% plus card fees; if you cannot do the work you refund the buyer yourself from PayPal or Stripe.

## 1. Title

```
Website Snapshot Report — $49
```

## 2. Price

```
49
```
Currency USD. Leave "Pay what you want" unticked. Leave "Requires Shipping" unticked. No add-ons.

## 3. Description (paste into the listing's Description box)

```
Get a plain-English check of up to five of your public web pages for $49. Each page is checked for images without alt text, form fields that may lack a label, a missing page language, skipped heading levels and inline colours worth a contrast check. The first page also gets basic site-health items: HTTPS, four common security headers, a privacy-notice link, cookie wording and the third-party domains named in its HTML. You receive a short PDF with a fix checklist, most important first, within 2 business days. How it works: order this commission, agree to the terms, and answer the questions in the request box (your name, your business name, up to five public page addresses, and your two confirmations). We read each page's HTML, a person reviews the report, and it arrives as a PDF by Ko-fi message, or by email if you give an address. A first-pass automated screen of public pages only, not a WCAG, ADA, legal, security or compliance audit, not a legal opinion and not a certification of any kind; it does not change your site. If none of your pages can be read and no report can be produced, you get a full refund; once a report has been delivered there is no refund, because the work has been done. Operated by an AI system under a single US owner; a person reviews every paid deliverable before it is sent. The report is a first-pass automated screen, not an audit or a certification, and it makes no compliance claim.
```

## 4. Terms (paste into Commissions setup, "Your terms"; buyers must agree before they can order)

```
A first-pass automated screen of public pages only, not a WCAG, ADA, legal, security or compliance audit, not a legal opinion and not a certification of any kind; it does not change your site. Public pages only. Up to 5 pages per report. Delivery within 2 business days of a complete request. If none of your pages can be read and no report can be produced, you get a full refund; once a report has been delivered there is no refund, because the work has been done.
```

## 5. The five buyer fields (paste into the listing's "Instructions to Buyer" box; the buyer answers them in the request)

```
Please include in your request:
1. Your name (required)
2. Business name (required)
3. Up to 5 public page addresses (one per line) (required)
4. "I own this website or am authorised to request these checks" (required)
5. "I understand this is a first-pass automated screen, not a legal, compliance or security audit" (required)
If you prefer the PDF by email rather than by Ko-fi message, add the email address.
```

## 6. Notification email

Ko-fi sends request and message notifications to your account email only; there is no separate notification address. Keep your own email as the account email (it also receives login and payment mail).

To let Amber see requests: in your email app, add a filter that forwards every message from `ko-fi.com` to `listings.kofi@inbound.myreelo.com`. Amber reads that mailbox every tick, records each request once as an inquiry with a drafted reply on #105, and never sends anything. If your mail provider asks you to confirm the forwarding address, the confirmation mail lands in that mailbox and its subject line (which carries the code) appears in the Listings report's inquiry table within about five minutes; tell me and I will read it off the report for you.

Also tick, in Ko-fi: Settings → Notification Settings → the commission/order and message emails; Messages → gear icon → "email notification when you get a message".

## 7. Refund and scope language (already inside the description and the terms; here on its own)

- Scope: "A first-pass automated screen of public pages only, not a WCAG, ADA, legal, security or compliance audit, not a legal opinion and not a certification of any kind; it does not change your site."
- Pages: "Public pages only: no login, account, checkout or admin areas. Any page we cannot read is listed as "not checked", with the reason." Up to 5 pages per report.
- Delivery: within 2 business days of a complete request.
- Refund: "If none of your pages can be read and no report can be produced, you get a full refund; once a report has been delivered there is no refund, because the work has been done." A refund is made by you, from PayPal or Stripe, because Ko-fi never holds the money.
- Disclosure: "Operated by an AI system under a single US owner; a person reviews every paid deliverable before it is sent. The report is a first-pass automated screen, not an audit or a certification, and it makes no compliance claim."

## 8. What you tap on your phone, in order (about 35 minutes)

1. Open ko-fi.com in your phone's browser. Tap Sign up. Use your name and your own email. Confirm the email Ko-fi sends.
2. Tap your profile picture → Settings → Payment. Tap Connect under PayPal or Stripe (either; both is fine). Stripe opens its own sign-up window if you have no Stripe account; PayPal asks you to log in. Finish their verification. Without this step a buyer cannot pay. About 15 minutes.
3. Back in the menu, tap Commissions. Turn on the switch that shows your Commissions tab. Tick the pre-purchase messaging option ("allow potential buyers to discuss their commission ideas with you before buying").
4. In the same Commissions setup, find "Your terms". Paste section 4. Save.
5. Tap "Add listing". Leave "Requires Shipping" unticked. Paste section 1 as the name, section 3 as the description, 49 as the price. Leave "Pay what you want" unticked. Paste section 5 into "Instructions to Buyer". Add no add-ons. Optional: upload one to three images exported from the sample report (1:1 or 2:1, for example 600 by 600). Optional: set the open slots to 5. Save.
6. Open your public Ko-fi page, tap the Commissions tab, confirm the listing is visible with its order button. Copy the page link and send it to me; I record it so Amber maintains the listing and reads its mailbox.
7. Settings → Notification Settings: tick the commission, order and message emails. Messages → gear icon → turn on the email for new messages.
8. Optional, five minutes: add the forwarding filter from section 6 in your email app.

## 9. When the first request arrives

- Ko-fi emails you. The order is in the Orders tab (or Payments & Orders, filter "Commissions (not completed)").
- Send the buyer a short acknowledgement by Ko-fi message (Amber drafts it on #105 if the forwarding filter is in place).
- Run the report from the order's details: `npm run snapshot:report -- --client "<business>" --out-dir ./snapshot-runs --pdf <urls>`, then `npm run snapshot:review -- <report.md>`; read it; send the PDF by Ko-fi message or email; mark the commission complete in Orders.
- If none of the pages can be read: refund from PayPal or Stripe and tell the buyer, as the terms say.

---

# Fiverr, the shorter version (second channel; do Ko-fi first)

Everything verbatim is in FIRST-DOLLAR-LAUNCH-2026-10-09.md, section 2. The parts you paste:

- Title (74 of 80, must start with "I will"): `I will check 5 pages of your website for accessibility and security basics`
- Category: Programming & Tech → QA & Review (website testing); confirm the subcategory in the form.
- Tags (5): `website check, accessibility check, security headers, website review, website report`
- Packages: Basic $49 one report up to 5 public pages; Standard $98 two reports up to 10 pages; Premium $147 three reports up to 15 pages. Each: 5 accessibility checks per page plus HTTPS, four security headers, privacy-notice link, cookie wording and third-party domains on the first page, a prioritised fix checklist, PDF, reviewed by a person. Delivery 4 days, 0 revisions.
- Description (1,020 of 1,200): the text in the launch file, section 2 (it opens "A first-pass screen of up to 5 public pages…" and ends with the disclosure).
- FAQ (4 questions) and Requirements (4 items): paste from the launch file, section 2.
- Gallery: three images exported from the sample report; no stock images, no claims in the images.
- No links or contact details anywhere in the gig; Fiverr flags them.

On your phone: install the Fiverr app → Become a Seller → sign up with your real name, email and phone → build the seller profile (photo, description, skills) → complete ID verification with the camera when Fiverr asks → add a payout method (PayPal, Payoneer or US bank) → accept the terms. Creating the gig is easiest in a desktop browser (the fields are long); paste the parts above, add the three images, tap Publish. Fiverr checks a new gig, usually within a day. Buyer messages must be answered within 24 hours from the Fiverr inbox; add the forwarding filter for `fiverr.com` mail to `listings.fiverr@inbound.myreelo.com` and Amber drafts each reply.
