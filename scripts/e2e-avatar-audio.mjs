/**
 * Full production E2E: open AI Avatar Studio in real Chrome, generate a video,
 * verify blob playback + audio track, save proof files.
 */
import { launch } from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const PROD = process.env.PROD_URL || "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-e2e-proof");
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
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream"],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
page.setDefaultTimeout(120_000);
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

const report = { steps: [], ok: false };

try {
  report.steps.push("goto studio");
  await page.goto(`${PROD}/create/ai-avatar-studio`, { waitUntil: "networkidle2", timeout: 120_000 });
  await page.screenshot({ path: join(OUT, "01-loaded.png"), fullPage: true });

  // Wait for avatar grid
  report.steps.push("wait avatars");
  await page.waitForFunction(() => {
    const imgs = document.querySelectorAll("button img");
    return imgs.length >= 3;
  }, { timeout: 180_000 });

  // Select first avatar if needed
  await page.evaluate(() => {
    const btn = document.querySelector("button img")?.closest("button");
    btn?.click();
  });

  // Set a short script
  report.steps.push("fill script");
  await page.evaluate(() => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(ta, "Hello from Reelo production verification. Testing audio now.");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  // Click generate
  report.steps.push("click generate");
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const gen = buttons.find((b) => /generate avatar video|regenerate|generating/i.test(b.textContent || ""));
    if (!gen || gen.disabled) return false;
    gen.click();
    return true;
  });
  if (!clicked) throw new Error("Generate button not found/enabled");

  await page.screenshot({ path: join(OUT, "02-generating.png"), fullPage: true });

  // Wait until done OR error (up to ~12 min)
  report.steps.push("wait completion");
  const outcome = await page.waitForFunction(
    () => {
      const body = document.body.innerText;
      if (/tap to play with sound|mp4 verified with aac|video verified with audio|click to play with sound|your avatar video is ready/i.test(body)) {
        return { state: "done", text: body.slice(0, 500) };
      }
      if (/could not download|not a playable mp4|server returned an error|generation failed|HEYGEN/i.test(body) &&
          !/generating/i.test(document.querySelector("button")?.textContent || "")) {
        // only treat as error if not still generating
        const genBtn = [...document.querySelectorAll("button")].some((b) => /generating/i.test(b.textContent || ""));
        if (!genBtn && /failed|error|could not|not a playable/i.test(body)) {
          return { state: "error", text: body.match(/.{0,80}(failed|error|could not|playable|download).{0,80}/i)?.[0] || body.slice(0, 300) };
        }
      }
      return null;
    },
    { timeout: 14 * 60 * 1000, polling: 3000 },
  ).then((h) => h.jsonValue());

  report.outcome = outcome;
  await page.screenshot({ path: join(OUT, "03-after-wait.png"), fullPage: true });

  if (outcome.state === "error") throw new Error(`UI error: ${outcome.text}`);

  // Inspect video element
  report.steps.push("inspect video");
  const videoInfo = await page.evaluate(async () => {
    const v = document.querySelector("video[src]");
    if (!v) return { error: "no video element with src" };
    const src = v.currentSrc || v.src;
    v.muted = false;
    v.volume = 1;
    try {
      await v.play();
    } catch (e) {
      return { src, playError: String(e) };
    }
    // Wait briefly for decoded audio
    await new Promise((r) => setTimeout(r, 1500));
    return {
      src: src.slice(0, 80),
      isBlob: src.startsWith("blob:"),
      muted: v.muted,
      volume: v.volume,
      paused: v.paused,
      duration: v.duration,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
      readyState: v.readyState,
      // Chromium-specific decoded audio bytes
      webkitAudioDecodedByteCount: v.webkitAudioDecodedByteCount ?? null,
      audioTracks: v.audioTracks ? v.audioTracks.length : null,
    };
  });
  report.videoInfo = videoInfo;

  // Click play-with-sound if present
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /play with sound|unmute/i.test(b.textContent || ""));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: join(OUT, "04-playing.png"), fullPage: true });

  // Export blob bytes from page and ffprobe
  report.steps.push("export blob");
  if (videoInfo.isBlob) {
    const b64 = await page.evaluate(async () => {
      const v = document.querySelector("video[src]");
      const res = await fetch(v.src);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    });
    const file = join(OUT, "avatar-e2e.mp4");
    writeFileSync(file, Buffer.from(b64, "base64"));
    const probe = ffprobe(file);
    report.fileBytes = Buffer.from(b64, "base64").length;
    report.probe = probe;
    const streams = probe.streams || [];
    report.hasVideo = streams.some((s) => s.codec_type === "video");
    report.hasAudio = streams.some((s) => s.codec_type === "audio");
    report.ok = Boolean(report.hasVideo && report.hasAudio && report.fileBytes > 50000 && videoInfo.isBlob);
  } else {
    report.ok = false;
    report.reason = "video src was not a blob: URL — materialize path did not run";
  }
} catch (e) {
  report.ok = false;
  report.error = e instanceof Error ? e.message : String(e);
  try {
    await page.screenshot({ path: join(OUT, "99-error.png"), fullPage: true });
  } catch {
    /* */
  }
} finally {
  report.logs = logs.slice(-80);
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  console.log("PROOF_DIR=" + OUT);
  process.exit(report.ok ? 0 : 2);
}
