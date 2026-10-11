<!-- Prepared with scripts/offers-run.ts for website-health-report. Invented test data (--synthetic). Review before sending. -->
# Website Health, Accessibility and Booking-Form Check

**Sample made from invented data.**

## What went in

- 4 invented pages of Invented Test Co's site (invented-salon.example): home page, /book page, contact page, about page. The HTML was supplied with this sample; nothing was fetched.
- Response headers were supplied for the first page only, for the site-health checks.
- No form was submitted: the form checks read the HTML only.
- Report date: 2026-10-11.

## Summary

Invented Test Co: 4 pages read from HTML supplied with this sample (home page, /book page, contact page, about page). Nothing was fetched and no form was submitted.

We checked 4 of 4 pages.

The accessibility checks found 7 groups of possible problems: 0 critical, 1 serious, 6 moderate.

Most common: Form fields that may have no accessible name; No page language declared. Others include, for example: Images without alt text.

On the site-health side, 1 item is worth a closer look (listed below).

Forms: 1 booking form and 1 contact form, plus 1 other form not checked here.

/book page, form #appointment-request (booking form, 12 visible fields): 14 findings: 3 high, 5 medium, 6 low.

contact page, form #contact-form (contact form, 4 visible fields): 1 finding: 0 high, 1 medium, 0 low.

Start with: High: /book page, form #appointment-request: Give each field a visible label tied to it (<label for="field-id">); a placeholder is not a label. Fields: "Full name" (placeholder only); "Phone" (placeholder only); "Anything we should know?" (placeholder only).

## Accessibility checks (HTML only)

| Page | Check | Finding |
|---|---|---|
| home page | Images without alt text | serious, 3 potential occurrences. Screen-reader users get no description of the image. |
| home page | Form fields that may have no accessible name | moderate, 1 potential occurrence, an estimate to confirm by hand. People using assistive technology cannot tell what a field is for. This is an estimate from counts of fields and labels, so confirm each field by hand. |
| home page | No page language declared | moderate, 1 potential occurrence. Screen readers may pronounce the page with the wrong voice. |
| home page | Heading levels skip | moderate, 1 potential occurrence. A skipped level (for example h2 to h4) makes the page outline harder to navigate with a screen reader. |
| home page | Inline colours to review for contrast | moderate, 1 potential occurrence. Colour declarations were found in the page's HTML. Contrast was NOT measured; this is only a prompt to check. |
| /book page | Form fields that may have no accessible name | moderate, 3 potential occurrences, an estimate to confirm by hand. People using assistive technology cannot tell what a field is for. This is an estimate from counts of fields and labels, so confirm each field by hand. |
| /book page | No page language declared | moderate, 1 potential occurrence. Screen readers may pronounce the page with the wrong voice. |
| contact page | All five checks | No findings from the five checks on this page. That does not mean the page is accessible. |
| about page | All five checks | No findings from the five checks on this page. That does not mean the page is accessible. |

Static HTML only, one page per URL: no browser is run and scripts are not executed, so content added by JavaScript is not seen. Colour contrast is not measured, and keyboard use, focus order, ARIA correctness, captions and reading order are not tested.

## Site health (first page)

| Check | Result |
|---|---|
| Served over HTTPS | yes |
| Content-Security-Policy header | not found |
| Strict-Transport-Security header | present |
| Clickjacking protection (X-Frame-Options or frame-ancestors) | present |
| Referrer-Policy header | not found |
| Privacy notice linked | link found |
| Cookie / privacy-choice wording | none found |
| Third-party domains seen in the HTML | 2: cdn.bookwidget.example, fonts.example.net |

First page: https://invented-salon.example/, read from the HTML and response headers supplied with it; nothing was fetched. A missing security header is something to review, not proof of a vulnerability; a present header is not proof it is configured well.

## Booking and contact forms

| Form | Field | Finding | Severity | Fix |
|---|---|---|---|---|
| /book page, form #appointment-request | "Full name" (placeholder only) | No label, only a placeholder ("Full name"). It disappears as soon as someone types, and screen readers may not read it out. | high | Add a visible label tied to the field: <label for="field-id">…</label>, after giving the field that id. |
| /book page, form #appointment-request | "Phone" (placeholder only) | No label, only a placeholder ("Phone"). It disappears as soon as someone types, and screen readers may not read it out. | high | Add a visible label tied to the field: <label for="field-id">…</label>, after giving the field that id. |
| /book page, form #appointment-request | "Anything we should know?" (placeholder only) | No label, only a placeholder ("Anything we should know?"). It disappears as soon as someone types, and screen readers may not read it out. | high | Add a visible label tied to the field: <label for="field-id">…</label>, after giving the field that id. |
| /book page, form #appointment-request | Email | Email field is type="text", so phones show the ordinary keyboard and the browser cannot check the address. | medium | Change it to <input type="email" autocomplete="email">. |
| /book page, form #appointment-request | "Phone" (placeholder only) | Phone field is type="text", so phones show the letter keyboard instead of the number pad. | medium | Change it to <input type="tel" autocomplete="tel">. |
| /book page, form #appointment-request | Preferred date | Date asked as free text (placeholder "MM/DD/YYYY"), so people guess the format and dates arrive written in different ways. | medium | Use <input type="date">, or separate day, month and year boxes. |
| /book page, form #appointment-request | "Full name" (placeholder only), Email, "Phone" (placeholder only), Preferred date | 4 fields are required in the HTML, but nothing on the form shows which: no * or "required" next to the labels, and no line saying all fields are required. | medium | Put "(required)" or * in each required field's label, and say what * means above the form. |
| /book page, form #appointment-request | All 12 visible fields | 12 visible fields to fill in (more than 8). Each one is another step before someone can book. | medium | Keep what you need to confirm a first visit (name, phone or email, service, preferred day) and ask the rest later. |
| /book page, form #appointment-request | "Full name" (placeholder only) | No autocomplete on the name field, so phones and browsers cannot fill it in. | low | Add autocomplete="name". |
| /book page, form #appointment-request | Email | No autocomplete on the email field, so phones and browsers cannot fill it in. | low | Add autocomplete="email". |
| /book page, form #appointment-request | "Phone" (placeholder only) | No autocomplete on the phone field, so phones and browsers cannot fill it in. | low | Add autocomplete="tel". |
| /book page, form #appointment-request | Submit button ("Submit") | The button says "Submit", which does not say what happens next. | low | Name what it does, for example "Request appointment" or "Check availability". |
| /book page, form #appointment-request | Whole form | No sign of spam protection in the HTML: no honeypot-style hidden field and no captcha or Turnstile script. Spam may still be filtered on the server, which this report cannot see. | low | Ask whoever runs the form where spam is filtered; if nowhere, add a honeypot field (hidden from people, bots fill it in) or a privacy-friendly challenge. |
| /book page, form #appointment-request | After submit | Could not tell from the HTML whether people see a confirmation after they submit: no "thank you" or "we'll confirm" wording and no redirect field was found. What happens after submit was not seen. | low | Send a test booking yourself and check what the customer sees and receives; if nothing confirms it, add a thank-you message that says when you will reply. |
| contact page, form #contact-form | Phone (optional) | Phone field is type="text", so phones show the letter keyboard instead of the number pad. | medium | Change it to <input type="tel" autocomplete="tel">. |

Forms read: home page, form #newsletter: not a booking or contact form, not checked. /book page, form #appointment-request: read as a booking form (a date field (Preferred date); the word "appointment"), 12 visible fields. contact page, form #contact-form: read as a contact form (a message box (Message); the word "message"), 4 visible fields. No forms found on: about page. No form was submitted.

## Fix checklist, most important first

- High: /book page, form #appointment-request: Give each field a visible label tied to it (<label for="field-id">); a placeholder is not a label. Fields: "Full name" (placeholder only); "Phone" (placeholder only); "Anything we should know?" (placeholder only).
- High: Give each meaningful image a short alt description; use alt="" for purely decorative images. Pages: home page.
- Medium: /book page, form #appointment-request: Use type="email" (with autocomplete="email") for email fields. Fields: Email.
- Medium: /book page, form #appointment-request: Use type="tel" (with autocomplete="tel") for phone fields. Fields: "Phone" (placeholder only).
- Medium: /book page, form #appointment-request: Ask for dates with a date input (type="date") or separate day, month and year boxes. Fields: Preferred date.
- Medium: /book page, form #appointment-request: Show which fields are required: put "(required)" or * in their labels, or say "All fields are required". Fields: "Full name" (placeholder only), Email, "Phone" (placeholder only), Preferred date.
- Medium: /book page, form #appointment-request: Cut the form to what you need to confirm a first visit and ask the rest later. Fields: All 12 visible fields.
- Medium: contact page, form #contact-form: Use type="tel" (with autocomplete="tel") for phone fields. Fields: Phone (optional).
- Medium (an estimate to confirm by hand): Associate every input, select and textarea with a visible `<label for=…>` or an aria-label. Pages: home page, /book page.
- Medium: Add a lang attribute to the `<html>` element, for example lang="en". Pages: home page, /book page.
- Medium: Use heading levels in order and style with CSS rather than by choosing a heading level for its size. Pages: home page.
- Medium: Test text and background colours with a contrast checker (4.5:1 for normal text). Pages: home page.
- Medium (site health): These security headers were not found: Content-Security-Policy, Referrer-Policy. Ask whoever hosts the site whether they are set elsewhere or should be added.
- Low: /book page, form #appointment-request: Add autocomplete="name", "email" or "tel" so phones and browsers can fill these fields in. Fields: "Full name" (placeholder only); Email; "Phone" (placeholder only).
- Low: /book page, form #appointment-request: Name the button for what it does, for example "Request appointment". Fields: Submit button ("Submit").
- Low: /book page, form #appointment-request: Find out where form spam is filtered; if nowhere, add a honeypot field or a privacy-friendly challenge.
- Low: /book page, form #appointment-request: Send a test booking yourself and check what the customer sees and receives next.
- Then: have a person book a test appointment with only a keyboard, and with a screen reader, and measure colour contrast with a contrast checker.
- After fixing, ask for a re-check to compare.

## What this report is not

This report is an automated first-pass screen. It is not a WCAG audit, a security audit, a legal compliance determination, a certificate or legal advice.

No form was submitted. The form checks read each page's public HTML only; scripts were not run, so a form added by JavaScript would not be seen.

What happens after someone submits a form was not seen: the confirmation page, any email or text the customer receives, and where the booking goes.

Colour contrast is not measured, and keyboard use, focus order, ARIA correctness, captions and reading order are not tested.

The form-label count in the accessibility table is an estimate from counts of fields and labels; the forms table reads each field and its label, and is still no substitute for trying the form with a screen reader.

Site health covers the first page only, from the response headers supplied with it. A missing security header is something to review, not proof of a vulnerability; a present header is not proof it is configured well.

Fixes. This report tells you what to fix; it does not change your site.

---

## How this report was checked

13 of 13 QA checks passed.

- Passed: Every form finding names its form and field
- Passed: Every form finding has a severity (high, medium or low) and a plain-English fix
- Passed: The disclaimer is present, and says no form was submitted and what happens after submit was not seen
- Passed: Every form that asks for a date, time or appointment is read as a booking form
- Passed: Every input, select and textarea in each form's HTML is accounted for (visible, hidden, honeypot or button)
- Passed: Nothing claims the site is compliant, certified or accessible
- Passed: Every address, email and phone number in the sample is invented (example domains, 555-01xx)
- Passed: Every page read has a row in the accessibility table
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
