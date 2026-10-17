# Runbook: Book 1 into your KDP Bookshelf (one book, one complete test)

Goal: "Bold & Easy Patterns" appears on your KDP Bookshelf as a **Draft**, confirmed by the Bookshelf itself. Nothing publishes. Amber's cloud holds no KDP sign-in, so you run this on your own computer and sign in yourself.

## What you need

- The computer where the amberai folder lives (Mac, Windows or Linux) and your phone for the one-time code.
- About 45 minutes. You are hands-on for about 15 of them: sign in, read the Previewer, finish a short list.

## Steps

1. **Update.** In the amberai folder: `git pull` on main (after the pull request named in Report 10 is merged), then `npm ci` if it asks, and `npx playwright install chromium` if you never installed the browser.
2. **Record your decision, once.** Run `npx tsx scripts/kdp-authorize.ts`. It asks you to type your decision in your own words, shows you the file it will write, and writes it only after you type YES. Without this file every KDP script stops and opens no browser. Example sentence: *I decide to proceed under Amazon's published Agent Terms without asking first, accepting that Amazon may limit or refuse the agent.* If you would rather ask Amazon first, the text is in `KDP-SUPPORT-REQUEST.txt`.
3. **Look first, change nothing.** Run `npx tsx scripts/kdp-connection-check.ts --title "Bold & Easy Patterns"`. Sign in in the window. It reads your Bookshelf, saves a screenshot, and clicks and types nothing. If it works, the whole chain works (the saved browser profile, the `Agent/AmberOne` label, your sign-in, no block). If Amazon stops it, stop there and send Amber the words on the screen.
4. **Run the draft.** `npx tsx scripts/kdp-coloring-draft.ts`. A Chromium window opens on KDP. It first reads your Bookshelf and does nothing else until you are signed in.
5. **Sign in yourself** in that window: password, code and any puzzle are yours. Never type them anywhere else. Then leave the window alone while it fills the fields and uploads the two PDFs. That takes a few minutes.
6. **Read the Previewer.** It opens by itself after the files are processed. Check the margins and the cover. Click **Approve** yourself.
7. **Finish the list.** When the terminal prints `RESULT`, it also prints what is left for you in the same window. Always on that list: the AI-content choices and KDP's confirmation (the facts and the wording are in `KDP-COPY-SHEET.txt`), and the Pricing page's terms box. **Do not click Publish.**
8. **Send Amber two things:** the `RESULT` block copied from the terminal, and a screenshot of the Bookshelf row with your name and email hidden. The script also saved its own Bookshelf screenshot in `.data/kdp-coloring/bold-patterns-01/bookshelf-after.png`. If the list it printed is long, also send the three `dom-*.json` files from the same folder: they hold the ids and labels of KDP's form fields and no values, so a wrong field can be fixed in one round.

**Which command is next?** Run `npx tsx scripts/kdp-pipeline.ts next` at any time. It reads the book's files and the evidence the scripts saved, says whose turn it is, and prints the exact command. Each script also saves what it saw to `kdp/books/bold-patterns-01/evidence.jsonl` and prints the same records as `EVIDENCE {...}` lines; if you send Amber those lines (or the file), the dashboard page updates. A book is shown as **Live and verified** only when the Bookshelf says Live and the product page shows a buy button.

## What the terminal tells you

| It says | It means | What to do |
| --- | --- | --- |
| `DRAFT CONFIRMED ON THE BOOKSHELF` | The Bookshelf text shows the title with status Draft | Finish the list, send the two things above |
| `DRAFT NOT CONFIRMED` | Pages were saved but the Bookshelf did not show the title | Do not rerun; send the screenshots folder |
| `STOPPED by a block` or a puzzle | Amazon refused the agent or showed a check | Stop. Do not retry. Send the exact words |
| `NOT SIGNED IN in time` | The window waited 20 minutes | Run it again when you are ready |
| `Not started: no authorization decision` | Step 2 is not done | Do step 2 |
| `The book files are not what was checked` | A PDF changed | Stop and tell Amber |
| `KDP shows on the pricing page:` followed by a message about tax, bank or account setup | Your KDP account needs something only you can give | Finish it in KDP yourself. Amber never touches tax, bank or identity details. Then run again |
| `NOTHING WAS PRESSED` with a list of differences | KDP stores something that is not what you reviewed | Send Amber the list. Nothing was published |

Running the script again is safe. It finds the title on the Bookshelf and reopens it. It never creates a second one, and it does not touch a title that is already submitted.

## What the first run decides

The script was tested against a local copy of KDP built from the element ids a reviewed open-source tool uses. It has never touched Amazon's real pages. If the "Left for you" list is longer than expected, nothing is lost: the draft is saved as far as it went and Amber fixes the one file. Your screenshots are what let that happen in one round.

## After the draft is confirmed: approval and publication

1. Look at the draft in KDP once, end to end.
2. Run `npx tsx scripts/kdp-publish-approved.ts --check-only`. It signs in the same way, reads back from KDP what is stored for the draft, and compares every field with the package you reviewed. It presses nothing and asks nothing. If anything differs, it lists exactly what.
3. Tell Amber in the chat: **approve Bold & Easy Patterns for publication**. Until then nothing publishes. Your word in the chat is not what publishes the book. The step below is.
4. Run `npx tsx scripts/kdp-publish-approved.ts`. It shows what is about to be submitted. Only if you type `PUBLISH` does it press the one "Publish Your Paperback Book" button, once. Then it reloads the Bookshelf and says whether the title shows In review. It needs a real terminal, so no one else can answer for you.
5. Amazon reviews the book, usually within 72 hours. Check with `npx tsx scripts/kdp-connection-check.ts --title "Bold & Easy Patterns" --product`. When the Bookshelf says Live, the same command opens the product page once and says whether it can be bought. Send Amber a screenshot of the Bookshelf row and of the product page. Only then is the first book done.

## If you would rather not run anything

The copy sheet `BOOK-1-KDP-COPY-SHEET-v2.txt` makes the same draft by hand on the iPhone in about 20 minutes. That proves KDP accepts the files. It does not prove the system.

## What never happens

No publishing without your word. No spending. No second title. No hiding that it is software: every request says `Agent/AmberOne`. No answering a puzzle or working around a block. No password, code or cookie ever leaves your computer or appears in chat.
