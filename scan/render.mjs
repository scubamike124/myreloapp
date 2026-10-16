// Read-only browser probe for the StudyProofs region scan: opens a page in headless Chromium (Playwright), waits for the
// JavaScript to settle, follows a sign-up/posting link when asked, and reports what the form asks for (field names and types,
// phone / date-of-birth fields, CAPTCHA widgets, social-login-only forms) plus the visible rule sentences. It types nothing,
// submits nothing and keeps no cookies. Usage: node scan/render.mjs <targets.json> <out.jsonl>
import fs from "node:fs";
import { chromium } from "playwright";

const [, , targetsPath, outPath] = process.argv;
const targets = JSON.parse(fs.readFileSync(targetsPath, "utf8"));
const out = fs.createWriteStream(outPath, { flags: "a" });
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
    const text = await page.evaluate(() => document.body ? document.body.innerText : "");
    const fieldText = inputs.map((i) => `${i.type} ${i.name} ${i.id} ${i.placeholder} ${i.autocomplete}`).join(" | ") + " | " + labels.join(" | ");
    const captcha = { hcaptcha: /hcaptcha\.com|h-captcha/i.test(html), recaptcha: /recaptcha|g-recaptcha/i.test(html), turnstile: /turnstile|cf-turnstile/i.test(html), other: /captcha/i.test(html) && !/hcaptcha|recaptcha|turnstile/i.test(html) };
    const phone = inputs.some((i) => i.type === "tel") || /\b(tel|phone|mobile|telefon|t[eé]l[eé]phone|tel[eé]fono|celular|電話|手机|휴대폰|số điện thoại|โทรศัพท์|טלפון|هاتف|جوال)\b/i.test(fieldText);
    const dob = /birth|\bdob\b|geburt|naissance|nacimiento|nascimento|誕生|生年月日|생년월일|出生|age\b|תאריך לידה|تاريخ الميلاد/i.test(fieldText) || inputs.some((i) => i.type === "date" && /birth|dob|age/i.test(i.name + i.id + i.placeholder));
    const email = inputs.some((i) => i.type === "email" || /email|e-mail|correo|courriel|メール|이메일|邮箱|אימייל|بريد/i.test(i.name + " " + i.id + " " + i.placeholder));
    const password = inputs.some((i) => i.type === "password");
    const oauth = { google: /accounts\.google\.com|continue with google|sign (in|up) with google|google-signin/i.test(html), facebook: /facebook\.com\/(dialog|login|v\d)|continue with facebook/i.test(html), apple: /appleid\.apple\.com|sign in with apple/i.test(html), github: /github\.com\/login\/oauth|continue with github/i.test(html) };
    const sentences = text.split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 25 && s.length < 400 && KEYWORDS.test(s)).slice(0, 14);
    const requiredFields = inputs.filter((i) => i.required && i.visible).map((i) => `${i.type}:${i.name || i.id || i.placeholder || "?"}`);
    Object.assign(result, { reachable: status > 0, status, finalUrl: page.url(), hops, title: (await page.title()).slice(0, 120), blocked, formFound: password || (email && inputs.length > 0), email, password, phone, dob, captcha, oauth, inputs: inputs.slice(0, 40), requiredFields: requiredFields.slice(0, 20), labels, sentences, chars: text.length });
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
      out.write(JSON.stringify({ ...t, at: now(), result }) + "\n");
      done++; if (done % 10 === 0) console.log(`${done}/${targets.length}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  await browser.close();
  console.log(`done ${done}/${targets.length}`);
  await new Promise((r) => out.end(r));
}
run();
