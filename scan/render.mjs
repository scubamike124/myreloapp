// Read-only browser probe for the StudyProofs region scan: opens a page in headless Chromium (Playwright), waits for the
// JavaScript to settle, follows a sign-up/posting link when asked, and reports what the form asks for (field names and types,
// phone / date-of-birth fields, CAPTCHA widgets, social-login-only forms) plus the visible rule sentences. It types nothing,
// submits nothing and keeps no cookies. Usage: node scan/render.mjs <targets.json> <out.jsonl>
import fs from "node:fs";
import { chromium } from "playwright";

const [, , targetsPath, outPath] = process.argv;
const targets = JSON.parse(fs.readFileSync(targetsPath, "utf8"));
const out = fs.createWriteStream(outPath, { flags: "a" });

/**
 * Stored page bodies are third parties' pages, which sometimes embed their own keys (a Mapbox token in a map widget, an analytics key);
 * GitHub's push protection refuses a commit that carries one. Anything token-shaped is replaced before a line is written, so a result
 * never holds a secret, ours or anyone's.
 */
const TOKEN_SHAPES = [
  /\b[ps]k\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // Mapbox public/secret tokens
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key ids
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAIza[0-9A-Za-z_-]{30,}\b/g, // Google API keys
  /\bsk_(live|test)_[A-Za-z0-9]{16,}\b/g, // Stripe secret keys
  /\bsk-[A-Za-z0-9_-]{20,}\b/g, // OpenAI-style secret keys
  /\bey[A-Za-z0-9_-]{20,}\.ey[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, // JWTs
  /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, // SendGrid keys
];
export function scrubTokens(line) {
  let s = line;
  for (const re of TOKEN_SHAPES) s = s.replace(re, "[redacted-token]");
  return s;
}
const now = () => new Date().toISOString();
const SIGNUP_LINK = /(register|signup|sign-up|sign_up|\bjoin\b|inscription|inscri|registro|registrar|cadastr|registrier|anmeld|rejestr|registrace|regisztr|inregistr|реєстр|регистр|kayit|kayıt|会員登録|新規登録|회원가입|注册|註冊|đăng-ký|dang-ky|สมัคร|daftar|opret|skapa konto|luo tunnus|crear cuenta|criar conta|créer un compte|create account|create an account|post (an |your |free )?ad|publicar|publier|inserat|anuncio|annonce|dodaj|přidat|feladás|adaugă|подати|ilan ver|投稿|등록|刊登|đăng tin|ลงประกาศ|pasang iklan|הוסף|פרסם|أضف|اعلن)/i;
const NOT_SIGNUP = /(login|signin|sign-in|log-in|facebook\.com|twitter\.com|x\.com|instagram\.com|linkedin\.com|youtube\.com|apple\.com|google\.com|unsubscribe|newsletter|logout)/i;
const KEYWORDS = /advertis|promot|spam|commercial|marketing|\bbots?\b|automat|self[- ]?promo|business|werbung|publicit|comercial|pubblicit|reklam|реклам|広告|宣伝|광고|홍보|广告|free|gratis|kostenlos|gratuit|grátis|ücretsiz|безкоштов|無料|무료|免费|phone|telefon|téléphone|teléfono|birth|geburt|naissance|nacimiento|captcha|approval|moderat|review/i;

async function probe(browser, t) {
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 StudyProofs-region-scan/1.0 (read-only research of public rules)", locale: t.locale || "en-US", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const hops = [];
  const result = { reachable: false };
  try {
    const res = await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(t.waitMs || 4000);
    let status = res ? res.status() : 0;
    const walled = async () => /just a moment|checking your browser|verify you are human|pardon our interruption|attention required|access denied/i.test((await page.title()) + " " + (await page.content()).slice(0, 4000));
    let blocked = await walled();
    if (blocked) { await page.waitForTimeout(8000); blocked = await walled(); }
    const hasForm = async () => (await page.locator("input[type=password], input[type=email], input[name*=mail i], input[name*=email i]").count()) > 0;
    if (t.discover !== false && !(await hasForm()) && !blocked) {
      const links = await page.$$eval("a[href]", (as) => as.map((a) => ({ href: a.href, text: (a.textContent || "").trim().slice(0, 60) })));
      const cand = links.find((l) => (SIGNUP_LINK.test(l.href) || SIGNUP_LINK.test(l.text)) && !NOT_SIGNUP.test(l.href) && /^https?:/.test(l.href));
      if (cand) {
        hops.push(cand.href);
        const r2 = await page.goto(cand.href, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
        await page.waitForTimeout(t.waitMs || 4000);
        if (r2) status = r2.status();
        blocked = await walled();
      }
    }
    const inputs = await page.$$eval("input, select, textarea", (els) => els.map((e) => ({ tag: e.tagName.toLowerCase(), type: (e.getAttribute("type") || (e.tagName.toLowerCase() === "input" ? "text" : e.tagName.toLowerCase())).toLowerCase(), name: e.getAttribute("name") || "", id: e.id || "", placeholder: e.getAttribute("placeholder") || "", required: e.hasAttribute("required"), autocomplete: e.getAttribute("autocomplete") || "", visible: !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) })).filter((i) => !["hidden", "submit", "button", "image", "reset", "search"].includes(i.type)));
    const labels = await page.$$eval("label", (ls) => ls.map((l) => (l.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60)).filter(Boolean).slice(0, 40));
    const html = await page.content();
    // A target with expand:"<css selector>" first clicks what matches (FAQ questions, collapsed panels), so their answers are in the text.
    if (typeof t.expand === "string" && t.expand) {
      try {
        const handles = await page.$$(t.expand);
        const only = typeof t.expandMatch === "string" && t.expandMatch ? new RegExp(t.expandMatch) : null;
        const startUrl = page.url();
        for (const h of handles.slice(0, 80)) {
          try {
            // Never a link (it would leave the page), and only what reads like a question when expandMatch is given.
            const text = await h.evaluate((e) => (e.closest("a") ? "" : (e.textContent || "").replace(/\s+/g, " ").trim()));
            if (!text || (only && !only.test(text))) continue;
            await h.click({ timeout: 1500 });
            if (page.url() !== startUrl) { await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 45000 }); break; }
          } catch {}
        }
        await page.waitForTimeout(800);
      } catch {}
    }
    // innerText is what a visitor sees; a target with fullText:true also takes the collapsed text (FAQ answers, hidden panels).
    const text = await page.evaluate((full) => (document.body ? (full ? document.body.textContent : document.body.innerText) : "") || "", t.fullText === true);
    const fieldText = inputs.map((i) => `${i.type} ${i.name} ${i.id} ${i.placeholder} ${i.autocomplete}`).join(" | ") + " | " + labels.join(" | ");
    const captcha = { hcaptcha: /hcaptcha\.com|h-captcha/i.test(html), recaptcha: /recaptcha|g-recaptcha/i.test(html), turnstile: /turnstile|cf-turnstile/i.test(html), other: /captcha/i.test(html) && !/hcaptcha|recaptcha|turnstile/i.test(html) };
    const phone = inputs.some((i) => i.type === "tel") || /\b(tel|phone|mobile|telefon|t[eé]l[eé]phone|tel[eé]fono|celular|電話|手机|휴대폰|số điện thoại|โทรศัพท์|טלפון|هاتف|جوال)\b/i.test(fieldText);
    const dob = /birth|\bdob\b|geburt|naissance|nacimiento|nascimento|誕生|生年月日|생년월일|出生|age\b|תאריך לידה|تاريخ الميلاد/i.test(fieldText) || inputs.some((i) => i.type === "date" && /birth|dob|age/i.test(i.name + i.id + i.placeholder));
    const email = inputs.some((i) => i.type === "email" || /email|e-mail|correo|courriel|メール|이메일|邮箱|אימייל|بريد/i.test(i.name + " " + i.id + " " + i.placeholder));
    const password = inputs.some((i) => i.type === "password");
    const oauth = { google: /accounts\.google\.com|continue with google|sign (in|up) with google|google-signin/i.test(html), facebook: /facebook\.com\/(dialog|login|v\d)|continue with facebook/i.test(html), apple: /appleid\.apple\.com|sign in with apple/i.test(html), github: /github\.com\/login\/oauth|continue with github/i.test(html) };
    const sentences = text.split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 25 && s.length < 400 && KEYWORDS.test(s)).slice(0, 14);
    const requiredFields = inputs.filter((i) => i.required && i.visible).map((i) => `${i.type}:${i.name || i.id || i.placeholder || "?"}`);
    // The page's visible text (an excerpt, for the hand review) and each form's action, method and hidden field names — never a value.
    const excerptChars = Math.min(12000, Math.max(500, Number(t.excerptChars) || 3000));
    const excerpt = text.replace(/\s+/g, " ").trim().slice(0, excerptChars);
    // Each select's options (value and text), so a form's categories, durations and modes are known before any publisher is written.
    const selects = await page.$$eval("select", (ss) => ss.slice(0, 30).map((sel) => ({ name: (sel.getAttribute("name") || sel.id || "").slice(0, 40), options: Array.from(sel.options).slice(0, 60).map((o) => ({ value: (o.value || "").slice(0, 60), text: (o.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) })) })));
    // Same-site links (href and text), so the rules, price and help pages behind a menu can be found without guessing paths.
    const links = await page.$$eval("a[href]", (as) => as.slice(0, 400).map((a) => ({ href: (a.getAttribute("href") || "").slice(0, 160), text: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) })).filter((l) => l.href && !/^(#|javascript:|mailto:|tel:)/i.test(l.href)).slice(0, 120));
    const forms = await page.$$eval("form", (fs) => fs.slice(0, 8).map((f) => ({ action: (f.getAttribute("action") || "").slice(0, 200), method: (f.getAttribute("method") || "get").toLowerCase(), hidden: Array.from(f.querySelectorAll("input[type=hidden]")).map((h) => (h.getAttribute("name") || "").slice(0, 40)).filter(Boolean).slice(0, 20), fields: Array.from(f.querySelectorAll("input,select,textarea")).filter((i) => (i.getAttribute("type") || "") !== "hidden").length })));
    Object.assign(result, { reachable: status > 0, status, finalUrl: page.url(), hops, title: (await page.title()).slice(0, 120), blocked, formFound: password || (email && inputs.length > 0), email, password, phone, dob, captcha, oauth, inputs: inputs.slice(0, 40), requiredFields: requiredFields.slice(0, 20), labels, sentences, chars: text.length, excerpt, forms, links, selects });
  } catch (e) {
    result.error = String(e?.message || e).slice(0, 160);
  } finally {
    await ctx.close().catch(() => {});
  }
  return result;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  let done = 0;
  const queue = [...targets];
  async function worker() {
    for (;;) {
      const t = queue.shift(); if (!t) return;
      const result = await probe(browser, t);
      out.write(scrubTokens(JSON.stringify({ ...t, at: now(), result })) + "\n");
      done++; if (done % 10 === 0) console.log(`${done}/${targets.length}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  await browser.close();
  console.log(`done ${done}/${targets.length}`);
  await new Promise((r) => out.end(r));
}
run();
