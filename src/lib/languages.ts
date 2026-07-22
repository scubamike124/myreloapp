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

export function getLanguage(code: string | undefined | null): Language {
  return (code && BY_CODE.get(code)) || BY_CODE.get(DEFAULT_LANGUAGE)!;
}

/** Right-to-left scripts, so generated pages can be laid out correctly. */
const RTL = new Set(["ar", "he", "ur"]);

export function isRTL(code: string): boolean {
  return RTL.has(code);
}
