# Report 3 — cloud access to KDP: what exists, what Amazon's terms require, and the two paths to Book 1's draft

Written 2026-10-17 14:3xZ after the owner's 14:1xZ request ("rebuild Amber's KDP login automation so Book 1 can be uploaded today").
Amber has not signed in to Amazon or KDP at any point today, and nothing in the owner's KDP account has been touched.

## 1. Existing cloud access: none found

| Where I looked | What is there | Result |
|---|---|---|
| amberai code and workflows | KDP appears only in `scripts/kdp-publish-la-ebook.ts`, `scripts/kdp-upload-cover.ts` (2026-08-28, owner-run) and the new `scripts/kdp-coloring-draft.ts`; no secret or env name containing KDP or AMAZON anywhere; the Actions secrets in use belong to other services | no KDP credential reference exists |
| Amber's `BrowserSession` store (encrypted cookie/storage blob, `src/lib/integrations/browser-session.ts`) | providers: github, npm, pypi, stripe, gemini, supabase, openai, anthropic, twilio, smtp, storage (AWS console), cloudflare, heygen, godaddy, lovable | no Amazon or KDP provider, so no stored KDP session |
| Cloud browser (`src/lib/browserless/*`) | hosted Browserless; sessions capped near 58 s; `launchPersistentContext` is local-disk only | cannot hold a sign-in or a 15-minute upload |
| Railway | the amber-os-worker image carries Chromium (Microsoft Playwright image); nothing KDP-related is configured in the repo | production worker left alone; this sandbox has no Railway token and I did not widen the operator allowlist, so live Railway variables were not read |
| The only KDP session | the laptop's Chromium profile (`.data/browser-automation/profiles/kdp`, 2026-08-28), never committed | unreachable until the owner is at the laptop |

## 2. What Amazon's own terms say about software acting on an account

Runner read of the Conditions of Use at 14:2xZ (batch 170, HTTP 200, page "Last updated: August 14, 2026"). The "Agent Terms" apply to "any
software or service that takes autonomous or semi-autonomous action on behalf of, or at the instruction of, any person or entity".

- "No Agent may access, use, or interact with Amazon Services unless, at all times, it identifies itself and operates in strict accordance with the requirements".
- "At our sole discretion, we may limit, including by technical measures, whether and how any Agent accesses, uses, and interacts with Amazon Services."
- Agents must put "Agent/[agent name]" in the user agent string of all HTTP/HTTPS requests; must not conceal that they are agents, "such as by (a)
  mimicking the speed or pattern of human keystrokes ... or (b) completing or circumventing CAPTCHAs"; must answer truthfully any question about whether
  a human or a computer is acting; and must not "circumvent or otherwise avoid any measure intended to block, limit, modify, or control" agents.
- KDP's own Terms and Conditions (read the same minute) contain no automation clause; the restriction comes from the Conditions of Use, which govern the
  Amazon sign-in that KDP uses ("KDP uses the same credentials as your Amazon account").

Consequences, stated plainly:

1. A cloud session that fills in KDP forms is an "Agent". It is only legitimate if it carries `Agent/AmberOne` in every request and stops at any CAPTCHA
   or block. Amazon may refuse it by technical means; if it does, the route is closed, and Amber does not try another user agent, a proxy or a stealth mode.
2. The owner-run laptop scripts of 2026-08-28 and the new laptop script are agents under the same definition and sent no such token. The new script gets
   the token before it is ever used.
3. My earlier read-only research (batches 165–170 and renders 37–38) made 94 automated requests to Amazon hosts (69 to www.amazon.com, 25 to
   kdp.amazon.com: public list, product and help pages). The probe named itself honestly (`StudyProofs-region-scan/1.0 ...`) but without the Agent token.
   Since 14:25Z every probe and render request carries `Agent/AmberOne`; no further Amazon reads are planned.
4. Amazon decides what happens to an account it considers non-compliant. I cannot quantify that risk; the owner holds published titles and royalties
   in this account, so the decision to run an agent against it is the owner's.

## 3. The two paths to Book 1's draft today

**A. By hand on the iPhone, with Amber's kit (no agent involved).** Sent at 14:26Z: the two verified PDFs (interior `e804d9b4…`, cover `3126683a…`,
equal to the runner's build) and a field-by-field copy sheet with the exact KDP choices, the AI answers and the stop point. About 20 minutes. The draft
is confirmed only from the owner's screenshot of the Bookshelf showing "Draft".

**B. Disclosed-agent cloud session on a GitHub runner, signed in by the owner from the iPhone.** Design:
- Playwright Chromium on an Actions runner of the private repo (free quota; no Browserless, no Railway, nothing near the production lanes).
- User agent = the browser's own string plus `Agent/AmberOne`, on every request. Standard browser, no stealth, no proxy, no timing games.
- A small remote-assist page served from the runner through a Cloudflare quick tunnel (official `cloudflared`, pinned, no account, no cost). The owner opens a
  one-time link on the iPhone, sees the cloud browser, and types email, password and code into Amazon's own page. Amber never sees or stores them, the link
  dies when the run ends, and nothing is persisted without a separate approval.
- Amber then fills the paperback (same script as the laptop version), runs the previewer, saves the draft, and reads the Bookshelf to confirm "Draft".
- Hard stops: any CAPTCHA, robot check or block page ends the run and is reported; no second attempt on the same day.
- Honest limits: Amazon sees a datacenter address and an Agent user agent and may refuse it; the traffic crosses Cloudflare's edge on its way to the
  phone; the form-filling selectors were written without being able to see the signed-in KDP pages, so a watched first run may need a human tap.

Estimate for B: 2–3 hours to build and test on non-Amazon pages, then about 30 minutes with the owner. Estimate for A: 20 minutes, starting now.

## 4. What changed today (evidence)

- amberai #873 merged `8be5432c` 13:53:30Z; #874 (37 motif families, byte-reproducible PDFs) green on build, test and qa-engine, merged `5e519c5e` 14:22:09Z.
- A local build of merged main gave the same SHA-256 as the runner's (Report 2 §6): interior `e804d9b40e55c916c5429363bd9f552272ec3e8cedf3e962a97f52ee583c3b4b`,
  cover `3126683afcee45bd826a5ea2f1cc92db59bc75588fcbf0eb7db4f543418c077c`.
- Known nit, left as is because the owner designated these files final: the note page and the back cover use the British "colour" in three places on a US-market
  book; replacing the files in a draft is free until publication, so it can be corrected before the owner approves publishing.
- The AI answers are on the facts: text AI-generated (Claude drafted the description, note page and title text), images not AI-generated (a program drew them).
  The program was itself written with AI help; if the owner prefers the most conservative reading, answer Yes for images too.

## 5. Decisions for the owner

1. Which path for Book 1's draft today: A now, B built and tried once, or both.
2. Whether Amber may ever run an agent against the owner's KDP account, given Amazon's Agent Terms (B and every future autonomous upload depend on it).
3. The author name (Amber One Press is in the files) and the imprint fact: with the free ISBN the publisher shows as "Independently published".
