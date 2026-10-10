# Morning report — 2026-10-10 (overnight 02:30Z → morning)

_Final at 05:30Z. Verified facts carry the time and the #105 comment id that holds the evidence. Where something is an assumption or an inference, it says so. Nothing was sent, bought or enabled overnight; live payments are off._

## 1. What shipped overnight and how it was verified

| PR | What | Verified | Proof on #105 |
|---|---|---|---|
| #773 | Ko-fi page recorded, held while the $49 commission was not visible | 12/12 probes, ticks clean, held note on all ten price replies (01:48Z run) | 6092442921 |
| #774 | Ko-fi commission confirmed visible and orderable → the $49 price reply carries https://ko-fi.com/michaelmoore64737 | 12/12 probes, ticks clean, the link on all ten replies (02:18Z run) | 6092677936 |
| #775 | Worker beacon `dataDir` (volume proof) + public page probe | volume mounted at /app/.data, 4,597 MB free, queue + lane state + Railway ledger present at boot | 6092983421 |
| #776 | Website Snapshot switches tolerant of pasted values; reported as booleans on the health route and beacon | showed the variable present but not "true"; after the owner's retype: present/on/exact true, pages 200 (03:28Z) | 6093204455, 6093326363 |
| #777 | Prospect review (every waiting prospect re-checked once; failures set aside with the reason) + offer-text check on the page probe | 12/12 probes, ticks clean; first review run 04:20Z: 15 reviewed, 14 passed, 1 set aside (Goettl: site could not be read) | 6093728768 |
| #778 | Services ratchet fix (a regex token read as a sending identifier) | 12 consecutive clean probes after one unanswered probe at boot; ticks clean; services suite 211/211 | see #105, "Deploy verification for #778" |

## 2. Production checks

- **Website Snapshot page:** up. At 03:28:51Z the web process reported `WEBSITE_SNAPSHOT_CHECKOUT` present, on and exactly "true"; `/website-snapshot`, `/sample`, `/terms` answer 200 (they were 404 at 02:38Z and 02:58Z because the first value was not "true"). **Live payments are off** (`WEBSITE_SNAPSHOT_LIVE_PAYMENTS` not set); the checkout route refuses a live Stripe key until you set it. **Direct confirmation (04:03:06Z, beacon on the #777 build):** the worker's probe read the `/website-snapshot` body and reports `offer: true`, i.e. the served page names "Website Snapshot" and "$49"; `/sample` and `/terms` answer 200.
- **Worker volume:** verified from the beacon at the #775 boot: `/app/.data` is a separate mounted filesystem (4,596.7 of 4,614.4 MB free); present at boot from the previous process: outreach queue (38 files), lane state, Railway operator ledger. Loop-guard ledger has no file yet (no loop refused; path under the root). The lane's own line at 04:20:45Z: "files present on disk, nothing restored from the database" — the first boot since the volume where nothing had to be restored. Verified.
- **Health:** five deploys overnight (#774–#778), each verified with 12 consecutive clean probes and a clean earnings tick on the new build; one unanswered probe in the whole night (a 10 s timeout right after the #778 web boot, 04:29Z), one 10.7 s event-loop stall at 01:13Z (the known candidate-store parse pattern), one web restart from your variable change (~03:27Z). Earnings ticks clean every time (907 evaluated, 243 rejected, 37 accepted; failuresInARow 0). Loop guard: 0 prevented. At 05:21Z: 30 of 30 probes answered, RSS peak 1,313 MB, event-loop max 5,173 ms in the last window, switches checkout on / live payments off, offer page 200 with the "$49" text.

## 3. Amber's actual runs (verified from the #105 report and the beacon)

- Outreach lane runs since you went to bed: 02:18:45Z (restored 38 items from the database after the #774 boot), 04:20:45Z (first on #777: reviewed 15, 14 passed, 1 set aside; "files present on disk, nothing restored" — the volume held), 05:22:00Z (reviewed 11, 11 passed; files present on disk again). 07:27:01Z (steady: 25 waiting, all reviewed, nothing to preview, files present on disk). No map pull since 00:21Z (the queue has been at or above 25 waiting). Nothing sent.
- Earnings ticks: every 5–6 minutes all night, all clean (HQ remote: 907 evaluated, 37 accepted, 0 failures). Platform push and scout ticks clean; scout runs ~30 searches each, 0 new discoveries overnight (the discovery side is flat; that is a measurement, not a change).
- Ledgers under the volume at 05:21Z: outreach queue 38 files (written 04:21Z), lane state (04:21Z), Railway operator ledger (05:16Z); loop-guard ledger not yet created (nothing refused). 4,596.6 MB free of 4,614.4.

## 4. Prospects: 25 qualified (all 25 waiting prospects reviewed and passed by 05:22Z; evidence 6094179936)

- **25 waiting for the owner** (26 before the review). 25 of 25 re-checked on production and passed: the site answers (home HTTP 200, robots.txt allowed, plain GET), the drafted finding is still on the page it was drafted from (or re-drafted from today's pages), the draft matches the finding, the address on file has a recorded source (OpenStreetMap for 10, the site's own page for 5; 10 have no address and the draft says so), no duplicate registrable domain, none in your records. Set aside by the review: Goettl Air Conditioning & Plumbing (goettl.com): the site could not be read now. All 13 set-aside prospects and their reasons are in the report's tally (5 robots.txt disallows, 4 HTTP 403, 3 clean sites, 1 review). No access block was bypassed.
- What the review does **not** judge: whether a finding is "worth" the note is a human call. All 25 findings are one of four concrete, page-specific items (image without a text description, a form field with no label, no page language, skipped heading level), each with a one-line fix; the drafted reply names the page.
- The 25, all passed: Seal Out Scorpions, All Vee's Plumbing, Any Hour Services, 1st Choice Mechanical, Mike's Swat Team, Plomero en Phoenix, Cool Blew, Arizona Native Roofing, Allstate Roofing (Phoenix), Stonecreek Roofing, Arizona's Best Choice Pest, Zippity Split Plumbing, Desert Water Plumbing, JLC Roofing, Frontline Consultants & Contracting, Plumber of Phoenix, Arizona Roof Rescue, Salon Blissful Med Spa, Phillips Roofing, Pioneer Roofing, Brazillian Touch MedSpa, Lincoln Air & Plumbing, Mountainside Air, Hardacker Roofing, Phoenix Roofing. Full table with findings, scores, addresses and review times: OUTREACH-BEST-10-2026-10-09.md (refreshed 05:22Z) and the #105 outreach report.

Starting point at 02:18Z: 26 waiting for the owner, all 26 domains unique, 15 with an address on file (10 from the map, 5 from the site), 11 without. 12 set aside: 5 robots.txt disallows, 4 answer HTTP 403, 3 clean sites.

## 5. Best three to contact (all three passed the review at 04:20–04:21Z; exact emails in FIRST-DOLLAR-ACTION-PACKAGE-2026-10-09.md)

1. **Seal Out Scorpions** (pest control, Tempe) — https://sealoutscorpions.com/ — address from the map: support@sealoutscorpions.com — seen: one image on the about page with no text description; one form field with no label. Score 59.
2. **All Vee's Plumbing Services** (plumber, Phoenix) — https://allveesplumbing.com/ — address from the map — seen: one image on the home page with no text description; four form fields with no label. Score 59.
3. **Any Hour Services** (electric, plumbing, heating and air; Phoenix) — https://anyhourservices.com/arizona/ — address from the map — seen: two form fields on the /arizona page may have no label; headings skip levels. Score 59. Note: a larger company than the other two; your call whether to lead with it.

Each gets the opener ("Hi there, I noticed one small issue on your website that may affect how some people use the site. Do you want me to send what I saw? Mike"), the "what I saw" reply, and the $49 reply with your Ko-fi link. You send; nothing sends automatically.

## 6. The $49 report pipeline (verified locally, not with a paid order)

- Services suite: 211 of 211 tests pass with #778 (210 of 211 on main: one ratchet failure, fixed by #778).
- Dry run without network (04:00Z): a fake five-page site went through the same collector, renderer and safe-to-send review a paid order uses. Output: a 6,150-character report with plain-English summary, pages table (3 read, 1 NOT CHECKED with its reason), site-health table, findings by page with why/what-to-do/guideline, a fix checklist; the review checklist passed every automatic check except "real site, not an example host" (correct for a fixture) and lists the owner's ticks before sending.
- Delivery is gated by a person: order statuses `pending_review → report_generated → review_passed → owner_approved → sent`; nothing is delivered automatically. **Assumption, not verified:** no real order has flowed through production yet.

## 7. Blockers and owner-only items (no genuine blocker found overnight)

- Live payments on the site: your call (`WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true` on amber-hq-web). Not needed for Ko-fi orders.
- Sending the first three emails: yours, by hand, from the action package.
