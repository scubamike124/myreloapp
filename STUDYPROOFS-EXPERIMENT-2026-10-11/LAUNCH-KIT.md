# StudyProofs launch kit: the two-week test, step by step

Nothing here starts until the tracker comment on #105 says **"Verdict: the whole journey passed in production"**. Amber advertises nothing before that, and asks nobody to. The text for each demonstration (captions, titles, the Pinterest file) is generated from the reviewed demonstrations by `tools/make-kit.mjs`, so a number in a caption is always the number the product produced; this file is the order of work and the rules.

**State on 2026-10-12 at 16:35Z:** the verdict is still "not ready for students", for one reason only: the address students write to (`support@amberoneai.com`, now the product's default) cannot receive mail until four DNS records are added at Cloudflare, which only the owner can do (exact values in `SUPPORT-EMAIL.md`). Every other check of the production walk passed at 14:27Z, including a real PDF, Stripe's records and `persist` (accounts and saved sets survived a redeploy). Demonstrations: BIO 101 (question 3 reworded and marked) and STAT 200 are made, reviewed and ready; HIST 120 was not made in three rounds of five tries (one or two items without a citation each time) and is retried by the worker every four hours (next about 00:38Z). **The exact posts, links, listing texts and the tutoring-center email are in `LAUNCH-APPROVAL.md`** (also a private page with copy buttons). No account, post or link has been published for StudyProofs, and no visit from a promoted link has been counted. Real payment testing stays unverified until a transaction is completed.

## What Amber does alone (no account, no owner step)

1. **The example pages** on the product's own site, `/studyproofs/examples/<sample>`: the sample notes we wrote and everything the product made from them, each item with its source line (as the product made it, except that a person's rewording of one BIO 101 quiz question is marked on the page, with the product's original shown under it), with a tracked link to try it. They are indexable and in the sitemap, which search engines read (an IndexNow announcement is not wired for StudyProofs and would add almost nothing for a few pages). Three pages at most, hand-checked, not a bulk of generated ones.
0. **The order of the tools** (all in `tools/`, each refuses damaged or stale input): `demo-from-comment.mjs` turns the worker's reviewed demonstration comment on #105 into the JSON that `render-demo.mjs` reads (and into `examples/<slug>.json` for the example page), `render-demo.mjs` makes the video and images (Chromium and an ffmpeg with libx264; about 30 seconds each), `make-kit.mjs` writes the captions and the Pinterest file from the same JSON.
2. **The demonstrations**: three 32-second vertical videos (silent, captions on screen), a 4:5 feed image, a 2:3 pin image and a link preview image each, made from what the product returned (`tools/render-demo.mjs`). Each is reviewed by a person against the notes before it is used; a study set that cites a line which is not in the notes is not used at all.
3. **The text**: captions, titles, alt text, a one-line community post, bio links (one per platform, so each is counted on its own), and the Pinterest bulk file (`tools/make-kit.mjs`).
4. **The measurements**: the tracker comment (visitors by source, first study set, came back, free trial started, checkout started, verified live payments).

## The one-time owner steps (only the account's owner can do them)

| Platform | The step | Why it is yours | Time |
|---|---|---|---|
| Instagram | Create the StudyProofs professional account; solve any phone or CAPTCHA check | Identity and a phone check | 15 min |
| TikTok | Create the StudyProofs account and switch it to a Business account | Identity and a phone check | 15 min |
| YouTube | Create the StudyProofs channel (optional: the same video file) | Identity | 10 min |
| Pinterest | Create the free StudyProofs business account; in Settings open *Bulk Create Pins* and upload `pinterest-bulk.csv` from a desktop browser | Identity; the bulk tool is desktop-only | 15 min |
| Product Hunt | Create a **personal** account now (it cannot post a product for a week), then launch no earlier than day 8, only if the demonstration works and you agree | Identity | 5 min now |

None of these platforms lets Amber post for you without an approval or an audit (TikTok's public posting API needs an audit and posts privately until then; YouTube's API uploads stay private until audited; Instagram's needs the Meta login that has never finished; Pinterest's API needs weeks of approval). So after the account exists, **a person uploads the file**: one video, one caption, a minute per platform. Amber has made every file and every word.

## Posting rules, from the research (`COMMUNITY-RESEARCH.md`, with how sure each fact is)

- **Disclosure on every post**: "Made by StudyProofs. AI can make mistakes, so check the cards against your notes." On TikTok switch on *Disclose commercial content* and choose *Your brand*. Nothing is a testimonial, a grade or a result; nothing says unlimited recording, predicted exam questions, guaranteed grades, or compares with another product.
- **Links**: a caption link is not clickable on TikTok, Instagram or YouTube Shorts. Use the profile link (one per platform, in the kit) and, on Instagram, the Story link sticker. Each platform's link has its own `src`, so the tracker counts them apart.
- **One post per community, by hand, only where the written rules allow it**: Discord study servers, Facebook study groups. Read the rules first; ask a moderator if the rules do not say; no direct messages; never the same text in two places; if a community says no, stop there and tell Amber. Amber drafts, a person posts. (The research could not name a single server or group that permits promotion, because their rules are readable only after joining: that is the biggest uncertainty in the test.)
- **No** Reddit (owner's rule), no paid listing or fast track, no reciprocal-link or badge request, no bots or scripts on any signed-in account, no second account after a warning.

## The two weeks

| Day | Who | What |
|---|---|---|
| 0 | Amber | The gate opens; the example pages are live and announced; the kit is complete |
| 0 to 1 | Owner | Create the accounts (table above) and a personal Product Hunt account |
| 1 to 3 | Owner or a person | Upload the first video and caption to Instagram (Reel and a Story with the link sticker), TikTok and, if a channel exists, Shorts; upload the Pinterest file |
| 3 to 5 | A person | Directory forms, one at a time (AlternativeTo, SaaSHub, BetaList, ISTE EdTech Index, at most three verified-free AI directories), stopping on any price, badge or reciprocal-link request |
| 5 to 14 | A person | One post in up to three communities that allow it; the owner may approve and send the outreach (`OUTREACH.md`) |
| 7 and 14 | Amber | Reads the tracker per source: visitors, first study sets, came back, trials, checkouts, verified payments; says which source brought students who came back, and which brought none |

## What counts as the answer

The question is whether students **use it again** and **pay**. The tracker reports, per source: signups, first study sets, the share of signups at least a day old who came back on a later day, free trials started, checkouts started and verified live payments. A source with many visitors and no first study set is a message problem; one with first study sets and no return is a product problem; one with returns and no checkout is a pricing or trust problem. Two weeks and a small audience cannot show renewal.
