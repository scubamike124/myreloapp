# Amber Global Recruiting: marketing materials

Everything here is a draft for the owner to read, change and approve. Nothing is sent, posted or uploaded by the system: the owner sends each message and posts each post by hand, and the owner decides who speaks a video script. Written 18 Oct 2026 (Pacific).

| File | What it holds | Status |
|---|---|---|
| [01-agency-first-messages.md](01-agency-first-messages.md) | Four first messages and the follow-up, composed by the real composer for invented agencies | Usable after the owner approves the process |
| [02-agency-replies-and-offer.md](02-agency-replies-and-offer.md) | Eight short replies to what an agency is likely to ask, and the one-page offer | Usable after the owner approves the process |
| [03-employer-note-HELD.md](03-employer-note-HELD.md) | The first note to a small employer, for stage two | **Held** |
| [04-candidate-notes-HELD.md](04-candidate-notes-HELD.md) | Candidate-side posts and replies, the consent wording | **Held** |
| [05-public-posts.md](05-public-posts.md) | Seven public posts | Mostly usable now; two wait for the first live read |
| [06-video-scripts.md](06-video-scripts.md) | Six video scripts, production notes | Four usable now; two wait for the system to have run |
| [07-example-list.md](07-example-list.md) | What an agency receives: the weekly list, as produced by the real code from invented companies | Shows the product |

## How they were checked

The same wording check that stands in front of every first message (`src/lib/recruiting/voice.ts`) was run over every piece, and a test (`__tests__/marketing.test.ts`) fails if any piece has an error or even a warning. The check refuses stock openings ("I hope this finds you well", "reaching out", "quick call"), brochure words, hype, exclamation marks, long dashes, claims about clients, results, licenses, rankings and guarantees, closeness that was not earned, and unfilled placeholders. A separate test checks that the replies and posts do not share their wording with each other. It cannot make a sentence good. It can only refuse sentences known to read as machine-made or as marketing, so the owner reading each piece is still the real check.

A second reader, briefed as a skeptical agency owner who has received thousands of cold emails, then read the first version and found what a word list cannot: claims of experience and demand that do not exist yet, guesses about the reader's business, a tone of a running operation, a footer that called a first message "one-time" when a follow-up exists, and an agency's "area" read from its own office staff (an account manager read as accounting). Those were fixed: the messages now say what the sender is not (no competition, no candidates) instead of guessing at the reader's desk; the footer says the follow-up is coming; an agency's area comes from its recruiter titles only; the pieces say plainly that this is new, that there are no other clients or references, and that advice is a place to start; and the spelling is American.

## Rules the pieces follow

- No claim that Amber has clients, candidates, placements, results or revenue. Today it has none, and every piece is true with those at zero.
- No claim of experience, demand or a track record. Where something is new or untried the piece says so ("I have no other clients yet", "I have not made these calls myself yet").
- No claim of a license, an exclusive source, a ranking, or "AI-ranked" or "bias-free" anything.
- "I" is the owner, as in the emails. The emails already say that an AI assistant helps with research and drafts and that the owner reads every message. Nothing says or implies the speaker is somebody else.
- Nothing is addressed to a job seeker who did not write first. Candidates come in on their own, and nothing about fees, placements or guarantees is said to them.
- Every public number is either a published figure with its source named, or a count read off the owner's own page. The prices in the reply and the one-page offer are the suggestions from 05-revenue-plan; change them to your own before they go.

## What the materials do not include, on purpose

- No employer outreach is enabled. The employer note is held because it needs applicants' details to be handled, which the list product never does.
- No weekly status post or video with numbers in advance. Those are read from the owner's page on the day, so they cannot be wrong in advance.
- No testimonial, no customer logo, no "as seen in", no case study. None exists.
