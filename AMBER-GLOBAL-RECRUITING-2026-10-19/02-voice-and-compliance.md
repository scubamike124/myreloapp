# Voice and compliance: what the system refuses, and why

Written 18 Oct 2026 (Pacific). Everything in this file describes code that exists and is tested (`src/lib/recruiting/voice.ts`, `compliance.ts`, `drafts.ts`, `actions.ts`, `state.ts`). It is research turned into rules, not legal advice; the points that need a lawyer are listed at the end.

## The owner's rules, and where each one is enforced

| Rule from the brief | Enforced by | How |
|---|---|---|
| Nothing is sent until the messaging and compliance process is approved | `compliance.ts` (`process`), the page | Until the owner presses "Approve the process", every message is held and cannot be approved. The approval is one line in the owner's decision log with the date and scope, and can be withdrawn. |
| Amber does not send anything | The code | There is no sending code in the recruiting lane at all. The owner copies each approved message into their own mail and sends it, then presses "I sent it". |
| Natural, human-written wording; no robotic language, repetitive templates, generic AI wording or exaggerated claims | `voice.ts`, `drafts.ts` | See below. |
| No claim that Amber has clients, candidates or revenue without evidence | `voice.ts` (claims rules), `ledger.ts` | The wording check refuses claims about clients, placements and results. Revenue counts only with proof (a bank deposit, a payment record or a paid invoice), a reference of at least four characters, and the owner's confirmation. |
| Respect privacy, recruiting law and platform rules | `compliance.ts`, `regions.ts`, `contacts.ts`, `http.ts` | See "The gate" below. |
| Required human decisions | `actions.ts`, `state.ts` | Every approval, edit, rejection, "sent", reply, conversation, stage, opt-out, setting and money entry is an action by the owner, logged with its date. The worker writes prospects only. |
| Keep cost at $0 | `ledger.ts` | The budget defaults to $0. Any expense entered is counted and shown against it. Nothing in the lane calls a paid service. |

## The wording check (`voice.ts`)

Every message is read by this before the owner sees it. A message with an error is never offered as ready; a warning is shown but does not stop it. Each hit comes with its reason, so the owner can read why and disagree.

**It refuses (errors):**

- Stock openings and filler: "I hope this finds you well", "reaching out", "touching base", "circle back", "quick call", "I'd love to chat", "dear hiring manager", "please find attached", "feel free to".
- Words that sell instead of say: leverage, synergy, holistic, ecosystem, cutting-edge, world-class, game-changing, unlock, supercharge, seamless, robust, scalable, comprehensive, turnkey, bespoke, "tailored solutions", "in today's fast-paced world", "navigate the landscape", "our team of experts", "passionate about", "trusted partner".
- Text that gives away a machine reply: "as an AI", "here is your draft", "certainly!".
- Claims nobody can check: guarantees, "100%", "risk-free", "track record", "years of experience", "we have placed", "our clients", "trusted by", numbers of candidates or clients, rankings ("top", "best", "leading", "number one"), a license, certification or exclusivity Amber does not have, "AI-ranked", "bias-free", false urgency ("act now", "limited time", "urgent"), "no obligation".
- Closeness that was not earned: "I've been following your company", "big fan", "congratulations on", "as we discussed", "following up on our call". The sender has only read a careers page.
- Emoji, unfilled placeholders (`{{name}}`, `[company]`, `TODO`, `undefined`), more than one exclamation mark, more than two long dashes, a subject that pretends to be a reply (`Re:`), shouting in a subject, more than two asks in one email, and a first email that does not name at least two things the reader can check (the company and the role, for example).

**It warns about (warnings):** length outside 45 to 130 words for an email; long dashes; words in capitals; the "not just X but Y" pattern; more than one list of three; every sentence about the same length; very long sentences; a message about "we" more than "you"; more than three sentences that start with "I"; bullets or stray spacing in a first email; no question; no plain greeting; a vague subject; one exclamation mark.

**What it cannot do.** It cannot make a sentence good. It refuses the sentences known to read as machine-made or as marketing, and it checks facts only in the sense that the message must name things the reader can verify. The owner reading each message is the real check, and the page is built around that.

**The batch check.** Ten messages that were each written for someone can still be one template with the names swapped. The composer picks among several hand-written versions of every sentence (openings, bridges, three offer sentences, terms, the ask, the sign-off, the subject), prefers the version used least in the batch, and tries up to 48 other combinations when a new message would share too much of its wording with one already made. Names, roles and places are taken out before comparing, and the comparison is on five-word runs. In the tests, across forty messages, the median pair shares under 12% of its wording and no pair reaches 40%. The page reports any pair at 30% or more instead of hiding it.

**Where the rules came from.** The owner's wording on 18 Oct 2026, plus the legal memo's section 6 ("never cross" list): pretending a person wrote or read something they did not, a persona that hides it is an AI, invented familiarity, invented clients, placements, results or testimonials, a license or exclusivity Amber lacks, "AI ranking" or "bias-free" without proof.

## The gate (`compliance.ts`)

A message is "ready" only if the gate says ok. A **hold** means something must be done first (a setting, a decision, a lawyer's reading). A **block** means it must not go out in this form at all. Anything unknown fails closed: a country that could not be read, a region with no recorded rule, a missing setting.

**Blocks**

- The business or address asked not to be contacted, or the owner set it aside. This is permanent.
- They already replied. A reply is handled by the owner by hand.
- The message is addressed to an individual job seeker. No cold message goes to a candidate, ever; candidates come in on their own.
- The wording check found an error.
- The service is not switched on in the settings.
- The region forbids cold email, or needs the recipient's prior consent (Germany, Spain, Italy, Canada, Australia, Japan, South Korea, South Africa).
- The address is not a role address on the company's own domain (`jobs@`, `careers@`, `hello@`, `info@`, `contact@`, `sales@`; never `first.last@`, `noreply@`, `privacy@`, `legal@`). The address on the draft differs from the one found on the company's page.
- The footer lacks the sender's name, the business name, the postal address, the plain opt-out, the line saying how the address was found, the line saying it is a commercial message, or (unless the owner chose to omit it) the line saying an AI assistant is used.
- A first message was already sent to them, or a follow-up was already sent.

**Holds**

- The country could not be read, or no rule is recorded for it, or the region is not one the owner has cleared (default: United States only).
- The region's cold-email rules are restricted or unclear (Netherlands, Ireland, other EU/EEA countries, India, UAE, Brazil, Mexico).
- The service might count as employment-agency activity where licensing exists (shortlists, split fees, placement).
- The company's roles are in New York, New Jersey, Massachusetts or Illinois, where agency licensing is strict, until the owner has cleared the state after taking advice.
- No published address was found yet, or the page where it was printed is not recorded.
- A setting is missing (name, business name, postal address, reply address).
- A follow-up is less than 7 days after the first message.
- The process has not been approved.

**Notes** (shown, not stopping): a region's research is from public sources and a local lawyer should confirm before volume.

## How addresses are found and used (`contacts.ts`, `http.ts`)

1. The robots.txt of the company's site is read first. If it cannot be read, that counts as a refusal.
2. At most four pages are read: the home page and the usual contact, careers and about pages.
3. Only an address printed on the company's own site, on its own domain, and of a role kind is kept. For a staffing business the preference is sales, bd, hello, info, contact; for an employer it is jobs, careers, hr. A contact form is accepted as a channel but nothing is ever submitted by software.
4. A notice on the site saying it does not want unsolicited offers ends the search for that company.
5. Nothing is guessed, no email-finder or verifier service is used, and nothing is copied out of job posts, Hacker News comments or feed payloads. Poster names and emails in Hacker News posts are dropped when the post is read.
6. The reading identifies itself as `AmberRecruitingBot/1.0` with a contact address, at low request rates, at most 110 requests and about two minutes per run.

## Opt-outs

An opt-out is permanent and takes effect the moment the owner records it on the page. It can be by business, domain or address. A reply that the reply classifier reads as "unsubscribe" suppresses automatically. The footer promises "I will not write again" and the system keeps that promise even if the owner forgets: a suppressed business can never appear in the queue, and a message that was already approved stops showing as approved and is shown as blocked.

## What nothing here does

- It does not score, rank, filter or reject a person. There are no people in the list.
- It does not send, post, submit a form, create an account or message anyone on any network.
- It does not keep named individuals: no recruiter, hiring manager or poster appears in any stored record.
- It does not claim a result. The ledger counts a dollar as revenue only with proof the owner has confirmed.

## What a lawyer should confirm before volume

Taken from the legal memo (section 9), reduced to what affects the first 90 days:

1. That a fixed-fee research list sold to staffing agencies is outside California's employment-agency statute (Civil Code 1812.500 and following; the employer-only exemption is at 1812.502(a)), and not agency activity where the agencies and employers are.
2. That the footer and the process meet CAN-SPAM and California B&P 17529.5 as the owner will use them (the postal address in particular).
3. Whether a research list that includes a company's published hiring address and the roles it advertises can bring Amber under California's data-broker rules. The list contains no named people, so the expectation is no, but this has not been confirmed.
4. Whether using public job-board feeds for a paid list is acceptable under each vendor's terms (most say nothing; see 03-lead-sources).
5. Before any employer-side or candidate-side work: the employer agreement, the candidate notice, retention, and the automated-hiring-tool rules in New York City, Illinois, Colorado, California and the EU (see 04-workflow).
