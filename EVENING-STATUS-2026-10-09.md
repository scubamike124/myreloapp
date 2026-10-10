# Evening status — 2026-10-09, 23:00Z (owner away since ~18:20Z)

Revenue is still $0: no payment link is live yet. Everything below is code, production upkeep, or prospects for you to email by hand. Nothing was sent, published, or switched on.

## What is live in production (all deployed and verified, proofs on #105)

- #761 your opener: "Hi there, I noticed one small issue on your website that may affect how some people use the site." No draft says "from a phone" (none of the five checks is about phones).
- #760 memory across deploys: the outreach queue and lane state are mirrored to one database row after every run and restored after each deploy. Proven on every deploy since (#759, #761, #762, #763, #765, #766, #767, #768, #769).
- #762 Ko-fi intake path: `npm run listing:published -- kofi <url>` records your published listing (text sha 509758c46d53); every price reply in the #105 report then carries the Ko-fi link. Until then each price block carries "I will send you the order link shortly. No obligation either way." and never the dead site link.
- #763, #765, #766, #767 contact addresses: a prospect the map gave no address gets the one its own contact page or home page names (Cloudflare-obfuscated and "name [at] domain" forms included), read once with a plain GET after robots.txt. The report's email column says where each address came from.
- #768 kit section 10: the price reply is sent only once a payment link is live. (Also fixed a docs test that CI does not run.)
- #769 queue target 25: the lane keeps 25 prospects waiting, same per-run budget (three map pulls, ten previews, ten address lookups, paced), hourly while short. The report shows the ten best with exact drafts and lists the rest compactly.

## The queue now (22:44Z run)

36 items: 22 waiting for you (target 25, next hourly run ~23:44Z), 2 to preview, 12 set aside. Nine of the ten best have an address on file (seven from the map, two from their own pages). Categories pulled so far in Phoenix: pest control, plumbers, HVAC, roofers; med spas, dentists and restaurants come next, then Dallas. Full list with drafts: OUTREACH-BEST-10-2026-10-09.md (attached to the chat) and the #105 Outreach comment.

## What only you can do (when back)

1. Ko-fi: publish the Commission from KO-FI-PASTE-PACKAGE-2026-10-09.md and send me the public URL. I then run the one command above, open the PR, merge after CI, and the price reply switches to your link. That is the first live payment path.
2. Or the site checkout: set WEBSITE_SNAPSHOT_CHECKOUT=true and WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true on amber-hq-web (the live Stripe key is in the vault) and place one $49 order from your own card. I never set these.
3. Then send the three best emails from the action package, from your own mail program. Tell me "sent <domain>" after each.

Paused by your instruction, untouched tonight: the Railway token (still not recognised by Railway) and the worker volume. The mirror makes the volume unnecessary for the outreach queue.

## Production notes

- One anomaly: the web process had a 10.6 s event-loop stall around 21:45Z (the known memory-pressure pattern, heap near its limit); it did not repeat, and the #768 and #769 deploys restarted the process.
- Railway's web deployment of #767 failed on Railway's side 59 seconds after the merge (the same code builds cleanly here); #768 replaced it and both services have deployed every commit since. Railway's deploy results are visible as GitHub commit statuses, which I now use to watch deploys.
- Every earnings tick tonight was clean (evaluated ~906, accepted 37, 0 failures). The loop guard prevented one repeated scout search at 18:57Z.

## Later that evening (00:12Z update)

Three more PRs merged and deployed one at a time, each verified (12+ clean probes, clean earnings tick) with a proof on #105:

- **#770** `npm run outreach:record -- sent|reply|skip <domain>`: when you say "sent <domain>", one command records it in owner-outreach.ts (then commit, PR, deploy); the lane drops the prospect from the list and never drafts that domain again. Replies are recorded with their stage (asked what / asked price / ordered / declined). Proof 6091194978.
- **#771** the #105 report now says why prospects were set aside. First reading: `Set aside 12: 5 robots.txt disallows the site · 4 the site answered HTTP 403 · 3 every page read, nothing to say.` Nine of twelve refuse to be read; only three are clean sites. Proof 6091440515.
- **#772** a real blocker found in the 23:27Z run and fixed: the med spa map query used a regex flag Overpass rejects (HTTP 400). The lane read that as "busy", kept the cursor on med spa and retried every 15 minutes, so the queue could not pass 24. The query is corrected and a rejected query now skips the category. Merged 00:10:55Z; its deploy and the first med spa pull are being watched.

Queue at 23:57Z: 24 waiting for the owner (target 25), 12 set aside, 0 to preview; 13 of the 24 have an address on file (10 from the map, 3 from the site). Nothing sends automatically. Health watch re-armed after a container restart at ~23:40Z; no new anomaly.

## Overnight (02:25Z update)

- **Ko-fi is the live order link.** You published the Website Snapshot Report — $49 commission and confirmed it from the checkout screen. Recorded in two steps: #773 held the record while your screenshot showed no commission; #774 flipped it to visible. Since the 02:18Z run every price reply on #105 carries https://ko-fi.com/michaelmoore64737. Proofs 6092442921 (#773) and 6092677936 (#774). The top 3 emails with the Ko-fi price reply are in FIRST-DOLLAR-ACTION-PACKAGE-2026-10-09.md. Nothing sends automatically.
- **Volume attached** (`amber-os-worker-volume`, /app/.data, 5,000 MB): the worker's 02:06Z boot carried it. #775 (in CI) adds a `dataDir` block to the beacon that proves the mount and the three ledgers under it; its deploy is also the persistence test ("files present on disk").
- **WEBSITE_SNAPSHOT_CHECKOUT=true** on amber-hq-web: Amber's session cannot reach the public hostname, so #775 also makes the worker probe /website-snapshot (and /sample, /terms) every five minutes; the beacon shows the status. Hold WEBSITE_SNAPSHOT_LIVE_PAYMENTS until you see the page or the beacon shows 200.
