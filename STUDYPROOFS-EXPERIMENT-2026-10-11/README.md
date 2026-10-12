# StudyProofs: can students use it, come back and pay? (the experiment)

Started 2026-10-11 on the owner's go-ahead: "Promoting StudyProofs is a better next experiment than starting another overlapping product, provided students can successfully use and pay for it ... The immediate goal is to find out whether students use it again and pay, not simply generate views."

This folder is the working record. The live numbers are in one comment on the issue tracker (#105 of the amberai repository, marked `amber-studyproofs-tracker`), edited in place by Amber's worker.

## State on 2026-10-12 at 16:05Z

- **The product works end to end in production, and accounts survive a redeploy.** The production walk of 14:27Z passed every step except the address check: signup, a study set from pasted sample notes (16 of 16 citations quote the notes), the same notes as a real text PDF (16 of 16 quote the PDF's text), the library, a graded quiz, a second sign-in, a free-trial code redeemed, a live-mode Checkout session left to expire (no card), Stripe's own records, and **`persist`: the account an earlier walk made two hours before still signed in and still had its study set after the web service was redeployed at 14:22Z**.
- **The one failing check is the address students write to, and the cause is four DNS records only the owner can add.** The product now gives `support@amberoneai.com` (approved for StudyProofs support on 2026-10-12) everywhere, and Amber's support inbox is deployed (amberai #811, #812, #813; #814 open): it reads, tracks and answers routine mail, hands everything else to the owner, and tests itself end to end. Resend receiving is switched on for `amberoneai.com` (done by Amber at 15:27Z) and the webhook is in place. What is missing is DNS at Cloudflare (no agent holds a credential for it): an MX record for the domain, the DKIM key and Resend's two `send` records. Exact values, why it is out of reach and what follows by itself: `SUPPORT-EMAIL.md`. Until they exist the address receives nothing and Resend refuses to send as it; the verdict stays "not ready for students" and nothing is advertised.
- **Demonstrations:** two made (BIO 101, STAT 200; every item cited), reviewed against their notes (`DEMO-REVIEWS.md`), rendered (`demos/`) and registered as example pages in a **draft** amberai pull request (#809) held until a production walk passes. **BIO 101 question 3, which had two defensible answers, is reworded (the owner's instruction of 2026-10-12): the page says "One change by a person", marks the question and shows the product's original under it; nothing calls that example unedited any more.** HIST 120 was not made in three rounds of five tries (one or two items without a citation each time); the worker tries again every four hours (next about 00:38Z).
- **The exact launch posts, tracking links, listing texts and the tutoring-center email are in `LAUNCH-APPROVAL.md`, for the owner's approval.** Nothing in it has been posted or sent; every platform needs an account only the owner can create.
- **Real payment: unverified.** No real transaction has been completed. The probe goes as far as a live-mode Checkout session (never a card); the owner's $1 round trip (`HANDOFF.md`, owner's decision 6) is the only way to see a real payment and a real cancellation through the portal.
- **Nothing advertised, nothing sent to anyone new, $0 taken.** No visit has come from a promoted link.

## The rule that comes first

**Nothing advertises StudyProofs until the product passes in production**, tested by the product's own code the way a student uses it: sign up, upload notes, get flashcards and a quiz, come back, and take the first step of subscribing. Amber's worker runs that walk against production once a day (the "journey probe") and the tracker states the verdict. Until a run passes, the existing daily tutoring-center email campaign is held too (an email to an institution is advertising).

## What exists, and where

| Piece | What it does | Where | State |
|---|---|---|---|
| Funnel measurement | Counts visitors (browser sessions), signups, first study set, came back, free-trial started, checkout started, verified live payments, by source; leaves out synthetic and test accounts; revenue only from Stripe's signed word in live mode | amberai PR #805 (`src/lib/studyproofs/funnel.ts`), fixed in #807 | merged and deployed |
| Production journey probe | The walk above, plus read-only checks of the OpenAI key, the Stripe key and its mode, Stripe's webhook records, and whether the product's domain can receive mail; names the exact missing requirement | PRs #805, #806, #807 (`probe.ts`); a real text PDF, accounts that survive between runs and Stripe's customer portal are added in the product-fixes PR | merged and deployed (#805 to #808); the additions (text PDF, persistence, portal) ran for the first time at 12:26Z on 2026-10-12 and passed, except persistence, which needs a second walk |
| Tracker comment | Verdict, funnel, probe, demonstrations, outreach state | PRs #805, #807 (`tracker.ts`) | merged and deployed |
| Gate on the outreach campaign | The daily 18:30Z tutoring-center campaign sends only while the probe has a current pass (the newest run passed within 36 hours, under the current rules) | PR #806 | merged and deployed; the approval list is empty, so nothing sends |
| Demonstrations | The product's own pipeline run over three sample notes we wrote; kept only if every card and question cites a real line of the notes; posted for review; never edited | PR #806 (`demo-gen.ts`) | merged and deployed; the first attempt (2026-10-11 20:56Z) kept none (4 flashcards from each short sample); the version that tries each sample up to five times made BIO 101 and STAT 200 at 12:26Z on 2026-10-12 and not HIST 120 (retried after four hours) |
| Example pages | `/studyproofs/examples/<slug>`: the notes, and everything the product made, each item with its source line | PR #806 (`examples.ts`) | merged; empty until the first reviewed example |
| Free trials | A code the owner's side makes (an internal route): Student or Pro for a number of days, no card, no charge, one per account, never counted as a payment | PR #806 (`trial.ts`) | merged and deployed |
| Video and image renderer | Turns a reviewed demonstration into a 32-second vertical video (silent, captions on screen), a feed image, a pin image and a preview image | `tools/render-demo.mjs` here | built |
| Community research | Where student-audience promotion is allowed, rules per place, what a first post looks like | `COMMUNITY-RESEARCH.md` here | filed |

## What the numbers mean (printed on the tracker too)

- **Visitors** are browser sessions that loaded a StudyProofs page, once per page per session, after the page loaded (crawlers and link previews are not counted). No IP address or cookie is kept.
- **Source** is the link's `src` (or the older `ref`) and `campaign`, kept for the browser session so a signup is attributed to the page that brought the student; a source lost between sessions shows as direct.
- **First study set**: a study set with at least one flashcard or question. **Came back**: activity six hours or more after signing up on a later UTC day, or twenty hours or more after on any day (so one late-night sitting that crosses midnight is not a return, and a student who comes back the next evening is).
- **Free trial started**: the account redeemed a trial code. It is never a payment. **Paid (live)**: Stripe's signed webhook for a live checkout session, once per account; the revenue column adds only that first payment.
- Synthetic accounts (the probe's), the worker's self-test, test-mode payments and the owner's own $1 verification plan are left out of every count.

## The two-week test (starts only when the gate is open)

See `LAUNCH-KIT.md` (written when the demonstrations exist) for the day-by-day list. In short, ranked by who can do it:
1. Amber alone: the example pages (indexable, in the sitemap), the demonstrations, the kit.
2. A one-time owner step per platform (create the StudyProofs account; solve any CAPTCHA or phone check): Instagram, TikTok, YouTube, Pinterest; a personal Product Hunt account a week before a launch.
3. A person posting by hand where the platform allows nothing else (every platform above except the example pages), one place at a time, reading each community's rules first.
4. Owner-approved outreach to tutoring centers and student creators with the demo and a trial code (nothing is sent to anyone new without the owner's go-ahead).

## What this experiment cannot tell

Two weeks and a small audience will say whether students who arrive use it again and whether any pay; they will not say what a large audience would do. A student who pays on day 12 has not yet shown renewal. The first-touch source is only as good as the link people follow.
