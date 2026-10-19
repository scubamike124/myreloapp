# Lead sources: what was researched, what is built, what is not

Written 18 Oct 2026 (Pacific). The full research is in `research/03-lead-sources.md` (50 sources, assessed from search summaries and vendor documentation; no page was opened and no job feed was called, because the research environment could not resolve any host). This file says which of those sources the code reads, how, and what happens on the first live read.

## What the list is made from

Employers whose public job listing has stayed up for 45 days or more, found on:

1. **Company job boards** hosted by an applicant-tracking vendor (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Personio, and Recruitee). A board is read through the vendor's public, no-key listing address, the same data that powers the company's own careers page.
2. **Open job feeds** (Remote OK, Remotive, Arbeitnow, Jobicy, We Work Remotely) that publish listings for anyone to read, with attribution.
3. **Hacker News "Who is hiring?"** threads, read for the job-board addresses that companies print in their own posts. Names and emails in a post are dropped when it is read.
4. **OpenStreetMap** map data, to find staffing businesses (tagged `office=employment_agency`) in 20 US metropolitan areas. These are the buyers of the list, not rows in it.
5. **The company's own website**, to find the hiring address it prints (jobs@, careers@, hello@ and similar), after reading its robots.txt.

No board is found by guessing: a board name is learned from a Hacker News post, from a link on the company's own careers page, or from the owner (the page has an "add a board" form). Nobody brute-forces names and nothing probes a vendor's customers.

## What the code reads, and how often

| Source | In the code | Verified against | On by default | Least time between reads |
|---|---|---|---|---|
| Greenhouse job boards | `greenhouse` | Documented in the vendor's own repository | Yes | 24 hours per board |
| Lever postings | `lever` | Documented, partly | Yes | 24 hours per board |
| Ashby | `ashby` | Documented, partly (where compensation sits is unclear) | Yes | 24 hours per board |
| SmartRecruiters | `smartrecruiters` | Documented, partly (docs conflict on a key) | Yes | 24 hours per board |
| Workable | `workable` | Documented, partly (which url field is the job page) | Yes | 24 hours per board |
| Personio XML | `personio` | Documented, partly | Yes | 24 hours per board |
| Recruitee | `recruitee` | **Not verified** | **No** | 24 hours per board |
| Remote OK | `remoteok` | Partly | Yes | 6 hours |
| Remotive | `remotive` | Documented | Yes | 6 hours (the vendor advises four reads a day) |
| Arbeitnow | `arbeitnow` | Partly | Yes | 3 hours |
| Jobicy | `jobicy` | Documented | Yes | 3 hours (the vendor allows hourly) |
| We Work Remotely RSS | `wwr` | **Not verified** | **No** | 3 hours |
| Hacker News | `hn` | Documented (Firebase and Algolia) | Yes | once a day |
| OpenStreetMap | `osm` | Documented | Yes | once a week, two areas per run |

"Verified against" means the response shape was checked against the vendor's documentation or the research agents' sample responses; none was seen live. Each source can be switched off on the owner's page, and a board that fails three times in a row is paused for seven days.

The reading is polite by construction: a name and contact address in the request header (`AmberRecruitingBot/1.0`, a support address), a pause between requests to the same host, a cap of 110 requests and about two minutes per run, and no call to any vendor's apply endpoint or customer-only API.

## Sources the research recommended that are not built

| Source | Why not (yet) |
|---|---|
| Companies House free company data (UK recruitment and staffing firms) | The first messages go to US businesses only. It is the best next addition for a UK start, because it is a clearly licensed monthly file; it needs the UK rules cleared first. |
| Himalayas, Teamtailor, Pinpoint | Same pattern as the sources already built; each adds a parser whose shape nobody has seen live. Add after the first week of real reads. |
| US Department of Labor disclosure files, UK sponsor register, SEC EDGAR, Wikidata | Quarterly or monthly files with personal contact columns (which would have to be dropped on import) or thin coverage of small agencies. Not needed for the first list. |
| The Muse, Jooble, USAJOBS, France Travail, JobTech, Canada Job Bank | Need a key or a license line the owner must read, or cover a single country. Low priority for a US start. |
| LinkedIn, Indeed, EURES, Bundesagentur, BambooHR, Breezy | Terms prohibit it or there is no official interface. Never. |
| Adzuna, Careerjet, JazzHR, Common Crawl, Web Data Commons, trade-association directories | Terms restrict commercial use or the data belongs to the vendor's customer. Not used. |
| Bought lists, data brokers, email finders and verifiers | Person-level data. Never. |

## What was left unclear, and how the build handles it

- **Terms for public job data are unclear.** Public is not the same as licensed. Most vendors say nothing about third-party readers; Lever says its jobs "may be scraped by third parties"; the aggregators ask for a link back and a credit, and Remotive says that displaying its jobs to collect signups or emails is a breach. The build reads at low volume, keeps where each row came from, never republishes a listing's text, shows the aggregators' required credit in the list, and has an off switch per source. **The owner decides whether to keep the aggregators on in a list that is sold.** The cautious choice is to switch them off and use only company boards for the paid list; the cost is fewer rows.
- **Response shapes nobody has seen.** The readers tolerate missing fields, skip entries they cannot read, and report a response that has entries but no readable role as "format changed" instead of silently showing zero. Eleven readers parse the research agents' sample payloads in the tests; the rehearsal script (`scripts/recruiting-rehearsal.ts`) runs the whole lane over them.
- **Personal data in public payloads.** Hacker News posts are written by people; SmartRecruiters returns a `creator` field. The build reads an allow-list of fields per source (company, title, place, link, date) and nothing else. No person's name is stored anywhere in the prospect record.
- **Dates.** A vendor's publication date is used when given. Where it gives none, the list says "first seen" and counts from the first day Amber read the listing, so a role that was already old when Amber first saw it shows fewer days than it has really been open. Every row states which basis it rests on.

## The first live read

It cannot happen from the build environment, because the network proxy there refuses every job-feed host. It happens on the production worker after the owner approves a deploy and the worker is given `AMBER_RECRUITING_LANE=1`. The first run reads at most three feeds, one Hacker News thread, two map areas and twenty-five boards. Then, on the owner's page, the sources panel shows for each source: last read, how many roles, how many failures, whether paused, and whether the shape matched. The checks that decide whether a source is trusted are in `08-runbook.md`; the ones to look at first are:

- Greenhouse: are job descriptions escaped? (The reader ignores descriptions, so this should not matter.)
- SmartRecruiters: does the list answer without a key?
- Workable: which of `url` and `application_url` is the job page, and what wraps the jobs?
- Ashby: where does `compensation` sit, and how is the postal address spelled?
- Lever: is the list a bare array?
- Hacker News Algolia: the field names of a hit and the tag for the monthly thread.
- Recruitee and We Work Remotely stay off until one careful read has shown their shape.

## What the owner may need to do

(a) Read Hacker News's terms once (not checked here). (b) Decide whether aggregator rows stay in a paid list. (c) For any extra government or register source: read its license line first. (d) Ask Adzuna for written consent only if its data is ever wanted. No sign-up, key or payment is needed for anything that is built.
