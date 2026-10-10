# Ten pilot offers: handoff

Sprint of 2026-10-10, 16:47Z to about 02:47Z. This note is updated as the sprint ends; `CHECKPOINT.md` has the full log and `RESULTS.md` the table and recommendation.

## What is live

- **Ten pilot pages and their samples** at https://hq.amberoneai.com/offers (21 pages, not indexed by search engines). Every page says it is a pilot and that nothing is charged online. Merged in amberai PR #789 (115ed6d) and deployed 18:20Z on 2026-10-10.
- **One shared inquiry form** on every offer page. Each inquiry records which offer and which source (the `src` link parameter) it came from. Nothing is emailed; a person replies.
- **The offer tracker on #105**, updated by Amber's worker: per offer, visits, inquiries, qualified replies, demo requests, paid pilots, delivery time, direct costs, failures, repeat orders and the demo checks. Revenue counts only verified payments. It reads the owner's `offer-record:` lines on #105 and nothing else as data.
- **The buyer-evidence check on #105**: the worker opens every cited page once a day (robots.txt honoured) and marks each fact found or not. First run: 41 of 65 facts verified.

## What was tested

- 295 offers tests and CI on PR #789; every sample passes its checks (141 checks at the time of the merge).
- Production: the worker's page probe reads the offer pages; the first readings after the deploy were HTTP 200 with the pilot notice and the sample's checks (for example 14 of 14 on the job-cost sample).
- Not yet proven in production: the live form round trip. The worker's one self-test ran before the new web build was serving and got HTTP 401. The fix (retry until it passes) ships with the pilot-runner PR.

## What remains blocked

- **Organic posts:** no owner-owned business page is connected to Amber's publishing, and that pipeline posts video only. The posts and ad copy are ready to paste by hand (`ads/AD-ASSETS.md`), with tracking links.
- **Payments for the nine new pilots:** none online, by design. A paid pilot needs the owner to send a payment request by hand and record it with `offer-record: <inquiry id> paid $<amount> <payment reference>`.
- **Website checkout:** the site's own checkout is in Stripe test mode, so Ko-fi stays the live payment path for the $49 Website Snapshot.
- **Evidence behind bot checks:** 17 cited pages (mostly Upwork and Fiverr) answered with a challenge page and stay unverified.

## Next concrete action

Post the prepared organic posts for the two recommended offers on the business's own channels, using the tracking links in `ads/AD-ASSETS.md`. Then reply to any inquiry the tracker lists within a day, and record each outcome with an `offer-record:` line.
