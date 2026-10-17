> Replaced on 2026-10-17 by `RUNBOOK-first-book.md`, which goes straight to the draft: the draft script starts with the same read-only sign-in and Bookshelf look as the check below.

# Runbook: the first run on your laptop (read-only), then the first draft

For the day you are at the laptop. Nothing here publishes, spends or creates anything on KDP until step 5, and step 5 only saves a draft. Amber does not run anything on your laptop; you do.

## Before you start (once)

1. **Your decision is recorded.** Either you asked KDP Support and have Amazon's reply, or you decided to proceed under the published Agent Terms without asking. Tell Amber in the chat ("approved", and paste the reply if you have one). Amber creates `kdp/cloud/authorization/amazon.json` from your words in a pull request and merges it when its checks pass; you do not edit Git. Without that file every KDP script stops with "Not started" and opens no browser.
2. **Pull the latest amberai** on the laptop (`git pull` on main), then `npm ci` if it asks. The older KDP scripts and the new check are in `scripts/`.
3. Have your phone for the verification code.

## Step 1: the read-only check (about 5 minutes)

```
npx tsx scripts/kdp-connection-check.ts
```

- A Chromium window opens on KDP's Bookshelf. **Sign in yourself**: password, code, and any puzzle are yours. Never type them anywhere else; never paste them in chat.
- The script waits up to 20 minutes, then saves `bookshelf.png` and `bookshelf.txt` under `.data/kdp-check/<time>/` and prints the lines that name a format or a status. It clicks and types nothing.
- **Send Amber the screenshot** (hide your name and email) or the printed lines. That is the proof the connection works, and it answers what the two titles' status is.

## If something stops it

| What you see | Meaning | What to do |
|---|---|---|
| "Not started: no authorization decision" | the file in step 0 is missing | tell Amber; nothing else |
| "Stopped: the site answered HTTP 403/429/503" or "says agent access is not permitted" | Amazon refused the agent | **stop; do not retry**; send Amber the exact words; the manual route stays open |
| "The page shows a check" | a puzzle | solve it yourself in the window, or close the window and stop |
| "Not signed in before the time ran out" | you did not sign in | run it again when you are ready |

## Step 2 onward (only after Step 1 passes and you say go)

- Pick **one** title for the first draft. The older e-book script opens a title that already exists, so do **not** point it at a live book; use a new title or the paperback kit.
- Run the matching script (`scripts/kdp-coloring-draft.ts` for a paperback; the e-book script is for "10 Things to Do in Los Angeles"). It fills what it can, stops at **Save as draft**, leaves the window open and lists what is left for you: the **AI-generated content** question, any **checkbox on the Pricing page** (read its label; KDP Select enrollment is a 90-day exclusivity choice), and the previewer.
- **You** click Publish, when you decide to. No script ever does.

## What never to do

Do not run the 28 August versions from an old checkout; they send no Agent label and hide the automation marker. Do not retry after a refusal. Do not paste a password, code or cookie anywhere.
