# Report 7 — signing in from the iPhone, the support request, where Amber may run, and exactly what blocks the connection

Written 2026-10-17 15:5xZ for the owner's 15:4xZ message. In this round Amber sent no request to any Amazon host, spent nothing, published nothing and started no book work. Facts about Amazon and GitHub come from the runner reads of
batches 170 and 172 (Report 5). Facts about KDP's contact form and about KDP on a phone come from web searches (KDP's own guidance as quoted by the search results, and third-party guides); I did not load KDP's pages and I will not.

## Answers

1. **Sign in with Safari on the iPhone, directly. Not through the cloud browser.** Steps are in section 1. The cloud browser is not involved and cannot be used for it today.
2. **The two kinds of access are already separate.** Section 2.
3. **No Amazon rule I found requires authorization for Amber's access, so there is no rule to cite.** Amazon can still block an agent at its sole discretion. The request is prepared and the steps to submit it are in section 3.
4. **Safest and cheapest permitted host: your own laptop, running the script directly, with you present to sign in. Cost: $0.** Section 4.
5. **What blocks us, and what I need from you:** section 5. In short: Amazon's written answer (only you can ask), and the laptop (away until tomorrow).

## 1. Signing in yourself from the iPhone, exactly

1. Open **Safari** (not an Amber link, not a cloud page) and go to `kdp.amazon.com`.
2. Tap **Sign in** and enter your Amazon email and password yourself (iCloud Keychain or a passkey is fine; they are yours).
3. Complete whatever Amazon asks: the code from your authenticator app or text message, an approval on your phone, or a puzzle. Solve any puzzle yourself.
4. You land on the **Bookshelf**. KDP is built for a desktop browser; if a page looks cut off, tap **aA** in the address bar and choose **Request Desktop Website**.
5. Nothing needs to be uploaded or created to prove the connection. Seeing your Bookshelf is the proof. If you want me to record it, send a screenshot with your account name and email hidden. I cannot see inside the account.

What Amber sees: nothing. Amber holds no password, no code, no cookie and no session in this lane.

**Corrections to what I said before.**
- Report 5 said "Safari or the Amazon app". That was wrong: KDP has no app of its own; it is a website (secondary sources: BookAutoAI's guide, Self Publishing Titans). Use Safari.
- Report 5 quoted two GitHub sentences. One of them ("You may only access and use GitHub Actions to develop and test your application(s)") sits under "Use for Development and Testing", next to GitHub's paragraph about Apple software, and probably concerns the macOS runners. The conclusion does not depend on it: the bullet "If using GitHub-hosted runners, any other activity unrelated to the production, testing, deployment, or publication of the software project associated with the repository" already bars a real sign-in session on GitHub-hosted runners.

**Not verified:** how smoothly KDP's paperback pages and file upload behave on a small iPhone screen. The sources I found say a phone is fine for dashboard checks, metadata and small uploads and recommend a desktop for complex layout and proofing. The Book 1 copy sheet already tells you to use "Request Desktop Website" and to save the PDFs to the Files app first.

## 2. Two lanes, kept apart

| | **Lane M: you sign in and work yourself** | **Lane A: Amber acts in the account** |
|---|---|---|
| Device and software | your iPhone, Safari | a program on a permitted host (section 4) |
| User agent Amazon sees | Safari's own | the browser's own plus `Agent/AmberOne` |
| Password, codes, puzzles | you | you (the program stops at any puzzle or block and never types your password) |
| Amazon rules | Conditions of Use account-security sentence; KDP Terms 4.2 (one account) and 4.3 (you are responsible for activity) | the "Agents" section (identify, do not conceal, no CAPTCHA, Amazon may limit at its sole discretion) plus KDP Terms 4.3 |
| Needs Amazon's written approval? | no rule says so | no clause says so, but Amazon has discretion (section 3) |
| What Amber holds | nothing | nothing stored; you sign in each run; no session is saved |
| Status | **operational now** | **not operational** (section 5) |

**Why not use the cloud browser for your own sign-in:** it adds `Agent/AmberOne` to every request, so your own sign-in would be labeled as agent traffic. That is the opposite of keeping Lane M plainly human. It would also need a host I may not use (section 4) and would pass your typing through a relay for no benefit.

Lane A, even when you sign in yourself, is still Lane A: once software fills forms and uploads files, the Agents section applies to those actions.

## 3. Is authorization required? The support request

**What the rules say** (exact text in Report 5, section 3): "no Agent may access, use, or interact with Amazon Services unless, at all times, it identifies itself and operates in strict accordance with the requirements", "no Agent may access ... if we have requested that the Agent refrain", and "At our sole discretion, we may limit, including by technical measures, whether and how any Agent accesses". None of this says "get approval first". A search for a registration or allowlist process found none.

**Why ask anyway.** You told me not to risk the account, and Amazon decides at its discretion. Press coverage of Amazon's block of Meta's Muse agent on 2026-09-20 (secondary) says Amazon cited no advance notice, no identification and apparent capture of customer credentials. The request is the advance notice, and Amazon's written reply is the only thing that removes the discretion risk. A reply that is a no, or a non-answer, means Amber stays out of the account.

**The text to send:** `KDP-SUPPORT-REQUEST.txt` in this folder. Changes from the earlier draft: the remote-browser question is gone (you do not need a cloud browser), the program is described as an AI-based assistant that runs on your own computer, and the request lists the five behaviors Amazon's terms ask of an agent. One optional paragraph discloses your August 2026 scripts, which drove KDP's pages without the Agent identifier (they are listed in Report 3). Keep it only if you edit it to be true. Do not claim you never used automation.

**How to submit (about 15 minutes, iPhone or laptop).** KDP's own guidance says account questions go through the Contact Us form, and I found no support email address.
1. Open `kdp.amazon.com` in Safari and sign in.
2. Tap **Help** at the top of the Bookshelf.
3. Open a help topic close to the question (search for "account" or "terms"), scroll to the bottom of the article, and tap **Contact Us**.
4. Choose the topic closest to the question (for example Account or Terms; if neither exists, Other), then choose **Email**. If only chat or phone is offered, pick another topic until Email appears. Email gives you a written record.
5. Paste the subject and message from the file. Do not add a password, code, tax or bank detail.
6. Submit. Keep the confirmation and the case number. Third-party guides say replies often come within a day; that is not a commitment.
7. Paste Amazon's reply to me.

I have not loaded the form myself, so the menu words may differ slightly.

**What happens with the reply.**
- **Yes, or "fine if it identifies itself and you supervise":** you tell me "approved" in the chat with the reply. I create the authorization file from your words, the laptop run is set up, and we do one watched run. You do not need to edit anything in Git.
- **No, or "we do not support this":** Lane A stays closed. Amber keeps preparing files and copy sheets and you upload from Safari.
- **Vague or a canned non-answer:** treated as no unless you decide otherwise after reading the Agents section. The decision is yours and the risk falls on your account.

## 4. Where Amber may run: the safest and cheapest permitted host

| Option | Cost | Allowed | Risk to your account | Verdict |
|---|---|---|---|---|
| **Your laptop, script run directly, you present** | $0 | yes | lowest: the same computer and browser profile as your earlier sign-ins, and your password is typed on your own machine | **recommended** |
| Self-hosted GitHub runner on the laptop | $0 | yes for runners you host, but GitHub still bars using Actions to gain unauthorized access to any account, so Amazon's yes matters here too | same as the laptop, plus a service that stays running | later, only if you want runs started remotely |
| Amber's Railway server | no extra charge | technically yes | higher: a datacenter address, a stored session on a production server, and the lanes you said not to interrupt | not recommended |
| A new VPS or cloud desktop | paid, needs your approval (a few dollars a month is my estimate, not a quote) | yes | higher: a datacenter address, a new registration, your password passes the provider | not recommended |
| GitHub-hosted runner | $0 | **no** for a real session | not applicable | rejected; self-test only |

**Why the laptop:** it is the pattern that already ran on your account (a visible browser with a saved profile, you sign in, the script fills the forms, stops at Save as draft, never clicks Publish). On your own computer the software also looks like your tool rather than a third party's, which eases the KDP Terms 4.3 question. The cloud browser is not needed there: you sit at the laptop, sign in in the window it opens, and use the iPhone only for the verification code.

**If you want to drive a session from the iPhone while away from the laptop:** that needs the assist browser plus a tunnel. The free Cloudflare quick tunnel ends the encrypted connection at Cloudflare's edge, so your typed password would pass through Cloudflare in readable form, and the service is for testing. A private network app would avoid that but needs a new account, which I will not create without your word. I do not recommend this for now.

## 5. Exactly what blocks the connection, and what I need

| # | What blocks | Why | Who clears it | State |
|---|---|---|---|---|
| 1 | Amazon has not answered | No rule requires approval, but Amazon may refuse an agent and you told me not to risk the account; only the account holder can ask | you send the request, Amazon replies | **not sent** |
| 2 | No permitted host is available today | GitHub-hosted runners are barred for real sessions; the production server is off limits; your laptop is away until tomorrow | you | open |
| 3 | The draft script has never run on KDP's real pages | It passed CI and refuses to start without authorization; only a watched run shows what needs adjusting | you and me | after 1 and 2 |
| 4 | Amber cannot sign in alone | Password, code and any puzzle are yours; no session is stored | you, each run | by design |

**What I need from you, in order:**
1. Send the support request (section 3) and tell me when it is sent.
2. Tell me "laptop" and the day you will be at it, so I write the one-page runbook and set the first watched run.
3. Paste Amazon's reply. If it is a yes, say "approved".
4. Be at the laptop for the first run (about 30 minutes): you sign in, you approve each step, and you publish yourself later.

Nothing else. Lane M needs nothing from you except signing in whenever you want to use your account.

**Earliest realistic first run:** the day your laptop is with you and Amazon has replied with a yes. I cannot date Amazon's reply.

## 6. Not done, on purpose

- No book published, none created, no spend, no second KDP account.
- The six-page winter-rooms sample stays parked on its branch (amberai `claude/kdp-winter-nooks`, 4c1b680f); no further book work until you ask.
- Amber has made no request to Amazon this round.
