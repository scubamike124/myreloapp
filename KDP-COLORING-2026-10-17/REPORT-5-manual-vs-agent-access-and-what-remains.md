# Report 5 — signing in yourself versus Amber acting in the account: what the rules say, what is allowed where, and what remains

Written 2026-10-17 15:1xZ for the owner's 15:0xZ question: may the owner sign in to KDP personally from the iPhone through the cloud browser, with Amber not acting on Amazon, and is
written authorization actually required? Sources: Amazon's Conditions of Use and the KDP Terms (runner reads of 2026-10-17, batch 170), GitHub's Terms for Additional Products and Features
(runner read, batch 172). Amber has sent no request to any Amazon host in this round.

## Answers

1. **Yes, you can sign in to KDP yourself from the iPhone, directly, today, and no Amazon rule requires anyone's approval for that.** Safari or the Amazon app is the secure iPhone connection: your password, codes and
   CAPTCHAs go from your phone to Amazon and nowhere else.
2. **Through the cloud browser: not recommended, not built, and the only host I have may not be used that way.** No Amazon rule I found forbids a person typing into a browser on a server they control. But (a) GitHub-hosted runners may be
   used only for the production, testing, deployment or publication of the repository's software project, so a real sign-in session cannot run on them; (b) it adds account risk and nothing you cannot do on the phone; (c) KDP Terms 4.3
   makes you "solely responsible" for the password and for everything done under the account.
3. **Amber acting in the account is a different case with different rules, and it is not operational.** The rule is the "Agents" section of the Conditions of Use plus KDP Terms 4.3. Neither contains a pre-approval clause, but Amazon may refuse
   any agent "at our sole discretion", and the only way to remove that risk is Amazon's written answer.

## 1. The two cases side by side

| | You sign in yourself (no Amber action on Amazon) | Amber acts in the account (fills forms, uploads files) |
|---|---|---|
| Amazon rule that applies | none specific: Conditions of Use "responsible for maintaining the confidentiality of your account and password and for restricting access"; KDP Terms 4.3 | Conditions of Use "Agents": Transparency and Consent, Limitation on Access, Technical Requirements (i)–(iv); KDP Terms 4.3 "You may not permit any third party to use the Program through your account" |
| Does it need Amazon's written authorization? | **No rule says so** | **No clause says "get approval first"**; but "no Agent may access ... if we have requested that the Agent refrain" and "at our sole discretion, we may limit ... whether and how any Agent accesses". Amazon calls agents it has not accepted "unauthorized" when it blocks them (reported, Meta's Muse, 2026-09-20) |
| Who handles password, codes, CAPTCHA | you | you may type the password and code; the agent must never solve or get past a CAPTCHA |
| What could go wrong | Amazon's risk system challenges an unusual device or address (a datacenter address would); you are liable for activity under the account | Amazon blocks or limits the agent; a non-compliant agent may put the account at risk (Amazon's call); 4.3 "third party" ambiguity |
| Hosting | your own phone: nothing to host | a host you may use that way (see section 4); not GitHub-hosted runners |
| Status | **operational now** | **not operational** (section 5) |

## 2. Signing in yourself: the exact words

- Conditions of Use: "You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account, and you agree to accept responsibility for all activities that occur under your
  account or password."
- KDP Terms 4.3 Account Security: "You are solely responsible for safeguarding and maintaining the confidentiality of your account username and password and are responsible for all activities that occur under your account, whether or not
  you have authorized those activities. ... You may not permit any third party to use the Program through your account and will not use the account of any third party. Your acceptance of this Agreement includes and is on behalf of any
  other party who uses the Program under or in connection with your account, such as an employee or contractor."
- KDP Terms 4.2: "You may maintain only one account at a time." (so no second account, as instructed).
- The Agent Terms define an Agent as "any software or service that takes autonomous or semi-autonomous action on behalf of, or at the instruction of, any person or entity". A relay that forwards a person's own taps and typing and
  does nothing on its own is, on its face, not autonomous or semi-autonomous. That is my reading, not Amazon's; the support question below asks Amazon to confirm it.
- Searched for any rule on remote, virtual or proxied browsers (remote access, proxy, virtual machine, third-party device): none in the Conditions of Use; none on automation (robot, automated, scrape) in the KDP Terms.

So nothing requires authorization for you to sign in. The practical risk of the cloud route is Amazon's risk engine and your liability, not a rule.

## 3. Amber acting in the account: the exact rules

Conditions of Use, "Agents" (page "Last updated: August 14, 2026"): "Transparency and Consent. No Agent may access, use, or interact with Amazon Services unless, at all times, it identifies itself and operates in strict accordance with the requirements ... In
addition, no Agent may access, use, or interact with Amazon Services if we have requested that the Agent refrain ..." — "Limitation on Access. At our sole discretion, we may limit, including by technical measures, whether and how any Agent accesses, uses, and interacts with
Amazon Services." — "Technical Requirements. Agents must: i. ... include ... 'Agent/[agent name]' in the user agent string ... ii. Not conceal or obfuscate that any access ... is from an Agent, such as by (a) mimicking the speed or pattern of human keystrokes ... or (b)
completing or circumventing CAPTCHAs ... iii. Respond truthfully to any question ... whether ... a human or a computer ... iv. Not circumvent or otherwise avoid any measure intended to block, limit, modify, or control whether and how Agents access ..."

**Correction to Report 4.** I wrote that the design was "compliant ... not authorized" and made "Amazon's authorization" the gate. Precisely: no clause makes prior authorization a condition. What the text gives Amazon is discretion to limit or refuse, and a right to ask an agent to stop, and Amazon
treats agents it has not accepted as "unauthorized" when it blocks them. The gate in the code (`kdp/cloud/authorization/amazon.json`) is my risk policy, from your instruction not to risk the publishing account; it is not an Amazon requirement. It stays, because the downside falls on your account.

**KDP Terms 4.3** adds a second question only Amazon can answer: whether an AI agent run on third-party infrastructure is "a third party" using the Program through your account, or your own tool ("any other party who uses the Program under or in connection with your account, such as an employee or contractor" is covered by your acceptance).

### The support request (ready to send; only you can send it)

> Subject: Two questions about how I may use my KDP account: a remote browser, and software acting under my supervision
>
> Hello KDP Support, I publish through my KDP account (the email address on this request).
> 1. Signing in myself from a remote browser. I would sometimes sign in to KDP myself, typing my own password, verification codes and CAPTCHA answers, in a browser running on a server I control and viewed from my phone. No software would act on the account.
> I read the Conditions of Use and KDP Terms section 4.3 (Account Security) and found nothing that forbids this. Can you confirm that it is permitted?
> 2. Software acting under my supervision. The Conditions of Use section "Agents" (last updated August 14, 2026) covers software that takes autonomous or semi-autonomous action for a person: it must send "Agent/[name]" in the user agent, must not conceal that it is software, must not complete or circumvent
> CAPTCHAs, and Amazon may limit agents at its sole discretion. I would like to use such software to fill in the details of draft paperbacks and upload the manuscript and cover files, saving drafts only. I would sign in myself, including two-step verification, and I would review and publish every book myself. The software would send "Agent/AmberOne" and
> stop at any CAPTCHA or block. Is this permitted for my account, given that section and KDP Terms section 4.3 ("You may not permit any third party to use the Program through your account")? If approval or registration is needed, what is the process? Is there an approved programmatic way to create drafts?
> Please answer in writing so I can keep it with my records. Thank you.

## 4. Where it may run: GitHub's terms

GitHub, Terms for Additional Products and Features, Actions (runner read 2026-10-17): "regardless of whether an Action is using self-hosted runners, Actions should not be used for: ... If using GitHub-hosted runners, any other activity unrelated to the production, testing, deployment, or publication of the software
project associated with the repository where GitHub Actions are used." And: "You may only access and use GitHub Actions to develop and test your application(s)." Misuse "may result in termination of jobs, restrictions ..., disabling of repositories ..., or in some cases, suspension or termination of your GitHub account."

A real sign-in session for you (or for Amber) on a GitHub-hosted runner is outside that. **Changed:** the cloud assist workflow (amberai #876) now runs the self-test only (a test of the software against a local fake site, which is within the terms); the session mode stays in the code for a permitted host and is not offered as a workflow
input. Earlier statements that the cloud route "runs on a GitHub runner" for real sessions are withdrawn.

Hosts that would be allowed: your own machine (a self-hosted runner or the tool run directly; free; available when you are at it), or a paid service you approve (not requested). The production Amber worker on Railway has Chromium but carries the lanes you told me not to interrupt, and I have not touched it.

## 5. Exactly what remains before each connection is operational

**Signing in yourself from the iPhone: operational now.** Remaining: nothing to build. Amber supplies, for whichever book you choose, the two PDFs and the generated copy sheet; you do the 20 minutes in Safari and send a screenshot of the Bookshelf showing "Draft".

**Amber acting in the account: not operational.** In order:

| # | Item | Who | State |
|---|---|---|---|
| 1 | Send the support question above and receive Amazon's written reply | you (Amazon replies) | not sent; reply time unknown |
| 2 | Decide what to do if Amazon says no or does not answer: stay with the iPhone route (my recommendation) or proceed under the Agent Terms at your own risk (not recommended) | you | open |
| 3 | A host the owner may use for real sessions: your laptop (free, from tomorrow), a self-hosted runner, or a service you approve (cost needs your approval) | you choose | open |
| 4 | Move the assist browser to that host and re-run its 23-check self-test there | Amber | about half a day once 3 is chosen |
| 5 | Adapt and test the KDP draft flow (details, files, previewer, save draft, read the Bookshelf): the script exists but has never run against KDP's real pages | Amber, then one watched run with you | after 1 and 4 |
| 6 | Commit `kdp/cloud/authorization/amazon.json` with Amazon's written reply as the basis | you | after 1 |
| 7 | First watched run: you sign in on the phone through the one-time link, type your own password and codes; any CAPTCHA or block stops the run; the draft is confirmed from the Bookshelf | you and Amber | after 4–6 |
| 8 | Decide whether a signed-in session may be stored for later runs (it is a credential; not built) | you | open |

Earliest realistic date for item 7: after Amazon's reply plus about a day of work; there is no date I can promise because step 1 is Amazon's.

## 6. Also noted

- My earlier research made 94 read-only requests to Amazon hosts without the Agent token (disclosed in Report 3); the saved lists in this public repository are a compilation of Amazon listing data, and the Conditions of Use license excludes "collection and use of any product listings, descriptions, or prices"
  and "robots, or similar data gathering and extraction tools". I have made no further Amazon reads and will not. I recommend removing the raw list files (`amazon-lists-2026-10-17.json`, `amazon-products-2026-10-17.json`) from this public repository in a normal commit (the history keeps them) and keeping only my aggregated findings. I have not done it; say the word.
- No second KDP account, no spend, nothing published.

## 7. Update 2026-10-17 15:35Z: amberai #876 is merged

All three checks (qa-engine, test, assist) were green on the head commit at 15:34Z, and the pull request merged as commit `52d12cae`. What is now on main: the disclosed remote browser (refuses Amazon, private addresses and unlisted ports unless you commit the authorization file), its 23-check self-test, a workflow that runs the self-test only, the generated iPhone copy sheet, and the draft script's gate. Nothing in it contacts Amazon. The continuous-integration run on main for that commit (run 39045701697) finished green at 15:57Z, with the engine job and the test job both successful. Table row 4 of section 5 (move the browser to a permitted host and re-run the self-test there) is unchanged.

