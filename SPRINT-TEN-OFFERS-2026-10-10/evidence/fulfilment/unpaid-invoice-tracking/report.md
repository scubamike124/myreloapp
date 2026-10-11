<!-- Prepared with scripts/offers-run.ts for unpaid-invoice-tracking. Invented test data (--synthetic). Review before sending. -->
# Unpaid Invoice Tracker with Draft Reminders

**Sample made from invented data.**

## What went in

- 22 invoices in the open-invoices export, issued May 14 to Oct 1
- Terms: Net 30. A reminder is due when an invoice is past due, not disputed, and has had no reminder in the last 14 days

## Summary

Open invoices: 20, total outstanding $52,755.50.

Overdue: 17 invoices, $49,505.50.

Reminders due this week: 12.

Not chased: 7 (each with its reason below).

Counted as of Sun Oct 11, 2026; your terms are Net 30.

## Aging

| Bucket | Invoices | Total |
|---|---|---|
| Current (not yet due) | 3 | $3,250.00 |
| 1 to 30 days past due | 6 | $8,850.00 |
| 31 to 60 days past due | 6 | $22,825.50 |
| 61 to 90 days past due | 3 | $7,290.00 |
| More than 90 days past due | 2 | $10,540.00 |
| Total | 20 | $52,755.50 |

Open balances only: invoices paid in full or with a credit balance are left out.

## Outstanding by customer

| Customer | Open invoices | Outstanding | Most days past due |
|---|---|---|---|
| Harborview Realty | 1 | $9,900.00 | 95 |
| Fairlight Events | 1 | $7,800.00 | 60 |
| Dunmore Tools | 1 | $5,600.00 | 31 |
| Orchard Landscaping | 1 | $4,400.00 | 33 |
| Birchwood Clinic | 1 | $3,450.00 | 25 |
| Northgate Bakery | 1 | $3,150.00 | 70 |
| Meadow Pediatrics | 1 | $2,600.00 | 70 |
| Kestrel Auto | 1 | $2,100.00 | 1 |
| Pioneer Print | 1 | $1,950.00 | 50 |
| Lakeshore Yoga | 1 | $1,800.00 | 40 |
| Valley Vet | 1 | $1,750.00 | not yet due |
| Granite Peak Fitness | 1 | $1,540.00 | 61 |
| Elmhurst Dental | 1 | $1,275.50 | 45 |
| Tidewater Plumbing | 1 | $1,200.00 | 12 |
| Timber Hardware | 1 | $1,000.00 | not yet due |
| Cobalt Studio | 1 | $890.00 | 30 |
| Quarry Fitness | 1 | $780.00 | 20 |
| Ironwood Cafe | 1 | $640.00 | 120 |
| Union Bakery | 1 | $500.00 | due today |
| Juniper Salon | 1 | $430.00 | 5 |

## Reminders due this week

| Invoice | Customer | Days overdue | Balance | Last reminder | Why |
|---|---|---|---|---|---|
| I-3009 | Ironwood Cafe | 120 | $640.00 | Sept 11 | 120 days past due; last reminder 30 days ago. Tone: firm, with an offer to talk. |
| I-3008 | Harborview Realty | 95 | $9,900.00 | none | 95 days past due; no reminder yet. Tone: firm, with an offer to talk. |
| I-3014 | Northgate Bakery | 70 | $3,150.00 | Sept 27 | 70 days past due; last reminder 14 days ago. Tone: firm, with an offer to talk. |
| I-3007 | Granite Peak Fitness | 61 | $1,540.00 | none | 61 days past due; no reminder yet. Tone: firm, with an offer to talk. |
| I-3006 | Fairlight Events | 60 | $7,800.00 | none | 60 days past due; no reminder yet. Tone: firm and polite. |
| I-3005 | Elmhurst Dental | 45 | $1,275.50 | none | 45 days past due; no reminder yet; $1,000.00 paid of $2,275.50. Tone: firm and polite. |
| I-3004 | Dunmore Tools | 31 | $5,600.00 | none | 31 days past due; no reminder yet. Tone: firm and polite. |
| I-3003 | Cobalt Studio | 30 | $890.00 | none | 30 days past due; no reminder yet. Tone: friendly. |
| I-3002 | Birchwood Clinic | 25 | $3,450.00 | none | 25 days past due; no reminder yet. Tone: friendly. |
| I-3001 | Tidewater Plumbing | 12 | $1,200.00 | none | 12 days past due; no reminder yet. Tone: friendly. |
| I-3010 | Juniper Salon | 5 | $430.00 | none | 5 days past due; no reminder yet. Tone: friendly. |
| I-3011 | Kestrel Auto | 1 | $2,100.00 | none | 1 day past due; no reminder yet. Tone: friendly. |

## Draft reminders

*Drafts for you to review, edit and send yourself. Amber does not send messages.*

### Draft 1: to gus.parker@example.com (email)

**Subject:** Invoice I-3009: $640.00 was due June 13

> Hi Gus,
> 
> Invoice I-3009 for $640.00 was due on June 13 and is now 120 days past due. Please arrange payment, or reply to let me know when it will be paid. If something is wrong with the invoice or the work, tell me and we can talk it through.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_120 days past due; tone: firm, with an offer to talk._

### Draft 2: to lucia.fernandez@example.com (email)

**Subject:** Invoice I-3008: $9,900.00 was due July 8

> Hi Lucia,
> 
> Invoice I-3008 for $9,900.00 was due on July 8 and is now 95 days past due. Please arrange payment, or reply to let me know when it will be paid. If something is wrong with the invoice or the work, tell me and we can talk it through.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_95 days past due; tone: firm, with an offer to talk._

### Draft 3: to ruth.adler@example.com (email)

**Subject:** Invoice I-3014: $3,150.00 was due Aug 2

> Hi Ruth,
> 
> Invoice I-3014 for $3,150.00 was due on Aug 2 and is now 70 days past due. Please arrange payment, or reply to let me know when it will be paid. If something is wrong with the invoice or the work, tell me and we can talk it through.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_70 days past due; tone: firm, with an offer to talk._

### Draft 4: to chen.wei@example.com (email)

**Subject:** Invoice I-3007: $1,540.00 was due Aug 11

> Hi Chen,
> 
> Invoice I-3007 for $1,540.00 was due on Aug 11 and is now 61 days past due. Please arrange payment, or reply to let me know when it will be paid. If something is wrong with the invoice or the work, tell me and we can talk it through.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_61 days past due; tone: firm, with an offer to talk._

### Draft 5: to joy.okafor@example.com (email)

**Subject:** Invoice I-3006: $7,800.00 was due Aug 12

> Hi Joy,
> 
> Invoice I-3006 for $7,800.00 was due on Aug 12 and is now 60 days past due. Could you let me know when we can expect payment? If you have any questions about the invoice, just reply to this email.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_60 days past due; tone: firm and polite._

### Draft 6: to sara.lindqvist@example.com (email)

**Subject:** Invoice I-3005: $1,275.50 balance, due Aug 27

> Hi Sara,
> 
> The remaining $1,275.50 on invoice I-3005 was due on Aug 27 and is now 45 days past due. Thank you for the $1,000.00 you've already paid. Could you let me know when we can expect payment? If you have any questions about the invoice, just reply to this email.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_45 days past due; tone: firm and polite._

### Draft 7: to pete.dunmore@example.com (email)

**Subject:** Invoice I-3004: $5,600.00 was due Sept 10

> Hi Pete,
> 
> Invoice I-3004 for $5,600.00 was due on Sept 10 and is now 31 days past due. Could you let me know when we can expect payment? If you have any questions about the invoice, just reply to this email.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_31 days past due; tone: firm and polite._

### Draft 8: to eli.navarro@example.com (email)

**Subject:** Invoice I-3003: $890.00 was due Sept 11

> Hi Eli,
> 
> Just a friendly reminder that invoice I-3003 for $890.00 was due on Sept 11. If it's already on its way, thank you, and please ignore this note.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_30 days past due; tone: friendly._

### Draft 9: to anita.rao@example.com (email)

**Subject:** Invoice I-3002: $3,450.00 was due Sept 16

> Hi Anita,
> 
> Just a friendly reminder that invoice I-3002 for $3,450.00 was due on Sept 16. If it's already on its way, thank you, and please ignore this note.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_25 days past due; tone: friendly._

### Draft 10: to marcus.hale@example.com (email)

**Subject:** Invoice I-3001: $1,200.00 was due Sept 29

> Hi Marcus,
> 
> Just a friendly reminder that invoice I-3001 for $1,200.00 was due on Sept 29. If it's already on its way, thank you, and please ignore this note.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_12 days past due; tone: friendly._

### Draft 11: to mina.cho@example.com (email)

**Subject:** Invoice I-3010: $430.00 was due Oct 6

> Hi Mina,
> 
> Just a friendly reminder that invoice I-3010 for $430.00 was due on Oct 6. If it's already on its way, thank you, and please ignore this note.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_5 days past due; tone: friendly._

### Draft 12: to dale.kestrel@example.com (email)

**Subject:** Invoice I-3011: $2,100.00 was due Oct 10

> Hi Dale,
> 
> Just a friendly reminder that invoice I-3011 for $2,100.00 was due on Oct 10. If it's already on its way, thank you, and please ignore this note.
> 
> Pay online at https://pay.example.com/invented-test-co or by check to the address on the invoice.
> 
> Lena
> Invented Test Co

_1 day past due; tone: friendly._

## Not chased, and why

- I-3012, Lakeshore Yoga: reminded on Oct 6 (5 days ago); next reminder from Oct 20.
- I-3013, Meadow Pediatrics: reminded on Sept 28 (13 days ago); next reminder from Oct 12.
- I-3015, Orchard Landscaping: marked disputed: settle the question with the customer before any reminder.
- I-3016, Pioneer Print: marked disputed: settle the question with the customer before any reminder.
- I-3017, Quarry Fitness: a reminder is due, but there is no usable email on file.
- I-3018, Redwood Law Co: paid in full.
- I-3019, Summit Roofing: credit balance of $50.00 ($1,300.00 paid on $1,250.00 invoiced): check with your bookkeeper.

## What this is not

A read-only review of your open-invoices export. Nothing in your accounting system is changed, and no payment is taken or recorded.

The reminders are drafts for you to review and send yourself. Amber does not contact your customers, add fees, or decide anything about an account.

It is not legal advice or advice about taxes. Disputed invoices and credit balances are flagged for you and your bookkeeper to decide.

---

## How this report was checked

18 of 18 QA checks passed.

- Passed: Aging buckets add up to the total outstanding, to the cent
- Passed: Outstanding by customer adds up to the total outstanding
- Passed: The overdue total equals the past-due aging buckets
- Passed: Reminders listed exactly for past-due, undisputed invoices not reminded in the last 14 days
- Passed: Each draft states its invoice number, balance and due date exactly as computed
- Passed: No draft for disputed, paid, credit-balance, recently reminded, not-yet-due or flagged invoices
- Passed: No draft mentions fees, interest, collections, legal action, credit reports or a final notice
- Passed: Drafts and the reminder table show what is still owed, after partial payments
- Passed: Each draft's tone fits its age: friendly, then firm and polite, then firm with an offer to talk
- Passed: Every invoice not chased is listed once with its reason, and not in the reminder table
- Passed: Every amount is written like $1,234.56
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
- Passed: No tax advice (read-only review: it flags and explains)
- Passed: Nothing says Amber posted an entry, moved money, paid, refunded or decided
