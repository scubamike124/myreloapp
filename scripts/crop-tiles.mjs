// ---------------------------------------------------------------------------
// Turn the square tile art into landscape art that fills its card.
//
// The generated tiles are 1:1 with a deliberately large empty margin around the
// object. Dropped into a short, wide card frame with object-contain, the image
// scales to the frame's HEIGHT — so the picture ends up a small square floating
// in the middle with dead space either side. Michael's report was exact: you
// cannot see the picture and it does not line up in the box.
//
// The design's card art is landscape and fills the frame edge to edge. This
// finds the actual object in each square, crops the empty margin away, and
// re-frames it 16:9 so it fills the card.
//
// Nothing is cut off: the crop window is grown to contain the whole object
// before anything is trimmed, and where the window runs past the edge of the
// source it is padded with the image's own background colour rather than
// clipping the subject. Cropping the SUBJECT is what had to be reverted before.
//
//   node scripts/crop-tiles.mjs            write landscape versions
//   node scripts/crop-tiles.mjs --check    report only, change nothing
// ---------------------------------------------------------------------------

import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join("public", "assets", "tiles");
const OUT = path.join("public", "assets", "tiles", "wide");
const CHECK = process.argv.includes("--check");

const TARGET_W = 512;
const TARGET_H = 288; // 16:9
const ASPECT = TARGET_W / TARGET_H;

/** Bounding box of everything meaningfully brighter than the backdrop. */
async function contentBox(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // The backdrop is near-black; sample the corners to learn how near.
  const corners = [0, (width - 1) * channels, (height - 1) * width * channels, (height * width - 1) * channels];
  let base = 0;
  for (const c of corners) base += (data[c] + data[c + 1] + data[c + 2]) / 3;
  base /= corners.length;
  const threshold = base + 26;

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if ((data[i] + data[i + 1] + data[i + 2]) / 3 > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1, width, height, base };
  return { minX, minY, maxX, maxY, width, height, base };
}

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".webp"));
let done = 0;

for (const f of files) {
  const src = path.join(SRC, f);
  const box = await contentBox(src);
  const cw = box.maxX - box.minX + 1;
  const ch = box.maxY - box.minY + 1;

  // A window that holds the whole object with a little breathing room, then
  // widened or heightened to 16:9 — never tightened onto the subject.
  let winH = Math.round(ch * 1.18);
  let winW = Math.round(winH * ASPECT);
  if (winW < cw * 1.1) {
    winW = Math.round(cw * 1.1);
    winH = Math.round(winW / ASPECT);
  }

  const cx = Math.round((box.minX + box.maxX) / 2);
  const cy = Math.round((box.minY + box.maxY) / 2);

  // Pad first so the window can sit anywhere without clipping, then extract.
  const padX = Math.max(0, Math.ceil(winW / 2 + Math.abs(cx - box.width / 2)));
  const padY = Math.max(0, Math.ceil(winH / 2 + Math.abs(cy - box.height / 2)));
  const bg = Math.round(box.base);

  const fill = { r: bg, g: Math.round(bg * 0.92), b: Math.round(bg * 0.92) };
  const padded = await sharp(src)
    .removeAlpha()
    .extend({ top: padY, bottom: padY, left: padX, right: padX, background: fill })
    .toBuffer();

  const left = Math.max(0, cx + padX - Math.round(winW / 2));
  const top = Math.max(0, cy + padY - Math.round(winH / 2));

  const out = await sharp(padded)
    .extract({ left, top, width: winW, height: winH })
    .resize(TARGET_W, TARGET_H, { fit: "fill" })
    .webp({ quality: 82 })
    .toBuffer();

  const fillPct = Math.round(((cw * ch) / (winW * winH)) * 100);
  console.log(
    `  ${f.replace(/\.webp$/, "").padEnd(22)} object ${String(cw).padStart(3)}x${String(ch).padEnd(3)}` +
      ` -> window ${winW}x${winH}  subject fills ${String(fillPct).padStart(2)}%`,
  );

  if (!CHECK) {
    writeFileSync(path.join(OUT, f), out);
    done++;
  }
}

console.log(CHECK ? `\nchecked ${files.length} tiles (nothing written)` : `\nwrote ${done} landscape tiles to ${OUT}`);
