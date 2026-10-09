# Obscura for Amber: technical fit (2026-10-09, not integrated)

Obscura (github.com/h4ckf0r0day/obscura): an Apache-2.0 headless browser in Rust, V8 for JavaScript, Chrome DevTools Protocol, drop-in for Playwright/Puppeteer (`obscura serve --port 9222`, `chromium.connectOverCDP`), Docker image 57 MB compressed on distroless, private IPs blocked by default. Vendor table: ~30 MB per instance vs 200+ MB for Chrome (reviewers measured 34 to 38 MB vs ~530 MB); page loads faster on static and JS-light pages, no gain where network latency dominates. Stealth is an opt-in build flag implemented as a JavaScript shim (navigator overrides, fingerprint randomisation, tracker blocklist), not Chrome-grade TLS; no CAPTCHA solving; "an evolving independent engine" (long-tail CSS, some Web APIs, media differ from Chromium). Six months old: created April 2026, v0.2.1 August 2026.

## 1. Does Amber use Chrome, Playwright or Puppeteer today?

Yes, Playwright ^1.62 (no Puppeteer). 21 runtime files: `src/lib/browserless/*` (remote Chrome via Browserless, falling back to local Chromium), `src/lib/browser-automation/*` (TikTok studio and comments), `src/lib/auto-commercial/*` (route validation, director), plus marketing and QA scripts. In the earnings engine the only browser path is `scout-network/rendered-fetch.ts`: the promotion probe renders a page only when the extraction diagnosis says `client_rendered`, 2 renders per sweep, robots.txt first, 20 s timeout, 30 s ceiling.

In production that path does not run: the web image is Alpine, "no browser is installed" (Dockerfile), Browserless is "needs verification" (no token known), the source-promotion code itself records "production 2026-09-26: 0 rendered", and the promotion probe lane did not run in 6 of the last 7 ticks. The scouts read raw HTML and JSON only; the 39 platform connectors read APIs (312 reads, 0 failures in the last window).

## 2. What causes Amber's current failures?

From the production reports on #105 (pursuit proof, capable census, admitted-source census, beacon diagnosis):

- Browser or bot detection: 0 rows blocked on CAPTCHA or bot protection in the owner-action queue; the taxonomy has the class (`captcha_or_bot_protection`) and it is empty. 70 small .gov hosts answer HTTP 403 (WAF), but they are "navigation only, no listings" sites, so rendering them would yield nothing. Policy: "defeating bot protection is out of bounds", so stealth is not an option for Amber regardless of tool.
- Missing login or identity: 2 rows blocked on identity/KYC (Dealwork); Topcoder, Immunefi, audit contests, CrunchDAO, Opire need a person's own account; Zindi refused agents in writing.
- Payment path and evidence: 129 opportunities ($22,949) "truly impossible", 94 of them because Algora's bot has never announced an award; 50 sources declined on payment, wallet, payout, no-API or client-rendered rules; taskbounty lane empty (7 searches, 0 listings).
- Saturation: agent marketplaces and GitHub bounties return thousands of listings per window, none new.
- Client-rendered pages: the diagnosis names hackerone, bugcrowd, kaggle, topcoder, algora, zindi. Each is blocked downstream by account, KYC, policy or payment evidence, and several are already read through their APIs by the platform lane.

The first-dollar path (Ko-fi, Fiverr, SEOClerks, Khamsat, the site checkout) involves no scraping at all; its blockers are the owner's account and payout steps.

## 3. Does Obscura remove a real blocker today?

No. Nothing in the current blocker set is caused by the lack of a renderer or by browser detection, and the one place a renderer would act (client-rendered boards) is gated afterwards by rules Obscura cannot change. It is a future optimisation for two real, non-blocking gaps:

- Production has no renderer at all. Obscura as a Railway sidecar (57 MB image, loopback or private network, token, private IPs blocked, no stealth flag) would be the cheapest way to give the promotion probe a renderer: ~35 MB per session against 200 to 500 MB for Chromium, which the web process cannot afford (its heap already touches the limit).
- The Website Snapshot scan has checks marked "requires a browser" (runtime errors); a renderer could add them to the report later. Product quality, not a blocker.

## 4. The one small test, if and when wanted

Sandbox only, no production change, about two hours:

- Script `scripts/render-compare.ts`: for 20 robots-allowed URLs the diagnosis marks `client_rendered` (the six named boards plus the next fourteen), render each with (a) local Chromium via Playwright and (b) Obscura via `connectOverCDP` on loopback, no stealth, Amber's URL guard and robots check in front of both.
- Measure per page: peak RSS of the engine (sampled from /proc), wall time, DOM returned (yes/no), and listings extracted by the same `learnExtraction` call, plus the failure class.
- Adoption bar: Obscura must return at least as many listings on 80% or more of the pages at under 25% of Chromium's RSS; any page with fewer listings counts against it. Below the bar, nothing changes.
- Wiring cost if it passes: one env (`OBSCURA_CDP_ENDPOINT`) read in `browserless/client.ts`, which already connects over CDP; about ten lines, behind a flag, default off.

## 5. Decision

Do not integrate now. Keep the existing fetch and scout logic; run the test only after the first dollar, and only replace the renderer if the test clears the bar. Stealth mode stays off by policy.
