# Where Amber looks for paid tasks, what she found, and whether any of it can be done — verified 2026-10-16

Owner's question (2026-10-16 11:33Z): "find out if she was doing or looking for tasks and all regions that she goes to; if she found tasks or websites, which does she go to? We need to verify all of it to see if we can actually do them."

Sources of truth used here, in order: Amber's own live reports on amberai #105 (the production handoff rewritten every 15 minutes, the Money Trail, the Money Hunt, the capable census, the pursuit proof — all as of 11:32–11:33Z), the code that defines where she looks (`src/lib/scout-network/countries.ts`, `discovery-endpoints.ts`, `sources/index.ts`, `src/lib/amber-earnings/platforms/index.ts`), and a read-only re-check of every task those reports link, made by a GitHub runner at 2026-10-16T11:40:09Z (`scan/results/batch-22-paid-tasks.jsonl`). Nothing was bid, claimed, submitted or paid for in making this report.

## 1. Is she looking? Yes — continuously, on a fixed set of sites

Four jobs run on the worker, every tick: discovery (`SCOUT_NETWORK_TICK`, every 15 minutes), verification (every 5), the earnings tick (every 10: MoltJobs, TaskBounty, Toku, the government portals, Algora, the acquired boards) and the platform push (every 15: 39 agent-marketplace connectors). The handoff for 11:32Z counts 300 of 300 "monitor" workers touching the outside on the last tick and 10,905 upstream pulls in total, at a cost of $10.48; 2,000 opportunities sit in the scout ledger (its cap) and 831 live tasks on the agent boards.

But what they read is a closed list. Amber's own frontier report says every one of the 152 new-site candidates offered by her feeds this sweep was already known: **0 previously unseen sites**. The 1,409 sites her feeds admitted on the night of 2026-09-26/27 became 962 "not a work site" and 447 dead, and **0 real work sites**. Her monitor workers "returned nothing unseen" — more searches against the same boards buy re-reads.

## 2. Which regions: 26 of the 54 countries have a source; 28 have none

The code lists 54 countries. Amber's country-by-country work report (durable run records only) shows work in 47 of them, but a "worker that ran" in a country with no source only read what was already stored. Counting countries where at least one real endpoint was reached:

| | countries |
|---|---|
| A source was reached (26) | US, GB, CA, DE, FR, NL, IE, ES, IT, PL, IN, ZA, SE, DK, FI, AT, BE, PT, GR, CZ, RO, HU, PH, BD, NZ, KE |
| Registered, no source at all (18) | AU, BR, MX, SG, NO, CH, AE, IL, TR, JP, KR, ID, MY, AR, CL, CO, NG, EG |
| Not in the work report at all (10) | UA, SA, VN, TH, HK, TW, PK, PE, MA, GH |

What the 26 "reached" countries actually are: **government procurement portals**. SAM.gov, Grants.gov, SBIR, the NYC City Record and California's grants portal (US); Find a Tender (GB); CanadaBuys (CA); GETS (NZ); EU TED, whose one feed is split by country into ES, DE, FR, NL, PL, RO, CZ, SE, BE, FI, IE, IT, PT, AT, DK, GR, HU; Spain's contrataciondelestado.es; and four per-country job feeds found by the Wikidata country pass (PH 200 listings, ZA 170, KE 109, BD 49, IN 28). Government produced 83% of all opportunities (1,655 of 2,000), and the US alone 29%.

The non-government, non-bid endpoints (fixed reward, claim and do) are 12 across 7 countries, and the Freelancer and Dealwork ones among them are switched off by the owner's directive (they are the only non-government endpoint in AU, CA, GB and NZ, one of two in IN, and two of eight in the US). What remains: the US (MoltJobs, TaskBounty, Toku, the GitHub bounty search, the acquired boards) and India (ugig). Every other country's "coverage" is tenders.

## 3. What she found, and whether any of it can be done

Amber's own funnel on 11:32Z: 2,000 opportunities → 1,828 "Amber capable" → **0 eligible now** → 0 executable → 0 pursued → 0 won → 0 paid. Her reasons, row by row:

| bucket | rows | why nothing can be done | verified how |
|---|---|---|---|
| Government tenders (SAM.gov, TED, Find a Tender, CanadaBuys, GETS, contrataciondelestado …) | 1,655 | Owner directive: portal submission, signatures, certification and CAPTCHA belong to a person; SAM needs the owner's UEI; every row is `submit_no_credential` (the credential is owner-only). Headline values ($94.9M, $86.8M …) are contract sizes, not work Amber could deliver. | Amber's handoff, "RANKED BY PATH TO PAID" |
| GitHub bounties (Algora, IssueHunt, `label:bounty`) | 164 (37 with a listed amount, $12,721) | 21 still open ($426), all already carrying someone else's `/attempt`; 15 closed; payout needs the owner's identity on Stripe Connect; Algora has not answered the written question (sent 2026-09-27, followed up 09-30) on AI participation, so by the owner's 09-30 rule none is executable. Amber's GitHub identity amberone124 passes all 8 checks. | capable census, re-verified live 11:33Z |
| Agent marketplaces, platform push (39 connectors, 831 live tasks) | 831 | 391 blocked by platform rules (Immunefi 151, Ubiquity 110, audit contests 99, Devpost 22 — security research or hackathons, agents not permitted or no filing path); 128 Amber cannot do (GPU, live scans, video, outreach, another site's account); 78 no submit path built (Openwork 50, OpenTask 21, AgentPact 6, ugig 1); 128 under the owner's $4 floor; 48 expired, crowded or junk; 11 need the owner's KYC (Algora 10, cdph.ca.gov 1); 13 need review; **5 "Amber can do it"** — all on owockibot's board (25–35 USDC each, drafts passed QA), and the board itself answers "Bounty is not open for claims" (its issue #42). | Money Hunt 11:32Z, per-platform table |
| MoltJobs | 10 | "Referral bounty — bring an agent that posts on the forum", $0.20 each: not work, and below the $4 floor. | Money Trail |
| TaskMarket | 6 | 199 USDC quantum-safe Bitcoin CUDA work (needs a GPU), 10 USDC multiplayer game (needs another site's account), 6 USDC marketing post (needs social accounts), two 4 USDC animated videos (video, "humans only"), 1 USDC; one 25 USDC pitch drafted and held for the owner's approval words. | Money Trail, TaskMarket's own fields |
| NEAR AI Agent Market | 30 | 13 cannot do, 11 need review, 0.01 USDC summaries; one bid per job, two already spent. | Money Hunt |
| Acquired boards (agenthansa, moltplace, zindi, codabench, bountyhub, freelancehub) | 6 boards | agenthansa: bid endpoint proven but no payout destination ("no claim is made that money can reach you"); the other five: credential not tested; Zindi said no to agents on 2026-09-29. | handoff, "CAN THIS MARKETPLACE ACTUALLY PRODUCE MONEY?" |

The runner's re-check of the 87 task links on 2026-10-16T11:40:09Z: 87 links read; 65 answered with a page, 22 did not (gone, unreachable, a bot or human-verification wall, a server error). All ten MoltJobs referral bounties that top Amber's own 'ranked by path to paid' list are gone (HTTP 404). The Topcoder challenge and TheJobCafe's board are gone; ClawGig is paused; AgentHansa — the one acquired marketplace with a proven bid endpoint — did not answer; both Openwork job pages answered HTTP 500; Devpost, Metaculus and DoraHacks sit behind bot walls. The five owockibot bounty pages are live, and their board's own claim endpoint still answers 'not open for claims'. The GitHub bounty issues Amber lists are dated 2024 and January 2025, two with closed or archived words on the page. The TaskMarket tasks are live until their expiries (today and the next two days) and remain outside what Amber can do by her own screen (GPU, another site's account, video, 'humans only'). The listings that are genuinely live and open on the agent boards — OpenTask's 30 USDC 'Post and fund a real task on Verdikta' (open to Nov 3), AgentPact's 25 USDC Python code review, ugig's $12 CSV/JSON conversion — are the ones her code has no submit path for.

| # | where | link | Amber's label (her reports, 11:32Z) | the runner's read |
|---|---|---|---|---|
| 1 | Test hire (please ignore) | https://basedagents.ai/tasks/task_ILI16I1DYjTOabbUBRvV9 | under minimum payout | page live |
| 2 | Bounty Difficulty Estimator | https://bounty.owockibot.xyz/bounties/370 | Amber can do it | bounty page live (record dated 2026-06-11T20:10:12.000Z); the board's claim endpoint says not open for claims |
| 3 | Bounty Board RSS Feed Generator | https://bounty.owockibot.xyz/bounties/374 | Amber can do it | bounty page live (record dated 2026-06-11T20:14:03Z); the board's claim endpoint says not open for claims |
| 4 | task 0x5f596b1a81417834a4366655bd4e6194819f5404a62c919c6953a | https://taskmarket.dev/tasks/0x5f596b1a81417834a4366655bd4e6194819f5404a62c919c6953ae9bc92860bc | Amber cannot do it | task page live (TaskMarket; status by its API: open until its expiry) |
| 5 | lablab-ai/community-content — e.g. "Trulens + llamaindex + m | https://github.com/lablab-ai/community-content/issues/480 | blocked by platform rules | issue page live; dated Apr 25, 2024, Apr 26, 2024 |
| 6 | Summary of NEAR AI Agent Market (200 words) | https://market.near.ai/jobs/5a049dff-5e9a-4c38-a6e2-7956170e1d69 | under minimum payout | app shell only (job text loads by script) |
| 7 | task 0xfc26e4fa7c72604358ca3330dc786cd048faad513aa58e1832f1d | https://taskmarket.dev/tasks/0xfc26e4fa7c72604358ca3330dc786cd048faad513aa58e1832f1d91190c40e03 | under minimum payout | task page live (TaskMarket; status by its API: open until its expiry) |
| 8 | task 0xb30caf11881455c22943b06af9527ce151908601e0bef7432c06d | https://taskmarket.dev/tasks/0xb30caf11881455c22943b06af9527ce151908601e0bef7432c06d30177b9d966 | under minimum payout | task page live (TaskMarket; status by its API: open until its expiry) |
| 9 | task 0x793a98b5c8976218c5815ebd1110ce0006a97a41a4985deb3e630 | https://taskmarket.dev/tasks/0x793a98b5c8976218c5815ebd1110ce0006a97a41a4985deb3e6303f085530e2f | under minimum payout | task page live (TaskMarket; status by its API: open until its expiry) |
| 10 | task 0x1fb989a3256eadc92fe09e863ca36bed7765e5bcb2f8d2c281832 | https://taskmarket.dev/tasks/0x1fb989a3256eadc92fe09e863ca36bed7765e5bcb2f8d2c28183201e467c272d | Amber cannot do it | task page live (TaskMarket; status by its API: open until its expiry) |
| 11 | Basic(to deep based on your payment) Website Security Scan | https://ugig.net/gigs/603267e6-973a-458f-8e40-5ca77770015b | Amber cannot do it | listing live · Sep 6, 2026 · $10 USD, $100 USD |
| 12 | Summarize the latest Ethereum EIP proposals | https://clawlancer.ai/listings/87707b2e-f90e-4747-a7c7-8a6aa13ca6db | under minimum payout | listing live · $0.10  |
| 13 | Project Keystone: Create the first OpenTask community projec | https://opentask.ai/tasks/cmpydf9300013ic04zk607xft | blocked by missing submit path | listing live · Jun 3, 2026 · 0 USDC |
| 14 | Build a Bounty Board Analytics Dashboard | https://bounty.owockibot.xyz/bounties/403 | Amber can do it | bounty page live (record dated 2026-07-01T14:00:00.000Z); the board's claim endpoint says not open for claims |
| 15 | Wallet Activity Timeline Visualizer | https://bounty.owockibot.xyz/bounties/373 | Amber can do it | bounty page live (record dated 2026-06-11T20:14:03Z); the board's claim endpoint says not open for claims |
| 16 | Build an Agent Memory Architecture Demo | https://bounty.owockibot.xyz/bounties/402 | Amber can do it | bounty page live (record dated 2026-07-01T14:00:00.000Z); the board's claim endpoint says not open for claims |
| 17 | LayerZero | https://immunefi.com/bug-bounty/layerzero/ | platform home page (connector reads it) | page live |
| 18 | Meta VR Start Developer Competition 2026 | https://start-developer-competition-26.devpost.com/ | platform home page (connector reads it) | bot wall (not readable without a browser) |
| 19 | Ishaan: second-pass research and public-source checks (self  | https://agentpact.xyz/needs/3c6a7c21-417f-4fe2-91ff-4ab29d55cdfb | Amber cannot do it | listing live · 2026-10-01 |
| 20 | Vulnerability Disclosure (VDP) A safe, public channel for re | https://hackenproof.com/vulnerability-disclosure-program | needs review | page live |
| 21 | Post and fund a real task on Verdikta Bounties (Base), get i | https://opentask.ai/tasks/cmva5jxfs000y06kzcsyg7cxu | platform home page (connector reads it) | listing live · Oct 15, 2026, Nov 3, 2026 · 30 USDC |
| 22 | Enterprise AI Customer Experience Resolution System: Gemini  | https://www.topcoder.com/challenges/c074003a-b1d4-4bce-affe-2bce305da955 | platform home page (connector reads it) | gone (HTTP 404) |
| 23 | Quick CSV/JSON conversion + validation — 12h, $12 | https://ugig.net/gigs/cb657568-9a71-4379-8bab-1f1fdf71d967 | platform home page (connector reads it) | listing live · Aug 15, 2026 · $12 , $12 USD |
| 24 | Welcome OmegaHFTBlockAgent — introduce yourself | https://www.openwork.bot/jobs/9097b6a9-7c8d-4649-926c-6c2750f6b73a | blocked by missing submit path | server error (HTTP 500) |
| 25 | Metaculus FutureEval (AI bot tournament) | https://www.metaculus.com/futureeval/ | platform home page (connector reads it) | bot wall (not readable without a browser) |
| 26 | Devpost hackathons | https://devpost.com/hackathons | platform home page (connector reads it) | bot wall (not readable without a browser) |
| 27 | Python code review + security audit (line-referenced) | https://agentpact.xyz/needs/6a654920-4349-423d-a2f9-548bb13c71a5 | platform home page (connector reads it) | listing live · 2026-10-13 · 25 USDC |
| 28 | c1work | https://github.com/rodrigompy/bugb/issues/1 | platform home page (connector reads it) | issue page live; dated May 31, 2026; closed/archived words on the page |
| 29 | ugig.net | https://ugig.net | platform home page (connector reads it) | page live |
| 30 | OpenTask.ai | https://opentask.ai | platform home page (connector reads it) | page live |
| 31 | Automatic Transfer | https://github.com/ubiquity-os/permit-generation/issues/6 | blocked by platform rules | issue page live; dated Apr 4, 2024, Jun 5, 2024; closed/archived words on the page |
| 32 | Welcome Continuum Capsule Ops — introduce yourself | https://www.openwork.bot/jobs/ad2d9ed5-2ff1-4240-b83b-5178293a20cd | platform home page (connector reads it) | server error (HTTP 500) |
| 33 | Cetus Smart Contracts | https://hackenproof.com/programs/cetus-smart-contracts | platform home page (connector reads it) | page live |
| 34 | Openwork | https://www.openwork.bot | platform home page (connector reads it) | page live |
| 35 | Claw Earn (AI Agent Store) | https://aiagentstore.ai/claw-earn | platform home page (connector reads it) | page live |
| 36 | Ubiquity DevPool | https://work.ubq.fi | platform home page (connector reads it) | page live |
| 37 | CrunchDAO (incl. Numinous agent… | https://hub.crunchdao.com/competitions | platform home page (connector reads it) | page live |
| 38 | Immunefi | https://immunefi.com | platform home page (connector reads it) | page live |
| 39 | Audit contests (Cantina, Sherlock… | https://cantina.xyz | platform home page (connector reads it) | page live |
| 40 | Add `UUSD` and `UBQ` tokens to popular services | https://github.com/ubiquity/ubiquity-dollar/issues/984 | platform home page (connector reads it) | issue page live; dated Jan 10, 2025, Jan 11, 2025 |
| 41 | Clustly | https://clustly.ai | platform home page (connector reads it) | page live |
| 42 | Frantic | https://gofrantic.com | platform home page (connector reads it) | page live |
| 43 | ClawGig | https://clawgig.ai | platform home page (connector reads it) | site paused (HTTP 402 'Deployment Paused') |
| 44 | DeskCrew bounty board | https://deskcrew.io/earn | platform home page (connector reads it) | page live |
| 45 | AgentPact | https://agentpact.xyz | platform home page (connector reads it) | page live |
| 46 | Clawlancer | https://clawlancer.ai | platform home page (connector reads it) | page live |
| 47 | Riner | https://riner.io | platform home page (connector reads it) | page live |
| 48 | 0xWork | https://www.0xwork.org | platform home page (connector reads it) | page live |
| 49 | DoraHacks | https://dorahacks.io/hackathon | platform home page (connector reads it) | human-verification wall |
| 50 | NEAR AI Agent Market | https://market.near.ai | platform home page (connector reads it) | page live |
| 51 | Virtuals ACP (Agent Commerce Protocol) | https://app.virtuals.io/acp | platform home page (connector reads it) | page live |
| 52 | Topcoder | https://www.topcoder.com/challenges | platform home page (connector reads it) | gone (HTTP 404) |
| 53 | Agent Souk | https://agentsouk.dev | platform home page (connector reads it) | page live |
| 54 | Superteam Earn | https://superteam.fun/earn | platform home page (connector reads it) | page live |
| 55 | BasedAgents | https://basedagents.ai | platform home page (connector reads it) | page live |
| 56 | Bounty (trybounty.ai) | https://trybounty.ai | platform home page (connector reads it) | page live |
| 57 | BotBounty | https://www.botbounty.ai | platform home page (connector reads it) | page live |
| 58 | BountyBook | https://www.bountybook.ai | platform home page (connector reads it) | page live |
| 59 | owockibot AI Bounty Board | https://bounty.owockibot.xyz | platform home page (connector reads it) | page live |
| 60 | TaskMarket | https://taskmarket.dev | platform home page (connector reads it) | page live |
| 61 | Agent Bounties | https://agentbounties.app | platform home page (connector reads it) | page live |
| 62 | TheJobCafe | https://thejobcafe.com/bounties | platform home page (connector reads it) | gone (HTTP 404) — board offline ('No published build') |
| 63 | AgentBounty (agentbounty.org) | https://agentbounty.org | platform home page (connector reads it) | page live |
| 64 | ClawMolt | https://www.clawmolt.ai | platform home page (connector reads it) | page live |
| 65 | Opire | https://opire.dev | platform home page (connector reads it) | page live |
| 66 | Atrest.ai | https://atrest.ai | platform home page (connector reads it) | page live |
| 67 | Mercatai | https://www.mercatai.eu | platform home page (connector reads it) | page live |
| 68 | AgentHansa | https://agenthansa.com | platform home page (connector reads it) | unreachable from the runner |
| 69 | AgentMesh (agentmesh.help) | https://agentmesh.help | platform home page (connector reads it) | page live |
| 70 | GitHub / Algora | https://algora.io | platform home page (connector reads it) | page live |
| 71 | Toku | https://www.toku.agency | platform home page (connector reads it) | page live |
| 72 | MoltJobs | https://moltjobs.io | platform home page (connector reads it) | page live |
| 73 | Moltplace | https://moltplace.net | platform home page (connector reads it) | page live |
| 74 | Referral bounty #5 — bring an agent that posts on the forum | https://moltjobs.io/jobs/d0d5c312-1396-40d9-8f85-257db145c9dc | under minimum payout ($0.20) | gone (HTTP 404) |
| 75 | Referral bounty #7 — bring an agent that posts on the forum | https://moltjobs.io/jobs/ca10e5cb-1732-4e90-9e43-f5ef285a1ab5 | under minimum payout ($0.20) | gone (HTTP 404) |
| 76 | Referral bounty #8 — bring an agent that posts on the forum | https://moltjobs.io/jobs/bf7050ca-7bdd-4da0-8008-e235d3c49fe8 | under minimum payout ($0.20) | gone (HTTP 404) |
| 77 | Referral bounty #1 — bring an agent that posts on the forum | https://moltjobs.io/jobs/7d81b2eb-155c-4e59-9cea-26d058cb4b5e | under minimum payout ($0.20) | gone (HTTP 404) |
| 78 | Referral bounty #2 — bring an agent that posts on the forum | https://moltjobs.io/jobs/600adf72-59ac-4617-833c-a5d3a0270a76 | under minimum payout ($0.20) | gone (HTTP 404) |
| 79 | Referral bounty #3 — bring an agent that posts on the forum | https://moltjobs.io/jobs/5577ec7a-d5cd-4a75-ba80-8e286e45dcea | under minimum payout ($0.20) | gone (HTTP 404) |
| 80 | Referral bounty #9 — bring an agent that posts on the forum | https://moltjobs.io/jobs/bd1d5f37-5bbd-4677-9491-bad626de414b | under minimum payout ($0.20) | gone (HTTP 404) |
| 81 | Referral bounty #10 — bring an agent that posts on the forum | https://moltjobs.io/jobs/d9b2f0ae-33b0-4445-b4e5-b7f4872b9025 | under minimum payout ($0.20) | gone (HTTP 404) |
| 82 | Civil Money Penalty Reinvestment Grant | https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/CitationPenaltyAccountsReports.aspx | platform home page (connector reads it) | unreachable from the runner |
| 83 | Referral bounty #4 — bring an agent that posts on the forum | https://moltjobs.io/jobs/6dd5e944-e2f6-4f9c-867a-3675ec5104c1 | under minimum payout ($0.20) | gone (HTTP 404) |
| 84 | Referral bounty #6 — bring an agent that posts on the forum | https://moltjobs.io/jobs/574edbb8-fff9-4ca0-929a-fd3ae43d702b | under minimum payout ($0.20) | gone (HTTP 404) |
| 85 | Zindi | https://zindi.africa | platform home page (connector reads it) | page live |
| 86 | AIBTC (aibtc.news and bounty.drx4.xyz) | https://aibtc.news | platform home page (connector reads it) | page live |
| 87 | Finished 84 23 Shift APPens 2026 1 ideia, 4 amigos, 48 horas | https://taikai.network/en/shift-appens/hackathons/shift-appens-2026/ | platform home page (connector reads it) | page live |

## 4. The answer in one paragraph

Amber is looking, all day, at about 30 sources plus 39 agent boards, and finding thousands of rows. Almost all of them are government tenders in 26 countries that only a registered person can bid on, or crypto-native agent boards whose tasks are either not open to agents, not doable by her (GPU, video, live access, other accounts), paid in cents, or without a path to submit. In 28 of the 54 countries she has no website at all to look at. Her own site-discovery has stopped finding anything new. The only tasks she can both do and submit today are the five owockibot bounties (25–35 USDC each), and that board is refusing claims. Nothing she found this week is executable without one of: the owner's identity (Algora, SAM), a payment step (TaskMarket), or an integration that does not exist yet (Openwork, OpenTask, AgentPact, ugig).

## 6. Why owockibot's board refuses claims (investigated 13:2xZ)

Read from the board's own API by a runner (`scan/results/batch-23-owockibot.jsonl`, 13:21Z) and from the board's public code (github.com/owocki-bot/ai-bounty-board, main at 790841d, last change 2026-07-04):

- `GET /stats` answers `openBounties: 0` (466 bounties in all, 40 completed, 4,110 USDC paid out ever, 8 agents).
- The five records Amber's reports call "Amber can do it" (370, 373, 374, 402, 403) are not bounty records. Each answers with only `board_title`, `board_status: "open"`, `board_reward_usdc`, `board_creator` and a `board_updated_at` of June or July 2026, with `source` "owockibot", "bot" or "supabase". A real bounty carries `status`, `reward`, `creator`, `deadline`, `claimedBy`, `submissions`, `payment`.
- The claim route (`server.js`, `atomicClaim`) claims a bounty only when its `status` field equals `open`. A mirror record has no `status` field, so the claim fails and the route answers `400 "Bounty is not open for claims"`. That is exactly what Amber's connector recorded on 2026-09-27 and 09-28 (the board's issue #42; its fix, PR #43, is not merged: the code has not changed since 2026-07-04).
- So nobody can claim these five; they are stale mirrors on the board, not work. The board's genuinely open count is zero, and the last completed bounty was paid through the relay (5% fee) months ago.

Consequence for the counters: the Money Hunt's "Amber can do it 5" and the Money Trail's "Amber can prepare but not act 5" both describe records the board itself cannot open; the honest number for owockibot is 0. Amber's connector already records the refusal per record (`claimBlocker`); the label that the report prints ranks a drafted deliverable above that blocker, which is why the five stayed "doable" for 19 days.

## 7. The search for open tasks across the 54 countries (13:1xZ–13:4xZ)

Three discovery passes (Americas and Europe; Asia and Oceania; Africa and the Middle East), each with about 45 web searches, looked for paid tasks, bounties or competitions posted or updated in the last 14 days that an agent could complete and submit without a government ID. Their files are in `discovery/` (55 entries; every fact is a search snippet unless the GitHub issue body was read through the API, which the Asia pass did for its bounties). A runner is reading every link they named (`scan/results/batch-28-…` and `batch-29-…`).

**The agent boards that are live, read from their own APIs by the runner (13:3xZ):**

| board | open now | what it is | why Amber cannot take it today |
|---|---|---|---|
| Clawlancer | 47 bounties | research, writing, code — every one $0.03–$1 ("Starter Gigs (≤$1) 47") | all under the owner's $4 floor |
| Frantic | 4 | #128 $8 and #129 $16 "earn a citation on an external site" (outreach), #130 $3 "answer live Reddit threads" (posting from an account), #97 "fund your own $10 bounty" (spend) | outreach, social posting and spending are outside Amber's rules; claims also need a verified contact identity or a GitHub identity older than three months |
| Riner | 6 | "Promote WineHood token" $2, "find vulnerabilities on the Riner website" $3 (expired), "create 7–8 posts on Moltbook" | promotion of a token, live security testing, social posting |
| Superteam Earn | 14 | Twitter threads, "talk to 5 users", content for events, a trading competition, a Solana mobile app | social posting and outreach; a payout needs a human claimant (KYC) |
| ugig | 20 "hiring" gigs, 9 bounties | the gigs are service offers by other agents mislabelled as hiring (the "$12 CSV/JSON conversion" is one agent's offer with 29 applications); the bounties pay in FLAPJAX tokens | not tasks, or not money |
| BotBounty | unknown | its API answers HTTP 500 and its page shows "Live (0)" | down |
| 0xWork | unknown | its API did not answer the runner; the skill file says claiming needs a wallet that stakes | a stake is a bond (none approved) |
| AgentPact | 528 needs | 3 paid deals ever settled on the platform, 54 practice deals at $0 | no money flows; registration and offers not built |
| owockibot | 0 | see §6 | the board's own count is zero |

**What the search passes found that is real, open and paid (snippet evidence unless noted):**

- Competitions with cash prizes that take an online submission: ARC White-Box Estimation Challenge 2026 on AIcrowd (pool over $150,000, submissions close 2026-10-17 23:59Z — one day; interpretability research with compute through the organiser's tooling; LLM use allowed with disclosure); Comfy Dev Platform Challenge ($10,000 grand prize, closes 2026-10-19; an open-source repo on their platform plus a demo video); Vesuvius Challenge (a guaranteed $20,000 a month; scroll-ink detection research); DEV Community Hacktoberfest weekly challenges ($250 and $100–$200 per category; a published DEV post; week 2 runs to 2026-10-18); OpenCV AI Competition ($12,000; via Devpost); CHIMERA-Agent round 2 (€1,500; medical-imaging containers); lablab.ai AI Genesis (prizes "TBA"; video and slides). Every one needs an account in a person's or company's name and, at payout, tax or identity forms; the research ones are days of specialist work; two need a video.
- GitHub bounties with the issue body read in full (Asia pass): Tenstorrent tt-metal #58986 ($1,000, created 2026-10-02), #53787 ($5,000, a proposed fix in the issue), #56908 ($3,000), #51655 ($1,000) — all need their Wormhole/Blackhole hardware or simulator for the final test; uvsmtid/protoprimer #143 ($75 for a merged PR, created 2026-10-15, pure Python and POSIX shell with written acceptance criteria; payment rail unstated); warpSpeed OPEN #4 ($750) and #3 ($440) (sign-up at their site, a maintainer-confirmed claim, paid at 100% completion after merge); copperheadhq/copperhead #66 ($50; needs a KiCad environment and an LLM key); aLexzzz430/Cognitive-OS #5 ($3,000 "research packet", an individual maintainer who "handles payment privately" — funder unverified); Verdikta on Poidh (~$30 a slot, but you must first fund a $10 task — spending).
- Everything else the passes found was closed, in person, students-only, nationals-only, token-paid, or an aggregator.

**The runner's live read of the 87 discovered links (13:4xZ, `scan/results/batch-28-…`, `batch-29-…`):** 75 answered, 9 are bot walls (Unstop), 3 are gone or unreachable. Confirmed open with the reward on the page: protoprimer #143 ("Bounty $75, paid for a merged PR which meets the acceptance criteria", dated 2026-10-15/16), Tenstorrent #58986 ($1,000, "no fixed expiration"), #59732 ($3,000, assigned, "reopened if no progress within two weeks"), #56908 ($3,000 approved), #53787 ($5,000), #51655 ($1,000); warpSpeed #4 ($750) and #3 ($440) ("sign up at warpspeedopen.org/bounties"); Cognitive-OS #5 ($3,000, "payment details will be handled privately after acceptance"); copperhead #66 ($50, "first mergeable PR wins; paid on merge"); Verdikta on Poidh (~$30 × 4, "post and fund a real task" first); DEV Hacktoberfest week 2 live ($250, $200, $100; "build a brand-new project with open-source AI at its core, and write about it on DEV"); Vesuvius ($2,140,000 open pool, research); CHIMERA (November deadline "announced soon"); HackerRank Orchestrate ($1,200, with "a 30-minute AI judge interview after submission"); Hummingbot ("sign the Bounty Escrow Agreement"). Confirmed closed or not money: lablab AI Genesis ("Ended · Judging in progress"), the Comfy challenge post (404; the newsletter's two-week window opened 2026-09-22), the Subspace contests (AI3 tokens; the translation one asks entrants to avoid LLMs).

**What Amber's own gates say about the two that fit her work:** uvsmtid/protoprimer #143 and Tenstorrent #53787 are GitHub bounties, the lane the owner approved on 2026-09-27 for automatic claims "provided every existing safety gate passes, the repository allows AI work, payment history is verified". Neither repository has a bounty payout on record (no platform bot, no award history), so the gate "payment history verified" fails and the Money Trail would class both as *blocked by no payout proof*; Tenstorrent also needs hardware for the acceptance test. Nothing else found today passes the owner's floor, the no-spend, no-outreach, no-social-posting rules and the no-KYC rule at once.

So the verified answer for today: the agent-board economy that Amber watches holds no task she can take this afternoon; the paid work that exists in the wider search is competitions and open-source bounties that want a named person or company, hardware, or specialist research. The one small, fresh, text-and-code bounty with written acceptance criteria (protoprimer #143, $75) is the only candidate worth the owner's word — it would be work on an unproven payer, which the owner's money-first rule holds.

## 5. What would change the picture (owner's decisions, not mine)

1. Point her at real work boards in the 28 uncovered countries — none exist in her list today; the Wikidata country feed finds employment sites, not task boards, and is retired for five of its feeds.
2. Decide whether government tenders should stay in the funnel at all: they are 83% of what she "finds" and 0% of what she can do.
3. Algora: the answer to the 2026-09-27 question, and the owner's Stripe identity, would unlock the 21 open GitHub bounties ($426) that are not already taken.
4. owockibot: the board's "not open for claims" is on its side (issue #42); nothing to approve until it changes.
5. TaskMarket: the 25 USDC pitch waits on the approval words, the 0.001 USDC fee, ~$1 in the wallet and the payment step.
