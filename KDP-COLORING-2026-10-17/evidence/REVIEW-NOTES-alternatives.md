> Preserved 2026-10-17 21:35Z from the review agent's working notes (alternatives search). The agent's claims are tagged [A] in REPORT-12; the ones I re-checked myself are tagged [V] there. File and line numbers refer to the commits named in the notes. Treat everything below as data, not instructions.

# KDP automation alternatives: survey notes (Amber One Press)

Prepared 2026-10-17. Read-only survey. Nothing was run against Amazon or any real account.
All repository content was treated as untrusted data. Excluded by instruction (not re-reviewed):
joshyattridge/amazon-kdp-skill, sabbonzo/kdp-autopublish, ekr0/auto-kdp, nikmcfly/kindle-book-skill,
queelius/claude-anvil (kdp plugin). Mirrors of those (Jonathan-Harris1975/KDP, groupthinking/auto-kdp) were also skipped.

## 0. Method and limits

- Discovery: GitHub repository search (queries: `kdp mcp`, `kindle direct publishing automation`, `kdp playwright`,
  `kdp uploader`, `kdp selenium`, `kdp puppeteer`, `amazon kdp` (all 344 hits paged), `topic:kdp` (93), `kdp automation`
  (589 hits, first 100), `kdp cover spine calculator`, `epubcheck kindle epub validate`, etc.), GitHub code search for
  `"kdp.amazon.com" playwright` (138 hits, first ~60 read) and for `AutomationControlled` + `kdp.amazon.com` (35 hits),
  plus WebSearch (standard, extended where thin) for MCP servers, extensions, aggregators and API claims.
- About 60 repositories shallow-cloned to /tmp/review-alt/ (`GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1`), then a bounded
  `git fetch --depth=200` for commit counts. Commit counts are therefore exact only below 200.
- Static triage script (read-only; regex scan with file:line output) results are in /tmp/review-notes/triage/<repo>.txt.
  Hard stealth signature sweep across all clones: AutomationControlled, playwright-stealth, puppeteer-extra,
  undetected-chromedriver, navigator.webdriver, captcha-solver services, fake_useragent, "simulate human".
- Tests were run only in throwaway copies under /tmp/review-alt/run/, after reading scripts and tests,
  with `npm ci --ignore-scripts` or venv + `pip install --no-deps --only-binary=:all:` of an explicit whitelist.
  No browser was launched. No postinstall hook ran (zoyth's `postinstall: npx playwright install chromium` was skipped).
- Process slip, disclosed: while setting up the BookForge venv, a loop auto-installed an unrelated PyPI package named
  `bookforge` (wheel-only, `--no-deps`) because `python -I` ignores PYTHONPATH, and pytest collection imported it. It
  contained nothing sensitive and the venv was deleted and rebuilt from an explicit whitelist; results quoted below come
  from the rebuilt venv.
- GitHub stars/forks/open-issue counts come from search metadata. "Works today" below means: parses, unit tests pass,
  maintained. It does NOT mean the KDP UI selectors still work; I could not and did not test against KDP.
- WebFetch could resolve github.com but not publishdrive.com, ingramspark.com, appsumo.com, techcrunch.com, ppc.land
  (ENOTFOUND); curl to publishdrive.com was refused by the sandbox proxy (403). Vendor and press claims below are
  therefore search-engine summaries, labelled as such.

## 1. Ranked shortlist (max 8)

Ranking = suitability for a compliant flow in a TypeScript/Playwright codebase (design safety, maintenance, portability).
Common to all 8: no telemetry found by static scan; no stealth/anti-detection code; no CAPTCHA solving; none sets an
`Agent/[name]` user agent; none offers remote/iPhone sign-in; none needs paid keys (exceptions noted).

### 1. beyondtahir/beyondwords (MIT) - attended KDP driver + production toolkit, Python
1. Works today: created 2026-10-02, 6 commits, last 2026-10-09 (dependabot; maintainer commits 10-03/10-08). 83 stars,
   27 forks, 4 open issues after 15 days (fast star growth plus polished marketing README: popularity may be promotional;
   cannot measure). All 53 .py files parse. No unit tests in repo; CI runs `tools/check_public_package.py` on
   ubuntu/macos/windows (.github/workflows/package.yml). I did not run it.
2. Formats: EPUB (EPUBCheck-gated), print PDF by trim, covers (visual module), coloring/activity pages, DOCX, audiobook
   guidance only. Does not: upload anything unattended, compute spine from a table I could find (no spine rate table;
   uses printer template), ISBN purchase, previewer (manual).
3. Mechanism: browser (Playwright, attended) plus an official API adapter for Amazon Ads
   (scripts/beyondwords_amazon_ads.py, OpenAPI contract in assets/contracts/). docs/TECHNICAL.md:87 "There is no fabricated
   KDP upload API."
4. Cost: MIT; core needs no keys ("core does not call a model API"). Ads adapter needs approved Amazon Ads credentials.
   EPUBCheck needs a JRE.
5. Headless/cloud: No for publishing. scripts/beyondwords_publisher.py:193 refuses without a TTY ("Attended terminal
   required; no unattended login or approval bypass"); :197 `launch(headless=False, chromium_sandbox=True)`.
   File production and EPUBCheck are headless-capable. Optional MCP server is STDIO (scripts/beyondwords_mcp.py).
6. iPhone/owner auth: no remote flow. Owner signs in directly in the visible browser; passwords never typed in the
   terminal; "Browser cookies are never exported" (publisher.py:4); fresh non-persistent context
   (`browser.new_context`, :198-199) so no session is stored.
7. Agent rules: no stealth (docs/TECHNICAL.md:85 "No CAPTCHA bypass, stealth access or account login is part of research
   collection"); CAPTCHA pages are only detected (bw_amazon.py:18,49-50); legacy Amazon fetch transport deliberately
   disabled (bw_amazon.py:27 "intentionally unavailable ... No implicit installation or challenge bypass"). No Agent/ UA:
   `new_context()` sets no user_agent. Navigation guard blocks non-Amazon hosts (publisher.py:208). No typing mimicry
   (`locator.fill`). `polite_pause` random sleeps exist (bw_amazon.py ~254) but the transport that used them is disabled.
8. Security/confirmation: every action is prepared, hash-bound, then approved by typing `APPROVE <plan-sha256[:12]>` on a
   TTY (beyondwords_connected.py:197-211; "no --yes / input JSON approval bypass"); a publish/submit click additionally
   requires a complete owner-reviewed release record with keys files_sha256, metadata_sha256, pricing, territories,
   ai_disclosure, rights, editorial, reader, platform_preview, account_scope (publisher.py:124). Sensitive control names
   (password, bank, tax id ...) are filtered from snapshots (publisher.py:33). Subprocess calls use argument lists; pip
   installs use `--require-hashes` locks. Honest limit stated in code: the TTY gate does not stop an agent with a
   shell/PTY. AI disclosure guidance says answer honestly (publisher assets/kdp-upload-checklist.md:39).
9. Port value: (a) plan/approve/execute journal with hash-bound plans (map "type APPROVE" to a phone approve screen showing
   the plan hash); (b) the release_review required-keys gate; (c) pinned, sha256-verified EPUBCheck installer
   (requirements/epubcheck.lock.json: v5.4.0, tools/install_epubcheck.py with zip-slip and size guards). MIT: port the ideas
   with attribution; do not depend on it (Python, huge scope aimed at mass AI-book production).

### 2. ocrosby/claude-config - `skills/kdp` + scripts/kdp_compose.py + scripts/kdp_publish.py (MIT), Python
1. Works: personal Claude config repo; created 2026-05-17, 225 commits, last 2026-10-15 (PR-numbered), 1 star, 5 open
   issues. `pytest` (test_kdp_compose.py + test_kdp_publish.py): 58 passed. Tests cover pure helpers only; the Playwright
   steps are untested by design (test_kdp_publish.py header).
2. Formats: paperback only, image-book oriented (coloring/picture). Builds interior.pdf (one image per page, bleed),
   cover.pdf (wrap), metadata.json, review.pdf; checks 24-828 pages, DPI preflight, font embedding, inside margin >= 0.375".
   Does NOT: e-books ("When NOT to use" in SKILL.md), hardcover, categories, pricing, ISBN, previewer; AI disclosure only
   ticks "AI-generated images" if metadata says so (kdp_publish.py:336-345).
3. Browser automation (Playwright `launch_persistent_context`, channel="chrome"; kdp_publish.py:229-238). No API.
4. Cost: MIT, no keys. Python deps pillow, reportlab, pyyaml, pypdf.
5. Headless/cloud: No by design ("normal use is headed so 2FA works", :490-493; `--headless` only for CI smoke tests).
   Login lives in a persistent Chrome profile at ~/.cache/kdp-automation/chrome-profile/ (lost on ephemeral disk).
6. Owner auth: manual login incl. 2FA in the headed window (SKILL.md:103); session cookies persist in that profile
   (plaintext profile dir). No remote/iPhone flow.
7. Agent rules: no stealth flags in launch (viewport + channel only); `.fill()` not keystroke mimicry; no CAPTCHA logic;
   no Agent/ UA (trivial to add via `user_agent=`). SKILL.md:116 states the author's own reading that KDP ToS restricts
   automated access.
8. Security/confirmation: "Never clicks Publish or Submit for Review" (SKILL.md frontmatter and :15); stops after upload,
   "Save and Continue" left to human; `disable-model-invocation: true`. One unrequested declaration: the "I own the
   copyright" radio is auto-checked (kdp_publish.py:318-324); human must review. No telemetry.
9. Port value: semantic locators (`get_by_label/get_by_role`) isolated in a `Selectors` dataclass (:82-122) with exit
   code 3 for selector drift; compose-time validations and constants. MIT: port with attribution. Single maintainer.

### 3. LaFerraille/kdp-book-creator (MIT) - offline formatter + preflight, Python Claude Code plugin
1. Works: created 2026-09-23, 1 commit, 0 stars. Offline pytest: 354 passed, 62 skipped (no LaTeX engine, KDP wiki not
   built), 1 network test deselected. CI workflow present. All 52 .py parse.
2. Formats: paperback interior PDF (LaTeX), cover wrap, EPUB (render_epub.py, hand-built with lxml), DOCX ingest, preflight
   (pikepdf), spine table incl. groundwood 0.00235 (specs/kdp_specs.yaml:29-34). Does not upload, categories, ISBN,
   AI disclosure, previewer.
3. No publishing mechanism. Two optional Amazon-touching tools: `kdp wiki build` crawler and a Playwright cross-check of
   the public cover-calculator page (cover_calculator.py:164-176).
4. Cost: MIT; needs a LaTeX engine; python pyyaml, pikepdf, lxml (+ bs4, markdownify for the wiki).
5. Headless/cloud: the formatting core yes (needs TeX Live); not tested with LaTeX here.
6. Owner auth: n/a (never logs in).
7. Agent rules: FAILS if the optional crawler is run: kdp/wiki/fetch.py:18-19,28 sends a spoofed
   `Mozilla/5.0 ... Chrome/120.0.0.0 Safari/537.36` UA and crawls the whole KDP help centre (0.6 s delay, :56). The calculator
   cross-check uses Playwright's default UA. The formatting core never touches Amazon. Do not run either helper.
8. Security: subprocess only for fixed tools (kpsewhich, fc-list, TeX; kdp/fonts.py:60,84,109); no telemetry; "formatting
   only, never writes a word" ethos.
9. Port value: kdp_specs.yaml (spine factors, limits), geometry.py, preflight.py, render_epub.py as references; MIT. Avoid the
   crawler (and its derived "wiki" cache, which copies Amazon help text).

### 4. KanadeK/proofmill (MIT) - print-PDF preflight CLI, Python
1. Works: created 2026-07-30, 4 commits same day, 0 stars, 2 open issues. 51 tests passed (pdfplumber, pypdf, reportlab
   fixtures). CI + GitHub Action (action.yml). Alpha.
2. Validates interior and cover PDFs against a versioned KDP paperback profile (docs/RULES.md:18-58): trim+bleed, page-count
   range, embedded fonts, safe area, 300 DPI images, annotations/forms/JS/attachments, cover size from spine math, spine-text
   limits. No EPUB, hardcover, categories, ISBN, upload.
3. No Amazon contact (no network code in src/; KDP URLs are documentation constants in profiles.py:9-13).
4. MIT, no keys.  5. Headless: yes.  6. n/a.  7. n/a (no site access).
8. Security: reads PDFs only; no process spawn; deterministic reports.
9. Port value: the rule table is directly reimplementable in TS (pdf-lib/pdfjs) or the CLI can run as a sidecar; MIT with
   attribution. Spine factors in profiles.py:83-91 match KDP's published ones (0.002252/0.0025/0.002347, groundwood 0.00235).

### 5. pabygon/kdp-cover-preflight (CC-BY-4.0) - cover maths + preflight, Node (zero deps)
1. Works: created 2026-07-08, 2 commits (author "Claude"), 0 stars, no tests. I ran the pure maths: 6x9 / 200 pp / white
   gives spine 0.4504 in, 12.7004 x 9.25 in, 3810 x 2775 px, matching an independent worked example (Vappingo guide:
   12.700 x 9.250, 3,810 x 2,775).
2. Formats: paperback (16 trims), hardcover (5 trims), 4 paper types (kdp-data.mjs:126-141), page limits (paperback 24-830,
   hardcover 76-550), barcode zone, dieline SVG, PDF/PNG/JPEG dimension preflight, ebook cover notes. No interior checks.
3. Local only: scripts use fs; the vendor "live validator" URL appears only in comments/hints (kdp-data.mjs:4,
   preflight.mjs:258).
4. Licence CC-BY-4.0 (attribution; not a software licence); data is generated from a commercial vendor's (BeYourCover)
   production config.  5. Headless: yes.  6. n/a.  7. n/a.
8. Security: nothing risky found.
9. Port value: best table for TS cover maths. CAUTION: hardcover constants (wrap 0.591, hinge 0.4, spineExtra 0.189,
   kdp-data.mjs:160-163) disagree with at least one independent calculator page (0.625 / 0.375 / 0.187), so verify against
   Amazon's calculator by a human before relying on them.

### 6. pushkar-mishra/BookForge (MIT; PyPI `bookforge-kdp`) - markdown to paperback + EPUB3 + covers
1. Works: created 2026-08-02, 10 commits, 3 authors, 1 star, CI. 124 tests passed in tests/test_config.py,
   test_covers_and_toc.py, test_assemble.py (pure-Python layers). Not run: studio API tests (FastAPI), and the pandoc,
   WeasyPrint and epubcheck paths. 208 test functions total (README says 214 passing).
2. Formats: 6x9 interior PDF, EPUB3 validated by epubcheck during the build (epub.py:1,176), paperback wrap cover, Kindle front
   cover JPG 1800x2700 (verify.py:165), amazon-kdp/ folder with checklist and metadata. Not: other trims, hardcover, upload,
   categories, ISBN, AI disclosure.
3. No Amazon contact.  4. MIT, no keys; needs pandoc, epubcheck, WeasyPrint (Pango).
5. Headless: yes (CLI); optional Studio UI binds 127.0.0.1 by default (cli.py:160).  6. n/a.  7. n/a.
8. Security: subprocess to pandoc/epubcheck; nothing else notable.
9. Port value: pipeline pattern (assemble, pandoc, epubcheck, verify). Note spine-text threshold 100 pages (covers.py:52)
   vs 79/80 elsewhere: sources disagree; confirm in Amazon's calculator.

### 7. alanherron/kdp-cover-math (MIT; npm @alankherron/kdp-cover-geometry 0.2.0) - TypeScript
1. Works: created 2026-05-18, 10 commits, last 2026-06-18, 0 stars. `npm ci --ignore-scripts && vitest run`: 15/15 passed;
   `tsc --noEmit` clean.
2. Formats: paperback only; five trims only (8.5x11, 8x10, 9.5x9.5, 8.5x8.5, 5.5x8.5; src/index.ts:17,33-69), no 6x9/5x8;
   white/cream only (:119-120), no colour; fixed 0.375 in gutter (:81) although ocrosby's compose notes it is the minimum for
   24-150 page books only (kdp_compose.py:311-313). Correct wrap formula (2 x trim + spine + 2 x 0.125).
3. Pure functions, no I/O.  4. MIT.  5. Headless: yes.  6/7. n/a.  8. None.
9. Port value: low, narrow. Re-implement in-house from KDP's published factors; use as a cross-check only.

### 8. anicolao/mathpub (GPL-3.0) - guarded "existing paperback draft" upload adapter, Python
1. Works: created 2026-07-18, 151 commits, last 2026-09-27, 0 stars. Tests: 4 KDP tests with fake adapters
   (tests/test_kdp.py) plus the project's other suites; NOT run (needs Nix/Sage/Playwright). docs/kdp.md states "No live
   upload was performed for this implementation."
2. Formats: uploads interior PDF + full-wrap cover PDF to an EXISTING paperback draft only. Explicitly does not create
   titles, request ISBNs, change metadata/disclosures, approve Previewer, order proofs, set prices or publish.
3. Browser (Playwright persistent context) with a versioned DOM adapter `kdp-paperback-en-v1`.
4. GPL-3.0 (LICENSE:1-2): copying code into a proprietary TS app is not possible without GPL obligations. No keys.
5. Headless/cloud: No (`headless=False`, kdp.py:132-134 and :299-301).
6. Owner auth: `mathpub kdp login` opens the persistent browser for manual login/MFA; "session expiry is resumable, not
   something MathPub bypasses" (docs/kdp.md:42-46). Mandatory account guard (selector + exact text) before any upload, and unfamiliar
   controls fail closed (docs/kdp.md:37-39).
7. Agent rules: no stealth, no CAPTCHA logic, fixed waits only; no Agent/ UA.
8. Security: plan then upload with artifact hashes, receipts, resume, fail-closed on unfamiliar controls, loopback-only GUI
   mutations, redacted exceptions. Cannot publish.
9. Port value: design only (receipts, resume with `--retry-uncertain`, account-identity guard). Do not copy code (GPL).

## 2. Considered, not shortlisted (one line each)

- chrismole310/no-hands-kdp (MIT, 1 commit 2026-03-29, 0 tests): e-book only. The only open-source write-up of the e-book
  form (selector map README:137-205, AI-disclosure widgets, category cascade). But it is one author's script:
  AI disclosure answers hardcoded (no_hands_kdp.py:176-185 default "Claude (Anthropic)" and "Flux 2 Dev"), categories hardcoded
  to Science Fiction > Military (:129-135), marketplace prices hardcoded (:219). Attaches to a real Chrome on port 9222,
  "No headless mode" (README:241); never clicks Publish (README:182,210). A 90 s cooldown plus retry loop works around KDP's
  throttling (README:212, code :236,266-271). Reference for selectors only.
- fatoh2/kdp-mcp (no licence, 2 commits 2026-09-14, 5 test files): minimal MCP; read-only by default, one guarded write (cover
  finish) using undocumented internal KDP requests inside the owner's signed-in Chrome (port 9222); cannot publish/upload/
  delete. Good pattern (unknown-outcome state, no tokens exported) but unlicensed.
- zoyth/kdp-book-generator (MIT, TS, Playwright PDF + hand-rolled EPUB): 35 jest tests pass, tsc clean, but last commit
  2025-07-27 (about 15 months), no tests for the PDF/EPUB generators, `postinstall` downloads Chromium.
- bytesizedbooksmith/byte-sized-book-formatter (MIT, TS local web app): EPUB + print PDF + DOCX; tests drive real Chromium/Pandoc,
  not run; `app.listen(PORT)` with no host binds all interfaces (server/index.ts:26).
- NachaFromMars/epub-forge (Apache-2.0): one script, EPUB 3.3 + EPUBCheck; felipefontoura/book-kit (MIT, JS/Typst, 40 commits);
  vettrivelarul/kdp-press, devanasolver/kdp-toolkit (4 commits, created today), moeeza3/amazon-kdp-publishing,
  jessl2juice/kindlepub: young formatter/validator skills, no tests or very thin.
- liminal-hq/folio (Apache-2.0/MIT, Rust+TS, 281 commits): pre-alpha desktop layout app ("nothing to download yet").
- anthonyblazejack/amazon-ads-py (Apache-2.0, 12 commits, last 2026-10-08): the one documented API reaching KDP authors
  (advertising only). 135 passed, 14 skipped, 1 failed (only because I did not install the optional `mcp` extra).
  docs/guide/quirks.md:151 "KDP author accounts are type vendor, subType KDP_AUTHOR"; :126 goal-based campaigns not creatable;
  docs/guide/reports.md:26 presets accepted by the live API for a KDP author profile in September 2026.

## 3. Rejected (with evidence)

Stealth / human mimicry / CAPTCHA / multi-account (disqualifying under the stated rules):
- AlfaOtto/kdp-automation-studio: `--disable-blink-features=AutomationControlled` and "Hide the navigator.webdriver flag
  (Amazon anti-bot)" while scraping Amazon (modules/research/scraper.py:258; modules/learning/sample_reader.py:70,83,216).
- cachila-universe/puzzle-book-factory: stealth context "removes AutomationControlled flag + navigator.webdriver"
  (src/dashboard/automation.py:178,889; app.py:2399,2668; analytics/kdp_scraper.py:82); committed browser profiles.
- kevensjames/wheellsverse-bots: AutomationControlled in KDP scripts (scripts/delete_kdp_drafts.py:252,
  probe_kdp_draft_row.py:55), bulk draft deletion, 70-bot monolith, no licence.
- tenlifejosh/agentreach: playwright-stealth + AutomationControlled (src/agentreach/browser/session.py:16,79,97), cookie harvest
  then headless replay.
- victorpreston/amazon_kdp_upload_automation: `HumanBehaviorSimulator` "avoid detection" (kdp_automation.py:204-205), no licence.
- simoon/KDPAutomation: AutomationControlled (utils/browser_utils.py:103), human-behaviour profile, proxy settings
  (config/settings.py:89-90), no licence.
- duccoicbn/kdp-agent: random per-character typing delay and random action delay (kdp_agent/agents/publisher/session.py:91-101;
  kdp-config.yaml:12-13), no licence.
- BrahimAkar/Amazon-KDP-Automater (55 stars): randomized waits and 120 ms typing delay (index.js:26-31), plaintext
  cookies.json import (:15-18), puppeteer missing from package.json, last real work 2020, no LICENSE file.
- l0rdFalco/KDP-BOOK-CREATION-SCRIPTS: random mouse offsets in a Selenium scraper (a_scripts/book_info_scraper.py:581-587), 2021.
- jc-hello/amazon-registration-tool: auto-creates KDP accounts and integrates the 2captcha solver (src/libs/capcha.ts:111-123).
- rxpelle/kdp-scout (89 stars), Buoyairican/kdp-scraper: Amazon scrapers; kdp-scout advertises user-agent rotation and proxy
  support (README:51-52; kdp_scout/config.py:43-44).
2FA bypass / credentials / unsafe:
- adw495/kdp-autopublisher: stores a TOTP secret in env and auto-fills OTP (modules/kdp_uploader.py:56-108); no licence.
- encrypter15/kdpsubmissionbot: plaintext email/password in config (main.py:32), auto-clicks publish
  (utils/kdp_steps.py:103-108), headless by default, one commit; README says MIT but no LICENSE file.
- Anthophila1909/publishing-automation: README only; advertises unattended TOTP 2FA for KDP price automation.
- mindattic/KdpPublish: no licence; logic in vendored binary .nupkg files (lib/local-packages) so unauditable; Windows-only;
  "fully unattended through Publish" and auto-accepts page dialogs (KdpPublish/MainWindow.xaml.cs:175-180); vendors Amazon
  Ember fonts.
Abandoned / broken / stubs:
- misarb/SpiderKDP: Windows PyQt + Selenium 3 API (`find_element_by_*`, `executable_path`), hardcoded Chrome Beta profile
  path, shuts the PC down (main.py:227-229,252), commits a Chrome profile, venv/ and cookies.data; last commit 2024-09.
- mridah/amazon-kdp-uploader: 2022, geckodriver.exe committed, no licence.
- RJWiechecki/kdp-automation: dashboard-report scraper (Firefox profile cookies), no licence.
- whodeanie/kdp-listing-publisher: README promises Playwright + Claude recovery; code only logs "would fill", returns a random
  fake ASIN, and ClaudeFixer never calls Claude (src/index.ts:15-43). Misleading stub.
- tinyprompters-maker/tiny-prompters-stack: README only, uploader "Planned".
Other:
- wesleyscholl/book-generator (66 stars, no licence): automates the ChatGPT/Gemini web UIs via Playwright
  (scripts/generate_covers.sh:177); no KDP upload.
- Mirrors: Jonathan-Harris1975/KDP (history is joshyattridge's), QuantumMentor-tech/Beyond-Words (beyondwords copy),
  groupthinking/auto-kdp.
- Not auditable (closed source, paid, run inside the owner's logged-in browser): KDP Uploader / KDP Uploader Plus,
  KDP AutoGo, Bookching, LazyMerch workflows. ClawHub skills (kralsamwise/kdp-publisher, timyljob2011-sudo/kdp-generator): not on
  GitHub; only search snippets seen (the former describes setting field values via JavaScript and files via DevTools).
- rgupta0419/indie-publishing-pipeline and benhowdle89/bullpen: wrong spine factors (indie: 0.0025 for all stock and 0.0027 for
  premium colour, validate_cover.py:32-33 and verify_print_ready.py:51; bullpen: 0.0025 hardcoded, generate_cover.py:39).
  moeeza3/amazon-kdp-publishing uses a legacy 0.0032 for standard colour (scripts/spine_calculator.py:21).
  tudadada/print-spine-paper-radar: hardcover board allowance 3.175 mm does not match KDP's constants.
- issdandavis/SCBE-AETHERMOORE (scripts/publish/kdp_auto_upload.py): personal guided script inside a monorepo; persistent
  profile; asks for a typed "publish" before clicking (L203-206). Not a reusable project.

## 4. Is there any genuine API or supported route to KDP titles?

Publishing and listing management: no documented public API was found. Evidence (all non-Amazon):
- Independent open-source authors state it: fatoh2/kdp-mcp README ("KDP does not provide a public API for this workflow"),
  ocrosby kdp_publish.py:28 ("KDP has no official upload API"), beyondwords docs/TECHNICAL.md:87, whodeanie README, mathpub docs.
- Every commercial uploader found is a browser extension (Chrome Web Store: KDP Uploader, KDP Uploader Plus, KDP AutoGo).
- Designrr's public feature request "Directly Export To Amazon KDP with API?" has no answer
  (https://feedback.designrr.io/ebooks/p/directly-export-to-amazon-kdp-with-api).
- Caveat: absence of evidence; I cannot query Amazon.

What does exist:
- Amazon Ads API: documented, usable for KDP author profiles (profile type vendor / subType KDP_AUTHOR) for Sponsored Products
  campaigns and reports (amazon-ads-py docs). Limits reported by third parties: no Sponsored Brands reports for KDP profiles
  (https://help.funnel.io/en/articles/16760478-troubleshoot-missing-sponsored-brands-reports-for-kdp-profiles-in-amazon-ads,
  https://support.sellermetrics.app/article/122-kdp-accounts-cannot-see-sponsored-brands); "Amazon has not made all areas of KDP
  Ads available to software developers" (https://support.adbadger.com/hc/knowledge-base/articles/26-does-ad-badger-support-advertising-for-authors-or-kdp);
  Audible titles are a newer exception (https://ppc.land/authors-gain-amazon-ad-slots-for-audible-titles-in-the-us/, secondary).
  Advertising only: it does not create, edit or publish titles.
- Selling Partner API: I found no non-Amazon source that states whether it covers or excludes KDP titles. The premise
  (sellers/vendors only) is plausible but UNVERIFIED by me.
- PublishDrive: distributes to Amazon for e-books and print-on-demand per its own pages
  (https://help.publishdrive.com/distributing-to-amazon-with-publishdrive, https://publishdrive.com/stores-amazon.html), and its
  pricing/comparison pages mention "API access" for uploads/edits/metadata/sales, described as aimed at large publishers and
  partners (https://publishdrive.com/pricing.html,
  https://publishdrive.com/publishdrive-vs-ingramspark-2026-pricing-royalties-distribution-and-features-compared.html). An
  older AppSumo answer by a PublishDrive founder says an API exists for publishers to upload, edit and pull sales data but is not
  white-label (https://appsumo.com/products/publishdrive/questions/do-you-offer-an-api-whitelabel-in-the-422283/). I found NO
  public API documentation (no endpoints, auth scheme, Swagger/Postman/GitHub), so "documents a REST Distribution API" is
  UNVERIFIED; treat it as a sales-level claim. All of this is from search summaries; I could not fetch those pages.
  Reaching Amazon through an aggregator is a different supplier relationship from owning a KDP account.
- IngramSpark: no public title-setup API found; titles go in through the dashboard (IngramSpark User Guide v3.3 dated 2026-08-24,
  https://www.ingramspark.com/hubfs/downloads/user-guide.pdf, via search summary); a Shopify Community thread says "IngramSpark has no
  API" (https://community.shopify.com/t/integration-with-ingram-spark/330429, older); Ingram's data-services web service is for
  metadata retrieval by retailers. Consistent with the stated belief but not proven.
- Draft2Digital: no public API documentation found (dashboard-only guidance).

Amazon agent rules (context, second-hand): summaries say agents must identify as `Agent/[agent name]` in the user-agent
string of all HTTP(S) requests, must not mimic human keystroke speed, must not solve or evade CAPTCHAs, must answer truthfully when
asked if they are human, and must not circumvent blocks; revision date reports conflict (May 2025 vs 2026-08-14)
(https://getsliq.com/blog/amazon-ai-agent-rules, https://sellersprite.ai/en/blog/amazon-bsa-agent-policy-2026,
https://www.geekwire.com/2026/amazons-fight-with-meta-who-owns-the-customer-relationship-when-an-agent-does-the-buying/).
Enforcement example (Sept 2026): Amazon blocked Meta's Muse agent, citing the Conditions of Use
(https://techcrunch.com/2026/09/21/metas-ai-agent-has-been-blocked-from-using-amazon-com/). I did not read Amazon's text.

## 5. Recommendation

No end-to-end KDP uploader found is both compliant and headless-capable, and none supports phone-based owner sign-in. Do not adopt
any as a dependency. Take ideas and small modules:
1. From beyondwords (MIT): port the plan/approve/execute journal, the release-review required-keys gate and the pinned EPUBCheck
   installer into the TypeScript flow, with attribution. Back the "approve" step with an owner confirmation on the phone that shows
   the plan hash.
2. From ocrosby/claude-config (MIT): copy the approach (semantic locators in a Selectors object, exit-on-drift, never click
   Publish/Submit) and the compose-time validations, with attribution.
3. Cover/spine: write the paperback maths in-house in TS from KDP's published factors (white 0.002252, cream 0.0025, standard colour
   0.002252, premium colour 0.002347 per page; bleed 0.125). Cross-check with pabygon's table (CC-BY-4.0, attribute) and
   alanherron's tests. Do not use hardcover constants until a human confirms them in Amazon's calculator.
4. Validators: run W3C EPUBCheck 5.4.0 (BSD-3) in the container; run ProofMill as a sidecar (MIT) or port its rule list.
5. Ignore: GPL mathpub code (borrow design only), any stealth/typing-mimicry/2FA-bypass tool, the LaFerraille crawler, no-hands-kdp's
   hardcoded declarations.
6. Whatever you build must still add `Agent/<name>` to the user agent: none of the above does. Keep the browser on the owner's own
   device/session; none of these projects addresses KDP Terms 4.3 for a cloud-hosted worker logging into the owner's account.

## 6. Not verified / why

- Amazon Conditions of Use text, KDP Terms 4.3, KDP spine/margin/hardcover specs: Amazon hosts are off limits; figures come from
  projects that cite KDP help topics and from third-party calculators. Hardcover constants conflict across sources.
- PublishDrive, IngramSpark, Draft2Digital, press articles: only search-engine summaries (hosts unreachable).
- Live behaviour of any tool against KDP: not tested (and not permitted). mathpub says no live upload was performed; fatoh2/kdp-mcp
  verified only a same-value draft save.
- Not run: beyondwords (no tests; CI package check), byte-sized-book-formatter (Chromium/Pandoc), BookForge studio/pandoc/epubcheck
  paths, mathpub (Nix/Sage), LaFerraille LaTeX paths (skipped), kdp-cover-preflight (no tests).
- Popularity and maintenance are thin everywhere (all candidates created in 2026; most single maintainer). Commit counts exact only
  below 200. Open-issue contents were not read.
- Closed-source extensions and ClawHub skills: not auditable.
