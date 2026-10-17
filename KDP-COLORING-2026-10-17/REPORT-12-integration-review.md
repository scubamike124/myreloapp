# Report 12: the three named KDP tools, read against their source (and what was found beyond them)

Written 2026-10-17 21:20Z for the owner's standing instruction: "Verify the repositories, licenses, dependencies, security, and actual capabilities. Do not assume a project works because its README says it does." Nothing here ran against Amazon, no amazon.* host was contacted, nothing was logged into, and no repository code was installed anywhere near production. Evidence tags: **[V]** I checked it myself in the source; **[A]** reported by the review agent from the source and its own local runs (the full notes with file:line for every row are in `evidence/REVIEW-NOTES-three-repos.md` and `evidence/REVIEW-NOTES-alternatives.md`; the repositories were read at the commits named below); **[U]** could not be verified.

## Answer

**None of the three can be installed or run against the Amber One Press account.** Each one breaks Amazon's rules for software agents (Conditions of Use, "Agents", updated 2026-08-14) in a way that is in its code, not in a setting: it hides that it is automated, or it never says it is an agent, or both. None lets the owner sign in from an iPhone. All three also choose declarations for the account holder by default. One does not run at all, one has no licence, and the third is the only one whose licence lets code be reused.

**So the decision under item 2 of the instruction ("if none suitable, continue improving our current KDP system") is: keep and extend Amber's own compliant flow (amberai #880 to #883, and the pipeline and EPUB work after them), and take ideas, not code.** The one reusable thing, the MIT-licensed `ekr0/auto-kdp`, offers logic Amber already has in its own form (listing validation, description cleanup, one pricing field); it is noted below for later, not ported now.

## The three, side by side

| Question | ekr0/auto-kdp (fc9d24f, 2026-10-15) | joshyattridge/amazon-kdp-skill (9194489, 2026-07-05) | sabbonzo/kdp-autopublish (efbfcf1, 2026-05-31) |
|---|---|---|---|
| Works today? | Compiles; 95 unit tests, 93 pass in UTC and all 95 with the Pacific time zone its two date tests assume [A]. The tests use a fake page, so **no selector has ever been exercised** (its README says so) [A]. Newest KDP-facing edit to content/metadata selectors: 2024-06 [A]. | Fails its own type check (6 errors); one references a variable out of scope in the live wizard, a runtime error [A]. No tests, no CI; its README calls it "Buggy" [A]. | **Does not run: all six Python files fail to parse [V].** Three imported modules are missing; no requirements file [A]. |
| Formats | Paperback only [A]. | Details, categories and pricing for Kindle, paperback, hardcover; the content wizard is paperback only [A]. | Kindle e-book only [A]. |
| API or browser | Browser (Puppeteer). No API [A]. | Browser, plus replay of undocumented Amazon report endpoints with saved cookies; its own docs admit there is no public API [A]. | Browser (Playwright). No API [A]. |
| Licence | MIT file; `package.json` says ISC [V]. | **No licence file: all rights reserved, nothing may be copied [V].** | MIT file, but every source header says "All rights reserved" [A]. |
| Cloud (Railway) | Possible with work: needs a virtual display for uploads, a volume, and a no-sandbox setting as root [A]. | Needs a virtual display; binds every network interface with no authentication [V for the binding line] | No: headed browser, blocking prompts, Windows paths [A]. |
| iPhone sign-in | No: the sign-in window must be on the machine that runs it; cookies stay in a Chrome profile [A]. | No: 10-minute sign-in in a visible window; cookies saved in plain text [V for the flag and the plain-text write path, A for the rest]. | No: waits for a manual login and saves cookies in plain text [A]. |
| Amazon's agent rules | **Fails.** Imports the stealth plugin [V: src/browser.ts:2], which rewrites the browser's identity and hides the automation marker; no `Agent/` label anywhere [V]. | **Fails.** Launches Chromium with `--disable-blink-features=AutomationControlled` in four places [V]; no `Agent/` label [V]; clicks through Amazon's "Server Busy" page automatically [A]. | **Fails.** Sends a spoofed Windows Chrome identity [V: kdp_publish.py:410, kdp_scraper.py:299]; no `Agent/` label [V]. |
| Declarations it makes for you | Free ISBN assigned, not-public-domain and not-adult ticked, AI use answered "No", accuracy box ticked, Approve clicked; **publishes with no prompt** in its all-in-one command [A]. | Always assigns an ISBN, forces Premium Colour, rewrites the release date on every metadata save, ticks the AI box; the publish guard falls back to "save and continue" or any submit button [A]. | AI use "No", adult content "Yes", a stranger's author name by default; its no-draft option publishes without confirmation [A]. |
| Security | No secrets or telemetry; runs a shell command taken from a CSV; 12 high advisories in transitive dependencies; stealth stack unpublished since 2023 [A]. | Any process that can reach its port can publish or delete (open CORS with credentials, no auth); a spreadsheet library with a high advisory and no fix [V for the listener, A for the rest]. | No network code; plaintext cookies and a database on disk; bare `except: pass` hides failures [A]. |

## What would be worth taking, and under what terms

- From **auto-kdp** (MIT; the notice in `LICENSE` would travel with any code): the resolver for `${var}` templates, its field-length validation, its description cleanup, its 14-marketplace price table and its retry runner [A]. Amber has its own listing validation, description conversion and a one-field USD price today, so none of this is needed for Book 1. The marketplace table is the one idea worth keeping for when prices must differ by country.
- From **amazon-kdp-skill**: ideas only, rewritten independently: read the page back after every save (it does this for pricing), and keep a minimum gap between requests. No code, because it has no licence.
- From **kdp-autopublish**: nothing.
- **Avoid in any form:** the stealth plugin and the automation-hiding flag, the spoofed identity, clicking through "Server Busy", automatic ISBN, Approve and declaration choices, an open local server, `:contains()` selectors, and any command that publishes without a typed confirmation. Amber's own flow already does the opposite of each (see `kdp/cloud/README.md`).

## Not verified

No selector in any of the three has been checked against live KDP (no Amazon access), and the agent could not confirm that Chrome rejects the jQuery-style `button:contains()` selector auto-kdp uses for its Publish button [U]. Open issues, pull requests and star counts were not read [U]. The behaviour of the three modules kdp-autopublish imports but does not contain is unknown [U].

## Alternatives beyond the named three

A second review searched for other Claude Code skills, MCP servers, API routes and open-source KDP helpers (about 55 repositories cloned shallow and read; none of their code was run against Amazon). Its evidence tags are the same: **[A]** is the review agent's reading, **[V]** I ran or checked it myself.

**Bottom line: nothing found is a compliant, headless, phone-authorised KDP uploader, and no public KDP publishing API turned up.** What is useful is offline: validators, cover maths and safe-flow designs.

| Project (licence) | What it is | Fit |
|---|---|---|
| KanadeK/proofmill (MIT) | Print-PDF preflight for paperbacks: trim and bleed, page count, embedded fonts, safe area, image DPI, cover size from spine maths. No network code [A]. | **Used as a check: see "Run on Book 1" below.** |
| pabygon/kdp-cover-preflight (CC-BY-4.0) | Cover and spine maths, paperback and hardcover, four paper types [A]. | **Used as a cross-check: matches Book 1's cover size [V].** Its hardcover constants disagree with another calculator, so verify those against Amazon's calculator before anyone relies on them [A]. |
| beyondtahir/beyondwords (MIT, 15 days old, 83 stars that may be promotional) | Attended Playwright tool with a hash-bound plan, a typed `APPROVE <plan-hash>`, an execute journal, and a release gate that must hold a ten-key owner record before any publish click [A]. | **Design to learn from, not a dependency** (Python, mass-AI-book scope). Amber already binds approval to a digest of the files; the same idea gives the iPhone approval page a plan hash to show. |
| ocrosby/claude-config `skills/kdp` (MIT) | Playwright paperback pre-fill that never clicks Publish and uses semantic locators [A]. | Reference for the locator pattern and the "never publish" stance. |
| pushkar-mishra/BookForge (MIT), LaFerraille/kdp-book-creator (MIT) | Markdown to paperback and EPUB pipelines, with EPUBCheck in the build [A]. | References only; Amber's EPUB builder (amberai #886) already passes the W3C validator in CI. |
| alanherron/kdp-cover-math (MIT), anicolao/mathpub (GPL-3.0) | A narrow cover calculator with tests; an interior-and-cover uploader for an existing draft, hash-bound, fail-closed, cannot publish [A]. | Oracle for tests; design only (GPL means no copying). |

**Rejected, by reason** [A]: stealth, automation-hiding flags or human mimicry (eight repositories, among them AlfaOtto/kdp-automation-studio, tenlifejosh/agentreach, victorpreston/amazon_kdp_upload_automation, duccoicbn/kdp-agent, BrahimAkar/Amazon-KDP-Automater); CAPTCHA solving, account creation or scraping with rotating identities (jc-hello/amazon-registration-tool, rxpelle/kdp-scout); stored passwords or a stored one-time-code secret (adw495/kdp-autopublisher, encrypter15/kdpsubmissionbot); unauditable or unlicensed (mindattic/KdpPublish, closed browser extensions); abandoned or stubs (misarb/SpiderKDP, whodeanie/kdp-listing-publisher, others).

**Is there an API?** No public KDP publishing or listing API was found; independent projects and commercial uploaders all drive the website [A]. The Amazon Ads API is real but advertising only [A]. The Selling Partner API is for sellers; whether it reaches KDP titles is unverified [U]. **PublishDrive does publish API documentation**: I read its Distribution API page directly in scan batch 176 (a production and a sandbox base URL, an `apikey` header; the review agent could not reach that host and so called the claim unverified, which is a gap in its access, not a contradiction). IngramSpark and Draft2Digital: no public title-setup API found [A].

### Run on Book 1 (independent checks, 2026-10-17 21:30Z, nothing sent anywhere)

| Check | Result |
|---|---|
| ProofMill 0.1.0, profile `kdp-paperback`, interior: 8.5 x 11 in, black ink, white paper, 104 pages | **PASS: 0 errors, 0 warnings**; two notes that the two fonts are embedded as subsets. Its SHA-256 of the file equals the one in `SHA256SUMS` (9b395c9d...) [V] |
| ProofMill, cover: 104-page spine, 8.5 x 11 in | **PASS: 0 errors, 0 warnings**; SHA-256 equals ours (7a3619be...) [V] |
| pabygon's cover maths, 8.5 x 11, 104 pages, white | 17.4842 x 11.25 in = **1258.86 x 810.00 pt**, spine 0.2342 in, spine text allowed: the same size as the cover file and as Amber's own QA check [V] |

How these were run: the tools' two Python dependencies went into a throwaway virtual environment, ProofMill ran from its source folder with no install of the package, and the cover maths ran as plain functions; nothing was copied into amberai. **Limits:** both calculators use the same published spine factor (0.002252 in per page for white paper) as Amber's own, so agreement on the cover size is a consistency check, not an Amazon confirmation. The ProofMill measurements of the actual PDF files (trim, fonts, safe area) are independent of Amber's code. Amazon's Previewer is the final word and has not been seen.

### What this changes

- **Nothing is adopted as a dependency.** ProofMill can be re-run on any future package the same way; a small sidecar script would make that repeatable and is worth doing when a second book exists.
- **Approval design:** the iPhone approval page (cloud route) should show a plan hash and the pre-check summary, and Amber's evidence file already provides the journal; this is the part of beyondwords worth copying as an idea.
- **E-book covers and EPUBCheck:** the EPUB work already runs the W3C validator in CI.

### Not verified

Amazon's agent clause and Terms 4.3 (secondary summaries disagree on the clause's date; Amazon's page is the source and was last read earlier today); PublishDrive, IngramSpark and Draft2Digital pages beyond the one I read; live behaviour of any tool on KDP; the contents of closed browser extensions. Popularity is thin everywhere: every candidate is under five months old and mostly single-maintainer.
