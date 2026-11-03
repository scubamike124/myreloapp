// ---------------------------------------------------------------------------
// Languages available for generated content.
//
// One list, shared by every feature that produces text — storybooks, scripts,
// captions — so a language added here appears everywhere at once rather than
// being re-declared per tool.
//
// English is the default and is deliberately first.
//
// NOTE: this governs the language of GENERATED CONTENT. Translating the app's
// own interface is a separate, much larger piece of work (every string in every
// component, plus routing); this is the foundation it would build on.
// ---------------------------------------------------------------------------

export type Language = { code: string; name: string; endonym: string };

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", endonym: "English" },
  { code: "es", name: "Spanish", endonym: "Español" },
  { code: "fr", name: "French", endonym: "Français" },
  { code: "de", name: "German", endonym: "Deutsch" },
  { code: "pt", name: "Portuguese", endonym: "Português" },
  { code: "it", name: "Italian", endonym: "Italiano" },
  { code: "nl", name: "Dutch", endonym: "Nederlands" },
  { code: "pl", name: "Polish", endonym: "Polski" },
  { code: "ru", name: "Russian", endonym: "Русский" },
  { code: "tr", name: "Turkish", endonym: "Türkçe" },
  { code: "ar", name: "Arabic", endonym: "العربية" },
  { code: "he", name: "Hebrew", endonym: "עברית" },
  { code: "hi", name: "Hindi", endonym: "हिन्दी" },
  { code: "bn", name: "Bengali", endonym: "বাংলা" },
  { code: "ur", name: "Urdu", endonym: "اردو" },
  { code: "zh", name: "Chinese", endonym: "中文" },
  { code: "ja", name: "Japanese", endonym: "日本語" },
  { code: "ko", name: "Korean", endonym: "한국어" },
  { code: "vi", name: "Vietnamese", endonym: "Tiếng Việt" },
  { code: "th", name: "Thai", endonym: "ไทย" },
  { code: "id", name: "Indonesian", endonym: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", endonym: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", endonym: "Filipino" },
  { code: "sw", name: "Swahili", endonym: "Kiswahili" },
  { code: "uk", name: "Ukrainian", endonym: "Українська" },
  { code: "el", name: "Greek", endonym: "Ελληνικά" },
  { code: "sv", name: "Swedish", endonym: "Svenska" },
  { code: "no", name: "Norwegian", endonym: "Norsk" },
  { code: "da", name: "Danish", endonym: "Dansk" },
  { code: "fi", name: "Finnish", endonym: "Suomi" },
  { code: "cs", name: "Czech", endonym: "Čeština" },
  { code: "ro", name: "Romanian", endonym: "Română" },
  { code: "hu", name: "Hungarian", endonym: "Magyar" },
];

export const DEFAULT_LANGUAGE = "en";

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

/**
 * Resolve a real-world locale string to one of the codes above, or null.
 *
 * The codes in LANGUAGES are bare ISO 639-1, but almost nothing hands us one.
 * Browsers report `navigator.language` as BCP-47 — "es-MX", "pt-BR",
 * "zh-Hans-CN" — some platforms use an underscore, and casing is not
 * guaranteed. Matching those against the map verbatim fails, and because
 * getLanguage falls back to English on a miss it fails silently: a Mexican
 * reader asking for "es-MX" got a storybook written in English, and an Arabic
 * book reopened as "ar-SA" laid its PDF out left-to-right.
 *
 * So normalize before looking up: casefold, accept `_` for `-`, then fall back
 * to the primary subtag. Region and script are dropped rather than matched
 * because the list is per-language, not per-locale — "pt" is the entry that
 * serves "pt-BR" and "pt-PT" alike.
 */
export function normalizeLanguageCode(code: string | undefined | null): string | null {
  if (typeof code !== "string") return null;
  const cleaned = code.trim().toLowerCase().replace(/_/g, "-");
  if (BY_CODE.has(cleaned)) return cleaned;
  const primary = cleaned.split("-")[0];
  return primary && BY_CODE.has(primary) ? primary : null;
}

export function getLanguage(code: string | undefined | null): Language {
  const resolved = normalizeLanguageCode(code);
  return BY_CODE.get(resolved ?? DEFAULT_LANGUAGE) ?? BY_CODE.get(DEFAULT_LANGUAGE)!;
}

/** Right-to-left scripts, so generated pages can be laid out correctly. */
const RTL = new Set(["ar", "he", "ur"]);

export function isRTL(code: string | undefined | null): boolean {
  const resolved = normalizeLanguageCode(code);
  return resolved !== null && RTL.has(resolved);
}
