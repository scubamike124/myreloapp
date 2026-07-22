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
  "Premium 3D product-illustration render for a dark UI dashboard card. " +
  "Deep near-black background. Crimson and scarlet red colour scheme " +
  "with bright neon red rim lighting and a soft red glow. Subtle white and silver highlights. " +
  "Object centred, floating, generous empty margin on all sides, nothing touching the edges. " +
  "Clean, glossy, high detail, sharp focus, professional icon illustration. " +
  "Square 1:1 composition. " +
  // Saying "no text" once was not enough: a vision pass over the first batch
  // found thirteen tiles carrying invented lettering — "Szgaufb", "MIX RIVES
  // BREID FOR ES FORGE", and the hex codes that used to be in this very prompt.
  "ABSOLUTELY NO TEXT of any kind: no words, no letters, no numbers, no hex codes, no labels, " +
  "no captions, no signage, no writing, no lettering on any surface, no watermark, no logo, no border. " +
  "Any surface that would normally carry writing must be left blank or show plain abstract blocks. " +
  "No human faces.";

const TILES = [
  // --- Business Center overview (11) ---
  ["create", "a glowing red pen or stylus writing a spark of light, creative authoring"],
  ["video-library", "a stack of red-glowing video thumbnails fanned out like cards, a media library"],
  // These three used to ask for "a font letterform", "fonts inside" and
  // "labelling" — then the tiles came back covered in invented lettering.
  ["brand-kit", "a red artist paint palette with round colour swatches and a plain circular disc"],
  ["assets", "open file folders holding photos, video clips and music notes, a media asset library"],
  ["social", "a cluster of glowing red social media app tiles connected by light trails"],
  ["publishing", "a red rocket launching upward trailing light, publishing content"],
  ["scheduling", "a red desk calendar with a clock overlapping it, scheduling"],
  ["analytics", "a floating red bar chart and rising line graph with a pie chart, analytics dashboard"],
  ["revenue", "a red wallet with coins and a rising arrow, earnings and growth"],
  ["trend-ai", "a glowing red human brain made of circuitry with a rising trend arrow"],
  ["hub-pro", "an ornate glowing red crown on a pedestal, premium tier"],

  // --- Business Center Pro (24) ---
  ["advanced-ai-suite", "a glowing red cube of layered AI circuitry radiating light"],
  ["team-collaboration", "three abstract red humanoid figures standing together around a glowing ring"],
  ["brand-vault-pro", "a heavy red circular bank vault door with a spoked handle, ajar, glowing red from within, floating in darkness"],
  ["content-templates", "a fanned stack of red video template cards with play buttons"],
  ["bulk-creation", "a conveyor belt producing many identical red video panels at once"],
  ["auto-subtitles", "two red speech bubbles containing subtitle caption bars and a sound waveform"],
  ["voice-cloning", "a red studio microphone beside a glowing duplicated audio waveform"],
  ["translate-dub", "a red globe with speech bubbles containing different writing systems around it"],
  ["smart-cut-edit", "red scissors cutting a strip of film beside a video timeline with edit markers"],
  ["thumbnail-maker", "a red video thumbnail frame with a cursor clicking it, high click-through"],
  ["stock-media-pro", "a grid of red-tinted stock photo, video and music note tiles"],
  ["background-remover", "a portrait silhouette lifting away from a checkerboard transparency background"],
  ["ai-script-writer", "a red fountain pen writing glowing script lines on a floating page"],
  // "social app tiles" produced recognisable third-party logos. Kept generic.
  ["automated-reposting", "a ring of red circular arrows cycling around plain glossy rounded squares"],
  ["detailed-analytics", "a detailed red analytics dashboard with donut charts and data columns"],
  ["competitor-tracker", "a red magnifying glass examining a bar chart and profile cards"],
  ["lead-capture-crm", "a red contact card stack with a funnel capturing glowing leads"],
  ["white-label", "a plain white rounded card floating beside red colour swatches, completely unmarked"],
  ["api-access", "a floating red code window with angle brackets and connection nodes"],
  ["webhooks", "red connector plugs joining nodes with light flowing between them"],
  ["unlimited-storage", "a red cloud with an infinity symbol glowing inside it"],
  ["priority-rendering", "a red speedometer needle pinned at maximum with motion streaks"],
  ["revenue-reports", "a red financial report page with a dollar sign, charts and an upward arrow"],
  ["account-manager", "a red headset resting beside a support chat bubble, dedicated support"],
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
      writeFileSync(file, webp);
      made++;
      done = true;
      console.log(`  + ${slug.padEnd(24)} ${(webp.length / 1024).toFixed(0)} KB`);
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
