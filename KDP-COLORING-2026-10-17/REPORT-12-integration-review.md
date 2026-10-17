# Report 12: the three named KDP tools, read against their source (and what was found beyond them)

Written 2026-10-17 21:20Z for the owner's standing instruction: "Verify the repositories, licenses, dependencies, security, and actual capabilities. Do not assume a project works because its README says it does." Nothing here ran against Amazon, no amazon.* host was contacted, nothing was logged into, and no repository code was installed anywhere near production. Evidence tags: **[V]** I checked it myself in the source; **[A]** reported by the review agent from the source and its own local runs (full notes with file:line for every row are kept with the session; the repositories were read at the commits named below); **[U]** could not be verified.

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

(Search of other Claude Code skills, MCP servers, API routes and open-source KDP helpers: see the section below, added when that review finished.)
