// ---------------------------------------------------------------------------
// Storybook themes.
//
// Single source of truth: the picker in the UI and the prompts in the API read
// the same list, so a theme can never appear in one and not the other.
//
// Each theme carries the phrasing the prompts need. Most themes are a role the
// child becomes ("a superhero"), but not all of them read that way — "who
// becomes a fairy tale" is nonsense — so the wording is spelled out per theme
// rather than derived from the label.
// ---------------------------------------------------------------------------

export type StorybookTheme = {
  /** Label shown on the chip, and the value stored/sent to the API. */
  label: string;
  /** Completes "Hero: <name>, who becomes ___." */
  becomes: string;
  /** Completes "They are dressed as ___." for the illustrator. */
  costume: string;
};

export const STORYBOOK_THEMES: StorybookTheme[] = [
  { label: "Superhero", becomes: "a superhero", costume: "a superhero, with a bright cape" },
  {
    label: "Princess",
    becomes: "a princess",
    costume: "a princess, in a soft flowing gown with a small delicate crown",
  },
  {
    label: "Fairy Tale",
    becomes: "the hero of a fairy tale, in an enchanted storybook kingdom",
    costume: "a fairy-tale hero, in a woodland cloak with a touch of magic about them",
  },
  { label: "Explorer", becomes: "an explorer", costume: "an explorer, with a sun hat and a small backpack" },
  { label: "Astronaut", becomes: "an astronaut", costume: "an astronaut, in a soft white spacesuit" },
  { label: "Pirate", becomes: "a friendly pirate", costume: "a friendly pirate, with a feathered hat" },
  { label: "Knight", becomes: "a brave knight", costume: "a brave knight, in gentle silver armour" },
  { label: "Wizard", becomes: "a wizard", costume: "a wizard, in a starry robe and pointed hat" },
  { label: "Detective", becomes: "a detective", costume: "a detective, in a little coat with a magnifying glass" },
  {
    label: "Animal friend",
    becomes: "a friend to the animals",
    costume: "an animal friend, in cosy woodland clothes",
  },
];

export const THEME_LABELS: string[] = STORYBOOK_THEMES.map((t) => t.label);

export const DEFAULT_THEME = STORYBOOK_THEMES[0].label;

/**
 * Resolve a theme by label. Falls back to a sensible generic phrasing for a
 * value that isn't in the list, so an old client sending a retired theme still
 * produces a readable book rather than broken prompt text.
 */
export function resolveTheme(label: string): StorybookTheme {
  const found = STORYBOOK_THEMES.find((t) => t.label.toLowerCase() === label.trim().toLowerCase());
  if (found) return found;
  const safe = label.trim().toLowerCase() || DEFAULT_THEME.toLowerCase();
  return { label, becomes: `a ${safe}`, costume: `a ${safe}` };
}
