# Tool reviews (read-only, nothing executed or installed) — 2026-10-17

Four repositories were cloned with `git clone --depth 1` into this session's sandbox and read file by file. Claims below cite file:line as found at the cloned commit.

## joshyattridge/amazon-kdp-skill — commit 9194489 (2026-07-05), no LICENSE file
- Express + Playwright server (`server/`), Agent-Skills package; formats kindle/paperback/hardcover, content upload paperback-only (kdpContentUpdate.ts:267-269, 367-369); generates no EPUB/PDF/cover; deps cors, express, playwright, xlsx; `postinstall: playwright install chromium`.
- Login: headed browser, polls until the user has signed in, saves `storageState` to `.kdp-session/amazon-kdp.json` (login.ts:29-47); no password/OTP handling; no CAPTCHA/MFA solving; `--disable-blink-features=AutomationControlled` on every launch; auto-clicks "Continue" on Amazon's throttle page (kdpWizard.ts:15-25).
- Implemented: create title, details, categories picker, manuscript/cover `setInputFiles`, auto-launch previewer and click Approve (kdpContentWait.ts:101-154), AI questionnaire from a spreadsheet (fillBookContent.js:104-148) — but the REST route drops those settings (index.ts:660-665) and later auto-ticks any generative checkbox (kdpContentWait.ts:165-170); always assigns a free ISBN, forces premium colour ink, sets "release now"/+14 days on every save; publish guard matches /^publish$/ then falls back to "save and continue" and any submit input (kdpWizard.ts:27-48).
- Risks: HIGH unauthenticated server on all interfaces with `cors({origin:true, credentials:true})` (index.ts:53, 694) exposing publish/delete/upload with the stored session; HIGH plaintext cookies on disk; MEDIUM weak publish guard, unrequested account changes, evasion flag. Not malicious; no telemetry or remote code.

## sabbonzo/kdp-autopublish — commit efbfcf1 (2026-05-31), MIT
- Six Python files; all fail `ast.parse` (string literals broken by a scrubbing pass, e.g. kdp_publish.py:37); three imported modules missing; no requirements file; `.env` never read.
- Kindle eBook wizard only (title-setup/kindle/new/details); cookie reuse from a JSON file; no CAPTCHA/MFA code; `--no-draft` clicks "Publish your Kindle eBook"/"Pubblica" with no confirmation (kdp_publish.py:367-392); AI use declared "NO_AI_USED" by default (:187-190); adult content defaults true (:176); hard-coded personal paths and names.
- Verdict: inert as published; unsafe design if repaired.

## nikmcfly/kindle-book-skill — commit aa66cdf (2026-03-27), MIT
- Stdlib-only `scripts/build_kindle.py` calling pandoc and XeLaTeX (list args, no shell); Markdown → EPUB3 + print PDF; manual upload checklist; no browser automation, credentials or network code.
- Limits for a coloring book: no bleed (page = trim), trims limited to 5x8/5.5x8.5/6x9/8.5x11, running headers on every page, images scaled into the text block, no cover; some guidance inaccuracies (margins "auto-calculated" claim false; gutter tiers incomplete; 2560×1600 called a minimum).
- Verdict: safe; wrong tool for full-page line art.

## queelius/claude-anvil `kdp/` — repo commit ed58e9a (2026-07-08), MIT, plugin 0.6.0
- kdp-publish skill: 10 phases; Phase 7 drives the KDP dashboard through the Playwright MCP (browser_navigate/snapshot/click/fill_form/file_upload; SKILL.md:182-208) with human sign-in; step 8 says "Do NOT click the publish button" (SKILL.md:210) but Phase 8 automates pricing and Phase 9 reads "Click 'Publish Kindle eBook' or 'Approve Proof'" (:262-263) with no actor; no AI-content-disclosure step; no ISBN step.
- MCP server (`kdp/mcp`): kdp_cover_specs, kdp_generate_cover (OpenAI gpt-image-1, 1024×1536, high; key from OPENAI_API_KEY), kdp_generate_full_wrap (sharp + pdf-lib), kdp_validate_cover; constants PAPER_MULTIPLIER white 0.002252 / cream 0.0025, BLEED 0.125", DPI 300 (cover-layout.ts:1-7); 33 vitest cases; only api.openai.com leaves the machine.
- Verdict: no disqualifying behaviour; best reference for cover math and flow; publish gate too weak and disclosure missing to run unmodified.

## Amber's own scripts (amberai `scripts/kdp-publish-la-ebook.ts`, `scripts/kdp-upload-cover.ts`, commit c2c5dc34, 2026-08-28)
- Playwright, visible window, persistent profile `.data/browser-automation/profiles/kdp` on the laptop; the owner signs in; fills details/content/pricing; stops before Publish; used for two of the owner's titles. One defect to fix: answers "Did you use AI tools?" with No.
