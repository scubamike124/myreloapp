# Ten pilot offers: handoff

Sprint of 2026-10-10, 16:47Z to about 02:47Z. `RESULTS.md` has the results table and the recommendation, `RUNNER.md` how to run a pilot on a client's files, and `CHECKPOINT.md` the full log.

## What is live

- **Ten pilot pages with their samples** at https://hq.amberoneai.com/offers: 21 pages, kept out of search engines. Every offer page says it is a pilot and that nothing is charged online. They were merged in amberai #789 and deployed at 18:20Z.
- **One shared inquiry form** on every offer page. Each inquiry records its offer and its source (the `src` link parameter). Nothing is emailed; a person replies.
- **The offer tracker** (#105, comment 6100695261). Per offer it shows visits, inquiries, qualified replies, demo requests, paid pilots, delivery time, direct costs, failures, repeat orders and the sample checks. Revenue counts only verified payments.
- **A pilot runner for all ten offers** (amberai #791, merged 21:13Z). A person runs one command on a client's own exports and gets the offer's report, with the same checks as the samples. `RUNNER.md` lists the files and options per offer. A run is refused unless it names who authorised the client's files, or is declared invented test data with no real-looking contact details in it.
- **The buyer-evidence check** (#105, comment 6100741402). The worker opens each cited page at most once a day, with robots.txt honoured, and marks each fact found or not.

## What was tested, and how

- **Pages.** By 19:11Z the worker's probe had read all 21 pages in production. Each answered HTTP 200, each offer page showed its pilot notice, and each sample passed every check.
- **Intake.** The round trip was proven at 20:53Z: the worker's self-test sent a visit (HTTP 204) and an inquiry (HTTP 200), and the tracker read both back from the database. Self-test rows are never counted.
- **Evidence.** 41 of 65 cited facts were found on their live pages.
- **Code.** 389 offers tests pass, and each deploy was checked against the worker beacon: the pages, memory, the event loop and the earnings tick.
- **The runner.** It was run end to end on six fresh export shapes: HubSpot contacts, an mbox inbox, Shopify plus a marketplace, a phone-system call log, Jobber-style quotes and a wide budget sheet. Every report was produced with all its checks passing, and each found the problems planted in its data. One run exposed a real bug, which was fixed before the merge: a call log that marks direction only in an "Action" column listed an already-called-back caller as an open lead.
- **Not yet:** a real buyer. Real visits and inquiries are 0, because nothing has been posted anywhere.

## What remains blocked (owner-only)

- **Organic posts.** No owner-owned business page is connected to Amber's publishing, and that pipeline posts video only. The posts and ad copy are ready to paste by hand, with tracking links, in `ads/AD-ASSETS.md`.
- **Payment for the nine new pilots.** None is online, by design. For a paid pilot the owner sends a payment request by hand, then records it with `offer-record: <inquiry id> paid $<amount> <payment reference>` on #105.
- **Website checkout.** The site's own checkout is in Stripe test mode, so Ko-fi stays the live payment path for the $49 Website Snapshot.
- **Evidence behind bot checks.** 17 cited pages, mostly Upwork and Fiverr, answered with a challenge page. They stay unverified and are not fetched around.

## Next concrete action

Paste the prepared posts for the Unpaid Invoice Tracker and the Website Health and Booking-Form Check on the business's own channels. Use their tracking links from `ads/AD-ASSETS.md`. Then reply within a day to any inquiry the tracker lists, and record each outcome with an `offer-record:` line.
