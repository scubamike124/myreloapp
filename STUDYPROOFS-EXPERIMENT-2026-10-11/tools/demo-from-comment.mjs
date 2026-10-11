#!/usr/bin/env node
/**
 * Turns the worker's demonstration comment on #105 (marker <!-- amber-studyproofs-demo:<slug> -->) into the JSON that render-demo.mjs reads and
 * that examples/<slug>.json holds. Nothing in the study tools is changed: the comment's JSON is passed through, and the sample notes' text is
 * added from sample-notes.ts (the comment leaves it out because it is in the repository).
 *
 *   node demo-from-comment.mjs <comment-body.txt> <path/to/sample-notes.ts> <out.json> [--example <out-example.json>]
 *
 * <out.json> gets { slug, title, course, sampleVersion, packVersion, generatedAt, model, sampleText, material } (render-demo.mjs's input).
 * --example writes the same without sampleText: the file examples.ts registers.
 * Refuses (exit 1) when the comment is not a demonstration comment, its JSON is damaged, the sample version differs from sample-notes.ts, or the
 * slug is unknown, so a stale or damaged result is never rendered.
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const exampleIdx = args.indexOf("--example");
let examplePath = null;
if (exampleIdx >= 0) {
  examplePath = args[exampleIdx + 1];
  args.splice(exampleIdx, 2);
}
const [commentPath, notesPath, outPath] = args;
if (!commentPath || !notesPath || !outPath) {
  console.error("usage: demo-from-comment.mjs <comment-body.txt> <sample-notes.ts> <out.json> [--example <out-example.json>]");
  process.exit(2);
}
const fail = (msg) => {
  console.error(`refused: ${msg}`);
  process.exit(1);
};

const body = fs.readFileSync(commentPath, "utf8");
if (!/<!-- amber-studyproofs-demo:[a-z0-9-]+ -->/.test(body)) fail("this is not a StudyProofs demonstration comment (no marker)");
const m = /```json\n([\s\S]*?)\n```/.exec(body);
if (!m) fail("no JSON block in the comment");
let demo;
try {
  demo = JSON.parse(m[1]);
} catch (e) {
  fail(`the JSON block does not parse (${e.message})`);
}
for (const k of ["slug", "title", "course", "sampleVersion", "packVersion", "generatedAt", "model", "material"]) if (demo[k] === undefined) fail(`the JSON lacks "${k}"`);
if (!Array.isArray(demo.material?.flashcards) || !Array.isArray(demo.material?.quiz) || !Array.isArray(demo.material?.notes)) fail("the material lacks notes, flashcards or quiz lists");

const notes = fs.readFileSync(notesPath, "utf8");
const version = /SAMPLE_NOTES_VERSION\s*=\s*"([^"]+)"/.exec(notes)?.[1];
if (!version) fail("could not read SAMPLE_NOTES_VERSION from sample-notes.ts");
if (demo.sampleVersion !== version) fail(`the demonstration was made from sample version ${demo.sampleVersion}, the file says ${version}`);
const block = new RegExp(`slug:\\s*"${demo.slug.replace(/[^a-z0-9-]/g, "")}",[\\s\\S]*?text:\\s*\`([\\s\\S]*?)\`,?\\s*\\}`).exec(notes);
if (!block) fail(`no sample notes named ${demo.slug}`);

const withText = { slug: demo.slug, title: demo.title, course: demo.course, sampleVersion: demo.sampleVersion, packVersion: demo.packVersion, generatedAt: demo.generatedAt, model: demo.model, sampleText: block[1], material: demo.material };
fs.writeFileSync(outPath, JSON.stringify(withText, null, 2) + "\n");
if (examplePath) {
  const { sampleText, ...example } = withText;
  void sampleText;
  fs.writeFileSync(examplePath, JSON.stringify(example, null, 2) + "\n");
}
const n = demo.material;
console.log(`wrote ${outPath}${examplePath ? ` and ${examplePath}` : ""}: ${demo.slug}, ${n.flashcards.length} flashcards, ${n.quiz.length} quiz questions, ${n.notes.length} note sections, made ${demo.generatedAt} (pipeline ${demo.packVersion}, sample ${demo.sampleVersion})`);
