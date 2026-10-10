# Morning report — 2026-10-10 (overnight 02:30Z → morning)

_Draft in progress; the sections marked **(pending)** fill in as the overnight runs complete. Verified facts carry the time and the #105 comment id that holds the evidence. Where something is an assumption or an inference, it says so._

## 1. What shipped overnight and how it was verified

| PR | What | Verified | Proof on #105 |
|---|---|---|---|
| #773 | Ko-fi page recorded, held while the $49 commission was not visible | 12/12 probes, ticks clean, held note on all ten price replies (01:48Z run) | 6092442921 |
| #774 | Ko-fi commission confirmed visible and orderable → the $49 price reply carries https://ko-fi.com/michaelmoore64737 | 12/12 probes, ticks clean, the link on all ten replies (02:18Z run) | 6092677936 |
| #775 | Worker beacon `dataDir` (volume proof) + public page probe | volume mounted at /app/.data, 4,597 MB free, queue + lane state + Railway ledger present at boot | 6092983421 |
| #776 | Website Snapshot switches tolerant of pasted values; reported as booleans on the health route and beacon | showed the variable present but not "true"; after the owner's retype: present/on/exact true, pages 200 (03:28Z) | 6093204455, 6093326363 |
| #777 | Prospect review (every waiting prospect re-checked once; failures set aside with the reason) + offer-text check on the page probe | 12/12 probes, ticks clean; first review run 04:20Z: 15 reviewed, 14 passed, 1 set aside (Goettl: site could not be read) | 6093655xxx (see #105, "Deploy verification for #777") |
| #778 | Services ratchet fix (a regex token read as a sending identifier) | services suite 211/211 locally | **(pending)** |

## 2. Production checks

- **Website Snapshot page:** up. At 03:28:51Z the web process reported `WEBSITE_SNAPSHOT_CHECKOUT` present, on and exactly "true"; `/website-snapshot`, `/sample`, `/terms` answer 200 (they were 404 at 02:38Z and 02:58Z because the first value was not "true"). **Live payments are off** (`WEBSITE_SNAPSHOT_LIVE_PAYMENTS` not set); the checkout route refuses a live Stripe key until you set it. **Direct confirmation (04:03:06Z, beacon on the #777 build):** the worker's probe read the `/website-snapshot` body and reports `offer: true`, i.e. the served page names "Website Snapshot" and "$49"; `/sample` and `/terms` answer 200.
- **Worker volume:** verified from the beacon at the #775 boot: `/app/.data` is a separate mounted filesystem (4,596.7 of 4,614.4 MB free); present at boot from the previous process: outreach queue (38 files), lane state, Railway operator ledger. Loop-guard ledger has no file yet (no loop refused; path under the root). The lane's own line at 04:20:45Z: "files present on disk, nothing restored from the database" — the first boot since the volume where nothing had to be restored. Verified.
- **Health:** every deploy 12/12 clean probes; earnings ticks clean all night (907 evaluated, 37 accepted); one web restart at ~03:27Z from your variable change; RSS peaks ~1.3 GB at the candidate-store parse (known). **(pending: final overnight numbers)**

## 3. Amber's actual runs **(pending)**

## 4. Prospects (first review run done at 04:20Z; the rest due ~05:20Z)

- **25 waiting for the owner** after the first review run (26 before). 14 of 25 reviewed and passed; 11 still to review (the lane reviews 15 per run, hourly while any remain). Set aside by the review: Goettl Air Conditioning & Plumbing (goettl.com): the site could not be read now. All 25 domains unique; none in the owner's records.
- Passed so far: Seal Out Scorpions, All Vee's Plumbing, Any Hour Services, 1st Choice Mechanical, Mike's Swat Team, Plomero en Phoenix, Cool Blew, Arizona's Best Choice Pest, Zippity Split Plumbing, Desert Water Plumbing, Plumber of Phoenix, Phillips Roofing, Lincoln Air & Plumbing, Mountainside Air. Not yet: Arizona Native Roofing, Allstate Roofing, Stonecreek Roofing, JLC Roofing, Frontline Consultants, Arizona Roof Rescue, Salon Blissful Med Spa, Pioneer Roofing, Brazillian Touch MedSpa, Hardacker Roofing, Phoenix Roofing.

Starting point at 02:18Z: 26 waiting for the owner, all 26 domains unique, 15 with an address on file (10 from the map, 5 from the site), 11 without. 12 set aside: 5 robots.txt disallows, 4 answer HTTP 403, 3 clean sites.

## 5. Best three to contact **(pending: after the review passes them)**

## 6. The $49 report pipeline (verified locally, not with a paid order)

- Services suite: 211 of 211 tests pass with #778 (210 of 211 on main: one ratchet failure, fixed by #778).
- Dry run without network (04:00Z): a fake five-page site went through the same collector, renderer and safe-to-send review a paid order uses. Output: a 6,150-character report with plain-English summary, pages table (3 read, 1 NOT CHECKED with its reason), site-health table, findings by page with why/what-to-do/guideline, a fix checklist; the review checklist passed every automatic check except "real site, not an example host" (correct for a fixture) and lists the owner's ticks before sending.
- Delivery is gated by a person: order statuses `pending_review → report_generated → review_passed → owner_approved → sent`; nothing is delivered automatically. **Assumption, not verified:** no real order has flowed through production yet.

## 7. Blockers and owner-only items

- Live payments on the site: your call (`WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true` on amber-hq-web). Not needed for Ko-fi orders.
- Sending the first three emails: yours, by hand, from the action package.
