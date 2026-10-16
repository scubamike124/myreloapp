// Read-only research probe for the StudyProofs region scan (owner's instruction, 2026-10-16): reads each candidate site's OWN
// registration state and rules through its public API or its rules page, extracts the sentences about advertising, promotion,
// bots and sign-up requirements, and writes one JSON line per site. It registers nothing, posts nothing and sends no credential.
// Usage: node scan/probe.mjs <targets.json> <out.jsonl>
import fs from "node:fs";

const [, , targetsPath, outPath] = process.argv;
const targets = JSON.parse(fs.readFileSync(targetsPath, "utf8"));
const out = fs.createWriteStream(outPath, { flags: "a" });
const UA = "StudyProofs-region-scan/1.0 (read-only research of public rules; https://hq.amberoneai.com/studyproofs)";
const now = () => new Date().toISOString();

async function get(url, { accept = "application/json, text/html;q=0.9, */*;q=0.5", method = "GET", body, headers = {}, ms = 15000 } = {}) {
  try {
    const res = await fetch(url, { method, body, redirect: "follow", headers: { Accept: accept, "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(ms) });
    const text = await res.text().catch(() => "");
    let json = null;
    if (/^\s*[[{]/.test(text)) { try { json = JSON.parse(text); } catch { json = null; } }
    return { status: res.status, url: res.url, text, json, type: res.headers.get("content-type") || "" };
  } catch (e) {
    return { status: 0, url, text: "", json: null, error: String(e?.message || e).slice(0, 120) };
  }
}
const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v : "");
const stripTags = (html) => str(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

// Words that mark a sentence as being about advertising, promotion, automation or sign-up requirements, in the languages of the 54 countries.
const KEYWORDS = /advertis|promot|spam|commercial|marketing|\bbots?\b|automat|self[- ]?promo|solicit|business account|brand|werbung|kommerziell|eigenwerbung|publicit|autopromo|entreprise|comercial|publicidad|promoci|empresa|publicidade|promo[çc]|pubblicit|promozion|aziend|reclame|promotie|commerci|bedrijf|reklam|promoc|komercyj|autopromoc|propagac|komer[čc]|hirdet|kereskedelmi|реклам|промо|спам|комерц|коммерч|бот|самореклам|annons|egenreklam|mainos|mainonta|roskaposti|kaupalli|botti|διαφήμ|προώθ|εμπορικ|tanıtım|ticari|otomatik|إعلان|ترويج|تجاري|بوت|פרסום|קידום|מסחרי|विज्ञापन|प्रचार|स्पैम|व्यावसायिक|اشتہار|تشہیر|বিজ্ঞাপন|প্রচার|広告|宣伝|スパム|商用|営利|自動|광고|홍보|스팸|상업|자동|广告|廣告|宣传|宣傳|垃圾|商业|商業|机器人|機器人|自动|โฆษณา|สแปม|พาณิชย์|บอท|quảng cáo|khuyến mãi|thương mại|tự động|iklan|promosi|komersial|otomatis|automatik|patalastas|promosyon|komersyal|matangazo|kibiashara/i;
const SIGNUP = /date of birth|birthday|birthdate|\bage\b|years old|phone|sms|mobile number|identity|government id|kyc|passport|captcha|invite|invitation|approval|approve|moderat|manual review|verified by|geburtsdatum|telefon|date de naissance|téléphone|fecha de nacimiento|teléfono|data de nascimento|telefone|data di nascita|生年月日|電話|생년월일|전화|出生日期|手机|电话|電話番号/i;
// Bans, the way the registrar reads them, plus the same meaning in other languages. A hit is a first-pass flag; the extracted sentences decide.
const BANS = [
  [/\bno (fully[- ])?(automat\w*|ai[- ]?(run|operated|driven|generated)?|bot)s? ?accounts?\b/i, "automated or AI accounts not allowed"],
  [/\b(ai|automated|bot)s? accounts? (are|is) (not (allowed|permitted|welcome)|prohibited|forbidden|banned)/i, "automated or AI accounts not allowed"],
  [/accounts? (managed|run|operated) by (the )?(ai|an ai|llm)/i, "AI-run accounts not allowed"],
  [/\bno (commercial )?(advertis\w*|promotion\w*|self[- ]promotion|marketing|ads)\b/i, "advertising or promotion not allowed"],
  [/\b(advertis\w*|promotion\w*|promotional|commercial (content|posts?|accounts?))\b[^.]{0,60}\b(not (allowed|permitted|tolerated|accepted)|prohibited|forbidden|deleted|banned|removed)\b/i, "advertising or promotion not allowed"],
  [/\bno spam\b[\s\S]{0,80}?\b(advertis|promot|commercial)/i, "advertising counts as spam"],
  [/\b(each|every) (username|account) (on here )?should be a person\b|\bpersonal accounts only\b|\bpeople,? not (companies|brands)\b/i, "person-only accounts"],
  [/\b(keine|kein|ohne) werbung\b|werbung[^.]{0,40}(verboten|nicht erlaubt|untersagt)/i, "no advertising (de)"],
  [/\bpas de publicit|publicit[eé][^.]{0,40}(interdit|pas autoris)/i, "no advertising (fr)"],
  [/\b(no|sin) publicidad\b|publicidad[^.]{0,40}(prohibid|no (est[aá] )?permitid)/i, "no advertising (es)"],
  [/\b(sem|n[aã]o [eé] permitid[ao]) publicidade\b|publicidade[^.]{0,40}(proibid|n[aã]o permitid)/i, "no advertising (pt)"],
  [/\b(niente|nessuna|vietata? la) pubblicit|pubblicit[aà][^.]{0,40}(vietat|non (è )?(consentit|permess))/i, "no advertising (it)"],
  [/\bgeen reclame\b|reclame[^.]{0,40}(verboden|niet toegestaan)/i, "no advertising (nl)"],
  [/\bzakaz reklam|reklam\w*[^.]{0,30}(zabronion|niedozwolon)/i, "no advertising (pl)"],
  [/реклам\w*[^.]{0,40}(запрещ|заборон)|(запрещ|заборон)\w*[^.]{0,40}реклам/i, "no advertising (uk/ru)"],
  [/広告[^。]{0,20}禁止|禁止[^。]{0,20}広告|宣伝[^。]{0,20}禁止/, "no advertising (ja)"],
  [/광고[^.]{0,20}금지|금지[^.]{0,20}광고|홍보[^.]{0,20}금지/, "no advertising (ko)"],
  [/禁止[^。]{0,20}(广告|廣告|宣传|宣傳)|(广告|廣告)[^。]{0,20}禁止/, "no advertising (zh)"],
  [/reklam\w*[^.]{0,30}yasak/i, "no advertising (tr)"],
  [/\bmainonta[^.]{0,40}kielletty|mainokset kielletty/i, "no advertising (fi)"],
  [/\b(ingen|inga) reklam\b|reklam[^.]{0,30}(förbjud|ikke tillatt|forbudt)/i, "no advertising (sv/no/da)"],
];
function banScan(texts) {
  for (const t of texts) for (const [re, why] of BANS) if (re.test(t)) return { blocked: true, why, quote: (t.match(re)?.[0] || "").slice(0, 160) };
  return { blocked: false };
}
function pickSentences(text, re = KEYWORDS, max = 14) {
  const parts = str(text).split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const hits = [];
  for (const s of parts) { if (re.test(s)) hits.push(s.length > 240 ? s.slice(0, 240) + "…" : s); if (hits.length >= max) break; }
  return hits;
}

async function probeMastodon(t) {
  const base = t.url.replace(/\/+$/, "");
  const [v2, rules, ext] = await Promise.all([get(`${base}/api/v2/instance`), get(`${base}/api/v1/instance/rules`), get(`${base}/api/v1/instance/extended_description`)]);
  if (v2.status !== 200 || !isObj(v2.json)) {
    const v1 = await get(`${base}/api/v1/instance`);
    if (v1.status !== 200 || !isObj(v1.json)) return { reachable: false, status: v2.status || v1.status, error: v2.error || v1.error };
    const j = v1.json; const reg = typeof j.registrations === "boolean" ? { enabled: j.registrations, approval_required: !!j.approval_required, min_age: null } : { enabled: null };
    const ruleTexts = Array.isArray(rules.json) ? rules.json.map((r) => str(r.text)).filter(Boolean) : [];
    const desc = stripTags(str(j.description) + " " + str(j.short_description));
    return { reachable: true, api: "v1", title: str(j.title), users: j.stats?.user_count ?? null, languages: j.languages || [], registrations: reg, rules: ruleTexts, description: desc.slice(0, 400), bans: banScan([...ruleTexts, desc]), extracts: pickSentences(desc) };
  }
  const j = v2.json; const r = isObj(j.registrations) ? j.registrations : {};
  const ruleTexts = Array.isArray(rules.json) ? rules.json.map((x) => (str(x.hint) ? `${str(x.text)} — ${str(x.hint)}` : str(x.text))).filter(Boolean) : Array.isArray(j.rules) ? j.rules.map((x) => str(x.text)) : [];
  const extended = isObj(ext.json) ? stripTags(str(ext.json.content)) : "";
  const desc = stripTags(str(j.description));
  const texts = [...ruleTexts, desc, extended];
  return { reachable: true, api: "v2", title: str(j.title), users: j.usage?.users?.active_month ?? null, languages: j.languages || [], registrations: { enabled: r.enabled ?? null, approval_required: r.approval_required ?? null, min_age: r.min_age ?? null, message: str(r.message).slice(0, 200) || null }, rules: ruleTexts, description: desc.slice(0, 400), extended: extended.slice(0, 600), bans: banScan(texts), extracts: pickSentences(extended) };
}
async function probePeertube(t) {
  const base = t.url.replace(/\/+$/, "");
  const [cfg, about] = await Promise.all([get(`${base}/api/v1/config`), get(`${base}/api/v1/config/about`)]);
  if (cfg.status !== 200 || !isObj(cfg.json)) return { reachable: false, status: cfg.status, error: cfg.error };
  const s = isObj(cfg.json.signup) ? cfg.json.signup : {}; const u = isObj(cfg.json.user) ? cfg.json.user : {};
  const inst = isObj(about.json) && isObj(about.json.instance) ? about.json.instance : {};
  const texts = ["terms", "codeOfConduct", "moderationInformation", "description", "creationReason"].map((k) => stripTags(str(inst[k]))).filter(Boolean);
  return { reachable: true, title: str(cfg.json.instance?.name), version: str(cfg.json.serverVersion), signup: { allowed: s.allowed ?? null, requiresApproval: s.requiresApproval ?? null, requiresEmailVerification: s.requiresEmailVerification ?? null, minimumAge: s.minimumAge ?? null }, videoQuota: u.videoQuota ?? null, languages: Array.isArray(inst.languages) ? inst.languages : [], bans: banScan(texts), extracts: pickSentences(texts.join(" ")), termsChars: texts.join(" ").length };
}
async function probeLemmy(t) {
  const base = t.url.replace(/\/+$/, "");
  const r = await get(`${base}/api/v3/site`);
  if (r.status !== 200 || !isObj(r.json)) return { reachable: false, status: r.status, error: r.error };
  const ls = r.json.site_view?.local_site || {}; const site = r.json.site_view?.site || {};
  const texts = [stripTags(str(site.description)), stripTags(str(site.sidebar)), stripTags(str(ls.legal_information))].filter(Boolean);
  return { reachable: true, title: str(site.name), users: r.json.site_view?.counts?.users ?? null, registration_mode: ls.registration_mode ?? null, captcha: ls.captcha_enabled ?? null, application_question: str(ls.application_question).slice(0, 200) || null, bans: banScan(texts), extracts: pickSentences(texts.join(" ")) };
}
async function probePixelfed(t) {
  const base = t.url.replace(/\/+$/, "");
  const [ni, inst] = await Promise.all([get(`${base}/api/nodeinfo/2.0.json`), get(`${base}/api/v1/instance`)]);
  const open = isObj(ni.json) ? ni.json.openRegistrations ?? null : null;
  const desc = isObj(inst.json) ? stripTags(str(inst.json.description)) : "";
  const users = isObj(inst.json) ? inst.json.stats?.user_count ?? null : null;
  return { reachable: ni.status === 200 || inst.status === 200, openRegistrations: open, users, description: desc.slice(0, 300), bans: banScan([desc]), note: "Pixelfed signs up through its web form only (no registration API)" };
}
async function probeMisskey(t) {
  const base = t.url.replace(/\/+$/, "");
  const r = await get(`${base}/api/meta`, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
  if (r.status !== 200 || !isObj(r.json)) return { reachable: false, status: r.status, error: r.error };
  const j = r.json; const desc = stripTags(str(j.description));
  return { reachable: true, title: str(j.name), disableRegistration: j.disableRegistration ?? null, emailRequired: j.emailRequiredForSignup ?? null, captcha: { hcaptcha: !!j.enableHcaptcha, recaptcha: !!j.enableRecaptcha, turnstile: !!j.enableTurnstile, mcaptcha: !!j.enableMcaptcha }, languages: j.langs || [], tos: str(j.tosUrl) || null, bans: banScan([desc]), description: desc.slice(0, 300) };
}
async function probeNostr(t) {
  const url = t.url.replace(/^wss?:\/\//, "https://").replace(/\/+$/, "");
  const r = await get(url, { accept: "application/nostr+json" });
  if (!isObj(r.json)) return { reachable: r.status > 0, status: r.status, error: r.error, note: "no NIP-11 document" };
  const j = r.json; const lim = isObj(j.limitation) ? j.limitation : {};
  const texts = [str(j.description), str(j.posting_policy)].filter(Boolean);
  return { reachable: true, name: str(j.name), description: str(j.description).slice(0, 300), posting_policy: str(j.posting_policy) || null, payments_required: lim.payment_required ?? null, auth_required: lim.auth_required ?? null, restricted_writes: lim.restricted_writes ?? null, min_pow: lim.min_pow_difficulty ?? null, fees: j.fees ? JSON.stringify(j.fees).slice(0, 200) : null, software: str(j.software), bans: banScan(texts) };
}
async function probeHtml(t) {
  const r = await get(t.url, { accept: "text/html,application/xhtml+xml,*/*;q=0.8", ms: 20000 });
  const html = r.text || "";
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const text = stripTags(html);
  const markers = {
    captcha: /hcaptcha|recaptcha|turnstile|challenge-platform|cf-chl|cf_chl|just a moment|verify you are human/i.test(html),
    phone: /\b(phone number|mobile number|sms code|verify (your )?phone|telefonnummer|num[eé]ro de t[eé]l[eé]phone|n[uú]mero de tel[eé]fono|電話番号|휴대폰|手机号)\b/i.test(text),
    dob: /date of birth|birthday|birthdate|geburtsdatum|date de naissance|fecha de nacimiento|data de nascimento|生年月日|생년월일|出生日期/i.test(text),
    identity: /identity verification|government[- ]issued|passport|national id|kyc/i.test(text),
    payment: /\b(pricing|per month|\/month|paid plan|credit card|checkout)\b/i.test(text),
    approval: /manual(ly)? (review|approv)|reviewed by (our|the) (team|moderators)|subject to approval|await(ing)? approval|moderation queue/i.test(text),
    login_wall: /\b(sign in|log in|login) to (view|see|continue)\b/i.test(text),
  };
  return { reachable: r.status > 0, status: r.status, finalUrl: r.url, title, chars: text.length, markers, extracts: pickSentences(text), signupExtracts: pickSentences(text, SIGNUP, 8), bans: banScan([text]), error: r.error };
}

async function expandDirectory(t) {
  const list = [];
  if (t.source === "fedidb") {
    const want = new Set((t.software || ["mastodon"]).map((s) => s.toLowerCase()));
    let url = "https://api.fedidb.org/v1/servers?limit=40"; let pages = 0;
    while (url && pages < (t.pages || 60) && list.length < (t.max || 300)) {
      const r = await get(url); pages++;
      if (!isObj(r.json) || !Array.isArray(r.json.data)) { list.push({ id: `${t.id}:error`, kind: "note", note: `fedidb page ${pages} failed: ${r.status} ${r.error || ""}` }); break; }
      for (const s of r.json.data) {
        const sw = str(s.software?.name).toLowerCase(); if (!want.has(sw)) continue;
        if (s.open_registration !== true) continue;
        const kind = ["mastodon", "pleroma", "akkoma", "gotosocial", "friendica", "hubzilla", "mbin"].includes(sw) ? "mastodon" : ["misskey", "firefish", "sharkey", "iceshrimp", "calckey"].includes(sw) ? "misskey" : sw === "pixelfed" ? "pixelfed" : sw === "lemmy" ? "lemmy" : sw === "peertube" ? "peertube" : "mastodon";
        list.push({ id: `${sw}:${s.domain}`, kind, url: `https://${s.domain}`, software: sw, mau: s.stats?.monthly_active_users ?? null, users: s.stats?.user_count ?? null, location: s.location?.country || null, city: s.location?.city || null, fedidbDescription: str(s.description).slice(0, 200) });
        if (list.length >= (t.max || 300)) break;
      }
      url = r.json.links?.next || r.json.meta?.next_page_url || null;
      await new Promise((res) => setTimeout(res, 150));
    }
  } else if (t.source === "joinpeertube") {
    let start = 0; const count = 100;
    while (list.length < (t.max || 400)) {
      const r = await get(`https://instances.joinpeertube.org/api/v1/instances?start=${start}&count=${count}&signupAllowed=true&sort=-totalUsers`);
      if (!isObj(r.json) || !Array.isArray(r.json.data) || !r.json.data.length) { if (!list.length) list.push({ id: `${t.id}:error`, kind: "note", note: `joinpeertube failed: ${r.status} ${r.error || ""}` }); break; }
      for (const s of r.json.data) list.push({ id: `peertube:${s.host}`, kind: "peertube", url: `https://${s.host}`, software: "peertube", users: s.totalUsers ?? null, videos: s.totalLocalVideos ?? null, country: s.country || null, languages: s.languages || [], signupRequiresApproval: s.signupRequiresApproval ?? null, quota: s.userVideoQuota ?? null, version: s.version || null });
      start += count; if (r.json.data.length < count) break;
    }
  } else if (t.source === "lemmyverse") {
    const r = await get("https://data.lemmyverse.net/data/instance.min.json", { ms: 30000 });
    if (!Array.isArray(r.json)) list.push({ id: `${t.id}:error`, kind: "note", note: `lemmyverse failed: ${r.status} ${r.error || ""}` });
    else for (const s of r.json.sort((a, b) => (b.counts?.users ?? b.users ?? 0) - (a.counts?.users ?? a.users ?? 0)).slice(0, t.max || 150)) list.push({ id: `lemmy:${s.baseurl || s.base}`, kind: "lemmy", url: `https://${s.baseurl || s.base}`, software: "lemmy", users: s.counts?.users ?? s.users ?? null, lemmyverseOpen: s.open ?? null });
  } else if (t.source === "nostrwatch") {
    const r = await get("https://api.nostr.watch/v1/online", { ms: 30000 });
    if (!Array.isArray(r.json)) list.push({ id: `${t.id}:error`, kind: "note", note: `nostr.watch failed: ${r.status} ${r.error || ""}` });
    else for (const u of r.json.slice(0, t.max || 60)) list.push({ id: `nostr:${String(u).replace(/^wss?:\/\//, "")}`, kind: "nostr", url: String(u) });
  }
  return list;
}

// The sign-up form itself: which fields it asks for (e-mail, password, phone, date of birth), which CAPTCHA it loads, whether it is
// login-with-Google-only or a JavaScript-only shell. Reads the page; fills nothing, submits nothing. With `discover`, a home page is
// followed to its own sign-up link first.
const SIGNUP_LINK = /(register|signup|sign-up|sign_up|\bjoin\b|inscription|inscri|registro|registrar|cadastr|registrier|anmeld|rejestr|registrace|regisztr|inregistr|реєстр|регистр|kayit|kayıt|会員登録|新規登録|회원가입|注册|註冊|đăng-ký|dang-ky|สมัคร|daftar|opret|skapa konto|luo tunnus|crear cuenta|criar conta|créer un compte|create account|create an account)/i;
const NOT_SIGNUP = /(login|signin|sign-in|log-in|facebook\.com|twitter\.com|x\.com|instagram\.com|linkedin\.com|youtube\.com|apple\.com|google\.com|unsubscribe|newsletter)/i;
async function probeSignup(t) {
  const html5 = { accept: "text/html,application/xhtml+xml,*/*;q=0.8", ms: 20000 };
  let page = await get(t.url, html5);
  let url = page.url || t.url; const hops = [];
  const hasPassword = (h) => /<input[^>]+type=["']?password/i.test(h);
  if (!hasPassword(page.text) && t.discover !== false) {
    const links = [...str(page.text).matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: m[1], text: stripTags(m[2]).trim().slice(0, 60) }));
    const cand = links.find((l) => (SIGNUP_LINK.test(l.href) || SIGNUP_LINK.test(l.text)) && !NOT_SIGNUP.test(l.href));
    if (cand) {
      try { url = new URL(cand.href, url).toString(); } catch { url = cand.href; }
      hops.push(url);
      page = await get(url, html5);
    }
  }
  const html = str(page.text);
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const inputs = [...html.matchAll(/<input\b[^>]*>/gi)].map((m) => m[0]).map((tag) => ({
    type: (tag.match(/type\s*=\s*["']?([\w-]+)/i) || [])[1] || "text",
    name: (tag.match(/\bname\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || "",
    placeholder: (tag.match(/placeholder\s*=\s*["']([^"']*)["']/i) || [])[1] || "",
    autocomplete: (tag.match(/autocomplete\s*=\s*["']?([\w-]+)/i) || [])[1] || "",
  })).filter((i) => !["hidden", "submit", "button", "image", "reset", "search"].includes(i.type.toLowerCase()));
  const selects = [...html.matchAll(/<select\b[^>]*name\s*=\s*["']?([^"'\s>]+)/gi)].map((m) => m[1]);
  const fieldText = inputs.map((i) => `${i.type} ${i.name} ${i.placeholder} ${i.autocomplete}`).join(" | ") + " | " + selects.join(" ");
  const labels = stripTags(html.replace(/<label\b[^>]*>/gi, " [label] ")).slice(0, 6000);
  const text = stripTags(html);
  const captcha = { hcaptcha: /hcaptcha\.com|h-captcha/i.test(html), recaptcha: /recaptcha|g-recaptcha/i.test(html), turnstile: /turnstile|cf-turnstile/i.test(html), other: /captcha/i.test(html) && !/hcaptcha|recaptcha|turnstile/i.test(html) };
  const phone = /type\s*=\s*["']?tel\b/i.test(html) || /\b(tel|phone|mobile|telefon|t[eé]l[eé]phone|tel[eé]fono|celular|电话|手机|電話|휴대폰|số điện thoại|โทรศัพท์)\b/i.test(fieldText);
  const dob = /birth|\bdob\b|geburt|naissance|nacimiento|nascimento|誕生|生年月日|생년월일|出生/i.test(fieldText) || (/type\s*=\s*["']?date\b/i.test(html) && /birth|geburt|naissance|nacimiento|nascimento|age/i.test(labels));
  const email = /type\s*=\s*["']?email\b/i.test(html) || /email|e-mail|correo|courriel|メール|이메일|邮箱/i.test(fieldText);
  const password = hasPassword(html);
  const oauth = { google: /accounts\.google\.com|continue with google|sign (in|up) with google|google-signin|googleusercontent/i.test(html), facebook: /facebook\.com\/(dialog|login|v\d)|continue with facebook/i.test(html), apple: /appleid\.apple\.com|sign in with apple/i.test(html), github: /github\.com\/login\/oauth|continue with github/i.test(html) };
  const jsOnly = inputs.length === 0 && /__NEXT_DATA__|data-reactroot|id="app"|id="root"|ng-app|nuxt/i.test(html);
  const blocked = /just a moment|checking your browser|verify you are human|cf-chl|challenge-platform|pardon our interruption/i.test(html) || [403, 429, 503].includes(page.status);
  return { reachable: page.status > 0, status: page.status, finalUrl: url, hops, title, blocked, formFound: password || (email && inputs.length > 0), email, password, phone, dob, captcha, oauth, jsOnly, inputs: inputs.slice(0, 30), selects: selects.slice(0, 15), signupExtracts: pickSentences(text, SIGNUP, 6), chars: text.length, error: page.error };
}


// A paid-task listing (owner, 2026-10-16: "verify all of it to see if we can actually do them"): the page's status, title and the
// sentences that say whether it is open, closed, awarded or expired, its deadline and its reward. Reads only; never applies or bids.
const TASK_WORDS = /\b(open|closed|close[ds]?|completed|complete|awarded|expired|expire[sd]?|deadline|due|ends?|ending|status|reward|bounty|budget|prize|paid|payment|payout|escrow|funded|apply|submission|submit|claim|winner|accepted|cancelled|canceled|archived|no longer|not found|404|hiring|filled|taken|in progress|pending|draft)\b/i;
async function probeTask(t) {
  const page = await get(t.url, { accept: "text/html,application/xhtml+xml,*/*;q=0.8", ms: 20000 });
  const html = page.text || "";
  const text = stripTags(html);
  const title = (html.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || "";
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 8 && x.length < 300 && TASK_WORDS.test(x)).slice(0, 18);
  const jsonLd = (html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]{0,4000}?)<\/script>/i) || [])[1] || "";
  const dates = [...new Set((text.match(/\b20\d\d-\d\d-\d\d(?:T[\d:.]+Z?)?\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? 20\d\d\b/g) || []))].slice(0, 12);
  const money = [...new Set((text.match(/(?:\$|USD|USDC|EUR|€|£|GBP)\s?\d[\d,.]*\s?(?:USDC|USD|EUR|GBP)?|\d[\d,.]*\s?(?:USDC|USD|EUR|GBP|\$)/g) || []))].slice(0, 12);
  const closedWords = /\b(closed|completed|awarded|expired|cancelled|canceled|archived|no longer accepting|not accepting|has ended|was awarded|winner announced|filled)\b/i.test(text);
  const openWords = /\b(open|accepting|apply now|submit|claim|available|in progress|active)\b/i.test(text);
  return { reachable: page.status > 0, status: page.status, finalUrl: page.url, title: title.trim().slice(0, 160), chars: text.length, closedWords, openWords, dates, money, sentences, jsonLd: jsonLd.replace(/\s+/g, " ").slice(0, 800), error: page.error };
}

const PROBES = { mastodon: probeMastodon, peertube: probePeertube, lemmy: probeLemmy, pixelfed: probePixelfed, misskey: probeMisskey, nostr: probeNostr, html: probeHtml, signup: probeSignup, task: probeTask };
async function run() {
  let queue = [];
  for (const t of targets) {
    if (t.kind === "directory") { const items = await expandDirectory(t); console.log(`${t.id}: ${items.length} entries`); queue.push(...items.map((x) => ({ ...x, directory: t.id }))); }
    else queue.push(t);
  }
  let done = 0; const total = queue.length;
  async function worker() {
    for (;;) {
      const t = queue.shift(); if (!t) return;
      if (t.kind === "note") { out.write(JSON.stringify({ ...t, at: now() }) + "\n"); continue; }
      const probe = PROBES[t.kind] || probeHtml;
      let result;
      try { result = await probe(t); } catch (e) { result = { reachable: false, error: String(e?.message || e).slice(0, 120) }; }
      out.write(JSON.stringify({ ...t, at: now(), result }) + "\n");
      done++; if (done % 25 === 0) console.log(`${done}/${total}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`done ${done}/${total}`);
  await new Promise((r) => out.end(r));
}
run();
