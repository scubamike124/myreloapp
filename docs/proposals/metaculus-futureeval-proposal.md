# Proposal: Enter the Metaculus FutureEval bot tournament

Prepared 2026-10-22. This is research only. No account, token, form, forecast or contact with Metaculus has been made.

**Labels used below**
- **[V: source]** means verified on a public page on 2026-10-22. The source is named in brackets and listed under Sources.
- **[U]** means unverified: my estimate, an inference, or a claim that only a third party makes.

Several official metaculus.com pages returned HTTP 403 (a Cloudflare block) to automated fetches. These were the Terms of Use, the Scores FAQ, the Tournament Rules, the participation page and the tournament page. Facts that only those pages hold are marked [U] or come from Metaculus's own mirrored announcements. The owner should read those pages in a normal browser before approving anything.

---

## 1. Summary and recommendation

**Recommendation: CONDITIONAL GO, as a low-cost experiment and credibility play. It is not a revenue line.**

- FutureEval is Metaculus's live AI forecasting benchmark. It runs a $50,000 bot tournament three times a year and a $1,000 MiniBench every two weeks [V: S1, S2, S3].
- The Fall 2026 season is running now. Questions began opening on 2026-09-28, and entry stays open until questions stop opening "a few weeks before January 1, 2027" [V: S2, S3].
- **Guaranteed money is $0.** All prize money depends on placing well. Under Metaculus's scoring, a bot of average skill scores about zero and wins little or nothing (see section 4).
- **Realistic expected prize for a new, average bot: about $0 to $300 per season, with a median of $0** [U, my estimate from S6 and S7].
- Running cost is small: about $0 to $60 a month in LLM and search fees if free credits come through, and $50 to $250 a month without them [U].
- Main value: a public, scored track record on a recognised benchmark, possibly free LLM credits, and an early look at the Spring 2027 season.

**Conditions for GO**
1. **AmberOne AI must not count as a "commercial bot."** A commercial bot is one built or operated for a for-profit entity with three or more founders, employees or contractors [V: S3, S4]. If AmberOne AI has fewer than three, it is not commercial. If it has three or more, it must fully open-source the bot's code by the end of the season to be eligible for prizes [V: S3, S4].
2. **The owner's country of residence must be on Ramp's supported-countries list.** Prizes are paid only by Ramp bank transfer, and there is no alternative [V: S4].
3. **The owner must accept the human duties:**
   - Create the human account personally [V: S4].
   - Identify themselves at payout [V: S4].
   - Complete the season survey [V: S3].
   - Join a code-review call if one is requested [V: S4].
   - Never adjust forecasts by hand (see section 6) [V: S4].
4. **The budget cap is approved:** at most $75 a month for LLM and search, or $0 if Amber should run only on donated credits.

**Timing:** Fall 2026 is about one third over. A bot joining now starts at 0 points and misses the questions that have already opened [V: S3, S4]. That shrinks its share of the prize pool. Treat Fall 2026 and its MiniBench rounds as a shakedown, and aim for full coverage in Spring 2027.

---

## 2. What it is

- **FutureEval** is Metaculus's AI forecasting benchmark. It launched in February 2026 [V: S1, S5] and has three parts [V: S1]:
  - a **Model Leaderboard**, which runs frontier models on a fixed prompt;
  - **Bot Tournaments**, where developers enter their own bots for a share of **$175k in prizes per year**;
  - **Human Baselines**, where Metaculus Pro Forecasters forecast a subset of questions.
- **Series history:**
  - It continues the earlier "AI Benchmarking" quarterly tournaments: Q4 2024, Q1 2025, Q2 2025, then the Fall 2025, Spring 2026 and Summer 2026 seasons. Tournament IDs for these appear in the official template [V: S8].
  - Q2 2025 had a $30k pool [V: S6, S7].
  - Seasons are now $50k [V: S3, S4].
  - Metaculus says it has run bot tournaments for about two years [V: S10].
- **Current tournament:** the Fall 2026 FutureEval Bot Tournament, Metaculus tournament ID 33121, slug `fall-futureeval-2026` [V: S2, S8].
- **Still running?** Yes. The Fall 2026 season is live [V: S2, S3].
- **Question cadence:**

| Item | Cadence | Status |
|---|---|---|
| Main season | 300 to 400 questions per season [V: S3, S4]. The Summer announcement said 300 to 500 [V: S10]. | |
| Seasons | Three a year, Spring, Summer and Fall, aligned with the Metaculus Cup [V: S10] | |
| MiniBench | About 60 questions every two weeks, mostly launched in the first few days, with AI-automated creation and resolution [V: S3] | |
| Question types | Binary, Numeric, Discrete and Multiple Choice only [V: S3, S10] | |
| Market Pulse | Bots are also eligible for the Market Pulse tournaments ($7k to $7.5k) [V: S4, S10] | Separate from this proposal |

- **Recent scale (Spring 2026):** run 2026-01-07 to 2026-04-15, with 297 scored questions and 173 bots. 111 of the bots were external; the rest were Metaculus in-house bots [V: S11].

---

## 3. Eligibility, with a verdict for AmberOne AI

| Question | Finding | Status |
|---|---|---|
| Who can enter | Anyone can join at any time during the entry window [V: S1, S10]. A human must create the human account with an email a human can read. The bot account is then created under Settings, "My Forecasting Bots" [V: S4]. | Verified |
| Bots vs humans | The tournament is for bots. Fully autonomous bots are allowed, but Metaculus makes "no special accommodations" for them [V: S4]. | Verified |
| Companies | Companies may enter. A *commercial* bot (for-profit entity with 3 or more founders, employees or contractors) cannot win prizes or receive free LLM credits unless it is fully open-sourced by the end of the season. It must still fill in the survey. Solo founders, and bots built with personal resources, are not commercial [V: S3, S4]. | Verified |
| Teams | Submit one main bot. Prize money goes to an entity representing the group or is split evenly. Each participant or team can have only one prize-winning bot [V: S4]. | Verified |
| Multiple accounts and bots | Extra bots are "secondary": not prize-eligible, hidden from public leaderboards, and must carry a version suffix. Multiple bots that break this convention are grounds for disqualification [V: S4]. Metaculus's general rules allow one account per person and say that entering a competition more than once voids all entries [U: quoted by search snippet from S13 and S14, pages blocked to direct fetch]. | Verified (bots); rules page [U] |
| Country restrictions | Payment is by Ramp bank transfer only. The bot maker's country must be on Ramp's supported list, otherwise no payout is possible [V: S4]. No cash can be sent to US-sanctioned countries [U: S13 snippet]. | Verified (Ramp) |
| Identity / KYC | A human must "eventually identify themselves during prize distribution" [V: S4]. Prize-winner verification includes the survey [V: S3]. The exact documents required are not published [U]. | Partly verified |
| Tax forms | Not addressed on the FutureEval pages [V: S4 is silent]. Other Metaculus contests say recipients pay taxes and fees, and may require IRS W-9 or W-8BEN forms [V: S15, S16 via search snippets]. Assume a W-9 (US) or W-8BEN (non-US) may be requested [U]. | Unverified for FutureEval |
| Age | Metaculus's general competition rules say "ages 13 or older" by default [U: S13 snippet]. No FutureEval-specific age rule was found [U]. | Unverified |
| Participation form | The first section of the participation form (three required questions) is mandatory [V: S3, S8]. | Verified |
| Code disclosure | To win cash, the maker must provide either the code or a description of how the bot works, and agree to inspection by Metaculus staff [V: S4]. | Verified |

**Verdict for AmberOne AI: ELIGIBLE IF AmberOne AI has fewer than three founders, employees and contractors combined. Otherwise, ELIGIBLE ONLY IF the bot is open-sourced by season end.**

- The statement that "AmberOne AI is operated by its owner" alone suggests a solo operator. That would make it non-commercial [U].
- **The owner must confirm the headcount.** Any paid contractors count towards the three.
- An automated bot is explicitly allowed, provided:
  - a human (the owner) holds the human account and the API token;
  - no human changes forecasts;
  - the owner can attend a review call [V: S4].
- **If the owner wants to keep the code private:** the declared headcount is what decides it. Open-sourcing also raises credit grants for open-source bots (about 2x to 2.5x) [V: S3, S4]. If the headcount is uncertain, open-sourcing a fork of the template is the safest choice.

---

## 4. Prize terms and realistic expected value

### 4.1 Pools

| Pool | Amount | Status |
|---|---|---|
| Main season (Fall, Spring, Summer) | $50,000 each [V: S3, S4] | Potential |
| MiniBench | $1,000 per two-week round [V: S3, S4]. That is about 6 rounds per season, or about $6k [U] | Potential |
| Annual total, all FutureEval tournaments | $175k [V: S1, S2] | Potential |
| LLM credits | Separate from prizes [V: S3]. About $100 initially for selected applicants in Fall 2026, plus performance grants for above-average MiniBench results; "more selective"; commercial bots get none [V: S3, S4] | In-kind, not cash, not guaranteed |
| **Guaranteed cash** | **$0** | Verified: nothing on any page promises a payment for participating |

### 4.2 How prizes are split

- **Score used:** the spot peer score. It is log-based, compares your forecast with the average of other forecasters on the same question, and counts only your last forecast before the question closes [V: S4].
- **Only one forecast per question** is allowed in bot-only tournaments [V: S4].
- **Comments are required** to earn prizes. They must be private comments on every forecast and must reflect the bot's reasoning [V: S3, S4].
- **The survey is required** to receive prizes [V: S3].
- **Prize formula:**
  - Metaculus's tournament scoring squares each participant's total peer score to set their share of the pool. Negative totals get nothing [U: described in the Metaculus post "Introducing simpler, fairer tournament scores" (S12), seen only via a search summary; the page was blocked to direct fetch].
  - A third party says prizes under $50 are not paid and are redistributed [U: S17].
  - Effect: the money concentrates heavily at the top, and **coverage matters**. Joining late lowers the total score in proportion to the questions missed.
- **Minimum number of questions:** none published [U]. In practice, coverage scales the total score.
- **Number of winners:** not fixed in advance [V: S3 says nothing]. In Q2 2025, 19 bots won money [V: S7] out of 54 bot makers [V: S6].

### 4.3 Payout method and timing

- **Method:** bank transfer via Ramp, in USD or local currency [V: S4].
- **Timing:** after every question in the season resolves, then the survey (0 to 2 weeks), survey completion (0 to 4 weeks), internal processing and interviews (0 to 2 weeks), then a Ramp email [V: S4].
  - Summer 2026 and MiniBench prizes were targeted for October/November 2026 [V: S2, S3].
  - Spring 2026 prizes were targeted for June/July 2026 [V: S10].
  - **Inference:** Fall 2026 prizes would be paid around February to April 2027 [U].
- **Taxes and withholding:** not stated for FutureEval [V: S4 is silent]. Assume the prize is taxable income to the recipient, that no withholding is promised, and that a W-9 or W-8BEN may be required [U, by analogy with S15 and S16].

### 4.4 Published past results

**Q2 2025** ($30k pool, 54 bot makers, 348 questions) [V: S6, S7]

| Placing | Bot | Prize |
|---|---|---|
| 1st | Panshul42 | $7,550 |
| 2nd | pgodzinai | $4,563 |
| 3rd | CumulativeBot | $3,270 |
| The other 16 winners combined | | $14,617 (about $914 each on average) |

- Top 3 took 51% of the pool.
- 19 of 54 bot makers (35%) won anything, so about 65% won $0.

**Spring 2026** ($50k pool) [V: S11]
- There were 111 external bots.
- The top 5 were GreeneiBot2, Preseen-Atlas, SynapseSeer, manticAI and Preseen-Chestnut.
- The best simple single-prompt baseline (Metaculus's own GPT-5.1 bot) placed 18th of 173.
- No Metaculus in-house bot reached the top 10, the first time this has happened. Agentic research setups now beat simple templates.
- Per-bot dollar figures for Spring 2026 and Fall 2025 were not found [U].

**Fall 2025** [V: S9]: 29 of the 39 survey respondents were prize winners. That is a self-selected group, so it gives no win rate.

### 4.5 Realistic expected value for a new, average bot [U: estimate]

| Scenario | Placing | Prize per season |
|---|---|---|
| Median or average bot | Peer score about 0 | **$0** |
| Template bot on a frontier model with good research | Roughly 15th to 30th of about 110 | About $200 to $1,000 (in line with the Q2 2025 tail) |
| Fall 2026, joining with about one third of questions missed | Coverage loss shrinks the total score; squaring shrinks the share further | About 0.45x of the full-season figure (0.67 squared). Expect $0 to $300 |
| MiniBench, an average bot | | About $0. A good bot might take $20 to $100 per round, but the $50 minimum may cancel small takes |

**Probability-weighted EV for AmberOne AI's first full season:** about **$100 to $400**, with a median of $0.

> **POTENTIAL INCOME, NOT REVENUE.** None of the figures above is guaranteed or should be booked as revenue or used in forecasts of income. The only certain financial effect is the running cost in section 6.

---

## 5. Dates

| Event | Date | Status |
|---|---|---|
| Summer 2026 questions mostly resolved | 2026-09-15 (late cut-off 2026-09-30) | [V: S2, S3] |
| Fall MiniBench warm-up start | 2026-09-21 00:00 UTC | [V: S2, S3] |
| Fall 2026 questions start opening | 2026-09-28 (first 1 to 2 weeks slow) | [V: S2, S3] |
| Registration / entry deadline | No separate registration deadline. Join any time until questions stop opening "a few weeks before January 1, 2027" | [V: S2, S3] |
| Today | 2026-10-22 (about 3.5 weeks into the season) | |
| Forecast window per question | Each question has its own scheduled close time from the API (`scheduled_close_time`). Only the last forecast before close counts, one per question in bot tournaments | [V: S4, S8] |
| Summer 2026 and MiniBench payout | Targeted for October/November 2026 | [V: S2, S3] |
| Fall 2026 last questions open | About mid-December 2026 | [U, inferred from "a few weeks before Jan 1"] |
| Fall 2026 payout | About February to April 2027 | [U] |
| Spring 2027 season | Probably opens early January 2027. Spring 2026 opened 2026-01-07 | [U, by pattern from S11] |

---

## 6. Technical plan

### 6.1 What the bot must do

- **Accounts:**
  - The owner creates a human account.
  - Then Settings, "My Forecasting Bots", "Create Bot", and copy the API key. The first bot is primary [V: S4].
  - The key is used as `Authorization: Token <METACULUS_TOKEN>` [V: S8].
- **Endpoints**, all under `https://www.metaculus.com/api` [V: S8]:

| Purpose | Request |
|---|---|
| List open questions | `GET /posts/?tournaments=<id>&statuses=open&forecast_type=binary,multiple_choice,numeric,discrete&include_description=true` (paginated) |
| Question detail | `GET /posts/{post_id}/` |
| Post a forecast | `POST /questions/forecast/` with body `[{"question": <id>, "source": "api", ...payload}]`. Binary takes a probability, multiple choice takes per-option probabilities, numeric and discrete take a 201-point CDF |
| Post a comment (required) | `POST /comments/create/` with `{"text", "parent": null, "included_forecast": true, "is_private": true, "on_post": <post_id>}` |

- **Rate limits:**
  - The only published figure is 8 calls per 10 seconds on `/api/comments/{id}/` [V: S3, S4].
  - The general API rate limits are undocumented. Over-limit requests return 429 [U: unofficial mirror S18].
  - Google models on donated credits share about 150 requests per minute across all participants [V: S3, S4].
  - Plan for about 1 request per second, with backoff.
- **Cloudflare:** if Cloudflare blocks an account-level action, the bot must not look for a workaround [V: S4].

### 6.2 Template, LLMs and credits

- **Template:** not mandatory, but the recommended starting point is `github.com/Metaculus/metac-bot-template` [V: S3, S8].
  - It is Python 3.11 with Poetry and the `forecasting-tools` package. Fall 2026 requires version 0.3.0 [V: S3].
  - It also ships `main_with_no_framework.py`, which needs few dependencies [V: S8].
  - It runs on GitHub Actions every 20 minutes for the tournament and MiniBench, and skips questions it has already forecast [V: S8].
  - An open-source agentic alternative, `No-Stream/metaculus-bot` (nostreambot), was the top open-source bot in Spring 2026, placing 11th [V: S3, S11].
- **LLM use:** allowed and expected. Bots may use any resource generally available to human forecasters, including public forecasts from other platforms [V: S4].
- **Credits:**
  - Donated by Anthropic, Google and OpenAI through OpenRouter, for selected applicants. Apply via the participation form, and reapply each season [V: S3, S4].
  - **Fall 2026 experiment:** about $100 to start, plus performance grants after above-average MiniBench results. Only the first MiniBench entered is evaluated, so the bot should not enter MiniBench before it is ready [V: S4].
  - AskNews search is free for registered bot makers: 1k calls a month and 4k per tournament [V: S4].
  - The `:online` suffix must use native search. Exa search is not covered by the credits [V: S4].

### 6.3 Reusing AmberOne code

This repo already has a TypeScript provider-fallback chain with the Anthropic SDK in `src/lib/ai/text-chain.ts`, `src/lib/ai/agent-chain.ts` and `src/lib/ai/image-chain.ts` [V: local repo].

**Recommendation: do not port this to TypeScript for the first season.**
- Fork the official Python template into a separate repository, called for example `amberone-futureeval-bot`.
- Run it on GitHub Actions. The template already handles CDF building, multiple-choice normalisation and comment posting, which is where most of the bugs would be.
- The retry and fallback ideas in `text-chain.ts` (retry on 429 and 5xx, fall back between providers) can be copied as a pattern.

Planned improvements, based on what won in 2026 [V: S1, S11]:
- a frontier model (GPT-5.x or a Claude/Gemini equivalent);
- research from several sources (AskNews plus one more);
- aggregating 3 to 5 runs;
- calibration, and caps on extreme probabilities.

### 6.4 Effort and running cost [U: estimates]

**Build**

| Work | Effort |
|---|---|
| Fork, add secrets, run the test workflow against the `bot-testing-area` tournament, fill in the form, go live | About 0.5 to 1 day |
| Improvements (two research sources, aggregation, calibration and caps, cost logging) | About 3 to 5 days |
| Ongoing upkeep (dependency updates each season, survey) | About 1 to 2 hours a month |

**Volume:** about 100 main-season questions a month (350 over about 3.5 months) plus about 130 MiniBench questions a month. That is about 230 questions a month.

**Cost per question:**
- 3 to 5 frontier-model calls at about 3k to 8k input and about 1.5k output tokens each, plus 2 to 4 search calls.
- Total: about $0.10 to $0.80 per question, depending on the model.

**Monthly cost**

| Item | Cost |
|---|---|
| LLM | About $25 to $185 a month at list prices. About $0 if credits are granted and suffice (the about-$100 initial grant would cover roughly 1 to 4 weeks) |
| Search | AskNews free. Exa or Perplexity, if added, about $5 to $20 a month |
| Hosting | GitHub Actions. Free on a public repo; a private repo stays within the free minutes at about 1 to 2 minutes per 20-minute run (about 2,000 to 4,000 minutes a month), which may exceed the 2,000 free private minutes and cost about $0 to $16 a month at $0.008 per minute |
| **Total** | **About $0 to $60 a month with credits, or $50 to $250 a month without.** Proposed cap: $75 a month |

---

## 7. What the owner must do and approve

**The owner must do these personally. Amber must not do them.**
1. **Confirm the facts.**
   - AmberOne AI's headcount: founders, employees and contractors. This decides whether the bot is commercial.
   - The owner's country of residence, and that it appears on Ramp's supported-countries list.
2. **Read in a browser and accept:**
   - the Metaculus Terms of Use;
   - the Tournament Rules;
   - the FutureEval participation page.
   These were blocked to automated reading, so the age, licence and tax clauses below are unverified until the owner reads them.
3. **Create the Metaculus human account** with the owner's own email, under the owner's name. One account per person.
4. **Create the bot account** under Settings, "My Forecasting Bots". Choose a bot username, for example "AmberOneBot". Copy the API token. The owner stores the token as a GitHub Actions secret, or approves Amber storing it. It must never be committed.
5. **Fill in the participation form**, first section (3 required questions). Optionally apply there for LLM credits and AskNews access.
6. **Approve spending:**
   - an LLM and search budget of at most $75 a month, on a card or OpenRouter top-up the owner controls;
   - optionally GitHub Actions minutes if the repo is private.
7. **Decide on open-sourcing.** Required if AmberOne AI is commercial. It also earns larger credit grants.
8. **Later, if any prize is won:**
   - complete the season survey (required);
   - attend a code-review interview if asked;
   - identify yourself;
   - set up the Ramp payout;
   - complete any tax form (W-9 or W-8BEN);
   - declare the prize as income.
9. **Commit not to interfere:**
   - no manual edits;
   - no reruns because a forecast looks wrong;
   - no copy-pasting forecasts;
   - no using a personal view on a question.

**Amber may do these after approval:**
- fork the template;
- write the improvements;
- run the test workflow on `bot-testing-area`;
- monitor costs;
- prepare the survey answers for the owner to submit.

Amber must not send Metaculus unnecessary AI-written emails or messages [V: S4].

---

## 8. Risks and obligations

### Rules that bind the entrant [V: S4]
- No human-in-the-loop on forecasts:
  - The owner's personal forecast must not influence the bot.
  - No previewing a forecast and then changing it.
  - No reruns because the owner dislikes a forecast.
  - No copy-pasting.
  - A human may trigger the bot manually, but the bot must post directly through the API.
- Do not create markets or questions elsewhere to help the bot.
- Avoid testing on open or upcoming tournament questions.

### Disclosure
- Comments must be accurate. They are private until a question closes, then become public [V: S3, S4].
- To win, provide the code or a description, and accept inspection [V: S4].
- Prompts and architecture need not be published [V: S4].

### Disqualification causes
- Sufficient suspicion of a rule breach [V: S4].
- Undeclared multiple bots or accounts [V: S4].
- Not completing the survey after adequate notice [V: S3].
- Under the general rules, entering more than once voids all entries [U: S13].

### IP, publicity and data
- Bots appear on public leaderboards and may be named in Metaculus's end-of-season analyses [V: S4].
- Bot comments become public [V: S4].
- The Terms of Use licence over user content, any publicity rights, and the data-use clauses could not be read (403) [U]. Assume Metaculus may republish forecasts and comments.
- Using Metaculus data commercially requires the Data Needs Form [V: S4].

### Money
- Guaranteed income is zero. Payout comes months later and depends on Ramp support in the owner's country [V: S4].
- The tax treatment is the recipient's problem [U].
- Credits are not guaranteed, and OpenAI credits ran short in Summer 2026 [V: S3, S10].
- The LLM bill can grow if the bot loops. Mitigation: a hard OpenRouter key limit and a per-run question cap.

### Technical
- Template or dependency changes each season (forecasting-tools 0.3.0 in Fall 2026) [V: S3].
- Shared Google rate limit [V: S4].
- Cloudflare blocks [V: S4].
- Numeric CDF validation errors [V: S8].

### Reputation
- A public leaderboard position under the AmberOne name could be poor. Simple bots now place mid-pack or lower [V: S11]. Mitigation: use a neutral bot username for the first season.
- Any appearance of gaming the rules or using undeclared multiple accounts would be public and damaging.

---

## 9. Sources

Each source was accessed on 2026-10-22. Each line says how it was read.

- S1. Metaculus Substack, "FutureEval: Metaculus's AI Forecasting Benchmark". Read directly. https://metaculus.substack.com/p/metaculus-futureeval-ai-forecasting-benchmark
- S2. EA Forum (Metaculus staff), "Announcing Fall 2026 FutureEval Bot Tournament". Read directly. https://forum.effectivealtruism.org/posts/hrJrsgMCwsdBuAqgQ/announcing-fall-2026-futureeval-bot-tournament
- S3. Metaculus, "Announcement of FutureEval Fall 2026". Read directly. https://www.metaculus.com/notebooks/45615/announcement-of-futureeval-fall-2026/
- S4. Metaculus, "FutureEval Resources Page" (rules and FAQ). Read directly. https://www.metaculus.com/notebooks/38928/futureeval-resources-page/
- S5. GlobeNewswire, "Metaculus Launches FutureEval to Track AI Forecasting Accuracy" (2026-02-18). Seen in search results. https://www.globenewswire.com/de/news-release/2026/02/18/3239902/0/en/Metaculus-Launches-FutureEval-to-Track-AI-Forecasting-Accuracy.html
- S6. EA Forum, "Q2 AI Benchmark Results: Pros Maintain Clear Lead". Seen in search results. https://forum.effectivealtruism.org/posts/F2stjK9wHSy3HPEC9/q2-ai-benchmark-results-pros-maintain-clear-lead
- S7. Metaculus, "Winners of Q2 2025 AI Benchmark Tournament". Read directly. https://www.metaculus.com/notebooks/39140/winners-of-q2-2025-ai-benchmark-tournament/
- S8. GitHub, Metaculus/metac-bot-template: README and `main_with_no_framework.py`. Read directly. https://github.com/Metaculus/metac-bot-template
- S9. EA Forum, "FutureEval Forecasting Bot-Maker Survey: What Winners Did". Read directly. https://forum.effectivealtruism.org/posts/CauF6PstTHK3goE2g/futureeval-forecasting-bot-maker-survey-what-winners-did
- S10. EA Forum, "Announcing Metaculus Summer 2026 FutureEval Bot Tournament". Read directly. https://forum.effectivealtruism.org/posts/ZfLAN557rGWACKtmc/announcing-metaculus-summer-2026-futureeval-bot-tournament
- S11. EA Forum, "Pros beat bots, but the gap is nearly gone" (Spring 2026 results). Read directly. Also Metaculus's "Spring 2026 FutureEval Analysis". https://forum.effectivealtruism.org/posts/iJ3qBDwpWCfNy9ZGd/pros-beat-bots-but-the-gap-is-nearly-gone and https://www.metaculus.com/notebooks/45373/spring-2026-futureeval-analysis/
- S12. Metaculus, "Introducing simpler, fairer tournament scores". Search summary only (403). https://www.metaculus.com/questions/21883/introducing-simpler-fairer-tournament-scores/
- S13. Metaculus Tournament Rules. Search snippet only (403). https://www.metaculus.com/tournament-rules/
- S14. Metaculus Terms of Use. Search snippet only (403). https://www.metaculus.com/terms-of-use/
- S15. Metaculus, Bridgewater Open contest rules. Search snippet only. https://www.metaculus.com/bridgewater/contest-rules/
- S16. Metaculus, RAND x Metaculus Policy Challenge 2025 rules. Search snippet only. https://www.metaculus.com/rand/contest-rules/
- S17. PredictGeek, "Metaculus Review 2026". Third party, unverified. https://predictgeek.com/prediction-markets/metaculus/
- S18. mintlify.wiki mirror of the Metaculus API docs, rate limits. Unofficial, unverified. https://mintlify.wiki/Metaculus/metaculus/api/rate-limits
- Also relevant but blocked (403) to automated reading:
  - https://www.metaculus.com/futureeval/participate/
  - https://www.metaculus.com/tournament/fall-futureeval-2026/
  - https://www.metaculus.com/help/scores-faq/
  - https://www.metaculus.com/aib/
