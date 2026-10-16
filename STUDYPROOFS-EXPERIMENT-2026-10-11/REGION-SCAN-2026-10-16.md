# StudyProofs free-promotion region scan — 2026-10-16

Built 2026-10-16 07:32Z from 6272 read-only probes (5125 distinct sites) made by GitHub Actions runners during the night of 2026-10-15/16, plus the hand review in `scan/review/verdicts.json`. Regenerate with `python3 -I scan/report.py`. The CSV beside this file carries every row.

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
| North America | CA, US | 652 | 584 | **0** | 1 | 0 | 9 | 517 (8 / 2 / 0 / 2 / 392 / 2 / 1 / 29 / 4 / 77) | 68 (36 / 22 / 10) | 57 |
| Northern Europe | DK, FI, GB, IE, NO, SE | 325 | 259 | **1** | 2 | 0 | 7 | 234 (4 / 1 / 0 / 1 / 154 / 0 / 1 / 10 / 17 / 46) | 66 (29 / 24 / 13) | 15 |
| Oceania | AU, NZ | 61 | 39 | **0** | 0 | 0 | 0 | 35 (0 / 0 / 0 / 0 / 19 / 0 / 1 / 0 / 11 / 4) | 22 (14 / 2 / 6) | 4 |
| Western Europe | AT, BE, CH, DE, FR, NL | 1591 | 1503 | **1** | 4 | 0 | 15 | 1376 (5 / 2 / 0 / 0 / 922 / 0 / 0 / 27 / 9 / 411) | 88 (16 / 60 / 12) | 107 |
| Southern Europe | ES, GR, IT, PT | 289 | 263 | **0** | 3 | 0 | 6 | 231 (3 / 1 / 0 / 0 / 196 / 0 / 0 / 2 / 2 / 27) | 26 (7 / 12 / 7) | 23 |
| Central & Eastern Europe | CZ, HU, PL, RO, UA | 131 | 93 | **0** | 4 | 0 | 1 | 56 (1 / 1 / 0 / 0 / 31 / 0 / 0 / 6 / 5 / 12) | 38 (14 / 10 / 14) | 32 |
| South Asia | BD, IN, PK | 42 | 26 | **1** | 1 | 0 | 2 | 12 (0 / 2 / 0 / 0 / 3 / 0 / 0 / 1 / 4 / 2) | 16 (7 / 6 / 3) | 10 |
| Latin America | AR, BR, CL, CO, MX, PE | 107 | 69 | **4** | 7 | 0 | 1 | 37 (1 / 2 / 0 / 3 / 18 / 0 / 0 / 0 / 4 / 9) | 38 (13 / 14 / 11) | 20 |
| Southeast Asia | ID, MY, PH, SG, TH, VN | 96 | 65 | **0** | 1 | 0 | 3 | 44 (1 / 3 / 0 / 0 / 31 / 0 / 0 / 5 / 0 / 4) | 31 (13 / 14 / 4) | 17 |
| Sub-Saharan Africa | GH, KE, NG, SN, ZA, ZW | 47 | 20 | **1** | 0 | 0 | 0 | 13 (3 / 0 / 0 / 0 / 3 / 0 / 0 / 5 / 1 / 1) | 27 (12 / 10 / 5) | 6 |
| Middle East & North Africa | AE, EG, IL, MA, N/A (pan-Arab), SA, TR | 62 | 32 | **0** | 1 | 0 | 1 | 18 (0 / 3 / 0 / 0 / 3 / 0 / 0 / 3 / 6 / 3) | 30 (18 / 7 / 5) | 12 |
| East Asia | HK, JP, KR, TW | 268 | 241 | **2** | 3 | 0 | 1 | 186 (4 / 3 / 1 / 0 / 133 / 0 / 0 / 29 / 2 / 14) | 27 (10 / 10 / 7) | 49 |
| Global (directories, protocols) | — | 125 | 80 | **0** | 5 | 16 | 6 | 40 (1 / 0 / 3 / 9 / 21 / 0 / 0 / 4 / 2 / 0) | 45 (19 / 13 / 13) | 13 |
| Fediverse servers outside the 54 countries | AM, BG, BY, GE, HR, KZ, LT, LU, LV, MG, MO, PF, RU, SI, SN, SY, TN, UY, YE | 1198 | 1088 | **0** | 3 | 0 | 10 | 965 (11 / 0 / 0 / 0 / 525 / 0 / 0 / 139 / 3 / 287) | 110 (1 / 102 / 7) | 110 |
| **All** | 54 | **4994** | 4362 | **10** | 35 | 16 | 62 | 3764 (42 / 20 / 4 / 15 / 2451 / 2 / 3 / 260 / 70 / 897) | 632 (209 / 306 / 117) | 475 |

## Qualified sites

Verified from the site's own rules or submission page. `basis` in the CSV says whether the page allows promotion explicitly or simply has no rule against it while prohibiting spam.

| Region | Country | Site | Free option | Audience | Promotion rule (their words) | Account requirements | Automation | Source | Amber can act? |
|---|---|---|---|---|---|---|---|---|---|
| Northern Europe | GB | stream.indieagora.com (IndieAgora | Stream Freely) (fediverse video) | free account, 1 video/day in Amber's own schedule | PeerTube / fediverse video | (about page, read in full: the instance is for independent creators, 'not advertisers'; sign-up open, no approval, no age field; terms allow original videos with a description and links) | email + password (verified through Amber's mailbox) | not addressed; the channel description states the account is operated by StudyProofs | https://stream.indieagora.com | yes: ACTED (live) |
| Western Europe | DE | 101010.pl (fediverse) | free account | Poland (Polish or English preferred) | Powstrzymaj się od agresywnej reklamy (produktów, polityków, ideologii i czegokolwiek innego). | email + password; no date of birth | not addressed | https://101010.pl | yes: registrar candidate 2 (used only if CITAD fails) |
| South Asia | PK | List.com.pk (classifieds) | free ad (Services) | Pakistan | Post Free Ad - All Pakistan … LIST does not pre-screen or approve (terms); sign-up form: e-mail, password, terms checkbox | e-mail + password | not addressed | https://www.list.com.pk/ | yes by web form (publisher not built; nothing posted) |
| Latin America | CO | Colombia Move (clasificados gratis) (classifieds) | free ad | Colombia | los anuncios básicos van a seguir siendo gratuitos indefinidamente | account (sign-in method not visible to the runner) | Site offers an 'asistente de anuncios' (AI helper) for drafting; bot posting not addressed | https://colombiamove.com/blog/publicar-gratis-siempre-colombia-move/ | yes by web form (publisher not built) |
| Latin America | CO | Colombia Move home (classifieds) | free basic ad in Servicios | Colombia | marketplace gratis … los anuncios básicos van a seguir siendo gratuitos indefinidamente … Usos prohibidos: … Publicar anuncios duplicados o hacer spam. (the posting form asks for an e-mail only) | e-mail address on the posting form; no account | not addressed | https://colombiamove.com/ | yes by web form (a form publisher is not built yet; nothing posted) |
| Latin America | CO | Colombia Move publicar (classifieds) | free basic ad | Colombia | Tu email para publicar (the posting form: e-mail, photos or video; no password, phone or CAPTCHA seen) | e-mail only | Site offers an 'asistente de anuncios' (AI helper) for drafting; bot posting not addressed | https://colombiamove.com/publicar | yes by web form (publisher not built) |
| Latin America | CO | Colombia Move términos (classifieds) | free basic ad | Colombia | Ofrecemos funciones pagas opcionales … Usos prohibidos: … Publicar anuncios duplicados o hacer spam. | Email/account to post; self-described 'gratis siempre' | Site offers an 'asistente de anuncios' (AI helper) for drafting; bot posting not addressed | https://colombiamove.com/terminos | yes by web form (publisher not built) |
| Sub-Saharan Africa | NG | social.citad.org.ng (CITAD) (fediverse) | free account, 500-char posts | Nigeria / English-speaking fediverse | Spam, scams, impersonation, phishing, fake engagement, and misleading information are prohibited. | email + password; no date of birth | not addressed in the rules; the account is labelled as automated in its bio | https://social.citad.org.ng | yes: registrar candidate 1; account opens at the next worker tick after #847 deploys |
| East Asia | KR | uri.life (우리.인생) (fediverse) | free account | Korea / English | (rules read in full on 2026-10-16: bots are allowed under the server's extra bot rules; no advertising ban) | email + password | allowed under the server's bot rules | https://uri.life | yes: registrar candidate 3 |
| East Asia | TW | c7.io (希奇❕) (fediverse) | free account | Chinese-speaking creators | Registration with disposable email addresses is not allowed. (AI-generated content must be disclosed.) | email + password | AI disclosure required | https://c7.io | yes: registrar candidate 4 |

## Allowed with conditions

The page allows a free post or listing under a condition, or shows free posting while the sign-up rules were not fully read tonight. None of these was acted on.

| Region | Country | Site | Free option | Audience | Promotion rule (their words) | Account requirements | Automation | Source | Amber can act? |
|---|---|---|---|---|---|---|---|---|---|
| North America | US | G2 (directory) | free vendor profile | software buyers | You represent and warrant that (a) you are at least 18 years old and have full authority to grant the rights outlined herein | 18+ representation, work e-mail | Review gating/incentivized reviews and automation restricted | https://legal.g2.com/terms-of-use | owner by form |
| Northern Europe | GB | Educational App Store (directory) | free listing (certification paid) | parents and teachers, UK | Get listed: Submit your App · App Submission Guide · AI Tool Submission Guide · Certification | developer account | Manual | https://www.educationalappstore.com/ | owner by form |
| Northern Europe | GB | Educational App Store submit app (directory) | free listing (certification paid) | parents and teachers, UK | Certified App Developer of Educational App Store (submission page) | Developer account; app must be live | Manual | https://www.educationalappstore.com/developers/submit-app | owner by form |
| Western Europe | DE | Quoka (classifieds) | free ad | Germany | Kostenlos inserieren | Email registration; commercial status declaration | Not stated | https://www.quoka.de/ | maybe |
| Western Europe | FR | gs.leftic.club (Mastodon) (fediverse) | free account | French-speaking political community | Les bots doivent s’identifier comme tel, et doivent mettre un lien vers leurs sources, a chaque post. | email + password | allowed when identified, with a source link per post | https://gs.leftic.club | possible (bot flag on, source link in each post); not acted: audience is not students |
| Western Europe | FR | mastodon.com.pl (Mastodon Poland) (fediverse) | free account | Poland | No spamming or explicit advertising allowed without proper introduction and/or other activity. … Upon creating an account, it is required to introduce oneself using the hashtag #introduction in one's post. | email + password | not addressed | https://mastodon.com.pl | yes, after an introduction post; not acted (one Mastodon account per lane) |
| Western Europe | NL | FOK!forum (student-forum) | Free forum posting; has school/study subforums | Netherlands (large general forum) | (registration form: member name and e-mail address only; the forum's rules on advertising were not readable) | member name + e-mail | Not stated | https://forum.fok.nl/ | maybe (e-mail-only registration; rules unread) |
| Southern Europe | ES | Tablon de Anuncios (classifieds) | free ad | Spain | Cómo poner anuncios gratis en Internet … Editor de anuncios gratis | Email | Not stated | https://www.tablondeanuncios.com/ | maybe |
| Southern Europe | GR | FreeList.gr (home) (classifieds) | free ad (lessons category) | Greece and Cyprus | Αγγελίες δωρεάν Ελλάδα για ακίνητα εργασία αυτοκίνητα μαθήματα (free ads, including lessons) | unknown | — | https://www.freelist.gr/ | maybe (sign-up not read) |
| Southern Europe | PT | Startup Portugal - Startup Hub (directory) | free profile | Portugal | a database built by the community, since the site allows each member to register | account | Manual | https://startupportugal.com/?p=75 | owner by form |
| Central & Eastern Europe | HU | Aprohirdetes.biz (home) (classifieds) | free ad | Hungary (small board) | Apróhirdetés ingyen (free small ads; limits per topic and user per the discovery pass) | registration required; fields unknown | — | https://aprohirdetes.biz/ | maybe |
| Central & Eastern Europe | HU | Ingyen-aprohirdetes.hu (home) (classifieds) | free ad, no registration | Hungary (small board) | Ingyenes hirdetés feladás másodpercek alatt (free ad posting in seconds; no registration per the discovery pass) | none - no registration, no activation email (per snippet) | — | http://ingyen-aprohirdetes.hu/ | maybe (rules page not read) |
| Central & Eastern Europe | RO | RomaniaUnita.com forum (other) | free forum post | Romania (small forum) | Daca detineti o informatie utila, ori vreti sa va faceti publicitate la afacerea dumneavoastra personala, este absolut totul gratis … Mica Publicitate: Locul perfect unde poti sa-ti faci reclama la un produs/blog/website sau firma | forum account | not addressed | https://www.romaniaunita.com/index.php | yes by web form (forum sign-up not checked) |
| Central & Eastern Europe | UA | FreeTrade.com.ua (home) (classifieds) | free ad | Ukraine (trade board) | Розміщення оголошень безоплатне … подати без реєстрації (free posting, no registration; a B2B board) | no registration needed - 'Для того, щоб додати оголошення достатньо заповнити одну просту форму.' | — | https://freetrade.com.ua/ | maybe (rules not read; B2B audience) |
| South Asia | PK | Startup.pk - Get your startup listed for free (directory) | free startup listing | Pakistan startup scene | Get your startup listed on Startup.pk for free … You can reach new customers and build a stronger brand. | submission form | Manual | https://startup.pk/get-your-startup-listed-on-startup-pk-for-free/ | owner or Amber by form; publication is editorial |
| Latin America | AR | Anunciar.co (Argentina) (home) (classifieds) | free ad | Argentina | Avisos clasificados gratis Argentina … avisos clasificados gratis profesionales | unknown | — | https://argentina.anunciar.co/ | maybe (sign-up not read) |
| Latin America | AR | Evisos Argentina (classifieds) | free ad | Argentina | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.com.ar/ | maybe |
| Latin America | BR | TabNews (other) | free post | Brazilian developers | Publicações com foco exclusivo comercial são expressamente proibidas. | account (email) | API exists | https://tabnews.com.br/faq | possible with a Portuguese 'pitch' post; not built |
| Latin America | CL | Evisos Chile (classifieds) | free ad | Chile | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.cl/ | maybe |
| Latin America | CO | Evisos Colombia (classifieds) | free ad | Colombia | Más clientes, sin pagar publicidad (free ads) | account | Unknown | https://www.evisos.com.co/ | maybe |
| Latin America | MX | Evisos Mexico (classifieds) | free ad | Mexico | Cómo publicar anuncios en Evisos Mexico … sólo debes buscar el ícono PUBLICAR AVISO | account | Unknown; typical classifieds ToS forbid bots | https://www.evisos.com.mx/ | maybe |
| Latin America | PE | Expat.com - Clasificados Peru (classifieds) | free ad | expats in Peru | (free classifieds in hobby/service categories) | account | Unknown | https://www.expat.com/es/clasificados/america-del-sur/peru/ | maybe |
| Southeast Asia | ID | IklanGratiz.com (home) (classifieds) | free ad, no registration | Indonesia | Pasang Iklan Baris Online Gratis Untuk Promosi Produk Jasa & Bisnis Tanpa Daftar (free ads for products, services and businesses, no registration) | no account; form fields per snippet: kategori, judul, isi iklan, kata kunci, harga, nama, email, telepon, lokasi (phone is a contact field, no verification mentioned) | — | https://www.iklangratiz.com/ | maybe (phone contact field) |
| Middle East & North Africa | AE | Mourjan (home) (classifieds) | free basic ad | UAE and the Gulf | أضف إعلانك مجاناً (add your ad for free; General Services category) | unknown | — | https://www.mourjan.com/ | maybe (terms page gone, sign-up not read) |
| East Asia | JP | したらば 【無料】ホームページ宣伝掲示板 (other) | free post | Japan | 【無料】ホームページ宣伝掲示板 (free website-promotion board) | none | Shitaraba prohibits spam floods; no API | https://jbbs.shitaraba.net/internet/18891/ | possible by form; low value |
| East Asia | KR | phdkim.net (김박사넷) (rules page) (student-forum) | free post on the promotion board | Korean graduate students | 이 게시판은 김박사넷 사용자에게 도움이 되는 정보와 이벤트를 자유롭게 홍보·게시할 수 있는 공간입니다. | site account | not addressed | https://phdkim.net/board/promotion/list | yes by web form, Korean-language post, if the sign-up needs only an e-mail |
| East Asia | KR | qdon.space (큐돈) (fediverse) | free account | Korea | 혼란을 유발하는 광고 금지 — 광고임을 명확히 밝히지 않는 스텔스 마케팅(일명 뒷광고) 등을 금지합니다. 광고임을 명확히 알 수 있는 정직하고 투명한 형태의 광고는 허용됩니다. | email + password; Korean literacy | not addressed | https://qdon.space | yes, with a Korean-language post labelled 광고; not acted tonight (the lane runs one Mastodon account, in English) |
| Global (directories, protocols) | GLOBAL | Share Your Startup (submit page) (directory) | free listing, no sign-up | startup browsers | Submit Your Startup Free — No-Signup Startup Directory (discovery pass); the page lists submissions with their age and votes | none | — | https://shareyourstartup.com/ | owner by form (or Amber by form once a publisher exists) |
| Global (directories, protocols) | GLOBAL | SourceForge Business Software directory (directory) | free software profile | software buyers, global | Add Your Software … About Your Company: Your Name, Email Address, Company, Your Title, Website, Phone | vendor form | Form-based | https://sourceforge.net/software/vendors/new | owner by form |
| Global (directories, protocols) | GLOBAL | UNO Directory (directory) | free listing (instant), backlink required | AI-tool directory, global | Automatic instant review: Listings go live immediately after submission … Everything in Free, plus … No backlink requirement (paid) | e-mail magic link (or Google) | form submission | https://uno.directory/submit-tool | yes by form once a backlink is placed on the StudyProofs page (a product change the owner decides) |
| Global (directories, protocols) | GLOBAL | UNO Directory terms (directory) | free listing with badge | AI-tool directory, global | By choosing a free listing, you agree to: Place the Uno Directory badge on your website in a visible location … You may register using: Google OAuth authentication, Email-based authentication (magic link) | Account + badge requirement (verified 2026-09) | Form-based | https://uno.directory/terms | yes by form once the badge is placed on the StudyProofs page (a product change the owner decides) |
| Global (directories, protocols) | GLOBAL | WordPress.com user guidelines (other) | free blog | search engines | Advertising isn't permitted unless you participate in the WordAds program or have a WordPress.com Plan that allows ad networks. | account (email) | API available | https://wordpress.com/support/user-guidelines/ | possible, low value |
| Fediverse servers outside the 54 countries | BG | Alo.bg (home) (classifieds) | free ad | Bulgaria | безплатни обяви … Публикувай обява (free ads; a Training and courses category per the discovery pass) | unknown | — | https://www.alo.bg/ | maybe (rules page missing, sign-up not read) |
| Fediverse servers outside the 54 countries | GLOBAL | Telegraph terms (other) | — | — | — | — | — | https://telegra.ph/api | possible; low value |
| Fediverse servers outside the 54 countries | — | mstdn.forfun.su (🇷🇺 Bot harbor. Blog for AI-driven posts 🇷🇺) (fediverse) | free account | bots and their owners | We want all bots to feel welcome and included in our server. … Keep your posts interesting and fun, like a chat with a friendly bot! | email + password | bots welcome | https://mstdn.forfun.su | possible; not acted: no student audience |

## Open servers whose rules speak of bots, brands or promotion as allowed (first pass)

Found by the scanner's wording match on open-registration servers; each still needs the hand review before it counts as qualified.

_none_

## Open Nostr relays

16 relays answered a NIP-11 policy request with no payment, auth or write restriction: nos.lol, nostr-pub.wellorder.net, nostr-relay.nokotaro.com, nostr.bitcoiner.social, nostr.mom, nostr.oxtr.dev, offchain.pub, purplepag.es, relay.damus.io, relay.lexingtonbitcoin.org, relay.mostr.pub, relay.nostr.info, relay.nostr.wirednet.jp, relay.nostrplebs.com, relay.primal.net, relay.snort.social. Nostr has no accounts and no site rules; a post needs a keypair and a publisher (secp256k1 signing), which is not built, and the audience is not students. Recorded, not acted.

## Rules that prohibit advertising, promotion or automation

| Region | Country | Site | Their words | Source |
|---|---|---|---|---|
| North America | US | entheoconnect.social (Entheoconnect.Social) | No spam. This includes commercial advertising, promotional campaigns, and SEO. | https://entheoconnect.social |
| North America | US | friendica.eskimo.com (Friendica Social Network) | 3) No spamming | https://friendica.eskimo.com |
| North America | US | gamerplus.org (G+DBN) | No spam | https://gamerplus.org |
| North America | US | gardenstate.social (Garden State Social) | (rules: advertising prohibited) | https://gardenstate.social |
| North America | US | lebrady.net (The LeBrady Federation) | No spam, but you can have a little bit of advertising, as a treat. | https://lebrady.net |
| North America | US | lilymagic.com (Lilymagic) | 禁止发布无关广告 | https://lilymagic.com |
| North America | US | nbaden.club (NBA Mastodon Community) | No spamming of any kind. | https://nbaden.club |
| North America | US | sakurajima.moe (Sakurajima (桜島）) | (rules: no AI bots) | https://sakurajima.moe |
| North America | US | topic-master.com (Topic-master) | Topic-Master.com is NOT a platform for commercial entities to sale their goods. | https://topic-master.com |
| Northern Europe | FI | peertube.nwps.fi (NWPS PeerTube) | (terms: advertising or marketing videos are prohibited) | https://peertube.nwps.fi |
| Northern Europe | FI | peertube.uno (PeerTube Uno Italia - Video Streaming italiano libero e federato) | (terms: advertising or marketing videos are prohibited) | https://peertube.uno |
| Northern Europe | GB | glasgow.social (Glasgow.social) | No spam. This includes commercial advertising, promotional campaigns, and SEO. | https://glasgow.social |
| Northern Europe | GB | social.ixcat.ovh (Mastodon) | Interdiction de la publicité et comptes commerciaux. | https://social.ixcat.ovh |
| Northern Europe | GB | The Student Room community guidelines | no advertising | https://www.thestudentroom.co.uk/help/community-guidelines |
| Northern Europe | NO | domum.social (Domum Social) | No racism, sexism, homophobia, transphobia, ableism, xenophobia, casteism, or other identity based discrimination  — Transphobic behavior such as intentional misgendering and deadnaming is strictly prohibited. Promotion of "conversion therapy" is strictly proh | https://domum.social |
| Northern Europe | SE | Flashback forum rules | Reklam och annonsering: Privata eller kommersiella annonser … inlägg innehållande reklam … är inte tillåtet | https://www.flashback.org/regler |
| Western Europe | AT | anonsys.net (-= anonsys.net =-) | Nicht genehmigte, getaggte oder automatisierte oder übermäßige Werbung (verboten) | https://anonsys.net |
| Western Europe | BE | mastodon-belgium.be (Mastodon Belgium) | No spam or advertising. | https://mastodon-belgium.be |
| Western Europe | DE | clip.place | no advertising | https://clip.place |
| Western Europe | DE | fairmove.net (fairmove) | keine Werbung | https://fairmove.net |
| Western Europe | DE | loma.ml ([ˈloma]) | (rules: purely commercial accounts are deleted) | https://loma.ml |
| Western Europe | DE | m.it.hs-worms.de (Mastodon Instanz der Hochschule Worms) | Spam, automatisierte Werbung oder betrügerische Inhalte sind nicht erlaubt. | https://m.it.hs-worms.de |
| Western Europe | DE | mainspitze.social | Übermäßige Werbung / Spam / Spamflut ist untersagt. | https://mainspitze.social |
| Western Europe | DE | minecraftvideos.net (Minecraft Peertube) | no ads | https://minecraftvideos.net |
| Western Europe | DE | nrw.social (NRW.social) | (rules: advertising prohibited) | https://nrw.social |
| Western Europe | DE | peertube.tinksic.com (Minecraft Peertube) | no ads | https://peertube.tinksic.com |
| Western Europe | DE | pouet.chapril.org (Mastodon Chapril) | (rules: advertising prohibited) | https://pouet.chapril.org |
| Western Europe | DE | ull.social (ULL.social) | NO PUBLICIDAD | https://ull.social |
| Western Europe | FR | peertube.mesnumeriques.fr (Mes Numériques) | Pas de publicit | https://peertube.mesnumeriques.fr |
| Western Europe | NL | masto.nu | No advertising, spam or excessive promotion. | https://masto.nu |
| Western Europe | NL | nrc.social (Mastodon) | Geen reclame | https://nrc.social |
| Southern Europe | ES | mast.lat (Mast.Lat) | (rules: advertising prohibited) | https://mast.lat |
| Southern Europe | ES | tkz.one (TKZ.One) | (rules: auto-publishing accounts are banned) | https://tkz.one |
| Southern Europe | ES | veedeo.org (Veedeo) | (terms: advertising or marketing videos are prohibited) | https://veedeo.org |
| Southern Europe | IT | Matematicamente.it forum | Nessuna pubblicità | https://www.matematicamente.it/forum/ |
| Southern Europe | IT | Skuola.net forum | Nessuna pubblicità | https://www.skuola.net/forum/ |
| Southern Europe | PT | left-bank.net (The Left Bank) | No commercial ads | https://left-bank.net |
| Central & Eastern Europe | CZ | SeznamSkol.eu discussions | (discussion rules: advertising is not allowed in the discussions) | https://www.seznamskol.eu/pravidla-diskuze/ |
| South Asia | IN | pagalguy.com (PaGaLGuY) (board) | Advertising (direct or surrogate), generating leads in public or through Private Messages on the forum is not allowed without permission of PaGaLGuY.com. | https://www.pagalguy.com/t/rules-posting-guidelines-reloaded/3009987 |
| South Asia | PK | List.com.pk terms | NO SPAM POLICY You understand and agree that sending unsolicited email advertis | https://www.list.com.pk/terms |
| Latin America | PE | Foros Peru - Zona Academica / Universidades | 1.5 No está permitida la publicidad (spam). | https://www.forosperu.net/help/terms/ |
| Southeast Asia | MY | Lowyat.NET Forum | No Advertising | https://forum.lowyat.net/PropertyTalk |
| Southeast Asia | SG | HardwareZone Forums (incl. EDMW) | advertising and/or promotional content are NOT allowed | https://forums.hardwarezone.com.sg/help/promo/ |
| Southeast Asia | VN | Tinh tế (tinhte.vn) | Nghiêm cấm quảng bá bất kỳ sản phẩm dưới bất kỳ hình thức nào, bao gồm nhưng không giới hạn việc gửi, truyền bất kỳ thông điệp nào mang tính quảng cáo | https://tinhte.vn/ |
| Middle East & North Africa | IL | kitch.win (Mastodon Glitch Edition) | No advertising | https://kitch.win |
| East Asia | TW | xn--j5r817a.com (嘟文 - 中文长毛象社区 - 开放注册，无需审核) | 严禁任何侵权内容，严禁广告 。未经允许，本实例禁止机器人账号，禁止镜像类型账号 | https://xn--j5r817a.com |
| Global (directories, protocols) | GLOBAL | community.wanikani.com (WaniKani Community) (board) | (terms: no bot-registered accounts) | https://community.wanikani.com/ |
| Global (directories, protocols) | GLOBAL | eudk/awesome-ai-tools (GitHub list) (home) | no ads | https://github.com/eudk/awesome-ai-tools |
| Global (directories, protocols) | GLOBAL | forum.freecodecamp.org (board) | (guidelines: refrain from self-promotion) | https://forum.freecodecamp.org/c/project-feedback/409 |
| Global (directories, protocols) | GLOBAL | forum.freecodecamp.org (rules page) | Please refrain from self-promotion of your projects (GitHub, Personal Website, etc) or social media | https://forum.freecodecamp.org/guidelines |
| Global (directories, protocols) | GLOBAL | moodle.org community forums (board) | You may only mention commercial products and services in the natural context of a discussion such as an answer to a question. You may not post unsolicited advertisements for products or services. | https://moodle.org/mod/page/view.php?id=7080 |
| Global (directories, protocols) | GLOBAL | WaniKani terms | Accounts registered by “bots” or other automated methods are not permitted. (Advertising on WaniKani: rules for promoting content) | https://www.wanikani.com/terms |
| Fediverse servers outside the 54 countries | YE | meyon.com.ye (ميون - النسخة التجريبية) | (terms: advertising or marketing videos are prohibited) | https://meyon.com.ye |
| Fediverse servers outside the 54 countries | — | india.goonj.xyz (goonj India) | No spam.   | https://india.goonj.xyz |
| Fediverse servers outside the 54 countries | — | jiaojiao.org (JiaoJiao) | 禁止广告 | https://jiaojiao.org |
| Fediverse servers outside the 54 countries | — | masto.nyc (Masto.NYC) | (rules: advertising prohibited) | https://masto.nyc |
| Fediverse servers outside the 54 countries | — | mstdn.ca (Mastodon Canada) | No spamming. Excessive posting, boosting, advertising or mass-marketing posts will be actioned accordingly and based on intent. | https://mstdn.ca |
| Fediverse servers outside the 54 countries | — | social.goonj.xyz (goonj India) | No spam.   | https://social.goonj.xyz |
| Fediverse servers outside the 54 countries | — | social.vivaldi.net (Vivaldi Social) | No promotion of AI, Cryptocurrencies or NFTs | https://social.vivaldi.net |
| Fediverse servers outside the 54 countries | — | wowcool.moe (哇酷wowcool) | (terms: advertising and bots prohibited) | https://wowcool.moe |
| Fediverse servers outside the 54 countries | — | zegheteens.nl (Zeg het eens) | (rules: no advertising) | https://zegheteens.nl |
| Fediverse servers outside the 54 countries | — | 服务条款 - 哇酷WowCool | 禁止发布广告 | https://cdn.wowcool.moe/pages/terms.html |

## Skipped sites and why

Counts per reason, with the sites named (fediverse servers by host). The CSV has every row with its quote.

- **Skipped: asks for a date of birth or sets an age rule at sign-up** — 42: Kijiji posting policies [CA]; Kijiji terms of use [CA]; qlub.social [CA]; Bluesky [US]; defcon.social [US]; mastodon.social [US]; uestc.social [US]; unredacted.social [US]; cyberplace.social [FI]; orvella.vir.group [FI]; Preloved terms [GB]; toot.wales [GB]; hessen.social [DE]; staging.mastodon.social [DE]; cupoftea.social [FR]; mastodon.uno [FR]; social.roadfm.fr [FR]; social.umoja.it [IT]; privacysafe.social [PT]; villageidiot.town [PT]; Publi24.ro [RO]; organica.social [BR]; thu.closed.social [SG]; Jiji Ghana [GH]; Jiji Kenya [KE]; Jiji Nigeria [NG]; farmgarden.nora.social [JP]; nora.social [JP]; muri.network [KR]; tea.codes [TW]; Tumblr community guidelines [GLOBAL]; crypto-only.org; espelunca.social; gaygeek.social; hear-me.social; mast.lt; mastodon.sg; mstdn.party; mstdn.plus; pieville.org; social.kryta.app; woodworking.group
- **Skipped: phone number or SMS verification** — 22: Craigslist [US]; Craigslist posting rules [US]; Jodel [DK]; Kleinanzeigen [DE]; ParuVendu [FR]; CustoJusto rules [PT]; Bazos.cz [CZ]; Quikr [IN]; Adjungle.pk [PK]; Servidos.ar Clasificados [AR]; Startup Base [BR]; IklanGratiz [ID]; Mudah.my [MY]; Kaidee [TH]; Chợ Tốt [VN]; Studentroom.co.za [ZA]; OpenSooq Egypt [EG]; Haraj [SA]; OpenSooq Saudi Arabia [SA]; Jimoty verification [JP]; ジモティー [JP]; Plurk [TW]
- **Skipped: identity, student or third-party login verification** — 13: 2dehands.be [BE]; Quoka [DE]; Marktplaats [NL]; Evisos Argentina [AR]; Evisos Chile [CL]; Evisos Colombia [CO]; Evisos México [MX]; 에브리타임 [KR]; makers.page [GLOBAL]; Productivity Directory [GLOBAL]; StartupBase.io [GLOBAL]; dev.to [GLOBAL]; Hashnode [GLOBAL]
- **Skipped: paid listing only** — 15: Aixploria [US]; BetaPage [US]; Preloved business definition [GB]; Develop Argentina - Directorio Tech [AR]; Develop Argentina directorio [AR]; Develop Argentina publicar [AR]; Dang.ai [GLOBAL]; eden.nostr.land [GLOBAL]; MicroLaunch [GLOBAL]; MicroLaunch submit [GLOBAL]; nostr.land [GLOBAL]; nostr.sebastix.dev [GLOBAL]; nostr.wine [GLOBAL]; PitchWall [GLOBAL]; ToolPilot [GLOBAL]
- **Skipped: manual moderator, admin or editorial approval** — 2451: blackshuck.net [CA]; bokante.o-k-i.net [CA]; bolha.us [CA]; cansoccer.social [CA]; cybersecurity.theater [CA]; dline.xyz [CA]; fedi.adamm.cc [CA]; fedi.hug.institute [CA]; findout.media [CA]; glaceon.social [CA]; hachyderm.wtf [CA]; hamont.social [CA]; humano.social [CA]; jornalismo.social [CA]; kamloops.social [CA]; mas.atmx.ca [CA]; mastodon.d14n.club [CA]; mastodon.drjpdns.com [CA]; mastodon.inner-visions.net [CA]; mastodon.novylen.net [CA]; mastodon.sketchwave.club [CA]; mastodon.theqonline.net [CA]; mastodon.xethos.net [CA]; mst3k.interlinked.me [CA]; mstd.katalik.lt [CA]; mstdn.mx [CA]; oceanplayground.social [CA]; ohyeahcss.com [CA]; onjase.quebec [CA]; patriot.online [CA]; peertube.ekosystems.fr [CA]; r.town [CA]; retrorewind.social [CA]; securitycafe.ca [CA]; social.freetalklive.com [CA]; social.fringesec.ca [CA]; social.rights.ninja [CA]; social.sineware.ca [CA]; social.uprootnutrition.com [CA]; social.xenofem.me [CA]; socialbc.ca [CA]; socialontario.ca [CA]; solarpunk.moe [CA]; someplace.social [CA]; spicycrust.pizza [CA]; sunny.garden [CA]; techhub.social [CA]; Thot Cursus [CA]; toot.snipesearch.co.uk [CA]; toots.matapacos.dog [CA]; trailers.ddigest.com [CA]; tsukihi.me [CA]; tv.atmx.ca [CA]; veganism.social [CA]; vid.cult9.xyz [CA]; video.linuxgame.dev [CA]; video.manu.quebec [CA]; video.mycrowd.ca [CA]; wheeli.social [CA]; yeg.bike [CA] … and 2391 more
- **Skipped: automated posting prohibited** — 2: Hacker News - Show HN [US]; Hacker News guidelines [US]
- **Skipped: AI accounts or AI-written content prohibited** — 3: fairy.id [US]; mastodon.nu [SE]; mastodon.au [AU]
- **Skipped: CAPTCHA at sign-up or posting (not bypassed)** — 284: blahaj.zone [CA]; firetribe.org [CA]; novoa.nagoya [CA]; social.fort1nd.com [CA]; zoner.work [CA]; birb.space [US]; byzantinenexus.io [US]; chiplak.com [US]; chomps.you [US]; Geebo [US]; Geebo [US]; Geebo [US]; Geebo [US]; Geebo services add [US]; gp.tsukimi.club [US]; hashi.icu [US]; hol.ogra.ph [US]; kittyy.mom [US]; misskey.7ka.org [US]; misskey.kyoupro.com [US]; oshi.social [US]; pmth.us [US]; sakurajima.social [US]; seediqbale.xyz [US]; sk.vore.media [US]; social.poketube.fun [US]; thecave.social [US]; tickler.cc [US]; transfem.social [US]; Uloop [US]; vsme.cc [US]; xn--s8w913fdga.chn.moe [US]; Amino.dk [DK]; Amino.dk betingelser [DK]; Amino.dk opret [DK]; Amino.dk regler [DK]; dvd.chat [FI]; intersex.social [FI]; misskey.social [FI]; orwell.fun [FI]; please-dominate.me [GB]; shrk.snfsx.xyz [SE]; Australian EdTech Directory [AU]; willhaben [AT]; willhaben [AT]; Zelfstandigen.vlaanderen forum [BE]; mk.absturztau.be [CH]; calckey.world [DE]; eepy.space [DE]; fedihub.space [DE]; hollow.raccoon.quest [DE]; ibe.social [DE]; jawsome.nevy.xyz [DE]; kitsune.moe [DE]; Kleinanzeigen [DE]; msk.owu.one [DE]; nanotrasen.zone [DE]; nuxy.social [DE]; otakuzatoka.cz [DE]; scrunkly.cat [DE] … and 224 more
- **Skipped: local business entity required, off-topic or reputational** — 70: oulipo.social [US]; peertube.snarkytechlab.com [US]; play.cotv.org.br [US]; Yelp for Business [US]; EdTech Denmark [DK]; Finder.fi [FI]; Startup100 [FI]; FreeIndex [GB]; LendED [GB]; Scoot [GB]; Vivastreet UK [GB]; TechIreland [IE]; 1881.no [NO]; Oslo Edtech Cluster [NO]; StartupMatcher [NO]; Hitta.se - Företag [SE]; Nordic Tech List [SE]; Pluggakuten [SE]; Swedish Edtech Industry - Edtechkartan [SE]; Swedish Edtest [SE]; The Hub [SE]; Australian EdTech Directory [AU]; Australian EdTech Directory [AU]; EduGrowth [AU]; StartLocal [AU]; TrueLocal [AU]; Yellow Pages Australia [AU]; EdTechNZ [NZ]; Finda [NZ]; NZ Entrepreneur magazine [NZ]; Yellow NZ [NZ]; Zenbu [NZ]; lokalmedial.de [DE]; shelter.moe [DE]; pass-education.fr — Forum enseignant [FR]; pass-education.fr — Forum enseignant [FR]; peerate.fr [FR]; prunedeprune.fr [FR]; skeptikon.fr [FR]; video.barcelo.ynh.fr [FR]; videos.maitregeek.eu [FR]; Startupxplore [ES]; Italian Startup Database [IT]; Firmy.cz [CZ]; Gyakorikerdesek.hu [HU]; MamStartup.pl [PL]; Panorama Firm [PL]; Search-AI.pl [PL]; Bangladesh.com Business Directory [BD]; Startup India [IN]; truthsocial.co.in [IN]; Clasf Pakistan [PK]; Doplim Argentina [AR]; Doplim Chile [CL]; Colombia Tech Report 2025-2026 [CO]; Directorio de Empresas y Servicios en Mexico [MX]; VC4A [NG]; Yellow Pages UAE [AE]; 9rayti.com [MA]; Tawjihnet [MA] … and 10 more
- **Skipped: registrations closed or archive only** — 897: bolha.tube [CA]; canal.facil.services [CA]; classe.iro.umontreal.ca [CA]; foubtube.com [CA]; partners.eqtube.org [CA]; peertube.eqver.se [CA]; peertube.redgate.tv [CA]; peoplemaking.games [CA]; pneumanode.com [CA]; tube.sleeping.town [CA]; tv.dilstories.com [CA]; vid.zeroes.ca [CA]; video.canadiancivil.com [CA]; video.lunago.net [CA]; video.qlub.social [CA]; video02.videohost.top [CA]; video2.jigmedatse.com [CA]; videos.evoludata.com [CA]; videos.spacebar.ca [CA]; watch.revolutionize.social [CA]; anarchy.tube [US]; autonomy.tube [US]; bedheadbernie.net [US]; bitcointv.com [US]; brioco.live [US]; canal.bizarro.cc [US]; cumraci.tv [US]; echoingdusk.social [US]; flipboard.video [US]; fltr.media [US]; greatview.video [US]; homoplaza.tv [US]; mountaintown.video [US]; neat.tube [US]; peertube.dair-institute.org [US]; peertube.fourangrydachshunds.nohost.me [US]; peertube.gsugambit.com [US]; peertube.jmsquared.net [US]; peertube.lagbag.com [US]; peertube.officebot.io [US]; peertube.pogmom.me [US]; peertube.sarg.dev [US]; peertube.servserv.net [US]; peertube.vanderb.net [US]; sc07.tv [US]; sfba.video [US]; spook.tube [US]; toobnix.org [US]; tube.dsocialize.net [US]; tube.me.jon-e.net [US]; tube.vocedemos.org [US]; tv.filmfreedom.net [US]; vid.prometheus.systems [US]; video.4d2.org [US]; video.asonix.dog [US]; video.chomps.you [US]; video.grayarea.org [US]; video.igem.org [US]; video.infiniteloop.tv [US]; video.macver.org [US] … and 837 more

## Not read tonight

- **Not read: bot wall (403/429/5xx) on the runner** — 238: 1point3acres ad board; 1point3acres.com; AI比較ラボ; Addelma.hu; Adpost; Adpost Philippines; Adverts.ie; Adverts.ie terms; Amino.dk; Anibis.ch; Aprohirdetes24.hu; Argentino.com.ar; Avito.ma; Bakeca.it; Bakeca.it regole; Bear Blog; Bezaat; Bikroy.com; Boards.ie; Boards.ie terms; Brabys; Capterra; Carousell Hong Kong; Clasificados La Voz; ClassifiedAds.com; ClassifiedAds.com help; ClassifiedAds.com terms; Classifieds.co.za; Classifieds.co.zw; ClickAnnonce; ClickBD; Crunchbase add company; Cylex Canada; Cylex Ireland; Cylex South Africa; Cylex UK; Cylex UK add company; Cylex.hu; Czechia Dealroom; Dcard; DealMarkaz.pk; Diskusjon.no; Diskusjon.no regler; Doplim Brasil; Dubizzle Egypt; Dubizzle UAE; Easy.co.il; Eniro Företag; Expatriates.com; Expatriates.com create account; FINN.no; FXP forums; Finn.no vilkår; Foros Peru Club; Forum Softpedia; FreeList.gr; Freeads UK terms; Freeads.co.uk; Friday-Ad; Futurepedia; G2; GhanaYello; Gulesider.no; Gumtree Australia terms; Hirdetesingyen.hu; Hotfrog; Hotfrog Australia; Hotfrog Canada; Hotfrog Ireland; Hotfrog New Zealand; Hotfrog UK; Huuto.net; Indie Hackers; Indie Hackers - Products; Indie Hackers community rules; Indotrading; Irish Tech News; Jofogas.hu; Junk Mail; Justdial Free Listing … and 120 more
- **Not read: unreachable or not resolving** — 311: 88DB Hong Kong; AI Tool Hunt; Adgraft; Alo.bg; Blocket; CKFU student forum; Clasf Colombia; Clasificados El Tiempo; ClassifiedSG; Cofe-cup; CoinAfrique; DBA.dk; Densiva; Dhakasnob business directory; Diretorio de Empresas Portuguesas; Doplim Mexico; Doplim Peru; Evisos Peru; Gumtree.pl; Indonetwork; Ingyen-aprohirdetes.hu; Jedi.co.ke; Kleinanzeigen-Gratis.com; Launched!; Launched.io; Locanto Danmark; Locanto Italia; Locanto Malaysia; Locanto Norge; Locanto Pakistan; Locanto Portugal; Locanto Suomi; Locanto Sverige; Mastodon Indonesia; Meet 創業小聚; Micapublicitate.ro; MyBenta; NZS.com; Nextdoor; Numbala; OLX Indonesia; P@SHA Pakistan Startup Directory; Pendekar Iklan; SGSearch; Skolediskusjon.no; Startup Base; Startup Hub Portugal; StartupBase; StudentGuru.gr; Tapuz forums; Urbania / Computrabajo; WHub; about.mastodon.africa; aggeliopolis.gr; agora.energieincomune.com; akolades.com; algebra.chat; amastodon.uk; atta.ch.to; aussie.zone; bbs.9tail.net; bear-den.org; blazecat.social; bolha.io; campfyre.nickwebster.dev; civilloquy.com; content.wissen-ist-relevant.com; cornelius-bell.com; crustaceanson.theshelf.top; csictv.csic.es; curieuxraton.tv; cuties.zip; deaf.social; dedinit.ru; discuss.codecademy.com; dreamspace.video; dykes.ca; eibazar.com; esc.ozar.dev; estrogen.cat … and 226 more
- **Not read: rules page returned 404** — 117: AI Tool Scoop; Aixploria; Alloprof - Zone d'entraide; Alo.bg; AlternativeTo; Anuntul.ro termeni; Aponhut terms; Aprohirdetes.biz; Bear Blog terms; Blocket annonsregler; BusinessGhana add listing; Businesslist.co.ke add company; Businesslist.com.ng add company; DBA regler; DOU.ua rules; DoneDeal terms; EdTech Impact vendor listing; Educational App Store AI tool submission guide; Educational App Store developers; Egyetemistak.hu szabályzat; Evisos Argentina ayuda; Evisos Argentina publicar; Evisos Argentina términos; Evisos México términos; Expat.com classifieds charter; Expat.com classifieds rules; Expat.com legal; Expat.com terms; FOK!forum regels; Finda NZ; Forum.Studia.net guidelines; Geebo; Geekzone forums; GradCafe forum guidelines; GulogGratis; Gumtree Australia; Gumtree UK; Gumtree UK terms; Hyperinzerce podmínky; ISTE Learning Technology Directory / EdTech Index; Indie Hackers community guidelines; LIHKG 連登; Lajumate.ro; LesPAC; Marocannonces conditions; Marocannonces déposer; Mercado Libre Argentina términos; Mercado Libre Colombia; Mercado Libre Perú; MicroLaunch pricing; Muaban.net; OLX Brasil regras; OLX Pakistan; OpenHunts; PR TIMES スタートアップチャレンジ; PRLog free press release; PantipMarket help; PantipMarket terms; ParuVendu CGU; ParuVendu conditions; Publi24.ro; Quoka AGB; Quoka Anzeigenregeln; Quoka Registrierung; RomaniaUnita.com Mica Publicitate board; RomaniaUnita.com registration; RomaniaUnita.com terms; SA Yellow terms; SaaSHub terms; Sbazar pravidla; Ser Universitario foro reglas; Startbase; Startup Montréal - Répertoire des startups; Startup Portugal hub; StartupRanking add startup; Studentroom.co.za terms; Studis Online Fragen-Brett Regeln; Studyclix; Subito.it; Suomi24 Keskustelu … and 35 more

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
| GLOBAL | Hashnode | Skipped: identity, student or third-party login verification | sign-up only through google | https://hashnode.com/ |
| GLOBAL | dev.to | Skipped: identity, student or third-party login verification | sign-up only through google | https://dev.to/enter?state=new-user |
| MX | Evisos México | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.evisos.com.mx/ |
| NL | Marktplaats | Skipped: identity, student or third-party login verification | sign-up only through google | https://www.marktplaats.nl/ |
| AT | willhaben | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.willhaben.at/ |
| AU | Australian EdTech Directory | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://australianedtech.com.au/directory-application-form/ |
| BG | Bazar.bg | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://bazar.bg/ |
| DE | Kleinanzeigen | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://www.kleinanzeigen.de/ |
| DE | Startbase (Börse Stuttgart startup platform) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.startbase.de/ (profile creation) |
| FR | ParuVendu | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.paruvendu.fr/ |
| FR | Toutunservice.fr | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.toutunservice.fr/ |
| GLOBAL | Lemmy: discuss.online | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://discuss.online/signup |
| GLOBAL | Lemmy: lemmy.dbzer0.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.dbzer0.com/signup |
| GLOBAL | Lemmy: lemmy.ml | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.ml/signup |
| GLOBAL | Lemmy: lemmy.today | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.today/signup |
| GLOBAL | Lemmy: lemmy.zip | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://lemmy.zip/signup |
| GLOBAL | Lemmy: sopuli.xyz | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://sopuli.xyz/signup |
| GLOBAL | superprof.com (tutoring marketplace, country sites) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://www.superprof.com/ |
| KE | Businesslist.co.ke | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.businesslist.co.ke/ |
| MA | Marocannonces | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.marocannonces.com/ |
| NG | Businesslist.com.ng | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.businesslist.com.ng/ |
| PL | Forum.Studia.net | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://forum.studia.net/register/ |
| PT | Uniarea forum | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (turnstile) | https://www.uniarea.com/forum/ |
| TH | Pantip (PantipMarket's account) | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://pantip.com/register/email |
| US | Geebo | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://geebo.com/services/add/ (services post form; sign-up page not seen) |
| US | Geebo | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://geebo.com/services/add/ |
| US | Uloop | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (recaptcha) | https://www.uloop.com/ |
| VN | raovatsinhvien.com | Skipped: CAPTCHA at sign-up or posting (not bypassed) | CAPTCHA on the sign-up form (other) | https://raovatsinhvien.com/ |
| BR | TabNews | Not read: bot wall (403/429/5xx) on the runner | HTTP 403 | https://tabnews.com.br/cadastro |
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
| AR | Tusclases.com.ar | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:ctl00$m$txtnombre, text:ctl00$m$nifcif, text:ctl00$m$txtdireccion, text:ctl00$m$txttelefono, checkbox:ctl00$m$chkinteres$chkinteres_0, checkbox:ctl00$m$chkinteres$chkinteres_1, text:ctl00 | https://www.tusclases.com.ar/anunciarse/ ('¿Qué tipo de anuncio gratuito quieres publicar?') |
| CO | Colombia Move (publicar) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:Tu email para publicar, file:?, file:?, file:? | https://colombiamove.com/publicar |
| CZ | Hyperinzerce.cz | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:query, checkbox:DistanceSearch, text:Email, checkbox:IsConsentGranted | https://www.hyperinzerce.cz/ |
| DE | Gründerküche Startup-Guide | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: email:EMAIL, text:FNAME, text:LNAME, checkbox:AGREE_TO_TERMS, text:_mc4wp_honeypot, text:?, text:?, text:? | https://www.gruenderkueche.de/startup-guide-eintrag/ |
| FR | pass-education.fr — Forum enseignant | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:s, text:email, text:password, text:code_parrainage, text:email, text:password, text:code_parrainage, text:email | https://www.pass-education.fr/ |
| GLOBAL | AI Study Master (student AI tools directory) | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: checkbox:botcheck, text:full_name, email:email, text:product_name, url:website_url, text:short_description, file:logo, radio:student_discount | https://aistudymaster.com/submit-resource/ |
| GLOBAL | The Startup Project directory | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:fax_number, text:founderName, email:email, text:companyName, url:website, text:tagline, checkbox:consent | https://startupproject.org/submit-startup/ |
| GLOBAL | ToolDirs | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:url, text:name, text:tagline, file:?, file:?, text:discountCode, text:youtubeUrl, text:githubUrl | https://tooldirs.com/submit |
| JP | ジモティー | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:user[name], email:user[email], password:user[password], checkbox:user[mail_magazine_recievable] | https://jmty.jp/ |
| MY | Mudah.my | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:email, password:password, password:verification_password, checkbox:pdpa_opt_in | https://www.mudah.my/ |
| NL | FOK!forum | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:query, text:member, email:email, checkbox:policy, text:short | https://forum.fok.nl/ |
| PK | List.com.pk | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:keyw, text:m_email, password:m_password, password:confirm_password, checkbox:terms | https://list.com.pk/ |
| PK | Startup.pk | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:spk_name, email:spk_email | https://startup.pk/ |
| RO | Publi24.ro | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:?, number:?, text:?, text:?, text:?, email:Email, password:Password, checkbox:MarketingOptIn | https://www.publi24.ro/login |
| RO | RomaniaUnita.com forum | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:auth, password:password, checkbox:remember_me, checkbox:anonymous, radio:type, radio:type, radio:search_and_or, radio:search_and_or | https://www.romaniaunita.com/ |
| TH | PantipMarket | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:username, password:password, checkbox:rememberLogin, text:search_keyword, checkbox:search_province_relate, checkbox:search_member_only, checkbox:prov_relate, email:comment_site_email | https://www.pantipmarket.com/ |
| UA | DOU.ua | asks for e-mail and password only (no phone, date of birth or CAPTCHA seen) | fields: text:q, text:username, password:password, email:username, checkbox:? | https://dou.ua/ |
| AE | Mourjan | fields not readable (JavaScript shell or no form found) | no readable form | https://www.mourjan.com/ |
| AR | Anunciar.co | fields not readable (JavaScript shell or no form found) | no readable form | https://anunciar.co/ |
| AR | Ser Universitario foro | fields not readable (JavaScript shell or no form found) | no readable form | https://seruniversitario.com/foro |
| BD | Aponhut | fields not readable (JavaScript shell or no form found) | no readable form | https://www.aponhut.com/ |
| BE | Vivastreet BE | fields not readable (JavaScript shell or no form found) | no readable form | https://www.vivastreet.be/ |
| BR | Fórum PiR2 | fields not readable (JavaScript shell or no form found) | no readable form | https://pir2.forumeiros.com/ |
| CO | Colombia Move | fields not readable (JavaScript shell or no form found) | no readable form | https://colombiamove.com/ |
| CZ | Bazos.cz | fields not readable (JavaScript shell or no form found) | no readable form | https://www.bazos.cz/ |
| CZ | Sbazar.cz | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sbazar.cz/ |
| DE | Studis Online Fragen-Brett | fields not readable (JavaScript shell or no form found) | no readable form | https://www.studis-online.de/Fragen-Brett/ |
| DK | GulogGratis | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.guloggratis.dk/ |
| ES | Tablón de Anuncios | fields not readable (JavaScript shell or no form found) | no readable form | https://www.tablondeanuncios.com/ |
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
| HU | Egyetemistak.hu | fields not readable (JavaScript shell or no form found) | no readable form | https://egyetemistak.hu/ |
| IL | Yad2 | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.yad2.co.il/ |
| IN | Click.in | fields not readable (JavaScript shell or no form found) | no readable form | https://www.click.in/ |
| IN | pagalguy.com (PaGaLGuY) | fields not readable (JavaScript shell or no form found) | no readable form | https://www.pagalguy.com/ |
| KR | phdkim.net (김박사넷) | fields not readable (JavaScript shell or no form found) | no readable form | https://phdkim.net/ |
| NL | Speurders.nl | fields not readable (JavaScript shell or no form found) | no readable form | https://www.speurders.nl/ |
| RO | Anuntul.ro | fields not readable (JavaScript shell or no form found) | no readable form | https://www.anuntul.ro/ |
| SE | Citiboard | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://citiboard.se/ |
| SG | AI Tool Scoop | fields not readable (JavaScript shell or no form found) | no readable form | https://aitoolscoop.com/submit-tool/ |
| SG | SG Ads Online | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sgadsonline.com/ |
| TH | Kaidee | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://www.kaidee.com/ |
| UA | FreeTrade.com.ua | fields not readable (JavaScript shell or no form found) | no readable form | https://freetrade.com.ua/ |
| UA | Ukrboard | fields not readable (JavaScript shell or no form found) | no readable form | https://ukrboard.com.ua/ |
| US | ISTE Learning Technology Directory / EdTech Index | fields not readable (JavaScript shell or no form found) | no readable form (JavaScript shell) | https://ltd.iste.org/ (company registration); info: https://iste.org/edtech-products-database |
| ZA | SA Yellow | fields not readable (JavaScript shell or no form found) | no readable form | https://www.sayellow.com/ |

## Read, but not qualified

475 pages or servers answered, but nothing on them says a free promotional post or listing is allowed (open fediverse servers with no rule about promotion, home pages without the rules, JavaScript-only pages). They stay out of the qualified count on purpose; the CSV lists them.

## Method and limits

- Probes ran on GitHub Actions runners (`.github/workflows/sp-region-scan.yml`, `scan/probe.mjs`): Mastodon-family servers through `/api/v2/instance` (registrations, min_age, rules), PeerTube through `/api/v1/config`, Lemmy `/api/v3/site`, Misskey `/api/meta`, Pixelfed nodeinfo, Nostr NIP-11, and plain pages for classifieds, forums and directories with keyword markers (CAPTCHA, phone, date of birth, identity, payment, approval) in nine languages.
- Candidates came from the fediverse directories (FediDB, JoinPeerTube, Lemmyverse) and from six discovery passes over the 54 countries in local languages; sites behind bot walls could not be read from a runner and are listed as not read rather than guessed.
- No account was created tonight beyond the PeerTube channel that already exists; Amber's Mastodon registrar (amberai #847) will open the StudyProofs account on the first qualified server in its list when it deploys, and the first post goes out at the next tick (amberai #846).
- Nothing was paid, no CAPTCHA was bypassed, no birthday, phone number or identity document was supplied, and no one was messaged.
