# Is Amber Global Recruiting commercially viable? The honest answer

Written the night of 18 Oct 2026 (Pacific). This is the memo the owner asked for before development: viability, then legal and technical barriers. It rests on three research reports (market and fees, legal and compliance, free lead sources) and on what was built and tested.

**How much to trust the research.** The research agents could not open any web page (the page-fetch tool failed on every host) and their search allowance ran out part-way. Every fact in the three reports is what a search-result excerpt said a page says; none was read in full. Figures are labelled FACT (with a source), ESTIMATE (with the reasoning) or unverified. Treat the legal points as a map of what to ask a lawyer, not as advice.

## The verdict

**Conditional go, as a small, slow, owner-reviewed side business. No-go as a hands-off money machine.**

- It is worth running as a time-boxed pilot, because the first product costs nothing, carries low legal risk, and fits a stated need of small agencies.
- It will not make meaningful money on that first product alone. At the central estimate it earns about $150 a month after six months and about $250 a month after a year, if the owner sends 50 first messages a week. Meaningful money is in placement fees, and placement is where the legal, licensing and trust problems are.
- Under the owner's own rule (no outreach until the process is approved) it earns nothing until the owner approves the process and sends the first messages. Every path to a first client needs at least one outside contact.

## What the evidence says

**The market is real and has a long tail of small firms.** US staffing is about $179B a year, and permanent placement and search about $11B of it (about 6%), spread over roughly 27,000 staffing and recruiting companies (SIA, September 2026; ASA, undated page). The median contingency fee is 20% of first-year salary (SIA survey of 300+ firms, 2021 data), so one placement on a $90,000 job is about $18,000. Permanent placement fell in 2025 (Robert Half permanent revenue down 9.8%) and is recovering slowly in 2026.

**Small agencies say their problem is clients, not candidates.** In a trade vendor's 2026 survey (self-selected, vendor-run, so weak evidence), 60.7% put new clients first, 48.2% reported revenue under $200,000, and the largest group made one to five placements. That is why the first product is a list of employers whose roles have stayed open: it helps an agency decide whom to call. It needs no candidate pool, no candidate data and no placement.

**The money is small for that product.** Prices are an ESTIMATE: no source for lead-list prices was found. The comparison is freelance research at $25 to $60 an hour (US) and $8 to $25 an hour (offshore). A weekly list is one to three hours of work, so $100 to $200 for a pilot and $99 to $199 a month for a regular list. The funnel is also an ESTIMATE built from cold-email benchmarks that are mostly from vendors: 2% to 5% of first messages get a reply, 40% to 60% of those are positive, 10% to 25% of conversations become a paid pilot.

| First messages a week | Case | Weeks of sending to the first paid pilot | Monthly income at 6 months | Monthly income at 12 months | Total taken in over 12 months |
|---|---|---|---|---|---|
| 25 | cautious | about 50 | $7 | $11 | $176 |
| 25 | central | about 13 | $75 | $128 | $1,220 |
| 25 | good | about 5 | $378 | $698 | $5,304 |
| 50 | cautious | about 25 | $14 | $23 | $351 |
| 50 | central | about 7 | $150 | $256 | $2,439 |
| 50 | good | about 3 | $756 | $1,396 | $10,609 |

How to read it: add about three weeks between a message and a payment (reply, sample, decision). The model gives a first pilot at $99 for four weekly lists, then a subscription at $99, $149 or $199 a month in the cautious, central and good cases, with 10%, 8% and 5% of subscribers leaving each month. The inputs are in `src/lib/recruiting/revenue-model.ts`, the tables are printed by `scripts/recruiting-revenue-model.ts`, and the revenue plan (05) lists every assumption. Sending 25 to 50 first messages a week by hand is one to two and a half hours of the owner's time.

Contacts needed for one paid pilot: about 1,250 (cautious), 330 (central), 130 (good). Reaching $3,000 a month from lists alone takes 31 subscribers at $99, 21 at $149 or 16 at $199. The market report put the chance of $3,000 a month within a year at 10% to 20%, and of at least one paid pilot within 90 days of steady outreach at 40% to 50%. That chance counts more than the list product (sourcing support and, later, placement); on the list alone, even the good case at 50 messages a week reaches about $1,400 a month after a year.

**Where the large numbers are, and why they are not available yet.** One $18,000 placement fee is more than seven times everything the list product takes in over its first year in the central case at 50 messages a week ($2,439). But the legal memo reads the line almost every regime uses as: a fee that depends on a hire is placement, and placement needs a licence or registration in New York, New Jersey, Massachusetts, Illinois, Ontario, Quebec, Italy, Spain and Singapore. California is the exception: its agency law does not apply to a person who charges fees only to employers (Civil Code 1812.502(a), read in a 2018 copy of the statute; a lawyer must confirm the current text). So the only path to large revenue is contingency placement for California employers, employer-paid only. It also needs candidates (who must come in on their own), recruiting skill, and references Amber does not have. It is stage three, after a lawyer and after proof.

## Barriers, and what was done about each

| Barrier | Kind | What was done |
|---|---|---|
| A fee tied to a hire, or introducing candidates, is employment-agency activity in many places | Legal | The first offer is a fixed-fee list with no candidate contact. The gate refuses placement and split-fee services everywhere and holds work tied to NY, NJ, MA and IL until the owner, advised, clears the state. |
| Cold business email: CAN-SPAM has no B2B exception; California adds statutory damages; Canada, Germany, Spain, Italy, Australia and others need consent | Legal | First messages go only to US business addresses by default. A region needing consent cannot be cleared on the page. Every message has the sender's real name, postal address, how the address was found, a plain opt-out and a notice that it is a commercial message. An opt-out is honoured at once and kept for good. |
| Lists of named people can make a business a data broker (California Delete Act) and bring GDPR duties | Legal | Nothing in the list is about a person. Only a role mailbox that the company itself prints is kept, never a named person's address. |
| AI in hiring: New York City, Illinois, Colorado, California rules; EU AI Act; a vendor can be sued as an employer's agent | Legal | Nothing scores, ranks, filters or rejects a person. The candidate evidence sheet quotes what the candidate wrote and says "not stated" otherwise; it has no number and no order of fit. |
| Scraping professional networks breaks their terms | Legal | No scraping of any network, and no automation on LinkedIn. Candidates come in on their own. |
| Claims of clients, results or licences that do not exist | Legal, honesty | The wording check refuses them. Revenue counts only with proof and the owner's confirmation. |
| Terms of the job-board APIs are mostly "unclear" on commercial reuse | Legal | Volume is low, each read names the bot and a contact, each source has an on/off switch, rows from feeds carry the feed's attribution. The owner decides whether to read the terms and keep each source on. |
| Response formats of the job feeds were recalled from documentation, not seen | Technical | Parsers tolerate missing fields; a response with entries but no readable role is reported as a changed format and skipped. Eleven readers parse the research agents' documented samples. The first live read on the worker settles it. |
| The vendors give no list of their customers | Technical | Boards are learned from Hacker News posts and companies' own careers pages, and the owner can add any. Staffing businesses are also found on map data. |
| The build environment could not reach any job-feed host | Technical | Nothing was read live tonight. All tests use fixtures. Live probing waits for the worker. |
| GitHub Actions will not run (billing) | Technical | All 198 tests, the type check and the linter were run locally. A merge needs the owner's word. |
| The worker has no disk that survives a deploy | Technical | State is kept in the database, in two rows that two different writers never share. |

## What would change the verdict

Up: an agency owner agrees to a design-partner pilot; two or three written testimonials; a lawyer confirms the California employer-only exemption and a licensed-partner route; permanent placement keeps recovering.

Down: fewer than three positive conversations after about 300 targeted contacts over about six weeks (the tripwire in the market report); LinkedIn bundling cheap AI sourcing for small agencies; buyers who will pay only $10 an hour; a job-board vendor objecting to the reads.

## What I recommend

1. Approve the code to be merged and deployed (no behaviour changes until the lane is switched on).
2. Fill in the settings on the page, read the process checklist, and approve the process if it is right.
3. Switch the lane on for a week, read the sources panel, and fix any format that changed.
4. Send a small first batch yourself (the page keeps up to twelve messages ready at a time; five to ten a day is a sensible pace), and keep the tally. Stop or change course at the tripwire.
5. In parallel, spend an hour with a California attorney on the three questions in the approvals list. That is the only way to learn whether the larger business is open at all.
