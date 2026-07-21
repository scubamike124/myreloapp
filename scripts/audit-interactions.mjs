#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Interaction audit — does every control actually do something?
//
// Two passes:
//
//   LINKS   every href on every page is resolved with a real request, so a
//           link to a deleted or misspelled route shows up as a 404 rather
//           than as a page that merely looks fine.
//
//   BUTTONS every button is clicked, and the page is compared before/after
//           (URL, DOM, focus, open dialogs, network activity). A button that
//           changes nothing is reported as inert.
//
// SAFETY: run this with NO provider keys set. Generation buttons then fail fast
// at the route's key check instead of spending real Gemini/HeyGen credits. The
// script still counts them as "working" because they do produce an observable
// error state — which is the correct behaviour for a missing key.
//
//   npm run test:interactions
//   AUDIT_ADMIN_PASSWORD=<pw> npm run test:interactions   (includes admin)
// ---------------------------------------------------------------------------

import { launch } from "puppeteer-core";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_PASSWORD = process.env.AUDIT_ADMIN_PASSWORD ?? "";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("Could not find Chrome. Set CHROME_PATH.");
  process.exit(1);
}

const ROUTES = [
  "/", "/create", "/library", "/dashboard", "/account", "/trends", "/pricing",
  "/add-ons", "/examples", "/features", "/how-it-works", "/faq", "/capabilities",
  "/roadmap", "/community", "/competitions", "/battles", "/prompt-builder",
  "/business-center", "/business-center/analytics", "/business-center/publishing",
  "/business-center/revenue", "/business-center/scheduling", "/business-center/social",
  "/business-center/pro",
  "/create/talking-photo", "/create/dancing-photo", "/create/custom-avatar-creator",
  "/create/website-commercial", "/create/ai-avatar-studio", "/create/revoice",
  "/create/shorts-20", "/create/product-commercial", "/create/ai-story-maker",
  "/create/translate-videos", "/create/ai-quality-enhancement", "/create/story-memory-generator",
];
const ADMIN_ROUTES = ["/admin", "/admin/users", "/admin/payments", "/admin/plans", "/admin/gateways", "/admin/vault"];

// Clicking these would derail the run rather than reveal a defect.
const SKIP_LABELS = [/^log ?out$/i, /^sign ?out$/i];

/**
 * Injected into the page. `el.disabled` is the DOM *property*, so it correctly
 * reports true for controls disabled by an ancestor <fieldset disabled> — which
 * the `:not([disabled])` attribute selector misses entirely. Those buttons are
 * inert on purpose (unavailable tools) and must not be reported as defects.
 *
 * Fullscreen also can't succeed without a real user gesture, so it is excluded
 * rather than reported as a phantom failure in headless Chrome.
 */
function installClickableHelper() {
  window.__clickables = () =>
    [...document.querySelectorAll('button, [role="button"]')].filter((el) => {
      if (el.disabled) return false;
      if (el.closest("fieldset[disabled]")) return false;
      const label = (el.textContent || el.getAttribute("aria-label") || "").trim().toLowerCase();
      if (label === "fullscreen") return false;
      return true;
    });
}

const findings = [];
let buttonsClicked = 0;
let linksChecked = 0;

const browser = await launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const routes = [...ROUTES];
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.evaluateOnNewDocument(installClickableHelper);

if (ADMIN_PASSWORD) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });
  const ok = await page.evaluate(async (pw) => {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    return r.ok;
  }, ADMIN_PASSWORD);
  if (ok) {
    routes.push(...ADMIN_ROUTES);
    console.log(`  (signed in — including ${ADMIN_ROUTES.length} admin routes)`);
  } else {
    console.log("  (admin login failed — skipping admin routes)");
  }
}

// --- Pass 1: every link target resolves ------------------------------------

const seenLinks = new Map(); // href -> routes that use it

for (const route of routes) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => ({
      href: a.getAttribute("href") ?? "",
      resolved: a.href,
      text: (a.textContent || "").trim().slice(0, 40),
      target: a.getAttribute("target") ?? "",
    })),
  );

  for (const l of hrefs) {
    // Placeholder hrefs are dead by definition.
    if (l.href === "#" || l.href === "" || l.href === "javascript:void(0)") {
      findings.push({ route, kind: "dead-link", detail: `"${l.text || "(no text)"}" has href="${l.href}"` });
      continue;
    }
    if (/^(mailto:|tel:)/i.test(l.href)) continue;
    // Only verify same-origin targets; external sites aren't ours to police.
    if (!l.resolved.startsWith(BASE_URL)) continue;

    const key = l.resolved.split("#")[0];
    if (!seenLinks.has(key)) seenLinks.set(key, { text: l.text, routes: [] });
    seenLinks.get(key).routes.push(route);
  }
}

for (const [url, info] of seenLinks) {
  const res = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u, { method: "GET", redirect: "follow" });
      return r.status;
    } catch {
      return 0;
    }
  }, url);
  linksChecked++;
  if (res >= 400 || res === 0) {
    findings.push({
      route: info.routes[0],
      kind: "broken-link",
      detail: `${url.replace(BASE_URL, "")} -> HTTP ${res} (linked as "${info.text}")`,
    });
  }
}

// --- Pass 2: every button does something -----------------------------------

for (const route of routes) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});

  const count = await page.evaluate(() => window.__clickables().length);

  for (let i = 0; i < count; i++) {
    // Re-query each time: clicking can re-render and invalidate handles.
    const meta = await page.evaluate((idx) => {
      const els = window.__clickables();
      const el = els[idx];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 45),
        visible: r.width > 0 && r.height > 0,
      };
    }, i);

    if (!meta || !meta.visible) continue;
    if (SKIP_LABELS.some((re) => re.test(meta.label))) continue;

    // Snapshot the observable state before clicking.
    const before = await page.evaluate(() => ({
      url: location.href,
      html: document.body.innerHTML.length,
      text: document.body.innerText.slice(0, 4000),
      active: document.activeElement?.outerHTML?.slice(0, 80) ?? "",
      dialogs: document.querySelectorAll('[role="dialog"],dialog[open]').length,
    }));

    let netRequests = 0;
    const onReq = () => netRequests++;
    page.on("request", onReq);

    const clicked = await page.evaluate((idx) => {
      const els = window.__clickables();
      const el = els[idx];
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      el.click();
      return true;
    }, i).catch(() => false);

    if (!clicked) {
      page.off("request", onReq);
      continue;
    }
    buttonsClicked++;

    await new Promise((r) => setTimeout(r, 320));
    page.off("request", onReq);

    const after = await page.evaluate(() => ({
      url: location.href,
      html: document.body.innerHTML.length,
      text: document.body.innerText.slice(0, 4000),
      active: document.activeElement?.outerHTML?.slice(0, 80) ?? "",
      dialogs: document.querySelectorAll('[role="dialog"],dialog[open]').length,
    })).catch(() => null);

    if (!after) continue;

    const changed =
      after.url !== before.url ||
      after.html !== before.html ||
      after.text !== before.text ||
      after.dialogs !== before.dialogs ||
      after.active !== before.active ||
      netRequests > 0;

    if (!changed) {
      // Clicking the tab/filter that is ALREADY selected legitimately changes
      // nothing. Distinguish that from a truly dead control by checking whether
      // the element has a click handler wired up at all: if React attached one,
      // the control works and we simply re-selected the current state.
      const wired = await page.evaluate((idx) => {
        const el = window.__clickables()[idx];
        if (!el) return false;
        // React 19 stores props under a __reactProps$* key on the DOM node.
        const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
        const props = key ? el[key] : null;
        return Boolean(props && typeof props.onClick === "function");
      }, i).catch(() => false);

      findings.push({
        route,
        kind: wired ? "no-op-click" : "inert-button",
        detail: wired
          ? `"${meta.label || "(no label)"}" — has a handler but this click changed nothing (likely the already-selected option)`
          : `"${meta.label || "(no label)"}" — NO click handler; the control is dead`,
      });
    }

    // Return to a clean state if the click navigated away.
    if (after.url !== before.url) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
      continue;
    }

    // A click may have opened a drawer or modal whose overlay would swallow
    // every subsequent click and make working buttons look dead. Dismiss it.
    if (after.html > before.html) {
      await page.keyboard.press("Escape").catch(() => {});
      await new Promise((r) => setTimeout(r, 120));
      const stillOpen = await page.evaluate((len) => document.body.innerHTML.length > len, before.html).catch(() => false);
      if (stillOpen) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
      }
    }
  }
}

await browser.close();

// --- Report ----------------------------------------------------------------

console.log(`\nInteraction audit — ${routes.length} routes, ${linksChecked} link targets, ${buttonsClicked} buttons clicked\n`);

if (findings.length === 0) {
  console.log("  ✓ Every link resolves and every button does something.\n");
} else {
  const byRoute = new Map();
  for (const f of findings) {
    const l = byRoute.get(f.route) ?? [];
    l.push(f);
    byRoute.set(f.route, l);
  }
  for (const [route, list] of byRoute) {
    console.log(`  ${route}`);
    for (const f of [...new Map(list.map((f) => [f.kind + f.detail, f])).values()]) {
      console.log(`    [${f.kind}] ${f.detail}`);
    }
    console.log("");
  }
  const counts = new Map();
  for (const f of findings) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1);
  console.log("  Summary:");
  for (const [k, n] of counts) console.log(`    ${k}: ${n}`);
  console.log("");
}

await writeFile(path.join(process.cwd(), ".interaction-audit.json"), JSON.stringify({ findings }, null, 2));

// Only genuinely dead controls and broken links fail the run. "no-op-click" is
// informational — it is usually the already-selected tab.
const blocking = findings.filter((f) => f.kind !== "no-op-click").length;
process.exit(blocking > 0 ? 1 : 0);
