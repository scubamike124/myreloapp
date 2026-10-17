# Report 13: how Book 1 gets onto Amazon, three routes, what each needs from you, and the order I recommend

Written 2026-10-17 for the owner's standing instruction (evening): build the system, stay inside Amazon's rules, never collect the Amazon password, and bring back to the owner only the decisions that are the owner's. Evidence tags: **[V]** checked by me in source, a file or a run; **[A]** reported by a review agent; **[U]** not verified.

## Answer first

1. **Nothing has touched Amazon and no book is published.** Everything below is tested against a local fake of KDP, never against Amazon's pages.
2. **The fastest compliant route is your own computer, once, with you signing in.** It needs one sentence from you and about 40 minutes, and no new approval for money, security or accounts.
3. **That first run is also the test that matters most.** It shows whether Amazon accepts a disclosed software agent on your account. A cloud route is only worth building if it does, so the cloud route should be decided after the first run, not before.
4. **Amber's cloud holds no Amazon login and no Amazon session today.** The cloud route needs your approval of an exact list of effects (Route B below); I have built nothing live for it.

## Where things stand

| Item | State | Evidence |
|---|---|---|
| Book 1 files (8.5 x 11 in, 104 pages, black ink) | Built, 8 of 8 QA checks pass, checksums recorded | `kdp/books/bold-patterns-01` [V] |
| Independent print check | ProofMill 0.1.0: 0 errors, 0 warnings on interior and cover; a second calculator gives the same cover size | Report 12 [V] |
| KDP scripts (draft, pre-check, publish, connection check) | Tested against a local fake KDP, 66 tests; never against Amazon | amberai #880 to #885 [V] |
| Every book's status | Derived from files and Bookshelf evidence; Book 1 reads Ready for KDP | `scripts/kdp-pipeline.ts`, dashboard page [V] |
| EPUB for e-books | Builder and validator built; four samples pass the W3C EPUBCheck | amberai #886 [V] |
| The three named GitHub tools | None can run on your account; Amber keeps her own flow | Report 12 [V/A] |
| Amazon credentials or session in Amber's cloud | See "What Amber holds" | #884 [V where stated] |

## Route A: your computer (works now)

You do, in this order (the exact commands come from `npx tsx scripts/kdp-pipeline.ts next`, one at a time):

| Step | You | Time |
|---|---|---|
| 1 | Type one sentence recording your decision to proceed under Amazon's published agent terms (or send it to me and I record it from your words) | 2 min |
| 2 | Read-only check: sign in in the window; it reads the Bookshelf and changes nothing | 5 min |
| 3 | Draft: sign in; the script fills KDP's fields and uploads the two PDFs; you then do the short list it prints (the AI-content choices, the Previewer approval, the pricing terms box) | 30 min |
| 4 | Pre-check: compares what KDP stores with the package; presses nothing | 5 min |
| 5 | Publish: you type PUBLISH at the prompt; the script presses the one button once | 5 min |
| 6 | Read-back: the Bookshelf, then the product page once it says Live | 5 min, a day or three later |

Your password, one-time code and any puzzle go only into Amazon's own page in that window. If Amazon shows a CAPTCHA, a robot check or a block, the script stops and changes nothing; it never answers or works around them.

If Amazon refuses the agent, you finish by hand from the copy sheet (about 25 minutes in Safari or a browser) and I read the result afterwards. That outcome would also tell us not to build Route B.

## Route B: Amber's cloud desk with your iPhone sign-in (needs your approval of the list below)

What it would be: one new small service on Railway running a browser that announces itself as `Agent/AmberOne`. You open a private single-use link on your iPhone, sign in to Amazon in a live view of that browser, and tap "I am signed in". Amber then keeps the session and can create and update the draft by herself. **Publishing would still need your tap on an approval screen** that shows the title, the price and a hash of the files.

| Effect | Detail |
|---|---|
| New spending | One Railway service, my estimate $5 to $10 a month [U: Railway's current prices not checked] |
| New thing Amber holds | An encrypted Amazon session (cookies), kept in the database with the vault's key, with a Disconnect button that wipes it; signing out of all devices in Amazon also ends it |
| Your password | Typed by you into Amazon's own page through the live view. Amber does not store or log it, but her server handles the keystrokes in memory. If that is not acceptable, choose Route A or C |
| Amazon's view | A disclosed software agent signing in from a data-center address. Amazon may challenge more often, ask for re-verification, or limit or refuse agents at its sole discretion [V: Conditions of Use, "Agents", read earlier today]. If it does, Amber stops and asks you; she never solves or bypasses anything |
| KDP Terms 4.3 | The account holder may not let a third party use the program through the account. Whether your own software on a cloud host counts is not settled by any text I have read; this is a risk to your account, and it is yours to accept or refuse |
| Limits I would build in | One title at a time, no bulk submission, drafts only until you tap approve, an emergency stop, and no run without your recorded decision |

What I build before you decide: nothing live. After a yes, the desk, the approval screen and the session store, tested against the fake KDP first.

## Route C: an aggregator with a documented API (needs your approval of the list below)

PublishDrive publishes API documentation with a sandbox (I read its Distribution API page directly) and distributes e-books and print on demand to Amazon [V for the docs, A for the rest]. **It needs a paid plan (prices were not on the pages I could read), your own ISBN for print, a new registration, and its royalty on print is lower than KDP's.** The API is "for large publishers and partners" on its pricing page [A], so access may need a support request. It removes the Amazon sign-in entirely, which is its appeal. It is a new platform registration, which is yours to approve.

## What I recommend

1. **Route A first**, for Book 1, because it needs no new approval and it answers the question that decides everything else.
2. **Decide Route B after that run.** If Amazon accepts the agent on your computer, I build Route B for your approval. If it does not, Route B is not worth building and Route C becomes the way to automate.
3. Meanwhile I keep building what needs nothing from you: the pipeline and its dashboard, the EPUB path for the 36 finished e-books, and the status page.

## What I need from you

| # | Decision | Why |
|---|---|---|
| 1 | Your one-sentence decision for Amazon hosts, or the word that you will do Route A by hand | Without it no script touches Amazon |
| 2 | A time at the computer that has the amberai folder | Route A, about 40 minutes |
| 3 | Later: yes or no to Route B's list above | Only after the first run |
| 4 | Later: yes or no to Route C's list above | Only if Amazon refuses the agent |
