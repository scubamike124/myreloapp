/**
 * Force blob playback even if callers pass /api/media or https URLs.
 * Also refuses to leave a non-blob src on the element.
 */
import { launch } from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROD = "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-sync-proof2");
mkdirSync(OUT, { recursive: true });
const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

const browser = await launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--disable-cache"],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
const report = { ok: false };

try {
  // Use the last generated media id from previous run and force blob in-page
  const mediaUrl = "https://www.myreelo.com/api/media/c/abb1a1c20668462f8ac82661ea648f53";
  await page.goto("about:blank");
  const result = await page.evaluate(async (mediaUrl) => {
    async function toBlob(url) {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      return URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
    }
    async function measure(src, label) {
      const v = document.createElement("video");
      v.playsInline = true;
      v.preload = "auto";
      v.src = src;
      document.body.appendChild(v);
      const m = { waiting: 0, stalled: 0 };
      v.addEventListener("waiting", () => m.waiting++);
      v.addEventListener("stalled", () => m.stalled++);
      v.muted = false;
      v.volume = 1;
      await v.play().catch(() => {});
      const start = performance.now();
      while (!v.ended && performance.now() - start < 15000) {
        await new Promise((r) => setTimeout(r, 50));
      }
      const q = v.getVideoPlaybackQuality?.();
      const out = {
        label,
        srcKind: src.startsWith("blob:") ? "blob" : "network",
        waiting: m.waiting,
        stalled: m.stalled,
        dropped: q?.droppedVideoFrames ?? null,
        total: q?.totalVideoFrames ?? null,
        dropRate: q?.totalVideoFrames ? q.droppedVideoFrames / q.totalVideoFrames : null,
        duration: v.duration,
        ended: v.ended,
        audio: v.webkitAudioDecodedByteCount ?? null,
      };
      v.remove();
      return out;
    }

    const chunked = await measure(mediaUrl, "chunked");
    const blobSrc = await toBlob(mediaUrl);
    const blob = await measure(blobSrc, "blob");
    return { chunked, blob, headersProbe: await fetch(mediaUrl).then((r) => ({
      contentLength: r.headers.get("content-length"),
      te: r.headers.get("transfer-encoding"),
    })) };
  }, mediaUrl);

  report.result = result;
  report.ok = Boolean(
    result.blob.waiting === 0 &&
      result.blob.stalled === 0 &&
      (result.blob.dropRate == null || result.blob.dropRate <= 0.05) &&
      (result.blob.audio || 0) > 0 &&
      result.blob.ended,
  );
} catch (e) {
  report.error = String(e.message || e);
} finally {
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
}
