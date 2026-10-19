# Amber Global Recruiting: morning report

Written overnight, Sunday 18 Oct 2026, about 9:45 PM Pacific (04:45 UTC Monday 19 Oct). The code is on branch `claude/amber-global-recruiting` in the private `amberai` repository (last commit 14c0b501, no pull request open). The written record is this folder.

## The short version

- **Built and tested, not live.** The whole chain works on made-up data: find employers whose job listings have stayed open 45 days or more, find staffing businesses and the hiring address each one publishes, draft one short note per business, check the wording and the legal rules, you approve and send by hand, you record replies and money. Nothing has been read from the internet, sent, posted or promised to anyone.
- **Cost: $0.00 new spend.** No purchase, no subscription, no sign-up, no paid service, no key.
- **Clients: 0. Candidates: 0. Revenue: $0.00.** Nothing in the code, the page or the documents says otherwise.
- **Verdict: conditional go** as a small, slow, owner-reviewed side business; **no-go** as a hands-off money machine. On the first product alone the central estimate is about $150 a month after six months and about $250 after a year, if you send 50 messages a week by hand. Placement fees are where the large numbers are, and they need a licence in many places and a lawyer first.
- **The next step is yours, not mine.** Nothing can run until you decide the items below.

## Needs you, in the order it blocks

1. **Merge and deploy the code.** I did not open a pull request or merge: merges and deploys need your word, and GitHub Actions cannot start jobs (billing), so no CI has run. Say "open the PR" and then "merge", or "not yet". After a merge, nothing changes except that a page, its API, an HQ tile and a dormant job exist.
2. **Switch the lane on** by setting `AMBER_RECRUITING_LANE=1` on the worker. Free. Then I run the first live check with you.
3. **Your name, business name, postal address and reply address** on the page's Settings. US law requires a postal address on commercial email. Your own address costs nothing but appears on every message; a P.O. box costs money. Use a mailbox that is not the one other Amber products send from. Also: keep the footer line saying an AI assistant is used? (I recommend yes.)
4. **Read the process checklist on the page and press "Approve the process".** Until you do, every message is held. You can withdraw it any time.
5. **A price.** I suggest a free sample, a four-list pilot for $99, then $149 a month, stoppable any month. These are estimates, not a market price.
6. **An hour with a California lawyer before volume.** Recommended, not spent. The three questions are in `07-owner-approvals.md`.

Everything else (payment route, business registration, YouTube channel, which sources stay on) is in [07-owner-approvals.md](07-owner-approvals.md).

## 1. What was completed

| You asked for | Done | Where |
|---|---|---|
| 1. A foundation reusing Amber's scouts, workers, cloud and Business Center, with no needless subscriptions | The recruiting lane runs on the existing cloud worker and job queue, stores its data in the existing database (no schema change), reuses the robots-check, opt-out list and reply sorter, and lives behind the existing owner-only page pattern. One new job kind that does nothing until switched on | [01](01-existing-infrastructure.md) |
| 2. Worldwide market research, which services are realistic, how to get paid | Three research reports (market and fees; legal rules in 19 regions; 50 lead sources) and a viability memo. First product chosen: a weekly list of employers with long-open roles, sold to small staffing agencies | [research/](research/), [09](09-viability.md), [05](05-revenue-plan.md) |
| 3. An automated client-acquisition system | Reads 12 kinds of public job source, the monthly Hacker News hiring thread and map data; finds employers and staffing businesses; finds the hiring address a company prints on its own site; scores; drafts a note; checks it; queues up to 12 for you. It cannot send | [03](03-lead-sources.md), [04](04-workflow.md) |
| 4. Everything sounds naturally human, no robotic wording, no templates, no exaggeration | A wording check with explainable rules (stock phrases, hype, unearned closeness, unprovable claims, machine tells), a batch check that compares messages with each other, and a composer with many hand-written variants of every sentence. All marketing copy passes with zero errors and zero warnings | [02](02-voice-and-compliance.md) |
| 5. A recruiting workflow plan | Four stages (discover, sell the list, employers' applicants, candidates), who decides what, permitted candidate sources, retention and deletion, evidence sheets that quote and never score | [04](04-workflow.md) |
| 6. A revenue plan | Product ladder, prices, how you are paid at $0, a tested scenario model, referral arrangements, tripwires, first-dollar path | [05](05-revenue-plan.md) |
| 7. Marketing materials | Four example first messages from the real composer, a follow-up, eight replies to likely questions, a one-page offer, seven public posts, six video scripts, plus employer and candidate notes that are written but **held** | [06-marketing/](06-marketing/README.md) |
| 8. Integration into the Business Center | An owner-only page on HQ: funnel, businesses, messages (approve, edit, copy, "I sent it"), replies, conversations, expenses and confirmed revenue, source health, activity. A tile on the HQ home. The separate Reelo Business Center app is not connected; that is a small follow-up that needs your word | page `/dashboard/recruiting` after deploy |

Also built: a probe for the first live check (`scripts/recruiting-live-probe.ts`), an offline rehearsal of the whole lane, and a revenue model whose tables you can change.

## 2. What was tested

- **198 automated tests in 17 files, all passing.** They cover the wording check, the legal gate, every job-source reader against the vendors' documented sample responses, discovery and scoring, the composer, the owner's decision log, the page model, the API, the lane, the candidate rules, the revenue model and the marketing copy.
- **Type check and lint: clean** on everything new.
- **Offline rehearsal of the whole lane** on made-up servers: 11 of 11 documented response shapes read; 4 feeds, 1 Hacker News thread, 6 boards, 20 roles, 4 businesses found, 1 published address found; 1 message composed, ready, 0 wording errors, 0 look-alike pairs; revenue $0.00.
- **The page in a phone-size browser**, driven end to end on made-up data: settings, approving the process, approving a message, "I sent it", a reply, an opt-out, the sample list, money, adding a board. No console errors.
- **Wording across a batch:** in a 40-message test the median pair of messages shares under 12% of its wording and none reaches 40%.
- **Independent review:** REVIEWSUMMARY
- **Not tested, and not claimed:** any live read of any job source; the deployed worker job; the page against the production database; real mail; GitHub Actions (it cannot run). The build container's network refuses every job site, and the research agents' page-fetch tool could not open any page.

## 3. What is working

On test data, end to end: discovery from all supported source shapes; classification of employer versus staffing business; the 45-day rule with the date basis stated on every row; contact finding from a company's own pages with a robots check and a role-address rule; message composition; the wording and legal gate (opt-outs, replies, regions, states, footer, one message and one follow-up only); the owner's approval tied to the exact text; replies sorted; stages; the evidence-only money ledger; the export of the sample list (spreadsheet and Markdown, with formula and table injection defused).

"Working" here means working on fixtures. Whether it works on the real internet is the first thing to find out, and the probe is built for exactly that.

## 4. What is blocked

1. **No live read was possible.** Fourteen response formats are partly or wholly unconfirmed (listed in [03](03-lead-sources.md) and [08](08-runbook.md)). The readers skip what they cannot read and report a changed format instead of showing zero, but only a live read settles it.
2. **Merge and deploy** wait for your word; **CI cannot run** (account billing). I did not bypass either.
3. **Your settings and approval** (items 3 and 4 above).
4. **The research rests on search-result excerpts**, not full pages. Every figure is labelled fact (with source), estimate (with reasoning) or unverified. Legal points are a map for a lawyer, not advice.
5. **Job-source terms are unclear** for commercial reuse. The build reads at low volume, names itself, credits sources and has a switch per source; whether aggregator rows stay in a sold list is your call.
6. **Not researched:** Los Angeles business registration and fees, taxes, GDPR in depth, platform terms beyond the main ones.
7. **Held on purpose:** employer-side work and candidate intake (need a lawyer, an agreement, and a real role), placement and split fees (licensing), any scoring or ranking of people (never).

## 5. What it cost

**$0.00 of new spend.** No purchase, subscription, sign-up, domain, mailbox, key or lawyer. The recruiting code calls no paid service and no model while it runs. Research used the session's existing web-search allowance, which ran out partway (the reports say what that left uncovered). The model time for the night is part of the existing session and is not itemised here. Ongoing: nothing, until you choose to spend (a P.O. box, a registration fee, a lawyer's hour, a card fee on a payment).

## 6. What remains before Amber can win her first paying recruiting client

| # | Step | Who | Time |
|---|---|---|---|
| 1 | Decide to merge and deploy | You | A word |
| 2 | Switch the lane on; run the live probe; fix any source that does not match | You, then me | 1 to 2 days |
| 3 | Settings and "Approve the process" | You | 20 minutes |
| 4 | Read, approve and send the first 5 to 10 notes a day from your own mail; record each | You | About 15 minutes a day |
| 5 | A reply says yes: send the sample, talk, agree the pilot and price in writing. **Faster:** if you know anyone in a small staffing agency, offer them the first pilot free for honest feedback; one warm introduction beats hundreds of cold notes | You (my drafts) | Weeks 1 to 6 |
| 6 | Invoice from your own account, deliver four weekly lists, record the payment with proof | You | Weeks 3 to 10 |

**Earliest realistic first dollar: about 10 weeks after your first message at 50 messages a week (about 16 at 25 a week), central estimate. The range is 3 weeks to never.** The market memo puts the chance of at least one paid pilot within 90 days of steady sending at 40% to 50%. The tripwire: after about 300 targeted contacts over six weeks, fewer than three positive conversations means stop or change the offer.

## What I did not do

Open a pull request, merge, deploy, switch the lane on, send or post anything, contact anyone, create any account, spend any money, or claim any client, candidate or dollar. I did not change anything on the Amazon KDP side.

## Amazon KDP

Untouched since you stopped it. Progress is saved in `KDP-LOGIN-HANDOFF-2026-10-19.md`. Draft PR 929 (the idle timeout and claim persistence) is still unmerged. The coloring-book schedule is still off. Say when you want to resume.

## Where everything is

- This folder: [README](README.md) is the index. Start with [07-owner-approvals.md](07-owner-approvals.md) and [09-viability.md](09-viability.md).
- Code: private repo `amberai`, branch `claude/amber-global-recruiting`, `src/lib/recruiting/`, the page `src/app/dashboard/recruiting/page.tsx`, scripts `scripts/recruiting-*.ts`.
- After a deploy: the page is `/dashboard/recruiting` on HQ, and a tile "Amber Global Recruiting" is on the HQ home.
- What the page looks like on a phone, first load and a demo: [screenshots/](screenshots/README.md).
