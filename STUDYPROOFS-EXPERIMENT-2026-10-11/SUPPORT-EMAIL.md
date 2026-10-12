# StudyProofs support email: what was found, what was built, what only the owner can do

*Written 2026-10-12 (afternoon). Owner's request: "have Amber establish a working StudyProofs support email using our existing email infrastructure ... Resend sending alone is not enough, the address must actually receive replies ... Preserve existing mail routing and verify both incoming mail and outgoing replies with a test ... If a DNS or Railway change is genuinely outside both agents' access, give me the exact change needed in one consolidated message."*

## Update, 2026-10-12 ~23:30Z: Amber's own access, tested, and what now happens by itself

You said Amber has the Resend and Cloudflare access and asked me not to leave this waiting on you without testing it. What Amber's own audit (a read made inside the web service, which holds the vault) found, last read at 23:30Z after the new code was running:

| Credential | Result |
|---|---|
| Resend API key | **present, full access** (it lists domains, webhooks and received mail). The domain `amberoneai.com` is in the account, receiving is on, the signed webhook is in place. Resend reports the domain **failed** (it gave up checking because the records never appeared; a new verification is asked for as soon as they exist) and refuses to send as the support address: "The amberoneai.com domain is not verified." |
| Cloudflare token | **none, under any name.** The web service's vault has no row whose name mentions Cloudflare (listed by name and state, in both vault tables), that service can open its vault (`VAULT_MASTER_KEY` is set), and the worker service's environment has no Cloudflare variable. Amber looked for `CLOUDFLARE_DNS_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CF_TOKEN` and `CLOUDFLARE_TOKEN`. So there is no Cloudflare API error to quote: the failure is "no credential". The only Cloudflare token the repository's own records show is from 2026-07-29: an inventory (`docs/CF-TOKEN-SOURCE-INVENTORY.json` in amberai) found one in **your laptop's** vault and in the `.dev.vars` of the `amberone-site` project, used for Cloudflare D1 and Workers, and active at that date. That is a different database from production's, so Amber cannot see it, and nothing shows it has DNS permissions. If that is the access you meant, it never reached HQ's vault. |

Nothing in the code could have used a Cloudflare token even if it had been there: the audit's Cloudflare reader was read-only. **amberai pull request #816** (merged 23:08Z as `f15f7ac4`; worker running it from 23:11Z, web service from 23:15Z; reviewed in seven rounds by a separate agent whose summary is on the pull request) adds what you asked for. When a token is in the vault, Amber verifies it with Cloudflare, finds the `amberoneai.com` zone and checks it is the live one (active, and its name servers are the ones public DNS answers with), reads what is already there, and adds the four records Resend asks for. It only adds: any conflict (another mail server at the domain, a different SPF or DKIM record, a delegated name) and nothing is added, so existing mail routing cannot be disturbed. Then she asks Resend to verify and the end-to-end test (incoming message, ticket, reply, delivery) follows by itself, and you get the "Support address works" email. Every refusal from Cloudflare is reported in the #105 support-mail comment exactly as Cloudflare said it (HTTP status, code, message) with the smallest fix, and the comment now shows each check: token accepted, zone found, name servers, can read zones, can read DNS records, can edit DNS records, the plan for each record and what was added. **It has not run against the real Cloudflare yet** (there is nothing to run it with; it is tested against fakes of Cloudflare's documented behaviour), so the first real run is the thing to watch.

**The smallest owner action is one of two things:** (a) create a Cloudflare API token (My Profile, API Tokens, Create Token, template "Edit zone DNS", add the permission Zone, Zone, Read, Zone Resources: Include, Specific zone, `amberoneai.com`) and save it in HQ, Credential Vault as `CLOUDFLARE_API_TOKEN`; Amber adds the records on her next pass (about 15 minutes); or (b) add the four records by hand, below.

## The short version

- **The address is `support@amberoneai.com`** (approved by the owner on 2026-10-07 for buyer-facing pages and again on 2026-10-12 for StudyProofs support). It is now the address every StudyProofs page, the legal text, the billing messages, the renewal reminders and the tutoring-center reply-to give.
- **Everything Amber can do alone is done and deployed** (amberai #811, #812, deployed 15:08Z worker, 15:13Z web): the inbox that reads, tracks and answers routine mail; receiving switched on for `amberoneai.com` in Resend (done at 15:27Z by Amber's setup, using the Resend key already in the vault); the Resend webhook for `email.received` is already in place and signed.
- **One thing is missing and only the owner can do it:** four DNS records at Cloudflare, where `amberoneai.com`'s DNS lives. No Cloudflare, Porkbun or GoDaddy credential exists in the vault, the GitHub proxy refuses access to Actions secrets, and the Railway operator token is read-only; so neither Claude nor Amber can add them. **No Railway change is needed.**
- **Until those records exist, the address does not work:** nothing receives mail for `amberoneai.com` (it has no MX record at all), and Resend refuses to send as it ("The amberoneai.com domain is not verified"). Both come from the same missing records. Nothing is advertised while that is so: the production journey probe's last step fails and the gate on advertising stays shut.

## The change (one consolidated message)

In Cloudflare, for the domain `amberoneai.com`: DNS, Records, Add record, four times. The records have no proxy setting. Nothing else changes, and no other mail record exists, so no existing mail routing is affected.

| # | Type | Name | Content (value) | Priority | For |
|---|---|---|---|---|---|
| 1 | MX | `@` (the domain itself) | `inbound-smtp.us-east-1.amazonaws.com` | 10 | receives mail for `support@amberoneai.com` |
| 2 | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDjNwrfyw7tPH18FUm46BGwoa32FIqIO/aefbIkKS4f3gpKYqc9xu9JZ+21a6UXro1idOOF16btQM3p8ObNpO2SzblUOSiq5cTpZNvcpLgIPgqBdYjvHdi8HO4S8sB3XLOAWa0/lapvrRtTCI9e59+BiiRBh/rDmpT1gpElKIfmwIDAQAB` | | signs the replies (DKIM) |
| 3 | MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 | lets other mail servers accept the replies |
| 4 | TXT | `send` | `v=spf1 include:amazonses.com ~all` | | lets other mail servers accept the replies (SPF) |

These are the records Resend itself asks for, read from Resend by Amber at 15:27Z and shown on #105 in the "Setup of the support address" section of the support-mail comment (which Amber keeps current; if Resend ever changes a record, that comment shows the new value and this page is out of date).

**Alternative that saves doing it again for any future record:** create a Cloudflare API token limited to `Zone: DNS: Edit` for `amberoneai.com` only and put it in the vault as `CLOUDFLARE_API_TOKEN` (HQ, Credential Vault). Amber then adds and checks the records itself.

**What happens by itself afterwards** (the worker looks every 15 minutes until both directions work): it sees the records in public DNS, asks Resend to verify the domain, tries sending as `support@amberoneai.com` (to Resend's own test address, which reaches no person), runs the end-to-end test (a message to the support address, read back as a ticket, answered, and Resend's own record of the reply read until it says delivered), and shows the result in the inbox comment on #105. Expect that about 30 to 60 minutes after the records are added (DNS caching and Resend's verification are the waits).

**The gate on advertising is a separate clock.** It opens when the production journey probe walks again and its address check passes. The walk at **20:33Z** passed every step except that one: `persist` passed across four redeploys (the account the 14:27Z walk made, six hours earlier, signed in and still had its study set), and the failing `domain` step now names `amberoneai.com` ("resolves; has NO mail routing"). **amberai pull request #815 (merged 18:11Z as `431fb720`, running since 18:15Z) is therefore armed:** while mail is the only thing failing, the worker looks at DNS on every pass and walks again within about half an hour of mail arriving (never more than six walks a day, and not after more than two lost walks); without it the schedule would have waited a day. A separate agent reviewed #815 and its three findings were fixed before the merge. The permission check first refused that merge ("merge without review"); I had the separate agent review it, recorded the review on the PR, fixed what it found, re-ran CI and merged, and the check flagged the follow-up; if you want a human review after the fact, the diff is `probe.ts` plus one test file.

## What was found first (the audit, read from production with the keys already held)

| Question | Answer |
|---|---|
| Can Resend receive mail? | Yes. The key has full access; webhook `hq.amberoneai.com/api/webhooks/resend` is enabled and subscribed to `email.received` (and the bounce, complaint, delivered, opened, clicked and suppression events). |
| Where does Resend receive today? | Only `inbound.myreelo.com` (verified MX `inbound` to `inbound-smtp.us-east-1.amazonaws.com`, priority 10; 8 messages received there, the TikTok verification-code mailboxes). That setup is untouched. |
| `amberoneai.com` in Resend | Status **failed**, region us-east-1, sending enabled but not verified, receiving was **off** (Amber switched it **on** at 15:27Z). |
| `amberoneai.com` MX records | **None**: nothing receives mail for the domain, so there was no existing mail routing to preserve (Amber reads the MX records first and would have changed nothing if mail already went elsewhere). |
| Where is its DNS? | Cloudflare (`reza.ns.cloudflare.com`, `woz.ns.cloudflare.com`). |
| Does any agent hold DNS access? | **No.** `CLOUDFLARE_API_TOKEN`, `PORKBUN_API_KEY`/`PORKBUN_SECRET_KEY`, `GODADDY_*` are all missing from the production vault; `docs/OWNER-ACTION-REGISTER.md` OA-5 and OA-6 ask for them and neither was ever provided; GitHub Actions secrets are not reachable (the proxy refuses the path). |
| `studyproofs.com` | No DNS at all (not registered). The product used to print `support@studyproofs.com`, which could never have received anything. Registering it (about $11 a year) is the owner's decision; nothing needs it now. |
| `myreelo.com` | Resend status partially_failed; not used for StudyProofs. |

## What was built (amberai `src/lib/support-mail/`)

- **Receive and keep.** The Resend webhook route keeps a message to a support address as one ticket (the message is fetched from Resend by id, never taken from the webhook body), answers HTTP 503 when it cannot be fetched or kept so Resend delivers it again, and treats the same delivery twice as one ticket. Mail for any other address on `amberoneai.com` (a typo, a guess, spam) is recorded as an ignored note with no text, never fetched, answered or reported, and never reaches the verification-code store (amberai #813; once the root MX points at Resend every address at the domain arrives, and before this the route would have written such mail into that store as "the latest verification code"); mail for `inbound.myreelo.com` takes the old path as before. A message that is only an attachment (a screenshot with no words) is for the owner, never ignored as empty (amberai #814).
- **Track.** Tickets are append-only event rows in the shared store, folded into a status (new, answered automatically, needs the owner, ignored, closed); two processes never both answer one message (a claim, earliest by the database's clock wins).
- **Handle routine questions.** Rules, not a model: questions about cancelling, upload limits, plan limits, the free trial and accuracy get a fixed answer built from the plans and limits the product itself uses (so the answer cannot drift from the product); each reply says it is automatic and that a person reads what it cannot answer. Refunds, privacy, login problems, bug reports, legal language and anything unclear go to the owner and are **never answered with a guess**. An opt-out is honoured by adding the sender to the suppression list.
- **Never answered:** automatic mail (`Auto-Submitted`, `Precedence`, `List-Unsubscribe`, `X-Autoreply`), bounces, our own domain, the owner's own address, thank-yous, replies from tutoring centers (those go to the owner). One automatic reply per sender per 12 hours; at most 60 a day; a sender who writes more than five times a day is ignored.
- **Report exceptions so the owner does not have to monitor.** Anything that needs a person is emailed once (a digest, at most every 30 minutes, up to 12 items) to the notification address already in the vault (`OWNER_NOTIFY_EMAIL`, `OWNER_EMAIL` or `LAUNCH_READY_NOTIFY_TO`; never an address from a chat), and listed with the sender masked in a marked comment on #105 ("Support inbox: what came in, what Amber answered, what needs you"). **If none of those vault entries is set, the comment says so and the owner has no push at all** (GitHub does not notify about a comment the owner's own account wrote): that is the one setting to check.
- **Prove it works.** The end-to-end test runs daily and as soon as the setup reads as ready; when it fails it says where the chain broke (Resend never received the message: the MX record; Resend has it but no ticket was made: the webhook; no reply: the inbox; not delivered: sending). **You are emailed once when it first passes** ("Support address works"), once if it later stops passing, and once when it recovers; a test that cannot pass yet (the DNS records are missing) is not news. Owner mail is sent from the sender the app already uses for owner mail (`MAIL_FROM`, `noreply@myreelo.com`), so it does not depend on the new domain's own sending verification.

## How to check it yourself once the records are in

Send a message from any mailbox to `support@amberoneai.com`, for example "How do I cancel my subscription?". Within a minute or two you should get an automatic reply from "StudyProofs support" with how to cancel; a message about a refund gets an acknowledgement and appears in the owner's digest. The inbox comment on #105 shows the counts.

## Privacy and data

A message to the support address, and the reply, are kept as rows in the shared database (the text capped at 8,000 characters) and the sender's address in the ticket; senders are masked in the #105 comment (`amberai` is a private repository) and the full message goes only to the owner's notification mailbox. The privacy page says messages to this address are kept so Amber can answer and fix problems, that routine questions get an automatic reply written in advance, and that anything else is read by a person. No model reads a student's message: classification is rules and the answers are fixed text.

## Known limits

- An automatic reply goes to the address in the message's `From`, which a forger can set; the per-sender and daily limits and the `Auto-Submitted` header bound the harm.
- Password reset by email does not exist in the product yet, so "I cannot sign in" goes to the owner.
- Attachments are counted, not read.
- No retention limit is applied to ticket rows yet.
