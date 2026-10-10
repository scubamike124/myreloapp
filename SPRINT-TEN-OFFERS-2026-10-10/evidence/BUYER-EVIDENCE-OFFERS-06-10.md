# Buyer evidence: offers 6 to 10

> **Live-page check (2026-10-10 18:22Z):** Amber's worker opened every cited page once (robots.txt honoured) and looked for each quoted text. Results per item, including which facts are now verified and which pages blocked the check, are in `EVIDENCE-LIVE-CHECK.md`. Only items marked **found** there count as verified; everything else in this file remains a search result.


Researcher: buyer-evidence agent (offers 6–10). Started 2026-10-10 17:01Z. Status: COMPLETE for this pass (all five offers and summary written; finished 17:15Z). Nothing in this file is fetch-verified; see Blocker.

**Blocker (logged 17:05Z): page fetching is blocked in this environment.** WebFetch and curl could not reach the pages needed for verification: WebFetch returned `getaddrinfo ENOTFOUND` for fiverr.com, www.fiverr.com, equalizedigital.com, www.ftc.gov, apps.shopify.com, wordpress.org, www.g2.com and www.upwork.com, and "unable to fetch" for www.reddit.com and web.archive.org; curl through the egress proxy got `CONNECT tunnel failed, response 403` (connect_rejected, organization policy) for equalizedigital.com and www.ftc.gov. github.com was reachable. Reddit is unreachable from both tools (WebFetch "unable to fetch"; WebSearch with reddit.com returned "API Error: 400 ... not accessible to our user agent"), so buyer quotes come from vendor community forums (HubSpot, Shopify, Etsy, Amazon Seller Forums, Zoho, Brizy) and news, and subreddit lists below are unverified. Consequence: under the sprint rule, **almost nothing below counts as verified**. Facts are marked "(search snippet, not verified)"; where sources disagreed, the disagreement is stated. To verify, the owner can widen Network access in the cloud environment settings (environment menu in the session title bar, then Edit: a broader access level, or add the hosts above under Allowed domains) and re-run the fetches listed in each section.

Method: WebSearch (standard) to find sources; WebFetch intended to verify (blocked, see above). "Verified (fetched)" means the page was fetched on 2026-10-10 and the quote or number was seen in the fetched content. "(search snippet, not verified)" means seen only in a search result. Vendor statistics are labelled as vendor claims. Nothing was posted, joined, signed up for, purchased or contacted.

## Offer 6: Website health, accessibility and booking-form reports

All items retrieved 2026-10-10 via WebSearch. Page fetches were blocked (see Blocker), so every number here is "(search snippet, not verified)" unless stated otherwise.

### 1. Buyer
- **Who pays:** the owner or office manager of a small appointment- or inquiry-driven business (salon, clinic, dental or physio practice, trades contractor, studio, small online shop) with a DIY site (Wix, Squarespace, WordPress) or a site built by a freelancer who has since moved on. Second buyer: the small web designer or agency who maintains such sites and wants a cheap third-party check to show clients (guess based on the agency-oriented tiers sellers offer, e.g. Equalize Digital's 5-site and 25-site plans).
- **Who uses the output:** the owner (to decide what to ask for) and whoever edits the site (owner, freelancer, agency).

### 2. Painful problem (buyers' own words where found)
- Silent form failure. Zoho community post: a web-to-contact form worked for months then quit, and "the only way they found out was after clients had lost their information" (search snippet, not verified). https://help.zoho.com/portal/en/community/topic/web-to-contact-form-has-stopped-working-again
- Brizy support community: a site's contact form had stopped sending emails for about a month; the vendor said messages not saved in its leads panel "can't be recovered" (search snippet, not verified). https://support.brizy.io/hc/en-us/community/posts/360075634391-Contact-form-submission-stopped-working-loss-of-emails
- Agency view (seller, not buyer): Engage Web says it still finds small business sites where the form doesn't work and "the business owner has no idea, and they have no idea how many people have tried to contact them and failed" (search snippet, not verified). https://www.engageweb.co.uk/blog/why-you-should-test-your-contact-form
- Legal fear, in an owner's words: TMJ4 (Milwaukee TV) story headlined "It gets under my skin": small online seller April Foster sued over website accessibility; per the snippet Foster settled for $7,500 and says the case cost around $20,000 after attorney fees (search snippet, not verified; the cost figure came via a vendor summary, so treat as second-hand). https://www.tmj4.com/about-us/lighthouse/it-gets-under-my-skin-businesses-frustrated-with-what-they-call-frivolous-ada-website-lawsuits
- Scale context (law-firm count, reported second-hand): Seyfarth Shaw counted 3,117 federal ADA Title III website accessibility lawsuits in 2025, up 27% from 2,452 in 2024; New York courts had 1,021 (search snippet via JD Supra/Mondaq/Level Access republications, not verified; I did not reach Seyfarth's original). https://www.jdsupra.com/legalnews/federal-court-website-accessibility-1182174/ . Seyfarth also notes demand letters settled privately are not counted. Lawsuit statistics are frequently used in vendor marketing; this one is a law firm's docket count, which is the most neutral kind available.
- Form-label problem is common: WebAIM Million 2025 reports missing form input labels on roughly 48% of the top 1,000,000 home pages (secondary sources disagree: 48.2% vs 48.6%; WebAIM's own page not fetched) (search snippet, not verified). https://webaim.org/projects/million/2025
- Booking-form abandonment statistics found (e.g. "25% drop in conversion per field beyond 3") come from scheduling-software vendors with unclear sourcing: **vendor claims, uncited**; not usable as facts. https://www.schedulingkit.com/statistics/booking-abandonment-statistics

### 3. Existing alternatives (published price as shown in snippets; retrieved 2026-10-10)
| Alternative | What it does | Price as shown | URL |
|---|---|---|---|
| WAVE, Google Lighthouse / PageSpeed Insights | Free automated accessibility / quality checks | Free | https://wave.webaim.org/ , https://pagespeed.web.dev/ |
| Equalize Digital Accessibility Checker (WordPress plugin) | Automated WCAG scanning inside WordPress | "Personal $0"; "Professional $190/year, 1 site license"; "Small Business $750/year or pay $75/month, 5 site licenses"; "Agency $2,250/year or pay $225/month, 25 site licenses" (search snippet, not verified) | https://equalizedigital.com/accessibility-checker/pricing/ |
| accessiBe (overlay widget) | Accessibility overlay | Entry about $490/year; Micro plan "$41/mo ($490/yr)" up to 5,000 visits/month per a third-party pricing page (search snippets, not verified) | https://www.capterra.co.uk/reviews/212877/accessibe , https://checkthat.ai/brands/accessibe/pricing |
| UserWay (overlay widget) | Accessibility overlay | "Widget Pro: Small" $490.00 per year, up to 100K page views/month (G2 listing; search snippet, not verified) | https://www.g2.com/products/userway |
| Sitechecker | Site-health / SEO audit SaaS | Basic about 89/month (75/month annual), currency unclear by locale (99/83 on Spanish/Swedish pages, in dollars); Capterra shows "$49 flat rate per month" (likely outdated) (search snippets, not verified) | https://sitechecker.pro/en/account/plans/ |
| Zuko | Form analytics (where users drop off in forms) | From $56/month annual or $70 monthly for 5,000 form sessions (Capterra/Fitgap; search snippets, not verified) | https://www.capterra.com/p/10017636/Zuko-Analytics/pricing/ |
| Fiverr accessibility audit gigs | Freelancer WCAG/ADA audit report | Roughly $50 to $400 per gig tier; one gig prices "up to 3 pages" (search snippet, not verified) | https://fiverr.com/jonasfoersterhu/do-a-wcag-accessibility-audit-and-ada-compliance-report , https://fiverr.com/djppatel/web-accessibility-audit-for-the-website (price-to-gig mapping not given in snippet) |
| Fiverr Squarespace form-fix gig | Fix contact form "ghosting", spam, email and CSS issues | Price not in snippet | https://www.fiverr.com/elisabeth_sibi/fix-squarespace-custom-contact-form-ghosting-spam-email-and-css-issues-fast |
| Fiverr technical SEO audit gigs | Freelancer site-health audit | From about $5 to $1,000; one Vetted Pro seller shows 47,300 orders and 22,300 reviews (search snippet, not verified; snippet did not say which gig) | https://block.fiverr.com/gigs/technical-seo-audit (category listing as indexed) |
| Upwork Project Catalog accessibility audits | Fixed-price freelancer audits | "Starter $25, Standard $80, Advanced $150" (WCAG 2.1 with NVDA); $150 / $300 / $450 for 5 / 10 / 15 pages; $400 / $500 / $600 tiers; a WordPress accessibility audit-and-fix package at $49 / $80 / $120; a US consultant's WCAG audit from $497 to $2,497 (search snippets, not verified; snippets did not tie every tier set to a URL) | https://www.upwork.com/services/product/development-it-a-wcag-2-1-web-accessibility-audit-with-nvda-and-detailed-report-2034965508088824758 , https://www.upwork.com/services/product/development-it-wordpress-website-accessibility-audit-and-fixes-implementation-1777771955846311936 , https://www.upwork.com/services/product/development-it-web-accessibility-audit-based-on-web-content-accessibility-guidelines-wcag-1932563995731944054 |
| Flying Fish (Irish web agency) daily form testing | Automated daily test submission of one critical contact/booking form, alert if the email does not arrive | "one-time setup fee of €50 and a monthly price of €10", sold only with its Website Care plans | https://flyingfish.ie/daily-form-testing/ |
| ETM&Y Contactformchecker (WordPress plugin + service) | Fills in the real contact form daily and alerts if the email does not arrive within about two hours | Plugin free; requires subscription at €10 per month | https://ja.wordpress.org/plugins/etmy-contactformchecker/ |
| MoniForm | Form monitoring | $10–$30 per month, plus limited free version (AlternativeTo listing) | https://alternativeto.net/software/moniform/about |
| SEOptimer (agency lead-gen widget) | Free automated website audit embedded on agency sites to capture leads | "White Label & Embedding: $59/month" (paid by the agency; the prospect gets the audit free); Insites (a competing vendor) describes SEOptimer as used by over 2,000 agencies (uncited claim) | https://seoptimer.com/pricing |
| Professional manual audits | Agency WCAG audits | "$1,500 to $5,000" for most professional website audits (vendor-published guide, vendor claim) | https://www.webability.io/blog/wcag-audit-cost |

### 4. Evidence that buyers currently spend money on this

#### Verified facts
- None. Every page needed (Fiverr, Upwork, vendor pricing pages, SEC, FTC) was blocked from fetching in this environment. Fetch list to verify later: the URLs in the table above plus the two below.

#### Spend signals seen in search snippets (not verified)
1. **AudioEye (public company, NASDAQ: AEYE), FY2025:** revenue $40.3 million, up 15%; about 131,000 customers at 31 Dec 2025, growth "primarily driven by additions in the Partner and Marketplace channel" (search snippet of the company's 5 March 2026 results release / SEC 8-K exhibit, not verified). https://www.audioeye.com/post/audioeye-reports-record-fourth-quarter-and-full-year-2025-results . Shows many (mostly small) sites pay recurring fees for web accessibility tooling. Caveat: AudioEye sells automated/overlay-style products whose effectiveness is contested by accessibility practitioners.
2. **Overlay price points:** accessiBe and UserWay both about $490/year for a small site (snippets, not verified). Shows a familiar annual price anchor for "accessibility" among small sites.
3. **Equalize Digital:** $190/year single-site plugin; $750/year 5-site tier for small agencies (snippet, not verified).
4. **Freelance marketplaces:** Fiverr accessibility audit gigs about $50–$400; Upwork fixed-price accessibility audits $25–$600 by page count, including a WordPress audit-and-fix package whose entry tier is exactly $49; Fiverr technical SEO audit gigs from $5, with at least one seller at 47,300 orders (snippets, not verified). Shows one-off paid audits are a normal purchase, with heavy price competition at the low end.
5. **Booking/contact-form monitoring is sold as a recurring add-on:** Flying Fish charges a €50 setup plus €10/month per critical form; Contactformchecker €10/month; MoniForm $10–$30/month (search snippets, not verified). This is the closest priced comparable for the booking-form part of the pilot: buyers (or their web agencies) pay small recurring fees to know their form works. https://flyingfish.ie/daily-form-testing/
6. **Counter-signal: automated audits are widely given away free.** Agencies embed free audit widgets as lead magnets (SEOptimer's $59/month embedding tier; an uncited competitor claim of 2,000+ agencies using it), and Insites markets accessibility (ADA/WCAG) audits among its lead-gen audit types (search snippets, not verified). https://insites.com/blog/how-agencies-use-a-free-white-label-seo-audit-tool-to-generate-leads-on-autopilot/ . A small owner may already have received a free automated audit from an agency pitching them.
7. **Regulatory signal against overclaiming:** the FTC announced (3 January 2025) a proposed order requiring accessiBe to pay $1,000,000 over claims its AI plug-in could make any website WCAG-compliant; it bars such claims (search snippets from law-firm and practitioner sources, FTC page not fetched; sources differ on the final-order date). https://adrianroselli.com/2025/01/ftc-catches-up-to-accessibe.html . This supports Amber's "not a WCAG/ADA audit" framing and is a reason not to drift into compliance promises.

### 5. Guesses (labelled)
- Guess: the booking-form check is the most differentiated part of the pilot, because most tools above sell either accessibility or SEO health (form monitoring exists, but as a separate small recurring add-on), and the form-failure pain (lost inquiries) is about revenue rather than law.
- Guess: small owners will respond better to "are you losing bookings through your form?" than to "is your site accessible?", because the accessibility angle reads as a legal threat (and is crowded with overlay vendors).
- Guess: web freelancers/agencies are the more repeatable buyer (they have many client sites) but would want white-label output.

### 6. Test price hypothesis (one-time pilot)
- **Keep $49 for the existing Snapshot; offer the booking-form check as a $79 "Snapshot + booking form" bundle (or +$30 add-on).**
- Booking-form comparables (closest match found): daily form-monitoring services at €10/month plus €50 setup, $10–$30/month. A one-off booking-form check at about $30 equals roughly three months of monitoring. (Suggestion, not evidence: include instructions for the client's own monthly test submission, since agencies recommend exactly that.)
- Basis: $49 sits at the bottom edge of Fiverr accessibility-audit gigs ($50–$400) and Upwork per-page audits ($25–$150 entry), and is about a tenth of the $490/year overlay anchor and a quarter of the $190/year plugin. The +$30 add-on is below one month of form analytics (Zuko $56–$70/month); the $79 bundle is about one month of it. Free tools (WAVE, Lighthouse) cap what an automated-heuristic report can charge.
- Strength of basis: **weak to moderate.** Price comparables exist in volume but none were fetch-verified, and the closest booking-form comparables are recurring monitoring services (€10–$30/month), not one-off checks (no gig or tool found that sells exactly "check my booking form" as a one-off).
- Judgment on $49: it fits what buyers already pay for low-end one-off audits; going higher than about $99 without manual testing would compete with $150–$450 freelancer audits that include screen-reader testing.

### 7. Main objections
- "Is this an ADA/WCAG compliance audit? Will it protect me from a lawsuit?" (It is not, and must not be presented that way; the FTC accessiBe order is the cautionary example.)
- "Lighthouse/WAVE are free." / "An agency already sent me a free audit." / "My Wix/Squarespace/web person already handles this."
- Accuracy: automated heuristics miss most real accessibility issues (WebAIM itself says absence of detected errors does not mean a page is accessible).
- Legal worry (guess): some owners may fear that a written list of known issues creates a record of awareness; the report should avoid legal conclusions.
- Trust in an AI-operated seller reading their site (low concern because only public pages are read).

### 8. Where these buyers gather (not joined, not posted; existence not fetch-verified)
- Reddit: r/smallbusiness, r/Entrepreneur, r/web_design, r/webdev, r/accessibility, r/Wordpress, r/squarespace, r/WIX, r/SEO; trade subs such as r/Contractor, r/HVAC, r/Dentistry, r/hairstylist.
- Platform forums: Wix, Squarespace and WordPress.org support forums; Zoho and Brizy community forums (where the form-failure complaints above were found).
- Facebook groups for Wix/Squarespace/WordPress users and local business groups (guess; not checked).

### 9. Evidence strength
- **Strict (fetch-verified): 1/5.** Nothing could be fetched.
- **Provisional (if snippets hold): 4/5.** Many independent signs of paid demand at low prices (AudioEye's 131,000 customers, $190–$490/year tools, large volume of $50–$400 freelancer audits), but almost none of it is for the booking-form part specifically, and the low end is crowded and price-competitive.

## Offer 7: CRM cleanup and duplicate-lead checks

All items retrieved 2026-10-10 via WebSearch; page fetches blocked, so all are "(search snippet, not verified)" unless stated.

### 1. Buyer
- **Who pays:** the founder, sales manager, marketing/RevOps lead or office manager at a small sales team, agency or service business; often the person who just inherited a messy CRM or is preparing an import, migration or campaign. The marketplace evidence skews to HubSpot users: Insycle's G2 reviewers are about 51% mid-market (search snippet, not verified), i.e. somewhat larger than Amber's 1,000–20,000-contact target.
- **Who uses the output:** the CRM admin or whoever does data entry; they apply merges in the CRM.

### 2. Painful problem (buyers' own words where found)
- HubSpot Community idea "New feature: Bulk Merge for Duplicates": a user with "1890 duplicates for contacts, which requires going through 1890 times"; another with "over 2000 duplicate companies created (I believe in error). It's far to time consuming to merge each one." The thread shows 176 replies; a later user notes "it's been a couple years since your last message saying you moved it to planning" (search snippet, not verified). https://community.hubspot.com/t5/HubSpot-Ideas/New-feature-Bulk-Merge-for-Duplicates/idc-p/400517
- Coefficient guide quoting a RevOps manager on Reddit: over 200,000 contacts "with no lifecycle stages set, so everything landed as a lead" (second-hand, via a vendor blog; search snippet, not verified). https://coefficient.io/hubspot-data-management/bulk-clean-hubspot-contacts-using-ai
- Native tooling gap: HubSpot's own knowledge base lists Data Hub Professional and Enterprise among the subscriptions that include the duplicates tool (search snippet, not verified; article marked beta). https://knowledge.hubspot.com/bulk-reject-potential-duplicates . A third-party page prices Data Hub Professional at "$800/mo flat, $720/mo billed annually" (single source, search snippet, not verified). https://automationatlas.io/answers/hubspot-operations-hub-pricing-2026/
- Cost of the problem: no neutral source quantifying cost was found. Vendor "bad data costs X%" statistics were not used.

### 3. Existing alternatives (published price as shown in snippets; retrieved 2026-10-10)
| Alternative | What it does | Price as shown | URL |
|---|---|---|---|
| HubSpot built-in duplicate manager | Flags and merges duplicate contacts/companies | Requires Data Hub Professional/Enterprise per HubSpot KB; Data Hub Pro "$800/mo flat, $720/mo billed annually" (third-party) | https://knowledge.hubspot.com/bulk-reject-potential-duplicates |
| Insycle | Bulk dedupe, cleanup, formatting for HubSpot, Salesforce, Pipedrive and others | HubSpot listing: Starter "$1 /month" per 1,000 records, minimum 25,000 records, up to 500,000; Insycle support doc example: 50,000 records, all modules, "$125 if paid monthly or $100 if paid annually" | https://ecosystem.hubspot.com/marketplace/apps/insycle , https://support.insycle.com/hc/en-us/articles/6584842792599 |
| Dedupely | Dedupe/merge for HubSpot, Salesforce etc. | Starter "US$32 per month" for up to 30,000 records (HubSpot listing) | https://ecosystem.hubspot.com/marketplace/listing/dedupely |
| Koalify – Merge & Deduplicate | HubSpot fuzzy-match dedupe and merge | Price not shown in snippets; listing says it works with Free, Pro or Enterprise HubSpot | https://ecosystem.hubspot.com/marketplace/listing/koalify-io |
| Cloudingo | Salesforce dedupe | Standard "$2,500 per year", Professional $6,000, Enterprise $10,000 (TechRepublic/FitGap); Vendr median paid $6,750/year | https://www.techrepublic.com/es/article/cloudingo-review/ , https://www.vendr.com/marketplace/cloudingo |
| NeverBounce / ZeroBounce | Email list verification | NeverBounce $0.008 per verification up to 10,000 (about $80 per 10K) or $49/month for up to 10,000; ZeroBounce pay-as-you-go from $39 for 2,000 (third-party comparison pages) | https://prospeo.io/s/neverbounce-pricing-reviews-pros-and-cons |
| Upwork Project Catalog freelancers | Fixed-price CRM cleanup, usually including applying the changes | HubSpot dedupe "Starter $130 Standard $330 Advanced $620"; Python CRM cleanup $120 / $300 / $550; HubSpot audit + cleanup + pipeline rebuild $297; generic CRM cleanup $25 / $75 / $100; HubSpot hygiene audit $150 / $300 / $500 | https://www.upwork.com/services/product/development-it-cleaned-and-deduplicated-hubspot-crm-data-2009658109512520054 (and others listed in section 4) |
| Fiverr CRM cleanup gigs | Freelance dedupe/cleanup | Tiered by volume ("Basic: up to 5,000 contacts, Standard: up to 20,000 contacts, Premium: up to 50,000 contacts"); prices not shown in snippet | https://fiverr.com/reginah11/clean-up-and-organize-your-crm |
| Pipedrive built-in "Merge duplicates" | Native duplicate detection and merge | Included on all plans (Essential to Enterprise) per a third-party review; admin or permitted users only (Pipedrive support article); detection can miss misspellings | https://support.pipedrive.com/article/merge-duplicates , https://www.dropcontact.com/crm-integration/pipedrive-merge-duplicate-tools |
| DIY | Excel/Sheets sorting, CRM's own merge one record at a time; open-source scripts (e.g. PyPI package hubspot-crm-clean) | Free | https://pypi.org/project/hubspot-crm-clean/ |

### 4. Evidence that buyers currently spend money on this

#### Verified facts
- None (fetching blocked). Fetch list to verify later: the HubSpot marketplace listings for Insycle, Dedupely and Koalify; g2.com/products/insycle; the Upwork catalog URLs below.

#### Spend signals seen in search snippets (not verified)
1. **Insycle:** G2 rating 4.7/5 from 192 reviews; HubSpot Marketplace about 7K installs and 4.7 from 62 reviews; a reviewer cites removing 4,000 duplicates and transforming about 20,000 contact numbers; some reviewers call the cost high for their use case. https://www.g2.com/compare/dedupely-vs-insycle , https://ecosystem.hubspot.com/marketplace/apps/insycle
2. **Koalify:** HubSpot listing shows 3K–4K installs and five stars from 80–100+ reviews (varies by captured version). https://ecosystem.hubspot.com/marketplace/listing/koalify-io
3. **Dedupely:** paid HubSpot app from US$32/month. https://ecosystem.hubspot.com/marketplace/listing/dedupely
4. **Cloudingo (Salesforce):** list $2,500–$10,000/year; Vendr reports median buyer spend $6,750/year (range about $4,909–$12,373) from its procurement data. https://www.vendr.com/marketplace/cloudingo
5. **Upwork fixed-price CRM cleanup listings** clustered at $120–$620 per job (five separate sellers found). Examples: https://www.upwork.com/services/product/development-it-crm-data-cleanup-deduplication-expert-1943509675379725300 , https://www.upwork.com/services/product/admin-customer-support-hubspot-crm-audit-cleanup-pipeline-rebuild-7days-2031500511377874482 , https://www.upwork.com/services/product/admin-customer-support-crm-data-cleanup-deduplication-hubspot-zoho-2018665516125276310 . Listings show seller asking prices, not completed sales; order counts were not visible in snippets.
6. **Review-only CRM audits are sold as one-off products** (closest analogue to Amber's no-merge deliverable): Hivehouse Digital "Audit Price: $750" with scope including identifying duplicates and missing data; The Code Accelerator a free findings report, a paid audit with prioritised fix plan at "$250 – $500", and audit plus critical fixes at "$800 – $2,500"; Vantage Point portal audit "$3,500 · EU/UK: €3,000", excluding fixes; an Upwork "HubSpot Portal Audit & Optimization Report" listing (search snippets, not verified). https://inbound.hivehousedigital.com/hubspot-portal-audit , https://thecodeaccelerator.com/hubspot-audit-cleanup , https://vantagepoint.io/packages/hubspot-portal-audit , https://www.upwork.com/services/product/marketing-a-hubspot-portal-audit-optimization-report-to-boost-your-hubspot-roi-2023148538340286093 . Note that free audits are also offered as lead magnets (Code Accelerator "free HubSpot audit").
7. **Email verification is an established paid category** (NeverBounce about $80 per 10,000; ZeroBounce from $39 per 2,000), relevant to the "invalid emails" part of the pilot.

### 5. Guesses (labelled)
- Guess: the strongest pain is the *labour of merging*, not finding duplicates (although consultancies do sell review-only audits at $250–$750, so a findings-only deliverable is a recognised purchase). Amber's pilot finds and explains but does not merge, so a client with 1,800 duplicates still has to merge them one at a time in a CRM without a bulk tool. Pipedrive has a built-in merge tool on all plans (third-party claim; Zoho's equivalent not checked); HubSpot users can buy Dedupely/Koalify/Insycle from about $32/month, which both find and merge.
- Guess: the pilot's best fit is (a) spreadsheet-based or very small CRMs, (b) a pre-migration or pre-import audit where the client wants a reviewable plan before anything is changed, (c) teams who distrust automated merges ("which record should we keep and why").
- Guess: the "stale leads" and "invalid email/phone" parts may be the easier sell for small teams about to run a campaign (they already pay for email verification).

### 6. Test price hypothesis (one-time pilot)
- **$99 for up to 5,000 contacts; $149 for up to 20,000 contacts** (review sheet only, client applies changes).
- Basis: review-only HubSpot audits at $250–$500 (Code Accelerator) and $750 (Hivehouse) from consultancies; Upwork fixed-price cleanup jobs at $120–$620 that *include doing the merges*; app subscriptions at $32–$125/month that also merge; email verification about $80 per 10,000. Amber's deliverable is less (no merging), so the $99 tier sits below the roughly $120 freelancer floor, and the $149 tier sits inside the freelancer band but well under review-only consultancy audits ($250–$750); both are about one to three months of a dedupe app.
- Strength of basis: **moderate** (many consistent comparables across marketplaces and tools), but unverified and the comparables do more than the pilot.

### 7. Main objections
- Data protection: sending a full contact export (personal data of the client's customers) to an AI-operated outside business; may need a data processing agreement (GDPR/UK GDPR) and a deletion promise.
- "Our CRM already flags duplicates" / "Dedupely or Koalify is $32 a month and merges for me."
- Accuracy: fear of wrong merges (fuzzy matching), especially across companies with shared domains.
- Effort: a review sheet still leaves manual merging.
- Exports go stale: by the time the sheet is back, new records exist.

### 8. Where these buyers gather (not joined, not posted; existence not fetch-verified)
- HubSpot Community (community.hubspot.com), including the HubSpot Ideas board where the bulk-merge thread lives; Pipedrive and Zoho community forums; Salesforce Trailblazer Community.
- Reddit: r/hubspot, r/salesforce, r/CRM, r/sales, r/RevOps, r/smallbusiness, r/agency.
- RevOps Slack communities (e.g. RevGenius, Wizards of Ops) (guess; not checked).

### 9. Evidence strength
- **Strict (fetch-verified): 1/5.** Nothing could be fetched.
- **Provisional (if snippets hold): 4/5.** Several independent paid tools with reviews and installs plus five Upwork sellers pricing this exact job at $120–$620; weaker on whether buyers pay for a *review-only* deliverable without merging.

## Offer 8: Customer-support inbox triage with reply drafts

All items retrieved 2026-10-10 via WebSearch; page fetches blocked, so all are "(search snippet, not verified)" unless stated.

### 1. Buyer
- **Who pays:** the founder/owner of a small Shopify or DTC store, a small SaaS founder, or the operations lead at a service business, where support is handled by the owner or one to three people from a shared Gmail/Outlook inbox or an entry-level helpdesk.
- **Who uses the output:** whoever answers support email (owner, a part-time VA, a support hire).

### 2. Painful problem (buyers' own words where found)
- Shopify Community thread "Managing Customer Emails": "I run a small Shopify store, roughly 600 orders/month, with a two man team, I use email as my customer support"; a reply: "Honestly the hardest part isn't even replying to customers, it's figuring out who already replied and where the conversation left off. With a small team, stuff gets buried fast." (search snippet, not verified). https://community.shopify.com/t/managing-customer-emails/621681
- Shopify Community post (itself a pitch for free help) listing the usual flood: "'Where's my order?' inquiries, refund requests, mounting support tickets" (search snippet, not verified). https://community.shopify.com/t/drowning-in-customer-service-tickets-order-update-emails-free-help-11-years-experience/567954
- Vendor-side framing (not buyer words): VA agencies pitch to owners answering customer emails "at night and on weekends" (search snippet, not verified). https://stealthagents.com/shopify-virtual-assistant
- Cost: no neutral source found that quantifies the cost of slow support for small stores; vendor statistics not used.

### 3. Existing alternatives (published price as shown in snippets; retrieved 2026-10-10)
| Alternative | What it does | Price as shown | URL |
|---|---|---|---|
| Gorgias | E-commerce helpdesk; AI Agent drafts/answers | Shopify App Store listing: "Starter plan $10 / month, $0.40 per each additional ticket, 3 customer support agents, 50 tickets per month included"; Basic "$60 / month" for 300 tickets (third-party reviews show $50); AI resolutions about $1.00 each monthly / $0.90 annual (third-party) | https://apps.shopify.com/helpdesk , https://www.dragapp.com/blog/gorgias-pricing/ |
| Help Scout | Shared inbox/helpdesk with AI Drafts | "$25, $45 or $75 per user per month billed annually ($30, $54 or $90 month to month)"; AI Drafts from Plus ($45); free plan up to 5 users / 100 contacts; AI Answers $0.75 per resolution (third-party pages) | https://featurebase.app/blog/helpscout-pricing , https://www.usecarly.com/blog/help-scout-ai/ |
| Intercom Fin | AI agent on Intercom or other helpdesks | "$0.99 per billable outcome", minimum 50 outcomes/month standalone; seats $29–$139 (third-party pages) | https://pluno.ai/blog/intercom-fin-ai-pricing |
| eDesk / Re:amaze | Helpdesks for marketplace sellers / chat-social | eDesk "$39/agent/month" (eDesk's own blog); Re:amaze Basic $20, Pro $40, Plus $60 per agent/month | https://www.edesk.com/blog/best-help-desk-apps-for-shopify |
| Google Workspace with Gemini ("Help me write" in Gmail) | AI email drafting inside the inbox itself | Business Standard about $14/user/month annual or $16.80 monthly; Gemini now bundled, separate add-on discontinued (third-party pricing pages) | https://eesel.ai/blog/gemini-workspace-pricing |
| Shopify Inbox / Gmail | Free basic inbox | Free | https://www.ringly.io/blog/customer-service-for-shopify |
| Fiverr support VAs | Human email support | $7/hour (4.9 from 67 reviews); $8/hour; project reviews showing $600–$800 (snippet did not tie each figure to a URL) | https://fiverr.com/junaid_cs/customer-support-email-support , https://www.fiverr.com/dany47 , https://www.fiverr.com/ahmadrq |
| Upwork Project Catalog | Fixed-price inbox support / backlog clearing | "Reliable Customer Support for your Ecommerce Store (Email + Inbox CleanUp)": Starter $60, Standard $150, Advanced $300; Zendesk/Shopify ticket-backlog clearing $250 / $650 / $1,350 | https://www.upwork.com/services/product/admin-customer-support-reliable-customer-support-for-your-ecommerce-store-email-inbox-cleanup-1939515214903073315 , https://www.upwork.com/services/product/admin-customer-support-i-will-clear-your-zendesk-or-shopify-customer-support-ticket-backlog-2060172646883376412 |
| Offshore VA agencies | Monthly outsourced support | "$600 to $900 a month" offshore VA (guide); agency full-time from $1,600/month | https://www.ringly.io/blog/virtual-assistant-for-shopify |

### 4. Evidence that buyers currently spend money on this

#### Verified facts
- None (fetching blocked). Fetch list to verify later: apps.shopify.com/helpdesk (Gorgias reviews and plans), gorgias.com/about-us, helpscout.com/pricing, the Upwork listings and job post above.

#### Spend signals seen in search snippets (not verified)
1. **Gorgias:** "serves over 16,400 merchants" (company About page, self-reported); Shopify App Store "Reviews (629) Overall rating 4.3", with a 7 Oct 2026 comparison citing 705 reviews; entry plan $10/month. https://gorgias.com/about-us , https://apps.shopify.com/helpdesk
2. **AI reply drafting is already a paid, priced feature** in mainstream helpdesks: Help Scout AI Drafts from $45/user/month; Intercom Fin $0.99 per resolution; Gorgias AI about $1 per automated resolution. It is also bundled into Google Workspace (Gemini "Help me write" in Gmail, Business Standard about $14/user/month), i.e. into the plain inbox the target buyer uses.
3. **Human outsourcing at low hourly rates:** Fiverr ecommerce support sellers at $7–$8/hour with dozens of reviews; Upwork fixed-price inbox and backlog services at $60–$1,350.
4. **Inbox backlog clearing is sold as a one-off job** ($250 / $650 / $1,350 Upwork listing), which is the closest analogue to a one-week pilot.
5. **One-off support audits are bought and sold:** an Upwork *buyer* job post "Gorgias Audit & Customer Support KPI Setup" at $200 fixed price; Upwork seller listings for customer-support audits at $160–$960 and $500 / $800 / $1,100; a Zendesk audit and cleanup for e-commerce brands at $295–$950 with a written audit report before changes; free support audits offered as lead magnets (Adelante, HelpFlow) (search snippets, not verified). https://www.upwork.com/freelance-jobs/apply/Gorgias-Audit-Customer-Support-KPI-Setup_~022064642553080951446/ , https://www.upwork.com/services/product/admin-customer-support-a-customer-support-audit-and-action-plan-for-your-business-2060034273872062822 , https://www.upwork.com/services/product/admin-customer-support-a-zendesk-audit-cleanup-for-ecommerce-brands-2033405312844511641 , https://www.getadelante.com/support-audit

### 5. Guesses (labelled)
- Guess: the pain is real and recurring, but a *one-week, one-time* triage is a sample, not relief; buyers who like it will ask "can you do this every day?", which Amber's pilot rules (no sending, no system access) make awkward.
- Guess: stores already on Gorgias/Help Scout/Zendesk will see AI drafts as a feature they already have or can switch on; the realistic pilot buyer is the store still running support from a plain Gmail/Outlook inbox (like the 600-orders/month two-person store above).
- Guess: the categorisation-plus-urgency summary ("what is actually in your inbox this week") may be the more novel value for an owner than the drafts, e.g. to decide whether to buy a helpdesk or hire a VA.

### 6. Test price hypothesis (one-time pilot)
- **$79 for one week up to 150 emails; $149 up to 500 emails.**
- Basis: AI resolution pricing of about $0.75–$1.00 per conversation (drafts that still need human editing are worth less than a resolution); a $7–$8/hour VA handling perhaps 10–20 emails/hour (guess) costs about $0.35–$0.80/email; Upwork one-off inbox support at $60–$300.
- Strength of basis: **weak to moderate.** Most comparables are monthly tools or hourly labour; the closest one-off analogues are support audits ($160–$1,100 sellers; one $200 buyer post), which are broader than a one-week triage. None was fetch-verified.

### 7. Main objections
- Privacy: forwarding a week of customer emails (names, addresses, order details, sometimes payment or health details) to an outside AI-operated business; the client may need consent/DPA language.
- "My helpdesk already drafts replies" (Gorgias, Help Scout, Intercom, Gmail's built-in AI).
- Freshness: by the time drafts come back, customers may have been answered or chased.
- Tone/accuracy: drafts that don't know store policies or order data will need heavy editing.
- Trust: an AI writing to *their* customers, even as drafts.

### 8. Where these buyers gather (not joined, not posted; existence not fetch-verified)
- Shopify Community forums (community.shopify.com), where the threads above were found.
- Reddit: r/shopify, r/ecommerce, r/Entrepreneur, r/smallbusiness, r/SaaS, r/startups, r/CustomerSuccess, r/EtsySellers.
- Facebook groups for Shopify store owners and DTC founders (guess; not checked).

### 9. Evidence strength
- **Strict (fetch-verified): 1/5.** Nothing could be fetched.
- **Provisional (if snippets hold): 3/5.** Strong evidence buyers pay *monthly* for helpdesks and AI drafting and pay hourly for VAs; one-off support audits exist ($160–$1,100) but the drafting part is being bundled into tools buyers already use (helpdesks, Gmail).

## Offer 9: E-commerce product-catalog cleanup and cross-store consistency checks

All items retrieved 2026-10-10 via WebSearch; page fetches blocked, so all are "(search snippet, not verified)" unless stated.

### 1. Buyer
- **Who pays:** the owner or e-commerce/operations manager of a small brand or reseller selling on Shopify plus at least one marketplace (Amazon, Etsy, eBay, Walmart), typically the person who set up a sync app and is now cleaning up oversells, suppressed listings or feed errors.
- **Who uses the output:** the same person or a listing VA, who imports the approved changes.

### 2. Painful problem (buyers' own words where found)
- Shopify Community thread "Marketplace Connect not syncing inventory": sales on one channel not reducing stock on another, leading to oversells and refunds; another poster "oversold three single-unit items in one week" after eBay sales did not change quantities (search snippet, not verified). https://community.shopify.com/t/marketplace-connect-not-syncing-inventory/311671
- Shopify App Store reviews of Etsy sync apps: a seller lost their Etsy "star seller rating, due to customers leaving negative reviews on out-of-stock items, and customer cancellations of orders"; another had to cancel several Etsy orders, which hurt their standing; another's Amazon cancellation rate reached a level that put the account at risk (search snippets, not verified). https://apps.shopify.com/reviews/1184336 , https://apps.shopify.com/reviews/1509160
- **Directly relevant cause:** in one review thread the app vendor replied that the app syncs correctly only when SKU codes (or product names) are aligned between Shopify and Etsy (search snippet, not verified; it came from one of the Etsy-sync review threads linked above, and the snippet did not say which). This is the exact check the pilot performs (SKUs in one store only, mismatched SKUs).
- Amazon Seller Forums: Amazon checks UPCs against the GS1 database; invalid UPC listings can be removed and selling privileges restricted; sellers with legacy third-party UPCs report removals and losing reviews and ranking when relisting (search snippets, not verified). https://sellercentral.amazon.com/seller-forums/discussions/t/2993feae-205e-4ebe-b37a-0e79569c2724 , https://www.ecommercebytes.com/?p=17981 . Note: a GTIN check-digit test catches typos, not whether a code is GS1-licensed to the brand; the pilot must say so.

### 3. Existing alternatives (published price as shown in snippets; retrieved 2026-10-10)
| Alternative | What it does | Price as shown | URL |
|---|---|---|---|
| Trunk – Stock Sync & Bundling | Real-time stock sync between matching SKUs across Shopify, Amazon, eBay, Etsy, Walmart and others | "Essential $35 / month"; $45/mo 101–200 orders, $59/mo 201–400, $89/mo 401–800; 14-day trial | https://apps.shopify.com/trunk |
| Shopify Marketplace Connect (ex-Codisto) | Shopify-owned listing/inventory sync to Amazon, eBay, Walmart, Target Plus, Etsy | "free to install, but additional charges may apply" (plan prices not in snippet) | https://apps.shopify.com/marketplace-connect |
| Etsy Integration – CedCommerce | Shopify–Etsy listing, inventory, price, order sync | "from $9/month"; Beginner $29/month or $313/year; Growth $59/month or $601/year | https://apps.shopify.com/etsy-marketplace-integration |
| DataFeedWatch | Product feed management and optimisation for marketplaces/ads | Shop "$64/month (or $639/year)" for 1,000 SKUs, 3 feeds; Merchant $84/month for 5,000 SKUs; Agency $239/month for 30,000 SKUs; "$5 for every extra 1,000 products" | https://apps.shopify.com/datafeedwatch , https://www.datafeedwatch.com/pricing |
| CleanCatalog – Product Audit | Shopify catalog audit (missing SKUs, images, descriptions, SEO fields) | From $1.99/month (up to 500 products); Pro $9.99/month; listing shows 0 reviews | https://apps.shopify.com/cleancatalog |
| Catalog Health (Synveri) | Shopify audit incl. missing GTINs and duplicate SKU signals | Free; 0 reviews; launched 20 Aug 2026 | https://apps.shopify.com/catalog-health-2 |
| GS1 US | Licensed barcodes (GTINs) | Single GTIN $30, no renewal; prefix for 10 items $250 initial + $50/year; 100 items $750 + $150/year; 1,000 items $2,500 + $500/year (figures cited as GS1 US pricing, possibly Nov 2023) | https://www.junglescout.com/resources/articles/gs1-barcode-jungle-scout/ |
| Upwork Project Catalog | Freelance catalog cleanup / bulk CSV edit | Starter $50, Standard $200, Advanced $400 (about 1,000 / 5,000 / 10,000 products); store management $69 / $129 / $219; automation-oriented $150 / $450 / $1,200 (snippet summary did not tie each tier set to a URL; candidates listed) | https://www.upwork.com/services/product/admin-customer-support-upload-and-manage-your-product-catalog-with-clean-structure-2048401741872705068 , https://www.upwork.com/services/product/admin-customer-support-shopify-store-management-expert-for-ecommerce-brands-2057007157300684289 , https://www.upwork.com/services/product/admin-customer-support-i-will-automate-your-e-commerce-data-and-catalog-management-2069393800179167908 |
| DIY | Shopify CSV export, spreadsheet, re-import; bulk editors (Hextom, Excelify) | Free to low | https://piminto.com/blog/bulk-edit-shopify-products |

### 4. Evidence that buyers currently spend money on this

#### Verified facts
- None (fetching blocked). Fetch list to verify later: apps.shopify.com/trunk, /marketplace-connect, /etsy-marketplace-integration, /datafeedwatch, /cleancatalog, /catalog-health-2; the Upwork listings above.

#### Spend signals seen in search snippets (not verified)
1. **Shopify Marketplace Connect:** about 4.2–4.3 stars from roughly 1,700–2,000 reviews on the Shopify App Store. https://apps.shopify.com/marketplace-connect
2. **Etsy Integration – CedCommerce:** "4.6 (1,185)" reviews; paid plans $29–$59/month. https://apps.shopify.com/etsy-marketplace-integration
3. **Trunk:** about 4.8–4.9 from roughly 390 Shopify reviews; Capterra 4.9 from about 150; paid from $35/month. https://apps.shopify.com/trunk
4. **DataFeedWatch:** paid feed cleanup from $64/month for 1,000 SKUs. https://www.datafeedwatch.com/pricing
5. **Upwork:** multiple sellers price catalog cleanup as fixed jobs from $50 to $1,200 by product count.
6. **Fiverr feed-error fix gigs:** many sellers offer to fix Google Merchant Center feed errors including "missing attributes, invalid GTIN/MPN, incorrect product categories, and price mismatches"; one Basic package covers "up to 5 products"; most ask for Merchant Center or store access (search snippets, prices not shown, not verified). https://fiverr.com/keerah12/fix-google-merchant-center-misrepresentation-gtin-approve-product-feed-errors , https://fiverr.com/masterkey313/fix-google-merchant-center-disapproved-products-and-feed-errors . Shows paid one-off work on the same data problems, usually triggered by a disapproval.
7. **SKU-mapping fixes sold as one-off gigs:** Fiverr sellers offer to "fix shopify amazon mcf integration, sku mapping and fulfillment issues" and "fix product listings and catalog issues on shopify", reviewing SKUs and variants across Shopify and Amazon to find mismatches and correct mappings; they ask for Shopify and Seller Central access (search snippets, prices not shown, not verified). https://fiverr.com/aadeyemo_s/fix-shopify-amazon-mcf-integration-sku-mapping-and-fulfillment-issues , https://fiverr.com/ishriit/fix-product-listings-and-catalog-issues
8. **Counter-signal:** audit-only Shopify apps that do almost exactly the pilot's single-store checks (CleanCatalog, Catalog Health) show **0 reviews** and launched recently; a reviewless app is not evidence of paid demand for audit-only.

### 5. Guesses (labelled)
- Guess: buyers pay readily for *continuous sync* (hundreds to thousands of reviews) but rarely for a *standalone audit*; the pilot sells best as a one-off "before you turn on / after your sync broke" consistency check, positioned next to sync apps rather than against them.
- Guess: the cross-store comparison (SKU in one store only, price/stock mismatch) is the differentiated part; single-store missing-field checks are commoditised by cheap or free apps.
- Guess: Amazon-heavy sellers will care most about GTIN problems, but a check-digit test cannot confirm GS1 ownership, which is what Amazon actually enforces.

### 6. Test price hypothesis (one-time pilot)
- **$99 for two exports up to 1,000 SKUs; $199 up to 5,000 SKUs.**
- Basis: Upwork catalog cleanup at $50 / $200 / $400 for about 1,000 / 5,000 / 10,000 products (which includes doing the edits); DataFeedWatch $64–$84/month for 1,000–5,000 SKUs; sync apps $29–$89/month. A one-off check that the client imports themselves should sit around one to three months of a feed or sync tool.
- Strength of basis: **moderate-weak.** Comparables are plentiful but none was fetch-verified, and the closest product match (audit-only apps) shows no paid traction.

### 7. Main objections
- "My sync app (Marketplace Connect, Trunk, CedCommerce) already handles this." 
- Accuracy and risk: a wrong change imported into a live catalog can break listings or variants; buyers will want to review every row.
- Data: product exports are low-sensitivity (no customer data), which makes this the easiest offer on privacy.
- Format pain: every channel exports differently (Amazon flat files, Etsy CSV, eBay File Exchange), so mapping effort is real and the buyer may doubt an outsider gets it right.
- GTIN: "does this prove my barcodes are valid on Amazon?" (No; only check digits and format.)

### 8. Where these buyers gather (not joined, not posted; existence not fetch-verified)
- Shopify Community (community.shopify.com), Etsy Community forums (community.etsy.com), Amazon Seller Forums (sellercentral.amazon.com/seller-forums), eBay Community.
- Reddit: r/shopify, r/EtsySellers, r/FulfillmentByAmazon, r/AmazonSeller, r/Flipping, r/ecommerce, r/eBaySellers.
- App review sections of sync apps (where the oversell complaints above were found); read-only research source, not a place to post.

### 9. Evidence strength
- **Strict (fetch-verified): 1/5.** Nothing could be fetched.
- **Provisional (if snippets hold): 3/5.** Very strong evidence of paid demand for ongoing sync and feed tools and of real oversell/suppression pain, but weak evidence for paying for a one-off audit: the audit-only apps have no reviews.

## Offer 10: Short-form ad variations from customer-provided video

All items retrieved 2026-10-10 via WebSearch; page fetches blocked, so all are "(search snippet, not verified)" unless stated.

### 1. Buyer
- **Who pays:** the owner or marketing person at a local business (gym, clinic, restaurant, salon, trades) or small DTC brand that already runs or wants to run Meta/TikTok ads and has footage but no editor; also small agencies and freelance media buyers who need more variations for clients (the Upwork job posts below are from brands and buyers needing ongoing edits).
- **Who uses the output:** whoever uploads ads in Meta Ads Manager / TikTok Ads (owner, media buyer).

### 2. Painful problem (buyers' own words where found)
- Upwork job post (buyer side): asks for "15–45 second Meta/Instagram creatives with strong first 1–3 second hooks, clean captions, and different hook variations using the same body footage", about 15 edits a month, starting with a paid test edit; listed fixed price $150 (search snippet, not verified; URL matched by post title, and the snippet did not say whether $150 covers the test or the month). https://www.upwork.com/freelance-jobs/apply/Meta-Ads-UGC-Video-Editor-for-Fashion-Brand-Ongoing_~022103828460516379060/
- Upwork job post: fixed price $225 for 3–4 vertical variations per ad set, roughly 15–60 seconds each (search snippet, not verified; the summary did not say which of these two posts carried the $225, so both are listed). https://www.upwork.com/freelance-jobs/apply/Video-Editor-for-Short-Ads_~022061485079392137032/ , https://www.upwork.com/freelance-jobs/apply/Video-Editor-UGC-Ads-for-commerce_~022093112524775755201/
- Upwork job post: "Video Editor for High-Volume Ad Creatives (25–100 Videos/Week)" at about AUD 10 per video (search snippet, not verified). https://www.upwork.com/freelance-jobs/apply/Video-Editor-for-High-Volume-Creatives-100-Videos-Week_~022065162640761769665
- Creative fatigue: practitioner and vendor blogs put Meta refresh cycles at roughly 7–21 days at meaningful spend, but also note small budgets "may never reach the frequency threshold" (search snippets, not verified; vendor sources with an interest in selling creative). https://www.chatterbuzzmedia.com/blog/facebook-ad-fatigue/ , https://support.socastdigital.com/portal/en/kb/articles/article-13-11-2025
- **Caution relevant to the pilot design:** independent Meta-ads practitioner Jon Loomer describes "creative diversification" under Meta's Andromeda system as varying concepts, angles, formats and personas, not just versions of the same idea; an agency heuristic says about 70% of a creative should look visually distinct for Meta to treat it as new, and that 3–5 genuinely different creatives are usually enough for small businesses (search snippets, not verified; not Meta's own statements). https://www.jonloomer.com/meta-andromeda-creative-diversification/ , https://www.excitemedia.com.au/meta-creative-diversification/ . Three hook-only variations of one clip may be treated as near-duplicates.

### 3. Existing alternatives (published price as shown in snippets; retrieved 2026-10-10)
| Alternative | What it does | Price as shown | URL |
|---|---|---|---|
| Fiverr short-form ad editors | Edit Reels/TikTok ads from supplied footage | Typical "Up to $50" per video; $50–$100; TikTok ads specialist $100–$200; hourly $20 (Reel Cut); several gigs 4.7–4.8 from 27–45 reviews | https://fiverr.com/nurrasyl/edit-and-improve-your-videos-on-lofty-level , https://fiverr.com/jaronpfeifer/edit-reels-or-tiktoks , https://www.fiverr.com/reelcut |
| Fiverr video-ad studios | Video ads & commercials | SoftBright: 4.9, "1200+ satisfied clients", 1,378 reviews, $60/hour; Faraz Z.: 4.8 from 442 reviews, $50/hour | https://www.fiverr.com/softbright , https://www.fiverr.com/fajizfr |
| Contra freelancer | Short-form Reels/TikTok ads | "$40 USD per video" (up to 30 seconds) | https://contra.com/s/2emZQqcl-short-form-video-ads-reels-and-tik-tok |
| Billo (UGC marketplace) | Creator-filmed UGC videos | About $99 per video (third-party; Billo no longer shows public prices); bundles 6 for $500, 14 for $1,000 | https://ainfluencer.com/billo/ |
| UGC creators (direct) | Filmed and edited ad videos | Starter $150–$300; standard with captions and one revision $300–$750; 3-hook test bundles $450–$750 (creator-pricing guides) | https://www.creatorsjet.com/blog/how-to-price-your-ugc-videos-simple-guide-for-creators , https://voxbooster.com/blog/ugc-creator-statistics-2026 |
| Creatify | AI video ads (avatars, AI shorts) | Starter about $39/month (100 credits), Pro about $99/month; about $1.65–$1.95 per 15-second ad (third-party trackers) | https://toolradar.com/tools/creatify/pricing |
| OpusClip | AI clipping of long video into vertical clips with captions | Starter $15/month (150 minutes), Pro $29/month (300 minutes) (third-party) | https://www.castmagic.io/fr/blog/opus-clip-pricing |
| Meta Advantage+ generative AI creative tools | Inside Ads Manager: text and headline variations, image variations, multi-scene video ads from up to 20 product stills, AI voices (announced at Cannes Lions, June 2025) | Price/free access not stated in the snippets (not verified) | https://www.campaignasia.com/article/meta-expands-advantage-with-gen-ai-ad-creativity-tools-for-advertisers/503131 |
| CapCut Pro / Canva Pro (DIY) | DIY editing, auto captions, resize to 9:16 | CapCut Pro about $19.99/month or $179.99/year; Canva Pro about $18/month or $180/year (third-party, Sept 2026 checks) | https://eesel.ai/blog/capcut-pricing , https://designrr.io/canva-pricing/ |

### 4. Evidence that buyers currently spend money on this

#### Verified facts
- None (fetching blocked). Fetch list to verify later: the three Upwork job posts above, fiverr.com/softbright, fiverr.com/fajizfr, the Contra listing.

#### Spend signals seen in search snippets (not verified)
1. **Buyer-side job posts on Upwork** for exactly this job (hook variations from the same footage, vertical, captions): $150 and $225 fixed-price posts; a high-volume post at about AUD 10/video. These are budgets buyers published, the most direct kind of spend evidence found for any of offers 6–10.
2. **Other job posts for the same work** (search snippets, not verified): a Freelancer.in project for "5–10 short-form video ads (TikTok/Reels format)" with varied hooks and angles; an OnlineJobs.ph listing at $5/hour, 20 hours a week, including "creating variations of videos for A/B testing"; a DTC Shopify listing at $800/month for 5 hours a week asking for "multiple variations of proven-winning ads". https://www.freelancer.in/projects/short-form-video-creator-for , https://www.onlinejobs.ph/jobseekers/job/1468299 , https://www.onlinejobs.ph/jobseekers/job/1620342
3. **Fiverr volume:** video-ad sellers with 1,378 and 442 reviews; many short-form ad gigs priced around $50 per video; an older article counts over 17,000 animated video ad gigs (old, not current). https://www.websiteplanet.com/blog/best-cartoon-video-ad-creators
4. **UGC marketplaces** charge about $99–$150 per finished video (Billo, Trend, Insense per third-party reviews).
5. **AI tools** for the same output are cheap ($15–$99/month), and Meta itself now generates text and video variations inside Ads Manager (June 2025 announcements), capping what a pure-editing service can charge.

### 5. Guesses (labelled)
- Guess: local businesses are the harder buyer (many don't run paid social at all, or spend too little for fatigue to matter); small DTC brands and freelance media buyers already buying edits are the easier buyer.
- Guess: "three hooks on the same body" is a recognised request (it appears verbatim in a job post), but under Meta's current system the buyer may value one genuinely different angle more than two extra hooks.
- Guess: music in client footage is a hidden rights problem (platform-licensed music in organic posts often cannot be reused in ads).

### 6. Test price hypothesis (one-time pilot)
- **$99 for the pilot (three 15-second 9:16 variations, captions, caption files, cut sheet, one revision); test $149 as the alternative.**
- Basis: Fiverr/Contra per-video edits at $40–$100 (so three is $120–$300 at market); Upwork buyer posts at $150 (scope unclear: test edit or monthly batch) and $225 for 3–4 variations (about $56–$75 each); UGC at $99–$150 per video including filming (which the pilot does not do).
- Strength of basis: **moderate.** Seller prices ($40–$100 per video) and the $225 buyer post (about $56–$75 per variation) roughly agree; high-volume posts go far lower (about AUD 10/video) and AI tools cost $15–$39/month. $99 for three (about $33 each) is below typical per-variation rates, suitable as an introductory pilot; $149 (about $50 each) sits at the low end of the market. None was fetch-verified.

### 7. Main objections
- "Will these ads perform?" (No performance promises; the buyer must test them.)
- "I can do this myself in CapCut/Canva" or "OpusClip does it for $15–$29 a month."
- Quality and brand voice: hook lines written by an AI-run business may not fit the brand; one revision may not be enough.
- Rights: does the client own the footage and the music; do people in the video consent to ad use.
- Platform fit: hook-only variations may be treated as similar creatives (see Jon Loomer / Andromeda note).
- Trust: sending raw footage to an outside business (low sensitivity unless customers or staff appear).

### 8. Where these buyers gather (not joined, not posted; existence not fetch-verified)
- Reddit: r/FacebookAds, r/PPC, r/TikTokAds, r/marketing, r/socialmedia, r/smallbusiness, r/ecommerce, r/shopify, r/dropship.
- Practitioner communities and newsletters around Meta ads (e.g. Jon Loomer's site and community) (not checked).
- Local business Facebook groups and chamber-of-commerce groups (guess; not checked).

### 9. Evidence strength
- **Strict (fetch-verified): 1/5.** Nothing could be fetched.
- **Provisional (if snippets hold): 4/5.** Buyer-side job posts for the exact deliverable, high-review sellers and UGC marketplaces show steady paid demand at $40–$225 per small batch, which fits a small pilot; the market is crowded and price-competitive.

## Summary table

Nothing below is fetch-verified (see Blocker); the "verified" columns therefore say "none verified" and give the strongest search-snippet evidence instead. Scores: **strict** applies the sprint rubric literally (fetch-verified only, so 1 for every offer); **provisional** is the score if the snippets hold up when fetched.

| Offer | Buyer | Strongest verified spend evidence | Price range seen (verified) | Pilot price hypothesis | Evidence strength (1–5) |
|---|---|---|---|---|---|
| 6. Website health, accessibility + booking-form report | Owner or office manager of a small booking/inquiry business (salon, clinic, trades, studio) on Wix/Squarespace/WordPress; secondarily small web agencies | None verified. Strongest snippets: AudioEye FY2025 revenue $40.3M and about 131,000 customers; overlays about $490/year; Fiverr accessibility audits about $50–$400; an Upwork WordPress audit-and-fix package with a $49 entry tier; daily form monitoring €50 setup + €10/month | None verified. Snippets: free (WAVE, Lighthouse, agency lead-magnet audits) → $25–$600 freelance audits → $190–$490/year tools → $1,500–$5,000 professional audits; form monitoring €10–$30/month | Keep $49 Snapshot; $79 Snapshot + booking-form check (or +$30 add-on). Basis weak–moderate | 1 strict / 4 provisional (booking-form part alone about 3) |
| 7. CRM cleanup and duplicate-lead checks | Founder, sales/marketing ops or office manager at a small sales team, agency or service business with 1k–20k contacts (evidence skews to HubSpot) | None verified. Strongest snippets: Insycle 4.7 from 192 G2 reviews and about 7K HubSpot installs; Koalify 3–4K installs; five Upwork sellers at $120–$620 per cleanup; review-only HubSpot audits at $250–$750 | None verified. Snippets: dedupe apps $32–$125/month; Upwork $25–$620 per job; consultancy audits $250–$3,500; Cloudingo $2,500–$10,000/year | $99 up to 5,000 contacts; $149 up to 20,000. Basis moderate | 1 strict / 4 provisional |
| 8. Support inbox triage with reply drafts | Owner or ops lead of a small Shopify/DTC store, SaaS or service business answering support from a plain shared inbox | None verified. Strongest snippets: Gorgias "over 16,400 merchants" (self-reported) and 629–705 Shopify reviews; Help Scout AI Drafts from $45/user/month; Upwork buyer post "Gorgias Audit & Customer Support KPI Setup" at $200 | None verified. Snippets: helpdesks $10–$60/month entry; AI $0.75–$1.00 per resolution; VAs $7–$8/hour; one-off support audits $160–$1,100 | $79 for one week up to 150 emails; $149 up to 500. Basis weak–moderate | 1 strict / 3 provisional |
| 9. Catalog cleanup and cross-store consistency | Owner or ops manager at a small brand selling on Shopify plus Amazon/Etsy/eBay/Walmart, 100–5,000 SKUs | None verified. Strongest snippets: sync apps with large review bases (Marketplace Connect about 1,700–2,000; CedCommerce Etsy 1,185; Trunk about 390); DataFeedWatch $64/month for 1,000 SKUs. Counter-signal: audit-only catalog apps show 0 reviews | None verified. Snippets: sync apps $9–$89/month; feed tools $64–$239/month; Upwork catalog cleanup $50–$1,200; GS1 $30 per GTIN | $99 for two exports up to 1,000 SKUs; $199 up to 5,000. Basis moderate–weak | 1 strict / 3 provisional |
| 10. Short-form ad variations from client video | Owner or marketer at a local business or small DTC brand with footage running Meta/TikTok ads; freelance media buyers | None verified. Strongest snippets: Upwork *buyer* job posts at $150 and $225 for hook/vertical variations with captions from the same footage; Fiverr video-ad sellers with 1,378 and 442 reviews | None verified. Snippets: $40–$200 per edited video (Fiverr, Contra); $99–$150 per UGC video; AI tools $15–$99/month; buyer posts $150–$225 per batch | $99 for three variations (test $149). Basis moderate | 1 strict / 4 provisional |

### Three findings most relevant to choosing the next build cycle
1. **Offers 10 and 7 have the most direct evidence of buyers paying for the exact one-off job at pilot-sized prices.** For 10: buyer-side Upwork posts asking for "different hook variations using the same body footage" with captions ($150, $225), plus high-review Fiverr sellers. For 7: a dense band of fixed-price CRM cleanup listings ($120–$620), review-only HubSpot audits ($250–$750) and dedupe apps with thousands of installs. Caveats: in 7 the pain buyers actually voice is merging by hand ("1890 duplicates ... going through 1890 times"), which the pilot leaves to the client. In 10, independent practitioners say Meta now rewards genuinely different concepts, so three hook-only cuts of one clip may count as near-duplicates; cheap substitutes (Meta's own generative tools, OpusClip, CapCut) also cap the price.
2. **Offers 8 and 9 address real pain but compete with tools buyers already pay for monthly.** For 8, AI drafting is already priced into helpdesks (Help Scout Plus $45/user, Gorgias about $1 per resolution, Intercom $0.99) and bundled into Gmail through Google Workspace (about $14/user). For 9, continuous sync apps dominate (thousands of reviews), while the audit-only Shopify catalog apps closest to the pilot have 0 reviews. The pain is real: oversells cost a seller Etsy Star Seller status, one sync vendor says sync only works when SKUs are aligned, and one store owner wrote "stuff gets buried fast". But spend evidence for the *one-off* format is weak. Either give these lower priority or reposition them: 9 as a "sync-readiness check" before or after a sync app fails, 8 as a one-week "what is in your inbox" review for stores still on plain Gmail.
3. **Offer 6: the $49 price fits the low end of what buyers already pay, and the booking-form check is a sensible add-on rather than a major build.** Comparable prices: Fiverr accessibility audits about $50–$400, Upwork entry tiers $25–$150 (one WordPress audit-and-fix package starts at exactly $49), overlay tools about $490/year, and AudioEye's roughly 131,000 customers. But automated audits are often free (WAVE, Lighthouse, agency lead-magnet widgets), and the legal angle is risky: the FTC's $1M accessiBe order was over claims of automated WCAG compliance, and second-hand reports cite 3,117 federal website suits in 2025. The booking-form part has its own small paid comparable (daily form monitoring at €10/month plus €50 setup; $10–$30/month), and "is your form losing you bookings?" is a revenue pitch, not a legal one. Recommendation: keep $49 and test a $79 bundle.
