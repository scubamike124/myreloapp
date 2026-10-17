# Report 8 — the earlier KDP upload: what the records show, what they do not, and what changed

Written 2026-10-17 16:2xZ for the owner's 16:0xZ message ("Amber has already successfully uploaded one of my e-books to Amazon Kindle autonomously ... locate the records"). Searched: the private amberai repository (full history of main, 1,611 commits; all 876 issues and pull requests; all 86 comments on tracker #105; every workflow; the e-book factory and revenue-engine code), the public reports repository, the Reelo app code, and this session's own earlier transcript. **No request was sent to Amazon and no upload was attempted.** Provenance tags: **[V]** verified from a record I read, **[I]** inferred, **[U]** not knowable from here (only you can see it).

## Answer in brief

| Your question | Answer | Tag |
|---|---|---|
| 1. Which e-book, and when? | The only KDP automation in any repository was written for two titles: the Kindle eBook **"10 Things to Do in Los Angeles"** and the paperback **"Easy Italian for Travelers"** (cover only). Both scripts were committed **2026-08-28 17:34Z** in one commit. **No record shows that either script was run or what it produced.** | [V] the scripts and the commit; [U] any run |
| 2. Draft or published? | Not recorded. The e-book script **never clicks Publish** and never saves the Pricing page; it ends with "If you want it live, click Publish Your Kindle eBook in that window". Only your Bookshelf can say what the status is. | [V] code; [U] status |
| 3. How was the account reached? | By **you**, signing in yourself in a visible Chromium window on your laptop, with a saved browser profile (`.data/browser-automation/profiles/kdp`). The script waits up to 20 minutes for the Bookshelf. | [V] code |
| 4. Which browser, session, credentials, system? | Playwright-driven Chromium on your laptop; your signed-in profile; **no credential anywhere else**; scripts written in **Cursor** and committed by a **Claude Code session** ("Preserving Cursor's work"). Amber's cloud services were not involved. | [V] |
| 5. Is that method still available? | **Yes, on the laptop**: the scripts are on main, unchanged since 28 August, and the profile stays on that machine (Amazon may ask you to sign in again). **Not as written** (section 4): they sent no Agent label and hid the automation marker. | [V]; [U] profile state |
| 6. Why are we told Amber cannot access Amazon? | Because the **cloud Amber has never had access**; the earlier route was **you plus a script on your laptop**. What I called "not operational" was the cloud and autonomous route you asked for yesterday, not the laptop route. I stated that too bluntly and let two different things sound like one (section 5). | [V]/[I] |

## 1. The evidence

| What | Record | Tag |
|---|---|---|
| Commit `c2c5dc34`, 2026-08-28 10:34 PDT (17:34Z), author scubamike124, trailers `Claude-Session: session_01FyMZ29…` and `Co-Authored-By: Claude Sonnet 5`. Message: "Preserving Cursor's work before building the missing execution engine on top of it. This was sitting entirely uncommitted in the working tree -- never pushed". Adds `scripts/kdp-publish-la-ebook.ts` (331 lines) and `scripts/kdp-upload-cover.ts` (147 lines) among 48 files. | `git show c2c5dc34` | [V] |
| Neither script has a second commit; nothing imports them; no npm script, workflow, Dockerfile or Railway file names them. They are stand-alone laptop scripts. | `git log` per path; `git grep`; package.json | [V] |
| E-book script: title, subtitle, a 9-line description, 7 keywords, price **$2.99**, author first name "Michael", the files `~/Downloads/10_Things_to_Do_in_Los_Angeles_KDP.epub` and `…_KDP_COVER.jpg`. Flow: wait for your sign-in, Create > Kindle eBook (or open the title if it already exists), fill Details, upload EPUB and cover, fill Pricing (all territories, 70 % plan, $2.99). | script text | [V] |
| Cover script: opens a **Draft** paperback ("Paperback row is Draft — yellow Continue setup", the author's own comment), clicks Assign ISBN, answers "Did you use AI tools?" with **No**, launches Cover Creator and uploads `Easy_Italian_for_Travelers_KDP_COVER.jpg`. | script text | [V] |
| The EPUB and cover files named by the e-book script are **not in any repository**. | tree search for epub, italian, los-angeles | [V] |
| No issue or pull request among all 876 mentions KDP, Kindle or either title before today's #873 to #877. | API listing | [V] |
| None of the 86 comments on #105 mentions KDP or Kindle in any publishing context. | API listing | [V] |
| The only workflows that touch KDP are the two added today. | `.github/workflows` | [V] |
| The e-book factory itself records KDP as **owner-completed**: "No public API for third-party automated listing — owner completes the KDP dashboard flow per title" (`marketplace-directory.ts`), and each book's KDP record reads `needs_owner_submission`. | source | [V] |
| No KDP, Amazon or Kindle credential name appears in the code's secret registry. The worker's vault-name reports on #105 (128 entries, 11 and 17 October) list no such name, but they filter by social-channel words, so that is suggestive, not proof. The new stock report (amberai #878) reads those names directly. | source; #105 | [V]/[I] |
| Railway deployment history, Actions secret names and your KDP account are not readable from this session (the proxy refuses the first two; the third is yours). | tool refusals | [U] |

## 2. What the 28 August scripts actually did and did not do

- **Never clicked Publish.** The only buttons it presses are Save and continue, Save as draft, Save, Create, Continue setup, Assign ISBN and Cover Creator's save.
- **Never saved the Pricing page.** It fills the price and stops, so pricing counts only if you clicked Save or Publish yourself.
- **Ticked the last checkbox on the Pricing page unread.** On KDP that can be KDP Select enrollment (90 days of exclusivity to Amazon) or the terms. I cannot tell which from here. This matters because the e-book factory's own directory treats exclusivity as a deliberate choice.
- **Answered the AI-content question "No" for the paperback**, for every book. If that paperback was AI-generated, the answer was wrong.
- **Assigned a free KDP ISBN** to the paperback when the button was visible. That cannot be undone.

## 3. What only you can check (five minutes, no risk)

1. **KDP Bookshelf:** do "10 Things to Do in Los Angeles" and "Easy Italian for Travelers" appear, and with what status (Draft, In review, Live)? Each title's page shows when it was last changed.
2. **On the laptop:** `.data/kdp-la/` inside the amberai folder holds the screenshots the scripts took (`01-details.png`, `03-content-after-upload.png`, `05-pricing-filled.png`, `cover-*.png`). Their file dates show whether and when a run happened and how far it got.
3. **Your email:** any message from KDP since 28 August about the account or those titles (a warning, a rejection, an "unauthorized agent" notice).
4. **For the paperback:** what the AI-content answer says on its Content page, and whether it should say Yes.

## 4. Was the earlier method legitimate, and does it remain permitted?

Amazon's Agent Terms (Conditions of Use, "Agents"; the page says last updated 2026-08-14; a third-party tracker dates the agent provisions to May 2026) cover "any software or service that takes autonomous or semi-autonomous action on behalf of … any person". A script you run on your own account is one. The terms do **not** forbid agents and do **not** require approval first. They require that an agent **identifies itself** (`Agent/[name]` in the user agent of every request), **does not conceal** that it is software, and **does not solve or circumvent CAPTCHAs or blocks**; and they let Amazon limit or refuse any agent at its sole discretion.

As written on 28 August, both scripts **fell short of two of those requirements**: no Agent label, and Chromium launched with `--disable-blink-features=AutomationControlled`, a flag whose purpose is to hide the automation marker. Neither script solves a CAPTCHA (they wait for you). So: **it worked technically because Amazon did not block it; it was not compliant as written.** I have no evidence that Amazon objected, and I cannot see your account's messages.

**Restoring it safely needs no rebuild and no contact with Amazon.** amberai **#877** (checks green at 16:41Z; **merged 16:41:59Z as `c0f10304`**) changed the two old scripts and aligned the paperback script:
- sends `Agent/AmberOne` on every request; removes the concealment flag;
- stops answering the AI question and stops ticking the Pricing checkbox: both are left to you;
- start only when `kdp/cloud/authorization/amazon.json` records **your** decision. The file's basis can be Amazon's written reply **or your own recorded decision to proceed under the published Agent Terms**. You can give that decision in the chat and I create the file from your words.

**Do you have to ask Amazon?** No rule says so. Asking is a risk-reduction step, not a requirement: it can turn Amazon's discretion into a written answer, but support replies can also be vague. Two honest options:
1. **Ask first** (the support text is in `KDP-SUPPORT-REQUEST.txt`). Lowest risk, costs a day or two.
2. **Proceed without asking**, with your recorded decision: run the corrected script on the laptop, you present, one title, drafts only, and watch for any Amazon notice. The risk is Amazon's discretion; the account holds your published e-books.

My recommendation is option 1 for the first run, because the cost is small and the downside is your account. The choice is yours; either way the corrected script is the one to run, not the 28 August versions. amberai **#879** (open) adds a read-only connection check as the very first run: it signs in, reads your Bookshelf, saves a screenshot and the visible text on your laptop, and changes nothing (`RUNBOOK-laptop-first-run.md`).

## 5. What changed, exactly

- **Nothing was removed or broken.** The two scripts have not been touched since 28 August. No deployment, workflow or setting that carried a KDP connection existed or was taken away. [V]
- **What I told you yesterday afternoon was about a different thing.** You asked for Amber to upload from the cloud, with your iPhone for sign-in, and for autonomy. That has never existed: Amber's cloud holds no KDP credential and no session [V]. The earlier route needed **you at the laptop**. I summarized this as "Amber cannot access Amazon", which is true of the cloud and misleading about the laptop.
- **What is new is my reading of Amazon's Agent Terms**, applied to the scripts you already had (section 4), and your instruction not to risk the account.
- **The word "autonomous" does not fit the earlier route.** The scripts were written in Cursor, ran on your laptop under your sign-in, and stop before Publish. That is supervised automation, which may be what you remember as "Amber uploading".

## 6. Corrections to my earlier reports

- **Report 1** said the scripts "were used for two of your titles". The accurate statement is that they were **written for** those two titles; no record shows a run. It also said they were committed "by you from the laptop session"; the commit is under your account with a Claude Code session trailer and says it preserves Cursor's work.
- **Report 1** called the laptop pattern "proved on your account". I have no evidence of a run; I should have said "built for your account".
- **Reports 4 and 5** said the older scripts "send no token" but did not mention the concealment flag, the auto-answer "No", or the unread Pricing checkbox. They are in section 2 now.
