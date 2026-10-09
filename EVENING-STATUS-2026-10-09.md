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
