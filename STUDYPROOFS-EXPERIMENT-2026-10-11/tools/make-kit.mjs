#!/usr/bin/env node
/**
 * Makes the launch kit's text from the reviewed demonstrations: per demonstration, a caption for each short-video platform, a Story line, a
 * pin, a one-line community post; and one Pinterest bulk-upload CSV for all of them.
 *
 *   node make-kit.mjs <demosDir> <outDir> [--site https://hq.amberoneai.com]
 *
 * <demosDir> holds one folder per demonstration, each with selection.json (written by render-demo.mjs) and the images it rendered. Nothing is
 * invented here: the numbers and the card used in a caption come from selection.json; the words around them are the fixed copy below, written
 * to the owner's rules (no unlimited recording, no predicted exam questions, no guaranteed grades, no comparison with another product, no
 * testimonials, a plain disclosure that AI can make mistakes and that StudyProofs made the post).
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const SITE = flag("--site", "https://hq.amberoneai.com").replace(/\/$/, "");
const [demosDir, outDir] = args;
if (!demosDir || !outDir) {
  console.error("usage: make-kit.mjs <demosDir> <outDir> [--site url]");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const META = JSON.parse(fs.readFileSync(path.join(demosDir, "meta.json"), "utf8")); // { [slug]: { title, course } }
const slugs = fs.readdirSync(demosDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const link = (slug, src) => `${SITE}/studyproofs/examples/${slug}?src=${src}&campaign=${slug}`;
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;

const BANNED = [/unlimited/i, /predict(ed|s|ion)?\b.*\b(exam|test|question)/i, /guarantee/i, /\bgpa\b/i, /turbo/i, /testimonial/i, /\bA\+?\b grade/i];
const guard = (label, text) => {
  for (const re of BANNED) if (re.test(text)) throw new Error(`${label} breaks a copy rule (${re}): ${text}`);
  return text;
};

const rows = [];
const lines = [`# Launch kit: text for each demonstration (generated ${new Date().toISOString().slice(0, 10)}; do not edit the numbers)`, ""];
for (const slug of slugs) {
  const sel = JSON.parse(fs.readFileSync(path.join(demosDir, slug, "selection.json"), "utf8"));
  const { title, course } = META[slug];
  const n = sel.counts;
  const card = sel.cards[0];
  const hook = `${course} notes in, flashcards and a quiz out`;
  const disclosure = "Made by StudyProofs. AI can make mistakes, so check the cards against your notes.";
  const tiktok = guard("TikTok caption", `${hook}. Sample notes we wrote → ${n.flashcards} flashcards and ${n.quiz} quiz questions from StudyProofs, each with the line it came from. ${disclosure} Free to try, link in bio. #studytok #flashcards #studytips #college`);
  const reel = guard("Reel caption", `${hook}. We wrote these sample notes and StudyProofs made the flashcards and the quiz, each one with the line of the notes it came from. ${disclosure} Free to start: link in bio. #flashcards #studytips #college #studygram`);
  const shortsTitle = guard("Shorts title", clip(`${title}: notes in, flashcards and a quiz out`, 95));
  const shortsDesc = guard("Shorts description", `Sample ${course} notes we wrote, turned into ${n.flashcards} flashcards and ${n.quiz} quiz questions by StudyProofs, each with the line it came from. ${disclosure} Try it free: ${link(slug, "youtube")}`);
  const story = guard("Story text", `Try it with your own notes (free to start)`);
  const pinTitle = guard("Pin title", clip(`${course} notes → flashcards and a quiz (sample)`, 95));
  const pinDesc = guard("Pin description", `Sample ${course} notes we wrote, turned into flashcards and a quiz by StudyProofs, each with the line of the notes it came from. ${disclosure} Free to try.`);
  // An example a person changed after review (example.json `edits`) is never called unedited: the post says what was changed and that the page shows the original.
  const examplePath = path.join(demosDir, slug, "example.json");
  const edits = fs.existsSync(examplePath) ? (JSON.parse(fs.readFileSync(examplePath, "utf8")).edits ?? []) : [];
  const shown = edits.length ? "shown as the product made it, except one quiz question a person reworded (the page says which, and shows the original)" : "shown unedited";
  const community = guard("Community post", `We made a free tool that turns your own notes into flashcards and a quiz and, where it can, shows the line each one came from. Here is a sample from ${course} notes we wrote, ${shown}: ${link(slug, "community")} . It makes mistakes sometimes, so check it against your notes. (We make it; delete this if posts like this are not allowed here.)`);
  if (edits.length && /unedited/i.test(community)) throw new Error(`${slug}: an edited example must not be called unedited`);
  const alt = guard("Alt text", `StudyProofs demonstration: ${course} sample notes become flashcards and a quiz. Example prompt: ${card.front}`);
  rows.push([pinTitle, `${SITE}/studyproofs/examples/${slug}/pin-1000x1500.png`, "StudyProofs: study tools", "", pinDesc, link(slug, "pinterest"), "", `${course},flashcards,study tips,${title}`]);
  lines.push(`## ${title} (${course}): ${n.flashcards} flashcards, ${n.quiz} quiz questions`, "");
  lines.push(`Files: \`${slug}/demo-1080x1920.mp4\` (vertical video, silent, ${Math.round(sel.seconds)} s), \`${slug}/feed-1080x1350.png\`, \`${slug}/pin-1000x1500.png\`, \`${slug}/preview-1200x630.png\`.`, "");
  lines.push("**TikTok** (turn on *Disclose commercial content* then *Your brand*): " + tiktok, "");
  lines.push("**Instagram Reel**: " + reel, "", `**Instagram Story** (link sticker to ${link(slug, "instagram")}): ${story}`, "");
  lines.push(`**YouTube Short** title: ${shortsTitle}`, "", `Description: ${shortsDesc}`, "");
  lines.push(`**Pinterest pin** (also in \`pinterest-bulk.csv\`): ${pinTitle}. ${pinDesc}`, "");
  lines.push("**One post in a community that allows it** (only after reading its rules; once; no direct messages): " + community, "");
  lines.push(`**Image alt text**: ${alt}`, "");
  lines.push(`**Bio links** (one per platform so each is counted on its own): ${SITE}/studyproofs/examples?src=tiktok-bio, ${SITE}/studyproofs/examples?src=instagram-bio, ${SITE}/studyproofs/examples?src=youtube-about`, "");
}
fs.writeFileSync(path.join(outDir, "KIT-TEXT.md"), lines.join("\n"));
fs.writeFileSync(path.join(outDir, "pinterest-bulk.csv"), ["Title,Media URL,Pinterest board,Thumbnail,Description,Link,Publish date,Keywords", ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n");
console.log(`wrote KIT-TEXT.md and pinterest-bulk.csv for ${slugs.length} demonstration(s) in ${outDir}`);
