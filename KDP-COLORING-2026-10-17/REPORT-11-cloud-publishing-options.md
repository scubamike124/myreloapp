# Report 11: publishing to Amazon from the cloud, what is permitted, and what I need from you

Status 2026-10-17, evening. Evidence tags: **[V]** read today from the owner of the rule, **[S]** a secondary source, **[I]** my inference.

## The answer first

I found no Amazon-sanctioned way to publish to KDP unattended. I also found no KDP publishing API **[S: a search for one returns only third-party browser tools, and the e-book factory's own notes say KDP has no listing API]**. Two routes are permitted in principle. The first is a disclosed agent that works in your KDP account, which is what I built. The second is an aggregator that has its own arrangement with Amazon and a documented API. Neither is free of risk, and neither should be chosen before the first book has gone through.

The first book goes through the first route with you at the computer. That tests the whole pipeline and shows how Amazon treats a disclosed agent. Unattended publishing from the cloud waits for that result and for Amazon's written answer.

## What Amazon's published rules say

| Rule | Source | Tag |
| --- | --- | --- |
| Software acting for a person must send `Agent/[name]` in every request, must not conceal that it is an agent, must not solve or get around a CAPTCHA, and must answer truthfully whether a person or a computer is acting | Conditions of Use, "Agents" section, last updated 2026-08-14 (Report 5) | V |
| Amazon may limit or refuse any agent at its sole discretion. The text names no approval step | same | V |
| The account holder is responsible for the account and may not let a third party use the program through it | KDP Terms 4.3 (Report 5) | V |
| Amazon blocked Meta's agent on 2026-09-20, citing the Conditions of Use | press report | S |
| A seller-side Agent category exists from 2026-03-04, and the route Amazon points sellers to is its Selling Partner API. My inference is that this API does not cover KDP books | a blog summary | S, I |

## The routes

| Route | Who acts on Amazon | Permitted | Without a person present | Cost | Main risk |
| --- | --- | --- | --- | --- | --- |
| 1. You do the clicks from the copy sheet | You | Yes | No | Your time, about 20 minutes a book | Does not scale |
| 2. Disclosed agent, you at the keyboard (built, tested on a local copy only) | `Agent/AmberOne` in your window | Yes under the published terms; Amazon may refuse | No | None | Amazon refuses or blocks; the real pages are untested |
| 3. Same agent on a host you control, with nobody present | `Agent/AmberOne` from that host | The terms are silent on unattended use **[I]** | Yes, after setup | Your own always-on computer, or a rented server (not priced; needs your word) | Account lock, more checks from a server address, Amazon's refusal |
| 4. PublishDrive's API | PublishDrive publishes to Amazon under its own arrangement | Yes, by design **[V]** | Yes | A paid plan (price not on the page text), a purchased ISBN for print **[I]**, 50 percent print royalty against KDP's 60 percent **[V]** | A new platform and publisher of record, Amazon sets the retail price, API access is "designed for large publishers and partners" **[V]** |

Route 4 facts, read from PublishDrive's own pages today **[V]**: it distributes e-books and print on demand to Amazon, with a review time of 1 to 3 business days. AI-generated and AI-assisted books are accepted when declared. The Distribution API is REST, takes an `apikey` header, and the key is requested from PublishDrive support. It can create a book, upload interior and cover files through presigned links, and publish. A print title needs an ISBN, and KDP's free ISBN is for KDP only **[I]**. Its free plan covers one e-book to Apple Books, Barnes & Noble and Kobo, not Amazon. A search shows no public IngramSpark API **[S]**.

Hosting, from GitHub's own terms read earlier (Report 5) **[V]**: a real sign-in session may not run on GitHub-hosted runners. A runner on your own computer, or on a server you pay for, is not covered by that rule.

## Recommendation

1. Run the first book through route 2 now. Nothing else depends on Amazon's answer.
2. Send KDP Support one written question before building route 3. The text is ready in `KDP-SUPPORT-REQUEST.txt`, with an optional part about unattended use and a separate login for an authorized agent. Sending it after the first run is stronger, because it can describe what actually happened.
3. Choose route 4 only if routes 2 and 3 are refused or too fragile. It costs money and needs a new registration, so it needs your word.

## Exactly what I need from you

For the first book, route 2:

| Step | What | When |
| --- | --- | --- |
| 1 | One sentence recording your decision about Amazon hosts (`npx tsx scripts/kdp-authorize.ts`) | Once |
| 2 | Your sign-in in the window: password, code, any puzzle | Each run until the session is saved |
| 3 | Read the Previewer, click Approve, finish the short list the script prints | First run |
| 4 | Type `PUBLISH` at the terminal after `--check-only` shows the draft matches the package | Only when you decide |
| 5 | A screenshot of the Bookshelf row and the product page once it says Live | After Amazon's review |

For route 3 later: a host you choose and approve, your one-time sign-in on that host, the KDP Support reply, and a per-book approval typed on that host, so no one else can approve for you. For route 4 only: your registration and payment on the platform, and the API key request.

Nothing here has touched Amazon. No account, registration, payment or message has been made.
