# StudyProofs launch: the exact posts, links and steps, for your final approval

*Prepared 2026-10-12. The same content, with a Copy button on every text and the four DNS records first, is a private page: https://claude.ai/artifact/LH2dVervn8qVqKF9W7ZVUQ (made by `tools/make-kit-page.py`). Nothing in this page has been posted, sent or paid for. The texts below are copied by a script from `kit/KIT-TEXT.md` (made by `tools/make-kit.mjs` from the reviewed demonstrations), so a number in a caption is the number the product produced.*

## Where things stand (read first)

| Item | State |
|---|---|
| Student journey in production (signup, upload, PDF, flashcards, quiz, return, trial, checkout session, Stripe records) | **Passes** (production walk 2026-10-12 14:27Z; accounts and saved sets survived a redeploy) |
| Advertising gate | **Shut** until the production walk passes its last step: the address students write to must receive mail. `support@amberoneai.com` is now the address in the product; it receives nothing until the DNS records in Amber's support-mail comment on #105 are added (see `SUPPORT-EMAIL.md`) |
| Real payment | **Unverified.** No real transaction has been completed. The checkout session is created and left to expire; the first live payment is counted only when Stripe's signed webhook confirms it. Optional: your own $1 round trip (`HANDOFF.md`, decision 6) |
| Example pages | Ready (BIO 101, STAT 200) in amberai draft PR #809, merged only when the gate opens. A third (HIST 120) is retried automatically about 16:26Z |
| Accounts for any platform below | **None exist.** Every platform needs an account only you can create (identity, phone or CAPTCHA checks) |

## What I am asking you to approve

1. **The texts** in Part 2 (each is labelled with where it goes). Reply with the part or the platform and "approved", or tell me what to change.
2. **The first wave** in Part 1 (which channels, in which order). I recommend all of Wave 1 and the two free directory forms of Wave 2; Product Hunt and communities only if you want them.
3. **Who publishes.** Amber cannot post to any of these (no platform allows it without an audit or an approval that does not exist); a person uploads the file and pastes the text. You, or someone you name.
4. **The tutoring-center email**, if you want it to go out: its exact words are in Part 4 with fingerprint `325af7731b77`. The campaign sends nothing until your words approving that exact fingerprint are recorded with the date.

Nothing starts until you say so **and** the tracker says "the whole journey passed in production".

## Part 1. The plan, by wave

### Wave 1: your own accounts (about an hour of your time in all)

| # | Channel | One-time step (only you can do it) | Then, per demonstration | Link used |
|---|---|---|---|---|
| 1 | Pinterest (business account, free) | Create the account; Settings, *Bulk Create Pins*, upload `kit/pinterest-bulk.csv` from a desktop browser | 2 pins, each to its own example page | `?src=pinterest&campaign=<slug>` |
| 2 | Instagram (professional account, free) | Create the account | A Reel (the video, the Reel text) and a Story (link sticker) | bio: `?src=instagram-bio`; sticker: `?src=instagram&campaign=<slug>` |
| 3 | TikTok (business account, free) | Create the account, switch it to Business | The video and its caption; turn on *Disclose commercial content*, then *Your brand* | bio: `?src=tiktok-bio` |
| 4 | YouTube (channel, free) | Create the channel | The same video as a Short, title and description below | channel About: `?src=youtube-about`; description: `?src=youtube&campaign=<slug>` |

The video files are in `demos/<slug>/demo-1080x1920.mp4` (silent, 32 s, captions on screen); images in the same folder. Caption links are not clickable on TikTok, Instagram or YouTube Shorts, so each profile carries its own link (the *Link used* column) and the Story uses the link sticker.

### Wave 2: listings (a person fills one form each; stop at any price, badge or reciprocal-link request)

| # | Site | Cost | What you do | Link used |
|---|---|---|---|---|
| 5 | AlternativeTo | Free queue (a paid fast track exists; do not use it) | Create an account, *Suggest new application*, paste Part 3 text | `?src=alternativeto` |
| 6 | ISTE EdTech Index | No cost to register | Register the product, paste Part 3 text | `?src=iste` |
| 7 | Product Hunt | Free | Create a **personal** account now (a new account cannot post for a week); launch no earlier than day 8 and only if you agree; no request for votes | `?src=producthunt` |

### Wave 3: communities, only where the written rules allow it

One post, by hand, in each community whose rules (or a moderator) allow it: Discord study servers and Facebook study groups you already belong to. Read the rules first; ask a moderator if the rules do not say; no direct messages; never the same text in two places; if a community says no, stop there. The research could not name one server or group that permits promotion (that is readable only by joining), so this wave is yours to choose. No Reddit.

## Part 2. The exact posts, per demonstration

### Cellular respiration (BIO 101): 8 flashcards, 4 quiz questions

Files: `cell-respiration/demo-1080x1920.mp4` (vertical video, silent, 32 s), `cell-respiration/feed-1080x1350.png`, `cell-respiration/pin-1000x1500.png`, `cell-respiration/preview-1200x630.png`.

**TikTok** (turn on *Disclose commercial content* then *Your brand*): BIO 101 notes in, flashcards and a quiz out. Sample notes we wrote → 8 flashcards and 4 quiz questions from StudyProofs, each with the line it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to try, link in bio. #studytok #flashcards #studytips #college

**Instagram Reel**: BIO 101 notes in, flashcards and a quiz out. We wrote these sample notes and StudyProofs made the flashcards and the quiz, each one with the line of the notes it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to start: link in bio. #flashcards #studytips #college #studygram

**Instagram Story** (link sticker to https://hq.amberoneai.com/studyproofs/examples/cell-respiration?src=instagram&campaign=cell-respiration): Try it with your own notes (free to start)

**YouTube Short** title: Cellular respiration: notes in, flashcards and a quiz out

Description: Sample BIO 101 notes we wrote, turned into 8 flashcards and 4 quiz questions by StudyProofs, each with the line it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Try it free: https://hq.amberoneai.com/studyproofs/examples/cell-respiration?src=youtube&campaign=cell-respiration

**Pinterest pin** (also in `pinterest-bulk.csv`): BIO 101 notes → flashcards and a quiz (sample). Sample BIO 101 notes we wrote, turned into flashcards and a quiz by StudyProofs, each with the line of the notes it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to try.

**One post in a community that allows it** (only after reading its rules; once; no direct messages): We made a free tool that turns your own notes into flashcards and a quiz and, where it can, shows the line each one came from. Here is a sample from BIO 101 notes we wrote, shown as the product made it, except one quiz question a person reworded (the page says which, and shows the original): https://hq.amberoneai.com/studyproofs/examples/cell-respiration?src=community&campaign=cell-respiration . It makes mistakes sometimes, so check it against your notes. (We make it; delete this if posts like this are not allowed here.)

**Image alt text**: StudyProofs demonstration: BIO 101 sample notes become flashcards and a quiz. Example prompt: What is the overall equation for cellular respiration?

**Bio links** (one per platform so each is counted on its own): https://hq.amberoneai.com/studyproofs/examples?src=tiktok-bio, https://hq.amberoneai.com/studyproofs/examples?src=instagram-bio, https://hq.amberoneai.com/studyproofs/examples?src=youtube-about

### Hypothesis testing basics (STAT 200): 8 flashcards, 8 quiz questions

Files: `hypothesis-testing/demo-1080x1920.mp4` (vertical video, silent, 32 s), `hypothesis-testing/feed-1080x1350.png`, `hypothesis-testing/pin-1000x1500.png`, `hypothesis-testing/preview-1200x630.png`.

**TikTok** (turn on *Disclose commercial content* then *Your brand*): STAT 200 notes in, flashcards and a quiz out. Sample notes we wrote → 8 flashcards and 8 quiz questions from StudyProofs, each with the line it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to try, link in bio. #studytok #flashcards #studytips #college

**Instagram Reel**: STAT 200 notes in, flashcards and a quiz out. We wrote these sample notes and StudyProofs made the flashcards and the quiz, each one with the line of the notes it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to start: link in bio. #flashcards #studytips #college #studygram

**Instagram Story** (link sticker to https://hq.amberoneai.com/studyproofs/examples/hypothesis-testing?src=instagram&campaign=hypothesis-testing): Try it with your own notes (free to start)

**YouTube Short** title: Hypothesis testing basics: notes in, flashcards and a quiz out

Description: Sample STAT 200 notes we wrote, turned into 8 flashcards and 8 quiz questions by StudyProofs, each with the line it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Try it free: https://hq.amberoneai.com/studyproofs/examples/hypothesis-testing?src=youtube&campaign=hypothesis-testing

**Pinterest pin** (also in `pinterest-bulk.csv`): STAT 200 notes → flashcards and a quiz (sample). Sample STAT 200 notes we wrote, turned into flashcards and a quiz by StudyProofs, each with the line of the notes it came from. Made by StudyProofs. AI can make mistakes, so check the cards against your notes. Free to try.

**One post in a community that allows it** (only after reading its rules; once; no direct messages): We made a free tool that turns your own notes into flashcards and a quiz and, where it can, shows the line each one came from. Here is a sample from STAT 200 notes we wrote, shown unedited: https://hq.amberoneai.com/studyproofs/examples/hypothesis-testing?src=community&campaign=hypothesis-testing . It makes mistakes sometimes, so check it against your notes. (We make it; delete this if posts like this are not allowed here.)

**Image alt text**: StudyProofs demonstration: STAT 200 sample notes become flashcards and a quiz. Example prompt: What is the null hypothesis (H0)?

**Bio links** (one per platform so each is counted on its own): https://hq.amberoneai.com/studyproofs/examples?src=tiktok-bio, https://hq.amberoneai.com/studyproofs/examples?src=instagram-bio, https://hq.amberoneai.com/studyproofs/examples?src=youtube-about

**Disclosure on every post (already in the texts):** "Made by StudyProofs. AI can make mistakes, so check the cards against your notes." Nothing here is a testimonial, a grade or a result; nothing says unlimited recording, predicted exam questions, guaranteed grades, or compares with another product.

**One change to know about:** BIO 101 quiz question 3 was reworded by a person on 2026-10-12 because the product's wording had two defensible answers. The example page says so and shows the product's original under it, and the BIO community post says so. STAT 200 is exactly as the product made it.

## Part 3. Listing texts (Wave 2)

**Product Hunt**

- Name: `StudyProofs`
- Tagline (52 of 60 characters): `Flashcards and quizzes from your notes, with sources`
- Description (234 of 260 characters): `Paste or upload your notes and get flashcards, a quiz and study notes back, each with the line of your notes it came from where it can find one. Free plan: 3 uploads a week. AI can make mistakes, so check the cards against your notes.`
- Link: `https://hq.amberoneai.com/studyproofs/examples?src=producthunt`
- First maker comment: `I'm the founder of StudyProofs. It turns your own notes into flashcards and a quiz and shows the line of the notes each one came from, where it can find one. There are two samples made from notes we wrote, one reworded question marked on its page: https://hq.amberoneai.com/studyproofs/examples?src=producthunt. It is young and it makes mistakes sometimes, so what is confusing or wrong? Free plan available.`

**AlternativeTo** (no price comparison, no "cheaper than", no "alternative to" choice that names a product we compare ourselves with)

- Name: `StudyProofs`
- Short description: `Paste or upload notes, get flashcards, a quiz and study notes, each with the line it came from. Web. Free plan.`
- Link: `https://hq.amberoneai.com/studyproofs/examples?src=alternativeto`

**ISTE EdTech Index** (written for educators)

- Name: `StudyProofs`
- Description: `Students paste or upload their own notes and get flashcards, a quiz and study notes back, each with the line of the notes it came from where it can find one. There is a free plan (3 uploads a week); paid plans are $4.99 a month (Student) and $9.99 a month (Pro). It is a young product and the study tools can contain mistakes, so students are told to check them against their notes.`
- Link: `https://hq.amberoneai.com/studyproofs/examples?src=iste`

## Part 4. The tutoring-center email (held; sent by the campaign, not by hand)

The campaign emails one university tutoring or academic-support center at a time, at an address the institution published on its own site, with an unsubscribe link and the postal address. It sends nothing until you approve the exact text. Fingerprint of this text and the trial's terms: `325af7731b77`.

**Subject:** Free StudyProofs for {INSTITUTION} students: a working demo and a free semester

> Hi,
>
> I'm writing from StudyProofs, a small study tool. A student pastes or uploads their own notes and gets flashcards and a quiz back. Where it can, each one shows the line of the notes it came from, and it says when it cannot find one, so it is easy to check.
>
> You can see what it makes from sample notes we wrote, with the line each item came from: https://hq.amberoneai.com/studyproofs/examples?src=tutoring-centers&campaign=outreach
>
> If it would help {INSTITUTION}'s students, they can have Pro free for a semester (120 days). No card, nothing is charged, and their notes stay theirs when it ends. They sign up with this link, which fills in the code TUTORING-SEMESTER: https://hq.amberoneai.com/studyproofs/signup?src=tutoring-centers&campaign=outreach&code=TUTORING-SEMESTER (one use per student account, up to 300 students in all).
>
> The free plan is real too: 3 uploads a week, and what a student makes stays in their library. Paid plans are $4.99 a month (Student) or $9.99 a month (Pro) and cancel any time.
>
> It is a young product and the study tools can contain mistakes, so we tell students to check them against their notes. If this is not something you share with students, you do not need to reply and we will not write again. If you have a question, reply to this message.
>
> The StudyProofs team

Replies go to `support@amberoneai.com`, where Amber's support inbox keeps them and hands every one to you (a reply from an institution is never answered automatically).

**To approve it**, say in your own words that you approve the tutoring-center email with fingerprint `325af7731b77`; Amber records your words and the date in the repository and the campaign may then send (one email per institution, at most the daily limit, only while the production walk passes). Older fingerprints `53d7f4d2531d` and `2a7f67c15748` are withdrawn.

## Part 5. How results are read (nothing is inflated)

The tracker comment on #105 (marker `amber-studyproofs-tracker`) counts, per source: visitors, signups, first study sets, the share of signups at least a day old who came back, free trials started, checkouts started and **verified live payments** (a Stripe live-mode checkout that completed, through its signed webhook, once per account). A source with many visitors and no first study set is a message problem; with first study sets and no return, a product problem; with returns and no payment, a price or value problem. Amber reads it at day 7 and day 14 and says which source brought students who came back.

## Part 6. Not started, and why

- **Connected accounts:** none of Amber's 44 social account rows belongs to StudyProofs; none is connected. Posting to them would be posting StudyProofs under another brand, which the owner's rules rule out.
- **Reddit:** excluded by your rule. **Paid listings, fast tracks, sponsorships:** excluded by the no-spend rule.
- **Student creators:** a person-to-person request you choose and send yourself (`OUTREACH.md`); Amber prepares the note and a trial code of their own on request.
