# Report 10: Priority 1, one book through KDP (status 2026-10-17, evening)

**First book in KDP: no.** Nothing has gone to Amazon from Amber. No upload, no draft, no publication, no spending. The book is chosen, packaged and tested. The next step needs you at a computer.

## The book

"Bold & Easy Patterns", the large print coloring book. It is the easiest first test because its files are finished and checked. An e-book would first need an EPUB pipeline, which the factory does not have. The 36 finished e-books wait.

| Fact | Value |
| --- | --- |
| Format | Paperback, 8.5 x 11 in, black ink on white paper, matte cover |
| Pages | 104 (50 single-sided designs) |
| List price | 9.99 USD |
| Printing cost / royalty | 2.84 USD / about 3.15 USD per copy |
| Files | `kdp/books/bold-patterns-01/` in amberai, with checksums |
| AI content | Text: yes. Images: yes. Translations: no |

## What blocks the upload today

| Blocker | Evidence | Who clears it |
| --- | --- | --- |
| No recorded decision for Amazon hosts | All three KDP scripts stop with exit code 3 until `kdp/cloud/authorization/amazon.json` exists. Tests prove it. The gate is my own policy. Amazon's Agent Terms ask no one's approval first. | You: one sentence |
| No KDP sign-in in Amber's cloud | The stock report found no stored login or vault entry named for Amazon, KDP or Kindle | You sign in on your computer |
| No permitted cloud host for a real sign-in | GitHub's hosted runners are barred for real sessions. The production worker is not an approved host | Your own computer is the permitted host |
| The paperback flow never ran on KDP's real pages | No record of any run, in any log or workflow | The first real run |
| Amazon may refuse a labeled agent | Agent Terms, updated 2026-08-14: Amazon may limit or refuse any agent at its sole discretion | Unknown until the run. If refused, we stop |

## The earlier upload

I found no record that an upload happened. Two laptop scripts were written for it and committed on 2026-08-28 (commit `c2c5dc34`). They needed you at the keyboard, they held no credential, and no log, workflow or deployment shows a run. Details are in Report 8.

## What was built (pull request amberai #880)

- The book package, process notes and a draft script that fills KDP's own fields, uploads both PDFs, saves with Save as Draft, and then reloads your Bookshelf to say whether the title is on it.
- A helper where you record your own decision at a terminal.
- 17 tests against a local copy of KDP: it never publishes, never duplicates a title, stops at any puzzle, block or sign-out, and leaves the AI-content choices and every confirmation to you.
- Not tested: Amazon's real pages. The first run is the real test.

## What I need from you

1. Your decision about Amazon hosts, in your own words (the runbook has the command and an example sentence).
2. Time at the computer that has the amberai folder: about 45 minutes, 15 of them hands-on.
3. Your sign-in, the Previewer approval, and the short list the script prints at the end.
4. The `RESULT` block and a Bookshelf screenshot.
5. Later, your word to publish.

Steps: `RUNBOOK-first-book.md`. Process for the next book: `kdp/books/README.md` in amberai.
