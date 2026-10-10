# Buyer evidence: offers 1 to 5

Sprint: ten small service offers, 2026-10-10. Researcher: buyer-evidence agent (offers 1 to 5). Status: COMPLETE first full pass (2026-10-10, about 17:20Z by the container clock). All five offer sections and the summary table are filled; all evidence is search-snippet level (see below).

Method: WebSearch (standard mode; domain-restricted where possible so the snippet comes from the vendor's or marketplace's own page) to find sources; WebFetch was meant to verify each fact. Vendor marketing statistics are labelled as vendor claims. Prices are as shown on the date retrieved (2026-10-10) and may change.

**Access limitation (important for how to read this file).** In this session every page fetch was blocked by the environment's network policy: WebFetch failed with `getaddrinfo ENOTFOUND` on every host tried (smith.ai, www.ruby.com, www.podium.com, getjobber.com, www.housecallpro.com, en.wikipedia.org, www.sec.gov), and a direct HTTPS request to www.housecallpro.com was refused by the outbound proxy (`CONNECT tunnel failed, response 403`); reddit.com, capterra.com, g2.com, fiverr.com and wikipedia.org were also unreachable. Only the WebSearch tool worked, and it refuses reddit.com as a search domain ("not accessible to our user agent"), so no Reddit thread could be read at all. Therefore **no fact in this file is 'verified (fetched)'**. Every fact is a search snippet and is labelled with its source type:
- **(snippet, primary)**: search snippet from a search restricted to the vendor's or marketplace's own domain (the page itself was indexed, but not fetched by me).
- **(snippet, third-party)**: search snippet from a review/comparison site or blog repeating the number.
Treat all numbers as leads to re-check with a browser before quoting them publicly. The session's shared web-search budget (200 searches per turn across all agents) ran out at the end of this pass, so planned second-search confirmations of the Chaser and Paidnice prices were not done. To make them verifiable, the environment's network access must allow these hosts (cloud environment settings, Network access). Quotation marks around a phrase mean the phrase appeared in the search snippet, not that I saw it on the live page.

## Offer 1: Missed-call and website-inquiry follow-up for home-service businesses

Section status: complete. All items are search snippets; see the access limitation above.

### 1. Buyer
- **Who pays:** the owner-operator of a home-service business (plumbing, HVAC, electrical, roofing, cleaning, landscaping) with 1 to 20 staff. In the smallest shops the owner is also the person missing the calls ("on a job", "running a mower"). In 5 to 20 staff shops an office manager or CSR may own the phone, but the owner signs off on spend.
- **Who uses the output:** the owner or office manager, who reviews the open-lead list and sends the drafted replies from their own phone or email.
- **Typical profile in the evidence:** "small residential plumber (owner plus two workers)" who tried his wife, Google Voice and a part-time receptionist (PlumbingZone thread below).

### 2. Painful problem, in buyers' words (search snippets, not fetched)
- PlumbingZone, "Anyone else losing jobs to missed calls?" (thread about 240 days old, i.e. early 2026): owner plus two workers reported **"47 missed calls last month. Maybe 5 left voicemail"**, had tried his wife, Google Voice and a part-time receptionist, and estimated **"$3-4K/month in lost work"**. A later reply broke the 47 down as **"40 of them were telemarketers ... 5 were customers that have used my services before and left a message. 2 were price shopping."** A reply recommended an auto-text ("on a job, will call back within 2 hours"); another said "people dont like the AI answering service, but it saves me time". https://www.plumbingzone.com/threads/anyone-else-losing-jobs-to-missed-calls.91027/
- PlumbingZone, "Anyone have any advice for hiring an answering service?": a plumber's answering service that also schedules jobs "costs around $450 a month"; "answering services won't sell a job or schmooze a potential client into being a client"; another owner pays "a retired woman $250 a month to answer phones and schedule work from her home"; another pays "$360 every two weeks" for someone answering around the clock. (Posts roughly 2008 to 2018.) https://www.plumbingzone.com/threads/anyone-have-any-advice-for-hiring-an-answering-service.31658/
- ElectricianTalk (phone-answering threads): an answering service "got very expensive since we were being charged per call" and left "hours of messages to sort through"; other posters pay about $100 and about $400 a month. https://www.electriciantalk.com/threads/answering-the-phone.286286/ , https://www.electriciantalk.com/threads/have-you-used-an-answering-service.121857/ (which quote sits in which of these two threads was not confirmed)
- HVAC-Talk: "I figured at $.50 for each incoming and $.50 for each outgoing phone call - 1 service call a month gained from having a live operator was more than covering that expense." https://hvac-talk.com/vbb/threads/149309-why-don-t-contractors-answer-their-phones (thread attribution likely but not confirmed)
- LawnSite, "When a number calls, but doesn't leave a message, do you call them back?": solo operator answers "if I can hear or feel (vibration) it ring and I'm not running a mower or trimmer". https://www.lawnsite.com/threads/when-a-number-calls-but-doesnt-leave-a-mesage-do-you-call-them-back.364398/
- Customer side (titles only): ContractorTalk "What's up with not returning calls to potential customers?" https://www.contractortalk.com/threads/whats-up-with-not-returning-calls-to-potential-customers.148541/ ; HVAC-Talk "why don't contractors answer their phones".
- **Cost stated by a buyer:** one owner's own estimate of $3,000 to $4,000 a month in lost work (self-reported, and the same thread shows most of his missed calls were spam).

### 3. Existing alternatives (prices exactly as the search snippet showed them; retrieved 2026-10-10)
| Alternative | What it does | Published price (as snippet shows) | URL | Source type |
|---|---|---|---|---|
| Smith.ai AI Receptionist | AI answers calls, live-agent backup | Free $0/mo (25 calls, each extra call $3.00); Pro $150/mo; Enterprise $500/mo; month-to-month | https://smith.ai/pricing/ai-receptionist | snippet, primary (snippet notes the page's table and structured data disagree on some tiers) |
| Smith.ai Virtual Receptionists | Live receptionists | Starter "30 calls for $300 / month", overage "$11.50/call"; 10% off for 12 months | https://smith.ai/pricing/receptionists | snippet, primary (that page's index snapshot is old; a Smith.ai blog says $292.50) |
| Ruby | Live virtual receptionists | 50 / 100 / 200 / 500 minutes at $250 / $395 / $720 / $1,725 per month | https://www.ruby.com/plans-and-pricing/ | snippet, primary (older Ruby pages show a $245 entry plan) |
| Jobber Receptionist (AI) | AI answers calls and texts inside Jobber | add-on "$29 per month", 30 conversations, "$0.79 per additional conversation"; included on the Plus plan | https://help.getjobber.com/hc/en-us/articles/25315927533847-Receptionist-powered-by-Jobber-AI | snippet, primary (another Jobber help page says 100 conversations) |
| Housecall Pro CSR AI | AI call and chat answering | "CSR AI sold separately", no price shown; base plans Basic $79/mo, Essentials $189/mo, MAX $329/mo on monthly billing ($59 / $149 / $299 annual) | https://www.housecallpro.com/features/ai-team/csr-ai/ , https://www.housecallpro.com/pricing/ | snippet, primary |
| Podium | Text inbox, webchat, reviews, AI lead response | Essentials $289/month, Standard $449/month, Professional $649/month | https://www.podium.com/pricing/ (corrected by the lead, 17:31Z: the search result suggests these tiers come from this page; the home-services page shows no fixed prices) | snippet, primary (a Podium article says "starts at $399/month") |
| Hatch (Yelp) | AI agents answer web-form and lead-source inquiries, follow up by text, email and voice | "Platform fee plus usage", plans annual, paid monthly per location; no dollar figures | https://www.usehatchapp.com/pricing | snippet, primary; a third-party site reports $700 to $1,500/month plus usage (contractortoolstack.com, unverified) |
| CallRail | Call and form tracking, missed-call visibility; Voice Assist AI answering | call tracking from $50/month; form tracking from the $95/month "Complete" tier; Voice Assist "$95/month with 50 included calls, then $1 per additional call" | https://www.callrail.com/pricing | snippet, primary (page snapshot marked old; another CallRail page says $55/month) |
| Fiverr GoHighLevel "missed call text back" setups | Freelancer builds an automated text-back workflow in the client's GoHighLevel account | about $10 to $100; e.g. a $25 basic package that includes "a missed call text-back workflow" | https://www.fiverr.com/marg_hudzn/do-gohighlevel-website-gohighlevel-landing-page-sales-funnel-workflow-a2p-expert | snippet, primary; review counts 4 to 32 on the gigs seen |
| DIY | Own cell, voicemail, callback windows, family member, part-time receptionist | $0 to about $250/month (forum anecdotes) | threads above | snippet |

### 4. Evidence buyers spend money on this
#### Verified facts
None verified by fetch. Every page fetch was blocked in this session (see the access limitation at the top). The list below is search-snippet evidence only.
#### Spend signals from search snippets (not verified)
1. **Hatch (AI lead follow-up for services businesses) was bought by Yelp.** Yelp's announcement: about "$270 million in cash with an additional $30 million of employee retention"; Hatch "had achieved approximately $25 million in annual recurring revenue, representing a year-over-year ARR growth rate of 70%" as of November 2025; closed February 2, 2026. Yelp's Q2 2026 shareholder letter: "Hatch annual run rate revenue grew 59% year over year to $35 million in June." Yelp's Q2 2026 10-Q: Hatch had "annual run rate revenue of approximately $35 million in June 2026", up from $34.0 million in March 2026; the letter notes the growth rate rests on Hatch's pre-acquisition, unaudited records and describes "an adjustment period in the quarter". https://www.yelp-ir.com/news/press-releases/news-release-details/2026/Yelp-Accelerates-Strategy-with-Acquisition-of-AI-Lead-Management-Platform-Hatch/default.aspx , https://www.sec.gov/Archives/edgar/data/0001345016/000134501626000059/yelpq22026ex992lettertos.htm , https://www.sec.gov/Archives/edgar/data/0001345016/000134501626000066/yelp-20260630.htm (snippet, primary: Yelp IR and SEC filings; the $35M figure came back in two separate searches)
2. **Smith.ai** sells call answering at AI $150/mo and live from $300/mo for 30 calls; G2 seller page 4.8 stars from 115 reviews across three products (Virtual Receptionists 4.9 from 73). https://smith.ai/pricing/ai-receptionist , https://www.g2.com/sellers/smith-ai (snippet, primary)
3. **Ruby** sells 50 receptionist minutes for $250/mo up to 500 for $1,725/mo; G2 3.8 (12 reviews), Capterra 3.9 (11); Ruby claims more than 15,000 customers (vendor claim). https://www.ruby.com/plans-and-pricing/ , https://www.g2.com/products/ruby-receptionists/reviews (snippet, primary)
4. **Jobber** (Capterra 4.6 from 1,486 reviews) sells an AI Receptionist add-on at $29/mo. https://www.capterra.com/p/127994/Jobber/ (snippet, primary)
5. **Podium** lists pricing from $289/mo (source corrected to https://www.podium.com/pricing/ ; the home-services page shows no fixed prices); a G2 comparison snippet shows Podium 4.5 from 2,108 reviews. https://www.g2.com/products/hatchify-hatch/reviews (snippet, primary)
6. **Hatch reviews:** G2 4.3 from 77 reviews; Capterra 3.5 from 40 reviews (complaints about one-year contracts, overage charges and billing). https://www.capterra.com/p/174914/Hatch/ (snippet, primary)
7. **Owners say they pay for answering:** about $450/mo (plumber), $250/mo (retired woman answering), about $100 and $400/mo (electricians), per-call fees (HVAC). Forum threads in section 2 (snippet, primary forums; mostly old posts).
8. **Fiverr:** missed-call text-back workflow setups sold for about $25 to $100, 4 to 32 reviews per gig. (snippet, primary)
9. **Upwork job posts** from home-service and remodeling companies hire appointment setters to call new leads within minutes of opt-in and follow up daily for 5 to 7 days. https://www.upwork.com/freelance-jobs/apply/Appointment-Setter_~022052476457168795756/ (snippet, primary)

### 5. Guesses
- (Guess) Paid demand for "never lose a lead" is strong, but it is being bundled into $29 to $300/month tools that act in real time. A weekly, owner-sent list is slower than every paid alternative found; its only unique angle is the one-time audit of leads already lost, plus drafts the owner can send today.
- (Guess) For a 1 to 5 person shop the number of genuinely open leads per month is small (the PlumbingZone owner's 47 missed calls held about 7 real ones). The pilot report must filter spam first or it will look padded.
- (Guess) Website-form inquiries are probably the more exportable half (form tools and Jobber/Housecall Pro requests export to CSV); personal-cell call logs are often not exportable (iPhone has no native export; Google Voice, Google Fi and Quo/OpenPhone do export, per their help pages: https://support.google.com/voice/answer/10130510 , https://support.quo.com/core-concepts/administration/export ).
- Independent research (context, not home-services specific, 2011): HBR, "The Short Life of Online Sales Leads" (audit of 2,241 US companies): firms that contacted a web lead within an hour were nearly seven times as likely to qualify it as firms that waited longer; 37% answered a test web lead within an hour, 23% never responded, average response 42 hours. https://hbr.org/2011/03/the-short-life-of-online-sales-leads (snippet, primary; paywalled). This supports the problem and also the 'a weekly list is too slow' objection.
- Vendor claims, not facts: "85% of callers who reach voicemail never call back" and "80% of callers sent to voicemail won't leave a message" (repeated by answering-service vendors, attributed to Invoca/Forbes, secondhand and not checked); "every missed HVAC call is a lost job, often $200+" (vendor, uncited); a LinkedIn model of $129,600 a year lost (assumption-driven); ServiceTitan-style "up to $X million" claims belong to Offer 2.

### 6. Test price hypothesis (one-time pilot: 30-day audit, drafts, two weekly refreshes)
- **Hypothesis: $199 one-time** (test band $149 to $249).
- **Basis:** below one month of the cheapest live answering found ($250/mo Ruby 50 minutes; $300/mo Smith.ai 30 calls; owners' $250 to $450/mo anecdotes); about one month of Podium Essentials ($289); above Fiverr text-back setups ($25 to $100), which deliver automation, not a reviewed list of lost leads; small next to the owner-stated $3,000 to $4,000 a month (self-reported).
- **Strength of basis: weak to moderate.** All comparables are subscriptions or cheap setups; no one-time "missed-lead audit" product with a public price was found.

### 7. Main objections a buyer would raise
- "Most of my missed calls are spam or price shoppers" (40 of 47 in the PlumbingZone thread).
- "Speed is what wins; a weekly list is too late" (forum: first to respond wins). This is the strongest objection to the pilot's design.
- "Jobber/Housecall Pro/my answering service already handles this" ($29/mo AI receptionist; $250 to $450/mo answering).
- "My calls ring my personal cell; I can't export a call log" (data access and time to export).
- "I don't want to hand my customers' phone numbers to someone else" (trust, privacy).
- "Customers don't like AI or canned replies" (forum), so drafts must read as the owner wrote them.

### 8. Where these buyers gather online (not joined, not posted, not contacted)
- Trade forums seen in the evidence: PlumbingZone (plumbingzone.com), ContractorTalk (contractortalk.com), HVAC-Talk (hvac-talk.com), ElectricianTalk (electriciantalk.com), LawnSite (lawnsite.com).
- Vendor communities: Jobber Community (community.getjobber.com; boards for Sales & Marketing, Profit & Finance, Construction & Home Improvement, Cleaning & Property Maintenance, Service-Based Skilled Trades; guidelines ask members to avoid spam or solicitation).
- Facebook groups named by third-party lists (sizes from those lists, may be stale): Service Business Growth (about 3K), Trade Service Companies Owners Insight (about 2.2K, private, owners only), HVAC/R Owners and Managers Advice Group (about 2,025), Pro Talks for the Trades (about 3K, run by Housecall Pro), Home Service Super Summit (about 1.8K). Sources: https://www.servicefusion.com/blog/top-fb-groups-for-commercial-service-businesses , https://hookagency.com/blog/best-hvac-facebook-groups/ , https://www.housecallpro.com/resources/online-plumbing-forums-groups-blogs-more/
- Reddit (reddit.com itself is unreachable from this session's search tool): third-party trackers put r/sweatystartup at about 208K members (https://thehiveindex.com/communities/sweaty-startup/) and r/HVAC at about 212K to 237K (GummySearch snapshots, tool closed 11/30/2025, so old: https://gummysearch.com/r/HVAC). Other candidates not checked: r/Plumbing, r/electricians, r/Roofing, r/lawncare, r/smallbusiness.
- Trade association member forums (snippet, primary): ACCA "Contractor Forum/Online Groups" under Member Services (https://www.acca.org/join); PHCC "Q-List" discussion forum for Quality Service Contractors members (https://www.phccweb.org/communities/); NARI online community on Tradewing (https://nari.org/membership/nari-online-community/). All are member-only. Not checked: NRCA, NALP, ARCSI (residential cleaning).

### 9. Evidence strength
- **Strict score under the rubric: 1** (nothing could be verified by fetching).
- **Provisional score if the snippets hold up on fetch: 4.** Many independent signs of paid demand (Yelp/Hatch SEC-reported revenue, five vendors' published prices, review counts, owners paying $100 to $450/month), but the money goes to real-time answering and automation, not to a one-time audit, so price fit for this pilot is unproven.

## Offer 2: Stale estimate follow-up tracking for contractors

Section status: complete. All items are search snippets; see the access limitation above.

### 1. Buyer
- **Who pays:** the owner of a contracting business that sends 10 or more estimates a month (remodelers, roofers, HVAC replacement, landscapers); in roofing and remodeling, sometimes a sales manager.
- **Who uses the output:** the owner or estimator who wrote the estimate, or an office/sales coordinator (the role that job posts below pay $10 to $16 an hour for).

### 2. Painful problem, in buyers' words (search snippets, not fetched)
- ContractorTalk, "Following up on quotes" and related threads (posts roughly 2010 to 2015): "I hear back from about 30-35% even after following up." / "I follow up twice and that's it." / A contractor who switched to emailed quotes: "People would just not reply and I would never hear a word from them. Basically I was trying to get out of actually selling the job and my close rate suffered terribly." https://www.contractortalk.com/threads/following-up-on-quotes.420325/ , https://www.contractortalk.com/threads/silence-after-giving-quotes.196530/ , https://www.contractortalk.com/threads/whats-your-bid-follow-up-technique.138160/ (which quote sits in which thread was not confirmed)
- ContractorTalk: a general contractor said only a small percentage of subs actually follow up, and the persistent ones won more work; a poster said a customer told him he was "the only one to do the follow up". (paraphrased in snippet)
- Jobber Community, "What's your process for following up on unscheduled quotes?": Jobber's built-in follow-up "lacks without any automations after that"; "a message that only says 'just checking in' doesn't give the customer much reason to reply"; another thread asks why prospects request a quote, ask several questions, then "completely disappear", and the poster worries about seeming pushy. https://community.getjobber.com/discussions/marketing-forum/what%E2%80%99s-your-process-for-following-up-on-unscheduled-quotes/2237
- Jobber Community (2025 to 2026 posts): a user asked whether Jobber shows which stale quotes are worth chasing first, or whether that remains a manual judgment based on age, value and notes (unanswered in the snippet); contractors describe building their own flows that re-contact people who did not approve a quote within 20 days, and a bot that flags quotes the client never opened and checks in weekly; another archives quotes after 10 days. https://community.getjobber.com/discussions/marketing-forum/what%E2%80%99s-your-process-for-following-up-on-unscheduled-quotes/2237 , https://community.getjobber.com/category/using-jobber/discussions/quoting (paraphrased in snippets). This is the closest buyer statement of the exact need Offer 2 fills: a prioritized list of which quiet quotes to chase.
- **Cost stated by buyers:** none found. Vendor claims only (see Guesses).

### 3. Existing alternatives (prices exactly as the search snippet showed them; retrieved 2026-10-10)
| Alternative | What it does | Published price (as snippet shows) | URL | Source type |
|---|---|---|---|---|
| Jobber | Automated quote follow-ups on a preset schedule (Connect); custom automations (Grow) | "Quote follow-ups are available Jobber's Connect Plan and up"; pricing page lists "Automate quote and invoice follow-ups" among Connect features (not in Core); Connect, 1 user: $139/month no commitment, $119 on a 1-year monthly commitment, $99 billed annually; Grow from $149/mo (annual billing) | https://help.getjobber.com/hc/en-us/articles/360049853114-Quoting-on-the-Grow-Plan , https://www.getjobber.com/pricing/ | snippet, primary (Connect price and feature came back in two separate searches) |
| Housecall Pro Pipeline | Estimate follow-up automations, up to three follow-ups, "Smart Recommendations" timing | current plan tier not stated in snippets; an old Housecall Pro Pipeline page (about 1,030 days old, on a bounces1.housecallpro.com mirror) listed it as a paid add-on: "Basic – $25, Essentials – $50, Max – $75, Max+ $100"; base plans $79 / $189 / $329 per month (monthly billing) | https://help.housecallpro.com/en/articles/6185127-getting-started-with-pipeline , https://bounces1.housecallpro.com/features/pipeline/ | snippet, primary (add-on price is dated) |
| ServiceTitan | Follow-up screen for unsold estimates; Marketing Pro SMS campaigns to unsold estimates | not public | https://help.servicetitan.com/docs/create-unsold-estimates-campaigns-using-sms | snippet, primary |
| Hatch (Yelp) | AI follow-up on leads and estimates by text, email, voice | custom, platform fee plus usage, annual | https://www.usehatchapp.com/pricing | snippet, primary; third-party $700 to $1,500/month (unverified) |
| JobNimbus (roofing CRM) | CRM, estimates, two-way texting | "JobNimbus Essentials starts at $299/month annually for a team" | https://www.jobnimbus.com/comparison/jobnimbus-vs-jobtread | snippet, primary (vendor comparison page) |
| FollowUp CRM (commercial subs) | Bid tracking and follow-up reminders | "customized pricing"; an old company blog cites "$55 per month, per user" basic plus a $1,000 setup, $75/user professional | https://www.followupcrm.com/pricing | snippet, primary (dated) |
| ProLine (roofing CRM) | Speed-to-lead, reminders, follow-ups | Capterra: "starting price US$497", free version available | https://www.capterra.com/p/10042941/ProLine/ | snippet, third-party listing |
| In-house coordinator | Calls and texts estimate recipients | job posts $10 to $16/hour (see section 4) | see section 4 | snippet |
| DIY | Calendar reminder, one or two calls, then stop | free | forum threads above | snippet |

### 4. Evidence buyers spend money on this
#### Verified facts
None verified by fetch (all fetches blocked; see the access limitation at the top).
#### Spend signals from search snippets (not verified)
1. **Jobber puts quote follow-ups behind its Connect plan** (from $99/mo annual), i.e. buyers pay a higher tier partly for this; Jobber has 1,486 Capterra reviews (4.6). (snippet, primary)
2. **Housecall Pro and ServiceTitan both ship dedicated unsold-estimate follow-up features** (Pipeline automations, which an old Housecall Pro page priced as a $25 to $100/month add-on by plan; follow-up screen and Marketing Pro SMS campaigns). ServiceTitan publishes a case study in which Fuller Electric says: "We've had an extra $40,000 worth of revenue ... We've definitely gotten our value out of that." (vendor case study) https://www.servicetitan.com/blog/increase-electrical-sales (snippet, primary; exact case-study URL not confirmed)
3. **Contractors pay staff to do this.** Job posts: Allied Roofing & Construction (NJ) inside sales and customer follow-up, "$10.00 - $15.00 per hour", remote (https://alliedroofingconstruction.discovered.ai/job-details/69946); DC Pines Roofing (Houston) part-time coordinator "$16/hr", appointment-setting or inside-sales experience in home services (https://apply.workable.com/dc-pines-roofing/jobs/view/22399C6CFF.md); ServiceTitan customer story: Above + Beyond, an Oklahoma business of about $20 million revenue, "assigned one person to take charge of following up on estimates that have not been closed"; "Hiring the coordinator led to $1 million in revenue from unsold estimates in 2024—and $1.2 million through the first half of 2025" (vendor case study, company's own claims; a much larger firm than Amber's target buyers) https://www.servicetitan.com/blog/success-story-above-beyond-field-pro . (snippets)
4. **Hatch / Yelp** (see Offer 1): an AI lead-management platform for services businesses reported at about $35 million annual run-rate revenue in June 2026 in Yelp's SEC filings. Hatch's own blog describes estimate follow-up campaigns as one of its most popular use cases and says it analyzed "163,000 HVAC two-day follow-up campaigns" (average response rate 60%, vendor data); Hatch case studies claim e.g. "15% more revenue from estimate follow-up" (Reliable Power Systems). https://www.usehatchapp.com/blog/hvac-estimate-follow-up-response-rates (snippet, primary; vendor claims)
5. **Roofing and commercial CRMs** sell follow-up as a core feature at $299/month (JobNimbus Essentials) or per-user pricing with setup fees (FollowUp CRM). (snippet, primary)

### 5. Guesses
- (Guess) Spend on estimate follow-up is real but almost always bundled inside a platform the contractor already pays for (Jobber, Housecall Pro, ServiceTitan, JobNimbus). The pilot competes with a toggle the buyer may already own; the value has to be the dollar-weighted list ("$84,000 waiting in 23 quiet estimates") and better-than-"just checking in" drafts.
- (Guess) The contractors who most need this are the ones who send quotes by email and do not use a platform with automations (spreadsheet or QuickBooks estimates), which also makes their export the messiest.
- Vendor claims, not facts: ServiceTitan says "some HVAC companies have seen their revenue jump by up to $3 million" by assigning unsold-estimate follow-up to a specific employee, and "as much as $1 million in a single year"; also that "only about half of all HVAC contractors consistently follow up on unsold estimates" (uncited). A vendor blog says 40 to 60% of estimates "just go quiet" (uncited).

### 6. Test price hypothesis (one-time pilot: four weekly lists with drafts)
- **Hypothesis: $249 for the 4-week pilot** (test band $199 to $399).
- **Basis:** roughly 4 hours a week of a $15/hour follow-up coordinator for 4 weeks (about $240, from the job posts above); about 2.5 months of Jobber Connect ($99/mo), the tier that adds automated quote follow-ups. The upper test ($399) is justified only if the first list shows a large dollar value waiting.
- **Strength of basis: weak.** Comparables are wages and bundled platform tiers; no standalone paid "estimate follow-up report" was found.

### 7. Main objections a buyer would raise
- "Jobber/Housecall Pro already sends quote follow-ups" (built in from Connect plan / Pipeline).
- "If they don't answer, they're not interested; I don't want to be pushy" (forum: "I follow up twice and that's it").
- "My estimates live in my head, a notebook or emailed PDFs" (export time and data access).
- "I'm busy enough" (some forum posters say they do not need the work).
- Trust: sharing customer names and quote values.

### 8. Where these buyers gather online (not joined, not posted, not contacted)
- ContractorTalk (contractortalk.com; many estimate follow-up threads), LawnSite (landscapers), HVAC-Talk. Roofing-specific forums not checked.
- Jobber Community (community.getjobber.com; Sales & Marketing board has quote follow-up threads; no-solicitation guideline).
- Facebook groups (third-party lists, see Offer 1), plus remodeler-focused groups not checked this session.
- Reddit (not checked, unreachable): r/Contractor, r/Roofing, r/HVAC, r/lawncare, r/sweatystartup.
- Associations: NARI online community on Tradewing (remodelers; member-only; https://nari.org/membership/nari-online-community/), ACCA online groups (HVAC; member-only). Not checked: NRCA (roofing), NALP (landscape).

### 9. Evidence strength
- **Strict score under the rubric: 1** (nothing verified by fetch).
- **Provisional score if snippets hold up: 3.** Paid demand is clear (platform tiers, dedicated staff, Hatch), but it is mostly bundled into software contractors already own, buyer-stated cost is absent, and forum culture leans toward "follow up twice and stop".

## Offer 3: Job-cost exception reports for small construction firms

Section status: complete. All items are search snippets; see the access limitation above.

### 1. Buyer
- **Who pays:** the owner of a small GC, remodeler or specialty sub with 3 to 30 active jobs; in firms with an in-house or outsourced bookkeeper, the owner still approves spend, and the bookkeeper may be the champion.
- **Who uses the output:** the owner (which jobs are bleeding), the project manager (percent complete), and the bookkeeper (fix miscoded costs, check duplicates). Amber only flags; the bookkeeper or owner decides and makes any entries.

### 2. Painful problem, in buyers' words (search snippets, not fetched)
- QuickBooks Community thread title: **"PROJECT COSTING DOES NOT WORK PERIOD. Again, INACCURATE reporting in ACCOUNTING software"** https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/project-costing-does-not-work-period-again-inaccurate-reporting/00/1319526
- QuickBooks Community (several threads, quotes not individually attributed): "all of a sudden my payroll costs are not accurately going to the right project, instead they are 'not specified'"; a business doing "a bi-weekly adjusting journal entry to coincide with our payroll runs" to move labor to the right jobs; "if one of my guys works 3 hours on a job, the Job Profitability Report AND the Project screen where costs are shown are pulling in his entire paycheck amount for the week"; "when I run a job cost estimate vs actuals detail ... it does not pull all of the expenses for this job". Related titles: "Job Profitability Report still not right" https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/job-profitability-report-still-not-right/00/1095737 ; "Customer Expenses not showing up in Job Cost Report" https://quickbooks.intuit.com/learn-support/en-us/other-questions/customer-expenses-not-showing-up-in-job-cost-report/00/1135626 ; "Job cost : invoice and payment enter to the wrong job#" https://quickbooks.intuit.com/learn-support/en-us/payments/job-cost-invoice-and-payment-enter-to-the-wrong-job/00/730023
- ContractorTalk, "Need Recommendation for Job Costing Software": a contractor wants to "look at project estimates vs actuals over time which will help me refine my quotes for similar jobs"; another says Knowify "runs about $99/month but the job costing piece is really well done". https://www.contractortalk.com/threads/need-recommendation-for-job-costing-software.457514/
- ContractorTalk (job-costing threads, attribution not confirmed): "It is possible to do job costing in QuickBooks online, but it hasn't been easy for us." / "Doesn't matter if job is cost plus or a firm price deal, you still should be very carefully and accurately tracking your job cost so you can tell exactly how you came out financially -vs- what you estimated." https://www.contractortalk.com/threads/time-tracking-and-job-costing.446562/ , https://www.contractortalk.com/threads/quickbooks-online-apps.379377/
- **Cost stated:** none by a buyer. Vendor survey: QuickBooks/QuickBooks Time survey of 600+ construction owners and finance people says "1 in 4 construction companies would go out of business if they made just two or three inaccurate estimates" (vendor survey; sample described inconsistently as 600+ or 666). https://quickbooks.intuit.com/time-tracking/resources/construction-job-costing-survey/

### 3. Existing alternatives (prices exactly as the search snippet showed them; retrieved 2026-10-10)
| Alternative | What it does | Published price (as snippet shows) | URL | Source type |
|---|---|---|---|---|
| QuickBooks Online Plus / Advanced | Project profitability and job costing; Advanced adds "project estimates and track your estimate versus actuals" | Plus "$140 / $70/mo, 50% off for 3 months"; Advanced "$340 / $170/mo" | https://quickbooks.intuit.com/pricing/ | snippet, primary |
| Knowify | Trade-contractor ops; Advanced tier adds job costing and "real-time WIP" | Core $99/mo annual ($149 monthly); Advanced $329/mo annual ($399 monthly), 10 users | https://knowify.com/pricing/ | snippet, primary |
| JobTread | Estimating, budgets, job costing against budget in real time | "$199 per month for the base plan, which includes one internal user"; extra users $20/mo; annual saves 20% | https://www.jobtread.com/ | snippet, primary |
| Buildertrend | Construction PM with job costing and budgets | custom quote ("personalized for each business") | https://buildertrend.com/pricing/ | snippet, primary |
| Adaptive | AI construction accounting | about $575/month for firms up to $5M revenue (third-party; GetApp shows $1,000 and an older $499) | https://www.getapp.com/construction-software/a/adaptive-2/ | snippet, third-party |
| Catalyst CPA (California) | Construction bookkeeping incl. WIP, retainage, per-job profit | "$500–$1,200/month depending on job volume and number of active projects" | https://catalyst-cpa.com/construction-bookkeeping/ | snippet, primary (vendor page) |
| Upwork construction bookkeepers | Freelance job costing, WIP, AIA billing | a fixed-price post "Highly experienced construction bookkeeper", $1,200, GC with about 75 to 100 transactions a month (individual post URL not captured); Upwork guidance: setup $200-$600/project, cleanup and migration $300-$1,000/project | https://www.upwork.com/hire/intuit-quickbooks-contractors/ | snippet, primary |
| Fiverr construction bookkeeping | Buildertrend/Knowify/Foundation sync with QBO, job costing | gigs "From $5 to From $350"; e.g. $40 construction bookkeeping gig | https://www.fiverr.com/shirley_eds/do-construction-bookkeeping-in-buildertrend-foundation-knowify-sync-with-qbo | snippet, primary |
| DIY | Owner spreadsheets, QuickBooks reports, journal-entry fixes | staff time | threads above | snippet |

### 4. Evidence buyers spend money on this
#### Verified facts
None verified by fetch (all fetches blocked; see the access limitation at the top).
#### Spend signals from search snippets (not verified)
1. **Software tiers priced for job costing:** QuickBooks Online Advanced ($340/mo list) is the tier with estimate vs actuals; Knowify's job-costing tier is $329/mo annual; JobTread $199/mo; Adaptive about $575/mo (third-party). (snippets, mostly primary)
2. **Outsourced construction bookkeeping with job costing and WIP is sold at $500 to $1,200 a month** (Catalyst CPA's published range). (snippet, primary vendor page)
3. **Upwork:** a post titled "Highly experienced construction bookkeeper", "Fixed-price ‐ Posted 1 day ago" (relative date at indexing; exact date not confirmed), $1,200, intermediate level, bookkeeping for a general contracting firm with roughly 75 to 100 transactions a month; on the same results page an hourly part-time post to support weekly job costing and monthly bookkeeping. Upwork's own guidance prices QuickBooks setup at $200 to $600 and cleanup at $300 to $1,000 per project. https://www.upwork.com/o/jobs/browse/skill/quickbooks/ (snippet, primary; the individual post URL was not captured)
4. **Fiverr:** construction-specific bookkeeping gigs (Buildertrend, Knowify, Foundation, JobNimbus, AccuLynx) from $40; one with 20 reviews at 5.0. (snippet, primary)
5. **Catch-up / cleanup is a paid one-time service:** one CPA firm's guide prices 1 to 3 months behind at $300 to $500 and 4 to 6 months at $500 to $1,500; another lists 1 to 3 months, low complexity at $300 to $800. https://www.sdocpa.com/catch-up-bookkeeping-cost-guide/ , https://www.monacocpa.cpa/post/bookkeeping-cleanup-cost-small-business-2026 (snippet, vendor pages; general bookkeeping, not construction-specific)
6. **Professionals pay to network on this:** CFMA (Construction Financial Management Association) general membership "$33.34 /Month, $400 Billed Annually", with a members-only forum (Connection Café). https://cfma.org/join (snippet, primary)

### 5. Guesses
- (Guess) The exception list (over-budget codes, costs on closed jobs, miscodes, possible duplicate bills) is something a good construction bookkeeper does monthly; firms without one, or with a generalist bookkeeper, are the buyers. The bookkeeper could also be a channel (white-label review).
- (Guess) "Percent complete" rarely exists in any export for a 3 to 30 job firm; the pilot will need a one-line-per-job estimate from the owner or PM, which adds friction.
- (Guess) A one-time pilot price of a few hundred dollars is plausible because buyers already pay $199 to $575 a month for software and $500 to $1,200 a month for construction bookkeeping; this is the highest price ceiling of the five offers.
- Vendor claims, not facts: the QuickBooks survey's "1 in 4 would go out of business" line; "CFMA data cited by one source puts the average construction company's net income before tax margin at just 6.7% in 2024" (secondhand).

### 6. Test price hypothesis (one-time pilot: budget vs actual by cost code, percent spent vs complete, exceptions with transactions)
- **Hypothesis: $450 one-time for up to 10 active jobs** (test band $350 to $750; larger firms quoted per job).
- **Basis:** below one month of outsourced construction bookkeeping ($500 to $1,200/mo); inside the band of one-time QuickBooks cleanup projects ($300 to $1,000) and catch-up of 1 to 3 months ($300 to $800); about one to two months of job-costing software ($199 to $340/mo); below the $1,200 Upwork fixed-price construction bookkeeping post.
- **Strength of basis: moderate.** Several independent comparables for adjacent one-time work; none for exactly an exception report.

### 7. Main objections a buyer would raise
- "My bookkeeper/accountant already does this" or "QuickBooks already has job cost reports".
- Accuracy: "my cost codes are a mess, so your exceptions will be noise"; payroll allocation problems (QuickBooks Community) mean labor may be wrong at the source.
- Data access and export time: budgets in Buildertrend or a spreadsheet, actuals in QuickBooks, percent complete in the PM's head.
- Confidentiality of job financials and vendor costs.
- "Will you change my books?" (must be answered clearly: no, read-only flags).

### 8. Where these buyers gather online (not joined, not posted, not contacted)
- ContractorTalk (contractortalk.com; job-costing software threads).
- QuickBooks Community (quickbooks.intuit.com/learn-support; many job-costing threads).
- CFMA Connection Café (members-only; paid membership) and CFMA local chapters (90+).
- Jobber Community "Construction & Home Improvement" and "Profit & Finance" boards (community.getjobber.com).
- Reddit (not checked, unreachable): r/Construction, r/Contractor, r/ConstructionManagers, r/Bookkeeping.
- Associations: NARI Tradewing community (remodelers; member-only). Not checked: NAHB, ABC, AGC.

### 9. Evidence strength
- **Strict score under the rubric: 1** (nothing verified by fetch).
- **Provisional score if snippets hold up: 3.** Clear spend on job-costing software and construction bookkeeping at prices that leave room for a $350 to $750 pilot, and vivid buyer complaints, but no product sells exactly this one-off exception report and the data assembly is the hardest of the five.

## Offer 4: Receipt and invoice matching, exceptions for bookkeeper review

Section status: complete. All items are search snippets; see the access limitation above.

### 1. Buyer
- **Two possible payers:** (a) an independent bookkeeper or small bookkeeping firm, who already pays per client per month for tools (Dext, Keeper, Uncat) and would use the exceptions list to make decisions faster; (b) a small business owner doing their own books or handing them to a CPA at year end. The evidence of per-client tool spend points to (a) as the more reachable payer.
- **Who uses the output:** the bookkeeper (decides on each exception); the owner supplies missing receipts. Amber only matches and explains; no entries.

### 2. Painful problem, in buyers' words (search snippets, not fetched)
- FreeAgent (accounting software) webinar listing describes "chasing clients for missing receipts and paperwork" as one of the most frustrating parts of running a practice. https://www.freeagent.com/accountants/events/digital-bookkeeping
- AccountingWEB (UK), October 2026 article on Reveal: a survey of 142 practitioners after the first MTD quarterly deadline, "67% cited getting information from clients as the biggest cause of difficulty". https://www.accountingweb.co.uk/tech/practice-software/reveal-sets-sights-on-ending-the-client-document-chase (UK, Making Tax Digital context)
- AccountingWEB Any Answers threads (UK, 2010 to 2015): "Chasing Clients for Information", "Missing receipts for some large expenses"; one practitioner says repeated chasing "is ineffective in my experience". https://www.accountingweb.co.uk/any-answers/chasing-clients-for-information , https://www.accountingweb.co.uk/any-answers/missing-receipts-for-some-large-expenses
- QuickBooks Community thread titles: "Receipt Matching to Bank Transactions doesn't work" https://quickbooks.intuit.com/community/banking-4/receipt-matching-to-bank-transactions-doesn-t-work-24245 ; "QBO Won't Match Receipt with Transaction, but it will Match Transaction with Receipt?" https://quickbooks.intuit.com/learn-support/en-us/banking/qbo-won-t-match-receipt-with-transaction-but-it-will-match/00/595099 ; "Expenses duplicated on bank feed and receipts" https://quickbooks.intuit.com/learn-support/en-uk/transactions/expenses-duplicated-on-bank-feed-and-receipts/00/587549
- QuickBooks Community: "Is there a way to see which categorized transactions don't have receipts attached?"; a community answer says QuickBooks Online has no specific report showing expense transactions with or without receipt attachments (QuickBooks Desktop users can show an Attachments column). https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/is-there-a-way-to-see-which-categorized-transactions-don-t-have/00/1406619 , https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/missing-receipt-report/00/488112 . This is a direct gap the Offer 4 exceptions list fills.
- Capterra reviewer of Uncat (bookkeeper tool): "the only negative is that we have to pay per customer, which makes it difficult to afford using it for multiple clients." https://www.capterra.com/p/247759/Uncat/reviews/
- **Cost stated:** none in dollars by a buyer.

### 3. Existing alternatives (prices exactly as the search snippet showed them; retrieved 2026-10-10)
| Alternative | What it does | Published price (as snippet shows) | URL | Source type |
|---|---|---|---|---|
| Dext (business) | Receipt and invoice capture, extraction, publishing to QBO/Xero | "$25.21 per month, USD, excludes tax" (250 documents/month), "$302.50 billed annually"; line-item extraction add-on $20.50/month for 50 documents | https://dext.com/us/business/pricing | snippet, primary |
| Dext (accountants) | Per-client practice plans; Precision data-quality checks | "$7.5/client/month" for listed add-ons, minimum 10 clients (per snippet) | https://dext.com/us/partner/pricing | snippet, primary |
| AutoEntry | Credit-based capture of receipts, invoices, statements | Bronze 50 credits $12/month, Silver 100 $23, Gold 200 $44, Platinum 500 $98, Diamond 1,500 $285, Sapphire 2,500 $450 (pages disagree) | https://www.autoentry.com/pricing | snippet, primary |
| Hubdoc | Receipt/bill capture into Xero | included in Xero Starter, Standard and Premium plans; retail price for other plans | https://www.xero.com/hubdoc/ | snippet, primary |
| Keeper | Bookkeeper practice tool; "transactions that need receipts" requests via client portal | Lite $8, Core $10, Plus $25, Scale $50 per client per month | https://help.keeper.app/en/articles/12410230-keeper-s-new-pricing-plans | snippet, primary |
| Uncat | Client answers uncategorized transactions | $5 per client per month (2022, co-founder) / $9 per client per month (third-party) | https://insightfulaccountant.com/podcastsvideo/uncat-quickbooks-connect-2022/ | snippet, mixed |
| Booke AI | AI bookkeeping for QBO/Xero; requests missing receipts | "$129 per business per month" (US) | https://booke.ai/en-us/pricing | snippet, primary |
| Fiverr reconciliation gigs | Bank reconciliation and cleanup in QBO/Xero | about $10 to $56 for roughly 50 to 100 transactions | https://www.fiverr.com/nayeem_s/do-bank-reconciliation-clean-up-bookkeeping-in-quickbooks-online-xero-excel | snippet, primary |
| Upwork | Freelance bookkeepers | post "Bookkeeper for monthly QuickBooks cleanup", "$15.00 Fixed Price, posted September 18, 2026"; bookkeepers "$11–$25/hr" | https://www.upwork.com/freelance-jobs/apply/Bookkeeper-for-monthly-QuickBooks-cleanup_~022101019768267243801/ | snippet, primary |
| QuickBooks Online built-in | Receipt capture and bank-feed matching | included in subscription (matching limits documented in Community threads above) | https://quickbooks.intuit.com/learn-support/en-us/help-article/bank-feeds/match-online-bank-transactions-quickbooks-online/L6qyw0PvP_US_en_US | snippet, primary |
| New entrants | Reveal (beta, searches client email for missing receipts); Apron (agentic document collection) | not priced in snippets | AccountingWEB articles | snippet |

### 4. Evidence buyers spend money on this
#### Verified facts
None verified by fetch (all fetches blocked; see the access limitation at the top).
#### Spend signals from search snippets (not verified)
1. **Dext:** Xero App Store US listing shows 4.8 stars and 1,116 reviews; business plan $25.21/month. https://apps.xero.com/us/app/dext/reviews (snippet, primary)
2. **AutoEntry:** Xero App Store US 4.7 from 465 reviews; paid plans $12 to $450/month. https://apps.xero.com/us/app/autoentry/reviews (snippet, primary)
3. **Hubdoc:** Xero App Store US 3.3 from 232 reviews; bundled free with most Xero plans (a strong free substitute). https://apps.xero.com/us/app/hubdoc/reviews (snippet, primary)
4. **Bookkeepers pay per client for receipt-chasing and exception workflow tools:** Keeper $8 to $50 per client per month; Uncat $5 to $9; Dext partner add-ons $7.5. (snippets)
5. **Booke AI** charges $129 per business per month for AI reconciliation that flags missing receipts. (snippet, primary)
6. **Fiverr:** reconciliation gigs with real volume, e.g. a $30 gig (100 bank lines) with 45 reviews at 5.0, a $50.98 basic tier with 51 reviews, and one seller with 93 reviews and 416 orders completed quoting from $56.25. Gigs in that result set: https://www.fiverr.com/nayeem_s/do-bank-reconciliation-clean-up-bookkeeping-in-quickbooks-online-xero-excel ($30), https://www.fiverr.com/ihsan_bajwa/do-bank-reconciliation-clean-up-quickbooks-online-bookkeeping ($50), https://www.fiverr.com/mayna9349/do-bank-reconciliation-in-quickbooks-online-xero-excel ($50), https://www.fiverr.com/shiblisadiq_bpo/quickbooks-bookkeeping-xero-bookkeeping-bank-reconciliation-quickbooks-online ($35) (snippet, primary; which gig holds which review count was not confirmed)
7. **Price floor:** an Upwork client posted monthly QuickBooks cleanup and reconciliation at $15 fixed price (September 18, 2026). (snippet, primary)

### 5. Guesses
- (Guess) Money clearly flows into receipt capture and reconciliation, but mostly as per-client software at $5 to $50 a month or offshore labour at $10 to $56 a job. A one-month matching pilot is easy to price-compare against those anchors.
- (Guess) The differentiating part is the explained exception list for a bookkeeper (why each item is suspect, what evidence would clear it), not the matching itself, which Dext/Hubdoc/QBO already do.
- (Guess) Selling to bookkeepers per client (a few clients at a time) is a better test than selling to owners, who mostly do not know what an exception list is for.
- Vendor claims, not facts: a 2026 Xero app roundup says firms lose "a significant share of billable time chasing clients for receipts" (unquantified, promotional).

### 6. Test price hypothesis (one-time pilot: one month of transactions and receipts)
- **Hypothesis A (bookkeeper buyer): $149 for 3 client-months** (about $49 per client-month, up to about 300 transactions each).
- **Hypothesis B (owner buyer): $99 for one month** (up to about 300 transactions).
- **Basis:** Booke AI $129 per business per month is the closest automated comparable; Keeper's top tier $50 per client per month; Fiverr reconciliation $10 to $56 per 50 to 100 transactions; an Upwork monthly cleanup post at $15.
- **Strength of basis: moderate**, and it points down: the anchors buyers see are low.

### 7. Main objections a buyer would raise
- "Dext, Hubdoc or QuickBooks already matches receipts" (Hubdoc is free with most Xero plans).
- "The problem is that receipts are missing, not unmatched" (a matching report cannot produce the missing receipt; someone still has to chase it).
- Bookkeepers: "this is my job and my margin"; per-client cost sensitivity (Uncat reviewer).
- Trust and confidentiality of bank and card statements; clarity that nothing is posted.
- Matching accuracy (date offsets, fees, split payments, as described in QuickBooks Community threads).
- Fiverr and Upwork price anchors of $10 to $56.

### 8. Where these buyers gather online (not joined, not posted, not contacted)
- QuickBooks Community (quickbooks.intuit.com/learn-support), Xero Central (central.xero.com), AccountingWEB Any Answers (UK practitioners).
- Facebook groups named by third-party lists (2020 to 2022 data, may be stale): Bookkeepers Corner Group; QB Power User Community; The Successful Bookkeeper (over 10,000 in 2022); Bookkeeping Side Hustle (grew 16,500 to 21,600 in 2022); 5-Minute Bookkeeping; Build Your Best QuickBooks Online Practice. Sources: https://wagepoint.com/blog/?p=4616 , https://www.countingworkspro.com/blog/15-best-facebook-groups-for-accountants-and-tax-professionals-in-2022 , https://bookkeepingsidehustle.substack.com/p/the-one-with-the-year-end-review
- Reddit (not checked, unreachable): r/Bookkeeping, r/Accounting, r/QuickBooks, r/xero.
- Associations (snippet, primary): AIPB discussion forum (guests can read, members post; https://aipb.org/); NACPB Bookkeeper Community, described as a free social networking platform for bookkeepers (https://www.nacpb.org/resources/videos/nacpb-bookkeeper-community). Not checked: Intuit ProAdvisor program groups. A GummySearch snapshot shows r/Bookkeeper at about 1K members; r/Bookkeeping was not found by the tracker search.

### 9. Evidence strength
- **Strict score under the rubric: 1** (nothing verified by fetch).
- **Provisional score if snippets hold up: 3.** Abundant, independent proof that people pay for receipt capture and reconciliation (thousands of app reviews, per-client tools, busy Fiverr gigs), but at low price points and with a free bundled substitute (Hubdoc), so a paid one-off pilot has weak price support.

## Offer 5: Unpaid-invoice tracking with draft reminder messages

Section status: complete. All items are search snippets; see the access limitation above.

### 1. Buyer
- **Who pays:** the owner of a small service business, agency or trade with 20 or more open invoices (net terms or invoice-after-job), sometimes the office manager or an outsourced bookkeeper on the owner's behalf.
- **Who uses the output:** the owner or office manager, who decides which reminders to send and sends them from their own email or invoicing tool.

### 2. Painful problem, in buyers' words (search snippets, not fetched)
- QuickBooks Community thread title: **"How do I turn off the feature that generates emails for invoice reminders? It is AWFUL and I would never send an email like this. My own template was fine."** https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/how-do-i-turn-off-the-feature-that-generates-emails-for-invoice/00/1498858 (also: "unwanted reminder invoices", "How do you disable, 'reminder' overdue invoice emails to customers?")
- ContractorTalk thread titles: "Customer owes 20k and won't pay...." https://www.contractortalk.com/threads/customer-owes-20k-and-wont-pay.107416/ ; "Squealing money out of dead beat clients" https://www.contractortalk.com/threads/squealing-money-out-of-dead-beat-clients.424827/ ; a poster warns that chasing "less than $600 will cost you more than its worth".
- LawnSite, "Clients who don't pay? what to do?": "This year was my first year that I required all services be prepaid. Let me tell you....the headaches of collecting are gone!!!" https://www.lawnsite.com/threads/clients-who-dont-pay-what-to-do.413653/
- Jobber Community, "Collections": one contractor tracks every collection attempt in each invoice's internal notes and keeps them off the client profile so staff outside accounts receivable cannot see them; a typical sequence was voicemail, then emailed and texted invoice, then an emailed statement. Another user built an assistant that pulled overdue invoices and drafted reminder emails modeled on past correspondence with each client, which the user then sent (a DIY version of this offer). https://community.getjobber.com/discussions/invoicing-getting-paid/collections/768/replies/962 (paraphrased in snippet)
- AccountingWEB, "Is an automated system to send invoice reminders any use?": an accountant warns that unless the bank feed is updated very regularly, reminders go out for invoices already paid and annoy clients. https://www.accountingweb.co.uk/any-answers/is-an-automated-system-to-send-invoice-reminders-any-use
- **Cost (vendor survey, not a buyer quote):** QuickBooks 2026 Small Business Late Payments Report (1,305 US owners, December 2025): businesses with unpaid invoices are owed "an average of $17.7K"; "59%" have invoices overdue by 30+ days (up from 47%); "59% paid extra fees last year just to access money they'd already earned". 2025 edition (2,487 businesses): "56%" owed money from unpaid invoices, "averaging $17.5K per business". https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/ , https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/ (snippet, primary; Intuit's own survey)
- **Time cost (vendor surveys):** a QuickBooks UK SMB survey: "just under 10% of SMB owners spend five to 10 hours a week chasing late invoices, 20% spend one to four hours, and 27% spend less than an hour" https://quickbooks.intuit.com/uk/press/smbs-chase-late-payments/ ; a QuickBooks mid-sized business survey: "65% of businesses said that they spent a shocking 14 hours per week on average" on payment-collection admin (mid-sized, not the target buyer) https://quickbooks.intuit.com/r/midsize-business/midsize-payments-research/ (snippets, primary; Intuit's own research)

### 3. Existing alternatives (prices exactly as the search snippet showed them; retrieved 2026-10-10)
| Alternative | What it does | Published price (as snippet shows) | URL | Source type |
|---|---|---|---|---|
| Chaser | AR automation and credit control for Xero/QBO; Care add-on (human credit control) | Compact from £199/month, Core from £599/month, Complete from £899/month (UK); Care-only from £324/month | https://www.chaserhq.com/chaser-pricing | snippet, primary |
| Paidnice | Reminders, late fees, statements for Xero/QBO | Essentials 69 USD/month (up to 150 invoices); Pro from 99 USD (300 invoices) to 799 USD; Custom from 999 USD; SMS $0.10 each | https://www.paidnice.com/pricing | snippet, primary |
| InvoiceSherpa | AR reminders for QBO/Xero/Clio | $49/month (up to 100 open invoices), $99/month (101 to 500), $199/month (unlimited); "1% transaction fee" on invoices paid | https://www.invoicesherpa.com/pricing | snippet, primary |
| Upflow | B2B AR automation (mid-market) | page data lists Starter $333 and Grow $833 per month; the comparison table shows a $390/month platform fee (conflicting) | https://upflow.io/pricing | snippet, primary |
| QuickBooks Online built-in | "Automatic invoice reminders" for overdue or soon-due invoices (all invoices, not per customer) | included | https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/can-i-turn-off-automatic-invoice-reminder-emails/00/1180011 | snippet, primary (community) |
| Xero built-in | Invoice reminders, up to five, before or after due date; can be turned off per invoice or customer | included (plan tiers not stated in snippets) | https://central.xero.com/0/article/How-invoice-reminders-work | snippet, primary |
| Jobber built-in | Two invoice follow-up automations, up to 90 days after due | "Connect Plan and up" ($99/month billed annually, $139/month with no commitment, 1 user) | https://help.getjobber.com/hc/en-us/articles/360021573434--Invoice-Follow-ups | snippet, primary |
| FreshBooks built-in | Up to three payment reminders, late fees | named on the Plus plan | https://support.freshbooks.com/hc/en-us/articles/227559727-What-are-payment-reminders-and-late-fees | snippet, primary |
| Collection agencies | Contingency collection | "10% to 40%", "15% to 33%", "usually between 25 and 50%" of amount recovered, depending on source and debt age | https://www.buyerzone.com/finance/collection-agencies/ar-what-collection-agencies-do/ | snippet, third-party (some promotional) |
| Freelancers | AR/AP management, collection calls and emails | Fiverr AR gigs from $10; Upwork part-time collections specialist posts | https://www.fiverr.com/finance001/do-accounts-receivable-payable-and-inventory-management-in-quickbooks , https://www.upwork.com/freelance-jobs/accounts-receivable/ | snippet, primary |

### 4. Evidence buyers spend money on this
#### Verified facts
None verified by fetch (all fetches blocked; see the access limitation at the top).
#### Spend signals from search snippets (not verified)
1. **Chaser:** Xero App Store shows 4.98 stars (5.0 rounded on some regional pages) from 374 reviews; plans from £199/month. https://apps.xero.com/us/app/chaser/reviews (snippet, primary)
2. **Paidnice:** Xero App Store US listing 5.0 from 83 reviews (64 to 83 across regional listings); plans from $69/month. https://apps.xero.com/us/app/paidnice/reviews (snippet, primary)
3. **InvoiceSherpa:** $49 to $199/month plus 1% of paid invoices; Capterra 4.0 from 13 reviews. https://www.capterra.com/p/154446/InvoiceSherpa/reviews/ (snippet, primary)
4. **Upflow** sells AR automation from about $333 to $390/month to larger B2B firms. (snippet, primary)
5. **Businesses pay to get paid faster:** "59% paid extra fees last year just to access money they'd already earned" (QuickBooks 2026 report, vendor survey). (snippet, primary)
6. **Collection agencies** take a contingency of roughly 10% to 50% of recovered amounts (several sources, some promotional). (snippet, third-party)
7. **Freelance AR work exists:** Upwork lists part-time remote collections specialist roles (one at 30+ hours a week for 3 to 6 months); Fiverr AR/AP gigs from $10. (snippet, primary)

### 5. Guesses
- (Guess) This has the most published, small-business-sized SaaS prices of the five offers ($49 to $199/month), so price fit for a small pilot is good; but every accounting tool the buyer already pays for has free reminders, so the pilot must win on judgment (which invoices, in what tone, why now) rather than on sending.
- (Guess) The QuickBooks "AWFUL" thread suggests a real gap: owners want reminders in their own voice. Owner-reviewed drafts fit that.
- (Guess) Data freshness is the operational risk: a weekly export can be a few days stale, so drafts must tell the owner to check for recent payments before sending.
- Vendor claims, not facts: a Paidnice app-store reviewer reportedly said a client's collections became roughly 50% faster after setup (paraphrased in a snippet, single review); the QuickBooks survey figures are Intuit's own research.

### 6. Test price hypothesis (one-time pilot: four weekly aging reports with drafts)
- **Hypothesis: $149 for the 4-week pilot** (test band $99 to $199).
- **Basis:** about 1.5 months of Paidnice Pro or InvoiceSherpa Small Business ($99/month), or 3 months of InvoiceSherpa Sole Proprietor ($49); under one month of Chaser Compact (£199); far below a collection agency's contingency on an average $17.7K owed (10% to 50% would be $1,770 to $8,850).
- **Strength of basis: moderate.** Several published, comparable SaaS prices; the weakness is that free built-in reminders exist in QuickBooks, Xero, FreshBooks and Jobber.

### 7. Main objections a buyer would raise
- "QuickBooks/Xero/Jobber already sends reminders for free."
- "Reminders will annoy my clients or hurt the relationship" (QuickBooks "AWFUL" thread; AccountingWEB warning about reminders for already-paid invoices).
- "I'd rather call them myself" / "I take deposits up front now" (LawnSite prepay post).
- Sharing a customer list and balances with an outside party (trust).
- Time to export an aging report every week for four weeks.
- "Will you contact my customers?" (must be answered clearly: no; the owner sends).

### 8. Where these buyers gather online (not joined, not posted, not contacted)
- QuickBooks Community, Xero Central, AccountingWEB (UK accountants advising small firms).
- Trade forums with non-payment threads: ContractorTalk, LawnSite, ElectricianTalk.
- Jobber Community "Profit & Finance" board (community.getjobber.com).
- Reddit (not checked, unreachable): r/smallbusiness, r/Entrepreneur, r/agency, r/freelance, r/msp.
- Facebook groups for service-business owners listed under Offer 1.

### 9. Evidence strength
- **Strict score under the rubric: 1** (nothing verified by fetch).
- **Provisional score if snippets hold up: 4.** Several independent paid products at $49 to $199/month with real app-store review counts (Chaser 374, Paidnice 83), a large vendor survey stating the cost of the problem, and agencies paid by contingency; tempered by free built-in reminders.

## Summary table

All evidence below is search-snippet level; nothing could be fetched in this session (see the access limitation at the top). "Strict" is the rubric score (1 = none verified); "provisional" is the score if the snippets are confirmed on fetch.

| Offer | Buyer | Strongest verified spend evidence | Price range seen (verified) | Pilot price hypothesis | Evidence strength (1–5) |
|---|---|---|---|---|---|
| 1. Missed-call and inquiry follow-up | Owner of a 1 to 20 person home-service business; owner or office manager uses it | None verified. Strongest snippet: Yelp bought Hatch (AI lead follow-up) for about $270M cash; Hatch run-rate revenue $35M in June 2026 per Yelp's SEC-filed letter; plus Smith.ai, Ruby, Podium, Jobber price lists and owners paying $100 to $450/month for answering | None verified. Snippets: $29/month (Jobber AI add-on) to $1,725/month (Ruby 500 min); Fiverr setups $25 to $100 | $199 one-time (test $149 to $249); weak to moderate basis | Strict 1; provisional 4 |
| 2. Stale estimate follow-up | Owner or estimator at a contractor sending 10+ estimates/month; coordinator uses it | None verified. Strongest snippet: Jobber puts quote follow-ups in its $99/month Connect tier; roofing job posts pay $10 to $16/hour for follow-up coordinators; ServiceTitan case study of a $20M firm with a dedicated follow-up coordinator | None verified. Snippets: $25 to $100/month (old Housecall Pro Pipeline add-on), $99/month (Jobber Connect) to $299/month (JobNimbus); $10 to $16/hour staff; Hatch $700 to $1,500/month (third-party) | $249 for 4 weeks (test $199 to $399); weak basis | Strict 1; provisional 3 |
| 3. Job-cost exception reports | Owner of a GC, remodeler or specialty sub with 3 to 30 active jobs; bookkeeper and PM use it | None verified. Strongest snippet: construction bookkeeping with job costing and WIP sold at $500 to $1,200/month (Catalyst CPA); job-costing tiers at $199 to $340/month (JobTread, Knowify, QBO Advanced); Upwork $1,200 fixed-price construction-bookkeeper post | None verified. Snippets: $199/month (JobTread) to $1,200/month (bookkeeping); one-time cleanup $300 to $1,000 | $450 one-time for up to 10 jobs (test $350 to $750); moderate basis | Strict 1; provisional 3 |
| 4. Receipt and invoice matching | Independent bookkeeper (per client) or small-business owner; bookkeeper uses it | None verified. Strongest snippet: Dext 1,116 Xero App Store reviews and AutoEntry 465; bookkeepers pay $5 to $50 per client/month for Keeper, Uncat, Dext; Booke $129/business/month | None verified. Snippets: $10 to $56 per Fiverr reconciliation job; $12 to $450/month capture tools; $129/month Booke; Hubdoc free with Xero | $149 for 3 client-months (bookkeeper) or $99 for one month (owner); moderate basis that points low | Strict 1; provisional 3 |
| 5. Unpaid-invoice tracking with drafts | Owner of a service business, agency or trade with 20+ open invoices; owner or office manager uses it | None verified. Strongest snippet: Chaser 374 and Paidnice 83 Xero App Store reviews; InvoiceSherpa $49 to $199/month; QuickBooks 2026 survey: average $17.7K owed, 59% paid extra fees to get paid sooner | None verified. Snippets: $49/month (InvoiceSherpa) to £899/month (Chaser Complete); agencies 10% to 50% contingency; built-in reminders free | $149 for 4 weeks (test $99 to $199); moderate basis | Strict 1; provisional 4 |

### Three findings most relevant to choosing the next build cycle
1. **Lead response (Offer 1) has the strongest evidence of paid demand, but buyers pay for speed.** Yelp paid about $270M cash for Hatch, an AI lead follow-up platform for services businesses, which Yelp's SEC filings put at about $35M annual run-rate revenue in June 2026; Smith.ai, Ruby, Podium and Jobber publish prices from $29 to $1,725 a month; owners on trade forums describe paying $100 to $450 a month for answering. The same evidence says the winner is whoever replies first (HBR 2011: within an hour, about 7 times as likely to qualify), and a real owner's 47 missed calls held only about 7 real leads. A weekly, owner-sent list is slower than every paid alternative; if Offer 1 goes forward, sell it as a one-time lost-lead audit with reactivation drafts at a low price ($149 to $249), not as ongoing follow-up.
2. **Unpaid invoices (Offer 5) has the best fit between evidence and a small pilot price.** Several AR tools sell to small firms at $49 to $199 a month with real review counts (Chaser 374 and Paidnice 83 on the Xero App Store; InvoiceSherpa), Intuit's 2026 survey puts the average owed at $17.7K with 59% paying extra fees to get paid sooner, and buyers complain that built-in reminders read badly ("It is AWFUL ... My own template was fine"). A Jobber user built a DIY version of exactly this (drafts modeled on past emails). The risk is that QuickBooks, Xero, FreshBooks and Jobber all include free reminders, so the pilot must win on prioritization and tone, not on sending.
3. **The bookkeeping and estimate offers split sharply.** Offer 3 (job-cost exceptions) has the highest price ceiling for a one-time pilot (construction bookkeeping $500 to $1,200 a month, cleanup projects $300 to $1,000, a $1,200 fixed-price Upwork post, job-costing software $199 to $340 a month) and vivid pain ("PROJECT COSTING DOES NOT WORK PERIOD"), but the hardest data assembly. Offer 4 (receipt matching) is commoditized: Hubdoc is free with most Xero plans, Fiverr reconciliation sells for $10 to $56 with dozens of reviews, an Upwork client posted monthly cleanup at $15; it fits better as a per-client add-on for bookkeepers or folded into Offers 3 and 5. Offer 2 (stale estimates) is real but mostly bundled into tools contractors already pay for (Jobber Connect $99 a month includes quote follow-ups), though Jobber users ask for exactly the missing piece: which quiet quotes are worth chasing first.

### Notes for the lead
- To turn any of this into verified evidence, the session needs network access to the cited hosts (smith.ai, ruby.com, podium.com, getjobber.com, housecallpro.com, quickbooks.intuit.com, apps.xero.com, capterra.com, g2.com, fiverr.com, upwork.com, sec.gov, yelp-ir.com and the forums). Until then, do not quote these numbers on public offer pages as facts.
- Highest-value checks if fetching becomes possible: (1) Yelp's Q2 2026 shareholder letter on sec.gov for the Hatch $35M figure; (2) Jobber, Housecall Pro and Smith.ai pricing pages; (3) Chaser and Paidnice Xero App Store review counts; (4) Catalyst CPA's $500 to $1,200 construction bookkeeping range; (5) the QuickBooks 2026 Late Payments Report.
