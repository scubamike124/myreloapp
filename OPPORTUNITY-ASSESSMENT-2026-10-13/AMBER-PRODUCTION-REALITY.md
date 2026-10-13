# What Amber actually runs in production

Read-only audit of the amberai repository (private) and the 83 comments on issue #105, read 2026-10-12 23:41-23:53 UTC.
Nothing was touched. "B", "PP1" and the other short labels below are Amber's own report comments on
`https://github.com/scubamike124/amberai/issues/105`; each label links to the comment id.

**Bottom line.** After 66 days, 788 merged pull requests and about 183,000 source lines in the agent directories, verified
revenue is **$0** and there are **no real customers, inquiries, orders or replies**. What runs reliably is scheduling,
ingestion and self-reporting. Nothing that sells has yet run for a real buyer. Registered worker counts say nothing about
active capacity (table 3).

Comment labels: [B](https://github.com/scubamike124/amberai/issues/105#issuecomment-5737077514) worker beacon ·
[PP1](https://github.com/scubamike124/amberai/issues/105#issuecomment-5813779430) and
[PP2](https://github.com/scubamike124/amberai/issues/105#issuecomment-5922079992) pursuit proof ·
[MT](https://github.com/scubamike124/amberai/issues/105#issuecomment-5922074753) money trail ·
[MH](https://github.com/scubamike124/amberai/issues/105#issuecomment-5945240045) money hunt ·
[CC](https://github.com/scubamike124/amberai/issues/105#issuecomment-5840739604) capable census ·
[AC](https://github.com/scubamike124/amberai/issues/105#issuecomment-5857335346) admitted census ·
[API](https://github.com/scubamike124/amberai/issues/105#issuecomment-5871305125) API marketplaces ·
[SC](https://github.com/scubamike124/amberai/issues/105#issuecomment-6062425028) self-check ·
[LST](https://github.com/scubamike124/amberai/issues/105#issuecomment-6074182151) listings ·
[DASH](https://github.com/scubamike124/amberai/issues/105#issuecomment-6074708825) revenue dashboard ·
[OUT](https://github.com/scubamike124/amberai/issues/105#issuecomment-6083663058) outreach ·
[RAIL](https://github.com/scubamike124/amberai/issues/105#issuecomment-6084165961) Railway operator ·
[OT](https://github.com/scubamike124/amberai/issues/105#issuecomment-6100695261) offer tracker ·
[SPR](https://github.com/scubamike124/amberai/issues/105#issuecomment-6100207146) sprint status ·
[SOC](https://github.com/scubamike124/amberai/issues/105#issuecomment-6105360976) social ·
[SPT](https://github.com/scubamike124/amberai/issues/105#issuecomment-6113510213) StudyProofs tracker ·
[SUP](https://github.com/scubamike124/amberai/issues/105#issuecomment-6126178560) support mail ·
[INB](https://github.com/scubamike124/amberai/issues/105#issuecomment-6127056970) support inbox.

Classes: **A** = timer-driven and its output can be checked independently (an instrument). **B** = timer-driven, outputs
unproven or outcome zero. **C** = built but held, blocked or disabled. **D** = manual (a Claude Code session or the owner).
**No money-making lane is class A.**

## 1. The three jobs the beacon watches (B, 23:41:20Z; re-read 23:51Z)

| Job | What it is | Last result it records |
|---|---|---|
| AMBER_EARNINGS_TICK | Worker calls the web service's earnings tick: marketplace ledger, bid follow-ups, government scan, report publishing | "discovered=0 evaluated=923 rejected=246 accepted=37" (only `discovered` is per tick; the rest are cumulative; accepted has been frozen at 37, which equals the Dealwork bids) |
| PLATFORM_PUSH_TICK | Outreach lane, Railway reconcile, promotion lane, trackers, support status, social reports, then the platforms tick | A flag and web vitals; "reports no marketplace result" |
| SCOUT_NETWORK_TICK | Starts the scout tick in the background | "searches=30 discovered=0 qualified=0 bridged=0"; over 50 ticks: 1,500 searches, 6 discovered |

What the beacon does **not** prove: only 3 of 29 cron kinds are watched, and their state is held in worker memory, so
"failuresInARow 0" covers only the 30-40 minutes since the last deploy (eight merges in 24 hours, each redeploying both
services). `attempts` is a persisted counter that has reset before and cannot be divided by uptime.

## 2. Lanes: who built them, who produced the output, and the outcome

| Lane | Class | Built by | Output | Outcome |
|---|---|---|---|---|
| Worker scheduler, web probe, beacon | A | PRs #32, #615-#622, #775 | 7 ticks in 2,407 s; all 29 crons ran within 632 min; 30/30 web probes OK | Web heap 956 of 1,328 MB: [SC](https://github.com/scubamike124/amberai/issues/105#issuecomment-6062425028) is critical |
| Earnings tick (ledger, bids, government scan) | B | #233, #238, #484, #490, #581, #596 | 923 jobs, 246 rejected, 37 queued, 0 discovered per tick | 41 platform-id submissions (37 Dealwork, 2 SporeAgent, 2 NEAR); confirmations, acceptances, awards, wins **0**; Dealwork off by the owner ("went to unfunded AI-agent posters") |
| Scout tick, child workforce | B | #80, #115, #243, #431, #507 | 30 searches a tick; lifetime 79,141 candidates, 20 sources proven, 16 promoted | 24 h: 58 new candidates, 0 proven, 0 promoted; executable 0; 0 of 105 checked became real work sites |
| Platform push (39 platforms read) | B | #467, #471, #603, #726 | 156 reads, 0 failed in 15 min | Executable 0; no dated submissions in 24 h; $0 |
| Report publishers (money trail, money hunt, pursuit proof, censuses, revenue dashboard) | A | #441, #487, #579-#582, #593, #602, #723, #733, #747 | 22 of 23 reports refreshed within 24 h | MT: 872 paths -> 47 payer-proven (22 junk) -> 1 ready for approval -> **0 executable**; revenue $0; petty-cash wallet 0 spends, 0 USDC |
| Self-serve accounts, Zindi, Freelancer | B/C | #464-#469 | 9 account attempts, 2 created | Zindi wrote "no agents" (09-29); last attempts failed ("no signup form found") |
| API marketplaces | B | #511-#514 | 67 sites read, 14 marketplaces tabled, 27 drafts held | **Approved 0, accounts 0, live listings 0**; views, leads, orders, revenue "not read"; 9 of 15 APIs deliverable |
| Listings | C (+D) | #748, #752, #762, #773, #774 | 48 channels, 54 listings: 53 drafts await owner approval, 1 published (Ko-fi $49, published by the owner) | Inquiries 0, orders 0 (Ko-fi webhook setup unconfirmed) |
| Outreach lane (OpenStreetMap -> three-page preview -> draft; never sends) | B | #754, #756-#781 | Queue 95: 57 reviewed and waiting, 38 set aside | **Emailed 0, replies 0**: sending is the owner's manual step |
| Ten-offer pilots: pages, tracker, evidence probes | A (instruments), B (offers) | #789-#801 | 10 pages (7 ready), sample QA 11/11 to 18/18; 61 of 65 evidence quotes found | Real visits 0, inquiries 0, paid pilots 0, $0.00 (26 self-test rows each, never counted) |
| Pilot runner, buyer-evidence list, demo videos | D | #791, #799, #800 (Claude session) | "151 runs" on invented data | 0 real client files; "7 ready" means the runner passed on invented files |
| Social publishing and promotion | C | #795, #797, #802-#804 | 44 account rows, **0 connected**; 1 live post (own tip page); last publish job 09-02 | No third-party posts since 09-02 |
| StudyProofs journey probe, tracker, demos | A | #805-#808, #810, #815 | 11 of 12 steps pass (`domain` fails) | Visitors 0, signups 0, paid $0.00; verdict "not ready" |
| StudyProofs tutoring-centre campaign | B, then C | pre-09-11; hold #806 | 577 sends to 19 addresses (max 34 per address), 576 delivered, 1 bounce | Replies 0 (reply-to could not receive) |
| Support mail and inbox | B (blocked on owner) | #811-#816 | Receiving on in Resend; 0 of 4 DNS records published; no Cloudflare token | Received 0, answered 0 |
| Self-check | A | #715, #738 | 1 critical (web heap); 45 loops prevented | - |
| Railway operator | B | #755, #757, #759, #787, #788 | 500 reads in the ledger, newest 30 all "Not Authorized" | Intents applied 0 |
| High-ticket worldwide | C | #607, #608, #611, #614 | Flag "web: on, refused here; worker: off" | 0 |
| Website Snapshot $49 order path | C | #701-#711, #714, #729, #739, #782, #785 | Checkout on in **test mode**; live payments unset | 0 orders, $0 |
| Seven other daily cold-email crons | B? | before 09-11 | Each ran within 272-512 min | Sends and replies on **no** report; UNCERTAIN. The self-check cannot see them |
| Venture, e-book, money factories | C / UNCERTAIN | before 09-11 | Kill switches active; e-book 36 ready, 0 published | $0 |
| Amber's own coding agent (DevTask) | C | #65-#74 | 5 PRs on 08-30 (one merged by the owner, 136 lines; four open 43 days) | Nothing since 08-30 |
| **Claude Code sessions (everything else)** | D | 788 merged PRs 08-08 to 10-12 (Aug 54, Sep 508, Oct 226) | 131 in the last 7 days, 8 in the last 24 hours, **all `claude/*` branches** | 60 of 83 #105 comments |

## 3. Registered is not active

| Count | Registered | Executed or active | Gap |
|---|---|---|---|
| Child workers | 100,000 (90,018 ever ran) | 23,598 active in 24 h (23.6%); 3,467 in 1 h (3.5%) | 76,402 idle. The qualify role has 33,440 registered and 84 active (0.25%) |
| What 50 ticks dispatched | 18,331 | 14,971 re-read stored data (81.7%); 3,331 internal; **25 external searches (0.14%)**; 4 durable results; qualified 0 | 99.8% re-read stored data |
| Scouts | 5,120 | 2,294 ran in 24 h (44.8%) | 2,826 did not run |
| Real upstream fetches | n/a | **450 in 24 h**; 34 distinct upstream pulls | 450 per 100,000 workers (0.45%) |
| Territory roles | 69 x 23 = 1,587 | 958 active (60.4%); 706 runs reached outside | Fully working territories 0; with executable work 0 |
| Platforms | 45 known, 53 scanned | 39 read; ever submitted on 3 | Most connectors never produced an outward act |
| Sources | 79,141 candidates, 13,929 remembered | 24 h: 58 new, 0 proven, 0 promoted | "promoted for the whole workforce: none yet" |
| Social, listings, prospects, pages | 44 accounts, 54 listings, 95 prospects, 10 pages | 0 connected, 1 published (by the owner), 0 sent, 0 real visits | - |
| Cron kinds | 29 | all ran; outcomes visible for 3 | 26 unobserved |

The scout tick spends 100 of 123 seconds (81%) on "audit, repair and owner report" and 8.8 seconds on discovery.

## 4. Autonomous work versus software Claude built

- Of 83 comments on #105, **23 are rewritten by the worker on its own timer** (22 refreshed within 24 hours) and **60 are Claude
  Code notes**, all created 10-09 to 10-11. All 83 are posted under the owner's GitHub account, so neither the author name nor the
  "Generated by Claude Code" footer proves authorship (worker code appends the footer too). Two of the 60 carry `amber-`
  markers but are first-person Claude text.
- All 131 pull requests merged in the last 7 days and all 8 in the last 24 hours are `claude/*` branches. 906 of 924 visible
  commits (the clone is shallow from 09-11) are co-authored by Claude. Amber's own coding agent produced five PRs on 08-30 and
  nothing since.
- **Amber's autonomous output is runtime: scheduled ingestion, ledgers and self-updating reports. The products, the checkout,
  the demos, the pilot runner, the APIs and the support-mail pipeline were built by Claude sessions or the owner.**

## 5. Components proven in production versus not

| Component | Proven in production? |
|---|---|
| Scheduler with leases and stale recovery (`src/lib/cloud/work-queue.ts`) | Yes: 29 kinds |
| Self-updating status comments, beacon, self-check | Yes: 22 reports within 24 h |
| Polite public-page fetch (robots, SSRF guard, shared fetch) | Yes: 450 real fetches a day; 95 OpenStreetMap prospects |
| Public-source connectors (SAM, grants.gov, TED and others) | Yes: 833 government listings in three ticks |
| Source-linked evidence checks | Yes: 61 of 65 quotes found daily; citations 16/16 and 8/8 |
| Resend sending | Yes (576 of 577 delivered), but a state-loss bug mailed one address 34 times, and `amberoneai.com` sending is refused now |
| Live Stripe Checkout creation and webhook check | Yes (StudyProofs probe), **0 payments** |
| Report rendering, review gate, pilot runner | **Sample or invented data only** (151 runs); 0 real customer reports |
| Inbound support mail | **No**: no MX, 0 received |
| Do not reuse | The scout network (`commander.ts` 5,678 lines, `child-workforce.ts`), the 154 MB candidate store and `amber-organization`: they cause the web heap pressure |

## 6. The eight facts that decide

1. **No demand signal after 66 days.** Revenue $0; 0 customers, real inquiries, orders or replies.
2. **The bounty and marketplace thesis is structurally closed, not under-scaled.** 872 paths -> 47 payer-proven -> 0 executable; 385 of 873
   labelled tasks blocked by platform rules; 37 Dealwork bids won nothing; Zindi bars agents in writing.
3. **Distribution is absent.** 0 of 44 social accounts connected; 4 of 5 promotion channels blocked on owner accounts; the one live
   tip page has 0 visits; 57 reviewed prospects sit idle; `amberoneai.com` cannot receive mail (no MX, no Cloudflare token) or send.
4. **What is proven is plumbing and measurement**, not selling.
5. **Paid fulfilment has never run for a real buyer.** The first real order would be the first real test.
6. **The platform mostly reports on itself.**
7. **Stability risk.** Web heap near its limit; each merge restarts both services; a new product should not sit on the scout-network
   or workforce state.
8. **Every outward act waits on the owner, and build sessions have only GitHub egress.** A product line whose first sale needs more
   than one owner step will repeat the zero-outcome pattern.

Unverified or uncertain in the source audit: whether the seven other daily cold-email crons send anything; whether the Ko-fi webhook token
is stored (so "0 orders" may undercount the one live $49 listing); LLM spend (capped in code at $100 per rolling 7 days, not
reported); whether the org layer executed anything.
