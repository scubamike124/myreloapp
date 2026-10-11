# StudyProofs: can students use it, come back and pay? (the experiment)

Started 2026-10-11 on the owner's go-ahead: "Promoting StudyProofs is a better next experiment than starting another overlapping product, provided students can successfully use and pay for it ... The immediate goal is to find out whether students use it again and pay, not simply generate views."

This folder is the working record. The live numbers are in one comment on the issue tracker (#105 of the amberai repository, marked `amber-studyproofs-tracker`), edited in place by Amber's worker.

## The rule that comes first

**Nothing advertises StudyProofs until the product passes in production**, tested by the product's own code the way a student uses it: sign up, upload notes, get flashcards and a quiz, come back, and take the first step of subscribing. Amber's worker runs that walk against production once a day (the "journey probe") and the tracker states the verdict. Until a run passes, the existing daily tutoring-center email campaign is held too (an email to an institution is advertising).

## What exists, and where

| Piece | What it does | Where | State |
|---|---|---|---|
| Funnel measurement | Counts visitors (browser sessions), signups, first study set, came back, free-trial started, checkout started, verified live payments, by source; leaves out synthetic and test accounts; revenue only from Stripe's signed word in live mode | amberai PR #805 (`src/lib/studyproofs/funnel.ts`) | see the PR |
| Production journey probe | The walk above, plus read-only checks of the OpenAI key, the Stripe key and its mode, Stripe's webhook records, and whether the product's domain can receive mail; names the exact missing requirement | PR #805 (`probe.ts`) | see the PR |
| Tracker comment | Verdict, funnel, probe, demonstrations, outreach state | PR #805 (`tracker.ts`) | see the PR |
| Gate on the outreach campaign | The daily 18:30Z tutoring-center campaign sends only while the probe has a current pass (the newest run passed within 36 hours, under the current rules) | follow-up PR | built |
| Demonstrations | The product's own pipeline run over three sample notes we wrote; kept only if every card and question cites a real line of the notes; posted for review; never edited | follow-up PR (`demo-gen.ts`) | built, waits for the key |
| Example pages | `/studyproofs/examples/<slug>`: the notes, and everything the product made, each item with its source line | follow-up PR (`examples.ts`) | built, empty until the first reviewed example |
| Free trials | A code the owner's side makes (an internal route): Student or Pro for a number of days, no card, no charge, one per account, never counted as a payment | follow-up PR (`trial.ts`) | built |
| Video and image renderer | Turns a reviewed demonstration into a 32-second vertical video (silent, captions on screen), a feed image, a pin image and a preview image | `tools/render-demo.mjs` here | built |
| Community research | Where student-audience promotion is allowed, rules per place, what a first post looks like | `COMMUNITY-RESEARCH.md` here | filed |

## What the numbers mean (printed on the tracker too)

- **Visitors** are browser sessions that loaded a StudyProofs page, once per page per session, after the page loaded (crawlers and link previews are not counted). No IP address or cookie is kept.
- **Source** is the link's `src` (or the older `ref`) and `campaign`, kept for the browser session so a signup is attributed to the page that brought the student; a source lost between sessions shows as direct.
- **First study set**: a study set with at least one flashcard or question. **Came back**: activity on a UTC day after the signup day.
- **Free trial started**: the account redeemed a trial code. It is never a payment. **Paid (live)**: Stripe's signed webhook for a live checkout session, once per account; the revenue column adds only that first payment.
- Synthetic accounts (the probe's), the worker's self-test, test-mode payments and the owner's own $1 verification plan are left out of every count.

## The two-week test (starts only when the gate is open)

See `LAUNCH-KIT.md` (written when the demonstrations exist) for the day-by-day list. In short, ranked by who can do it:
1. Amber alone: the example pages (indexable, in the sitemap, announced through IndexNow), the demonstrations, the kit.
2. A one-time owner step per platform (create the StudyProofs account; solve any CAPTCHA or phone check): Instagram, TikTok, YouTube, Pinterest; a personal Product Hunt account a week before a launch.
3. A person posting by hand where the platform allows nothing else (every platform above except the example pages), one place at a time, reading each community's rules first.
4. Owner-approved outreach to tutoring centers and student creators with the demo and a trial code (nothing is sent to anyone new without the owner's go-ahead).

## What this experiment cannot tell

Two weeks and a small audience will say whether students who arrive use it again and whether any pay; they will not say what a large audience would do. A student who pays on day 12 has not yet shown renewal. The first-touch source is only as good as the link people follow.
