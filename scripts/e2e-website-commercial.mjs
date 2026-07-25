/**
 * Chrome customer-path E2E for Website Commercial on production.
 */
import { launch } from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const PROD = process.env.PROD_URL || "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-e2e-website");
mkdirSync(OUT, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

if (!chrome) {
  console.error("Chrome not found");
  process.exit(1);
}

function ffprobe(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name,duration", "-of", "json", file],
    { encoding: "utf8" },
  );
  try {
    return JSON.parse(r.stdout || "{}");
  } catch {
    return { error: r.stderr || "ffprobe failed" };
  }
}

const browser = await launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
page.setDefaultTimeout(120_000);
const report = { steps: [], ok: false, feature: "website-commercial", browser: "Chrome headless" };

try {
  report.steps.push("goto");
  await page.goto(`${PROD}/create/website-commercial`, { waitUntil: "networkidle2", timeout: 120_000 });
  await page.screenshot({ path: join(OUT, "01-loaded.png"), fullPage: true });

  report.steps.push("fill url");
  await page.evaluate(() => {
    const input =
      document.querySelector('input[type="url"]') ||
      document.querySelector('input[placeholder*="http"]') ||
      [...document.querySelectorAll("input")].find((i) => /url|website|site/i.test(i.placeholder || i.name || ""));
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "https://www.myreelo.com");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  report.steps.push("analyze");
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const analyze = buttons.find((b) => /analyze my website/i.test(b.textContent || ""));
    analyze?.click();
  });

  await page.waitForFunction(
    () => /generate .*commercial|detected|script/i.test(document.body.innerText) &&
      [...document.querySelectorAll("button")].some((b) => /generate .*commercial/i.test(b.textContent || "")),
    { timeout: 180_000 },
  );
  await page.screenshot({ path: join(OUT, "02-detected.png"), fullPage: true });

  report.steps.push("generate");
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const gen = buttons.find((b) => /generate .*commercial/i.test(b.textContent || ""));
    if (!gen || gen.disabled) return false;
    gen.click();
    return true;
  });
  if (!clicked) {
    await page.screenshot({ path: join(OUT, "02-pre-gen.png"), fullPage: true });
    throw new Error("Generate button not found");
  }

  report.steps.push("wait done");
  const outcome = await page
    .waitForFunction(
      () => {
        const body = document.body.innerText;
        if (/tap to play with sound|your.*ready|download/i.test(body) && document.querySelector("video[src]")) {
          return { state: "done" };
        }
        if (/failed|could not|error/i.test(body) && !/generating/i.test(body)) {
          return { state: "error", text: body.slice(0, 400) };
        }
        return null;
      },
      { timeout: 14 * 60 * 1000, polling: 3000 },
    )
    .then((h) => h.jsonValue());
  report.outcome = outcome;
  if (outcome.state === "error") throw new Error(outcome.text);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /play with sound/i.test(b.textContent || ""));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 2500));

  const afterTap = await page.evaluate(async () => {
    const v = document.querySelector("video[src]");
    if (!v) return { error: "no video" };
    v.muted = false;
    v.volume = 1;
    await v.play().catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    return {
      src: (v.currentSrc || v.src || "").slice(0, 120),
      isSameOrigin: (() => {
        try {
          return new URL(v.currentSrc || v.src, location.href).origin === location.origin;
        } catch {
          return false;
        }
      })(),
      muted: v.muted,
      paused: v.paused,
      duration: v.duration,
      webkitAudioDecodedByteCount: v.webkitAudioDecodedByteCount ?? null,
    };
  });
  report.afterTap = afterTap;
  await page.screenshot({ path: join(OUT, "03-playing.png"), fullPage: true });

  const exportInfo = await page.evaluate(async () => {
    const v = document.querySelector("video[src]");
    const res = await fetch(v.currentSrc || v.src);
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return { b64: btoa(binary), bytes: buf.length };
  });
  const file = join(OUT, "website-e2e.mp4");
  writeFileSync(file, Buffer.from(exportInfo.b64, "base64"));
  const probe = ffprobe(file);
  report.fileBytes = exportInfo.bytes;
  report.probe = probe;
  const streams = probe.streams || [];
  report.hasVideo = streams.some((s) => s.codec_type === "video");
  report.hasAudio = streams.some((s) => s.codec_type === "audio");
  report.audioDecoded = Number(afterTap.webkitAudioDecodedByteCount || 0) > 0;
  report.newlyGenerated = true;
  report.ok = Boolean(
    report.hasVideo && report.hasAudio && report.fileBytes > 50000 && afterTap.isSameOrigin && !afterTap.muted && report.audioDecoded,
  );
} catch (e) {
  report.ok = false;
  report.error = e instanceof Error ? e.message : String(e);
  try {
    await page.screenshot({ path: join(OUT, "99-error.png"), fullPage: true });
  } catch {
    /* */
  }
} finally {
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  console.log("PROOF_DIR=" + OUT);
  process.exit(report.ok ? 0 : 2);
}
