/**
 * Chrome playback + download proof for same-origin ingested MP4s.
 * Usage: node scripts/e2e-playback-urls.mjs
 * Optional: set MEDIA_URLS as JSON [{"label":"...","url":"https://..."}]
 */
import { launch } from "puppeteer-core";
import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const OUT = join(process.env.TEMP || "/tmp", "reelo-e2e-playback");
mkdirSync(OUT, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

const defaultVideos = [
  { label: "ai-avatar-studio", url: "https://www.myreelo.com/api/media/c/e0831cbaee4947888f4809d7b659461c" },
  { label: "website-commercial", url: "https://www.myreelo.com/api/media/c/7a8b4fd3dc1d4d1c86cb137a4efbc46f" },
  { label: "dancing-photo", url: "https://www.myreelo.com/api/media/c/a93798bc5961490ebd9f60c028a0edeb" },
  { label: "product-commercial", url: "https://www.myreelo.com/api/media/c/b9652c52ae8c4ae3a0fe0ed709b3ab73" },
  { label: "talking-photo", url: "https://www.myreelo.com/api/media/c/522f7f2b969d4b5caa138023ad23b125" },
];

const videos = process.env.MEDIA_URLS ? JSON.parse(process.env.MEDIA_URLS) : defaultVideos;

function ffprobe(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const lines = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  const streams = lines.map((l) => {
    const p = l.split(",");
    if (p[1] === "audio" || p[1] === "video") return { name: p[0], type: p[1] };
    if (p[0] === "audio" || p[0] === "video") return { name: p[1], type: p[0] };
    return { name: l, type: "unknown" };
  });
  return {
    streams,
    hasVideo: streams.some((s) => s.type === "video"),
    hasAudio: streams.some((s) => s.type === "audio"),
  };
}

const browser = await launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
const results = [];

for (const v of videos) {
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#000">
<video id="v" src="${v.url}" controls playsinline style="width:100vw;height:90vh;object-fit:contain"></video>
<button id="go" style="position:fixed;inset:0;z-index:9;background:rgba(0,0,0,.7);color:#fff;font:bold 20px sans-serif">Tap to play with sound</button>
<script>
document.getElementById('go').onclick=async()=>{
  const el=document.getElementById('v');
  el.muted=false; el.volume=1;
  await el.play();
  document.getElementById('go').style.display='none';
};
</script></body></html>`;
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.click("#go");
  await new Promise((r) => setTimeout(r, 3000));
  const info = await page.evaluate(() => {
    const el = document.getElementById("v");
    return {
      src: el.currentSrc,
      muted: el.muted,
      paused: el.paused,
      duration: el.duration,
      readyState: el.readyState,
      audio: el.webkitAudioDecodedByteCount || 0,
      w: el.videoWidth,
      h: el.videoHeight,
      error: el.error ? el.error.message || String(el.error.code) : null,
    };
  });
  await page.screenshot({ path: join(OUT, `${v.label}-play.png`) });

  const res = await fetch(v.url);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = join(OUT, `${v.label}.mp4`);
  writeFileSync(file, buf);
  const probe = ffprobe(file);
  const pass =
    res.ok &&
    buf.length > 50_000 &&
    info.audio > 0 &&
    !info.muted &&
    !info.paused &&
    probe.hasVideo &&
    probe.hasAudio;
  results.push({
    label: v.label,
    pass,
    http: res.status,
    bytes: buf.length,
    streams: probe.streams,
    ...info,
  });
  console.log(JSON.stringify(results[results.length - 1]));
}

writeFileSync(join(OUT, "report.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log("SUMMARY", {
  passed: results.filter((r) => r.pass).map((r) => r.label),
  failed: failed.map((r) => r.label),
});
console.log("PROOF_DIR=" + OUT);
process.exit(failed.length ? 2 : 0);
