/**
 * Reading a country out of a browser locale.
 *
 * The bug this guards against produced no error and no wrong answer — it
 * produced a MISSING one. `locale.split("-")[1]` returns the script subtag for
 * a tag like "zh-Hans-CN", the two-letter check downstream rejected "Hans", and
 * the country line was simply left out of the prompt. Amber then answered
 * "what's trending" with US defaults for a user in China, and the caption
 * writer searched with no region at all. Both look like working features.
 *
 * So the cases below are mostly locales that a real browser really does report
 * and that the old code really did drop. A test that only checked "en-AU" would
 * have passed against the broken version.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  describeRegion,
  isRegionCode,
  normalizeRegion,
  regionDisplayName,
  regionFromLocale,
} from "../locale-region.ts";

test("regionFromLocale", async (t) => {
  await t.test("reads the region from a plain language-region tag", () => {
    assert.equal(regionFromLocale("en-AU"), "AU");
    assert.equal(regionFromLocale("pt-BR"), "BR");
    assert.equal(regionFromLocale("fr-CA"), "CA");
  });

  await t.test("skips the script subtag instead of mistaking it for the region", () => {
    // Every one of these returned the script ("Hans"/"Hant"/"Latn"/"Arab")
    // before, which then failed validation and was dropped.
    assert.equal(regionFromLocale("zh-Hans-CN"), "CN");
    assert.equal(regionFromLocale("zh-Hant-TW"), "TW");
    assert.equal(regionFromLocale("sr-Latn-RS"), "RS");
    assert.equal(regionFromLocale("uz-Latn-UZ"), "UZ");
    assert.equal(regionFromLocale("az-Latn-AZ"), "AZ");
    assert.equal(regionFromLocale("pa-Arab-PK"), "PK");
  });

  await t.test("keeps UN M.49 numeric regions, which are not two letters", () => {
    // es-419 is a standard browser locale, not an exotic one.
    assert.equal(regionFromLocale("es-419"), "419");
  });

  await t.test("canonicalises case", () => {
    assert.equal(regionFromLocale("en-us"), "US");
    assert.equal(regionFromLocale("EN-US"), "US");
  });

  await t.test("looks past extensions and variants to find the region", () => {
    assert.equal(regionFromLocale("de-DE-u-ca-gregory"), "DE");
    assert.equal(regionFromLocale("sr-Latn-RS-u-nu-latn"), "RS");
    assert.equal(regionFromLocale("de-DE-1996"), "DE");
  });

  await t.test("recovers tags that Intl.Locale refuses outright", () => {
    // Intl.Locale throws a RangeError on both of these; the hand-rolled scan is
    // what keeps them readable rather than letting the whole signal vanish.
    assert.equal(regionFromLocale("zh-yue-HK"), "HK");
    assert.equal(regionFromLocale("en_AU"), "AU");
  });

  await t.test("never invents a region for a tag that has none", () => {
    assert.equal(regionFromLocale("en"), undefined);
    assert.equal(regionFromLocale("zh-Hans"), undefined);
    // A private-use subtag is not a region, and nothing after a singleton is.
    assert.equal(regionFromLocale("en-x-custom"), undefined);
  });

  await t.test("degrades to undefined rather than throwing on junk", () => {
    for (const junk of ["", "   ", "!!bad!!", "-", "----", undefined, null]) {
      assert.equal(regionFromLocale(junk as string | undefined), undefined, `junk: ${junk}`);
    }
  });
});

test("normalizeRegion accepts only real region codes", () => {
  assert.equal(normalizeRegion("au"), "AU");
  assert.equal(normalizeRegion(" US "), "US");
  assert.equal(normalizeRegion("419"), "419");
  assert.equal(normalizeRegion("Hans"), undefined);
  assert.equal(normalizeRegion("U"), undefined);
  assert.equal(normalizeRegion(""), undefined);
  assert.equal(normalizeRegion(undefined), undefined);
  assert.equal(normalizeRegion(null), undefined);
});

test("isRegionCode agrees with normalizeRegion", () => {
  for (const v of ["AU", "au", "419", "Hans", "", "U", 7, null]) {
    assert.equal(isRegionCode(v), normalizeRegion(v as string) !== undefined, `value: ${String(v)}`);
  }
});

test("regionDisplayName", async (t) => {
  await t.test("names a region so the model can search for the place", () => {
    assert.equal(regionDisplayName("AU"), "Australia");
    assert.equal(regionDisplayName("cn"), "China");
    assert.equal(regionDisplayName("419"), "Latin America");
  });

  await t.test("falls back to the code when Intl has no name for it", () => {
    // "XX" is what Cloudflare puts in cf-ipcountry when it cannot place the
    // client; it is a well-formed region code with no name, and must not turn
    // into "Unknown Region". "T1" (their Tor marker) is malformed enough that
    // Intl.DisplayNames.of throws on it — normalizeRegion already rejects that
    // one, so this is the guard holding rather than a path we expect to hit.
    assert.equal(regionDisplayName("XX"), "XX");
    assert.equal(regionDisplayName("T1"), "T1");
  });
});

test("describeRegion pairs the name with the raw code, without doubling it up", () => {
  assert.equal(describeRegion("AU"), "Australia (AU)");
  assert.equal(describeRegion("419"), "Latin America (419)");
  // No name available means no "XX (XX)".
  assert.equal(describeRegion("XX"), "XX");
});

test("a locale reaches a named country end to end", () => {
  // The whole point: this chain used to break in the middle for these users.
  for (const [locale, expected] of [
    ["zh-Hans-CN", "China (CN)"],
    ["zh-Hant-TW", "Taiwan (TW)"],
    ["es-419", "Latin America (419)"],
    ["en-AU", "Australia (AU)"],
  ] as const) {
    const code = regionFromLocale(locale);
    assert.ok(code, `${locale} produced no region`);
    assert.equal(describeRegion(code), expected);
  }
});
