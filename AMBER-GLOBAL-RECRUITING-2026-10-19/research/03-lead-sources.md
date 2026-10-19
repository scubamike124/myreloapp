# Amber Global Recruiting: free lead sources, assessed

As of 19 October 2026. Companion files: `03-sources.json` (50 sources, machine-readable) and `samples/` (34 sample payloads, one per source rated use-now or needs-owner-action).

## 1. How to read this

**What was done.** Documentation and terms pages were read through search summaries and GitHub-hosted docs. No job-feed endpoint was called. Nearly every vendor documentation host was unreachable from this container (DNS failure), and the web-search budget ran out before the last gap-filling round. So: every sample is "documentation-derived, not live-tested"; anything not confirmed on a documentation page is marked "unverified" in the JSON and in each sample's `_verification` note; section 9 lists the samples whose shape is still unverified.

**Verdicts.** *use-now*: free, no signup, nothing found that forbids internal prospecting use. *needs-owner-action*: a free key the owner must request, or a licence line the owner must read and accept first. *restricted*: terms conflict with Amber's use, or manual lookup only. *do-not-use*: terms prohibit it, or the endpoint is undocumented or unofficial. Totals: 25 use-now, 9 needs-owner-action, 10 restricted, 6 do-not-use.

**Quotations.** Text in quotation marks comes from the documentation page itself (README or docs source) or from a search summary that quoted the page; re-read the page before relying on exact wording. Quotes from official sources fetched directly: Greenhouse, Lever, Hacker News, Remotive, Jobicy and the Remote OK notice (via a client README). Terms for Adzuna, Arbeitnow, We Work Remotely, Himalayas, Common Crawl, LinkedIn and Indeed were seen only as search summaries.

**"Unclear" commercial use** is common: ATS vendors publish public job data without a licence. The low-risk reading, which every recommendation below assumes, is internal lead research, low request rates, no republishing of employer text, provenance kept per record, and one-to-one outreach reviewed by the owner. This is not legal advice.

## 2. Build these five first

1. **hn-firebase: Hacker News "Ask HN: Who is hiring?" threads.** No key, and the README says "There is currently no rate limit." Employers post their own hiring signal each month (October 2026 is item 49922569), so it seeds the prospect list on its own. Post links to ATS pages (boards.greenhouse.io, jobs.lever.co, jobs.ashbyhq.com) reveal board tokens the company itself published, which feeds sources 2 and 4. Use Algolia (hn-algolia) only to find the thread id. Drop the poster's email and name on ingest: posts are written by individuals.
2. **greenhouse-board: Greenhouse Job Board API.** The best-documented public ATS API: its endpoints, parameters and example responses were read in the vendor's own docs source (the grnhse/greenhouse-api-docs repository). Docs: "Job Board data is publicly available, so authentication is not required for any GET endpoints." Gives open-role counts, departments, offices and `updated_at` per company, which is exactly the "actively hiring, and in which functions" signal a recruiter wants. No rate limit documented; self-limit to one request a second.
3. **companies-house-bulk: Companies House Free Company Data Product (UK).** The only scalable, clearly licensed agency list found: a monthly CSV snapshot, free, company-level data only, reported on a Companies House support page to be under the Open Government Licence v3.0 (other catalogue records word the licence differently, so confirm on the download page). Filter Active companies with SIC 78200 (Temporary employment agency activities) or 78109 (Other activities of employment placement agencies), both labels confirmed in Companies House's own enumerations, to get UK recruitment and staffing firms. Then read each firm's own website for a role-based contact. Covers the half of the business (agencies) that every other free source serves poorly.
4. **lever-postings: Lever Postings API.** Same adapter as Greenhouse, and the README says outright "These jobs may be scraped by third parties", the clearest third-party-access statement of any ATS vendor. EU accounts use api.eu.lever.co.
5. **jobicy-api: Jobicy Remote Jobs API.** The aggregator with the clearest permission text: you "may use Jobicy listings in your own products and user experiences without requesting individual permission", no key, 200 jobs per call, last seven days, verified field list. Poll at most hourly. Gives a broad stream of freshly hiring remote employers, including ones with no ATS API. Caution: its fair-use text bars services that "negatively affect employers", so keep outreach low-volume, one-to-one and owner-reviewed, and never repost a listing.

**Next five:** dol-lca-disclosure (LA-focused US employer intent; drop all EMPLOYER_POC columns), ashby-posting-api, smartrecruiters-posting, uk-sponsor-register, remotive-api. SEC EDGAR and OpenStreetMap add small agency lists for the US and for cities.

## 3. Verdict table (use-now and needs-owner-action)

| Source | Finds | Auth | Limit or term that matters | Verdict |
|---|---|---|---|---|
| greenhouse-board | employers | none | no limit documented; no terms for GET | use-now |
| lever-postings | employers | none | limit only on apply POST (2 per second) | use-now |
| ashby-posting-api | employers | none | no limit documented; honour isListed | use-now |
| smartrecruiters-posting | employers | none | docs conflict on auth; 10 per second customer API | use-now |
| workable-public | employers | none | no public limit; docs inconsistent on url fields | use-now |
| recruitee-careers | employers | none | fields mostly unverified | use-now |
| personio-xml | employers | none | XML; "You don't need credentials" | use-now |
| teamtailor-rss | employers | none | 100 jobs per feed, page with offset | use-now |
| pinpoint-json | employers | none | key names unverified | use-now |
| hn-firebase | employers | none | no rate limit | use-now |
| hn-algolia | employers | none | 10,000 per hour per IP; 1,000 hits per query | use-now |
| remoteok-api | employers | none | link back and name Remote OK or API access is suspended | use-now |
| remotive-api | employers | none | 4 requests a day advised; 24 h delay; attribution | use-now |
| wwr-rss | employers | none | attribute links back | use-now |
| arbeitnow-api | employers | none | link back; revocable at any time | use-now |
| himalayas-api | employers | none | free incl. commercially; link back and credit; no resubmission; poll daily | use-now |
| jobicy-api | employers | none | hourly polling; keep Jobicy URL | use-now |
| companies-house-bulk | both | none | OGL v3.0; monthly | use-now |
| dol-lca-disclosure | employers | none | quarterly; contains personal contact columns | use-now |
| sec-edgar | both | none | 10 requests per second; declared User-Agent | use-now |
| wikidata-sparql | both | none | CC0; descriptive User-Agent | use-now |
| openstreetmap-overpass | agencies | none | ODbL; tiny volumes | use-now |
| schema-org-jobposting | employers | none | method; robots.txt; one page per company | use-now |
| company-sitemaps | employers | none | method; robots.txt; weekly | use-now |
| agency-company-websites | both | none | contact-page method | use-now |
| themuse-api | employers | free key | 500 per hour anonymous, 3,600 with key; terms unclear | needs-owner-action |
| jooble-api | employers | free key | terms not found; per-country key | needs-owner-action |
| usajobs-api | employers | free key | low value for Amber | needs-owner-action |
| jobtech-jobstream | employers | none | licence unconfirmed; Sweden | needs-owner-action |
| francetravail-offres | employers | free key | account and licence; France | needs-owner-action |
| canada-jobbank-opendata | employers | none | licence unconfirmed; monthly CSV | needs-owner-action |
| uk-sponsor-register | employers | none | licence line to confirm | needs-owner-action |
| ireland-wrc-register | agencies | none | reuse terms to confirm | needs-owner-action |
| hk-labour-ea-list | agencies | none | disclaimer to read | needs-owner-action |

Terms, rate limits, attribution wording, fields and notes for each are in `03-sources.json`.

## 4. Notes by group

**Public ATS APIs (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee, Personio, Teamtailor, Pinpoint).** All are read-only GET feeds meant to power a company's own careers page. None documents terms for third-party readers, so `commercialUse` is "unclear" for all. Common rules: never call the apply endpoints; never use the customer-only APIs (Greenhouse Harvest, Lever Data, Teamtailor API, Recruitee Core, Workable /spi/v3, Personio Recruiting API), which need a credential belonging to the employer; keep title, location, URL, department and dates, and do not republish descriptions. Watch the personal fields: SmartRecruiters returns a `creator`, which is a person. Documentation conflicts to test on the first live call: SmartRecruiters (no-auth versus key), Workable (`url` versus `application_url`), Ashby (where `compensation` sits), Greenhouse (whether `content` arrives entity-escaped is unverified).

**Aggregators.** Their terms are explicit and mostly about attribution. Remotive: "Please link back to the URL found on Remotive AND mention Remotive as a source", and displaying jobs to collect signups or emails "constitutes a breach". Remote OK: link back and name the source or "we'll have to suspend API access". Jobicy: keep the canonical URL, and "Do not use Jobicy data to create spam networks, misleading job databases, or services that negatively affect employers". Himalayas (official README, field list verified): "The API is free to use, including commercially", with a link back to each job and credit as the source wherever displayed, and no resubmission to other aggregators. Arbeitnow: link back, revocable at any time (section 11 of its terms). Because Amber will contact employers, not display jobs, internal use with provenance is the sensible path; never quote a listing in outreach. The Muse and Adzuna are the gated ones: The Muse's licence is for building "Apps", so the owner must read it when registering; Adzuna's terms allow only a 14-day trial for other commercial uses and say commercial users may not use the data "for ongoing work without written consent", so it is **restricted** until Adzuna agrees in writing.

**Government job APIs.** USAJOBS is free with a key, but federal agencies do not buy outside sourcing. JobTech (Sweden) and France Travail are single-country. Canada's Job Bank is a monthly CSV. EURES is closed to non-partners (below). None is a priority for an LA start.

**Datasets.** Companies House and the UK sponsor register cover the UK. The DOL disclosure files are quarterly Excel files and list US employers with named roles and worksites; the layout PDFs include an Employer Point of Contact block with an email field: drop every EMPLOYER_POC column and any attorney or agent columns on import. SEC EDGAR needs a declared User-Agent and no more than 10 requests per second. Wikidata is CC0 but thin on small agencies. OpenStreetMap is ODbL, with 10,000-query and 1 GB daily guidelines that the wiki says to divide by 100 for regular use.

**Agency directories and registers.** Association directories (ASA, REC, APSCo) show no reuse terms, so they are manual lookups only. Government registers (Ireland WRC, Hong Kong Labour Department) are public but their reuse terms are unconfirmed. Singapore's directory lists named, photographed individuals, which must not be collected. Trade-association and register entries are best used to validate a firm already found, then to find its website.

## 5. Building a prospect list lawfully

No ATS has an enumeration endpoint (Greenhouse's docs list none; the others document none). Tokens are the last path segment of a company's hosted board URL, and Lever says a site is "usually your company name with no spaces". Lawful ways to learn them:

1. Parse ATS links in Hacker News hiring posts (public company URLs, no personal data).
2. For each company found in any source, open its own careers page once and record the ATS link it publishes.
3. Read the job URL fields where a feed exposes them (Jobicy exposes the original ATS URL only on its paid key, so it will not help at $0).
4. Owner-run manual searches, for example by ATS host name plus "Los Angeles". Do not automate search-engine scraping.
5. Optionally the Common Crawl URL index for ATS host prefixes (the query syntax is documented in pywb's CDX Server API, but that Common Crawl's public server accepts it is unverified; the source is rated restricted because its terms put legal responsibility on the user, and its README says S3 API access needs an authenticated AWS account, which would be an owner signup).

Never brute-force or dictionary-guess tokens, and never probe a vendor's customers through certificate logs. Cache every board for 24 hours.

## 6. Lawful contact channels, and what not to do

**Order of preference.** (1) A contact or partnership form the company publishes, filled in by the owner by hand. (2) A role-based address the company publishes for business or recruitment enquiries: jobs@, careers@, hello@, info@, partnerships@. (3) A postal address. Find them on the company's own Contact, Careers, Partners or Work-with-us pages; record the page URL and date as provenance.

**US.** The FTC says CAN-SPAM has no business-to-business exemption. No opt-in is required, but each message needs accurate headers, a non-deceptive subject, a valid postal address and a working opt-out honoured within 10 business days.

**UK.** The ICO says PECR's email consent rule does not apply to corporate subscribers (companies, LLPs), but sole traders and some partnerships count as individuals, and if unsure you should treat them as individuals. Identify yourself and offer an opt-out either way. Companies House data covers companies, not sole traders.

**EU and Canada.** Not researched. Several EU countries are stricter than the UK (Germany is the usual example), and Canada has its own anti-spam law; take advice before outreach there.

**Never:** guess first.last@ addresses; use email-finder or verifier services; copy emails out of job posts, HN comments, DOL contact columns or ATS payloads; message a named hiring manager found through a job post; use a registry's regulator or enquiry address (for example the Irish WRC licensing mailbox) to reach agencies; script form submissions; keep contacting after an opt-out; send before the owner has reviewed the draft. Keep a suppression list and the provenance of every lead.

## 7. Do-not-use and restricted list

- **LinkedIn** (do-not-use): User Agreement Section 8.2 bars scraping, bots and copying profiles; profiles are personal data.
- **Indeed** (do-not-use): Terms Section 21 bars automated access except as robots.txt permits, and bars scraping for AI training; the developer terms restrict building databases.
- **EURES** (do-not-use): only recognised EURES partner organisations may extract data with the API or similar tools.
- **Bundesagentur Jobsuche** (do-not-use): unofficial; a shared public client id; no official API or terms.
- **BambooHR** (do-not-use): the documented ATS API needs customer OAuth; a public careers JSON is not documented.
- **Breezy** (do-not-use): documented API is token-bound to one company; no documented public feed.
- **Adzuna** (restricted): written consent needed for ongoing commercial use.
- **We Work Remotely API** (restricted): "scraping, copying, saving, or storing our data is strictly prohibited". Use the RSS feed instead.
- **Careerjet** (restricted): a publisher API for showing jobs to end users, with IP allowlisting.
- **JazzHR** (restricted): the key and XML feed belong to the customer.
- **Common Crawl** (restricted): the terms tell users to take legal advice before commercial use and bar collecting personal data; heavy to build.
- **Web Data Commons JobPosting tables** (restricted): "for research purposes only", and 2023 data.
- **ASA, REC, APSCo, Singapore MOM directories** (restricted): manual lookup only.
- **Bought lists and data brokers** (never): the brief forbids them, and they are person-level data.

## 8. Build guardrails and first-live-call checks

**One lead record for every source:** employerName, employerDomain (if known), source id, sourceUrl, retrievedAt, termsCheckedOn, openRoleCount, roleTitles, locations, firstSeen, lastSeen, attribution text. No person fields.

**Guardrails.** One rate limiter per host, default one request a second, lower where a source says so (Jobicy hourly, Remotive four a day, Himalayas daily, SEC ten a second at most). Cache everything. Check robots.txt before touching any page that is not an API. Send a User-Agent naming Amber Global Recruiting and a role-based address. Use a field allow-list per source and drop everything else, with an email and phone scrubber as a second net. Store the attribution string and show it wherever aggregator data appears. Keep a dated copy of each source's terms text and a per-source kill switch. On HTTP 403 or 429, stop and back off; do not retry in a loop or switch hosts.

**First live call per source (things the documentation left open).** Greenhouse: is `content` entity-escaped? SmartRecruiters: does the list answer without a key? Workable: which of `url` and `application_url` is the job page, and what wraps the jobs? Ashby: key spelling under `address.postalAddress`, and where `compensation` sits. Lever: is the list a bare array? Algolia: the hit field names and the author tag form for the hiring threads. Himalayas: the README documents offset paging while its site docs prefer cursors, so read openapi.json first. Recruitee, Pinpoint, Teamtailor, USAJOBS, The Muse, Jooble: confirm every key name.

## 9. Owner actions, risks and gaps

**Owner actions.** (a) Request a free key from The Muse and read its API terms; (b) optionally Jooble, USAJOBS and France Travail, all low priority; (c) read the licence line for the UK sponsor register, Canada Job Bank, JobTech, the Irish WRC list and the Hong Kong list; (d) read Hacker News's terms once (not verified here); (e) ask Adzuna for written consent only if its data is wanted.

**Three main risks.**
1. *Terms for public job data are unclear.* Public is not licensed. A vendor may block, change or object. Mitigate with low volume, internal use, no republishing, provenance on every record, and a kill switch per source.
2. *Personal data entering the pipeline.* HN posts, DOL contact columns, SmartRecruiters `creator`, JobTech ad contacts and Singapore personnel lists all carry individuals' details. Use field allow-lists, never deny-lists.
3. *Unverified shapes and a token bottleneck.* Fourteen samples are partly or wholly unverified (recruitee-careers, pinpoint-json, wwr-rss, themuse-api, jooble-api, usajobs-api, jobtech-jobstream, francetravail-offres, canada-jobbank-opendata, sec-edgar, hk-labour-ea-list, dol-lca-disclosure, remoteok-api, hn-algolia hits), so run one careful live call per source before trusting a parser; and ATS coverage grows only as fast as lawfully discovered tokens.

**Gaps.** Not researched: US state agency licensing, EU and Canadian outreach law, Philippines and India agency registers, Reed.co.uk (no public documentation found), Glassdoor and ZipRecruiter (assumed closed; not read). Hacker News's own terms and Greenhouse's rate behaviour need a first-hand check.
