# Replies for the first buyers: what to send at each step

For the owner to copy, edit and send by hand. Amber drafts, a person sends; nothing here is sent by any tool. Every offer below that is marked ready in `READINESS.md` can use these; an offer that is not ready should not get a reply that takes an order. Fill the `[brackets]`. Keep the promises exactly as small as the pages make them: a target, never a date, until you have confirmed one in writing; no promise of a result, a saving or a deadline for the buyer's own work.

The order is: reply, the buyer sends the files, you check that they read (nothing is charged yet), then one payment request, then the report after the payment is verified. Nobody pays for a report that cannot be made.

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
> The pilot is [price and unit from the page]. Before you send any files we agree what is included and the price in writing (this email, once you reply "yes"), and before you pay we confirm the date we aim to deliver (our target is [the page's turnaround target]; it is a target, not a promise).
>
> We check that your files can be read before you pay anything. If we cannot produce your report from the files you send, and you cannot send others we can read, you owe nothing and you get a full refund of anything paid. Once a report has been delivered there is no refund, because the work has been done. We use your files only to prepare your report, keep them up to 60 days so we can answer questions, delete them sooner if you ask, and do not sell your data. By sending files you confirm they are yours to share with us.
>
> To go ahead, reply with: (1) [the page's list of what to send, for the offer], (2) your business name, and (3) "yes" to the scope and price above. I will check the files and tell you. If they can be read, I will send one payment request, and your report is prepared and sent once the payment arrives.
>
> [Your name]

For offer 7, add before "To go ahead": "Because the file contains your contacts' personal data, please also reply 'agreed' to this: we use the file only to prepare your report, keep it up to 60 days (or delete it sooner on request), do not share it with anyone else, and delete it when you ask."

## 2. When the files arrive: check them before any payment request

Run it as `RUNNER.md` describes (`--authorized "client, how they authorised it, date"`, `--bundle`; the buyer's email with the files and their "yes" is how they authorised it). This is a check that the files can be read and the report can be made: keep the delivery folder, do not send it, and do not send a payment request yet.

If a file cannot be read the runner says why in plain words; send that sentence on:

> Hi [first name], thanks for the files. [The runner's sentence, for example: "The receipts file is a PDF, not a spreadsheet export."] Could you send [the readable version]? Nothing has been charged. If we cannot work from your files, you owe nothing.

If the runner says "Not ready to send" (a failed check) or lists rows it left out, read the reviewer notes first; settle what you can, and tell the buyer anything that changes what they will get.

## 3. Payment request (only after the files read and the scope, price and date are agreed in writing)

> Subject: [Offer name] pilot: confirmation and payment request
>
> Hi [first name],
>
> Your files read fine. Confirming what we agreed: [scope in one line], [price], and we aim to deliver by [date: the page's target in business days, counted from the day your payment arrives]. That is a target, not a promise. Payment link: [your payment link]. Nothing is charged until you pay it. Your report is prepared and sent once the payment is confirmed.
>
> [Your name]

When the payment is confirmed in your payment account: `offer-record: <inquiry id> paid $<amount> <reference>`.

## 4. Delivery (after the payment is verified and you have read the reviewer notes and the report)

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
