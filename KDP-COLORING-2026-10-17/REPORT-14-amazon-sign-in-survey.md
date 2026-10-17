# Report 14: does Amber already hold an Amazon or KDP sign-in? (names and counts only)

Written 2026-10-17, 21:5xZ, for the owner's standing instruction: before asking for Amazon credentials, check whether Amber already has an authorized Amazon or KDP login, and never print, reveal, copy or log a password or secret value. Evidence tags: **[V]** read by me from the stock report or from source; **[U]** not verified.

## Answer first

**No. Amber holds no Amazon or KDP sign-in, no Amazon session and no browser profile in the cloud, on anything the survey could read.** The survey ran inside the live services at 21:42:22Z and read names and counts only. No value was read, printed, copied or logged. [V: amberai #884 merged 21:2xZ; HQ web redeployed 21:37Z, confirmed through `/api/health/public`; result published in the #105 stock comment 6238364871, section "Where an Amazon or KDP sign-in could exist".]

## The four questions

| # | Question | Answer |
|---|---|---|
| 1 | Does Amber have an Amazon or KDP specific credential? | **No.** No vault entry, integration credential, integration connection or site login has Amazon, KDP, Kindle or Amzn in its name. |
| 2 | Is an authorized Amazon session already available? | **No in the cloud.** 0 stored browser sessions, 0 browser profile folders, 0 cookie files on either service. The earlier KDP route (the e-book upload) used a browser profile on your laptop; that profile is on your machine, the cloud cannot reach it, and I have not seen it. |
| 3 | Can Amber use a session through a permitted workflow? | **Nothing to use in the cloud.** On your laptop, the same profile can be used by the disclosed script (Route A in Report 13) with you present. I did not borrow any other site's login: you said you reuse one email and password across sites, and that is exactly why none was tried or looked for. |
| 4 | Does Amazon require more verification or your approval? | **Yes, both.** Amazon's own sign-in page asks for your password and, if enabled, a one-time code; only you type them. If Amazon shows a puzzle or a robot check, the script stops and changes nothing. Publishing needs your typed word PUBLISH, bound to the exact files. |

## What was read (the table the survey published)

| Place | Read | Names mentioning Amazon, KDP, Kindle or Amzn |
|---|---|---|
| Vault entries (API keys and secrets) | 128 row(s) | none |
| Site logins (owner and Amber accounts) | 0 row(s) | none |
| Integration credentials | 7 row(s) | none |
| Integration connections | 7 row(s) | none |
| Browser sessions (cookie state kept encrypted in the database) | 0 row(s); 0 hold stored state | none |
| Environment variable names, service `amber-hq-web` | 96 name(s) | none |
| Browser profiles on the disk of `amber-hq-web` | 0 profile folder(s), 0 cookie file(s) | none |
| Environment variable names, service `amber-os-worker` | 106 name(s) | none |
| Browser profiles on the disk of `amber-os-worker` | 0 profile folder(s), 0 cookie file(s) | none |

Also read by me from source (names only): no GitHub workflow in `scubamike124/amberai` or this reports repo refers to a secret with those words, and the code reads only `KDP_HEADLESS` and `KDP_BASE_URL` (settings, not credentials). [V]

## What the survey did not and could not read

- **GitHub Actions secret names.** The session's proxy refuses that API path. The workflows reference no such secret, so nothing expects one. [U for the list itself]
- **A Railway service that is not one of the two read.** The survey reads the services it runs inside. If there is a third service, its variables were not read. [U]
- **A credential with a name that does not mention Amazon.** For example a generic owner password. By your instruction I would not repurpose such a credential for Amazon, so I did not look for one.
- **Your laptop, your iPhone and their saved sign-ins.** Out of reach by design.

## Next action required from you

Pick one, in a sentence:

1. **Your computer (Route A).** Record the one-sentence decision for Amazon hosts, and name a time at the computer with the amberai folder (about 40 minutes). You sign in yourself. This needs no new approval and no spending.
2. **An iPhone sign-in screen on a small cloud service (Route B).** You open a private one-use link on your iPhone, sign in to Amazon in a live view of Amber's browser, and tap "I am signed in". I am **building it now, switched off**: no new service, no spending and no contact with Amazon until you approve the list of effects in Report 13 (cost, an encrypted Amazon session held by Amber, your password passing through the service's memory, Amazon's view of a disclosed agent from a data-center address, KDP Terms 4.3). Say yes to that list and I deploy it.
3. **An aggregator with an API (Route C).** Only if Amazon refuses the disclosed agent; needs your approval of its own list.

Whichever you pick, nothing is published without your typed PUBLISH, and a book counts as in the Bookshelf only from the Bookshelf read back (or your screenshot).
