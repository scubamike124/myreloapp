# Promotion plan 2026-10-12.1: 7 ready pilot offers on 5 channels

Generated from `src/lib/offers/promotion.ts`; the worker builds each post with the same code. Nothing here has been posted. The exact steps the owner has to take for each channel are in `OWNER-STEPS.md`; why these channels and not others is in `CHANNEL-RESEARCH.md`; every post is in `POST-LIBRARY.md`.

## The channels

| Channel | Sent through | Posts as (the account's name must look like) | Slot (UTC) | Limits | Text | Picture | What it needs |
|---|---|---|---|---|---|---|---|
| Our tip pages (`site-tips`) | the lane itself, with a ledger entry written first | no account (our own site) | every day 13:00 | one a slot, at least 20 h apart; at most 7 in 7 days; the same offer not twice within 72 h | long form (short if it does not fit), at most 1500 characters | the offer's sample image | nothing: the pages are part of the site |
| Facebook Page (`facebook-page`) | the publish queue (FACEBOOK) | Amber One AI's name | weekdays 14:00 | one a slot, at least 20 h apart; at most 7 in 7 days; at most 2 link posts in 30 days (Meta's reported free-Page cap); the same offer not twice within 72 h | long form (short if it does not fit), at most 1500 characters | the page's own preview card | the owner finishes the Facebook login for the Amber One AI Page (Connect on /dashboard/social-publish, choosing the Page and allowing posting) |
| Bluesky (`bluesky`) | the lane itself, with a ledger entry written first | Amber One AI's handle or name (`amberoneai.bsky.social`, `Amber One AI`) | weekdays 15:00 | one a slot, at least 20 h apart; at most 5 in 7 days; the same offer not twice within 72 h | short form, at most 300 characters | the offer's sample image | a Bluesky account for Amber One AI, and an app password for it saved in the vault as BLUESKY_HANDLE and BLUESKY_APP_PASSWORD |
| Threads (`threads`) | the publish queue (THREADS) | Amber One AI's handle or name (`amberoneai.bsky.social`, `Amber One AI`) | weekdays 16:00 | one a slot, at least 20 h apart; at most 5 in 7 days; the same offer not twice within 72 h | short form, at most 500 characters | the page's own preview card | the owner adds the Threads use case to the Meta app, makes the Threads profile a tester, and connects it on /dashboard/social-publish |
| LinkedIn profile (`linkedin-profile`) | the publish queue (LINKEDIN) | Amber One AI's name | Tuesday, Wednesday, Thursday 17:00 | one a slot, at least 20 h apart; at most 3 in 7 days; the same offer not twice within 72 h | long form (short if it does not fit), at most 3000 characters | the offer's sample image | the owner creates the LinkedIn developer app, saves its keys in the vault, connects the profile on /dashboard/social-publish, and names it with `promo-page: <name>` on #105 |

## Rules that must all hold before a post is created on a channel

1. The offer is marked **ready** in `src/lib/offers/readiness.ts` (the pilot runner was run on invented data through the whole path and the result read). An offer without that record is never promoted and its page takes no orders.
2. The channel's account is connected (it derives CONNECTED, or for Bluesky the app password logs in), and its name, as the platform returned it (never an editable field), matches /\bamber\s*(?:one|ai)\b/i (or, for Bluesky and Threads, /\bamber[\s._-]*(?:one[\s._-]*)?ai\b|\bamber[\s._-]*one\b/i) or the owner named it with `promo-page: <name>` on #105. An account for another brand, or the owner's own LinkedIn profile, is never posted to until the owner says so. If two connected accounts pass, nothing is posted until the owner names the one to use.
3. The owner has not paused the lane on #105. `promo: pause` pauses it, and so does any other word after `promo:` that is not `resume` or `start`; without the colon a pause word does (`promo pause`, `promo stop now`), and so does a line that starts with an emoji or a symbol, and a switch cut in two by the odd line breaks some editors write; a pause counts even in an indented block, an HTML comment or a code block that is never closed, and from the moment its comment was last edited (only a closed code block or a quote is ignored). Only a plain `promo: resume` (or `promo: start`) line lifts it, with nothing before it on the line, and it counts from when its comment was WRITTEN, so it has to be a new comment: editing an old comment does not lift a later pause or restart posts that were cancelled or failed (while the lane is paused it says so when it sees such an edit). If #105 cannot be read, nothing is created. While paused the lane makes no request to any platform.
4. It is the channel's slot: a weekday (every day for our own pages) at the channel's own UTC hour (13:00 is 09:00 US Eastern during daylight time, 08:00 in winter), at least 20 hours after its last post was queued; a slot missed by more than 8 hours waits for the next one. The channel's own counts hold (per 7 days; Facebook per 30 days), and the same offer is not posted twice on a channel within 72 hours.
5. Nothing else is in flight on the account (this lane's earlier post, or any other post queued on it), the factory's stop-all and marketing pauses are off, and the plain offer page answers HTTP 200. The last two finished posts on the channel did not both fail (the owner's `promo: resume` clears that stop), and a post whose outcome the platform did not confirm (it may be live) stops that channel until the owner has checked the account and written `promo: resume`. One channel stopping never stops another.
6. A post is made once. One that the platform accepted, or that may have gone out, is never made again. A post that was not sent (the login needed the owner, the owner paused, a rate limit or a network error) is made again at the next slot as a fresh attempt, at most 3 times in all. A post is checked against the owner's copy rules, the channel's length limit and the link again just before it is created: no price, no unmeasured result, no guarantee or hype, nothing that asks for a message, every post says it is a pilot and that its sample is made from invented data, and ends with one tracked link.

Every state change is written to a ledger and shown in the offer tracker on #105 with the post's live link or its exact error, beside the channel table. A post counts as live only when its platform confirms it by reading it back (Facebook and Threads with the account's own token, Bluesky and our tip pages publicly) and its link is recorded; advertising counts as started on a channel only then. A post the platform accepted but that could not be read back (every LinkedIn post, because LinkedIn does not let this app read posts) is shown as unverified with its link and does not count. Open a live link in a logged-out browser window to confirm that the public can see it.

## The owner's switches (plain lines in a #105 comment from the owner's account)

- `promo: pause` stops new posts on every channel and cancels any not yet sent (a post that has been sent is left alone). `promo: resume`, written as a new comment, starts again. The factory's own pause (stop-all, marketing) does the same for the posts not yet sent, and they are made again once it is lifted.
- `promo-page: <name>` allows a connected account whose name does not match Amber One AI's (a Facebook Page, your LinkedIn profile, a Threads or Bluesky account), and chooses between two that do.
- A comment counts as the owner's only if it comes from the owner's account and does not begin with an Amber report marker (`<!-- amber-... -->`).

## Readiness today

| Offer | Ready | Posts |
|---|---|---|
| Missed-Call and Web-Inquiry Follow-Up List (`missed-call-follow-up`) | ready | 5 |
| Stale Estimate Follow-Up List (`stale-estimate-follow-up`) | ready | 5 |
| Job-Cost Exception Report (`job-cost-exceptions`) | ready | 5 |
| Receipt and Invoice Match Review (`receipt-invoice-matching`) | ready | 5 |
| Unpaid Invoice Tracker with Draft Reminders (`unpaid-invoice-tracking`) | ready | 5 |
| Website Health, Accessibility and Booking-Form Check (`website-health-report`) | needs-work | none: not promoted |
| CRM Duplicate and Data-Quality Check (`crm-cleanup`) | ready | 5 |
| Support Inbox Triage with Reply Drafts (`inbox-triage`) | needs-work | none: not promoted |
| Product Catalog Cleanup and Cross-Store Check (`catalog-cleanup`) | ready | 5 |
| Short-Form Ad Variations from Your Video (`video-ad-variations`) | not-deliverable | none: not promoted |

## The first two weeks, if every channel were connected today

Each channel takes its posts in its own order (`promoRotation`): neighbours are different offers and, except where a round ends, different kinds of post, and the channels start on different offers so one day's posts are about different offers. The table walks each channel's slots from the next Monday, with Facebook held to two link posts in 30 days; a real run shifts when a post is late, fails or waits for the owner.

| Date (UTC) | Channel | Offer | Post | Title |
|---|---|---|---|---|
| 2026-10-12 Mon 13:00 | Our tip pages | Unpaid Invoice Tracker with Draft Reminders | `tip-1` | Invoice reminders: start friendly and specific |
| 2026-10-12 Mon 14:00 | Facebook Page | Missed-Call and Web-Inquiry Follow-Up List | `launch` | Missed-Call and Web-Inquiry Follow-Up List (pilot) |
| 2026-10-12 Mon 15:00 | Bluesky | Product Catalog Cleanup and Cross-Store Check | `launch` | Product Catalog Cleanup and Cross-Store Check (pilot) |
| 2026-10-12 Mon 16:00 | Threads | CRM Duplicate and Data-Quality Check | `launch` | CRM Duplicate and Data-Quality Check (pilot) |
| 2026-10-13 Tue 13:00 | Our tip pages | Product Catalog Cleanup and Cross-Store Check | `tip-2` | Two stores: pick one source of truth |
| 2026-10-13 Tue 14:00 | Facebook Page | Unpaid Invoice Tracker with Draft Reminders | `sample` | What an unpaid invoice report looks like (invented data) |
| 2026-10-13 Tue 15:00 | Bluesky | Stale Estimate Follow-Up List | `sample` | What a stale-estimate list looks like (invented data) |
| 2026-10-13 Tue 16:00 | Threads | Receipt and Invoice Match Review | `sample` | What a receipt and invoice match review looks like (invented data) |
| 2026-10-13 Tue 17:00 | LinkedIn profile | Job-Cost Exception Report | `launch` | Job-Cost Exception Report (pilot) |
| 2026-10-14 Wed 13:00 | Our tip pages | Stale Estimate Follow-Up List | `tip-3` | Old estimates: confirm the price still holds |
| 2026-10-14 Wed 15:00 | Bluesky | CRM Duplicate and Data-Quality Check | `tip-1` | CRM duplicates: use a rule you can explain |
| 2026-10-14 Wed 16:00 | Threads | Job-Cost Exception Report | `tip-1` | Job costs: compare spend with progress, job by job |
| 2026-10-14 Wed 17:00 | LinkedIn profile | Missed-Call and Web-Inquiry Follow-Up List | `sample` | What a missed-call follow-up list looks like (invented data) |
| 2026-10-15 Thu 13:00 | Our tip pages | CRM Duplicate and Data-Quality Check | `tip-1` | CRM duplicates: use a rule you can explain |
| 2026-10-15 Thu 15:00 | Bluesky | Receipt and Invoice Match Review | `tip-2` | Receipt and charge differ? Note the reason once |
| 2026-10-15 Thu 16:00 | Threads | Missed-Call and Web-Inquiry Follow-Up List | `tip-2` | Count the caller who also used your web form once |
| 2026-10-15 Thu 17:00 | LinkedIn profile | Unpaid Invoice Tracker with Draft Reminders | `tip-1` | Invoice reminders: start friendly and specific |
| 2026-10-16 Fri 13:00 | Our tip pages | Receipt and Invoice Match Review | `tip-2` | Receipt and charge differ? Note the reason once |
| 2026-10-16 Fri 15:00 | Bluesky | Job-Cost Exception Report | `tip-3` | A cost on a closed job: late bill or wrong job number? |
| 2026-10-16 Fri 16:00 | Threads | Unpaid Invoice Tracker with Draft Reminders | `tip-3` | Which overdue invoice first? Oldest, then largest |
| 2026-10-17 Sat 13:00 | Our tip pages | Job-Cost Exception Report | `tip-3` | A cost on a closed job: late bill or wrong job number? |
| 2026-10-18 Sun 13:00 | Our tip pages | Missed-Call and Web-Inquiry Follow-Up List | `tip-1` | Missed calls: return the safety problems first |
| 2026-10-19 Mon 13:00 | Our tip pages | Unpaid Invoice Tracker with Draft Reminders | `tip-2` | Keep a list of invoices you are not chasing, and why |
| 2026-10-19 Mon 15:00 | Bluesky | Missed-Call and Web-Inquiry Follow-Up List | `launch` | Missed-Call and Web-Inquiry Follow-Up List (pilot) |
| 2026-10-19 Mon 16:00 | Threads | Product Catalog Cleanup and Cross-Store Check | `launch` | Product Catalog Cleanup and Cross-Store Check (pilot) |
| 2026-10-20 Tue 13:00 | Our tip pages | Product Catalog Cleanup and Cross-Store Check | `tip-3` | Before you copy a listing to another store, check its limits |
| 2026-10-20 Tue 15:00 | Bluesky | Unpaid Invoice Tracker with Draft Reminders | `sample` | What an unpaid invoice report looks like (invented data) |
| 2026-10-20 Tue 16:00 | Threads | Stale Estimate Follow-Up List | `sample` | What a stale-estimate list looks like (invented data) |
| 2026-10-20 Tue 17:00 | LinkedIn profile | Product Catalog Cleanup and Cross-Store Check | `tip-2` | Two stores: pick one source of truth |
| 2026-10-21 Wed 13:00 | Our tip pages | Stale Estimate Follow-Up List | `tip-1` | Estimates: follow up within a week and name the job |
| 2026-10-21 Wed 15:00 | Bluesky | Product Catalog Cleanup and Cross-Store Check | `sample` | What a catalog cleanup and cross-store check looks like (invented data) |
| 2026-10-21 Wed 16:00 | Threads | CRM Duplicate and Data-Quality Check | `sample` | What a CRM duplicate and data-quality check looks like (invented data) |
| 2026-10-21 Wed 17:00 | LinkedIn profile | Stale Estimate Follow-Up List | `tip-3` | Old estimates: confirm the price still holds |
| 2026-10-22 Thu 13:00 | Our tip pages | CRM Duplicate and Data-Quality Check | `tip-2` | Clean the formats first, then look for duplicates |
| 2026-10-22 Thu 15:00 | Bluesky | Stale Estimate Follow-Up List | `tip-1` | Estimates: follow up within a week and name the job |
| 2026-10-22 Thu 16:00 | Threads | Receipt and Invoice Match Review | `tip-1` | Month-end: match the easy ones first |
| 2026-10-22 Thu 17:00 | LinkedIn profile | CRM Duplicate and Data-Quality Check | `launch` | CRM Duplicate and Data-Quality Check (pilot) |
| 2026-10-23 Fri 13:00 | Our tip pages | Receipt and Invoice Match Review | `tip-3` | Check for duplicate receipts and duplicate charges |
| 2026-10-23 Fri 15:00 | Bluesky | CRM Duplicate and Data-Quality Check | `tip-2` | Clean the formats first, then look for duplicates |
| 2026-10-23 Fri 16:00 | Threads | Job-Cost Exception Report | `tip-2` | Check for a duplicate bill before it is paid twice |
| 2026-10-24 Sat 13:00 | Our tip pages | Job-Cost Exception Report | `tip-1` | Job costs: compare spend with progress, job by job |
| 2026-10-25 Sun 13:00 | Our tip pages | Missed-Call and Web-Inquiry Follow-Up List | `tip-2` | Count the caller who also used your web form once |

In all, the library holds 161 posts across the channels (Our tip pages 21, Facebook Page 35, Bluesky 35, Threads 35, LinkedIn profile 35). A channel that has made every post in its rotation says so and stops; adding posts is a change to `promo-content.ts`, and each new post must pass the same copy rules.

## What one post looks like on each channel (Unpaid Invoice Tracker with Draft Reminders, the `tip-1` post)

### Our tip pages

> A tip for small service businesses: write the first reminder as if the invoice was simply missed. Put the invoice number, the amount and how to pay in the first lines, and keep the tone friendly; there is time to be firmer later.
>
> Our unpaid invoice pilot drafts reminders like that, friendly at first and firmer later, from a weekly open-invoices export. You review and send them yourself. It is read-only, and a person checks every report before it reaches you.
>
> The sample on the page is made from invented data: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=site-tips&utm_campaign=pilot-launch-2026-10

Tracked link `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=site-tips&utm_campaign=pilot-launch-2026-10`; picture https://hq.amberoneai.com/offers/social/unpaid-invoice-tracking-sample.png (alt: Sample report made from invented data: Unpaid Invoice Tracker with Draft Reminders. $52,755 outstanding on 20 open invoices; 17 invoices past due; 12 reminders due this week.); the post is the page https://hq.amberoneai.com/offers/tips/unpaid-invoice-tracking/tip-1.

### Facebook Page

> A tip for small service businesses: write the first reminder as if the invoice was simply missed. Put the invoice number, the amount and how to pay in the first lines, and keep the tone friendly; there is time to be firmer later.
>
> Our unpaid invoice pilot drafts reminders like that, friendly at first and firmer later, from a weekly open-invoices export. You review and send them yourself. It is read-only, and a person checks every report before it reaches you.
>
> The sample on the page is made from invented data: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=facebook-page&utm_campaign=pilot-launch-2026-10

Tracked link `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=facebook-page&utm_campaign=pilot-launch-2026-10`; no uploaded picture.

### Bluesky

> Tip: write the first invoice reminder as if the invoice was simply missed, with the number, the amount and how to pay up front. Unpaid-invoice pilot, sample from invented data: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=bluesky&utm_campaign=pilot-launch-2026-10

Tracked link `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=bluesky&utm_campaign=pilot-launch-2026-10`; picture https://hq.amberoneai.com/offers/social/unpaid-invoice-tracking-sample.png (alt: Sample report made from invented data: Unpaid Invoice Tracker with Draft Reminders. $52,755 outstanding on 20 open invoices; 17 invoices past due; 12 reminders due this week.).

### Threads

> Tip: write the first invoice reminder as if the invoice was simply missed, with the number, the amount and how to pay up front. Unpaid-invoice pilot, sample from invented data: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=threads&utm_campaign=pilot-launch-2026-10

Tracked link `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=threads&utm_campaign=pilot-launch-2026-10`; no uploaded picture.

### LinkedIn profile

> A tip for small service businesses: write the first reminder as if the invoice was simply missed. Put the invoice number, the amount and how to pay in the first lines, and keep the tone friendly; there is time to be firmer later.
>
> Our unpaid invoice pilot drafts reminders like that, friendly at first and firmer later, from a weekly open-invoices export. You review and send them yourself. It is read-only, and a person checks every report before it reaches you.
>
> The sample on the page is made from invented data: https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=linkedin-profile&utm_campaign=pilot-launch-2026-10

Tracked link `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=linkedin-profile&utm_campaign=pilot-launch-2026-10`; picture https://hq.amberoneai.com/offers/social/unpaid-invoice-tracking-sample.png (alt: Sample report made from invented data: Unpaid Invoice Tracker with Draft Reminders. $52,755 outstanding on 20 open invoices; 17 invoices past due; 12 reminders due this week.).

### The tip page itself

https://hq.amberoneai.com/offers/tips/unpaid-invoice-tracking/tip-1: "Invoice reminders: start friendly and specific". A tip for small service businesses: write the first reminder as if the invoice was simply missed. Put the invoice number, the amount and how to pay in the first lines, and keep the tone friendly; there is time to be firmer later.

Our unpaid invoice pilot drafts reminders like that, friendly at first and firmer later, from a weekly open-invoices export. You review and send them yourself. It is read-only, and a person checks every report before it reaches you.

Then the button "See the Unpaid Invoice Tracker with Draft Reminders pilot and its sample" to `https://hq.amberoneai.com/offers/unpaid-invoice-tracking?src=site-tips&utm_campaign=pilot-launch-2026-10` and the line "Pilot. The sample is made from invented data.".

