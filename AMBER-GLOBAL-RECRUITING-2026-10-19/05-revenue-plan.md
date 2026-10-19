# Revenue plan

Written 18 Oct 2026 (Pacific). Every price and rate here is an **estimate**; where a figure is a published fact, its source is named. Amber has **no clients, no candidates and no revenue** today, and nothing in this plan changes that: it says what could be sold, to whom, for how much, how the money would arrive, and how to tell early whether it is working.

## What gets sold first, and why

**A weekly list of employers whose public job listings have stayed open for 45 days or more, for small staffing agencies, sold for a flat fee agreed in writing.** Not a placement, not candidates, no fee that depends on anyone being hired.

- It is what small agencies say they need: in Top Echelon's 2026 survey (a recruiting vendor; self-selected, sample size not shown) 60.7% put new clients first.
- It needs nothing Amber does not already have: public pages, a database, a worker, the owner's time.
- It carries the least legal exposure of the paths researched: company facts only, no named people, no candidate data, and no fee tied to a hire. The market memo ranked "business-development research for agencies" second and "sourcing micro-projects" first; sourcing was set aside because it needs a candidate source Amber cannot lawfully read at $0 (a LinkedIn Recruiter seat is quoted at $900 to $1,080 a month; scraping is against its terms).
- It is cheap to deliver: the list is built by the lane; the owner checks a few links and sends it.

## The product ladder

| Rung | What | Price (estimate) | State | Needs before it is sold |
|---|---|---|---|---|
| **A. Research list** | A weekly spreadsheet for the states and kinds of roles an agency chooses: company, role, link, date, published hiring address | **Free sample. Pilot: four weekly lists for $99. Then $149 a month (range $99 to $199).** Stop at the end of any month. | **Built** (the lane, the export, the messages). Not yet run live. | Owner's settings and approval of the process; one live read; a price chosen; a way to be paid |
| **B. Sourcing support** | A hand-checked longlist of people for an agency's own search | $150 to $900 per search (market memo estimate; freelance anchor $25 to $60 an hour) | **Not built.** No lawful free candidate source | A candidate source; the candidate rules switched on; lawyer |
| **C. Applicant summaries for a small employer** | The sheet in 04-workflow: what each of the employer's applicants wrote about each of the employer's requirements | **$150 to $300 per role** (reading about forty applications is roughly $175 to $420 at freelance rates) | **Rules built, nothing else** | Lawyer (agreement, notice, automated-tool rules); employer wording and gate; the owner's decision |
| **D. Placement or split fee** | A fee that depends on a hire, or a share of one | 15% to 25% of first-year salary is the market range; 50/50 splits are usual; one placement on a $90,000 job is about $18,000 | **Not offered in the first 90 days. The page refuses to switch it on.** | Lawyer; licensing in the relevant places (see below); references; candidates |

**Why D is off even though it is where the money is.** The legal memo's reading is that a fee that depends on a hire is placement, and that placement needs a licence or registration in New York, New Jersey, Massachusetts, Illinois, Ontario, Quebec, Italy, Spain and Singapore. California is the exception: its agency law does not apply to a person who charges fees only to employers (Civil Code 1812.502(a), read in a 2018 copy of the statute; the current text is not confirmed). So the only route to large revenue the research found is contingency placement for California employers, employer-paid only, after a lawyer has confirmed that and after Amber has candidates, skill and references it does not have today.

## How Amber gets paid, at $0

Amber takes no payments itself. The owner invoices and is paid in the owner's own accounts, then records it on the page.

| Route | Cost to set up | Cost per payment | Notes |
|---|---|---|---|
| Bank transfer, ACH or Zelle to the owner's account | $0 | $0 (bank terms) | Simplest for a $99 to $149 charge between small businesses; proof is the deposit line |
| A Stripe Payment Link on an existing Stripe account | $0, no monthly fee | About 2.9% plus 30 cents (published standard rate; check the account's own) | Other Amber products already use Stripe. Adding recruiting services may need the account's business description updated: an external account action for the owner |
| A PayPal or similar invoice | $0 | A percentage | Same remarks |

Whatever route is used, the page counts the money only when the owner records a bank deposit, a card payment or a paid invoice, with a reference of at least four characters, and ticks that they have seen it in the account. A signed agreement is shown as "contracted", never as revenue. Processing fees are recorded as expenses.

## What it costs

| Item | Cost | Note |
|---|---|---|
| Building it | **$0 new spend** | Existing worker, database and repositories. The recruiting code calls no paid service; it uses no model at run time (the composer and the checks are plain code) |
| Running it | **$0 new spend** | One scheduled job every 30 minutes on the existing worker, off until switched on; one database row for what the worker reads and one small row for each action the owner takes |
| Sending | $0 | The owner's own mail, by hand, a few messages a day |
| Postal address on every message (US law requires one) | $0 with the owner's own address; a post office box or private mailbox costs money | **The owner's choice**; a home address on every cold email is a privacy trade-off |
| Business registration | **Not verified, not paid** | The legal memo says Los Angeles generally requires a business tax registration and a fictitious-name filing; amounts were not researched |
| Taxes | Not researched | Services are generally not subject to California sales tax (unverified); a CPA should confirm. Income is taxable as the owner's |
| A one-hour lawyer consult | Would cost money | **Recommended before volume. Not spent.** Questions are in 07 |
| Payment fees | A percentage of each payment | Recorded as expenses |
| The owner's time | About 15 minutes a day to send 5 to 10 messages, plus replies and deliveries; about 10 minutes a week per paying agency to check and send a list | Sending 25 to 50 first messages a week by hand is roughly 1 to 2.5 hours a week |

The budget on the page defaults to **$0**; any expense entered raises a visible over-budget flag.

## What it could earn

The model is in `src/lib/recruiting/revenue-model.ts` and the tables below are printed by `npx tsx scripts/recruiting-revenue-model.ts`. It is deliberately plain, and the owner can change every input.

**Inputs (all estimates).** Cold-message benchmarks from vendors, which are probably optimistic for a new sender using a free mailbox: replies 2% to 5% of first messages (average 3.43% on a large sending platform in 2026; 3% to 6% for recruiting and HR on one vendor's page), 40% to 60% of replies positive, 10% to 25% of conversations becoming a paid pilot. Pilot $99. A share of pilots continue: 20% (cautious), 35% (central), 50% (good), at $99, $149 and $199 a month. Monthly loss of subscribers: 10%, 8%, 5%. A payment arrives about three weeks after the message that led to it.

| First messages a week | Case | Messages per paid pilot | Weeks of sending to the first pilot | Subscribers at 6 months | Monthly income at 6 months | Monthly income at 12 months | Total taken in over 12 months |
|---|---|---|---|---|---|---|---|
| 25 | cautious | 1250 | 50.0 (plus about 3) | 0.1 | $7 | $11 | $176 |
| 25 | central | 327 | 13.1 (plus about 3) | 0.5 | $75 | $128 | $1,220 |
| 25 | good | 133 | 5.3 (plus about 3) | 1.9 | $378 | $698 | $5,304 |
| 50 | cautious | 1250 | 25.0 (plus about 3) | 0.1 | $14 | $23 | $351 |
| 50 | central | 327 | 6.5 (plus about 3) | 1.0 | $150 | $256 | $2,439 |
| 50 | good | 133 | 2.7 (plus about 3) | 3.8 | $756 | $1,396 | $10,609 |

**Reading it honestly.**

- On the list product alone, the central case at 50 messages a week is about $150 a month after six months and about $256 after twelve. That is a side income, not a living.
- To reach $3,000 a month from lists alone takes 31 subscribers at $99, 21 at $149 or 16 at $199. Even the good case does not get there in a year.
- The market memo's own judgment (not data) was: about 40% to 50% chance of at least one paid pilot within 90 days of steady outreach (about 50 messages a week), 60% to 75% within six months, and 10% to 20% for $3,000 a month within a year, which counts more than the list product. Its central time to a first paid pilot was about 10 weeks. This model's central is about 7 weeks of sending plus 3 of lag, which is the same order.
- The result is most sensitive to the reply rate and to the share of conversations that become a pilot. If the first 100 messages bring no reply at all, the cautious case is the working assumption.
- No source was found for list prices, for conversion from reply to paid pilot in staffing, or for how long a first sale takes. Those three are the biggest unknowns, and the first 300 contacts will measure them.

**Where larger revenue could come from, later:** applicant summaries for employers (C) at $150 to $300 a role, and, only after a lawyer, a placement fee (D). Neither is counted in the table.

## Referral arrangements

The owner asked for referral arrangements. The research found these, and the plan for each:

| Arrangement | Fit at $0 | Plan |
|---|---|---|
| **Customer referral between agencies**: an agency that refers another agency which becomes a subscriber gets a month free | Good: small agency owners know each other; no fee dependent on a hire; no legal question beyond ordinary promotion | Offer it after the first paying customer, in writing, in one sentence in the one-page offer |
| **Split-fee participation** (a share, usually 50/50, of an agency's fee when Amber's introduction leads to a placement) | Poor now: odds are low (most small recruiters make 1 to 5 placements a year), cash comes months later with a guarantee window, and it is placement | Not in the first 90 days. Revisit with a lawyer and a trusting agency |
| **Marketplaces** (Paraform is closed and by approval, recruiters keep "the majority"; BountyJobs was acquired in 2024) | Requires sign-ups: external accounts | Not pursued. Needs the owner's approval and a track record first |
| **Employee referral bounties** ($1,000 to $5,000, paid by an employer to its own staff) | None: they belong to employees, not outsiders | Not applicable |
| **Paid membership split networks** (NPAworldwide and similar) | None: membership fees break the $0 rule | Not pursued |
| **A licensed partner agency** that handles any placement while Amber supplies research or introductions | Possible later; the lawyer must confirm that fee-sharing with an unlicensed party is lawful in the relevant states | Stage three |

## Subscriptions

The weekly list is a subscription from the start: a four-list pilot, then a monthly plan that can be stopped at the end of any month with no reason asked. The pilot price is deliberately small so that a one-person agency can say yes without a meeting. Nothing is billed until the terms have been agreed in writing; the one-page offer in `06-marketing/02` is the written terms. There is no minimum term, no auto-renewal trap, and no claim about what a call will lead to.

A promise that is safe to make, because Amber controls it: **"If a row in your list turns out to be wrong (the role was not listed on the day I sent it), I will replace it."** The page can support this: every row carries the link and the date it rests on.

## Tripwires: when to stop or change

From the market memo, kept as written:

- After about 300 targeted contacts over about six weeks, fewer than three positive conversations: stop, or change the offer.
- Under five replies from about 300 contacts: rewrite the offer or stop.
- None of the first three pilots continues for a second month: stop, or change the product.

And three from the build: a vendor asks Amber to stop reading its listings (switch that source off at once, tell the vendor so); a lawyer says a part of this is not allowed (that part stops); the owner does not want to send messages (nothing else in this plan works without it).

## The first-dollar path, step by step

| Step | Who | Earliest |
|---|---|---|
| 0. Optional warm path: offer the first pilot free to someone you know in a small agency, for honest feedback | Owner | Any time; worth more than 300 cold messages for credibility |
| 1. Review and merge the code; deploy | Owner (their word) | When the owner decides |
| 2. Enter name, business name, postal address and reply address; decide the AI line | Owner | 10 minutes |
| 3. Read the process checklist and approve it | Owner | 10 minutes |
| 4. Switch the lane on (`AMBER_RECRUITING_LANE=1` on the worker) | Owner or whoever runs the worker | Same day |
| 5. First live read; check the sources panel; fix any source that changed | Next session with the owner | 1 to 2 days |
| 6. Read, approve and send the first 5 to 10 messages | Owner | Day 2 to 3 |
| 7. A reply says yes; send a sample; talk | Owner | Week 1 to 3 |
| 8. Agree the pilot in writing; invoice $99 from the owner's own account | Owner | Week 2 to 6 |
| 9. Deliver four weekly lists; record the payment with proof | Owner | Week 3 to 10 |
| 10. First recorded revenue | | Central: about 10 weeks after step 6 at 50 messages a week (about 16 at 25 a week): roughly 7 weeks of sending plus 3 for the reply, sample and decision. Range: 3 weeks to never |

## What the owner needs to approve before any revenue

Price and payment route; the postal address to print on every message; the AI-assistant line (include or omit); whether aggregator rows stay in a paid list; whether to register the business before the first sale; and whether to spend an hour with a lawyer. All are in `07-owner-approvals.md`.
