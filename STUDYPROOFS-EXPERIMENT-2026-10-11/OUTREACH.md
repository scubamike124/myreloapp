# StudyProofs outreach: tutoring centers and student creators

The owner asked (2026-10-11) to "approach tutoring centers and student creators with a working demo and a limited free trial", and to "check that existing work first". This file records what already existed, what was wrong with it, what changed, and what needs the owner's words.

## State on 2026-10-12 at 12:43Z

- **Held since 2026-10-11 20:54Z.** The mail events show no send after 2026-10-10 18:34Z (the campaign's own state records its last run at 2026-10-11 18:31Z, before the hold, and no send from it appears in the mail events). Both locks are shut: the journey probe's newest run (2026-10-12 12:26Z) failed on one check, the address students write to (`studyproofs.com` has no mail routing), and the owner's approvals list is empty.
- **What the owner decides is unchanged** (the four lines at the end), and the reply-to address is now the first of them: nothing should be sent to any institution while its replies go nowhere.
- **The send history is as reported:** 577 emails to 19 distinct addresses, 17 a day from 2026-09-28 to 2026-10-10, up to 34 to one address, 0 complaints, 1 bounce, no reply on record (none could have been received).

## What already existed (read from the code; the live state is on the tracker comment)

- A **daily campaign** (`src/lib/customer-acquisition/studyproofs-campaign.ts`, work-queue kind `STUDYPROOFS_OUTREACH_TICK`, 18:30 UTC every day). Its own header said it was "NOT wired into any cron"; that was false: it is wired, and it sends whenever the two vault entries `OUTREACH_MAILING_ADDRESS` and `ACQUISITION_UNSUB_SECRET` exist. The only commit in the repository's history that touches the campaign is a large squashed import (5,779 files), so who wired it, and on what authority, could not be established from the code.
- A fixed list of **30 university tutoring and academic-support centers** (Ohio University, UT Austin Sanger Learning Center, Michigan, Indiana, Penn State, UF, MSU, UW-Madison, ASU, UW, and so on), each with its own official page. The contact address is never typed in: it is read live from the institution's own site and used only if the institution published one. One email per institution (a state file keeps who was contacted), a daily cap of at most 25, an unsubscribe link, the postal address, "This message is an advertisement", sent through the transactional mail integration with the reply-to `hello@studyproofs.com`.
- Whether it has already sent anything is stored on the worker's volume and is read by the tracker comment (section "Tutoring-center outreach"). Nothing about it had been reported on #105 before.

## What was wrong with it

1. **It promised something the product could not do.** The email offered "free Pro access for your students for one semester", and nothing in StudyProofs could grant a plan without a Stripe payment.
2. **It over-claimed.** "Every answer quotes the exact line from their own material, so it's not guessing or making things up." No model keeps that promise; the product also showed a citation even when the line quoted was not in the student's notes (a product fix is under way separately, and the demonstrations check for exactly this before anything is shown).
3. **It sent the reader to a signup page, not to anything to look at first.** There was no demonstration.
4. **Its reply-to address might not receive mail.** `studyproofs.com` was registrable and unregistered at the last check (2026-09-02, the purchase failed for lack of funds); whether it has been bought since is unknown from here. The journey probe reads this.
5. **No test of the product stood between the email and a student.** Nothing checked that a student could make a study set or pay before institutions were told to send students.

## What changed (all behind two locks)

- **Lock 1, the product must work.** The daily tick sends only while the worker's production journey probe has a current pass: the newest run passed, under the current rules, within the last 36 hours, and its stored result still shows every requirement met when it is read back (an email to an institution is advertising, and the owner's rule is that StudyProofs is tested before it is advertised). No record, a failed run or a stale one keeps it shut and says why.
- **Lock 2, the owner approves the exact words.** The email text was rewritten (below). It cannot be sent until the owner's own words approving that exact text, with its trial terms, are recorded with the date in `OUTREACH_COPY_APPROVALS` (the repository's pattern for outward acts: a pull request records each decision with the owner's quote and the date). The list is empty. Change a word or a number and the fingerprint changes and the lock closes again. Two more conditions: a demonstration page must exist to link to, and the trial code the email offers must be ready on the product.
- **The trial exists**: a code made by the owner's side (an internal route behind the cron secret), Student or Pro, a number of days, a number of students; redeemed at signup with `?code=` or on the billing page; no card, nothing charged; one per account; never counted as a payment. The email's trial: code `TUTORING-SEMESTER`, Pro, 120 days, 300 students in all.

## The proposed email (the institution's name goes in `{INSTITUTION}`; the postal address and the unsubscribe link are added at the end by the sender)

**Subject:** Free StudyProofs for {INSTITUTION} students: a working demo and a free semester

> Hi,
>
> I'm writing from StudyProofs, a small study tool. A student pastes or uploads their own notes and gets flashcards and a quiz back. Where it can, each one shows the line of the notes it came from, and it says when it cannot find one, so it is easy to check.
>
> You can see exactly what it makes, unedited, from sample notes we wrote: https://hq.amberoneai.com/studyproofs/examples?src=tutoring-centers&campaign=outreach
>
> If it would help {INSTITUTION}'s students, they can have Pro free for a semester (120 days). No card, nothing is charged, and their notes stay theirs when it ends. They sign up with this link, which fills in the code TUTORING-SEMESTER: https://hq.amberoneai.com/studyproofs/signup?src=tutoring-centers&campaign=outreach&code=TUTORING-SEMESTER (one use per student account, up to 300 students in all).
>
> The free plan is real too: 3 uploads a week, and what a student makes stays in their library. Paid plans are $4.99 a month (Student) or $9.99 a month (Pro) and cancel any time.
>
> It is a young product and the study tools can contain mistakes, so we tell students to check them against their notes. If this is not something you share with students, you do not need to reply and we will not write again. If you have a question, reply to this message.
>
> The StudyProofs team

**The fingerprint of this exact text and the trial's terms is `53d7f4d2531d`** (printed on the tracker; the text above is copied from `src/lib/studyproofs/outreach-copy.ts` as merged in amberai #808, and any change to a word or a number gives a new fingerprint that needs new words from the owner). The earlier fingerprint `2a7f67c15748` belonged to a version that said "Each one shows the line of the notes it came from"; it is withdrawn, because the product shows a source only when its quote really occurs in the student's text and says when it cannot find one.

**Before the owner approves this text**, two claims must be true in production, and the tracker shows both. (1) "Where it can, each one shows the line of the notes it came from": the citation fix is deployed (amberai #808, running since 12:24Z on 2026-10-12), and the production walk of 12:26Z found 11 of 11 citations quoting the pasted notes and 16 of 16 quoting a real PDF's text; each demonstration also has to pass its own check that every citation is a real line of the notes. (2) "A working demonstration": an example page must exist with a reviewed demonstration on it. The pages exist but are empty; two demonstrations (BIO 101, STAT 200) are made and waiting for my review against their notes, and the third (HIST 120) was not made in five tries and is retried by the worker.

## Student creators (owner-sent, never sent by Amber)

Creators are individuals, so this is a person-to-person request: the owner chooses who and sends it from their own account. Amber prepares the note and the assets; it does not look people up, scrape contact details, or send. A creator gets: a link to the demonstration, a trial code of their own (made on request: `campaign` named for them so their students are counted under it; for example 50 students, 30 days of Pro, no card), and the plain disclosure rule (the creator tells their audience the code comes from StudyProofs, and that the study tools can make mistakes). No payment to creators, no commission, nothing that has to be hidden.

A first note, for the owner to edit and send:

> Hi {name}, I make StudyProofs, a small tool that turns a student's own notes into flashcards and a quiz and shows, where it can, the line of the notes each one came from. I thought it might suit your audience, so here is exactly what it makes from sample notes I wrote, unedited: {link}. If you would like to try it with your own notes, here is a code for a free Pro month with no card: {code}. No obligation, and if you do mention it, please say it is a tool I make and that the cards can contain mistakes. Thank you for looking.

## What the owner decides (one line each)

1. Approve the email text above, or change it (any change needs a new approval). Until then nothing is sent.
2. Whether the trial terms are right: Pro, 120 days, 300 students, no card.
3. The reply-to address: `hello@studyproofs.com` works only if the domain exists with mail; otherwise either register it (a purchase of about $11 a year, the owner's decision) or approve using `support@amberoneai.com`, the address the owner approved on 2026-10-07 for buyer-facing pages.
4. Which creators to write to, if any (the owner sends).

## A correction note for the 19 addresses (a draft for the owner to send, or not; Amber sends nothing)

The tracker's send history (mail events, counts only) shows 577 emails to 19 distinct addresses between 2026-09-08 and 2026-10-10, 17 on each of the 13 days from 2026-09-28, and up to 34 to one address. The email offered "free Pro access for your students for one semester", which the product could not grant, and asked for replies at an address that cannot receive mail. Every one of these institutions published its address for this kind of contact, and each email carried an unsubscribe link and the postal address; still, repeated messages are a mistake worth owning. Whether to write once more to say so is the owner's decision. If the answer is yes, the owner sends it from a mailbox that can receive replies (not `hello@studyproofs.com` until that exists). A draft:

> **Subject:** Sorry for the repeated emails from StudyProofs
>
> Hello,
>
> You may have received several emails from us about StudyProofs over the past weeks. That was our mistake: a fault in our system repeated a message that we meant to send once. One of those messages also mentioned free Pro access for a semester, which we were not able to provide at the time. We are sorry.
>
> We have stopped all sending, and you will not hear from us again unless you ask. If you are curious what StudyProofs does, it turns a student's own notes into flashcards and a quiz that show, where they can, the line of the notes each one came from. There is nothing you need to do.
>
> The StudyProofs team

Not recommended: a reply-to of `hello@studyproofs.com` (it receives nothing), or any mention of a new offer in the same message.

