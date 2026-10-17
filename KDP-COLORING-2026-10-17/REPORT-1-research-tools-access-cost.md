# KDP coloring books for Amber — Report 1 (2026-10-17, 13:0xZ): market evidence, the safest tool, existing KDP access, the cost of one book

Written for the owner before any pilot is built. Everything verified is linked; everything estimated is labelled. No sales figures are claimed. Nothing was bought, installed into production, or uploaded.

## 1. Existing KDP access (Phase 3) — what exists and the minimum action

**What exists.** Amber already has KDP automation written for this account, committed to the private amberai repository on 2026-08-28 by you from the laptop session (`scripts/kdp-publish-la-ebook.ts`, `scripts/kdp-upload-cover.ts`, commit c2c5dc34):

- Both scripts open a **visible Chromium (Playwright) with a persistent profile** at `.data/browser-automation/profiles/kdp` on the laptop. You sign in in that window (password and one-time code are yours; the script prints "Do not paste the password in chat"); the script waits up to 20 minutes for the Bookshelf, then fills the KDP forms and stops before Publish ("If you want it live, click Publish Your Kindle eBook in that window").
- They were used for two of your titles: "10 Things to Do in Los Angeles" (Kindle eBook: details, EPUB + cover upload, pricing) and "Easy Italian for Travelers" (paperback cover through KDP's Cover Creator).
- The `.data/` folder is never committed, so the signed-in profile lives **only on the laptop**. There is no KDP credential in Amber's vault (no secret name mentions KDP, Amazon or Kindle), no cloud session, and this cloud session cannot reach the account (nor should it).
- Known defect to fix before reuse: the cover script answers KDP's "Did you use AI tools?" question with **No**; a coloring book with AI-generated images must answer **Yes** (see §4).

**Whether the session is still valid** cannot be seen from here: Amazon keeps a signed-in browser profile for a while but asks for the password and a one-time code again at intervals. **Minimum action from you, when the pilot files are ready:** on the laptop, in the amberai checkout, run the pilot's upload script (`npx tsx scripts/kdp-coloring-draft.ts`, to be written); if KDP shows a sign-in page, sign in in that window (password + OTP, never in chat). That is all. No password or cookie is stored anywhere new; the profile stays on your machine. If the laptop checkout is gone, the one extra step is to pull amberai there once.

## 2. The GitHub tools (Phase 2) — reviewed read-only, nothing installed

Four repositories were cloned read-only and reviewed file by file (no code executed, no dependencies installed). Summary; the full reviews are in `KDP-COLORING-2026-10-17/TOOL-REVIEWS.md`.

| Repository | What it is | Verdict |
|---|---|---|
| joshyattridge/amazon-kdp-skill (1 commit, 2026-07-05, no license) | Express + Playwright server driving kdp.amazon.com; skills for reports, metadata, pricing, upload, publish | **Not safe as published.** The server listens on all interfaces with open CORS and no authentication, so any web page or LAN host could call its publish/delete/upload routes with your stored session; plaintext Amazon cookies on disk; forces a free ISBN, premium colour ink and a release date on every save; auto-approves the previewer and auto-ticks the AI-content box; a loose "publish" button matcher; launches Chromium with the automation-detection evasion flag and auto-clicks past Amazon's "server busy" page. No CAPTCHA/MFA solving. Useful only as a reference for selectors. |
| sabbonzo/kdp-autopublish (1 commit, 2026-05-31, MIT) | Python Playwright eBook wizard + scraper + cover generator | **Inert.** All six modules fail to parse (a scrubbing pass broke the string literals); three imported modules are missing; eBook-only; cookie reuse; a `--no-draft` path that clicks Publish with no confirmation; mis-declares AI use as "no AI used". Not a candidate. |
| nikmcfly/kindle-book-skill (1 commit, 2026-03-27, MIT) | Markdown → EPUB + print PDF via pandoc/XeLaTeX; manual upload checklist | **Safe, but a text-book formatter**: no bleed, no 8x10, running headers on every page, no cover, no KDP automation. Poor fit for full-page line art. |
| queelius/claude-anvil `kdp/` (2026-07-08, MIT, v0.6.0) | Claude Code plugin: kdp-publish/kdp-audit/kdp-listing skills driving the Playwright MCP; a small MCP server with correct cover math (spine 0.002252"/page white, 0.0025" cream, bleed 0.125", 300 dpi) and an OpenAI gpt-image-1 cover generator | **Best reference, not a drop-in.** Human sign-in; no credential capture; no CAPTCHA/MFA circumvention. Weak points: the "do not click publish" sentence is prose, followed by automated pricing and a Phase 9 line "Click Publish…" with no actor; no step for KDP's mandatory AI-content questions; some stale reference data (categories, cover format, barcode). |

**Safest reliable approach:** keep the KDP step on the pattern Amber already proved on your account — a visible Playwright browser with the persistent laptop profile, you sign in, the script fills everything, **saves the draft, runs the previewer, and never clicks Publish** — written and reviewed by us inside amberai, with claude-anvil's cover math and KDP's own Cover Calculator as cross-checks. None of the third-party code goes into Amber's production environment. The book files themselves (interior PDF, full-wrap cover PDF, metadata) are produced in the cloud (GitHub Actions in the private amberai repository, laptop off), the way the StudyProofs video already is.

## 3. Market evidence (Phase 1)

### What can and cannot be verified

- **Verified today (2026-10-17, 12:49–12:56Z)**: Amazon's public bestseller lists for "Coloring Books for Grown-Ups", "Children's Coloring Books", "Fantasy & Science Fiction Coloring Books for Grown-Ups" and the "New Releases" list, read from a GitHub runner without a login (raw HTML kept in `scan/results/batch-165…` and `batch-166…`; tables in `EVIDENCE-amazon-lists-2026-10-17.md`), plus the product pages of 16 leading titles (publication date, page count, trim, publisher, today's Best Sellers Rank, price, rating; `amazon-products-2026-10-17.json`).
- **Not available without a paid service**: Best Sellers Rank *history* over July 17–October 17 (Keepa and similar) and unit sales (Circana BookScan). Amazon shows only today's rank; review counts accumulate over a title's life. So **no definitive three-month ranking is claimed** and **no sales figures are stated**. If you want estimated units, a BSR-to-sales estimator can be applied later, labelled as an estimate.

### The five best-supported sellers of the period (today's rank + what accumulated since publication)

| # | Title (link) | Published | Format, pages, price | Ratings today | Today's rank in Books | Publisher |
|---|---|---|---|---|---|---|
| 1 | [Spooky Cutie](https://www.amazon.com/dp/B0D943SQXV) — Coco Wyo | 2024-07-09 | 8.5×8.5" paperback, 88 pp, $9.99 | 4.8★, 8,005 | **#46** (#1 Humorous Coloring Books for Grown-Ups) | Independently published (KDP) |
| 2 | [Cozy Girl Season: Bold and Easy](https://www.amazon.com/dp/B0FLJVJKP6) — Jeanett Veronica | 2025-08-04 | 8.5×8.5", 108 pp, $9.99 | 4.8★, 717 | **#71** (#2 in the Grown-Ups list) | Independently published (KDP) |
| 3 | [Little Spooky](https://www.amazon.com/dp/B0DF33DSNF) — Coco Wyo | 2024-08-21 | 8.5×8.5", 88 pp, $9.99 | 4.8★, 3,438 | #231 (#1 Fantasy & SF Coloring) | KDP |
| 4 | [Stress Relief: Bold and Easy](https://www.amazon.com/dp/B0D3CSPMZG) — Coco Wyo | 2024-05-04 | 8.5×8.5", 110 pp, $9.99 | 4.8★, 8,898 | #310 (#1 Flowers & Landscapes Coloring) | KDP |
| 5 | [Cozy Friends](https://www.amazon.com/dp/B0D4YLQRMP) — Coco Wyo | 2024-05-22 | 8.5×8.5", 88 pp, $9.99 | 4.8★, 12,528 | #601 (#2 Fantasy & SF Coloring) | KDP |

Also leading today: "Large Print Easy Color & Frame — Calm" (New Seasons, spiral-bound, 64 pp, $6.42, 8,526 ratings, #3 in the Grown-Ups list); "Mindfulness Patterns" (independently published, 8.5×11", 108 pp, $9.99, 1,657 ratings, Books #470). Coco Wyo's new editions moved to Random House Books for Young Readers in July 2026 (retailer listings say "already published as KDP titles"), which is itself evidence of how large that series became.

### Five niches with evidence, and which are realistic for a new publisher

1. **Bold & easy seasonal (Halloween now, Christmas/winter next, then Valentine's and spring).** New self-published titles from July–August 2026 already rank: [Halloween Bold And Easy](https://www.amazon.com/dp/B0HBR4FF6X) (published 2026-07-27, 108 pp, $9.99, 10 ratings) is **#1,873 in Books and #4 in Fantasy & SF Coloring today**; [New 2026 Christmas Adult Coloring Book](https://www.amazon.com/dp/B0HGYGSF3V) (2026-08-28, 102 pp, $5.99, 6 ratings) is #2 on the New Releases list and #2,090 in Books; [Large Print Halloween](https://www.amazon.com/dp/B0HF1FF6D9) (2026-08-12) #5,024. **Realistic**: yes — brand-new KDP titles enter the top ranks within weeks; timing is the lever (publish 6–10 weeks before the holiday).
2. **Large print / easy for seniors and low vision.** "Large Print Easy Color & Frame" titles hold #3 and #9 of the Grown-Ups list with ~8,000 ratings each; [Large Print Cozy Autumn](https://www.amazon.com/dp/B0HDD181M1) (2026-08-07, 8.5×11", 105 pp) sits at #8,048 in Books with 10 ratings. **Realistic**: yes, and it suits 8.5×11" with thick lines.
3. **Cozy/hygge cute scenes with original characters.** The dominant lane (Coco Wyo, Jade Summer, Amelia Green: Books #46–#1,078). **Realistic only with genuinely original characters and scenes** — imitation of Coco Wyo's look is a legal and KDP-policy risk; the crowding is the highest here.
4. **Mindfulness patterns / monochrome mindful designs.** "Mindfulness Patterns" (#470 in Books), "100 Amazing Patterns" (Jade Summer, 2019, 18,481 ratings), "Still & Slow" monochrome at $24.90 (#12). **Realistic and the cheapest to make well**: pattern pages can be generated by code (vector, 300 dpi, never a copy of anything).
5. **Color-by-number / mystery grids and "hatch & fill".** [100 Color by Number Mysteries](https://www.amazon.com/dp/B0DVQ5ZH66) (1,963 ratings, #22) and "Hatch & Fill" (#11 on New Releases, 133 ratings). **Realistic**: yes, fully procedural, and a format with few imitators.

**Excluded** (trademarked or licensed): Disney (Mystery Coloring, Thomas Kinkade Disney Dreams), Peanuts/Charlie Brown, Bluey, KPop Demon Hunters, Bob's Burgers, A Court of Thorns and Roses, Fourth Wing, Highlights, Paint by Sticker (Workman). Nothing in Amber's pipeline will copy any artwork; the only art it ships is drawn by code or newly generated and then checked.

## 4. KDP's requirements (from KDP's own help pages, read 12:49Z)

- **Interior** ([Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950)): minimum 24 pages; 8.5×11" black ink on white paper allows 24–590 pages; bleed 0.125" (3.2 mm) on all sides when any element bleeds, and a bleed book must be a PDF; fonts embedded; images 300 DPI; margins for 24–150 pages: inside (gutter) 0.375", outside at least 0.25" (no bleed) or 0.375" (with bleed).
- **Cover** ([Create a Paperback Cover](https://kdp.amazon.com/en_US/help/topic/G201953020), [Cover Calculator](https://kdp.amazon.com/en_US/cover-calculator)): one full-wrap PDF; spine = pages × 0.002252" (white paper) or × 0.0025" (cream); cover width = 0.125 + back + spine + front + 0.125; height = trim height + 0.25; spine text only above 79 pages; KDP adds the barcode if you supply none.
- **Printing cost** ([Paperback Printing Cost](https://kdp.amazon.com/en_US/help/topic/G201834340)): 8.5×11" and 8.5×8.5" are **large trim** (wider than 6.12"). Amazon.com, black ink: 24–110 pages **$2.84 per book flat**; 110–828 pages $1.00 + $0.017 per page (large trim) / $1.00 + $0.012 (regular trim). Minimum list price = printing cost ÷ royalty rate; the royalty rate is 50% or 60% depending on list price, per KDP's Royalties page (the $9.99 threshold for 60% is widely reported; the live calculator in title setup is the final word).
- **AI content** ([Content Guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390), verbatim): "We require you to inform us of AI-generated content (text, images, or translations) when you publish a new book… AI-generated images include cover and interior images and artwork. You are not required to disclose AI-assisted content… If you used an AI-based tool to create the actual content… it is considered 'AI-generated,' even if you applied substantial edits afterwards." Amber will answer **Yes** for any AI-made images and for AI-drafted descriptions; pages drawn by code are not AI-generated, but the disclosure will still be answered on the facts of each book.
- **Low-content** ([Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM)): "This does not typically include activity books, such as puzzle books or coloring books" — so a coloring book is eligible for the free KDP ISBN and normal distribution.

## 5. The cost of one professional coloring book (8.5×11", 104 pages: 50 single-sided designs + front/back matter, black ink, white paper)

| Item | Measured / verified | Estimated |
|---|---|---|
| KDP printing cost per copy sold (Amazon.com) | **$2.84** (KDP's chart, ≤110 pages, large trim) | — |
| Royalty per copy at $9.99 list, 60% tier | — | $5.99 − $2.84 = **$3.15**; at $7.99 (50% tier) $1.16; confirmed by the KDP calculator at setup |
| Illustrations, route A — drawn by code (patterns, mandalas, colour-by-number) | **$0** per image | — |
| Illustrations, route B — AI line art with Amber's existing OpenAI key (not a new service) | — | gpt-image-1 at 1024×1536: $0.25 per image (high) or $0.063 (medium) per OpenAI's developer pricing read today; 50 pages + ~20% re-draws ≈ **$15 (high) / $4 (medium)**; cover art 1–2 images ≈ $0.25–$0.50. The model is being retired (OpenAI lists its image models for removal; third parties cite 2026-10-23 for gpt-image-1), so the pipeline will use whatever current model the key offers and re-read the price on the day. |
| Titles, description, keywords (Claude, existing key) | — | cents |
| Cloud build (GitHub Actions in the private repo) | to be measured on the pilot | ~15–30 runner-minutes, 0 billable inside the included minutes |
| KDP fees, ISBN | **$0** (free KDP ISBN) | — |
| Optional printed proof copy | — | printing cost + shipping (real money; only with your approval) |

**One book therefore costs $0 (code-drawn) to about $16 (AI-illustrated) to produce**, before any proof copy, and earns about $3 per copy at $9.99 if the 60% tier applies. Revenue is not assumed; it is read from KDP reports after publication.

## 6. The smallest working pilot (next)

1. **Book 1 (no new secrets, no spend): a large-print "bold & easy patterns" book** — 50 original pages drawn by code (bold geometric, floral and mandala patterns with thick lines sized for seniors), 8.5×11", interior PDF with bleed and margins per §4, a full-wrap cover PDF, a QA report (page count, trim, margins, 300 dpi rendering check, a perceptual-hash duplicate check across pages), metadata (title, subtitle, description, 7 keywords, 2 categories, price with the royalty math) and the exact AI-disclosure answers. Built by a GitHub Actions workflow in the private amberai repository; the artifacts come back for your eyes before anything touches KDP.
2. **Upload as draft from the laptop** with a reviewed script on the proven pattern: visible browser, your sign-in, paperback setup (details → content: upload PDF, cover PDF, assign free ISBN, AI questions answered on the facts, launch the previewer, read its errors → pricing). The script stops at **Save as draft**; you see the previewer and decide.
3. **Book 2 (AI-illustrated bold & easy seasonal)** once you say where the OpenAI key may be used by the runner (a GitHub Actions secret on amberai, or generation on the laptop) and approve about $15 of image spend per book.

**Your decisions, nothing else blocks:** (a) "go" for Book 1; (b) the author/imprint name to show on KDP (your existing titles use a personal name; a house name such as the one on your other products is fine if it is yours); (c) for Book 2, the key placement and the spend; (d) running the laptop script when the files are ready.
