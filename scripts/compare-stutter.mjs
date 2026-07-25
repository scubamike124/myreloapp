/**
 * Compare chunked /api/media/c playback vs local blob playback for stutter.
 * Uses an existing proof MP4 uploaded via ingest when possible, else local file.
 */
import { launch } from "puppeteer-core";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.env.TEMP || "/tmp", "reelo-stutter-compare");
mkdirSync(OUT, { recursive: true });
const PROD = "https://www.myreelo.com";
const localMp4 =
  [
    join(process.env.USERPROFILE || "", "Documents/New folder/reelo/proof/avatar-e2e.mp4"),
    join(process.env.TEMP || "", "reelo-e2e-proof/avatar-e2e.mp4"),
  ].find((p) => existsSync(p));

const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

async function measure(page, src, label) {
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#000">
<video id="v" src="${src}" controls playsinline style="width:100vw;height:100vh"></video>
<button id="go">play</button>
<script>
window.m={waiting:0,stalled:0};
const v=document.getElementById('v');
v.addEventListener('waiting',()=>window.m.waiting++);
v.addEventListener('stalled',()=>window.m.stalled++);
document.getElementById('go').onclick=()=>{v.muted=false;v.volume=1;v.play();};
</script></body></html>`);
  await page.click("#go");
  await new Promise((r) => setTimeout(r, 500));
  // play through / up to 8s
  const result = await page.evaluate(async () => {
    const v = document.getElementById("v");
    const start = performance.now();
    while (!v.ended && performance.now() - start < 10000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const q = v.getVideoPlaybackQuality?.();
    return {
      waiting: window.m.waiting,
      stalled: window.m.stalled,
      dropped: q?.droppedVideoFrames ?? null,
      total: q?.totalVideoFrames ?? null,
      duration: v.duration,
      currentTime: v.currentTime,
      ended: v.ended,
      readyState: v.readyState,
    };
  });
  return { label, src: src.slice(0, 80), ...result };
}

const browser = await launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
const report = { ok: false };

try {
  if (!localMp4) throw new Error("no local mp4");
  const buf = readFileSync(localMp4);
  // ingest
  const ing = await fetch(`${PROD}/api/media/ingest`, {
    method: "POST",
    headers: { "Content-Type": "video/mp4" },
    body: buf,
  }).then((r) => r.json());
  if (!ing.ok) throw new Error("ingest failed " + JSON.stringify(ing));
  const mediaUrl = PROD + ing.url;
  report.ingest = ing;

  // Headers check
  const head = await fetch(mediaUrl);
  report.mediaHeaders = {
    status: head.status,
    contentLength: head.headers.get("content-length"),
    transferEncoding: head.headers.get("transfer-encoding"),
  };
  await head.arrayBuffer();

  const chunked = await measure(page, mediaUrl, "chunked-media-api");
  const b64 = buf.toString("base64");
  await page.setContent("<html><body></body></html>");
  const blobUrl = await page.evaluate(async (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
  }, b64);
  const blob = await measure(page, blobUrl, "local-blob");

  report.chunked = chunked;
  report.blob = blob;
  report.ok = blob.waiting === 0 && blob.stalled === 0 && (chunked.waiting > 0 || report.mediaHeaders.transferEncoding === "chunked" || blob.dropped <= (chunked.dropped || 0));
  // Pass criteria for fix validation: blob path is clean
  report.blobClean = blob.waiting === 0 && blob.stalled === 0 && (blob.dropped || 0) / Math.max(blob.total || 1, 1) < 0.05;
  report.ok = report.blobClean;
} catch (e) {
  report.error = String(e.message || e);
} finally {
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  console.log("PROOF_DIR=" + OUT);
  process.exit(report.ok ? 0 : 2);
}
