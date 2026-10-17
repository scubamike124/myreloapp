# Report 9 — the Amber One Press operating plan: what exists, what is proven, what is missing, what it will take

Written 2026-10-17 16:4xZ for the owner's six-priority plan. Rules followed: reuse before building; nothing called operational unless it was tested; estimates are labelled; no spend, no publishing, no new e-book, no new book project, no Amazon request.
Tags: **[T]** tested or demonstrated, with the evidence named; **[E]** exists in code but not tested for this use; **[N]** new work; **[?]** not knowable from here.

## Bottom line

1. **The KDP connection is not finished.** Your own sign-in works (Safari). Amber acting needs your decision on Amazon (ask first, or record your own decision) and the laptop; the corrected scripts are merged (#877, 16:41Z) and a read-only connection check is merged too (#879, 16:55Z). Report 8 has the evidence on the earlier upload: two laptop scripts, no record of a run, not autonomous.
2. **The store holds 56 e-books, not about 100, and they are PDFs, not EPUBs.** 36 are finished and live on your storefront. 20 were started on 11 September and never finished (section 1).
3. **Coloring books: one full pipeline works [T]**, but its art is code-drawn icon style and the upload step has never run on KDP's real pages.
4. **YouTube: uploading works [T]** (one Short a day, a library of 40 recorded Shorts all public), but only for StudyProofs, at one a day.
5. **Continuous Amazon market research cannot be built the way the plan describes.** Amazon's Conditions of Use exclude data-mining and robots, so a daily bestseller scraper would break them. Permitted substitutes are in section 5.
6. **Everything below costs $0 to build and run with existing systems**, except the items marked "needs your approval". The work is about two to three weeks of focused effort, front-loaded (section 6).

## 1. The e-books: how many, where, in what state

| Question | Evidence | Tag |
|---|---|---|
| How many are ready for sale? | **36**, from the production worker's beacon, `ebookRevenue.ready` (tracker #105, comment 5737077514, rewritten 2026-10-17 16:08Z). The October 12 audit read the same 36. | [T] |
| Is the total larger? | **56 in the store**, from the report amberai #878 published on the tracker at 18:13Z (comment 6238364871): 36 ready for sale and 20 held back. The 20 are unfinished: 13 at spec (no text yet), 3 writing, 2 rewriting, 1 in technical QA, 1 in product QA, all started 2026-09-11, none with a cover; four have PDFs but failed premium QA (scores 0 to 20). The 36 finished books were all made 20 to 25 August, all have covers, and pass the factory's own premium QA (60 to 100) and technical QA. | [T] |
| Where are they stored? | `.data/ebook-factory/` on amber-hq-web's persistent volume (`books.json`, `manuscripts/`, `pdfs/`, `covers/`). **Not in git, not on your laptop, not on the worker.** The `data/ebook-factory/books.json` in the repository is five test books made on 2026-10-10. | [T] code; [?] volume contents |
| Format? | **PDF only**, a short and a long edition per book (`fileFormat: "pdf"`). No EPUB exists in either repository (the one EPUB I know of, for the Los Angeles guide, is on your laptop). | [T] code |
| Any Amazon or KDP credential in Amber's vault? | **None.** The #878 report read the names of all configured vault entries and site logins at 18:13Z and found none that mentions Amazon, KDP or Kindle (names only; no value was read). | [T] |
| Why do you remember about 100? | The code cites a "blueprint" of 92 books and says "Amber will not invent missing books". The factory's kill switch is on today and its latest tick researched and advanced nothing (beacon, 16:08Z); the October 12 audit places its activity before 11 September. | [T] |
| Published anywhere? | **Your own storefront is live and lists the 36** (public catalog read from a runner at 17:44Z; the catalog is not locked). **None is on KDP**: the factory's KDP record reads `needs_owner_submission` for 33 books and none is listed, and its directory says KDP has no listing API. Whether your store's checkout takes real payments is not verified. The beacon's `assetsPublished: 0` counts traffic assets, not books. | [T] |

## 2. What it takes to make them Kindle-ready

| Step | What | Tool and cost | State |
|---|---|---|---|
| Source text | Each book has manuscripts for a short and a long edition on the volume; a Kindle title needs one text | read from the volume | [N] |
| Choose one edition per title | Publishing both would put two near-identical titles under one name, which Amazon can treat as duplicate content | your decision | [N] |
| Build EPUB 3 | Cover page, title page, copyright page, table of contents, chapters as XHTML with a navigation document | a small builder in the repository; no new subscription | [N], about 1 day |
| Validate structure | EPUBCheck, the W3C validator that KDP's own pipeline resembles | free, runs on a GitHub runner | [N], part of the day above |
| Kindle rendering | Kindle Previewer (Amazon's own tool, **Windows and macOS only**) or KDP's online previewer after upload | free; one look by you per title | [N] |
| Spelling and grammar | hunspell or LanguageTool on the text | free, on the runner | [N], half a day |
| Cover | KDP wants a JPEG, recommended 2,560 × 1,600 px, at least 300 dpi, under 5 MB (KDP help, as quoted by a search; confirm at upload). The factory's covers are SVG or PNG, some made by an image model | render with a free library | [N], half a day; image-model covers must be disclosed |
| Content accuracy | The factory's own premium QA is an AI judge, not a fact check. Business and AI how-to text can contain confident errors | **you or I read the strongest few before publishing**; no tool replaces it | [N] |
| Originality and rights | The factory has an internal duplicate guard. There is no outside plagiarism check; a paid one would need your approval | | [N] |
| KDP disclosure | AI-generated text: **Yes**; cover art: Yes if an image model made it, as for the coloring book; translations: No. Disclosed per title | answered from a metadata file, never guessed | [N] |
| Limits | KDP reportedly caps new titles at 3 a day (reports from September 2023; I found no 2026 figure). Your target of one or two a day is under it | | [?] |
| Author name | The factory uses "Amber". You chose "Amber One Press" for the coloring books | your decision | [N] |

**Ranking by sales potential** needs Amazon demand data, which section 5 says cannot be scraped. The factory's own demand scores come from Open Library, Google Books and similar non-Amazon sources. They rank interest, not sales. Business and AI-income topics are crowded on Amazon; I expect most of these titles to sell little without promotion. The honest test is yours: publish the three strongest as drafts you approve, then read KDP's own sales report.

## 3. Coloring books: what already works

| Capability | Evidence | Tag |
|---|---|---|
| Builder: interior PDF, full-wrap cover PDF, listing metadata, QA report, copy sheet for the iPhone | Book 1 (8.5 × 11 in, 104 pages, 37 motif families). Builds in 2 seconds; all QA checks pass; **byte-identical** on this machine and on a GitHub runner (the runner of main, run 39042986067; hashes in Report 4) | [T] |
| Cloud build, laptop off | `kdp-coloring-build.yml`, 46 to 47 seconds, about one billed minute | [T] |
| KDP math | Trim, spine, bleed, printing cost and royalty ($9.99 gives $3.15 at 60 percent) | [T] against KDP's published tables |
| AI-disclosure answers | Images Yes, text Yes, translations No for code-drawn art written by an AI | [T] reasoning; [?] Amazon's view |
| Draft upload to KDP | `scripts/kdp-coloring-draft.ts`; typechecks and lints; **never run on KDP's real pages**; gated on your decision | [E] |
| Winter rooms sample | Six pages of 8.5 × 8.5 in, 24 drawing functions, on a branch (not merged). Clean and readable, but plainer than hand-drawn leaders and **too many small cells** for "bold and easy" (Report 6, section 8) | [T] samples; [N] to fix |
| Seasonal timing | Halloween is 14 days away (not worth a new book now). Thanksgiving 26 November, Christmas 25 December, Valentine's Day 14 February, Easter 28 March 2027. KDP review takes about 72 hours (a secondary claim) | dates [T]; review time [?] |
| Art quality beyond code-drawn | Needs an image model (about $15 a book, my earlier estimate) or a human illustrator | **needs your approval** |

## 4. YouTube: what already works

| Capability | Evidence | Tag |
|---|---|---|
| The AmberOne channel is connected and uploads by itself | StudyProofs lane: first automatic Short at 2026-10-17 01:17Z, https://www.youtube.com/shorts/dsbz_AhX74s, read back publicly without a login at 01:29:54Z | [T] once |
| A record of earlier Shorts | 40 Shorts recorded as published, all 40 answered as public or unlisted at 15:54Z today (YouTube's oEmbed, no login) | [T] |
| Schedule | One upload a day at 22:00 UTC, at most 7 in 7 days, nothing repeated within 30 days, inside the worker's recurring tick. **The second automatic upload is due tonight at 22:00Z and is not yet verified.** | [T] design; [?] repeat |
| Cloud video rendering | `sp-video-render.yml`, Remotion on a GitHub runner, 30-minute limit, file kept as an artifact | [T] one render |
| Channels with a stored login | AmberOne, Amber API Marketplace, Amber E-Book Factory connected; Launch Ready expired | [T] the worker's social report, refreshed 15:55Z |
| Public posting approval | Your approval of 2026-10-14 covers the StudyProofs lane only. For coloring books your message asks for Shorts "once we have published books"; each public upload needs that gate kept | [T] |
| Limits | YouTube's default API quota is 10,000 units a day; whether one upload costs 1,600 or about 100 units is disputed by sources, and three a day fits either way. Remotion is free for individuals and for-profit companies of up to three employees | [?] cost per upload |

New work for coloring promotion: a Remotion template that colors a page in (the pages are vector, so regions can be filled in order), a new lane with its own cadence, and a link policy (Shorts descriptions are not reliably clickable; use the channel profile). Nothing advertises a book until you confirm its product page is live; I will not open Amazon pages to check.

## 5. What remains to connect

| System | State | What is missing | Constraint |
|---|---|---|---|
| **Publishing** (KDP) | Own sign-in works; Amber's access not operational | Your decision on Amazon; the laptop; one watched run; an e-book draft script built from the corrected older one | Drafts only; you publish |
| **Market research** | One snapshot of four bestseller lists and 16 product pages (94 requests, disclosed) | A permitted source: Amazon's Conditions of Use exclude "data mining, robots, or similar data gathering and extraction tools" and "collection and use of any product listings, descriptions, or prices". **A daily scraper is not permitted.** Permitted: your own manual weekly look at the public lists (a few screenshots that I read), KDP's own reports, non-Amazon signals (Google Trends, Pinterest and YouTube search interest), or a licensed data vendor (**needs your approval and money**) | I made no further Amazon reads and will not |
| **Sales and royalty reporting** | None | KDP offers reports on the website only. Lowest risk: **you export the report** (the Reports tab, a file) and Amber reads it; no Amazon access by Amber. Until then every sales figure is "unavailable" | Never claim sales without that file |
| **Promotion** | StudyProofs lane works | Coloring lane, template, cadence 2 to 3 a day, storage for more videos than the website image should carry (the vault holds Cloudflare R2 settings) | No advertising purchases; no claim that YouTube caused a sale |
| **Dashboard** | The Reelo Business Center already shows Amber's earnings from HQ (`/business-center/amber-earnings`) | A new Amber One Press page and an HQ data route: ready-for-review, published, e-book versus coloring, seasonal and trending, sales and royalties, YouTube, costs, next opportunities. Every number tagged verified, estimate, unavailable or planned | Private data stays behind your login |

## 6. Time and cost, existing versus new

Time is focused working time of mine, with continuous-integration waits and your own steps on top. These are estimates, not promises.

| Work | Existing | New | Estimate | Cost |
|---|---|---|---|---|
| KDP connection, laptop route | assist browser (23 checks), corrected scripts (#877), gate, read-only check (#879), all merged; the check is tested only against a fake Bookshelf | your decision; laptop runbook; first watched run; fixes from real pages | half a day of mine, plus your 30 to 60 minutes, **earliest tomorrow** | $0 |
| E-book stock report | factory, revenue engine | #878 (written, tested, merged 16:54Z) | deploy and a worker tick: under an hour | $0 |
| EPUB build, validate, spellcheck, covers, manifest | PDFs, covers, QA scores | converter, EPUBCheck workflow, cover renderer | 2 to 3 days | $0 |
| Review of the strongest e-books | premium QA scores | a read by you or me of the top few; originality and accuracy notes | 2 hours per book | $0 (outside plagiarism checks need approval) |
| E-book KDP drafts | corrected older script | metadata-driven version, tested on a watched run | 1 day after the connection | $0 |
| Coloring books: the first seasonal titles | builder, QA, cover, copy sheet | cell-size QA, hero pages, 42-page winter book, second theme | 2 days per title for code-drawn art | $0; about $15 a book if you approve an image model |
| Market research system | one snapshot | permitted sources, weekly recommendation, KDP report reader | 2 to 3 days | $0 (a data vendor would need approval) |
| YouTube coloring lane | upload lane, cloud render | Remotion template, lane, cadence, storage | 3 days | $0 |
| Dashboard | Business Center, HQ bridge | the page and route, with the verified or estimated tags | 2 to 3 days | $0 |
| **Whole plan** | | | **about two to three weeks**, first drafts within days | $0 unless you approve the items marked |

Operating cost of what already runs (Railway, Supabase, Resend, domains) is not visible from this session and is unchanged by this plan.

## 7. Decisions I need from you

1. Amazon: ask KDP Support first, or record your own decision to proceed under the Agent Terms (Report 8, section 4).
2. The laptop as host, and the day you will be at it.
3. Whether to approve an image model for coloring art (about $15 a book) or stay with code-drawn pages for now.
4. One edition per e-book title (long or short), and the author name for e-books.
5. Whether the market-research plan should use your manual weekly look plus the permitted substitutes instead of a scraper.
6. Whether to remove the raw Amazon list files from the public reports repository (Report 5, section 6).

## 8. Not done, on purpose

No e-book written or changed. No book published or created on KDP. No money spent. No second KDP account. No Amazon request. The winter-rooms sample stays parked.
