/**
 * Storybook PDF export.
 *
 * The "Save as PDF" button called `window.print()`. It promised a file and
 * produced a print job — on a phone, usually just a printer list.
 *
 * The risky part of the replacement is line wrapping, because Reelo writes
 * books in 33 languages. Word wrapping alone is correct for English and wrong
 * for Chinese, Japanese and Thai, which have no spaces: the whole paragraph
 * becomes a single "word" and runs off the page. These tests are mostly about
 * that.
 *
 *   node --experimental-strip-types --test src/lib/__tests__/book-pdf.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { wrapToWidth, pdfFilename } from "../book-pdf.ts";

/**
 * A stand-in for the canvas context: every character is 10 units wide.
 *
 * Deliberately not a real canvas. The algorithm is what can break; the
 * browser's own text measurement is not this project's to test, and needing a
 * DOM to check line breaking would mean nobody ran the test.
 */
const ctx = (charWidth = 10) =>
  ({ measureText: (s: string) => ({ width: Array.from(s).length * charWidth }) }) as unknown as CanvasRenderingContext2D;

test("English wraps on words, not mid-word", () => {
  const lines = wrapToWidth(ctx(), "the quick brown fox jumps over the lazy dog", 100);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(line.length <= 10, `"${line}" is wider than the page`);
  // Words survive intact — the point of word wrapping.
  assert.equal(lines.join(" ").replace(/\s+/g, " "), "the quick brown fox jumps over the lazy dog");
});

test("Chinese wraps by character, because it has no spaces", () => {
  // The case that breaks a word-only wrapper: one token, far wider than the
  // page. Before this, the whole paragraph became a single line running off the
  // edge of the PDF.
  const chinese = "从前有一只小兔子住在森林里她每天都在寻找新的冒险";
  const lines = wrapToWidth(ctx(), chinese, 100);
  assert.ok(lines.length > 1, "Chinese text was not wrapped at all");
  for (const line of lines) assert.ok(Array.from(line).length <= 10, `"${line}" overflows`);
  assert.equal(lines.join(""), chinese, "characters were lost or reordered");
});

test("a single very long word is broken rather than allowed to overflow", () => {
  const lines = wrapToWidth(ctx(), "Donaudampfschifffahrtsgesellschaftskapitaen", 100);
  for (const line of lines) assert.ok(Array.from(line).length <= 10, `"${line}" overflows`);
  assert.equal(lines.join(""), "Donaudampfschifffahrtsgesellschaftskapitaen");
});

test("Arabic text is wrapped without dropping characters", () => {
  // Shaping and direction are the browser's job at draw time; what matters here
  // is that nothing is lost on the way through.
  const arabic = "كان يا ما كان في قديم الزمان أرنب صغير يعيش في الغابة";
  const lines = wrapToWidth(ctx(), arabic, 120);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(" ").replace(/\s+/g, " ").trim(), arabic);
});

test("paragraph breaks are kept as separate lines", () => {
  const lines = wrapToWidth(ctx(), "one\n\ntwo", 1000);
  assert.deepEqual(lines, ["one", "two"]);
});

test("empty and whitespace-only text produce no lines", () => {
  assert.deepEqual(wrapToWidth(ctx(), "", 100), []);
  assert.deepEqual(wrapToWidth(ctx(), "   \n  ", 100), []);
});

test("a page narrower than one character still terminates", () => {
  // Guards the character-splitting loop: with a width smaller than any glyph,
  // the `|| !current` fallback must still consume input rather than spin.
  const lines = wrapToWidth(ctx(), "abc", 1);
  assert.equal(lines.join(""), "abc");
  assert.equal(lines.length, 3);
});

test("the filename is usable, in any script", () => {
  assert.equal(pdfFilename("Luna and the Moon"), "Luna and the Moon.pdf");
  // Characters a filesystem refuses must not reach it.
  assert.equal(pdfFilename('a/b\\c:d*e?f"g<h>i|j'), "a b c d e f g h i j.pdf");
  // A non-Latin title is kept rather than stripped to nothing — the reader
  // should recognise their own book in the downloads folder.
  assert.equal(pdfFilename("月亮和兔子"), "月亮和兔子.pdf");
  assert.equal(pdfFilename(""), "storybook.pdf");
  assert.ok(pdfFilename("x".repeat(500)).length < 70, "filename was not bounded");
});
