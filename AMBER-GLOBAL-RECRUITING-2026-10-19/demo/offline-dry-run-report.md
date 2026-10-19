# Amber Global Recruiting: a demonstration (OFFLINE DRY RUN ON DOCUMENTED SAMPLES, NOT REAL EMPLOYERS)

Run on 2026-10-19 06:35 UTC. Nothing was sent, no one was contacted, nothing was written except this report. The sender in the notes is the made-up example sender.

## Summary

- Sources read: 10 of 10 answered.
- Employers found: 3 employers; 2 employers with a role open 45 days or more, for example Example Co (Backend Developer, 68 days); Exampleco (Staff Data Engineer, 60 days).
- Staffing businesses found: 2; 2 with a hiring address printed on their own site.
- Note written for Initech Staffing: wording check 0 errors and 0 warnings; compliance gate "hold"; status "waiting" (the owner has not approved the process, and Amber cannot send).
- Lifecycle simulation (invented businesses, simulated owner steps): 30 of 30 checks passed.
- Nothing was sent and no one was contacted.

## 1. What Amber read

- Pass 1: Recruiting lane: 2 feed(s), 1 Hacker News thread, 1 map area(s), 6 board(s) read, 16 roles seen, 5 new business(es), 2 published contact(s) found, 13 request(s), 0 s.
- Pass 2: Recruiting lane: 0 feed(s), 0 Hacker News thread, 0 map area(s), 0 board(s) read, 0 roles seen, 0 new business(es), 0 published contact(s) found, 0 request(s), 0 s.
- The clock was moved forward 50 days for what follows, so that listings first seen today count as long open (a dry-run device; it is not used on real data).

| Source | Reads | Failed | Last answer | Format |
|---|---|---|---|---|
| Remotive jobs API | 1 | 0 | read: 2 roles read | ok |
| Jobicy remote jobs API | 1 | 0 | read: 2 roles read | ok |
| Hacker News: 'Who is hiring?' threads | 1 | 0 | read: 1 posts read from thread 900000200 | ok |
| Map data: employment agencies (OpenStreetMap) (Dallas, TX) | 1 | 0 | read: 1 businesses with a website (overpass-api.de); 1 new | ok |
| Greenhouse job board | 1 | 0 | read: exampleco: 2 roles | ok |
| Lever postings | 1 | 0 | read: exampleco: 2 roles | ok |
| Ashby job board | 1 | 0 | read: ExampleCo: 1 roles, 1 skipped | ok |
| SmartRecruiters postings | 1 | 0 | read: ExampleCo: 2 roles | ok |
| Workable public jobs | 1 | 0 | read: exampleco: 2 roles | ok |
| Personio XML job feed | 1 | 0 | read: exampleco: 2 roles | ok |

Found 5 businesses: 3 employers and 2 staffing businesses; 16 open roles in all; 2 publish a hiring address that Amber found on their own site.

## 2. Employers in the documented sample payloads (NOT real) with a role that has stayed open 45 days or more

2 US employers have at least one qualifying role (16 roles in all, one row per company in the list; recruiter roles and "general application" entries are left out).

### 1. Example Co: Backend Developer

- Where: United States. Listing: https://apply.workable.com/j/GHI567JKL8
- Open 68 days, listed since 2026-10-01 (the date the vendor gave for the listing).
- Why it counts: found on the company's own public job board (Workable public jobs); a role at the company itself, not a recruiter's job and not a standing "general application"; in the United States, a region the owner has cleared by default.
- The company's own site: not read yet in this run.

### 2. Exampleco: Staff Data Engineer

- Where: Remote - US. Listing: https://jobs.ashbyhq.com/ExampleCo/00000000-0000-4000-8000-000000000001
- Open 60 days, listed since 2026-10-08 (the date the vendor gave for the listing).
- Why it counts: found on the company's own public job board (Ashby job board); a role at the company itself, not a recruiter's job and not a standing "general application"; in the United States, a region the owner has cleared by default.
- The company's own site: not read yet in this run.

### The sample list an agency would receive

# Employers whose roles have stayed open (sample)

Prepared 2026-12-08. Taken from the companies' own public careers pages and from open job feeds, on the dates shown.

| Company | Role | Where | Listed since | Days open | Listing | Where it was read | Hiring address the company publishes |
|---|---|---|---|---|---|---|---|
| Example Co | Backend Developer | United States | 2026-10-01 | 68 | <https://apply.workable.com/j/GHI567JKL8> | Workable public jobs | none found |
| Exampleco | Staff Data Engineer | Remote - US | 2026-10-08 | 60 | <https://jobs.ashbyhq.com/ExampleCo/00000000-0000-4000-8000-000000000001> | Ashby job board | none found |

Every row is taken from a public job listing: the company's own careers page or a job board that lists the role (the column "Where it was read" names it). The rows are about companies and roles: no person is named on purpose, and an address or phone number of an individual is cut out when a listing is read. "Days open" counts from the date the vendor gave for the listing, or from the first day Amber saw it listed; a role may have been open longer, or may have been withdrawn since the page was read.

Listings were read from the public job-board pages of: Workable public jobs, Ashby job board.

## 3. A staffing business, how Amber found it, and the note written for it

**Initech Staffing** (US): a staffing business, and one that lists a recruiter's job of its own, which Amber scores as a sign that it may be growing (a signal, not a fact).

- First seen 2026-10-19 in Hacker News: 'Who is hiring?' threads; score 45 (1 open role for recruiting or sourcing (Technical Recruiter); describes itself as a staffing or recruiting business; its roles were read in the last two weeks).
- Website: https://initech.example.
- Hiring address: hello@initech.example (a role address, not a person), printed at https://initech.example/contact, found 2026-10-19 12:00 UTC after reading its robots.txt.
- Note kept: contact check: found role-email on https://initech.example/contact

**The note** (subject: A weekly list of long-open roles for Initech Staffing; 128 words before the footer):

> Hello Initech Staffing team,
>
> Initech Staffing is looking for a Technical Recruiter, according to its careers page. I am not a recruiter and I place no one; this is research for agencies.
>
> The software I run reads public job listings every day, and I check the results before anything reaches you. The roles I keep are the ones that have been open for 45 days or more. Agencies get a short list: company, role, link, the date I first saw it, and the hiring address the company publishes. You pay nothing for the first sample. After that it would be a flat monthly fee that we put in writing first.
>
> I could send two rows for technology as a first look. Would that help?
>
> Thanks for reading,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your contact page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

- Wording check: 0 errors, 0 warnings.
- Compliance gate: **hold**. Ready to read. It can be approved once you approve the messaging and compliance process.
- Status on the owner's page: **waiting**. It cannot be approved until the owner approves the process, and it cannot be sent by Amber at all.

Where it would sit on the page: stage "drafted", 2 note(s) waiting to be read, 0 sent.

## 4. Tracking a prospect from the first sighting to a client with proof

Everything above comes from documented sample payloads on made-up servers, not from real employers, and stops where the owner's decision begins. The owner's steps below are **SIMULATED** on three **INVENTED** staffing businesses (addresses on `.example`), using the page's own functions, so that no action, reply or payment is ever written against a real business. The sample list they draw on is the one from section 2 (made-up in this dry run).

| Day | Who | What happened | Business | Where the page puts it | Sent | Replies | Clients with proof | Revenue |
|---|---|---|---|---|---|---|---|---|
| 0 (2026-12-08) | Amber | found the business and the hiring address it prints on its own site; wrote a first note; the settings are not filled in yet | Harbor & Pine Staffing | held | 0 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | filled in the sender's name, the business name, a postal address and a reply address | Harbor & Pine Staffing | drafted | 0 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | read the checklist and approved the messaging and compliance process | Harbor & Pine Staffing | drafted | 0 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | read the note, approved it | Harbor & Pine Staffing | approved | 0 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | sent it from their own mail and recorded that they did | Harbor & Pine Staffing | sent | 1 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | read the note, approved it | Summit Ridge Talent | approved | 1 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | sent it from their own mail and recorded that they did | Summit Ridge Talent | sent | 2 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | read the note, approved it | Cedar Crossing Staffing - Boise | approved | 2 | 0 | 0 | $0.00 |
| 0 (2026-12-08) | You (simulated) | sent it from their own mail and recorded that they did | Cedar Crossing Staffing - Boise | sent | 3 | 0 | 0 | $0.00 |
| 2 (2026-12-10) | You (simulated) | pasted a reply: "Please take us off your list." | Cedar Crossing Staffing - Boise | suppressed | 3 | 1 | 0 | $0.00 |
| 3 (2026-12-11) | You (simulated) | pasted a reply: asks for the sample and the price | Harbor & Pine Staffing | replied | 3 | 2 | 0 | $0.00 |
| 4 (2026-12-12) | You (simulated) | logged a call in their own words | Harbor & Pine Staffing | in-conversation | 3 | 2 | 0 | $0.00 |
| 6 (2026-12-14) | You (simulated) | sent a proposal by hand and marked it | Harbor & Pine Staffing | proposal | 3 | 2 | 0 | $0.00 |
| 7 (2026-12-15) | Clock | seven days after the first message: the follow-up exists but is not yet due | Summit Ridge Talent | sent | 3 | 2 | 0 | $0.00 |
| 8 (2026-12-16) | Clock | the eighth day: the follow-up becomes due | Summit Ridge Talent | sent | 3 | 2 | 0 | $0.00 |
| 8 (2026-12-16) | You (simulated) | read the follow-up (one real row from the list) and approved it | Summit Ridge Talent | sent | 3 | 2 | 0 | $0.00 |
| 8 (2026-12-16) | You (simulated) | sent the follow-up by hand and recorded it | Summit Ridge Talent | sent | 4 | 2 | 0 | $0.00 |
| 10 (2026-12-18) | You (simulated) | marked the business as won | Harbor & Pine Staffing | won | 4 | 2 | 0 | $0.00 |
| 10 (2026-12-18) | You (simulated) | recorded the signed agreement (contracted, not paid) | Harbor & Pine Staffing | won | 4 | 2 | 1 | $0.00 |
| 14 (2026-12-22) | You (simulated) | saw the $99 in their account and confirmed it, with the invoice number | Harbor & Pine Staffing | won | 4 | 2 | 1 | $99.00 |
| 16 (2026-12-24) | Clock | sixteen days in: the silent firm has had its one follow-up | Summit Ridge Talent | sent | 4 | 2 | 1 | $99.00 |

**Checks**

- PASS: before the owner has set a name and an address, the note is held, not offered
- PASS: two offices of one firm get one note, not two
- PASS: with settings but no approval of the process, the note can be read and cannot be approved
- PASS: approving a note before the process is approved is refused (It cannot be approved now: Ready to read. It can be approved once you approve the messaging and compliance process.)
- PASS: after the process is approved the note is ready for the owner's approval
- PASS: the note passes the wording check (no errors) and the compliance gate
- PASS: the page counts three messages sent by the owner, and only those
- PASS: no second first message is offered to a business that was already written to
- PASS: the second office of the firm that was written to gets no note of its own
- PASS: an opt-out from one office sets both offices of the firm aside, for good
- PASS: the reply was sorted as an opt-out although the shared classifier would have read it as something else
- PASS: no follow-up is prepared for a firm that opted out
- PASS: an action about a business that is not on the list is refused
- PASS: the prospect moves to 'replied'
- PASS: a reply ends the cold messages: no follow-up is prepared
- PASS: the prospect moves to 'in conversation'
- PASS: the prospect moves to 'proposal'
- PASS: on the seventh day the follow-up is prepared and held, not due
- PASS: from the eighth day the follow-up is ready for the owner's approval
- PASS: the page counts the follow-up as a fourth message sent by the owner
- PASS: marking 'won' does not make a client: clients with proof stay at 0
- PASS: a signed agreement makes a client with proof and $99 'contracted', and revenue is still $0
- PASS: the same agreement entered twice is refused (That reference is already on record for "pilot: four weekly lists" ($99.00). One reference is one payment; correct that entry instead of adding another.)
- PASS: a payment the owner has not confirmed seeing in the account is not revenue
- PASS: after the owner confirms the payment, revenue is $99 and there is still exactly one client
- PASS: the silent firm has exactly two messages on record and no third is prepared
- PASS: its stage stays 'sent': no reply was recorded, so none is claimed
- PASS: reading the record back in a different order gives the same state (the log is replayed by date, never trusted by position)
- PASS: every business is in exactly one stage: the funnel adds up to the number of businesses
- PASS: every action is on the activity list with its date and who did it

30 of 30 checks passed.

**First note, as written for the invented firm that went on to become a client:**

> Hello Harbor & Pine Staffing team,
>
> I was reading through Harbor & Pine Staffing's open positions and saw the Healthcare Recruiter role. I am not a recruiter and I place no one; this is research for agencies.
>
> I look at what employers publish about their open roles, with some software to do the reading. I pick out roles that have been listed for 45 days or more. Agencies get a short list: company, role, link, the date I first saw it, and the hiring address the company publishes. The sample is on me. If you want it weekly after that, it would be a flat monthly fee that we agree in writing.
>
> Would a short sample for the roles you fill be worth a look?
>
> Best,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and I will send one follow-up at most. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

**The one follow-up, for the invented firm that stayed silent (one row of the real sample list):**

> Hello Summit Ridge Talent team,
>
> I wrote on December 8 about a weekly list of long-open roles. Here is one row from it, so you can see what it looks like:
>
> Example Co: Backend Developer, listed since early October. https://apply.workable.com/j/GHI567JKL8
>
> I can send a few more in the same shape if you want them. If you do not, you will not hear from me again.
>
> Thanks,
> Maya
>
> --
> Maya Chen
> Amber Global Recruiting, 100 Example Street, Los Angeles, CA 90001
> This is a commercial message, and the last one from me. I found this address on your careers page.
> I use an AI assistant for research and first drafts, and I read every message before it goes out.
> If you would rather not hear from me, reply "no thanks" and I will not write again.

## What this does not show

- Nothing was sent, and the real prospect's note is waiting for the owner's approval of the process and of the message itself.
- Replies, calls, proposals, agreements and payments in section 4 are simulated; no real business has been contacted.
- No source reported a problem. A source whose answer did not match what its reader expects is reported above as a changed format, not shown as an empty list.
- Whether a listed role is still open today is whatever the source says at the time of the read; a role may have been filled since.
