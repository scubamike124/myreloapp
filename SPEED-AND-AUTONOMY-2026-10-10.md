# Why Amber did not set up Ko-fi, what a live Stripe test needs, and what 30 tasks a day would take — 2026-10-10

## 1. Why Amber did not set up the Ko-fi page herself (verified)

Two causes, both in the record:

1. **No browser in production.** Amber's services run on Alpine images (`Dockerfile`, `Dockerfile.osworker`: `node:22-alpine`). The main Dockerfile says so in its own words: "This image is Alpine, which Playwright does not support for its bundled Chromium, and no browser is installed." Ko-fi has no write API (`channels.ts`: `publish: unknown("web UI only; no write API")`), so a Commission can only be made through its web pages, which Amber cannot open from Railway. The self-serve sign-up/login runner exists in code (`onboarding/self-serve-run.ts`) but has nothing to run on.

   **Precision (13:00Z, from the code's own record):** Amber does have a remote-browser path. `src/lib/browserless/client.ts` connects to Browserless (a hosted Chromium service) when a `BROWSERLESS_API_KEY` or `BROWSERLESS_TOKEN` is in the vault, and falls back to local Chromium otherwise. Its comment, written from Railway logs on 2026-09-11, records that every production attempt failed with either "reached the units usage limit" (the Browserless plan's quota was used up) or "Executable doesn't exist" (no local browser). So both browser paths were dead a month ago, and nothing since changed the image. Whether the Browserless quota has reset is unverified from here: this session cannot reach browserless.io and the beacon does not report it. Two ways to give Amber a browser: the #780 image (no spend; about 1.5 GB more image) or a paid Browserless plan (spend, your call).
2. **The standing orders.** Every instruction this week said: do not publish, do not use my identity, do not create accounts, do not touch secrets automatically, stop for CAPTCHA/2FA/payment connection/final publish. Ko-fi's Commission needs a sign-in with your credentials and a PayPal/Stripe connection; "Do not publish anything yourself" was explicit. Amber prepared the paste package and stopped, as told.

**What it takes to let Amber do it next time (your decision, then about a day of work):**
- A worker image with a browser: base on Microsoft's Playwright image (Debian, Chromium bundled; roughly 1.5 GB more image, more memory on the worker). Draft PR #780 has the Dockerfile change (CI matches main; the first Railway build must be watched); you approve the merge.
- A written list of platform actions Amber may take on your account (for example `kofi: commission create/edit`), stored as a variable, with the credential in the vault. Amber signs in only for listed actions, logs every step on #105, and still stops at a CAPTCHA, 2FA prompt or payment-connection screen (those are the site's walls, not mine).
- One recorded pass of the Ko-fi Commission form so the runner knows its fields. Amber's session cannot open ko-fi.com (network policy), so the first pass runs on the worker with you watching the log.
- **Guess, flagged:** Ko-fi's terms on automated account use were never retrieved (the catalog says so); a datacenter sign-in can trigger a CAPTCHA you never saw on your phone.

## 2. The live Stripe test (what is possible, and the exact steps)

- **One cent is not possible:** Stripe's minimum card charge is USD 0.50. The test is 50 cents.
- **Amber cannot pay:** a live charge needs a real card, and your card is your identity. Amber never holds or uses it. The honest split: Amber proves the key and the account (no money moves), you place one 50-cent order from the live page with your own card, Amber refunds it when you click.
- **Built (PR pending):** two owner-only routes behind your HQ sign-in, 404 unless the checkout switch is on.
  - `POST /api/website-snapshot/stripe-probe`: reads the account (charges and payouts enabled, country), the balance (live mode, available), creates a 50-cent PaymentIntent and cancels it at once. No card, no charge. Returns masked ids and booleans.
  - `POST /api/website-snapshot/refund {sessionId}`: refunds one paid checkout session in full and marks the order refunded.
  - `WEBSITE_SNAPSHOT_TEST_ORDER_CENTS=50` on amber-hq-web makes the next orders 50 cents, named "owner's test order"; unset it after.
- **Order of operations, when you say go:** (1) deploy the PR; (2) you set `WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true` and `WEBSITE_SNAPSHOT_TEST_ORDER_CENTS=50` (you told me this morning not to touch the payment switch; this is your reversal to make, not mine); (3) sign in to HQ and call the probe; (4) order from https://hq.amberoneai.com/website-snapshot with your card, 50 cents; (5) the thanks page shows the session id; call the refund with it; (6) unset the test amount; keep or clear live payments as you decide. Evidence of each step goes on #105.

## 3. "30 tasks a day" (what the numbers say)

- **Verified:** since the outreach lane started, 0 emails have been sent. Every sale in this plan starts with an email you send; Amber was told not to send. 25 reviewed prospects waited for two days with nothing sent. The $49 task did not take three days because Amber was slow; the queue was full and the sending step is yours.
- **Verified:** Amber's own throughput: a pull of 25 prospects, 10 previews and 15 reviews per hourly run, with 42 and 128 usable sites found in the last two pulls. Supply is not the limit.
- **What 30 a day would need, each one your decision:**
  1. **Sending authority:** a dedicated sending mailbox (a transactional-email provider or your own SMTP), a daily cap (for example 30), the CAN-SPAM footer (your postal address and an opt-out line), and a written rule that Amber sends the first email and the one follow-up, nothing else, and stops on any reply. I can build the sender lane behind a variable so it is off until you set it; it is not built today because every instruction said do not send.
  2. **Delivery without you:** the $49 report is produced by the runner and held for a person's review. To ship 30 a day, either you review 30, or you approve a rule that reports passing every automatic check go out without a human read. That is a quality decision; the checklist exists.
  3. **Payments without you:** Ko-fi pays you directly and emails you; Amber reads those emails only if you forward them to the inquiry mailbox (the rule exists; the forwarding is in your Ko-fi account).
- **Guess, flagged:** cold notes like these convert in low single digits. 30 paid reports a day would need something like 600 to 1,000 sends a day, which is beyond what a single mailbox can send without being marked spam. 30 sends a day is a realistic cap; 1 to 3 conversations a week is a realistic result from it. I would rather tell you that now than claim 30 sales.
