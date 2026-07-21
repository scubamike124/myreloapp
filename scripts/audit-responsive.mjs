#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Responsive layout audit.
//
// Loads every route at four viewports and reports layout defects that are
// measurable rather than subjective:
//
//   - horizontal overflow (the page scrolls sideways)
//   - individual elements wider than the viewport
//   - content clipped outside the left edge
//   - touch targets below the 24px minimum
//
// Uses the Chrome already installed on this machine (puppeteer-core, no
// bundled Chromium download).
//
//   npm run test:responsive              audit everything
//   npm run test:responsive -- --shots   also write screenshots
//   BASE_URL=... npm run test:responsive audit a different origin
// ---------------------------------------------------------------------------

import { launch } from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const WANT_SHOTS = process.argv.includes("--shots");
const SHOT_DIR = path.join(process.cwd(), ".responsive-audit");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p;
  return null;
}

// Real device widths, not round numbers — 320 is the narrowest phone still in
// common use and the most likely to break.
const VIEWPORTS = [
  { name: "mobile-sm", width: 320, height: 800, isMobile: true },
  { name: "mobile", width: 390, height: 844, isMobile: true },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "laptop", width: 1280, height: 800, isMobile: false },
  { name: "desktop", width: 1920, height: 1080, isMobile: false },
];

const ROUTES = [
  "/",
  "/create",
  "/create/talking-photo",
  "/create/website-commercial",
  "/create/ai-avatar-studio",
  "/create/revoice",
  "/library",
  "/dashboard",
  "/account",
  "/trends",
  "/pricing",
  "/add-ons",
  "/examples",
  "/features",
  "/how-it-works",
  "/faq",
  "/capabilities",
  "/roadmap",
  "/community",
  "/competitions",
  "/battles",
  "/prompt-builder",
  "/business-center",
  "/business-center/analytics",
  "/business-center/publishing",
  "/business-center/revenue",
  "/business-center/scheduling",
  "/business-center/social",
  "/business-center/pro",
  "/admin/login",
];

// Admin pages sit behind the session gate, so they get skipped unless we log in
// first. Set ADMIN_PASSWORD (or AUDIT_ADMIN_PASSWORD) to include them —
// otherwise a whole authenticated area would silently go unchecked.
const ADMIN_ROUTES = ["/admin", "/admin/users", "/admin/payments", "/admin/plans", "/admin/gateways", "/admin/vault"];
const ADMIN_PASSWORD = process.env.AUDIT_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";

/** Runs inside the page. Returns measurable layout defects. */
function collectDefects() {
  const vw = document.documentElement.clientWidth;
  const defects = [];

  const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  if (scrollW > vw + 1) {
    defects.push({ kind: "page-overflow", detail: `page scrolls horizontally: ${scrollW}px content in ${vw}px viewport` });
  }

  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "";
    const text = (el.textContent || "").trim().slice(0, 40);
    return `${tag}${id}${cls}${text ? ` "${text}"` : ""}`;
  };

  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
    // Fixed/sticky decorative layers legitimately sit outside the flow.
    if (style.position === "fixed") continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    // Element extends past the right edge.
    if (r.right > vw + 1 && r.width > 8) {
      // Ignore elements whose parent already clips them.
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === "hidden" || ps.overflowX === "auto" || ps.overflowX === "scroll") {
          clipped = true;
          break;
        }
      }
      if (!clipped) {
        defects.push({
          kind: "element-overflow",
          detail: `${describe(el)} extends to ${Math.round(r.right)}px (viewport ${vw}px)`,
        });
      }
    }

    // Content pushed off the left edge is never recoverable by scrolling.
    if (r.left < -1 && r.width > 8) {
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === "hidden" || ps.overflowX === "auto" || ps.overflowX === "scroll") {
          clipped = true;
          break;
        }
      }
      if (!clipped) {
        defects.push({ kind: "off-left", detail: `${describe(el)} starts at ${Math.round(r.left)}px` });
      }
    }
  }

  // Interactive targets that are too small to hit reliably on touch.
  // Only standalone controls are flagged: an inline link inside a sentence or a
  // footer list is legitimately text-height, and flagging those buried the real
  // findings under hundreds of false positives.
  if (window.innerWidth <= 820) {
    for (const el of document.querySelectorAll("a, button, [role=button], input, select, textarea")) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.display === "inline") continue; // inline text link — not a tap target
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Both dimensions must be cramped; a wide-but-short row is still hittable.
      if (r.height < 24 && r.width < 24) {
        defects.push({
          kind: "small-target",
          detail: `${describe(el)} is ${Math.round(r.width)}×${Math.round(r.height)}px`,
        });
      }
    }
  }

  return defects;
}

const chrome = findChrome();
if (!chrome) {
  console.error("Could not find Chrome. Set CHROME_PATH to your Chrome executable.");
  process.exit(1);
}

// Fail fast if the server isn't up, rather than 150 confusing timeouts.
// The dev server compiles a route on first hit, so allow a generous warm-up.
try {
  const ping = await fetch(BASE_URL, { signal: AbortSignal.timeout(90000) });
  if (!ping.ok && ping.status >= 500) throw new Error(`status ${ping.status}`);
} catch (e) {
  console.error(`Cannot reach ${BASE_URL} — start the server first (npm run dev).`);
  console.error(`  ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

if (WANT_SHOTS) await mkdir(SHOT_DIR, { recursive: true });

const browser = await launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const findings = [];
let checked = 0;

// Log in once and reuse the cookie for the whole run, so admin pages are
// audited too rather than all redirecting to /admin/login.
const routes = [...ROUTES];
if (ADMIN_PASSWORD) {
  const loginPage = await browser.newPage();
  try {
    await loginPage.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const ok = await loginPage.evaluate(async (pw) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      return res.ok;
    }, ADMIN_PASSWORD);

    if (ok) {
      routes.push(...ADMIN_ROUTES);
      console.log(`  (signed in — including ${ADMIN_ROUTES.length} admin routes)`);
    } else {
      console.log("  (admin password rejected — skipping admin routes)");
    }
  } catch {
    console.log("  (could not sign in — skipping admin routes)");
  }
  await loginPage.close();
} else {
  console.log("  (no ADMIN_PASSWORD set — skipping admin routes)");
}

for (const route of routes) {
  const page = await browser.newPage();
  // Surface real client-side errors too — a crashed page has no layout.
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  for (const vp of VIEWPORTS) {
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: 1,
    });

    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 30000 });
    } catch {
      findings.push({ route, viewport: vp.name, kind: "load-failed", detail: "page did not finish loading" });
      continue;
    }

    // Let fonts/images settle so measurements reflect the final layout.
    await new Promise((r) => setTimeout(r, 350));

    const defects = await page.evaluate(collectDefects);
    checked++;

    for (const d of defects) findings.push({ route, viewport: vp.name, ...d });

    if (WANT_SHOTS) {
      const safe = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
      await page.screenshot({ path: path.join(SHOT_DIR, `${safe}__${vp.name}.png`), fullPage: false });
    }
  }

  for (const msg of [...new Set(pageErrors)]) {
    findings.push({ route, viewport: "-", kind: "page-error", detail: msg });
  }

  await page.close();
}

await browser.close();

// --- Report ---------------------------------------------------------------

const byKind = new Map();
for (const f of findings) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);

console.log(`\nResponsive audit — ${routes.length} routes × ${VIEWPORTS.length} viewports (${checked} checks)\n`);

if (findings.length === 0) {
  console.log("  ✓ No layout defects found.\n");
} else {
  // Group by route so fixes are actionable.
  const byRoute = new Map();
  for (const f of findings) {
    const list = byRoute.get(f.route) ?? [];
    list.push(f);
    byRoute.set(f.route, list);
  }

  for (const [route, list] of byRoute) {
    console.log(`  ${route}`);
    // Collapse identical detail across viewports.
    const seen = new Map();
    for (const f of list) {
      const key = `${f.kind}::${f.detail}`;
      const entry = seen.get(key) ?? { ...f, viewports: [] };
      entry.viewports.push(f.viewport);
      seen.set(key, entry);
    }
    for (const f of seen.values()) {
      console.log(`    [${f.kind}] ${f.detail}`);
      console.log(`      at: ${f.viewports.join(", ")}`);
    }
    console.log("");
  }

  console.log("  Summary:");
  for (const [kind, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${kind}: ${n}`);
  }
  console.log("");
}

if (WANT_SHOTS) console.log(`  Screenshots written to ${SHOT_DIR}\n`);

await writeFile(
  path.join(process.cwd(), ".responsive-audit.json"),
  JSON.stringify({ baseUrl: BASE_URL, checked, findings }, null, 2),
);

// Non-zero exit on real layout breakage so this can gate a build.
const blocking = findings.filter((f) => f.kind !== "small-target").length;
process.exit(blocking > 0 ? 1 : 0);
