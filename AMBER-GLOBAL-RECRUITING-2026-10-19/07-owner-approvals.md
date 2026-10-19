# What needs the owner

Written 18 Oct 2026 (Pacific). Nothing below was done. Each item says what, why, what I would do, and what it costs. They are in the order they block things.

## 1. Before anything runs

| # | Decision | Why it needs you | My recommendation | Cost |
|---|---|---|---|---|
| A1 | **Merge and deploy the code.** Private repo `amberai`, branch `claude/amber-global-recruiting`. No pull request is open. | Merges and deploys need your explicit word. GitHub Actions cannot start jobs (account billing), so no CI has run; I ran 286 tests (and 37 in the shared web-hazard ratchet), the type check and the linter locally. I did not bypass the block. | Ask me to open the pull request and read its summary; then say "merge". On merge the page `/dashboard/recruiting`, its API, an HQ tile and one new job kind appear. The job does nothing until A2. | $0 |
| A2 | **Switch the lane on.** Set `AMBER_RECRUITING_LANE=1` on the worker. | It makes the worker read public pages for the first time. | Do it right after A1, then I check the sources panel with you (08-runbook). | $0 |
| A3 | **Which sources stay on**, and one terms check. | Job-feed terms are unclear for commercial reuse (03-lead-sources). Remotive says that showing its jobs to collect signups or emails is a breach; most vendors say nothing. | Keep company boards, Hacker News and maps on. Decide whether the four aggregators (Remote OK, Remotive, Arbeitnow, Jobicy) feed a sold list; the cautious choice is off for the sold list. Read Hacker News's terms once. | $0 |

## 2. Before the first message is sent

| # | Decision | Why | Recommendation | Cost |
|---|---|---|---|---|
| B1 | **Your name, the business name, a postal address and a reply address** (Settings on the page) | US law requires a real sender and a postal address on commercial email; the page refuses to call a message ready without them. No placeholder is used and none was invented. | Name as you want it shown. For the postal address: your own address costs nothing but appears on every cold email; a post office box or private mailbox costs money and needs your approval. Reply address: your own mailbox, **not** the domain other Amber products send mail from (a complaint about cold mail must not hurt their delivery). | $0, or a box fee if chosen |
| B2 | **The AI line** in the footer: "I use an AI assistant for research and first drafts, and I read every message before it goes out." Include or omit. | The legal memo's "never cross" list is about pretending a person did what a machine did. The line is true. | Include it. | $0 |
| B3 | **Approve the messaging and compliance process** (button on the page) | Your rule: nothing goes out until it is approved. The page shows exactly what you are approving, including the open lawyer item. | Read the checklist, then approve. You can withdraw it at any time and every message goes back to waiting. | $0 |
| B4 | **Who sends:** you, by hand, from your own mail, five to ten a day | Amber has no sending code and will not get any without your decision. | Keep it that way for the first 300 contacts. | Your time |

## 3. Before the first dollar

| # | Decision | Why | Recommendation | Cost |
|---|---|---|---|---|
| C1 | **Price and terms** | No source exists for list prices; mine are estimates from freelance rates. | Pilot of four weekly lists for $99, then $149 a month, stop at the end of any month, put in writing before billing (the one-page offer). Change the figures if you disagree. | $0 |
| C2 | **How you are paid** | Amber takes no payments. | Bank transfer or Zelle first; a Stripe Payment Link on an existing account if you prefer (it may need the account's business description changed: an external account action). | $0, plus about 2.9% and 30 cents per card payment |
| C3 | **Business registration** before the first sale: Los Angeles business tax registration, a fictitious-name filing, or an LLC | The legal memo says Los Angeles generally requires a registration, including for a home business. Fees were not researched. | Ask a CPA or the city before the first invoice. I did not look up or pay any fee. | Not verified |
| C4 | **Taxes** | Not researched. | A CPA, once there is revenue. | Not verified |
| C5 | **A design-partner pilot**, if you know anyone who runs or works in a small staffing agency | Credibility is the main thing a new sender lacks, and the market memo names a design partner as the step that most improves the odds. | Offer them the first pilot free in exchange for honest feedback. Use their words as a testimonial only with their written OK. A warm introduction is worth more than 300 cold messages. | $0 |

## 4. A lawyer (recommended before volume, not spent)

One hour with a California attorney who knows employment-agency or marketing law. The three questions that matter, in order:

1. **Is a fixed-fee research list sold to staffing agencies, with no named people and no fee tied to a hire, outside California's employment-agency statute (Civil Code 1812.500 and following; employer-only exemption at 1812.502(a)) and outside its data-broker rules?** And does it stay outside licensing in the states where the agencies and employers are?
2. **Do the footer, the process on the page and the way addresses are found meet CAN-SPAM and California Business and Professions Code 17529.5?** In particular the postal address, the opt-out, and the use of a company's published role address.
3. **If Amber later reads employers' applicants or takes candidates' details:** what the agreement, the applicant notice and the retention period should say; whether a sheet that only quotes the applicant and scores nobody is outside the automated-hiring-tool rules (New York City, Illinois, Colorado, California, the EU); and whether a licensed partner can share a placement fee with Amber.

## 5. Public presence (nothing created)

| # | Decision | Recommendation |
|---|---|---|
| D1 | A **YouTube channel** for Amber Global Recruiting, created by you. Who speaks the scripts, and whether a synthetic voice or picture is used (it must be disclosed). | A new channel, your own voice or a voiceover with screen recordings. The existing AmberOne channel is for students. |
| D2 | Posts on **LinkedIn or X**, by hand, from your own account. | A few of the seven posts in `06-marketing/05`, after step B3. No automation of either network. |
| D3 | A **public page** for the offer. | Not needed to start: the scripts and posts end on "write to the address in the description". A plain page can follow. |

## 6. Later (not blocking)

- Clear a state (New York, New Jersey, Massachusetts, Illinois) or a region: only after advice. The page defaults to the United States and refuses regions that need consent.
- Add the UK as a second market (Companies House data is clearly licensed; PECR allows company addresses).
- Employer-side applicant summaries (04, stage 3) and candidate intake (stage 4): only after a lawyer, a real role, and your decision.
- A customer-referral offer between agencies (one month free for each agency referred that subscribes).
- Whether the Business Center bridge should show these numbers; today they are on the HQ page only.

## 7. What I did not do, and will not without your word

Open a pull request; merge; deploy; switch the lane on; send, post or upload anything; contact anyone; create an account anywhere; spend any money; claim a client, candidate or dollar. The branch is pushed to the private repo so nothing is lost, and this folder is the whole of it.
