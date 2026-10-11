# Replies for the first buyers: what to send at each step

For the owner to copy, edit and send by hand. Amber drafts, a person sends; nothing here is sent by any tool. Every offer below that is marked ready in `READINESS.md` can use these; an offer that is not ready should not get a reply that takes an order. Fill the `[brackets]`. Keep the promises exactly as small as the pages make them: a target, never a date, until you have confirmed one in writing; no promise of a result, a saving or a deadline for the buyer's own work.

Record each step on #105 so the tracker counts it: `offer-record: <inquiry id> qualified`, then `pilot-agreed`, then `paid $<amount> <payment reference>` (a reference is required; revenue is counted only then), then `delivered <hours>h` (hours from the files arriving to the folder going out), and `refunded $<amount> <reference>` if you ever refund. An inquiry is not revenue.

## 0. Before replying: is it a fit? (two minutes)

- A real business, a real person, and a volume inside the pilot's size (the page's "The pilot" list)? If not, say so kindly and offer the nearest fit, or `offer-record: <id> not-a-fit`.
- Can they send what the page asks for, as an export or spreadsheet? (Offer 4: a receipt-tool export or spreadsheet, not PDFs or photos. Offer 5: contact name and email on each invoice. Offer 9: one export per store, and your online store is the source of truth.)
- Offer 7 (CRM contacts): contacts are personal data. Get the buyer's written agreement to the data note in step 1 before they send the file. If the contacts are likely to include residents of the EU or California, or the buyer asks for a contract, have a lawyer review the wording before you rely on it; this is not legal advice.

## 1. First reply to an inquiry (within a day)

> Subject: Your question about the [offer name] pilot
>
> Hi [first name],
>
> Thanks for asking about the [offer name] pilot. It is a small, hands-on pilot: you send [what you send, from the page], we send back [what you get, in one sentence], and a person reads it before it reaches you. The sample on the page is made from invented data.
>
> The pilot is [price and unit from the page]. Before you send anything or pay anything, we agree three things with you in writing: what is included, the price, and the date we aim to deliver (our target is [the page's turnaround target]; it is a target, not a promise, and we confirm the date first).
>
> If we cannot produce your report from the files you send, and you cannot send others we can read, you get a full refund. Once a report has been delivered there is no refund, because the work has been done. We use your files only to prepare your report, keep them up to 60 days so we can answer questions, delete them sooner if you ask, and do not sell your data. By sending files you confirm they are yours to share with us.
>
> To go ahead, reply with: (1) [the page's list of what to send, for the offer], (2) your business name, and (3) "yes" to the scope and price above. I will then send one payment request.
>
> [Your name]

For offer 7, add before "To go ahead": "Because the file contains your contacts' personal data, please also reply 'agreed' to this: we use the file only to prepare your report, keep it up to 60 days (or delete it sooner on request), do not share it with anyone else, and delete it when you ask."

## 2. Payment request (after they say yes)

> Subject: [Offer name] pilot: confirmation and payment request
>
> Hi [first name],
>
> Confirming what we agreed: [scope in one line], [price], and we aim to deliver [target], which we will confirm by date as soon as your payment and a file we can read arrive. Payment link: [your payment link]. Nothing is charged until you pay it. If we then cannot read your files, the refund above applies.
>
> [Your name]

When the payment is confirmed in your payment account: `offer-record: <inquiry id> paid $<amount> <reference>`.

## 3. When the files arrive

Run it as `RUNNER.md` describes (`--authorized "client, how they authorised it, date"`, `--bundle`). If a file cannot be read the runner says why in plain words; send that sentence on:

> Hi [first name], thanks for the files. [The runner's sentence, for example: "The receipts file is a PDF, not a spreadsheet export."] Could you send [the readable version]? If we cannot work from your files, you will get a full refund.

## 4. Delivery (after you have read the reviewer notes and the report)

> Subject: Your [offer name] report
>
> Hi [first name],
>
> Your report is attached as a zip. Open `report.html` in any browser (Print, then Save as PDF, if you want a PDF); the lists are spreadsheet files you can open in Excel, Numbers or Google Sheets. Every message in it is a draft for you to edit and send yourself: nothing was sent to anyone, and nothing in your systems was changed. [One line on anything the report leaves out, if the report says it left rows out.]
>
> If something looks wrong or a file did not open, reply and say which, and I will look at it. Your files will be deleted within 60 days, or sooner if you tell me.
>
> [Your name]

Then `offer-record: <inquiry id> delivered <hours>h`.

## 5. After 60 days, or when they ask

Delete the client's files, the delivery folder and the reviewer notes from the machine that ran the pilot (there is no tool for this), and tell them it is done.

## What not to write

No guarantee, no "will save you", no claim of certification or compliance, no promise of a delivery date before you have confirmed one, no tax, legal or accounting advice, and no refund promise beyond the rule above. Do not message anyone who has not written to you first.
