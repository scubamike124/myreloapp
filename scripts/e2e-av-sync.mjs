/**
 * Verify smooth A/V sync on production Avatar Studio preview + export.
 * Measures: waiting events, dropped frames, blob playback, duration match.
 */
import { launch } from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const PROD = process.env.PROD_URL || "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-sync-proof");
mkdirSync(OUT, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

function ffprobe(file) {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,codec_name,duration,avg_frame_rate,start_time:format=duration",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  try {
    return JSON.parse(r.stdout || "{}");
  } catch {
    return {};
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
const report = { ok: false, steps: [], browser: "Chrome" };

try {
  await page.goto(`${PROD}/create/ai-avatar-studio`, { waitUntil: "networkidle2", timeout: 120_000 });
  report.steps.push("loaded");

  await page.waitForFunction(() => document.querySelectorAll("button img").length >= 3, { timeout: 180_000 });
  await page.evaluate(() => document.querySelector("button img")?.closest("button")?.click());

  await page.evaluate(() => {
    const ta = document.querySelector("textarea");
    if (!ta) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(ta, "Hello from Reelo. This sync check confirms narration lines up with the avatar.");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const clicked = await page.evaluate(() => {
    const gen = [...document.querySelectorAll("button")].find((b) =>
      /generate avatar video|regenerate/i.test(b.textContent || ""),
    );
    if (!gen || gen.disabled) return false;
    gen.click();
    return true;
  });
  if (!clicked) throw new Error("Generate not found");
  report.steps.push("generating");

  await page.waitForFunction(
    () => {
      const v = document.querySelector("video[src]");
      const src = v?.currentSrc || v?.src || "";
      return /tap to play with sound/i.test(document.body.innerText) && src.startsWith("blob:");
    },
    { timeout: 14 * 60 * 1000, polling: 3000 },
  );
  report.steps.push("ready-blob");

  // Install playback monitors before tap
  await page.evaluate(() => {
    const v = document.querySelector("video[src]");
    window.__syncMetrics = {
      waiting: 0,
      stalls: 0,
      seeking: 0,
      samples: [],
      src: v?.src || "",
    };
    if (!v) return;
    v.addEventListener("waiting", () => {
      window.__syncMetrics.waiting += 1;
    });
    v.addEventListener("stalled", () => {
      window.__syncMetrics.stalls += 1;
    });
    v.addEventListener("seeking", () => {
      window.__syncMetrics.seeking += 1;
    });
  });

  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /play with sound/i.test(b.textContent || ""))
      ?.click();
  });

  // Watch through the whole clip
  const playback = await page.evaluate(async () => {
    const v = document.querySelector("video[src]");
    if (!v) return { error: "no video" };
    v.muted = false;
    v.volume = 1;
    await v.play().catch(() => {});

    const start = performance.now();
    while (!v.ended && performance.now() - start < 60_000) {
      const q = v.getVideoPlaybackQuality?.();
      window.__syncMetrics.samples.push({
        t: v.currentTime,
        readyState: v.readyState,
        paused: v.paused,
        dropped: q?.droppedVideoFrames ?? null,
        decoded: q?.totalVideoFrames ?? null,
        audio: v.webkitAudioDecodedByteCount ?? null,
      });
      await new Promise((r) => setTimeout(r, 200));
    }

    const q = v.getVideoPlaybackQuality?.();
    return {
      srcKind: (v.currentSrc || v.src || "").startsWith("blob:")
        ? "blob"
        : (v.currentSrc || "").includes("/api/media/")
          ? "media-api"
          : "other",
      src: (v.currentSrc || v.src || "").slice(0, 80),
      duration: v.duration,
      ended: v.ended,
      currentTime: v.currentTime,
      muted: v.muted,
      waiting: window.__syncMetrics.waiting,
      stalls: window.__syncMetrics.stalls,
      seeking: window.__syncMetrics.seeking,
      droppedVideoFrames: q?.droppedVideoFrames ?? null,
      totalVideoFrames: q?.totalVideoFrames ?? null,
      audioBytes: v.webkitAudioDecodedByteCount ?? null,
      samples: window.__syncMetrics.samples.length,
    };
  });
  report.playback = playback;
  await page.screenshot({ path: join(OUT, "playing.png"), fullPage: true });

  // Export
  const exp = await page.evaluate(async () => {
    const v = document.querySelector("video[src]");
    const res = await fetch(v.currentSrc || v.src);
    const buf = new Uint8Array(await res.arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return { b64: btoa(s), bytes: buf.length };
  });
  const file = join(OUT, "sync-export.mp4");
  writeFileSync(file, Buffer.from(exp.b64, "base64"));
  const probe = ffprobe(file);
  report.export = { bytes: exp.bytes, probe };

  const streams = probe.streams || [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");
  const vDur = Number(video?.duration || probe.format?.duration || 0);
  const aDur = Number(audio?.duration || probe.format?.duration || 0);
  const durDelta = Math.abs(vDur - aDur);

  const dropRate =
    playback.totalVideoFrames > 0 ? (playback.droppedVideoFrames || 0) / playback.totalVideoFrames : 0;

  report.checks = {
    isBlobPlayback: playback.srcKind === "blob",
    hasAudioTrack: Boolean(audio),
    hasVideoTrack: Boolean(video),
    durationMatchMs: Math.round(durDelta * 1000),
    waitingEvents: playback.waiting,
    stallEvents: playback.stalls,
    dropRate,
    audioDecoded: (playback.audioBytes || 0) > 0,
    watchedNearEnd: playback.ended || playback.currentTime > (playback.duration || 0) * 0.85,
  };

  report.ok = Boolean(
    report.checks.isBlobPlayback &&
      report.checks.hasAudioTrack &&
      report.checks.hasVideoTrack &&
      report.checks.durationMatchMs <= 50 &&
      report.checks.waitingEvents === 0 &&
      report.checks.stallEvents === 0 &&
      dropRate <= 0.05 &&
      report.checks.audioDecoded &&
      report.checks.watchedNearEnd &&
      exp.bytes > 50_000,
  );
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  try {
    await page.screenshot({ path: join(OUT, "error.png"), fullPage: true });
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
