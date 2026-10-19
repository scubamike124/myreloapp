# The demonstration before launch

Written 19 Oct 2026 (Pacific), at the owner's request: *show that Amber can find a real employer, identify a legitimate recruiting opportunity, prepare a natural human-sounding message, and track the prospect correctly from beginning to end.*

## Where things stand

The part that needs the internet **has not been run on real employers yet, and I have not pretended it has.** The environment this was built in has a network policy that refuses every job site: on 19 Oct at 06:18 UTC the proxy answered "403" to a connection to each of `boards-api.greenhouse.io`, `api.lever.co`, `remotive.com`, `hacker-news.firebaseio.com`, `hn.algolia.com`, `www.arbeitnow.com`, `jobicy.com` and `remoteok.com`, and the session's page-fetch tool could not look up `boards-api.greenhouse.io` either (the one I tried). I did not route around that. What I did instead:

1. **Built the demonstration as one command** that runs the lane's own code on real data and writes a report: `npm run demo:recruiting` (it is `scripts/recruiting-live-demo.ts`).
2. **Tested it end to end offline** on the documented sample payloads (a dry run that labels itself as such), and tested what it says when the network is closed (it says so plainly and shows nothing in place of what was not read). Both are in `npm run test:recruiting`.
3. **Built and tested the tracking half** on invented businesses through the owner's own page functions (`src/lib/recruiting/demo.ts`): 30 checks, all passing.

What is missing is only the live read. Two ways to run it, either is free:

## Option A: let this session reach the job sites (about two minutes of your time)

In the Claude app, open the cloud environment menu in the session's title bar, choose **Edit**, and under **Network access** either:

- choose a broader access level for the length of the demonstration (the simplest, and the only one that also lets Amber read each staffing business's own site for the hiring address it prints), **or**
- add these under **Allowed domains** (this shows the employers and the sample list, but not a staffing business's hiring address, because those sites cannot be listed in advance):
  `hacker-news.firebaseio.com`, `hn.algolia.com`, `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de`, `overpass.kumi.systems`, `overpass.private.coffee`, `remotive.com`, `jobicy.com`, `boards-api.greenhouse.io`, `api.lever.co`, `api.ashbyhq.com`, `api.smartrecruiters.com`, `www.workable.com`, `www.arbeitnow.com`, `remoteok.com`, and `*.jobs.personio.de`.

Then tell me to run it. I run `npm run demo:recruiting` here, read you the report, and put it where you can open it. When it is done, set the access back. The steps are at https://code.claude.com/docs/en/cloud-environments#network-access.

## Option B: run it on your own computer

```
git fetch origin claude/amber-global-recruiting
git checkout claude/amber-global-recruiting
npm install
npm run demo:recruiting
```

Add `-- --area="Denver, CO"` to look at another of the 20 map areas, or `-- --board=lever:somecompany` to include a company you know. The report is written to `recruiting-demo-output/report.md`. It needs no database and no keys, writes nothing else, and sends nothing.

## What the run does

It uses the lane's own reader, at the lane's own pace, naming itself `AmberRecruitingBot/1.0` with a contact address, checking each company's robots.txt before reading its site, at most 110 requests and about three minutes per pass, two passes:

1. **Reads the public sources**: the latest Hacker News "Who is hiring?" thread (companies post their own openings and the addresses of their job boards), two open job feeds, the company job boards it learns about, and the staffing businesses on the map data for one area.
2. **Finds the employers and the opportunity.** For each employer with a role listed 45 days or more it says where it was found, the date and who gave it, and why it counts as a legitimate opportunity (a role at the company itself, on its own public board; not a recruiter's job; not a standing "general application"; in the United States; the company's own site does not say it refuses agency approaches). A role from a source that gives no date counts from the day Amber first saw it, so it cannot show as long open on the first day.
3. **Finds a staffing business** that prints a hiring address on its own site, and shows where, and when, and that its robots.txt allowed the read.
4. **Writes the note.** The text, the wording check (errors, warnings, words), and the compliance gate with its reason. The process is not approved, so the note shows as "waiting": Amber cannot send, and the owner cannot approve it until the process is approved.
5. **Shows the sample list** that note offers, as the agency would receive it.
6. **Tracks a prospect from the first sighting to a client with proof**, on three **invented** businesses whose every owner step is marked **simulated**, through the same functions the owner's page calls, with the clock moved forward day by day, and prints each step with where the page now puts the business and its counters. No action, reply or payment is ever written against a real business.

At the top of the report is a short summary; at the bottom, what the run does not show.

## What counts as a pass

You can check every one of these yourself in a few minutes, from the report:

| The report shows | You check |
|---|---|
| At least one real employer with a role open 45 days or more, with a date that comes from the vendor | The listing link opens, the role is on the company's own board, and its date agrees |
| A staffing business with a hiring address | The address is printed on the page named in the report, and it is a role address (`jobs@`, `hello@`, `info@`), not a person |
| A note for it | It reads like one person writing to one company; it names the business and something checkable on its own page; it says what the sender is not; it offers one small thing; it carries the footer; the wording check shows no errors |
| The gate says "hold" or "waiting", never "ok" before approval | Nothing can go out without your approval of the process and of the message |
| Tracking: 30 of 30 checks pass | The table shows each business in one stage at a time, an opt-out stopping both offices of a firm, a follow-up only from the eighth day and never a third message, "won" not making a client until a signed agreement or a confirmed payment is on the ledger |

## What can go wrong on a first live read, and what happens

- **A source answers in a shape its reader does not expect.** Nine of the twelve readers were written from documentation only. The report says "FORMAT CHANGED" for that source and carries on with the others; I fix the reader from the shape it printed, add a test, and run again.
- **No role is long open yet.** A role from a source that gives no creation or publication date counts from the day Amber first saw it, so it cannot show as long open on the first day. The feeds and most company boards do give a date. If the sources read give no old roles, the report says so, and adding a few boards (`--board=lever:name`) usually fixes it.
- **No staffing business prints an address.** Many small firms print only a form. Then the note is "held" for that firm and the report says why; the lane tries the next ones.
- **A company's robots.txt refuses the read.** The page is not read, and the report says so.

## What this will not be

It will not be a record of any outreach: nothing is sent. It will not be proof that anyone will buy: it shows the machine works, not that the market answers. The earliest honest evidence of that is the first reply, and the numbers for it are in 05-revenue-plan.
