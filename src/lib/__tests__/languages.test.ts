/**
 * Locale strings in, supported languages out.
 *
 * `getLanguage` is the one place a language is decided. Every route resolves
 * the caller's code through it and then persists `language.code`, so whatever
 * it returns is both the language the model is told to write in and the
 * language the book is reopened in months later.
 *
 * That makes its failure mode expensive and quiet. It falls back to English on
 * a miss and reports nothing, so a code it merely fails to *recognise* is
 * indistinguishable from a customer who asked for English. The codes in
 * LANGUAGES are bare ISO 639-1 and the strings that reach it are BCP-47 —
 * "es-MX", "pt_BR", "zh-Hans-CN" — so the lookup missed constantly and no test,
 * log, or error surfaced it.
 *
 * These tests are mostly about the shapes that used to miss.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  getLanguage,
  isRTL,
  normalizeLanguageCode,
} from "../languages.ts";

test("every code the picker offers resolves to itself", () => {
  // The dropdown is built from LANGUAGES, so this is the path almost every
  // real request takes. It has to stay exact.
  for (const lang of LANGUAGES) {
    assert.equal(getLanguage(lang.code).code, lang.code);
  }
});

test("a region subtag picks the language, not English", () => {
  // The regression: navigator.language on a Mexican phone is "es-MX", and a
  // Spanish storybook came back written in English.
  assert.equal(getLanguage("es-MX").code, "es");
  assert.equal(getLanguage("pt-BR").code, "pt");
  assert.equal(getLanguage("en-GB").code, "en");
});

test("case and separator are not part of the language", () => {
  assert.equal(getLanguage("ES").code, "es");
  assert.equal(getLanguage("Fr").code, "fr");
  assert.equal(getLanguage("pt_BR").code, "pt");
  assert.equal(getLanguage("  de-AT  ").code, "de");
});

test("a script subtag is dropped along with the region", () => {
  assert.equal(getLanguage("zh-Hans-CN").code, "zh");
  // Routes truncate the submitted code to 8 characters before it gets here,
  // which can leave a trailing separator. That must still resolve.
  assert.equal(getLanguage("zh-Hans-").code, "zh");
});

test("the language is read from the front of the tag, never the region", () => {
  // "en-DE" is an English speaker in Germany. Matching any subtag that happens
  // to name a language would write their book in German.
  assert.equal(getLanguage("en-DE").code, "en");
  assert.equal(getLanguage("de-EN").code, "de");
});

test("anything unrecognisable still falls back to English", () => {
  // Widening the match must not turn junk into a language.
  for (const junk of ["", "   ", "xx", "xx-YY", "-fr", "klingon", null, undefined]) {
    assert.equal(getLanguage(junk).code, DEFAULT_LANGUAGE);
  }
});

test("normalize returns a supported code or nothing at all", () => {
  assert.equal(normalizeLanguageCode("ar-SA"), "ar");
  assert.equal(normalizeLanguageCode("xx-YY"), null);
  // Callers branch on null, so it must never hand back a code that has no
  // entry — that would resolve to English one layer down anyway.
  for (const input of ["es-MX", "ZH-hant", "no", "qq", "", "-", null]) {
    const out = normalizeLanguageCode(input);
    if (out !== null) assert.ok(LANGUAGES.some((l) => l.code === out), `unsupported: ${out}`);
  }
});

test("reading direction survives a full locale tag", () => {
  // isRTL decides PDF layout. An Arabic book stored as "ar-SA" used to lay out
  // left-to-right.
  assert.equal(isRTL("ar-SA"), true);
  assert.equal(isRTL("he-IL"), true);
  assert.equal(isRTL("UR"), true);
  assert.equal(isRTL("es-MX"), false);
  assert.equal(isRTL("en"), false);
  assert.equal(isRTL(""), false);
});

test("the resolved language carries its own endonym", () => {
  // The UI shows the endonym back to the reader; resolving "es-MX" to Spanish
  // is only useful if the rest of the record comes with it.
  const lang = getLanguage("es-MX");
  assert.equal(lang.name, "Spanish");
  assert.equal(lang.endonym, "Español");
});
