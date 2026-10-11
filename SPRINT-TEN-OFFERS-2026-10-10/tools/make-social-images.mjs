#!/usr/bin/env node
/**
 * Sample images for the ten-offer promotion posts, made from the REAL sample deliverables (evidence/fulfilment/<offer>/delivery/report.html,
 * produced by the pilot runner from clearly invented inputs). Nothing here is drawn by hand: each card shows (1) a crop of the actual
 * report's Summary, rendered from its own HTML, and (2) three figures read from that same Summary. Every figure carries a `must` string
 * that has to appear verbatim in the report's text, so a number that does not match the sample fails the run instead of shipping.
 *
 * Usage (from the amberai checkout, which has Playwright):
 *   node SPRINT-TEN-OFFERS-2026-10-10/tools/make-social-images.mjs <amberai-checkout> <out-dir> [offer-slug ...]
 * The browser is the sandbox Chromium (/opt/pw-browsers/chromium, no download). Output: <out-dir>/<offer>-sample.png (1200x630) and
 * <offer>-sample-portrait.png (1000x1500, for Pinterest), plus images.json with the alt text of each.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FULFILMENT = resolve(here, "../evidence/fulfilment");
const [, , checkout, outDir, ...only] = process.argv;
if (!checkout || !outDir) {
  console.error("usage: make-social-images.mjs <amberai-checkout> <out-dir> [offer-slug ...]");
  process.exit(2);
}
const { chromium } = await import(pathToFileURL(join(resolve(checkout), "node_modules/playwright/index.mjs")).href);

/** The seven offers marked ready (src/lib/offers/readiness.ts). */
const OFFERS = {
  "missed-call-follow-up": {
    title: "Missed-Call and Web-Inquiry Follow-Up List",
    crop: { heading: "Summary", count: 3 },
    detail: { heading: "Open leads, most urgent first", count: 1, viewport: 900, caption: "Open leads, most urgent first (from the sample)" },
    stats: [
      { big: "13", label: "missed calls from 11 callers", must: "Missed calls: 13 from 11 callers" },
      { big: "12", label: "open leads with no recorded reply", must: "Open leads with no recorded reply: 12" },
      { big: "1 h 38 min", label: "median time to a first reply", must: "Median time to first reply: 1 hour 38 minutes" },
    ],
  },
  "stale-estimate-follow-up": {
    title: "Stale Estimate Follow-Up List",
    crop: { heading: "Summary", count: 3 },
    detail: { heading: "Draft 1:", prefix: true, count: 3, viewport: 560, caption: "A draft follow-up, for you to review and send (from the sample)" },
    stats: [
      { big: "19", label: "open estimates", must: "Open estimates: 19" },
      { big: "12", label: "gone quiet for 7 days or more", must: "Gone quiet (7 or more days without contact): 12" },
      { big: "4", label: "quiet for 30 days or more", must: "30 or more days quiet: 4 estimates" },
    ],
  },
  "job-cost-exceptions": {
    title: "Job-Cost Exception Report",
    crop: { heading: "Summary", count: 2 },
    detail: { heading: "Jobs at a glance", count: 1, viewport: 900, caption: "Jobs at a glance (from the sample)" },
    stats: [
      { big: "9", label: "exceptions for review", must: "9 exceptions for review" },
      { big: "2", label: "cost codes over budget", must: "2 over budget" },
      { big: "1", label: "possible duplicate bill", must: "1 possible duplicate bill" },
    ],
  },
  "receipt-invoice-matching": {
    title: "Receipt and Invoice Match Review",
    crop: { heading: "Summary", count: 2 },
    detail: { heading: "Exceptions for review", count: 1, viewport: 900, caption: "Exceptions for the bookkeeper to decide (from the sample)" },
    stats: [
      { big: "25", label: "matched pairs", must: "25 matched pairs" },
      { big: "15", label: "exceptions for review", must: "15 exceptions for review" },
      { big: "6", label: "payments with no document", must: "6 no document for this payment" },
    ],
  },
  "unpaid-invoice-tracking": {
    title: "Unpaid Invoice Tracker with Draft Reminders",
    crop: { heading: "Summary", count: 5 },
    detail: { heading: "Aging", count: 1, viewport: 560, caption: "Aging of open invoices (from the sample)" },
    stats: [
      { big: "$52,755", label: "outstanding on 20 open invoices", must: "Open invoices: 20, total outstanding $52,755.50" },
      { big: "17", label: "invoices past due", must: "Overdue: 17 invoices" },
      { big: "12", label: "reminders due this week", must: "Reminders due this week: 12" },
    ],
  },
  "crm-cleanup": {
    title: "CRM Duplicate and Data-Quality Check",
    crop: { heading: "Summary", count: 3 },
    detail: { heading: "Duplicate groups", count: 1, viewport: 900, caption: "Duplicate groups with a suggested record to keep (from the sample)" },
    stats: [
      { big: "19", label: "duplicate groups covering 39 records", must: "19 duplicate groups covering 39 records" },
      { big: "21", label: "data-quality issues", must: "21 data-quality issues on 21 records" },
      { big: "8", label: "stale leads", must: "8 stale leads" },
    ],
  },
  "catalog-cleanup": {
    title: "Product Catalog Cleanup and Cross-Store Check",
    crop: { heading: "Summary", count: 3 },
    detail: { heading: "Issues by product", count: 1, viewport: 640, caption: "Issues found, product by product (from the sample)" },
    stats: [
      { big: "78", label: "issues by product", must: "78 issues by product" },
      { big: "44", label: "cross-store differences", must: "44 cross-store differences" },
      { big: "16", label: "SKUs in one store only", must: "16 SKUs in one store only" },
    ],
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FONT = "'Liberation Sans', Arial, Helvetica, sans-serif";
const landscape = (title, crop64, stats) => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1200px;height:630px;background:#0f172a;font-family:${FONT};color:#fff;position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:18px;background:#f59e0b"></div>
<div style="position:absolute;left:60px;top:36px;font-size:21px;letter-spacing:.14em;font-weight:700;color:#fbbf24">SAMPLE REPORT · MADE FROM INVENTED DATA</div>
<div style="position:absolute;left:60px;top:72px;width:1080px;font-size:42px;font-weight:700;line-height:1.1">${esc(title)}</div>
<div style="position:absolute;left:60px;top:146px;width:560px;height:372px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.45)">
  <img src="data:image/png;base64,${crop64}" style="width:560px;display:block;margin:0">
  <div style="position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(rgba(255,255,255,0),#fff)"></div>
</div>
<div style="position:absolute;left:668px;top:140px;width:480px">${stats
  .map((s) => `<div style="display:grid;grid-template-columns:236px 1fr;align-items:center;column-gap:16px;height:124px;border-bottom:1px solid #334155"><div style="white-space:nowrap;font-size:${s.big.length <= 3 ? 72 : s.big.length <= 7 ? 54 : 40}px;font-weight:700;color:#fbbf24;line-height:1">${esc(s.big)}</div><div style="font-size:25px;line-height:1.2;color:#e2e8f0">${esc(s.label)}</div></div>`)
  .join("")}</div>
<div style="position:absolute;left:60px;bottom:30px;font-size:22px;color:#94a3b8">hq.amberoneai.com/offers</div>
<div style="position:absolute;right:60px;bottom:24px;border:1.5px solid #475569;border-radius:30px;padding:10px 22px;font-size:22px">Pilot · a person reviews every report</div>
</body>`;

const portrait = (title, crop64, stats) => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1000px;height:1500px;background:#0f172a;font-family:${FONT};color:#fff;position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:16px;background:#f59e0b"></div>
<div style="position:absolute;left:60px;top:60px;font-size:24px;letter-spacing:.14em;font-weight:700;color:#fbbf24">SAMPLE REPORT · INVENTED DATA</div>
<div style="position:absolute;left:60px;top:104px;width:880px;height:190px;display:flex;align-items:center;font-size:62px;font-weight:700;line-height:1.08">${esc(title)}</div>
<div style="position:absolute;left:60px;top:310px;width:880px;height:580px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 36px rgba(0,0,0,.45)">
  <img src="data:image/png;base64,${crop64}" style="width:880px;display:block;margin:0">
  <div style="position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(rgba(255,255,255,0),#fff)"></div>
</div>
<div style="position:absolute;left:60px;top:930px;width:880px">${stats
  .map((s) => `<div style="display:grid;grid-template-columns:330px 1fr;align-items:center;column-gap:20px;height:124px;border-bottom:1px solid #334155"><div style="white-space:nowrap;font-size:${s.big.length <= 3 ? 96 : s.big.length <= 7 ? 72 : 54}px;font-weight:700;color:#fbbf24;line-height:1">${esc(s.big)}</div><div style="font-size:34px;line-height:1.2;color:#e2e8f0">${esc(s.label)}</div></div>`)
  .join("")}</div>
<div style="position:absolute;left:60px;bottom:64px;font-size:28px;color:#94a3b8">hq.amberoneai.com/offers</div>
<div style="position:absolute;right:60px;bottom:54px;border:2px solid #475569;border-radius:36px;padding:12px 28px;font-size:26px">Pilot · a person reviews every report</div>
</body>`;

const detailLandscape = (title, caption, crop64) => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1200px;height:630px;background:#0f172a;font-family:${FONT};color:#fff;position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:18px;background:#f59e0b"></div>
<div style="position:absolute;left:60px;top:36px;font-size:21px;letter-spacing:.14em;font-weight:700;color:#fbbf24">SAMPLE REPORT · MADE FROM INVENTED DATA</div>
<div style="position:absolute;left:60px;top:72px;width:1080px;font-size:42px;font-weight:700;line-height:1.1">${esc(title)}</div>
<div style="position:absolute;left:60px;top:146px;width:1080px;height:372px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.45)">
  <img src="data:image/png;base64,${crop64}" style="width:1080px;display:block;margin:0">
  <div style="position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(rgba(255,255,255,0),#fff)"></div>
</div>
<div style="position:absolute;left:60px;bottom:28px;font-size:23px;color:#cbd5e1">${esc(caption)}</div>
<div style="position:absolute;right:60px;bottom:24px;border:1.5px solid #475569;border-radius:30px;padding:10px 22px;font-size:22px">Pilot · hq.amberoneai.com/offers</div>
</body>`;

const detailPortrait = (title, caption, crop64) => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1000px;height:1500px;background:#0f172a;font-family:${FONT};color:#fff;position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:16px;background:#f59e0b"></div>
<div style="position:absolute;left:60px;top:60px;font-size:24px;letter-spacing:.14em;font-weight:700;color:#fbbf24">SAMPLE REPORT · INVENTED DATA</div>
<div style="position:absolute;left:60px;top:104px;width:880px;height:190px;display:flex;align-items:center;font-size:62px;font-weight:700;line-height:1.08">${esc(title)}</div>
<div style="position:absolute;left:60px;top:310px;width:880px;height:880px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 36px rgba(0,0,0,.45)">
  <img src="data:image/png;base64,${crop64}" style="width:880px;display:block;margin:0">
  <div style="position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(rgba(255,255,255,0),#fff)"></div>
</div>
<div style="position:absolute;left:60px;top:1230px;width:880px;font-size:34px;line-height:1.25;color:#e2e8f0">${esc(caption)}</div>
<div style="position:absolute;left:60px;bottom:64px;font-size:28px;color:#94a3b8">hq.amberoneai.com/offers</div>
<div style="position:absolute;right:60px;bottom:54px;border:2px solid #475569;border-radius:36px;padding:12px 28px;font-size:26px">Pilot · a person reviews every report</div>
</body>`;

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const manifest = {};
const slugs = only.length ? only : Object.keys(OFFERS);
let failed = 0;
for (const slug of slugs) {
  const o = OFFERS[slug];
  if (!o) {
    console.error(`unknown offer ${slug}`);
    failed++;
    continue;
  }
  const file = join(FULFILMENT, slug, "delivery", "report.html");
  if (!existsSync(file)) {
    console.error(`missing ${file}`);
    failed++;
    continue;
  }
  const page = await browser.newPage({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
  const lacking = o.stats.filter((s) => !text.includes(s.must));
  if (lacking.length) {
    console.error(`${slug}: the report does not contain: ${lacking.map((s) => JSON.stringify(s.must)).join(", ")}`);
    failed++;
    await page.close();
    continue;
  }
  if (!text.includes("Sample made from invented data")) {
    console.error(`${slug}: the report does not say it is made from invented data`);
    failed++;
    await page.close();
    continue;
  }
  const cropOf = async (spec) => {
    const pg = await browser.newPage({ viewport: { width: spec.viewport ?? 400, height: 900 }, deviceScaleFactor: 2 });
    await pg.goto(pathToFileURL(file).href, { waitUntil: "load" });
    const rect = await pg.evaluate(({ heading, count, prefix }) => {
      const h = [...document.querySelectorAll("h2,h3")].find((x) => (prefix ? x.innerText.trim().startsWith(heading) : x.innerText.trim() === heading));
      if (!h) return null;
      let last = h;
      let n = h;
      for (let i = 0; i < count; i++) {
        n = n.nextElementSibling;
        if (!n || n.tagName === "H2" || n.tagName === "H3") break;
        last = n;
      }
      const a = h.getBoundingClientRect();
      const b = last.getBoundingClientRect();
      return { top: a.top + window.scrollY - 6, bottom: b.bottom + window.scrollY + 8 };
    }, spec);
    if (!rect) {
      await pg.close();
      return null;
    }
    const png = await pg.screenshot({ fullPage: true, clip: { x: 0, y: rect.top, width: spec.viewport ?? 400, height: rect.bottom - rect.top } });
    await pg.close();
    return png.toString("base64");
  };
  await page.close();
  const summary64 = await cropOf({ ...o.crop, viewport: 400 });
  const detail64 = await cropOf(o.detail);
  if (!summary64 || !detail64) {
    console.error(`${slug}: a heading was not found in the report`);
    failed++;
    continue;
  }
  const shots = [
    ["sample", landscape(o.title, summary64, o.stats), 1200, 630],
    ["sample-portrait", portrait(o.title, summary64, o.stats), 1000, 1500],
    ["detail", detailLandscape(o.title, o.detail.caption, detail64), 1200, 630],
    ["detail-portrait", detailPortrait(o.title, o.detail.caption, detail64), 1000, 1500],
  ];
  for (const [kind, html, w, h] of shots) {
    const card = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await card.setContent(html, { waitUntil: "load" });
    const path = join(outDir, `${slug}-${kind}.png`);
    await card.screenshot({ path, type: "png" });
    await card.close();
    console.log("wrote", path);
  }
  manifest[slug] = {
    title: o.title,
    alt: `Sample report made from invented data: ${o.title}. ${o.stats.map((s) => `${s.big} ${s.label}`).join("; ")}.`,
    detailAlt: `Sample report made from invented data: ${o.title}. ${o.detail.caption}.`,
    figures: o.stats.map((s) => ({ figure: s.big, label: s.label, foundInReport: s.must })),
    source: `SPRINT-TEN-OFFERS-2026-10-10/evidence/fulfilment/${slug}/delivery/report.html`,
  };
}
await browser.close();
const manifestPath = join(outDir, "images.json");
const prior = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
writeFileSync(manifestPath, JSON.stringify({ ...prior, ...manifest }, null, 2) + "\n");
if (failed) process.exit(1);
