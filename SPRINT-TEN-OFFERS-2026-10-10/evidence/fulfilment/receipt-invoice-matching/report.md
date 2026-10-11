<!-- Prepared with scripts/offers-run.ts for receipt-invoice-matching. Invented test data (--synthetic). Review before sending. -->
# Receipt and Invoice Match Review

**Sample made from invented data.**

## What went in

- 34 bank and card transactions from 1 account (Checking 2290), 2026-09-01 to 2026-09-30
- 33 receipts and invoices, with vendor, date, total and invoice number as read from each document
- Tolerance: 3 days either way and $0.00 on the amount; 1 vendor alias for bank text

## Summary

2026-09-01 to 2026-09-30: 34 bank and card transactions and 33 documents (19 receipts, 14 invoices).

25 matched pairs. 15 exceptions for review: 2 amount differs, 1 possible duplicate charge, 1 possible duplicate document, 6 no document for this payment, 4 no payment found for this document, 1 different currency.

Each exception says what we found and ends with the decision the bookkeeper needs to make. This is a read-only review: nothing was categorised, recorded or paid.

## Matched

| Transaction | Document | Vendor | Amount | Days apart |
|---|---|---|---|---|
| T-3 (2026-09-01): SQ *HARBOR COFFEE 4412 | D-3 receipt, 2026-09-01 | Harbor Coffee | $12.50 | 0 |
| T-4 (2026-09-02): AMZN MKTP US*2A7KZ | D-7 receipt, 2026-09-04 | Amazon | $86.47 | 2 |
| T-5 (2026-09-02): PAYPAL *ADOBEINC | D-4 invoice, 2026-09-02, AD-77120 | Adobe | $54.99 | 0 |
| T-6 (2026-09-03): POS DEBIT HOME DEPOT #4821 | D-5 receipt, 2026-09-03 | Home Depot | $143.26 | 0 |
| T-7 (2026-09-03): TST* LUNA TACOS | D-6 receipt, 2026-09-03 | Luna Tacos | $31.00 | 0 |
| T-8 (2026-09-04): ACH DEBIT BRIGHTWATER UTIL | D-8 invoice, 2026-09-04, BW-3321 | Brightwater Utilities | $212.80 | 0 |
| T-9 (2026-09-05): NORTHSIDE PRINT & COPY #12 | D-9 receipt, 2026-09-05 | Northside Print & Copy | $76.15 | 0 |
| T-12 (2026-09-08): SHELL OIL 57444 | D-11 receipt, 2026-09-08 | Shell | $48.92 | 0 |
| T-13 (2026-09-09): COSTCO WHSE #0123 | D-12 receipt, 2026-09-09 | Costco | $230.45 | 0 |
| T-14 (2026-09-10): UNITED AIRLINES 0162345 | D-13 invoice, 2026-09-09, UA-5521 | United Airlines | $342.10 | 1 |
| T-15 (2026-09-10): GITHUB INC | D-14 invoice, 2026-09-10, GH-30911 | GitHub | $21.00 | 0 |
| T-17 (2026-09-11): SQ *MAPLE & MAIN DELI 0193 | D-15 receipt, 2026-09-11 | Maple & Main Deli | $27.85 | 0 |
| T-20 (2026-09-12): STAPLES 00456 | D-17 receipt, 2026-09-12 | Staples | $64.30 | 0 |
| T-22 (2026-09-14): SQ *GREEN LEAF CAFE | D-20 receipt, 2026-09-14 | Green Leaf Cafe | $18.40 | 0 |
| T-23 (2026-09-15): VERIZON WIRELESS | D-21 invoice, 2026-09-15, V-9921 | Verizon | $189.99 | 0 |
| T-25 (2026-09-16): INTUIT *QUICKBOOKS | D-22 invoice, 2026-09-16, IQ-44102 | Intuit QuickBooks | $80.00 | 0 |
| T-26 (2026-09-17): UBER *TRIP | D-24 receipt, 2026-09-17 | Uber | $23.58 | 0 |
| T-27 (2026-09-18): OFFICE DEPOT #1188 | D-26 receipt, 2026-09-19 | Office Depot | $112.04 | 1 |
| T-31 (2026-09-21): GEICO AUTO | D-29 invoice, 2026-09-20, GE-90311 | Geico | $164.20 | 1 |
| T-32 (2026-09-22): WALGREENS #3321 | D-31 receipt, 2026-09-22 | Walgreens | $22.17 | 0 |
| T-33 (2026-09-22): ACH DEBIT FERNWOOD COWORK | D-27 invoice, 2026-09-20, FC-2026-09 | Fernwood Coworking | $450.00 | 2 |
| T-34 (2026-09-23): CHEVRON 0097712 | D-32 receipt, 2026-09-23 | Chevron | $55.30 | 0 |
| T-35 (2026-09-24): PIXELNEST*SUBSCRIPTION | D-30 invoice, 2026-09-21, PN-55120 | PixelNest | $59.99 | 3 |
| T-36 (2026-09-25): FEDEX 78823 | D-33 receipt, 2026-09-25 | FedEx | $38.75 | 0 |
| T-38 (2026-09-28): SQ *LAKESIDE BAKERY | D-35 receipt, 2026-09-28 | Lakeside Bakery | $27.60 | 0 |

Matched on the same amount to the cent, dates no more than 3 days apart, and vendor names that agree once processor prefixes (SQ *, TST*, PAYPAL *), store numbers and reference codes are removed from the bank text.

## Exceptions for review

| Type | Item | What we found | What to check |
|---|---|---|---|
| Amount differs | T-10 (2026-09-06, $59.00) and D-10 receipt (2026-09-06, $50.00) | $59.00 paid to Blue Heron Bistro on 2026-09-06 (T-10); receipt D-10, dated 2026-09-06, shows $50.00. The payment is $9.00 (18%) more, which may be a tip or a fee. | Bookkeeper decision needed: whether the $9.00 difference is a tip, a fee or something else bought, and which document supports it. |
| Amount differs | T-21 (2026-09-13, $800.00) and D-19 invoice (2026-09-13, $1,000.00) | $800.00 paid to Margot Reyes Design on 2026-09-13 (T-21); invoice D-19, dated 2026-09-13, shows $1,000.00. The payment is $200.00 (20%) less, which may be a partial payment. | Bookkeeper decision needed: whether the $200.00 difference is a partial payment, a discount or a credit, and which document supports it. |
| Possible duplicate charge | T-18 (2026-09-11, $27.85) | Two charges of $27.85 from Maple & Main Deli, T-17 and T-18, both on 2026-09-11, but only one document (D-15), which is matched to T-17. | Bookkeeper decision needed: whether this is a second purchase with a missing receipt, or the same purchase charged twice. |
| Possible duplicate document | D-28 invoice (2026-09-20, $450.00) | Invoice number FC-2026-09 from Fernwood Coworking appears twice: D-27 (fernwood-sep.pdf) and D-28 (fernwood-sep-copy.pdf). Only D-27 was compared with payments. | Bookkeeper decision needed: whether D-28 is a second copy of the same invoice or a separate bill. |
| No document for this payment | T-11 (2026-09-07, $89.00) | $89.00 paid to Club Membership Fitness on 2026-09-07 (Checking 2290; bank text "CLUB MEMBERSHIP FITNESS"): no receipt or invoice within 3 days matches it. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No document for this payment | T-19 (2026-09-11, $15.99) | $15.99 paid to Zoom Video on 2026-09-11 (Checking 2290; bank text "ZOOM VIDEO"): no receipt or invoice within 3 days matches it. Invoice D-16 from Zoom is for the same amount and 0 days away, but the name differs; it may be the same business written another way. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No document for this payment | T-28 (2026-09-19, $198.36) | $198.36 paid to Atelier Vogel Berlin on 2026-09-19 (Checking 2290; bank text "ATELIER VOGEL BERLIN"): no receipt or invoice within 3 days matches it. Invoice D-25 from Atelier Vogel is in EUR and is listed under Different currency. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No document for this payment | T-29 (2026-09-19, $212.17) | $212.17 paid to Unknown Merchant on 2026-09-19 (Checking 2290; bank text "UNKNOWN MERCHANT 998877"): no receipt or invoice within 3 days matches it. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No document for this payment | T-30 (2026-09-20, $65.00) | $65.00 paid to Riverbend Florist on 2026-09-20 (Checking 2290; bank text "SQ *RIVERBEND FLORIST 2210"): no receipt or invoice within 3 days matches it. Receipt D-34 from Riverbend Florist for the same amount is dated 2026-09-26, 6 days away, outside the 3-day window. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No document for this payment | T-37 (2026-09-27, $41.23) | $41.23 paid to Doordash on 2026-09-27 (Checking 2290; bank text "DOORDASH*ORDER"): no receipt or invoice within 3 days matches it. | Bookkeeper decision needed: whether a receipt or invoice exists for this payment, or should be asked for. |
| No payment found for this document | D-16 invoice (2026-09-11, $15.99) | Invoice D-16 from Zoom (invoice number ZM-6620), dated 2026-09-11, for $15.99: no payment in this export matches it within 3 days. T-19 for the same amount on 2026-09-11 is 0 days away, but the payee name differs ("Zoom Video"); it may be the same business written another way. | Bookkeeper decision needed: whether it was paid from another account, is not yet paid, or belongs to another month. |
| No payment found for this document | D-23 invoice (2026-09-17, $1,250.00) | Invoice D-23 from Summit Legal Services (invoice number SL-8812), dated 2026-09-17, for $1,250.00: no payment in this export matches it within 3 days. | Bookkeeper decision needed: whether it was paid from another account, is not yet paid, or belongs to another month. |
| No payment found for this document | D-34 receipt (2026-09-26, $65.00) | Receipt D-34 from Riverbend Florist, dated 2026-09-26, for $65.00: no payment in this export matches it within 3 days. T-30 for the same amount on 2026-09-20 is 6 days away, outside the window. | Bookkeeper decision needed: whether it was paid from another account, is not yet paid, or belongs to another month. |
| No payment found for this document | D-36 receipt (2026-09-29, $34.10) | Receipt D-36 from Cedar Hardware, dated 2026-09-29, for $34.10: no payment in this export matches it within 3 days. | Bookkeeper decision needed: whether it was paid from another account, is not yet paid, or belongs to another month. |
| Different currency | D-25 invoice (2026-09-18, EUR 180.00) | Invoice D-25 from Atelier Vogel is in EUR, so it was not compared with the dollar amounts in the bank export. T-28 (2026-09-19, $198.36) from the same vendor is within 3 days of it. | Bookkeeper decision needed: which payment, if any, this document supports, given the conversion to dollars on the statement. |

Every row is for the bookkeeper to decide. Nothing in the books or the bank account has been changed.

## What this review is not

A read-only comparison of the bank and card transactions with the receipts and invoices you sent, for 2026-09-01 to 2026-09-30. Nothing is categorised, recorded or changed in your books, and no payment is made, stopped or disputed.

It does not say how any expense should be handled in your accounts or for taxes; those calls stay with you and your bookkeeper.

Vendors, dates and totals are taken as read from each document; a misread document can cause a missed match.

---

## How this report was checked

13 of 13 QA checks passed.

- Passed: Every transaction is in exactly one bucket
- Passed: Every document is in exactly one bucket
- Passed: Every matched pair agrees on amount and date within tolerance, and on vendor
- Passed: No document in another currency is matched or paired
- Passed: No tax words, and no posting, categorising or payment language
- Passed: Every exception says what was found and ends with the bookkeeper's decision
- Passed: No claims of guarantees, certification, compliance, affiliation or unmeasured results
- Passed: Nothing says a message was sent (Amber drafts; a person sends)
- Passed: Every section of messages is labelled as drafts
- Passed: No empty section without a note saying why
- Passed: Every stage of the demo completed
- Passed: No tax advice (read-only review: it flags and explains)
- Passed: Nothing says Amber posted an entry, moved money, paid, refunded or decided
