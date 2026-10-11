#!/usr/bin/env node
/**
 * Renders one StudyProofs demonstration from REAL product output.
 *
 *   node render-demo.mjs <demo.json> <outDir> [--ffmpeg /path/to/ffmpeg] [--url hq.amberoneai.com/studyproofs]
 *
 * <demo.json> is what the worker's demo run stored: { slug, title, course, sampleText, generatedAt, model, material: { notes, flashcards, quiz } }.
 * Nothing in the study tools is written here: the script only SELECTS (by fixed length and citation rules) and LAYS OUT what the product made,
 * and says so on the last frame. Output: scene PNGs, a 30-second silent vertical MP4 (H.264, with a silent audio track), a 4:5 feed image, a
 * 2:3 pin image and a 1200x630 preview image. It needs Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH) and an ffmpeg with libx264.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire("/home/user/amberai/package.json");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const FFMPEG = flag("--ffmpeg", "ffmpeg");
const SHOW_URL = flag("--url", "hq.amberoneai.com/studyproofs");
const CHROME_FLAG = flag("--chrome", "");
const [demoPath, outDir] = args;
if (!demoPath || !outDir) {
  console.error("usage: render-demo.mjs <demo.json> <outDir> [--ffmpeg path] [--url text]");
  process.exit(2);
}
const demo = JSON.parse(fs.readFileSync(demoPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const inSource = (quote) => norm(quote).length >= 12 && norm(demo.sampleText).includes(norm(quote).slice(0, 120));
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);

// ---- selection: fixed rules, no editing of words
const m = demo.material;
const goodCards = m.flashcards.filter((c) => c.front.length >= 12 && c.front.length <= 120 && c.back.length >= 8 && c.back.length <= 200 && c.source?.quote && inSource(c.source.quote));
const pick = (arr, n) => {
  if (arr.length <= n) return arr;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * (arr.length - 1)) / (n - 1))]);
  return out;
};
const cards = pick(goodCards, 3);
const goodQuiz = m.quiz.filter((q) => q.question.length >= 15 && q.question.length <= 150 && q.choices.length >= 3 && q.choices.length <= 4 && q.choices.every((c) => c.length <= 80) && (q.explanation || "").length <= 220 && q.source?.quote && inSource(q.source.quote));
const quiz = goodQuiz[0] || null;
if (cards.length < 2 || !quiz) {
  console.error(`not enough eligible study tools to build a demonstration (cards ${cards.length}, quiz ${quiz ? 1 : 0}); nothing rendered`);
  process.exit(3);
}

// ---- styling shared by every scene
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{background:radial-gradient(1400px 900px at 85% -5%,rgba(201,164,90,.20),transparent 55%),radial-gradient(1000px 700px at 0% 25%,rgba(80,110,180,.16),transparent 50%),#07080c;color:#f4efe4;font-family:"Liberation Sans","DejaVu Sans",Arial,sans-serif;overflow:hidden}
.serif{font-family:"Bitstream Charter","DejaVu Serif","Liberation Serif",Georgia,serif}
.gold{color:#e4c37a}.muted{color:#a39b8c}.ok{color:#8fbf9a}
.brand{position:absolute;left:90px;top:96px;font-size:40px;letter-spacing:-.01em;font-weight:700}
.brand span{color:#e4c37a}
.step{display:inline-block;border:2px solid rgba(228,195,122,.55);color:#e4c37a;border-radius:999px;padding:8px 26px;font-size:30px;letter-spacing:.04em;text-transform:uppercase}
.card{background:rgba(18,22,32,.88);border:2px solid rgba(232,214,176,.20);border-radius:30px;padding:44px 48px}
.cite{margin-top:22px;color:#e4c37a;font-size:28px;line-height:1.35;font-style:italic}
.foot{position:absolute;left:90px;right:90px;bottom:430px;font-size:27px;color:#a39b8c;line-height:1.4}
`;
const frame = (inner, { w, h }) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body style="width:${w}px;height:${h}px">${inner}</body></html>`;
const V = { w: 1080, h: 1920 };

const noteLines = demo.sampleText.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
// Whole lines, wrapped; the card is a fixed height and fades out at the bottom, so what is cut is cut by the layout, never by rewriting.
const excerpt = noteLines.slice(0, 40);

const scenes = [
  {
    name: "1-hook",
    seconds: 3.2,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:520px">
        <span class="step">Sample notes in. Study tools out.</span>
        <h1 class="serif" style="font-size:96px;line-height:1.08;margin-top:46px;letter-spacing:-.02em">${esc(demo.title)}</h1>
        <p class="muted" style="font-size:38px;margin-top:34px">${esc(demo.course)} · notes written by us for this demo</p>
      </div>`,
  },
  {
    name: "2-input",
    seconds: 5.6,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:250px"><span class="step">1 · The notes</span>
        <div class="card" style="margin-top:34px;height:1060px;overflow:hidden;position:relative">
          <div style="font-size:33px;line-height:1.42;white-space:pre-wrap;color:#e9e2d2">${excerpt.map((l, i) => (i === 0 ? `<b class="gold">${esc(l)}</b>` : esc(l))).join("\n")}</div>
          <div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(transparent,rgba(18,22,32,1))"></div>
        </div>
        <p class="muted" style="font-size:30px;margin-top:26px">Excerpt. Pasted in as plain text.</p>
      </div>`,
  },
  {
    name: "3-counts",
    seconds: 3.4,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:520px"><span class="step">2 · What StudyProofs made</span>
        <div class="serif" style="margin-top:70px;font-size:150px;line-height:1;color:#e4c37a">${m.flashcards.length}</div><div style="font-size:52px;margin-top:6px">flashcards</div>
        <div class="serif" style="margin-top:56px;font-size:150px;line-height:1;color:#e4c37a">${m.quiz.length}</div><div style="font-size:52px;margin-top:6px">quiz questions</div>
        <p class="muted" style="font-size:32px;margin-top:56px">Generated by the product itself from these notes.</p>
      </div>`,
  },
  {
    name: "4-cards",
    seconds: 8,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:250px"><span class="step">3 · Flashcards, with where each came from</span>
        ${cards
          .map(
            (c) => `<div class="card" style="margin-top:30px">
              <div class="muted" style="font-size:26px;letter-spacing:.06em;text-transform:uppercase">Prompt</div>
              <div style="font-size:41px;line-height:1.25;margin-top:8px">${esc(c.front)}</div>
              <div class="muted" style="font-size:26px;letter-spacing:.06em;text-transform:uppercase;margin-top:22px">Answer</div>
              <div style="font-size:37px;line-height:1.28;margin-top:6px;color:#e9e2d2">${esc(c.back)}</div>
              <div class="cite">Source: “${esc(clip(c.source.quote, 96))}”</div>
            </div>`,
          )
          .join("")}
      </div>`,
  },
  {
    name: "5-quiz",
    seconds: 7,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:250px"><span class="step">4 · A quiz question</span>
        <div class="card" style="margin-top:34px">
          <div class="serif" style="font-size:50px;line-height:1.2">${esc(quiz.question)}</div>
          <div style="margin-top:34px">${quiz.choices
            .map(
              (c, i) => `<div style="margin-top:16px;padding:20px 26px;border-radius:20px;font-size:36px;line-height:1.25;border:2px solid ${i === quiz.answerIndex ? "#8fbf9a" : "rgba(232,214,176,.18)"};background:${i === quiz.answerIndex ? "rgba(143,191,154,.14)" : "transparent"}">${String.fromCharCode(65 + i)}. ${esc(c)}${i === quiz.answerIndex ? ' <span class="ok">✓</span>' : ""}</div>`,
            )
            .join("")}</div>
          ${quiz.explanation ? `<div style="margin-top:30px;font-size:33px;line-height:1.3;color:#e9e2d2"><b class="gold">Why:</b> ${esc(quiz.explanation)}</div>` : ""}
          <div class="cite">Source: “${esc(clip(quiz.source.quote, 96))}”</div>
        </div>
      </div>`,
  },
  {
    name: "6-cta",
    seconds: 4.8,
    html: `<div class="brand serif">Study<span>Proofs</span></div>
      <div style="position:absolute;left:90px;right:90px;top:480px">
        <h2 class="serif" style="font-size:88px;line-height:1.1;letter-spacing:-.02em">Try it with your own notes.</h2>
        <p style="font-size:42px;margin-top:40px;line-height:1.3">Free to start: 3 uploads a week, and your library stays yours.</p>
        <div class="card" style="margin-top:56px;text-align:center"><div class="gold serif" style="font-size:44px">${esc(SHOW_URL)}</div></div>
        <p class="muted" style="font-size:30px;margin-top:46px;line-height:1.4">Made by StudyProofs. The study tools here are the product’s own output from sample notes we wrote; AI can make mistakes, so check them against your notes.</p>
      </div>`,
  },
];

// ---- feed (4:5), pin (2:3) and preview (1200x630) images
const feedHtml = `<div class="brand serif" style="top:70px;left:70px;font-size:36px">Study<span>Proofs</span></div>
  <div style="position:absolute;left:70px;right:70px;top:150px">
    <span class="step" style="font-size:26px;padding:6px 22px">Sample notes in · study tools out</span>
    <h1 class="serif" style="font-size:66px;line-height:1.1;margin-top:26px;letter-spacing:-.02em">${esc(demo.title)}</h1>
    <div class="card" style="margin-top:34px;padding:30px 34px">
      <div class="muted" style="font-size:24px;letter-spacing:.06em;text-transform:uppercase">Flashcard · prompt</div>
      <div style="font-size:35px;line-height:1.25;margin-top:6px">${esc(cards[0].front)}</div>
      <div class="muted" style="font-size:24px;letter-spacing:.06em;text-transform:uppercase;margin-top:18px">Answer</div>
      <div style="font-size:32px;line-height:1.28;margin-top:4px;color:#e9e2d2">${esc(cards[0].back)}</div>
      <div class="cite" style="font-size:24px;margin-top:16px">Source: “${esc(clip(cards[0].source.quote, 80))}”</div>
    </div>
    <div class="card" style="margin-top:24px;padding:30px 34px">
      <div class="muted" style="font-size:24px;letter-spacing:.06em;text-transform:uppercase">Quiz question</div>
      <div style="font-size:33px;line-height:1.25;margin-top:6px">${esc(quiz.question)}</div>
    </div>
    <p class="muted" style="font-size:26px;margin-top:26px;line-height:1.35">${m.flashcards.length} flashcards and ${m.quiz.length} quiz questions from ${esc(demo.course)} sample notes we wrote. AI can make mistakes: check them.</p>
    <p class="gold" style="font-size:30px;margin-top:14px">${esc(SHOW_URL)}</p>
  </div>`;
const pinHtml = `<div class="brand serif" style="top:70px;left:70px;font-size:36px">Study<span>Proofs</span></div>
  <div style="position:absolute;left:70px;right:70px;top:190px">
    <h1 class="serif" style="font-size:78px;line-height:1.08;letter-spacing:-.02em">Turn ${esc(demo.course)} notes into flashcards and a quiz</h1>
    <div class="card" style="margin-top:56px">
      <div class="muted" style="font-size:25px;letter-spacing:.06em;text-transform:uppercase">Prompt</div>
      <div style="font-size:40px;line-height:1.25;margin-top:8px">${esc(cards[0].front)}</div>
      <div class="muted" style="font-size:25px;letter-spacing:.06em;text-transform:uppercase;margin-top:22px">Answer</div>
      <div style="font-size:36px;line-height:1.28;margin-top:6px;color:#e9e2d2">${esc(cards[0].back)}</div>
      <div class="cite" style="font-size:26px">Source: “${esc(clip(cards[0].source.quote, 84))}”</div>
    </div>
    <p class="muted" style="font-size:28px;margin-top:40px;line-height:1.4">Made from sample notes we wrote. Cited to the notes. AI can make mistakes: check them.</p>
    <p class="gold" style="font-size:34px;margin-top:20px">${esc(SHOW_URL)}</p>
  </div>`;
const ogHtml = `<div class="brand serif" style="top:48px;left:60px;font-size:34px">Study<span>Proofs</span></div>
  <div style="position:absolute;left:60px;right:60px;top:140px">
    <span class="step" style="font-size:24px;padding:6px 20px">Sample notes in · study tools out</span>
    <h1 class="serif" style="font-size:70px;line-height:1.08;margin-top:24px;letter-spacing:-.02em">${esc(demo.title)}</h1>
    <p style="font-size:34px;margin-top:22px;color:#e9e2d2">${m.flashcards.length} flashcards · ${m.quiz.length} quiz questions · every one cited to the notes</p>
    <p class="muted" style="font-size:26px;margin-top:20px">Made from ${esc(demo.course)} sample notes we wrote. AI can make mistakes: check them.</p>
  </div>`;

// Playwright may ask for a newer browser build than the one preinstalled; the preinstalled Chromium works for screenshots.
const CHROME = CHROME_FLAG || process.env.PW_CHROME || "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
const shot = async (name, html, size) => {
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
  await page.setContent(frame(html, size), { waitUntil: "load" });
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, type: "png" });
  await page.close();
  return file;
};
const sceneFiles = [];
for (const s of scenes) sceneFiles.push({ ...s, file: await shot(`scene-${s.name}.png`, s.html, V) });
await shot("feed-1080x1350.png", feedHtml, { w: 1080, h: 1350 });
await shot("pin-1000x1500.png", pinHtml, { w: 1000, h: 1500 });
await shot("preview-1200x630.png", ogHtml, { w: 1200, h: 630 });
await browser.close();

// ---- the video: scenes with short cross-fades, silent audio track, faststart
const FADE = 0.45;
const inputs = sceneFiles.flatMap((s) => ["-loop", "1", "-t", String(s.seconds + FADE), "-i", s.file]);
let filter = sceneFiles.map((_, i) => `[${i}:v]format=yuv420p,setsar=1,fps=30[v${i}]`).join(";");
let last = "v0";
let offset = sceneFiles[0].seconds;
for (let i = 1; i < sceneFiles.length; i++) {
  filter += `;[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[x${i}]`;
  last = `x${i}`;
  offset += sceneFiles[i].seconds;
}
const total = sceneFiles.reduce((a, s) => a + s.seconds, 0);
const outMp4 = path.join(outDir, "demo-1080x1920.mp4");
execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...inputs, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-filter_complex", filter, "-map", `[${last}]`, "-map", `${sceneFiles.length}:a`, "-t", total.toFixed(2), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "64k", "-shortest", "-movflags", "+faststart", outMp4], { stdio: "inherit" });
fs.writeFileSync(path.join(outDir, "selection.json"), JSON.stringify({ slug: demo.slug, generatedAt: demo.generatedAt, model: demo.model, cards: cards.map((c) => ({ front: c.front, back: c.back, quote: c.source.quote })), quiz: { question: quiz.question, choices: quiz.choices, answerIndex: quiz.answerIndex, explanation: quiz.explanation, quote: quiz.source.quote }, counts: { flashcards: m.flashcards.length, quiz: m.quiz.length, notes: m.notes.length }, seconds: total }, null, 2));
console.log(`rendered ${path.basename(outMp4)} (${total.toFixed(1)} s) and 3 still images in ${outDir}`);
