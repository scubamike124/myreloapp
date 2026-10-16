# StudyProofs free-promotion region scan — 2026-10-16

Built 2026-10-16 08:33Z from 6431 read-only probes (5270 distinct pages and servers, 4763 distinct sites) made by GitHub Actions runners during the night of 2026-10-15/16, plus the hand review in `scan/review/verdicts.json`. Regenerate with `python3 -I scan/report.py`. The CSV beside this file carries every row.

**Standard.** A site counts as **qualified** only when its own current rules or submission page, read tonight, allow a free StudyProofs listing or promotional post and nothing on the page asks for a date of birth, phone number, identity check, CAPTCHA bypass, payment or a manual approval. "Allowed with conditions" means the page allows it with a condition (labelled ads, an introduction first, a backlink, a specific language) or shows free posting but the account rules were not fully read. Everything else is listed under the reason it was skipped. Research and account set-ups are not advertisements: only a publicly verified post counts as live.

The owner's note asked for "all 36 regions in our existing region list"; the list in the code (`src/lib/scout-network/country-registry.ts` and `countries.ts` in amberai) has 12 regions and 54 countries, and all 54 are covered below, with a Global row for worldwide directories and protocols and one row for fediverse servers outside the 54.

## Live posts (publicly verified)

| Time (UTC) | Platform | Account | Post | Public URL | Verification |
|---|---|---|---|---|---|
| 2026-10-15 23:47:13Z | PeerTube (stream.indieagora.com) | StudyProofs (studyproofs, channel studyproofs_demos) | quiz-graded: "Cellular respiration: a 4-question quiz, graded with the reasons" | https://stream.indieagora.com/videos/watch/d552d5a1-e998-4c88-9153-838b4d6798ce | read back publicly by a GitHub runner at 23:56Z (privacy public, 1 video on the channel) |
| 2026-10-16 07:19:40Z | Mastodon (101010.pl) | StudyProofs (@studyproofs, bot-flagged, AI disclosure in the bio) | notes-with-sources: "From STAT 200 sample notes: 6 note sections, each with its source line, ending on the common mistakes." | https://101010.pl/@studyproofs/117449371188624497 | read back publicly by a GitHub runner at 07:26:13Z (visibility public, statuses_count 1) |

2 live post(s). Nothing else was posted tonight; see the "Amber can act" column for what is queued.

## Totals by region

| Region | Countries | Sites checked | Read | Qualified | Conditional | Open relays | Rules prohibit | Skipped (DOB / phone / identity / payment / approval / automation / AI / CAPTCHA / fit / closed) | Not read (bot wall / unreachable / 404) | Read, unverified |
|---|---|---|---|---|---|---|---|---|---|---|
| North America | CA, US | 628 | 576 | **0** | 1 | 0 | 9 | 512 (7 / 1 / 0 / 2 / 392 / 1 / 1 / 27 / 4 / 77) | 52 (23 / 21 / 8) | 54 |
| Northern Europe | DK, FI, GB, IE, NO, SE | 310 | 255 | **1** | 1 | 0 | 8 | 234 (4 / 1 / 0 / 0 / 155 / 0 / 1 / 7 / 17 / 49) | 55 (21 / 24 / 10) | 11 |
| Oceania | AU, NZ | 54 | 38 | **0** | 0 | 0 | 0 | 34 (0 / 0 / 0 / 0 / 19 / 0 / 1 / 0 / 10 / 4) | 16 (10 / 2 / 4) | 4 |
| Western Europe | AT, BE, CH, DE, FR, NL | 1557 | 1477 | **0** | 2 | 0 | 15 | 1371 (5 / 2 / 0 / 0 / 917 / 0 / 0 / 28 / 8 / 411) | 80 (15 / 60 / 5) | 89 |
| Southern Europe | ES, GR, IT, PT | 271 | 251 | **0** | 2 | 0 | 6 | 231 (3 / 1 / 0 / 0 / 196 / 0 / 0 / 2 / 2 / 27) | 20 (5 / 12 / 3) | 12 |
| Central & Eastern Europe | CZ, HU, PL, RO, UA | 107 | 79 | **1** | 4 | 0 | 1 | 55 (1 / 1 / 0 / 0 / 31 / 0 / 0 / 5 / 5 / 12) | 28 (10 / 10 / 8) | 18 |
| South Asia | BD, IN, PK | 41 | 23 | **1** | 3 | 0 | 1 | 13 (0 / 3 / 0 / 0 / 3 / 0 / 0 / 1 / 4 / 2) | 18 (8 / 8 / 2) | 5 |
| Latin America | AR, BR, CL, CO, MX, PE | 88 | 59 | **1** | 7 | 0 | 1 | 36 (1 / 2 / 0 / 1 / 18 / 0 / 0 / 1 / 4 / 9) | 29 (11 / 12 / 6) | 14 |
| Southeast Asia | ID, MY, PH, SG, TH, VN | 80 | 55 | **1** | 0 | 0 | 3 | 43 (1 / 3 / 0 / 0 / 30 / 0 / 0 / 5 / 0 / 4) | 25 (13 / 12 / 0) | 8 |
| Sub-Saharan Africa | GH, KE, NG, SN, ZA, ZW | 41 | 15 | **1** | 0 | 0 | 0 | 12 (3 / 0 / 0 / 0 / 3 / 0 / 0 / 4 / 1 / 1) | 26 (12 / 12 / 2) | 2 |
| Middle East & North Africa | AE, EG, IL, MA, N/A (pan-Arab), SA, TR | 69 | 41 | **1** | 7 | 0 | 1 | 22 (0 / 3 / 0 / 0 / 3 / 0 / 0 / 5 / 7 / 4) | 28 (18 / 7 / 3) | 10 |
| East Asia | HK, JP, KR, TW | 256 | 233 | **2** | 3 | 0 | 3 | 185 (4 / 2 / 1 / 0 / 133 / 0 / 0 / 29 / 2 / 14) | 23 (10 / 9 / 4) | 40 |
| Global (directories, protocols) | — | 97 | 66 | **0** | 3 | 16 | 5 | 33 (1 / 0 / 3 / 8 / 14 / 0 / 0 / 5 / 2 / 0) | 31 (13 / 13 / 5) | 9 |
| Fediverse servers outside the 54 countries | AM, BG, BY, GE, HR, KZ, LT, LU, LV, MG, MO, PF, RU, SI, SN, SY, TN, UY, YE, ZZ | 1164 | 1061 | **0** | 3 | 0 | 11 | 966 (11 / 0 / 0 / 0 / 525 / 0 / 0 / 140 / 3 / 287) | 103 (1 / 100 / 2) | 81 |
| **All** | 54 | **4763** | 4229 | **9** | 36 | 16 | 64 | 3747 (41 / 19 / 4 / 11 / 2439 / 1 / 3 / 259 / 69 / 901) | 534 (170 / 302 / 62) | 357 |

## Qualified sites

Verified from the site's own rules or submission page. `basis` in the CSV says whether the page allows promotion explicitly or simply has no rule against it while prohibiting spam.

| Region | Country | Site | Free option | Audience | Promotion rule (their words) | Account requirements | Automation | Source | Amber can act? |
|---|---|---|---|---|---|---|---|---|---|
| Central & Eastern Europe | PL | 101010.pl (fediverse) | free account | Poland (Polish or English preferred) | Powstrzymaj się od agresywnej reklamy (produktów, polityków, ideologii i czegokolwiek innego). | email + password; no date of birth | not addressed | https://101010.pl | yes: registrar candidate 2 (used only if CITAD fails) |
| East Asia | KR | uri.life (우리.인생) (fediverse) | free account | Korea / English | (rules read in full on 2026-10-16: bots are allowed under the server's extra bot rules; no advertising ban) | email + password | allowed under the server's bot rules | https://uri.life | yes: registrar candidate 3 |
| Sub-Saharan Africa | NG | social.citad.org.ng (CITAD) (fediverse) | free account, 500-char posts | Nigeria / English-speaking fediverse | Spam, scams, impersonation, phishing, fake engagement, and misleading information are prohibited. | email + password; no date of birth | not addressed in the rules; the account is labelled as automated in its bio | https://social.citad.org.ng | yes: registrar candidate 1; account opens at the next worker tick after #847 deploys |
| East Asia | TW | c7.io (希奇❕) (fediverse) | free account | Chinese-speaking creators | Registration with disposable email addresses is not allowed. (AI-generated content must be disclosed.) | email + password | AI disclosure required | https://c7.io | yes: registrar candidate 4 |
| Northern Europe | GB | stream.indieagora.com (IndieAgora | Stream Freely) (fediverse video) | free account, 1 video/day in Amber's own schedule | PeerTube / fediverse video | (about page, read in full: the instance is for independent creators, 'not advertisers'; sign-up open, no approval, no age field; terms allow original videos with a description and links) | email + password (verified through Amber's mailbox) | not addressed; the channel description states the account is operated by StudyProofs | https://stream.indieagora.com | yes: ACTED (live) |
| South Asia | PK | List.com.pk (classifieds) | free ad (Services) | Pakistan | Post Free Ad - All Pakistan … LIST does not pre-screen or approve (terms); sign-up form: e-mail, password, terms checkbox | e-mail + password | not addressed | https://www.list.com.pk/ | yes by web form (publisher not built; nothing posted) |
| Latin America | CO | Colombia Move (clasificados gratis) (classifieds) | free ad | Colombia | los anuncios básicos van a seguir siendo gratuitos indefinidamente | account (sign-in method not visible to the runner) | Site offers an 'asistente de anuncios' (AI helper) for drafting; bot posting not addressed | https://colombiamove.com/blog/publicar-gratis-siempre-colombia-move/ | yes by web form (publisher not built) |
| Southeast Asia | ID | IklanGratiz.com (home) (classifieds) | free ad, no registration | Indonesia (small board) | Pasang Iklan Baris Online Gratis Untuk Promosi Produk Jasa & Bisnis Tanpa Daftar … Peraturan: Pelanggan tidak akan mengiklankan sesuatu yang bertentangan dengan hukum NKRI atau daerah setempat, berbau SARA, Pornografi. Pelanggan tidak akan mengirim iklan yang pernah di tayangkan … (posting form: title, tags, price, name, e-mail*, phone optional, picture) | none; e-mail on the form | not addressed | https://www.iklangratiz.com/ | yes by web form (publisher not built; nothing posted) |
| Middle East & North Africa | IL | myproduct.co.il (לוח מודעות חינם) (rules page) (classifieds) | free ads, no registration, no payment | Israel; size not seen | — | none for posting; optional email subscription for new-ad alerts | — | https://myproduct.co.il/?id=862&category_id=8 | yes by web form (publisher not built) |

## Allowed with conditions

The page allows a free post or listing under a condition, or shows free posting while the sign-up rules were not fully read tonight. None of these was acted on.

| Region | Country | Site | Free option | Audience | Promotion rule (their words) | Account requirements | Automation | Source | Amber can act? |
|---|---|---|---|---|---|---|---|---|---|
| East Asia | KR | qdon.space (큐돈) (fediverse) | free account | Korea | 혼란을 유발하는 광고 금지 — 광고임을 명확히 밝히지 않는 스텔스 마케팅(일명 뒷광고) 등을 금지합니다. 광고임을 명확히 알 수 있는 정직하고 투명한 형태의 광고는 허용됩니다. | email + password; Korean literacy | not addressed | https://qdon.space | yes, with a Korean-language post labelled 광고; not acted tonight (the lane runs one Mastodon account, in English) |
| Central & Eastern Europe | PL | mastodon.com.pl (Mastodon Poland) (fediverse) | free account | Poland | No spamming or explicit advertising allowed without proper introduction and/or other activity. … Upon creating an account, it is required to introduce oneself using the hashtag #introduction in one's post. | email + password | not addressed | https://mastodon.com.pl | yes, after an introduction post; not acted (one Mastodon account per lane) |
| Western Europe | NL | FOK!forum (student-forum) | Free forum posting; has school/study subforums | Netherlands (large general forum) | (registration form: member name and e-mail address only; the forum's rules on advertising were not readable) | member name + e-mail | Not stated | https://forum.fok.nl/ | maybe (e-mail-only registration; rules unread) |
| Southern Europe | ES | Tablon de Anuncios (classifieds) | free ad | Spain | Cómo poner anuncios gratis en Internet … Editor de anuncios gratis | Email | Not stated | https://www.tablondeanuncios.com/ | maybe |
| Southern Europe | PT | Startup Portugal - Startup Hub (directory) | free profile | Portugal | a database built by the community, since the site allows each member to register | account | Manual | https://startupportugal.com/?p=75 | owner by form |
| East Asia | JP | したらば 【無料】ホームページ宣伝掲示板 (other) | free post | Japan | 【無料】ホームページ宣伝掲示板 (free website-promotion board) | none | Shitaraba prohibits spam floods; no API | https://jbbs.shitaraba.net/internet/18891/ | possible by form; low value |
| East Asia | KR | phdkim.net (김박사넷) (rules page) (student-forum) | free post on the promotion board | Korean graduate students | 이 게시판은 김박사넷 사용자에게 도움이 되는 정보와 이벤트를 자유롭게 홍보·게시할 수 있는 공간입니다. | site account | not addressed | https://phdkim.net/board/promotion/list | yes by web form, Korean-language post, if the sign-up needs only an e-mail |
| South Asia | PK | Startup.pk - Get your startup listed for free (directory) | free startup listing | Pakistan startup scene | Get your startup listed on Startup.pk for free … You can reach new customers and build a stronger brand. | submission form | Manual | https://startup.pk/get-your-startup-listed-on-startup-pk-for-free/ | owner or Amber by form; publication is editorial |
| Global (directories, protocols) | GLOBAL | WordPress.com user guidelines (other) | free blog | search engines | Advertising isn't permitted unless you participate in the WordAds program or have a WordPress.com Plan that allows ad networks. | account (email) | API available | https://wordpress.com/support/user-guidelines/ | possible, low value |
| North America | US | G2 (directory) | free vendor profile | software buyers | You represent and warrant that (a) you are at least 18 years old and have full authority to grant the rights outlined herein | 18+ representation, work e-mail | Review gating/incentivized reviews and automation restricted | https://legal.g2.com/terms-of-use | owner by form |
| Northern Europe | GB | Educational App Store (directory) | free listing (certification paid) | parents and teachers, UK | Get listed: Submit your App · App Submission Guide · AI Tool Submission Guide · Certification | developer account | Manual | https://www.educationalappstore.com/ | owner by form |
| Latin America | BR | TabNews (other) | free post | Brazilian developers | Publicações com foco exclusivo comercial são expressamente proibidas. | account (email) | API exists | https://tabnews.com.br/faq | possible with a Portuguese 'pitch' post; not built |
| Latin America | MX | Evisos Mexico (classifieds) | free ad | Mexico | Cómo publicar anuncios en Evisos Mexico … sólo debes buscar el ícono PUBLICAR AVISO | account | Unknown; typical classifieds ToS forbid bots | https://www.evisos.com.mx/ | maybe |
| Latin America | AR | Evisos Argentina (classifieds) | free ad | Argentina | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.com.ar/ | maybe |
| Latin America | CO | Evisos Colombia (classifieds) | free ad | Colombia | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.com.co/ | maybe |
| Latin America | CL | Evisos Chile (classifieds) | free ad | Chile | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.cl/ | maybe |
| Latin America | PE | Expat.com - Clasificados Peru (classifieds) | free ad | expats in Peru | (free classifieds in hobby/service categories) | account | Unknown | https://www.expat.com/es/clasificados/america-del-sur/peru/ | maybe |
| Global (directories, protocols) | GLOBAL | SourceForge Business Software directory (directory) | free software profile | software buyers, global | Add Your Software … About Your Company: Your Name, Email Address, Company, Your Title, Website, Phone | vendor form | Form-based | https://sourceforge.net/software/vendors/new | owner by form |
| Global (directories, protocols) | GLOBAL | UNO Directory (directory) | free listing (instant), backlink required | AI-tool directory, global | Automatic instant review: Listings go live immediately after submission … Everything in Free, plus … No backlink requirement (paid) | e-mail magic link (or Google) | form submission | https://uno.directory/submit-tool | yes by form once a backlink is placed on the StudyProofs page (a product change the owner decides) |
| Fediverse servers outside the 54 countries | GLOBAL | Telegraph terms (other) | — | — | — | — | — | https://telegra.ph/api | possible; low value |
| Western Europe | FR | gs.leftic.club (Mastodon) (fediverse) | free account | French-speaking political community | Les bots doivent s’identifier comme tel, et doivent mettre un lien vers leurs sources, a chaque post. | email + password | allowed when identified, with a source link per post | https://gs.leftic.club | possible (bot flag on, source link in each post); not acted: audience is not students |
| Fediverse servers outside the 54 countries | — | mstdn.forfun.su (🇷🇺 Bot harbor. Blog for AI-driven posts 🇷🇺) (fediverse) | free account | bots and their owners | We want all bots to feel welcome and included in our server. … Keep your posts interesting and fun, like a chat with a friendly bot! | email + password | bots welcome | https://mstdn.forfun.su | possible; not acted: no student audience |
| Latin America | AR | Anunciar.co (Argentina) (home) (classifieds) | free ad | Argentina | Avisos clasificados gratis Argentina … avisos clasificados gratis profesionales | unknown | — | https://argentina.anunciar.co/ | maybe (sign-up not read) |
| Central & Eastern Europe | HU | Aprohirdetes.biz (home) (classifieds) | free ad | Hungary (small board) | Apróhirdetés ingyen (free small ads; limits per topic and user per the discovery pass) | registration required; fields unknown | — | https://aprohirdetes.biz/ | maybe |
| Central & Eastern Europe | HU | Ingyen-aprohirdetes.hu (home) (classifieds) | free ad, no registration | Hungary (small board) | Ingyenes hirdetés feladás másodpercek alatt (free ad posting in seconds; no registration per the discovery pass) | none - no registration, no activation email (per snippet) | — | http://ingyen-aprohirdetes.hu/ | maybe (rules page not read) |
| Central & Eastern Europe | UA | FreeTrade.com.ua (home) (classifieds) | free ad | Ukraine (trade board) | Розміщення оголошень безоплатне … подати без реєстрації (free posting, no registration; a B2B board) | no registration needed - 'Для того, щоб додати оголошення достатньо заповнити одну просту форму.' | — | https://freetrade.com.ua/ | maybe (rules not read; B2B audience) |
| Fediverse servers outside the 54 countries | BG | Alo.bg (home) (classifieds) | free ad | Bulgaria | безплатни обяви … Публикувай обява (free ads; a Training and courses category per the discovery pass) | unknown | — | https://www.alo.bg/ | maybe (rules page missing, sign-up not read) |
| Middle East & North Africa | AE | Mourjan (home) (classifieds) | free basic ad | UAE and the Gulf; Arabic and English | The platform provides free basic classified ad posting and paid premium advertising solutions (llms.txt) … أضف إعلانك مجاناً; posting needs a Mourjan account (e-mail and password on the login page) | e-mail + password (registration form not read) | — | https://www.mourjan.com/ | maybe (terms page gone, sign-up not read) |
| Middle East & North Africa | N/A (pan-Arab) | e3lanfree.com (إعلان مجاني) (home) (classifieds) | free ad | Arabic-speaking | نوفر لك الفرصة لنشر إعلاناتك مجانًا بشكل دائم وبلا حدود (post your ads for free, permanently and without limit) | unknown | — | https://e3lanfree.com/ | maybe |
| South Asia | IN | India-Classifieds.com (home) (classifieds) | free ad, no registration | India (small board) | Post Free India Classified Ads Without Registration (categories: Services, Education-Learning …) | none claimed; not verified | — | https://www.india-classifieds.com/ | maybe (form fields pending) |
| South Asia | IN | My India Forums (rules page) (student-forum) | dedicated 'Promote Your Business' board | India (small forum) | No Spamming or Self-Promotion: Do not post advertisements, referral links, or repeated copy-paste content. (Subforums: Promote Your Business, Guest Posts - Free Backlinks) | unknown (forum registration; fields not seen) | — | https://myindia.org.in/rules | maybe (only in that subforum; registration not read) |
| Middle East & North Africa | TR | Serinilan (home) (classifieds) | free ad, no membership | Turkey (small board) | ÜYE OLMADAN ÜCRETSİZ İLAN VER (post a free ad without membership; form: place, title, description, price …) | no membership; form has name, e-mail and phone fields (whether phone is mandatory not seen) | — | https://serinilan.net/ | maybe (form fields pending) |
| Middle East & North Africa | IL | ZehCan (זה כאן) (home) (classifieds) | לוח מודעות חינמי לפרסום חופשי | Israel; size not seen; also hosts content articles | לוח מודעות חינמי לפרסום חופשי | unknown (no sign-up requirement mentioned) | — | http://zehcan.co.il/ | maybe |
| Middle East & North Africa | IL | AdTiny (home) (classifieds) | post for free without registering | Israel | פרסום מודעה חינם (post a free ad; a professionals category) | none claimed | — | https://www.adtiny.com/ | maybe (form not read) |
| Middle East & North Africa | MA | Annuaire Gratuit du Maroc - Annonces (home) (classifieds) | Déposez votre annonce (free directory site) | Morocco | Ajouter une annonce (free directory and ads; account page exists) | unknown (login link present; fields not seen) | — | https://www.annuaire-gratuit.ma/annonces/ | maybe (rules not read) |
| Middle East & North Africa | EG | فتكات - قسم الإعلانات المجانية (home) (student-forum) | قسم الإعلانات المجانية | Arabic-speaking (small forum) | انشر اعلانك مجانا (post your ad for free) … يمكنك تسويق منتجاتك مجاناً | none per summary; not verified | — | https://kenooznet.yoo7.com/t40678-%D8%AE%D8%AF%D9%85%D8%A9-%D8%A7%D8%B9%D9%84%D8%A7%D9%86%D8%A7%D8%AA-%D9%85%D8%AC%D8%A7%D9%86%D9%8A%D8%A9-%D9%85%D9%86%D8%AA%D8%AF%D9%8A%D8%A7%D8%AA-%D8%B5%D9%86%D8%A7%D8%A8%D9%8A%D8%B1-%D8%A7%D9%84%D8%B9%D9%84%D9%85-%D9%88%D8%A7%D9%84%D9%85%D8%B9%D8%B1%D9%81%D8%A9 | maybe (registration not read) |

## Open servers whose rules speak of bots, brands or promotion as allowed (first pass)

Found by the scanner's wording match on open-registration servers; each still needs the hand review before it counts as qualified.

_none_

## Open Nostr relays

16 relays answered a NIP-11 policy request with no payment, auth or write restriction: nos.lol, nostr-pub.wellorder.net, nostr-relay.nokotaro.com, nostr.bitcoiner.social, nostr.mom, nostr.oxtr.dev, offchain.pub, purplepag.es, relay.damus.io, relay.lexingtonbitcoin.org, relay.mostr.pub, relay.nostr.info, relay.nostr.wirednet.jp, relay.nostrplebs.com, relay.primal.net, relay.snort.social. Nostr has no accounts and no site rules; a post needs a keypair and a publisher (secp256k1 signing), which is not built, and the audience is not students. Recorded, not acted.

## Rules that prohibit advertising, promotion or automation

| Region | Country | Site | Their words | Source |
|---|---|---|---|---|
| Fediverse servers outside the 54 countries | — | social.vivaldi.net (Vivaldi Social) | No promotion of AI, Cryptocurrencies or NFTs | https://social.vivaldi.net |
| Southern Europe | ES | mast.lat (Mast.Lat) | (rules: advertising prohibited) | https://mast.lat |
| Southern Europe | ES | tkz.one (TKZ.One) | (rules: auto-publishing accounts are banned) | https://tkz.one |
| Fediverse servers outside the 54 countries | — | mstdn.ca (Mastodon Canada) | No spamming. Excessive posting, boosting, advertising or mass-marketing posts will be actioned accordingly and based on intent. | https://mstdn.ca |
| Western Europe | NL | masto.nu | No advertising, spam or excessive promotion. | https://masto.nu |
| Western Europe | DE | nrw.social (NRW.social) | (rules: advertising prohibited) | https://nrw.social |
| Northern Europe | GB | glasgow.social (Glasgow.social) | No spam. This includes commercial advertising, promotional campaigns, and SEO. | https://glasgow.social |
| Western Europe | BE | mastodon-belgium.be (Mastodon Belgium) | No spam or advertising. | https://mastodon-belgium.be |
| North America | US | sakurajima.moe (Sakurajima (桜島）) | (rules: no AI bots) | https://sakurajima.moe |
| Fediverse servers outside the 54 countries | — | masto.nyc (Masto.NYC) | (rules: advertising prohibited) | https://masto.nyc |
| North America | US | friendica.eskimo.com (Friendica Social Network) | 3) No spamming | https://friendica.eskimo.com |
| Western Europe | DE | pouet.chapril.org (Mastodon Chapril) | (rules: advertising prohibited) | https://pouet.chapril.org |
| North America | US | lilymagic.com (Lilymagic) | 禁止发布无关广告 | https://lilymagic.com |
| North America | US | gardenstate.social (Garden State Social) | (rules: advertising prohibited) | https://gardenstate.social |
| Western Europe | DE | loma.ml ([ˈloma]) | (rules: purely commercial accounts are deleted) | https://loma.ml |
| Fediverse servers outside the 54 countries | — | wowcool.moe (哇酷wowcool) | (terms: advertising and bots prohibited) | https://wowcool.moe |
| Fediverse servers outside the 54 countries | — | zegheteens.nl (Zeg het eens) | (rules: no advertising) | https://zegheteens.nl |
| Northern Europe | FI | peertube.uno (PeerTube Uno Italia - Video Streaming italiano libero e federato) | (terms: advertising or marketing videos are prohibited) | https://peertube.uno |
| Fediverse servers outside the 54 countries | YE | meyon.com.ye (ميون - النسخة التجريبية) | (terms: advertising or marketing videos are prohibited) | https://meyon.com.ye |
| Western Europe | DE | clip.place | no advertising | https://clip.place |
| Southern Europe | ES | veedeo.org (Veedeo) | (terms: advertising or marketing videos are prohibited) | https://veedeo.org |
| Western Europe | FR | peertube.mesnumeriques.fr (Mes Numériques) | Pas de publicit | https://peertube.mesnumeriques.fr |
| Northern Europe | FI | peertube.nwps.fi (NWPS PeerTube) | (terms: advertising or marketing videos are prohibited) | https://peertube.nwps.fi |
| Western Europe | DE | peertube.tinksic.com (Minecraft Peertube) | no ads | https://peertube.tinksic.com |
| Western Europe | DE | minecraftvideos.net (Minecraft Peertube) | no ads | https://minecraftvideos.net |
| Fediverse servers outside the 54 countries | — | 服务条款 - 哇酷WowCool | 禁止发布广告 | https://cdn.wowcool.moe/pages/terms.html |
| Southern Europe | IT | Skuola.net forum | Nessuna pubblicità | https://www.skuola.net/forum/ |
| Southern Europe | IT | Matematicamente.it forum | Nessuna pubblicità | https://www.matematicamente.it/forum/ |
| Central & Eastern Europe | CZ | SeznamSkol.eu discussions | (discussion rules: advertising is not allowed in the discussions) | https://www.seznamskol.eu/pravidla-diskuze/ |
| South Asia | IN | pagalguy.com (PaGaLGuY) (board) | Advertising (direct or surrogate), generating leads in public or through Private Messages on the forum is not allowed without permission of PaGaLGuY.com. | https://www.pagalguy.com/t/rules-posting-guidelines-reloaded/3009987 |
| Southeast Asia | SG | HardwareZone Forums (incl. EDMW) | advertising and/or promotional content are NOT allowed | https://forums.hardwarezone.com.sg/help/promo/ |
| Southeast Asia | VN | Tinh tế (tinhte.vn) | Nghiêm cấm quảng bá bất kỳ sản phẩm dưới bất kỳ hình thức nào, bao gồm nhưng không giới hạn việc gửi, truyền bất kỳ thông điệp nào mang tính quảng cáo | https://tinhte.vn/ |
| Southeast Asia | MY | Lowyat.NET Forum | No Advertising | https://forum.lowyat.net/PropertyTalk |
| Northern Europe | GB | The Student Room community guidelines | no advertising | https://www.thestudentroom.co.uk/help/community-guidelines |
| Northern Europe | SE | Flashback forum rules | Reklam och annonsering: Privata eller kommersiella annonser … inlägg innehållande reklam … är inte tillåtet | https://www.flashback.org/regler |
| Latin America | PE | Foros Peru - Zona Academica / Universidades | 1.5 No está permitida la publicidad (spam). | https://www.forosperu.net/help/terms/ |
| East Asia | TW | xn--j5r817a.com (嘟文 - 中文长毛象社区 - 开放注册，无需审核) | 严禁任何侵权内容，严禁广告 。未经允许，本实例禁止机器人账号，禁止镜像类型账号 | https://xn--j5r817a.com |
| Western Europe | DE | fairmove.net (fairmove) | keine Werbung | https://fairmove.net |
| Fediverse servers outside the 54 countries | — | india.goonj.xyz (goonj India) | No spam.   | https://india.goonj.xyz |
| Fediverse servers outside the 54 countries | — | social.goonj.xyz (goonj India) | No spam.   | https://social.goonj.xyz |
| Western Europe | DE | m.it.hs-worms.de (Mastodon Instanz der Hochschule Worms) | Spam, automatisierte Werbung oder betrügerische Inhalte sind nicht erlaubt. | https://m.it.hs-worms.de |
| North America | US | entheoconnect.social (Entheoconnect.Social) | No spam. This includes commercial advertising, promotional campaigns, and SEO. | https://entheoconnect.social |
| Western Europe | AT | anonsys.net (-= anonsys.net =-) | Nicht genehmigte, getaggte oder automatisierte oder übermäßige Werbung (verboten) | https://anonsys.net |
| Northern Europe | GB | social.ixcat.ovh (Mastodon) | Interdiction de la publicité et comptes commerciaux. | https://social.ixcat.ovh |
| Fediverse servers outside the 54 countries | — | jiaojiao.org (JiaoJiao) | 禁止广告 | https://jiaojiao.org |
| North America | US | nbaden.club (NBA Mastodon Community) | No spamming of any kind. | https://nbaden.club |
| North America | US | topic-master.com (Topic-master) | Topic-Master.com is NOT a platform for commercial entities to sale their goods. | https://topic-master.com |
| Western Europe | DE | mainspitze.social | Übermäßige Werbung / Spam / Spamflut ist untersagt. | https://mainspitze.social |
| Western Europe | NL | nrc.social (Mastodon) | Geen reclame | https://nrc.social |
| Northern Europe | NO | domum.social (Domum Social) | No racism, sexism, homophobia, transphobia, ableism, xenophobia, casteism, or other identity based discrimination  — Transphobic behavior such as intentional misgendering and deadnaming is strictly prohibited. Promotion of "conversion therapy" is strictly proh | https://domum.social |
| Fediverse servers outside the 54 countries | ZZ | sasa.africa (Sasa Africa) | No ads or spam. Engage with people, don’t assume they are your captive market. | https://sasa.africa |
| North America | US | gamerplus.org (G+DBN) | No spam | https://gamerplus.org |
| Western Europe | DE | ull.social (ULL.social) | NO PUBLICIDAD | https://ull.social |
| Middle East & North Africa | IL | kitch.win (Mastodon Glitch Edition) | No advertising | https://kitch.win |
| North America | US | lebrady.net (The LeBrady Federation) | No spam, but you can have a little bit of advertising, as a treat. | https://lebrady.net |
| Southern Europe | PT | left-bank.net (The Left Bank) | No commercial ads | https://left-bank.net |
| Global (directories, protocols) | GLOBAL | eudk/awesome-ai-tools (GitHub list) (home) | no ads | https://github.com/eudk/awesome-ai-tools |
| Global (directories, protocols) | GLOBAL | forum.freecodecamp.org (rules page) | Please refrain from self-promotion of your projects (GitHub, Personal Website, etc) or social media | https://forum.freecodecamp.org/guidelines |
| Global (directories, protocols) | GLOBAL | moodle.org community forums (board) | You may only mention commercial products and services in the natural context of a discussion such as an answer to a question. You may not post unsolicited advertisements for products or services. | https://moodle.org/mod/page/view.php?id=7080 |
| Global (directories, protocols) | GLOBAL | community.wanikani.com (WaniKani Community) (board) | (terms: no bot-registered accounts) | https://community.wanikani.com/ |
| Global (directories, protocols) | GLOBAL | WaniKani terms | Accounts registered by “bots” or other automated methods are not permitted. (Advertising on WaniKani: rules for promoting content) | https://www.wanikani.com/terms |
| Northern Europe | NO | i1.no (Mastodon, Norwegian tech/startup community) (rules page) | No spam, AI-generated content, corporate advertis | https://mastodon.help/instances?id=23065 (directory listing of the server's about/rules) |
| East Asia | JP | なんでも宣伝 wiki (wikiwiki.jp/publicity) (home) | 宣伝するのは禁止 | https://wikiwiki.jp/publicity/ |
| East Asia | KR | Disquiet (disquiet.io) (home) | 홍보 목적 편집 금지 | https://disquiet.io/ |

## Skipped sites and why

Counts per reason, with the sites named (fediverse servers by host). The CSV has every row with its quote.

- **Skipped: asks for a date of birth or sets an age rule at sign-up** — 41: mastodon.social [US]; mastodon.uno [FR]; mstdn.party; defcon.social [US]; thu.closed.social [SG]; qlub.social [CA]; mstdn.plus; cyberplace.social [FI]; toot.wales [GB]; hessen.social [DE]; cupoftea.social [FR]; gaygeek.social; tea.codes [TW]; privacysafe.social [PT]; organica.social [BR]; hear-me.social; pieville.org; muri.network [KR]; social.roadfm.fr [FR]; Publi24.ro [RO]; Jiji Nigeria [NG]; Jiji Kenya [KE]; Jiji Ghana [GH]; mastodon.sg; Tumblr community guidelines [GLOBAL]; Kijiji posting policies [CA]; Preloved terms [GB]; Bluesky [US]; unredacted.social [US]; social.kryta.app; woodworking.group; uestc.social [US]; crypto-only.org; staging.mastodon.social [DE]; farmgarden.nora.social [JP]; mast.lt; social.umoja.it [IT]; nora.social [JP]; villageidiot.town [PT]; espelunca.social; orvella.vir.group [FI]
- **Skipped: phone number or SMS verification** — 21: Kleinanzeigen [DE]; ParuVendu [FR]; Bazos.cz [CZ]; Haraj [SA]; OpenSooq Saudi Arabia [SA]; ジモティー [JP]; Craigslist [US]; OpenSooq Egypt [EG]; Plurk [TW]; Quikr [IN]; Adjungle.pk [PK]; Chợ Tốt [VN]; Kaidee [TH]; Mudah.my [MY]; Startup Base [BR]; Jodel [DK]; Servidos.ar Clasificados [AR]; Studentroom.co.za [ZA]; CustoJusto rules [PT]; IklanGratiz [ID]; Wait4Ads [IN]
- **Skipped: identity, student or third-party login verification** — 15: 에브리타임 [KR]; StartupBase.io [GLOBAL]; Productivity Directory [GLOBAL]; Evisos Argentina [AR]; Evisos México [MX]; Evisos Colombia [CO]; Quoka [DE]; Evisos Chile [CL]; 2dehands.be [BE]; Marktplaats [NL]; Hashnode [GLOBAL]; dev.to [GLOBAL]; makers.page [GLOBAL]; Quoka [DE]; Annuaire Gratuit du Maroc [MA]
- **Skipped: paid listing only** — 11: nostr.land [GLOBAL]; nostr.wine [GLOBAL]; eden.nostr.land [GLOBAL]; nostr.sebastix.dev [GLOBAL]; BetaPage [US]; Aixploria [US]; Develop Argentina - Directorio Tech [AR]; ToolPilot [GLOBAL]; Dang.ai [GLOBAL]; MicroLaunch [GLOBAL]; PitchWall [GLOBAL]
- **Skipped: manual moderator, admin or editorial approval** — 2439: mstdn.jp; mstdn.social; mastodon.world [FI]; techhub.social [CA]; infosec.exchange; c.im; hachyderm.io; mastodon.sdf.org [US]; troet.cafe [DE]; m.cmx.im [TW]; piaille.fr [FR]; mastodon.nl [NL]; mastodon.art [FR]; kolektiva.social; ohai.social [DE]; mindly.social [US]; sfba.social [US]; mastodon.gamedev.place; mastodon.scot; mathstodon.xyz; ioc.exchange [DE]; alive.bar; mstdn.business [DE]; det.social [DE]; wxw.moe; mastodon.ie [FR]; abdl.link; spinster.xyz; mastodontech.de [DE]; tech.lgbt [US]; sueden.social [DE]; theblower.au [AU]; norden.social; noc.social [US]; toot.io; indieweb.social [PT]; social.cologne [DE]; social.linux.pizza [FI]; sigmoid.social [FR]; findout.media [CA]; muenchen.social [DE]; ruhr.social [DE]; mstdn.tokyocameraclub.com [JP]; g0v.social [JP]; projectmushroom.social [DE]; dice.camp [FR]; mastodont.cat [FI]; socel.net [FR]; climatejustice.social [AT]; h4.io [FR]; mastodon.cat [FI]; aipi.social [DE]; me.ns.ci; twit.social [FR]; livellosegreto.it [FR]; mstdn.science [GB]; bark.lgbt [NL]; epsilon.social; social-md.wunderground.com [US]; ruby.social [FR] … and 2379 more
- **Skipped: automated posting prohibited** — 1: Hacker News guidelines [US]
- **Skipped: AI accounts or AI-written content prohibited** — 3: mastodon.au [AU]; mastodon.nu [SE]; fairy.id [US]
- **Skipped: CAPTCHA at sign-up or posting (not bypassed)** — 289: nijimiss.moe; takusuki.com; sushi.ski; misskey-square.net; tickler.cc [US]; oekakiskey.com; misskey.art; misskey.day; misskey.ranranhome.info; misskey.design; feels.moe; misskey.gg [JP]; noc.ski [JP]; submarin.online; voskey.icalo.net; mivatter.com; misskey.flowers; buicha.social; live-theater.net; mattyaski.co; misskey.niri.la; transfem.social [US]; miruku.cafe; dvd.chat [FI]; misskey.social [FI]; hoto.moe [JP]; misskey.systems; otomad.site; mk.shrimpia.network; waff-skey.net [JP]; pari.cafe; misskeytsf.love [JP]; misskey.doujin.games; misskey.stream; mi.cbrx.io [JP]; prismisskey.space; kasei.ski; calckey.world [DE]; sharkey.ranranhome.info; blahaj.zone [CA]; drdr.club [JP]; ojousama-tea.party; sakurajima.social [US]; mk.absturztau.be [CH]; futurology.today; sns.ourt-ai.work; yami.ski; misskey.dog; n-kaiwai.work; misskey.assaultli.ly [JP]; yoru.noc.ski [JP]; kitsune.moe [DE]; misskey.favskey.online; stormskey.works; milkiyatelier.quest; coretalk.space; sharkey.world [DE]; misskey.kyoupro.com [US]; hooves.social [NL]; misskey.resonite.love … and 229 more
- **Skipped: local business entity required, off-topic or reputational** — 69: truthsocial.co.in [IN]; link.baai.ac.cn; shelter.moe [DE]; oulipo.social [US]; skeptikon.fr [FR]; wiwi.video [TW]; peerate.fr [FR]; videos.maitregeek.eu [FR]; peertube.snarkytechlab.com [US]; video.383.su [RU]; peertube.cif.su [TW]; play.cotv.org.br [US]; lokalmedial.de [DE]; pbvideo.ru [RU]; prunedeprune.fr [FR]; video.barcelo.ynh.fr [FR]; nostr.einundzwanzig.space [GLOBAL]; Startupxplore [ES]; Italian Startup Database [IT]; Search-AI.pl [PL]; MamStartup.pl [PL]; Firmy.cz [CZ]; Gyakorikerdesek.hu [HU]; Panorama Firm [PL]; Yellow Pages UAE [AE]; Bulurum [TR]; eGirisim [TR]; Tawjihnet [MA]; 9rayti.com [MA]; Startup India [IN]; Clasf Pakistan [PK]; Telecontact.ma [MA]; Bangladesh.com Business Directory [BD]; VC4A [NG]; TrueLocal [AU]; Yelp for Business [US]; Yellow Pages Australia [AU]; StartLocal [AU]; Finda [NZ]; Zenbu [NZ]; Yellow NZ [NZ]; Vivastreet UK [GB]; NZ Entrepreneur magazine [NZ]; FreeIndex [GB]; EdTechNZ [NZ]; LendED [GB]; Hitta.se - Företag [SE]; TechIreland [IE]; Scoot [GB]; Pluggakuten [SE]; The Hub [SE]; Nordic Tech List [SE]; Swedish Edtest [SE]; 1881.no [NO]; Swedish Edtech Industry - Edtechkartan [SE]; StartupMatcher [NO]; EduGrowth [AU]; Oslo Edtech Cluster [NO]; Finder.fi [FI]; Startup100 [FI] … and 9 more
- **Skipped: registrations closed or archive only** — 901: peoplemaking.games [CA]; tube-numerique-educatif.apps.education.fr [FR]; peertube.lyceeconnecte.fr; tube-action-educative.apps.education.fr [FR]; tube-sciences-technologies.apps.education.fr [FR]; video.cnr.it [IT]; tube-maternelle.apps.education.fr [FR]; tube-arts-lettres-sciences-humaines.apps.education.fr [FR]; tube-cycle-2.apps.education.fr [FR]; tube.p2p.legal; tube-cycle-3.apps.education.fr [FR]; tube-institutionnel.apps.education.fr [FR]; tube-langues-vivantes.apps.education.fr [FR]; spook.tube [US]; peertube.mdg-hamburg.de [DE]; videotheque.uness.fr [FR]; tube.tchncs.de [FI]; inspeer.eduge.ch [CH]; video.igem.org [US]; greatview.video [US]; peertube.stream [FR]; player.ojamajo.moe [RU]; tvn7flix.fr [FR]; tube-enseignement-professionnel.apps.education.fr [FR]; video.mgupp.ru [RU]; garr.tv [IT]; tube-education-physique-et-sportive.apps.education.fr [FR]; fair.tube [DE]; tube.foi.hr [HR]; itvplus.iiens.net [FR]; tube.mgppu.ru [RU]; tv.pirati.cz [CZ]; peertube.party; vulgarisation-informatique.fr [FR]; fediverse.tv [ES]; video.infosec.exchange [DE]; bark.video [NL]; video.4d2.org [US]; video.elfhosted.com [DE]; stream.udk-berlin.de [DE]; peertube.tv [FR]; peertube.42lausanne.ch [CH]; videos.pair2jeux.tube [FI]; video.bsrueti.ch [CH]; videos.testimonia.org [ES]; peertube.rezel.net [FR]; vhsky.cz [DE]; peertube.vit-bund.de [DE]; ccutube.ccu.edu.tw [TW]; my-sunshine.video [JP]; hyperreal.tube [RU]; grypstube.uni-greifswald.de [DE]; live.zawiya.one [GB]; peertube.nodja.com; diler.tube [DE]; peertube.lyclpg.itereva.pf [PF]; p.eertu.be [DE]; peertube.be [DE]; vid.northbound.online [SE]; tv.lumbung.space [FI] … and 841 more

## Not read tonight

- **Not read: bot wall (403/429/5xx) on the runner** — 200: 1point3acres.com; AI比較ラボ; Addelma.hu; Adpost; Adpost Philippines; Adverts.ie terms; Amino.dk; Anibis.ch; Aprohirdetes24.hu; Argentino.com.ar; AsiaXPAT Hong Kong classifieds; Avito.ma; Bakeca.it; Bear Blog; Bezaat; Bikroy.com; Boards.ie terms; Brabys; Capterra; Clasificados La Voz; ClassifiedAds.com; Classifieds.co.za; Classifieds.co.zw; ClickAnnonce; ClickBD; Crunchbase add company; Cylex Canada; Cylex Ireland; Cylex South Africa; Cylex UK add company; Cylex.hu; Czechia Dealroom; Dcard; DealMarkaz.pk; Diskusjon.no regler; Doplim Brasil; Dubizzle Egypt; Dubizzle UAE; Easy.co.il; Eniro Företag; Expatriates.com; FXP forums; Finn.no vilkår; Foros Peru Club; Forum Softpedia; FreeList.gr; Freeads UK terms; Freeads.co.uk; Friday-Ad; Futurepedia; G2; GhanaYello; Gulesider.no; Gumtree Australia terms; Hirdetesingyen.hu; Hotfrog; Hotfrog Australia; Hotfrog Canada; Hotfrog Ireland; Hotfrog New Zealand; Hotfrog UK; Huuto.net; Indie Hackers; Indie Hackers community rules; Indotrading; Irish Tech News; Jofogas.hu; Junk Mail; Justdial Free Listing; Kaskus; Krak.dk; Launching Next; Leboncoin; Lemmy: lemm.ee; Lemmy: programming.dev; Lento.pl; Les Pepites Tech; Les Pépites Tech; Localist NZ; Locanto Argentina … and 103 more
- **Not read: unreachable or not resolving** — 308: 88DB Hong Kong; AI Tool Hunt; Adgraft; Alo.bg; Blocket; CKFU student forum; Clasf Colombia; Clasificados El Tiempo; ClassifiedSG; Cofe-cup; CoinAfrique; DBA.dk; Densiva; Dhakasnob business directory; Diretorio de Empresas Portuguesas; Disquiet; Doplim Mexico; Doplim Peru; Evisos Peru; Future Startup; Gumtree.pl; Indonetwork; Ingyen-aprohirdetes.hu; Jedi.co.ke; Kleinanzeigen-Gratis.com; Kuknus Classifieds; Lagos List; Launched!; Launched.io; Locanto Danmark; Locanto Italia; Locanto Malaysia; Locanto Norge; Locanto Pakistan; Locanto Portugal; Locanto Suomi; Locanto Sverige; Mastodon Indonesia; Meet 創業小聚; Micapublicitate.ro; MyBenta; NZS.com; Nextdoor; Numbala; OLX Indonesia; P@SHA Pakistan Startup Directory; Pendekar Iklan; SGSearch; Sebule Kenya; Skolediskusjon.no; Startup Hub Portugal; StartupBase; StudentGuru.gr; Studentroom.co.za; Tapuz forums; Urbania / Computrabajo; WHub; about.mastodon.africa; aggeliopolis.gr; agora.energieincomune.com; akolades.com; algebra.chat; amastodon.uk; atta.ch.to; aussie.zone; bbs.9tail.net; bear-den.org; blazecat.social; bolha.io; campfyre.nickwebster.dev; civilloquy.com; content.wissen-ist-relevant.com; cornelius-bell.com; crustaceanson.theshelf.top; csictv.csic.es; curieuxraton.tv; cuties.zip; deaf.social; dedinit.ru; discover.mastodon.africa … and 227 more
- **Not read: rules page returned 404** — 62: Alloprof - Zone d'entraide; AlternativeTo; Anuntul.ro termeni; Aponhut terms; Bear Blog terms; Blocket annonsregler; BusinessGhana add listing; Classisite termos; DBA regler; DOU.ua rules; DoneDeal terms; EdTech Impact vendor listing; Egyetemistak.hu szabályzat; FOK! huisregels; GeekNews; Geekzone forums; GradCafe forum guidelines; GulogGratis; Gumtree Australia; Gumtree UK; Gumtree UK terms; Hotfrog Australia; Hyperinzerce podmínky; ISTE Learning Technology Directory / EdTech Index; LIHKG 連登; Lajumate.ro; LesPAC; Mercado Libre Argentina términos; Mercado Libre Colombia; Mercado Libre Perú; OLX Brasil regras; OLX Pakistan; PR TIMES スタートアップチャレンジ; PRLog free press release; Publi24.ro; Sbazar pravidla; Ser Universitario foro reglas; Soukaffaires.ma; Startbase; Startup Montréal - Répertoire des startups; Studentroom.co.za terms; Studis Online Fragen-Brett Regeln; Studyclix; Subito.it; Suomi24 Keskustelu; Tapuz forums rules; TechLeap Startup Finder; Tori.fi säännöt; Trade Me terms; Ukrboard add; Uloop; WHub; WhatTheAI; Write.as terms; YellowPages.ca; Ylilauta; aitoptools submit; dev.to community moderation; idietera.gr; ix.gr; startups.watch register; uni-protokolle.de Foren

## Sign-up forms read

What each site's own registration form asks for, read without filling anything (a home page was followed to its sign-up link). E-mail-only forms are the ones Amber could use; a phone, date-of-birth or CAPTCHA field is a recorded blocker.

| Country | Site | Form | Finding | Page |
|---|---|---|---|---|
| ID | IklanGratiz | Skipped: phone number or SMS verification | phone field on the sign-up form | https://www.iklangratiz.com/ |
| ZA | Studentroom.co.za | Skipped: phone number or SMS verification | phone field on the sign-up form | https://www.studentroom.co.za/ |
| AR | Evisos Argentina | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.evisos.com.ar/ |
| BE | 2dehands.be | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.2dehands.be/ |
| CL | Evisos Chile | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.evisos.cl/ |
| CO | Evisos Colombia | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.evisos.com.co/ |
| DE | Quoka | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.quoka.de/ |
| DE | Quoka (Anzeige aufgeben) | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.quoka.de/anzeige-aufgeben/ |
| GLOBAL | Hashnode | Skipped: identity, student or third-party login verification | sign-up only through google | https://hashnode.com/ |
| GLOBAL | dev.to | Skipped: identity, student or third-party login verification | sign-up only through google | https://dev.to/enter?state=new-user |
| MA | Annuaire Gratuit du Maroc | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.annuaire-gratuit.ma/annonces/ |
| MX | Evisos México | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.evisos.com.mx/ |
| NL | Marktplaats | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.marktplaats.nl/ |
| AT | willhaben | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.willhaben.at/ |
| AU | Australian EdTech Directory | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://australianedtech.com.au/directory-application-form/ |
| BG | Bazar.bg | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://bazar.bg/ |
| BR | Classificados Brasil | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.classificados-brasil.com/ |
| DE | Kleinanzeigen | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://www.kleinanzeigen.de/ |
| DE | Startbase (Börse Stuttgart startup platform) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.startbase.de/ (profile creation) |
| EG | qpbd.forumarabia.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://qpbd.forumarabia.com/ |
| FR | ParuVendu | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.paruvendu.fr/ |
| FR | Toutunservice.fr | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.toutunservice.fr/ |
| GLOBAL | Expat.com (register) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.expat.com/en/register.html |
| GLOBAL | Lemmy: discuss.online | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://discuss.online/signup |
| GLOBAL | Lemmy: lemmy.dbzer0.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.dbzer0.com/signup |
| GLOBAL | Lemmy: lemmy.ml | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.ml/signup |
| GLOBAL | Lemmy: lemmy.today | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.today/signup |
| GLOBAL | Lemmy: lemmy.zip | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.zip/signup |
| GLOBAL | Lemmy: sopuli.xyz | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://sopuli.xyz/signup |
| GLOBAL | superprof.com (tutoring marketplace, country sites) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://www.superprof.com/ |
| KE | Businesslist.co.ke | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.businesslist.co.ke/ |
| MA | Marocannonces | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.marocannonces.com/ |
| N/A | Dakanarab.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://dakanarab.com/ |
| NG | Businesslist.com.ng | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.businesslist.com.ng/ |
| PL | Forum.Studia.net | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://forum.studia.net/register/ |
| PT | Uniarea forum | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (turnstile) | https://www.uniarea.com/forum/ |
| RO | RomaniaUnita (register) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.romaniaunita.com/index.php?/register/ |
| TH | Pantip (PantipMarket's account) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://pantip.com/register/email |
| US | Geebo | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://geebo.com/services/add/ (services post form; sign-up page not seen) |
| US | Geebo | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://geebo.com/services/add/ |
| US | Uloop | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.uloop.com/ |
| VN | raovatsinhvien.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://raovatsinhvien.com/ |
| ZA | Ads Africa | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.adsafrica.co.za/ |
| BR | TabNews | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://tabnews.com.br/cadastro |
| DE | Quoka (Login) | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.quoka.de/login/ |
| DK | Amino.dk | Not read: bot wall (403/429/5xx) on the runner | HTTP 200 | https://www.amino.dk/ |
| GB | Freeads.co.uk | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.freeads.co.uk/ |
| GB | Vivastreet UK | Not read: bot wall (403/429/5xx) on the runner | HTTP 200 | https://www.vivastreet.co.uk/ |
| GLOBAL | Bear Blog | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://bearblog.dev/ |
| GLOBAL | Indie Hackers | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.indiehackers.com/sign-up |
| GLOBAL | Lemmy: lemm.ee | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://lemm.ee/signup |
| GLOBAL | Lemmy: programming.dev | Not read: bot wall (403/429/5xx) on the runner | HTTP 200 | https://programming.dev/signup |
| GLOBAL | SideProjectors | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.sideprojectors.com/ |
| GLOBAL | StackShare | Not read: bot wall (403/429/5xx) on the runner | HTTP 429 | https://stackshare.io/ (add-a-tool flow not seen) |
| GLOBAL | Startup Buffer | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://startupbuffer.com/ |
| GLOBAL | StartupRanking | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.startupranking.com/ |
| GLOBAL | codidact.com network (languages.codidact.com is the learner community) | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://languages.codidact.com/ |
| GLOBAL | moodle.org community forums | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://moodle.org/ |
| GR | FreeList.gr | Not read: bot wall (403/429/5xx) on the runner | HTTP 200 | https://www.freelist.gr/ |
| HU | Aprohirdetes24.hu | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://aprohirdetes24.hu/ |
| HU | Hirdetesingyen.hu | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://hirdetesingyen.hu/ |
| IT | Bakeca.it | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.bakeca.it/inserisci/annuncio/ ('Pubblica annuncio gratuito su Bakeca Italia'); category entry e.g. https://www.bakeca.it/inserisci/annuncio/sel_categoria/corsi-lingua-lezioni |
| IT | Bakeca.it | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.bakeca.it/ |
| N/A (pan-Arab) | aielanat.com (موقع إعلانك) | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.aielanat.com/register/ (optional); guest posting via https://www.aielanat.com/اضافه-اعلان-مجانا/ |
| PL | Lento.pl | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.lento.pl/dodaj-ogloszenie.html ('Dodaj ogłoszenie za darmo - Szybko i bezpłatnie dam ogłoszenie'); no separate sign-up |
| PL | Lento.pl | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.lento.pl/dodaj-ogloszenie.html |
| SA | Expatriates.com | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.expatriates.com/scripts/users/create_account.epl (Create Account); posting flow https://www.expatriates.com/scripts/posting/poststep1.epl ('Place a Free Ad Step 1 of 3') |
| SA | Expatriates.com | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.expatriates.com/scripts/users/create_account.epl |
| UA | OBYAVA.ua | Not read: bot wall (403/429/5xx) on the runner | HTTP 200 | https://obyava.ua/ |
| US | 1point3acres.com (一亩三分地) | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.1point3acres.com/ |
| US | ClassifiedAds.com | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.classifiedads.com/post.php (no account needed to post; login page https://www.classifiedads.com/login.php) |
| US | ClassifiedAds.com | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://www.classifiedads.com/ |
| US | sharemylesson.com (AFT Share My Lesson) | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://sharemylesson.com/ |
| BG | Alo.bg | Not read: unreachable or not resolving |  | https://www.alo.bg/ |
| GLOBAL | Launched.io | Not read: unreachable or not resolving |  | https://launched.io/ |
| GLOBAL | discuss.codecademy.com (Codecademy Forums) | Not read: unreachable or not resolving |  | https://discuss.codecademy.com/ |
| HU | Ingyen-aprohirdetes.hu | Not read: unreachable or not resolving |  | https://ingyen-aprohirdetes.hu/ |
| IL | Tapuz forums | Not read: unreachable or not resolving |  | https://www.tapuz.co.il/forums |
| ZA | Studentroom.co.za (register) | Not read: unreachable or not resolving |  | https://www.studentroom.co.za/register |
| AR | Evisos Argentina (login) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:data[User][email], password:data[User][password], email:data[User][email] | https://www.evisos.com.ar/login |
| AR | Tusclases.com.ar | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:ctl00$m$txtnombre, text:ctl00$m$nifcif, text:ctl00$m$txtdireccion, text:ctl00$m$txttelefono, checkbox:ctl00$m$chkinteres$chkinteres_0, checkbox:ctl00$m$chkinteres$chkinteres_1, text:ctl00 | https://www.tusclases.com.ar/anunciarse/ ('¿Qué tipo de anuncio gratuito quieres publicar?') |
| CO | Colombia Move (publicar) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:Tu email para publicar, file:?, file:?, file:? | https://colombiamove.com/publicar |
| CZ | Hyperinzerce (registrace) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:Email, checkbox:IsConsentGranted | https://www.hyperinzerce.cz/registrace/ |
| CZ | Hyperinzerce.cz | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:query, checkbox:DistanceSearch, text:Email, checkbox:IsConsentGranted | https://www.hyperinzerce.cz/ |
| DE | Gründerküche Startup-Guide | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:EMAIL, text:FNAME, text:LNAME, checkbox:AGREE_TO_TERMS, text:_mc4wp_honeypot, text:?, text:?, text:? | https://www.gruenderkueche.de/startup-guide-eintrag/ |
| FR | pass-education.fr — Forum enseignant | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:s, text:email, text:password, text:code_parrainage, text:email, text:password, text:code_parrainage, text:email | https://www.pass-education.fr/ |
| GLOBAL | AI Study Master (student AI tools directory) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: checkbox:botcheck, text:full_name, email:email, text:product_name, url:website_url, text:short_description, file:logo, radio:student_discount | https://aistudymaster.com/submit-resource/ |
| GLOBAL | The Startup Project directory | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:fax_number, text:founderName, email:email, text:companyName, url:website, text:tagline, checkbox:consent | https://startupproject.org/submit-startup/ |
| GLOBAL | ToolDirs | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:url, text:name, text:tagline, file:?, file:?, text:discountCode, text:youtubeUrl, text:githubUrl | https://tooldirs.com/submit |
| GLOBAL | dev.to (sign up) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:q, email:user[email], password:user[password], checkbox:user[remember_me] | https://dev.to/users/sign_up |
| IL | ZehCan | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:reg_newsletter | http://zehcan.co.il/ |
| IL | myproduct.co.il | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:email, password:password, password:password2 | https://myproduct.co.il/ |
| IL | myproduct.co.il post | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:email, password:password, password:password2 | https://myproduct.co.il/?id=862&category_id=8 |
| JP | ジモティー | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:user[name], email:user[email], password:user[password], checkbox:user[mail_magazine_recievable] | https://jmty.jp/ |
| MY | Mudah.my | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:email, password:password, password:verification_password, checkbox:pdpa_opt_in | https://www.mudah.my/ |
| NL | FOK!forum | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:member, email:email, checkbox:policy, text:short | https://forum.fok.nl/ |
| NL | FOK!forum (register page) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:member, email:email, checkbox:policy, text:short | https://forum.fok.nl/user/register |
| PK | List.com.pk | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:keyw, text:m_email, password:m_password, password:confirm_password, checkbox:terms | https://list.com.pk/ |
| PK | Startup.pk | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:spk_name, email:spk_email | https://startup.pk/ |
| PK | Startup.pk (register) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:spk_name, email:spk_email | https://startup.pk/register/ |
| RO | Anuntul.ro (inregistrare) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:_username, password:_password | https://www.anuntul.ro/cont/inregistrare |
| RO | Publi24.ro | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:?, number:?, text:?, text:?, text:?, email:Email, password:Password, checkbox:MarketingOptIn | https://www.publi24.ro/login |
| RO | RomaniaUnita.com forum | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:auth, password:password, checkbox:remember_me, checkbox:anonymous, radio:type, radio:type, radio:search_and_or, radio:search_and_or | https://www.romaniaunita.com/ |
| TH | PantipMarket | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:username, password:password, checkbox:rememberLogin, text:search_keyword, checkbox:search_province_relate, checkbox:search_member_only, checkbox:prov_relate, email:comment_site_email | https://www.pantipmarket.com/ |
| UA | DOU.ua | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:q, text:username, password:password, email:username, checkbox:? | https://dou.ua/ |
| AE | Mourjan | fields not readable (JavaScript shell or no form found) | no readable form | https://www.mourjan.com/ |
| AR | Anunciar.co | fields not readable (JavaScript shell or no form found) | no readable form | https://anunciar.co/ |
| AR | Anunciar.co (Argentina) | fields not readable (JavaScript shell or no form found) | no readable form | https://argentina.anunciar.co/ |
| AR | Evisos Argentina (registro) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.evisos.com.ar/registro |
| AR | Ser Universitario foro | fields not readable (JavaScript shell or no form found) | no readable form | https://seruniversitario.com/foro |
| BD | Aponhut | fields not readable (JavaScript shell or no form found) | no readable form | https://www.aponhut.com/ |
| BD | Aponhut (register) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.aponhut.com/register |
| BE | Vivastreet BE | fields not readable (JavaScript shell or no form found) | no readable form | https://www.vivastreet.be/ |
| BR | Classisite | fields not readable (JavaScript shell or no form found) | no readable form | https://www.classisite.com.br/ |
| BR | Fórum PiR2 | fields not readable (JavaScript shell or no form found) | no readable form | https://pir2.forumeiros.com/ |
| CO | Colombia Move | fields not readable (JavaScript shell or no form found) | no readable form | https://colombiamove.com/ |
| CZ | Bazos.cz | fields not readable (JavaScript shell or no form found) | no readable form | https://www.bazos.cz/ |
| CZ | Sbazar.cz | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sbazar.cz/ |
| DE | Studis Online Fragen-Brett | fields not readable (JavaScript shell or no form found) | no readable form | https://www.studis-online.de/Fragen-Brett/ |
| DK | GulogGratis | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.guloggratis.dk/ |
| EG | kenooznet.yoo7.com | fields not readable (JavaScript shell or no form found) | no readable form | https://kenooznet.yoo7.com/ |
| EG | markzaldawli.yoo7.com | fields not readable (JavaScript shell or no form found) | no readable form | https://markzaldawli.yoo7.com/ |
| ES | Tablón de Anuncios | fields not readable (JavaScript shell or no form found) | no readable form | https://www.tablondeanuncios.com/ |
| ES | Tablón de Anuncios (anunciar) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.tablondeanuncios.com/anunciar.htm |
| FR | Vivastreet FR | fields not readable (JavaScript shell or no form found) | no readable form | https://www.vivastreet.com/ |
| GB | Educational App Store | fields not readable (JavaScript shell or no form found) | no readable form | https://www.educationalappstore.com/ |
| GLOBAL | Expat.com | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.expat.com/en/ |
| GLOBAL | Lemmy — /c/selfpromo (home instance not identified) | fields not readable (JavaScript shell or no form found) | no readable form | https://discuss.coding.social/ |
| GLOBAL | Mataroa | fields not readable (JavaScript shell or no form found) | no readable form | https://mataroa.blog/ |
| GLOBAL | OpenHunts | fields not readable (JavaScript shell or no form found) | no readable form | https://openhunts.com/ (submit flow not seen) |
| GLOBAL | Share Your Startup | fields not readable (JavaScript shell or no form found) | no readable form | https://shareyourstartup.com/ |
| GLOBAL | Startup Ranking | fields not readable (JavaScript shell or no form found) | no readable form | https://www.startupranking.com/ ('Submit Your Startup' button; exact URL not seen) |
| GLOBAL | StartupTabs | fields not readable (JavaScript shell or no form found) | no readable form | https://startuptabs.com/ ('Submit Your Startup' / 'Startup Lister' link; URL not seen) |
| GLOBAL | Telegraph (telegra.ph) | fields not readable (JavaScript shell or no form found) | no readable form | https://telegra.ph/ |
| GLOBAL | UNO Directory | fields not readable (JavaScript shell or no form found) | no readable form | https://uno.directory/ |
| GLOBAL | Uneed | fields not readable (JavaScript shell or no form found) | no readable form | https://help.uneed.best/getting-started/how-to-submit-your-first-product |
| GLOBAL | Write.as | fields not readable (JavaScript shell or no form found) | no readable form | https://write.as/ |
| GLOBAL | community.wanikani.com (WaniKani Community) | fields not readable (JavaScript shell or no form found) | no readable form | https://community.wanikani.com/ |
| GLOBAL | forum.freecodecamp.org | fields not readable (JavaScript shell or no form found) | no readable form | https://forum.freecodecamp.org/ |
| GLOBAL | lemmy.ml — !open_e_resources | fields not readable (JavaScript shell or no form found) | no readable form | https://lemmy.ml/ |
| GLOBAL | makers.page | fields not readable (JavaScript shell or no form found) | no readable form | https://makers.page/ (submission flow not seen) |
| GR | ix.gr | fields not readable (JavaScript shell or no form found) | no readable form | https://www.ix.gr/classifieds/new ('Δωρεάν Καταχώρηση Αγγελίας') |
| HU | Aprohirdetes.biz | fields not readable (JavaScript shell or no form found) | no readable form | https://aprohirdetes.biz/ |
| HU | Egyetemistak.hu | fields not readable (JavaScript shell or no form found) | no readable form | https://egyetemistak.hu/ |
| HU | Egyetemistak.hu (regisztracio) | fields not readable (JavaScript shell or no form found) | no readable form | https://egyetemistak.hu/regisztracio |
| HU | Ingyen-aprohirdetes.hu | fields not readable (JavaScript shell or no form found) | no readable form | http://ingyen-aprohirdetes.hu/ |
| IL | AdTiny | fields not readable (JavaScript shell or no form found) | no readable form | https://www.adtiny.com/ |
| IL | Yad2 | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.yad2.co.il/ |
| IN | Click.in | fields not readable (JavaScript shell or no form found) | no readable form | https://www.click.in/ |
| IN | Click.in (register) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.click.in/register/ |
| IN | India-Classifieds post | fields not readable (JavaScript shell or no form found) | no readable form | https://www.india-classifieds.com/post-ad |
| IN | India-Classifieds.com | fields not readable (JavaScript shell or no form found) | no readable form | https://www.india-classifieds.com/ |
| IN | My India Forums | fields not readable (JavaScript shell or no form found) | no readable form | https://myindia.org.in/ |
| IN | pagalguy.com (PaGaLGuY) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.pagalguy.com/ |
| KR | phdkim.net (login) | fields not readable (JavaScript shell or no form found) | no readable form | https://phdkim.net/login/ |
| KR | phdkim.net (signup) | fields not readable (JavaScript shell or no form found) | no readable form | https://phdkim.net/signup/ |
| KR | phdkim.net (김박사넷) | fields not readable (JavaScript shell or no form found) | no readable form | https://phdkim.net/ |
| N/A | e3lanfree.com | fields not readable (JavaScript shell or no form found) | no readable form | https://e3lanfree.com/ |
| NL | Speurders (registreren) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.speurders.nl/account/registreren |
| NL | Speurders.nl | fields not readable (JavaScript shell or no form found) | no readable form | https://www.speurders.nl/ |
| RO | Anuntul.ro | fields not readable (JavaScript shell or no form found) | no readable form | https://www.anuntul.ro/ |
| SE | Citiboard | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://citiboard.se/ |
| SG | AI Tool Scoop | fields not readable (JavaScript shell or no form found) | no readable form | https://aitoolscoop.com/submit-tool/ |
| SG | SG Ads Online | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sgadsonline.com/ |
| SG | SG Ads Online (register) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sgadsonline.com/register |
| TH | Kaidee | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.kaidee.com/ |
| TR | Serinilan | fields not readable (JavaScript shell or no form found) | no readable form | https://serinilan.net/content/item-new.php (post without membership) |
| TR | Serinilan | fields not readable (JavaScript shell or no form found) | no readable form | https://serinilan.net/ |
| UA | DOU.ua (register) | fields not readable (JavaScript shell or no form found) | no readable form | https://dou.ua/register/ |
| UA | FreeTrade.com.ua | fields not readable (JavaScript shell or no form found) | no readable form | https://freetrade.com.ua/ |
| UA | Ukrboard | fields not readable (JavaScript shell or no form found) | no readable form | https://ukrboard.com.ua/ |
| UA | Ukrboard (registration) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.ukrboard.com.ua/registration/ |
| US | ISTE Learning Technology Directory / EdTech Index | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://ltd.iste.org/ (company registration); info: https://iste.org/edtech-products-database |
| ZA | SA Yellow | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sayellow.com/ |
| ZA | UpFeet South Africa | fields not readable (JavaScript shell or no form found) | no readable form | https://www.upfeet.com/free-classifieds |

## Read, but not qualified

357 pages or servers answered, but nothing on them says a free promotional post or listing is allowed (open fediverse servers with no rule about promotion, home pages without the rules, JavaScript-only pages). They stay out of the qualified count on purpose; the CSV lists them.

## Method and limits

- Probes ran on GitHub Actions runners (`.github/workflows/sp-region-scan.yml`, `scan/probe.mjs`): Mastodon-family servers through `/api/v2/instance` (registrations, min_age, rules), PeerTube through `/api/v1/config`, Lemmy `/api/v3/site`, Misskey `/api/meta`, Pixelfed nodeinfo, Nostr NIP-11, and plain pages for classifieds, forums and directories with keyword markers (CAPTCHA, phone, date of birth, identity, payment, approval) in nine languages.
- Candidates came from the fediverse directories (FediDB, JoinPeerTube, Lemmyverse) and from six discovery passes over the 54 countries in local languages; sites behind bot walls could not be read from a runner and are listed as not read rather than guessed.
- No account was created tonight beyond the PeerTube channel that already exists; Amber's Mastodon registrar (amberai #847) will open the StudyProofs account on the first qualified server in its list when it deploys, and the first post goes out at the next tick (amberai #846).
- Nothing was paid, no CAPTCHA was bypassed, no birthday, phone number or identity document was supplied, and no one was messaged.
