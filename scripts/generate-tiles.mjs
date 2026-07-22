// ---------------------------------------------------------------------------
// Business Center card artwork.
//
// One square illustration per card, in the site's own red-on-near-black look,
// so the Business Center and Business Center Pro pages carry the imagery from
// the design rather than a line icon in a box.
//
// Square on purpose. The last attempt at pictures on these cards used
// object-cover on landscape art and showed about a third of each image; these
// are 1:1 and rendered with object-contain, so nothing is ever cropped.
//
//   node scripts/generate-tiles.mjs             generate anything missing
//   node scripts/generate-tiles.mjs --force     redo everything
//   node scripts/generate-tiles.mjs --limit=5   stop after 5 (cost control)
//   node scripts/generate-tiles.mjs --only=api-access,webhooks
//
// About $0.039 per image at Gemini 2.5 Flash Image prices — 35 tiles ≈ $1.37.
// Existing files are skipped, so a re-run after a failure costs only the ones
// that are missing.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const key =
  process.env.GEMINI_API_KEY ?? env.match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("GEMINI_API_KEY not found in .env.local");

const IMAGE_MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const FORCE = process.argv.includes("--force");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OUT_DIR = path.join("public", "assets", "tiles");
const MAX_ATTEMPTS = 3;

// Held constant across all 35 so the grid reads as one set rather than 35
// unrelated pictures. Matches the site: crimson, near-black, glowing edges.
const STYLE =
  "Premium 3D illustrated dashboard scene, in the style of a glossy dark app card. " +
  "The ENTIRE background is solid pure black (#050303), edge to edge, in every corner — never white, grey or light. " +
  "Crimson and scarlet red colour scheme " +
  "with bright neon red rim lighting and a soft red glow. Subtle white and silver highlights. " +
  // The old prompt said "floating, generous empty margin", and that is exactly
  // why the tiles came back as a small object adrift on black. The mockup art
  // is a rich, detailed scene that fills its frame; this asks for that instead.
  "A rich, detailed composition of several related objects that FILLS the frame, " +
  "large and close-up, with only a small even margin — not a single tiny object floating in empty space. " +
  "Cinematic, glossy, high detail, sharp focus, dramatic lighting. " +
  "Square 1:1 composition. " +
  // Saying "no text" once was not enough: a vision pass over the first batch
  // found thirteen tiles carrying invented lettering — "Szgaufb", "MIX RIVES
  // BREID FOR ES FORGE", and the hex codes that used to be in this very prompt.
  "ABSOLUTELY NO TEXT of any kind: no words, no letters, no numbers, no hex codes, no labels, " +
  "no captions, no signage, no writing, no lettering on any surface, no watermark, no logo, no border. " +
  "Any surface that would normally carry writing must be left blank or show plain abstract blocks. " +
  "No human faces.";

// Every subject is written as a SCENE of a few related objects, not one item,
// so the render fills the frame the way the mockup art does. No text on any
// surface, no real brand logos, no human faces — all three had to be fixed by
// a vision pass on earlier batches.
const TILES = [
  // --- Business Center overview (11) ---
  ["create", "a glossy red film clapperboard with a curling film strip and several glowing video thumbnail frames arranged around it, a movie-making scene"],
  ["video-library", "a rich fanned stack of many glossy red video thumbnail cards with glowing play triangles, overlapping like a media library, filling the frame"],
  ["brand-kit", "a red artist paint palette with round colour swatches, a set of brushes and a plain circular brand disc, an art scene"],
  ["assets", "several open red file folders overflowing with glossy photos, film clips and music notes, a media asset scene filling the frame"],
  ["social", "a dense cluster of many glossy red rounded app icons showing generic heart, chat, play and camera symbols, connected by glowing light trails (no real brand logos)"],
  ["publishing", "a glossy red rocket launching from a small pad with billowing light trails and sparks, filling the frame"],
  ["scheduling", "a red desk calendar shown as a plain grid of blank empty squares with an alarm clock and a pin, no numbers on it, a scheduling scene"],
  ["analytics", "a rich red analytics dashboard scene with a bar chart, a rising line graph, a donut chart and floating data panels, filling the frame"],
  ["revenue", "a red wallet with a fan of glossy coins, stacked chips and a rising arrow, an earnings scene filling the frame"],
  ["trend-ai", "a glowing red human brain made of circuitry surrounded by floating nodes and a rising trend arrow, filling the frame"],
  ["hub-pro", "an ornate glossy red crown on a pedestal with glowing gems and radiating light beams, a premium scene"],

  // --- Business Center Pro (24) ---
  ["advanced-ai-suite", "a glowing red cube of layered AI circuitry surrounded by floating chips and light particles, filling the frame"],
  ["team-collaboration", "several abstract red humanoid figures standing together around a glowing ring with connecting light lines, a teamwork scene"],
  ["brand-vault", "a heavy red circular bank vault door with a spoked handle, ajar, glowing red from within, with glossy swatch chips spilling out"],
  ["content-templates", "a rich fanned stack of many red video template cards with glowing play buttons, overlapping and filling the frame"],
  ["bulk-creation", "a red conveyor belt producing a long row of many identical glossy video panels at once, filling the frame"],
  ["auto-subtitles", "two large glossy red speech bubbles holding plain caption bars, beside a glowing sound waveform, filling the frame"],
  ["voice-cloning", "a glossy red studio microphone beside a glowing duplicated audio waveform and pop filter, a recording scene"],
  ["translate-dub", "a glossy red wireframe globe ringed by plain empty speech bubbles and curved exchange arrows, filling the frame"],
  ["smart-cut-edit", "glossy red scissors cutting a film strip above a video editing timeline with clip blocks and markers, filling the frame"],
  ["thumbnail-maker", "a large glossy red video thumbnail frame with a glowing play button and a cursor arrow clicking it, filling the frame"],
  ["stock-media-pro", "a rich grid of glossy red blank photo frames, film strips and music notes, a stock media scene filling the frame"],
  ["background-remover", "a glossy red portrait silhouette lifting cleanly away from a checkerboard transparency panel behind it, filling the frame"],
  ["ai-script-writer", "a glossy red fountain pen above a floating sheet with blank ruled lines and sparks of light, a writing scene"],
  ["automated-reposting", "a ring of glossy red circular arrows cycling around several plain rounded app squares, filling the frame"],
  ["detailed-analytics", "a rich red analytics dashboard with donut charts, tall data columns and floating metric panels, filling the frame"],
  ["competitor-tracker", "a large glossy red magnifying glass examining a bar chart and several plain profile cards, filling the frame"],
  ["lead-capture-crm", "a stack of glossy red contact cards with a glowing funnel capturing streams of light leads, filling the frame"],
  ["white-label", "a blank glossy dark-red rounded card with a glowing red border, floating among red colour swatches and paint chips, completely unmarked, no white, filling the frame"],
  ["api-access", "glossy red interlocking gear and plug shapes joined by glowing cables and connection nodes, an integration scene, no screens, filling the frame"],
  ["webhooks", "several glossy red connector plugs joining glowing nodes with light flowing between them, filling the frame"],
  ["unlimited-storage", "a large glossy red cloud with a glowing infinity loop beneath it and stacked storage drums, filling the frame"],
  ["priority-rendering", "glowing red server racks with a lightning bolt and motion streaks rushing past, a fast-rendering scene, no dials, filling the frame"],
  ["revenue-reports", "a red financial report scene with a large dollar coin, bar charts and an upward arrow on floating panels, filling the frame"],
  ["account-manager", "a glossy red headset resting beside a glowing support chat bubble and a small desk, a support scene filling the frame"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(subject) {
  const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE} Subject: ${subject}.` }] }],
      generationConfig: { temperature: 0.8 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message?.slice(0, 140) ?? `HTTP ${res.status}`);
  const part = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData || p.inline_data);
  const payload = part?.inlineData || part?.inline_data;
  if (!payload?.data) throw new Error("no image returned");
  return Buffer.from(payload.data, "base64");
}

mkdirSync(OUT_DIR, { recursive: true });

let made = 0;
let skipped = 0;
let failed = 0;

const work = TILES.filter(([slug]) => (ONLY.length ? ONLY.includes(slug) : true));

for (const [slug, subject] of work) {
  if (made >= LIMIT) {
    console.log(`\nStopped at --limit=${LIMIT}.`);
    break;
  }
  const file = path.join(OUT_DIR, `${slug}.webp`);
  if (existsSync(file) && !FORCE) {
    skipped++;
    continue;
  }

  let done = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
    try {
      const buf = await generate(subject);
      // The model returns a ~1MB PNG. Thirty-five of those is 38MB in the repo
      // and on every page load, for artwork that is displayed at 84px.
      const webp = await sharp(buf).resize(512, 512, { fit: "inside" }).webp({ quality: 82 }).toBuffer();

      // Reject a light background before it ships. The prompt asks for near-black,
      // but the model sometimes renders a scene on white, and against the dark
      // grid that one tile glares. Corner brightness above ~120 means the
      // backdrop is not dark; retry rather than accept it.
      const { data: px, info: pi } = await sharp(webp).resize(24, 24).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const corner = [0, (pi.width - 1) * pi.channels, (pi.height - 1) * pi.width * pi.channels, (pi.height * pi.width - 1) * pi.channels]
        .reduce((sum, k) => sum + (px[k] + px[k + 1] + px[k + 2]) / 3, 0) / 4;
      if (corner > 120) {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(1500);
          continue;
        }
        console.log(`  ! ${slug.padEnd(24)} still light after ${MAX_ATTEMPTS} tries (corner ${corner.toFixed(0)})`);
      }

      writeFileSync(file, webp);
      made++;
      done = true;
      console.log(`  + ${slug.padEnd(24)} ${(webp.length / 1024).toFixed(0)} KB  corner ${corner.toFixed(0)}`);
    } catch (e) {
      if (attempt === MAX_ATTEMPTS) {
        failed++;
        console.log(`  ! ${slug.padEnd(24)} ${e.message}`);
      } else {
        // The image model returns "high demand" under load often enough that a
        // single attempt would leave holes in the grid.
        await sleep(3000 * attempt);
      }
    }
  }
}

console.log(
  `\n${made} generated, ${skipped} already present, ${failed} failed. ` +
    `Approx cost this run: $${(made * 0.039).toFixed(2)}.`,
);
if (failed) console.log("Re-run to retry only the missing ones.");
