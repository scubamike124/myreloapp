# Recruiting workflow plan

Written 18 Oct 2026 (Pacific). The brief asked for a workflow that discovers openings, identifies candidates through permitted sources, evaluates qualifications and connects candidates with employers, while respecting privacy, recruiting law, platform rules and required human decisions. This plan says which of those exist today, which are designed but switched off, and where a person decides.

## The short version

| Stage | What it does | State today |
|---|---|---|
| 1. Discover openings | Reads public job listings, finds employers whose roles stay open 45 days or more, finds staffing businesses and their published hiring address | **Built and tested offline.** Nothing has been read live yet (see 08-runbook). |
| 2. Sell the list to staffing agencies | Drafts a short note for each agency, the owner approves and sends it, records replies, delivers a weekly list, records money | **Built and tested.** Needs the owner's settings and approval. This is the first product. |
| 3. Employers and their applicants | Reads a small employer's own applicants and writes down what each wrote about the employer's requirements | **Designed. Evidence-sheet rules are in code (`candidates.ts`); no intake, no employer wording, no page.** Held for a lawyer. |
| 4. Candidates and introductions | People send their own details for a role they choose; an introduction happens only with their agreement for that role | **Designed, not built, not wired.** Held until an employer has engaged Amber for a real role. |

The reason for the order: stage 2 uses only company information, so it carries the least legal and privacy exposure, and it answers what small staffing agencies say they need most (new clients). Stages 3 and 4 involve people's details, automated-hiring-tool rules, and in many places a licence, so they wait for a lawyer and for a real client.

## Stage 1: discover openings (built)

1. The worker (cloud job `RECRUITING_TICK`, every 30 minutes, off unless `AMBER_RECRUITING_LANE=1`) reads whichever sources are due: open job feeds, the monthly Hacker News hiring thread, map data for staffing businesses, and company job boards it knows.
2. Every opening is stored with its source, link and date (the vendor's, or the day it was first seen). The same role on two sources is one role.
3. A company becomes a prospect. It is an **employer** (its roles are list content) or a **staffing business** (a buyer of the list), decided by its name and the roles it lists.
4. Signals are noted: hiring a recruiter, long-open roles (45 days or more, recruiter jobs excluded), many open roles, agency-like name, hard-to-fill titles, recently active.
5. For staffing businesses in cleared regions, the company's own website is read (robots.txt first, at most four pages) for a published role address.
6. Boards the lane finds are remembered; the owner can add one by hand on the page.
7. The page shows what was read, how it went, and what failed. A source that fails three times in a row is paused for seven days. A response in a changed format is reported, not trusted.

**Permitted sources only.** Public job listings that anyone can open, read at low volume, with the reader named. No login, no scraping of social networks, no bought data, no guessed addresses. See 03-lead-sources and 02-voice-and-compliance.

## Stage 2: sell the list to staffing agencies (built)

This is the workflow the owner runs. It is meant to take about 15 minutes a day.

| Step | Who | What happens | Recorded as |
|---|---|---|---|
| Settings | Owner, once | Real name, role, business name, postal address, reply address, the AI-assistant line, the services and regions to offer, the states cleared | One `settings` entry |
| Approve the process | Owner, once (can withdraw) | Reads the checklist on the page and approves it. Before this, every message is readable but cannot be approved | `approve-process` with the date and the scope |
| Read the queue | Owner, daily | Up to twelve messages are ready at a time, each for a staffing business with a published role address in a cleared region | Nothing yet |
| Edit | Owner, optional | Changes wording on the page. The wording check and the gate run again on the edit | `edit-draft` |
| Approve | Owner, per message | Approves the exact text. The approval is tied to a hash of the subject and body, so any later change cancels it | `approve-draft` with the text and its hash |
| Send | Owner, by hand | Copies the approved message into their own mail (a "mailto" link is offered) and sends it. **Amber cannot send.** | Nothing |
| Mark sent | Owner | Presses "I sent it" with the date | `mark-sent` |
| Follow-up | Owner | One follow-up is prepared at least seven days later, showing one real row from the list. No third message exists | `approve-draft`, `mark-sent` |
| Record a reply | Owner | Pastes the reply. It is classified (interested, not interested, unsubscribe, question...). An unsubscribe suppresses the business for good | `log-reply` |
| Record a conversation | Owner | A note in their own words | `log-conversation` |
| Move it on | Owner | Proposal, won, lost, not a fit | `set-stage` |
| Do not contact | Owner, any time | Business, domain or address, permanent | `suppress` |
| Deliver the list | Owner | Presses the sample or export button, checks two or three links, sends it | Nothing |
| Money | Owner | Records an agreed fee, a payment received, or an expense. Revenue counts only with proof and the owner's confirmation | `ledger` |

**What the owner never has to do by hand:** find the companies, find the addresses, write the first draft, check the wording, check the region and state rules, keep the opt-out list, or count the funnel.

**What stays the owner's decision, always:** whether to approve the process, every message, every send, every reply, every stage, every opt-out, every price, every dollar recorded.

### The weekly rhythm

- **Daily (about 15 minutes):** read the queue, approve and send five to ten messages, record replies.
- **Weekly:** check the sources panel for anything that failed or changed format; deliver lists to anyone on a pilot or a plan; read the funnel; write the weekly status (a post or a video) from the page's own numbers.
- **After about 300 contacts or six weeks:** apply the tripwire in the viability memo.

## Stage 3: employers and their applicants (designed, held)

An employer with no agency in between is the larger market and the one with the most rules. The offer would be narrow: the employer's own applicants send their details to the employer through the employer's posting; the employer passes them to Amber; Amber writes, for each requirement the employer set, what the applicant wrote about it, or "not stated"; the employer reads the sheet and decides whom to call. A flat fee per role, never tied to a hire.

1. **Agreement first.** A written agreement says who is responsible for the applicants' details (the employer, with Amber as a service provider), what Amber does and does not do (no scoring, no ranking, no decisions), the fee, and how details are returned or deleted. A lawyer reviews it.
2. **Criteria.** The employer lists the requirements. `checkCriteria` refuses any that refers to a protected characteristic (age, sex, race, religion, disability, family status, sexual orientation, citizenship, and proxies such as "recent graduate" or "native speaker") and says why.
3. **Notice.** The employer tells applicants that a service provider helps read applications and that no tool scores or ranks them. Where a law requires a notice or an audit for automated tools (New York City, Illinois, Colorado, California, the EU), the lawyer confirms whether a quote-only sheet is covered.
4. **Sheet.** For each applicant, per requirement: the sentences the applicant wrote that bear on it, quoted, or "not stated". Passages that mention a protected characteristic are left out and counted. Name, photograph, ages and education dates, address beyond the country or region, and anything the applicant did not write are not considered. There is no number and no order of fit; applicants are listed in the order they arrived.
5. **Decision.** A named person at the employer reads the applicant's own text next to the sheet and decides. The decision is the employer's and is logged by them. Amber's record keeps who saw what and when, for as long as the law asks (California's automated-decision rules ask for four years for covered systems; the lawyer decides whether that reaches a quote-only sheet).
6. **Return.** Applicant details go back to the employer or are deleted when the engagement ends.

**Not built:** the employer wording and gate, the agreement, the notice, the intake of applications from an employer, the page. **Built:** the criteria check, the sheet, the arrival-order rule and the tests (`candidates.ts`, 9 tests).

## Stage 4: candidates and introductions (designed, held)

Candidates are people who have a reason to write to Amber. Today they have none, because there is no role to apply for. The rule is: **no intake opens until an employer has asked Amber in writing to find applicants for a specific role.**

**Permitted sources of candidates**

| Source | Allowed? | Why |
|---|---|---|
| A person who applies to a specific role Amber has posted, with the employer's agreement | **Yes** | They chose to write, for that role |
| A person who writes in on their own | **Yes**, with the reply in `06-marketing/04` | The CV is not kept until they agree |
| The employer's own applicants, passed on by the employer | **Yes**, under the employer agreement | The employer is responsible; stage 3 |
| A referral from a person the candidate knows | **Only through the candidate**: the referrer asks the candidate to write | A third party cannot give consent for someone else's details |
| A manual, individual, role-relevant message by the owner to someone who has published a profile to be found by recruiters | **Not in the first 90 days, and never through this system** | Legal memo: only manual messages from the owner's own account, with notice at first contact; the gate blocks cold messages to candidates |
| LinkedIn, GitHub, Indeed or any profile site scraped by software; bought lists; talent databases | **Never** | Terms of service, privacy law, brief |

**The intake** (designed, not built): a plain page with a form. Fields: name, email, where they are (optional), a headline, skills, experience (title, organisation, years, a short summary), links (up to five), the roles they choose to be considered for, and a required box for the consent text below. The form is checked by `parseSubmission`, which refuses a submission without the agreement and a scope.

**Consent wording** (version `2026-10-19-draft`, for a lawyer): "I am sending my details myself. I agree that Amber Global Recruiting may keep them for 12 months from my last contact, may share them with the employers for the roles I choose, and will delete them within 30 days if I ask. I understand I will never be charged anything."

**Retention.** Kept for 12 months from the last contact; contact since then moves the date, silence does not. A nightly job (not built) lists records past their date (`dueForDeletion`) and erases them, leaving a record that the deletion happened. A deletion request is done within 30 days (`deleteBy`).

**Introduction.** `shareableFor` shows an employer the work details of a candidate only for a role the candidate chose, and never their contact details until they agree to be introduced. The introduction is made by a person, and the candidate says yes first, for that employer and that role.

**Fees.** A candidate is never charged for anything. Any fee comes from the employer, is written down first, and (in the first 90 days) never depends on a hire. A fee that depends on a hire is placement; see 05-revenue-plan and 09-viability for the licensing map and the single exception (California, employer-paid, to be confirmed by a lawyer).

**Not built:** the intake page and route, candidate storage, the nightly deletion job, the introduction step, the notice page. **Built:** the rules in `candidates.ts`.

## Who decides what

| Decision | Decided by | What the system does |
|---|---|---|
| Whether the process is approved | Owner | Holds everything until they say yes; records the date and scope |
| Whether a message goes out | Owner | Refuses to mark it ready if the wording or the rules fail; never sends |
| Whether a business is written to again | Owner and the business | Honours opt-outs for good; one first message and one follow-up at most |
| Which regions and states are open | Owner, advised by a lawyer | Defaults to the United States only; refuses regions that need consent |
| Which services are offered | Owner | Defaults to the research list; refuses placement and split fees |
| The price | Owner | Records what was agreed; counts nothing as revenue without proof |
| Whether an employer's requirement is acceptable | The system refuses protected grounds; the employer decides the rest | `checkCriteria` |
| Whether an applicant is interviewed | A named person at the employer | Shows the applicant's own words and "not stated"; no score, no rank |
| Whether a candidate is introduced | The candidate first, then the owner | Shows only the details the candidate chose to share for that role |
| Whether any of this is legal in a place | A lawyer | Holds work tied to places that need a licence or consent until cleared |

## Platform rules, in one place

- No automation of LinkedIn or any social network: no scraping, no bots, no scripted messages or posts. Posts are written by the owner by hand.
- Job-board vendors: read-only public listings; no apply endpoints; no customer-only APIs; low volume; named reader; a switch per source.
- Mail: the owner's own mailbox, a few messages a day, by hand. Not the main product domain, so a mistake cannot damage the mail that other products send.
- YouTube: a new channel for Amber Global Recruiting created by the owner; synthetic voices or pictures are disclosed; no claim in any video that is not true on the day.

## What is counted

The page counts, from the owner's own log and the worker's reads: businesses found, with a published address, messages to read, approved, sent, replies, conversations, proposals, won, lost, do not contact; roles seen and roles open 45 days or more; money in and out. It never counts a client, a candidate or a dollar that has no record behind it. Candidates: **0**. Placements: **0**. Revenue: **$0.00**.
