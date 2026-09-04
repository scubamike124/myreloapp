// ---------------------------------------------------------------------------
// Reading the region (country) out of a BCP-47 language tag.
//
// Two places needed this and both did it the same wrong way:
//
//     locale.includes("-") ? locale.split("-")[1] : undefined
//
// That assumes the second subtag is the region. In BCP-47 it is only the region
// when there is no script subtag. For a tag like "zh-Hans-CN" the second subtag
// is the SCRIPT — "Hans" — so the country came out as "Hans", failed the
// two-letter check that follows, and was dropped. Every user on a
// script-bearing locale (zh-Hans-CN, zh-Hant-TW, sr-Latn-RS, uz-Latn-UZ,
// az-Latn-AZ, pa-Arab-PK …) silently lost their location signal, as did
// everyone on a UN M.49 region like "es-419", whose region is three digits
// rather than two letters.
//
// Losing it is not cosmetic. It is the signal Amber uses to answer "what's
// trending" for the user's own country, and the one the caption writer grounds
// its hashtag search on. Without it both quietly fall back to US defaults —
// exactly the outcome the code was written to prevent — and nothing errors, so
// nothing shows that it happened.
//
// This module is deliberately free of "@/" imports so it can be unit-tested
// directly by the type-stripping test runner.
// ---------------------------------------------------------------------------

/**
 * A region subtag is either an ISO-3166-1 alpha-2 code ("AU") or a UN M.49
 * numeric code ("419" = Latin America). Nothing else is a region.
 */
const REGION_CODE = /^(?:[A-Za-z]{2}|[0-9]{3})$/;

/** True when `value` is already a well-formed region code. */
export function isRegionCode(value: unknown): boolean {
  return typeof value === "string" && REGION_CODE.test(value.trim());
}

/** Validate and canonicalise an already-region-shaped string (e.g. an edge header). */
export function normalizeRegion(value?: string | null): string | undefined {
  const code = typeof value === "string" ? value.trim() : "";
  return REGION_CODE.test(code) ? code.toUpperCase() : undefined;
}

/**
 * Walk the tag's subtags and return the first that can only be a region.
 *
 * Used when `Intl.Locale` refuses the tag outright, which happens more often
 * than it sounds: it rejects extlang forms ("zh-yue-HK") and the underscore
 * separator ("en_AU"), both of which are still perfectly readable here.
 */
function scanSubtags(tag: string): string | undefined {
  const parts = tag.split(/[-_]/);
  // parts[0] is the language subtag; the region can never be first.
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]!;
    // A single character starts an extension ("-u-", "-t-") or private use
    // ("-x-"). Everything after it belongs to that extension, not to the tag's
    // core, so a region cannot appear beyond this point.
    if (part.length === 1) break;
    // Four letters is a script ("Hans", "Latn") — the subtag that caused the
    // bug this module exists to fix.
    if (/^[A-Za-z]{4}$/.test(part)) continue;
    if (REGION_CODE.test(part)) return part.toUpperCase();
    // Anything else here is an extlang ("yue") or a variant ("1996", "rozaj").
    // Both may legally precede the region, so keep looking.
  }
  return undefined;
}

/**
 * The region of a BCP-47 tag, or undefined when it carries none.
 *
 * `Intl.Locale` is the authority — it understands subtag order properly. When
 * it parses the tag and reports no region, there genuinely is none; only when
 * it rejects the tag do we fall back to scanning by hand.
 *
 * @returns an upper-cased alpha-2 or three-digit M.49 code, e.g. "CN", "419".
 */
export function regionFromLocale(locale?: string | null): string | undefined {
  const tag = typeof locale === "string" ? locale.trim() : "";
  if (!tag) return undefined;

  try {
    return normalizeRegion(new Intl.Locale(tag).region);
  } catch {
    return scanSubtags(tag);
  }
}

/**
 * A human-readable name for a region code, falling back to the code itself.
 *
 * Two different fallbacks, both real. `Intl.DisplayNames.of` returns the code
 * unchanged for a well-formed but unassigned region — Cloudflare sends "XX" in
 * `cf-ipcountry` when it cannot place the client — and it throws a RangeError
 * outright on anything malformed. Callers here pass codes that
 * `normalizeRegion` has already accepted, so the throw is a guard rather than
 * an expected path; it is kept because this is exported and cheap to make total.
 */
export function regionDisplayName(code: string): string {
  const upper = code.trim().toUpperCase();
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** e.g. "Latin America (419)" — the name a model can use, plus the raw code. */
export function describeRegion(code: string): string {
  const upper = code.trim().toUpperCase();
  const name = regionDisplayName(upper);
  return name === upper ? upper : `${name} (${upper})`;
}
