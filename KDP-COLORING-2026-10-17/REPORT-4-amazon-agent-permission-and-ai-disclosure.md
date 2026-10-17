# Report 4 — may a cloud agent touch the KDP account? The AI-disclosure classification, and the iPhone-only route

Written 2026-10-17 14:5xZ, answering the owner's 14:3xZ instructions. Amber has not signed in to Amazon or KDP today and has sent no request to any Amazon
host from the new tools.

## Bottom line

1. **Permission is not established, so nothing is connected.** A disclosed, owner-attended agent meets Amazon's written technical rules, but Amazon keeps sole
   discretion over agents, has publicly blocked agents it calls "unauthorized", and publishes no approval route. Only Amazon can say yes. The tools enforce that:
   they refuse every Amazon host until the owner commits Amazon's written reply (section 1.5).
2. **The code-drawn artwork is "AI-generated" under KDP's own definition, so disclose images as Yes**, text as Yes, translations as No (section 2). Over-disclosing is free;
   under-disclosing would misstate the book to Amazon.
3. **Book 1's draft can be made today from the iPhone with no agent involved** (section 3). Corrected files and a generated copy sheet are in the kit.

## 1. Is the proposed automated access permitted?

### 1.1 Amazon's written terms (primary source)

Runner read of the Conditions of Use, 2026-10-17 14:2xZ, page "Last updated: August 14, 2026". The Agent Terms apply to "any software or service that takes
autonomous or semi-autonomous action on behalf of, or at the instruction of, any person or entity", which covers Playwright run by Amber, by the owner on a
laptop, or by anyone else on the account.

- "No Agent may access, use, or interact with Amazon Services unless, at all times, it identifies itself and operates in strict accordance with" the technical requirements, and "no
  Agent may access ... if we have requested that the Agent refrain".
- "At our sole discretion, we may limit, including by technical measures, whether and how any Agent accesses, uses, and interacts with Amazon Services."
- Technical requirements: (i) "Agent/[agent name]" in the user agent of all HTTP/HTTPS requests; (ii) do not conceal agent access, "such as by (a) mimicking the speed or
  pattern of human keystrokes ... or (b) completing or circumventing CAPTCHAs"; (iii) answer truthfully any question whether a human or a computer is acting; (iv) do not
  "circumvent or otherwise avoid any measure intended to block, limit, modify, or control" agents.
- KDP's own Terms and Conditions (same read) contain no automation clause. The restriction comes from the Conditions of Use, which govern the Amazon sign-in KDP uses ("KDP uses the
  same credentials as your Amazon account").

### 1.2 How Amazon applies it (secondary sources, reported 2026-10-17 by web search; not read on Amazon's own pages)

- Amazon blocked Meta's Muse agent on 2026-09-20; users saw a notice that continued access by an unauthorized AI agent violates the Conditions of Use. Reported reasons: Meta had not told Amazon,
  Muse did not identify itself, and it appeared to store customer credentials. Amazon's stated position: third-party apps "should operate openly and respect retailers' decisions about
  whether to participate"; an opt-in is standard. One outlet's headline says Muse "joins ChatGPT and Claude in Amazon shopping ban" (Cybernews).
- A Ninth Circuit ruling on 2026-08-04 in Amazon v. Perplexity reportedly vacated Amazon's injunction and treated the shopper, not the agent's vendor, as the one accessing the site, without
  touching Amazon's ability to control agents through its terms.
- No agent registration or allowlist programme was found. Amazon's seller-side agreement carries a similar Agent Policy (effective 2026-03-04), which does not govern KDP.

### 1.3 The design against each requirement (all tested, section 4)

| Requirement | What the cloud assist browser does | Evidence |
|---|---|---|
| Name the agent in every request | the browser's own user agent, unchanged, plus `Agent/AmberOne` (also on the laptop script) | 14 requests of 7 kinds (page, css, js, image, XHR, worker script, a fetch inside a worker), 0 without the token |
| Do not conceal it | no stealth, no proxy, no spoofing; headless says "HeadlessChrome"; the owner's typing arrives as text, not simulated keystrokes | user agent printed in every run |
| No CAPTCHA completion or circumvention | any CAPTCHA, robot check, "unauthorized agent" notice or HTTP 403/429/503 is a hard stop; input is disabled | 4 stop cases pass |
| Truthful about human or computer | the agent never answers such prompts | stops instead |
| Do not circumvent blocks | one attempt per run; no second user agent, address or proxy | stop is final |
| Do not use after Amazon asks to refrain | not applicable yet; any refusal ends the run | |
| **Amazon's authorization** | **cannot be met by design; refused until a written reply is committed** | Amazon and kdp.amazon.com are refused before any request leaves the runner |

### 1.4 Verdict

Compliant with the written technical rules, **not authorized**. In Amazon's own words access can be limited or refused at its sole discretion, and it treats unauthorized agent access as a
violation. For an account that holds published titles and royalties, the owner's instruction ("do not risk my existing publishing account") means: do not connect until Amazon agrees in writing.
That also applies to the owner-run laptop route: `scripts/kdp-coloring-draft.ts` now refuses to start without the same authorization file and sends the Agent token if it does. The owner's two
older scripts of 2026-08-28 (`kdp-publish-la-ebook.ts`, `kdp-upload-cover.ts`) are agents under the same definition and send no token; they should not be run against the account until Amazon agrees.

Open questions only Amazon can answer: whether a disclosed, owner-supervised agent is accepted at all; whether the owner typing a password and code into a browser an agent controls is acceptable
(Amazon criticised stored credentials; Amber stores nothing and logs nothing); whether a datacenter address and the Agent token are blocked at sign-in. I deliberately did not probe Amazon's sign-in page to find out.

### 1.5 The one route to yes, and how the code honours it

Ask KDP Support in writing (draft below; only the owner can send it). If the reply permits it, the owner commits `kdp/cloud/authorization/amazon.json` (owner, date, the written basis, hosts;
template and rules in that folder). No code path writes the file. Then one watched run, hard stops, no Publish.

> Subject: Question about using disclosed software to prepare draft titles in my KDP account
>
> Hello KDP Support, I publish through my KDP account (the email address on this request). I would like to use software that acts under my supervision to prepare draft paperbacks in my own account:
> it would fill in title details, upload the manuscript and cover files and save a draft. I would sign in myself, including two-step verification, and I would always review and publish myself.
> Amazon's Conditions of Use (Agent Terms, last updated August 14, 2026) say agents must send "Agent/[name]" in the user agent, must not conceal that they are agents, must not complete or circumvent
> CAPTCHAs, and that Amazon may limit agents at its discretion. My software would send "Agent/AmberOne", stop at any CAPTCHA or block, and never publish.
> 1. Is this kind of disclosed, owner-supervised access to my KDP account permitted? 2. If it needs approval or registration, what is the process? 3. Is there an approved programmatic way to upload drafts
> (an API or bulk tool) that I should use instead? Please reply in writing so I can keep it with my records. Thank you.

## 2. AI-generated-content disclosure for the code-drawn artwork

**KDP's definitions** (Content Guidelines, runner read 2026-10-17 13:51Z): "AI-generated: We define AI-generated content as text, images, or translations created by an AI-based tool. If you used an
AI-based tool to create the actual content (whether text, images, or translations), it is considered 'AI-generated,' even if you applied substantial edits afterwards. AI-assisted: If you created the content
yourself, and used AI-based tools to edit, refine, error-check, or otherwise improve that content ... it is considered 'AI-assisted' and not 'AI-generated.'" "AI-generated images include cover and interior
images and artwork." Disclosure is required for AI-generated content and not for AI-assisted content.

**The facts.** Every interior design and the cover artwork are vector drawings produced by a TypeScript program with a seeded random generator. No image-generation model ran, nothing was copied, traced or
trained on third-party artwork. The program (the shapes, proportions and layouts of all 37 motif families) was written by an AI assistant, Claude, working for Amber; the owner did not draw or design the motifs.
The title text, subtitle, description and note page were also drafted by Claude.

**Classification.**
- "AI-assisted" requires that the owner "created the content yourself". The owner did not, so it does not fit.
- The one argument for "not AI-generated" is technical: a deterministic program drew the pixels, and a program is not an "AI-based tool". But KDP's test is who created the content, not which technique rendered it,
  and here an AI created the designs and expressed them as code.
- Risk is asymmetric: disclosing AI-generated content is allowed and costs nothing; failing to disclose it would misstate the book to Amazon.

**Correct answers for Book 1 (the generated sheet and the listing metadata now say this):**

| KDP question | Answer | Statement |
|---|---|---|
| AI-generated content in the book? | **Yes** | |
| Text | **Yes, AI-generated** | title text, description and note page drafted by Claude (Anthropic) and reviewed by the publisher |
| Images (cover and interior) | **Yes, AI-generated** | produced by a pattern-generating program that Claude wrote; no image-generation model was run; nothing copied or traced |
| Translations | No | none |

The earlier sheet and the 13:5xZ message said images "No"; that is superseded. If the owner had already answered with the old sheet, change Images to Yes. KDP publishes no rule for procedurally generated art, so
the owner may add this question to the Support message above. The printed note page ("drawn by Amber's own pattern code (not by an AI image generator)") is accurate and unchanged.

## 3. The simplest iPhone-only route for Book 1

The kit (sent with this report) holds the two final PDFs and `KDP-COPY-SHEET.txt`, generated from the same listing as the files: every field in KDP's order, with the exact choices, the AI answers above, the price arithmetic,
the stop at "Save as Draft" and what to send back. About twenty minutes in Safari ("Request Desktop Website"). No agent, no Amazon request from Amber. The draft counts as confirmed only from the owner's screenshot of the
Bookshelf showing "Draft".

**Final files (US spelling; built from merged code; byte-identical on this machine and on a GitHub runner):**

| File | Bytes | SHA-256 |
|---|---|---|
| interior.pdf | 443,028 | `20578482363365d91a283e592918c83d032e90274cc4ca50f7301c5c811e85d7` |
| cover.pdf | 14,011 | `7a3619be0e330d411db684181a4b396e4e690846aa7cce5910d98665240786be` |

The only differences from the earlier build are three printed lines (note page, two lines of the back-cover blurb): "colour/colours" became "color/colors"; all 50 design pages render identically.

## 4. The cloud assist browser (built and tested on a fake site only)

`kdp/cloud` in amberai: Chromium on a throwaway GitHub runner, an assist page opened on the iPhone through a single-use link (posted on a private-repo issue, removed afterwards), taps and typed text passed through, nothing
typed or shown written to disk or logs, a guard refusing Amazon, private addresses and unlisted sites, hard stops, 45-minute ceiling. Cost: runner minutes of the private repository's included quota (about 2 minutes per
test) and Cloudflare's free quick tunnel; no new service.

- 23 checks pass locally and on a GitHub runner, with Chromium 151 and Playwright 1.62.0, both directly and **through the Cloudflare tunnel** ("SELFTEST PASS (through the tunnel)", runs 39042058642 and 39042190949 on branch `claude/kdp-cloud-assist`).
- cloudflared (Cloudflare's own open-source client): version 2026.9.3 (built 2026-09-24), the newest release more than two weeks old; the pinned SHA-256 `77e26d8d900e0b8469f416239d14b5f296525fdf79fee6f511ef55609e3fbac2`
  equals GitHub's digest of the asset and the checksum line in Cloudflare's release notes; the workflow fails if the download differs. It runs only on the runner, with no secret but the job token.
- Not built yet, deliberately: the KDP form-filling inside the cloud session and any stored Amazon session. They wait for Amazon's written answer.

## 5. Autonomous drafts with the owner's approval before publication: the gates

1. **Now (no Amazon access):** Amber researches, designs, builds, checks and packages each book, and generates the iPhone kit; the owner pastes and saves a draft (about 20 minutes) and confirms with a screenshot.
2. **If Amazon agrees in writing:** the owner commits the authorization file; one watched run per book from the iPhone (sign-in, code and approvals typed or tapped by the owner); the agent fills and uploads, runs the previewer,
   saves the draft, reads the Bookshelf to confirm "Draft", and stops at any challenge.
3. **Always:** nothing is published by an agent. Publication is the owner's own tap, after the owner's approval in chat; no session is stored without a separate decision.

## 6. Decisions for the owner

1. Whether to send the Support question above (it is the only way to a definitive answer on automation).
2. Whether to make Book 1's draft by hand now with the kit, and confirm the images answer is Yes.
3. Nothing to decide for the cloud assist browser: it is inert for Amazon (refused in code), so Amber merges it on green CI under the standing authorization; it is ready if Amazon says yes.
