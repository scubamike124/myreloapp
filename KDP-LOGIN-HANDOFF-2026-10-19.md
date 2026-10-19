# Amazon KDP login: where it stands (saved 8:05 PM Pacific, Sunday 18 Oct 2026)

Work on the KDP login stopped at the owner's word. Nothing was deleted or undone. Nothing is published, no session is open, nothing is queued, and Amber has never seen a password.

## What is live on HQ now

Each of these went out on the owner's own "merge without checks" answer, because GitHub Actions will not start any job (account payments failed or the spending limit was reached), so none of it ran through CI. Everything was tested locally on a fake sign-in site and, for the pages, in an iPhone-sized browser.

| PR | What it did |
|---|---|
| 922 | Recorded the owner's decision to proceed under Amazon's published agent terms (delete `kdp/cloud/authorization/amazon.json` to withdraw it). |
| 923 | The Framed Holiday Mandalas package (86 pages, hand-set title page). |
| 924 | The HQ page `/dashboard/kdp-desk` became readable (it was near-white text on a cream page), shows the book's name, shows what happened to a request, and files the request where the worker looks. |
| 925 | Phone page: typing box moved to the top, a tap on a field raises the keyboard, the green button asks before it hands over. |
| 926 | On-screen keys, and the page no longer locks its typing box when one status check is slow. |
| 927 | A tap on the green button while a sign-in step is still showing hands the turn back instead of ending the session. |
| 928 | The on-screen keys open at the top from the start (the phone's browser bar floats over the bottom of the page). |

## Saved, not merged: draft PR 929 (branch `claude/kdp-desk-idle-30`)

1. The claim that makes a session one browser's was kept only in the page's memory. A reload of the page (the phone's browser reloads a tab after the owner has been in another app) or a second tab was refused as "another device", which locks the owner out of their own session. It is now kept in the browser's storage. A test fails with the old behavior.
2. The session waits 30 minutes for a silent page (was 15).

Both tested alone; the last combined test run was interrupted, so run the desk tests in `kdp/cloud` again before merging. It needs "merge without checks" or working CI.

## The sessions (Pacific time; the owner's phone clock matches 6:50 PM = 01:50Z)

| Code posted | Book | Ended | What happened |
|---|---|---|---|
| 3:59 PM | Bold & Easy | 4:14 PM | Timed out: nobody had opened the link yet. Amber's alert did not wake her in time, so the owner was told late. |
| 4:27 PM | Framed | 4:52 PM | The owner reached KDP's sign-in page but could not type: the old page had its typing box at the very bottom and the keyboard did not come up for taps on the picture. Timed out. |
| 5:12 PM | Bold & Easy | 5:34 PM | Same page, same problem (the typing box could not be found or was locked). Timed out. |
| 5:50 PM | Framed | 5:56 PM | After a "404" from opening an older email's link, the owner got in and tapped the green button within a minute. The draft started, KDP showed its sign-in page, and the run stopped. |
| 6:26 PM | not seen | 6:28 PM | Cut off by a deploy: a Start request was queued that the check could not see. |
| 6:46 PM | Bold & Easy | 6:50 PM | The owner's screenshot shows KDP's sign-in page with the email box still empty. The green button was tapped, the draft stopped at once. |
| 7:32 PM | Framed | 7:55 PM | Timed out: the page went quiet around 7:40 PM. Cause unknown (findings 4 and 5 are the likely ones). |

The tracker comments (private repo, issue 105) have the exact lines.

## Findings

1. **The old typing box was hard to find and could lock.** Fixed (925, 926, 928).
2. **One early tap on the green button cost a whole session**, twice. Fixed (925, 927).
3. **Three of the seven sessions were for Bold & Easy Patterns, not Framed Holiday Mandalas.** The top card on the HQ page is Framed. Ask the owner which one they want first.
4. **A reload locked the owner out** (draft PR 929).
5. **A page left in the background for more than 15 minutes ended the session** (draft PR 929).
6. **A request can be queued without showing**: before any deploy, read the worker's beacon (comment 5737077514 on the tracker): `KDP_DESK_SESSION` must say `DONE`, and a deploy right after a restart shows nothing until the worker's first pass (about 5 minutes).
7. **Unknown, only the owner's phone can tell:** whether the real iPhone keyboard opens for the typing box; whether the on-screen keys worked in the 7:32 PM session; how far the sign-in got; what Amazon does with a sign-in from a cloud browser (a verification code, an approval on another device, a puzzle). The page keeps the cloud browser's last picture after a session ends, so a screenshot of the ended page shows where it stopped.
8. From Start to the code takes 2 to 10 minutes (the worker's queue runs about every 5 minutes).

## To pick it up tomorrow

1. Decide on draft PR 929 ("merge without checks", or fix GitHub's Billing & plans so CI runs).
2. Press Start on the **top** card only when the owner is ready to follow it through; Amber watches the tracker and sends the code link the moment it posts.
3. After a failed session, a screenshot of the ended page is the best evidence.

## Rules still in force

Nothing is published without the owner's final approval and Amber never presses Publish. The daily coloring-book schedule stays off and no more books are made until the login works.
