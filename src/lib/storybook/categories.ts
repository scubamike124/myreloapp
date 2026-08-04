/**
 * The adventures a parent can choose from.
 *
 * The directive names fifteen, and asks to "continue adding more over time" —
 * so this is a list, not a set of branches. Adding the sixteenth is an entry
 * here, and the picker, the writer's guidance and the sequel titles all follow
 * from it.
 *
 * ## Why a category is not the same thing as the theme
 *
 * The storybook already had a "theme" — Superhero, Pirate, Wizard — and the
 * route is explicit about what it does: *"Theme only affects costume/role."*
 * That was right, because the plot came from what the parent typed. A category
 * is the opposite: it shapes the *kind of story*, and it comes with the arc,
 * the cast and the sequel titles that make a series.
 *
 * Both are kept. A parent who types "a story about my daughter losing her first
 * tooth" and picks Princess should get a story about a tooth, with a crown in
 * it. Collapsing the two would take the plot away from them, which the existing
 * code goes to some trouble to prevent.
 *
 * ## Guidance is written as instruction, not as description
 *
 * Each category's `guidance` goes straight into the story prompt. It says what
 * to do rather than what the category is, because the model is being directed
 * rather than informed — "give her a problem only kindness solves" produces a
 * story; "princess stories are about kindness" produces a paragraph about
 * princess stories.
 */

export type StoryCategory = {
  id: string;
  name: string;
  emoji: string;
  /** One line under the name in the picker. */
  blurb: string;
  /** Handed to the story writer. Instructions, not description. */
  guidance: string;
  /**
   * Sequel titles for this category, in order.
   *
   * The directive gives the shape: "Princess Adventure — The Lost Crown, The
   * Crystal Castle, Dragon Mountain, Royal Rescue." They are offered as the
   * next episode's title so a series feels planned rather than accumulated,
   * and a parent can ignore them.
   */
  seriesTitles: string[];
};

export const STORY_CATEGORIES: StoryCategory[] = [
  {
    id: "princess",
    name: "Princess",
    emoji: "👑",
    blurb: "Crowns, castles, and a kingdom that needs her.",
    guidance:
      "A royal setting with a real problem in it. The hero solves it with cleverness or kindness rather than by being rescued, and never by being the prettiest.",
    seriesTitles: ["The Lost Crown", "The Crystal Castle", "Dragon Mountain", "Royal Rescue"],
  },
  {
    id: "superhero",
    name: "Superhero",
    emoji: "🦸",
    blurb: "A power to discover, and someone who needs it.",
    guidance:
      "The hero discovers or uses a power. The power is never the answer on its own — the moment that resolves the story is a choice, not a punch.",
    seriesTitles: ["Origin Story", "The Secret Powers", "Saving the City", "Battle Against Darkness"],
  },
  {
    id: "space",
    name: "Space Explorer",
    emoji: "🚀",
    blurb: "Rockets, planets, and something nobody has seen before.",
    guidance:
      "A journey to somewhere genuinely strange. Include one real, correct fact about space that a child could repeat afterwards.",
    seriesTitles: ["First Launch", "The Red Planet", "Beyond the Rings", "The Signal from Home"],
  },
  {
    id: "dinosaur",
    name: "Dinosaur Adventure",
    emoji: "🦖",
    blurb: "Enormous friends, and a very long time ago.",
    guidance:
      "Name the dinosaurs correctly and get their size and diet right. Big does not mean frightening — the largest character should be gentle.",
    seriesTitles: ["The Egg in the Ferns", "Valley of Giants", "The Long Migration", "When the Sky Went Dark"],
  },
  {
    id: "pirate",
    name: "Pirate Adventure",
    emoji: "🏴‍☠️",
    blurb: "A ship, a map, and an island on it.",
    guidance:
      "A voyage with a map and a destination. The treasure turns out to be worth less than what the crew did to reach it, and say so without stating the moral outright.",
    seriesTitles: ["The Torn Map", "Storm at Sea", "The Island of Bells", "The Captain's Promise"],
  },
  {
    id: "fairy",
    name: "Fairy Adventure",
    emoji: "🧚",
    blurb: "Small wings, tall grass, and a world underfoot.",
    guidance:
      "Everything is scaled to a fairy: a puddle is a lake, a robin is enormous. The smallness is the source of both the trouble and the solution.",
    seriesTitles: ["The First Flight", "The Dewdrop Thief", "Winter Under the Roots", "The Fairy Council"],
  },
  {
    id: "unicorn",
    name: "Unicorn Adventure",
    emoji: "🦄",
    blurb: "A friend with a horn, and a meadow worth saving.",
    guidance:
      "A friendship story first. The magic is quiet and specific — one thing it can do — rather than able to fix anything the plot needs fixing.",
    seriesTitles: ["The Meadow of Light", "The Colour That Vanished", "Across the Rainbow Bridge", "The Last Silver Horn"],
  },
  {
    id: "mermaid",
    name: "Mermaid Adventure",
    emoji: "🧜",
    blurb: "Down where the light goes green.",
    guidance:
      "Underwater, with real sea creatures behaving as they really do. Include one thing about the ocean that is true and worth knowing.",
    seriesTitles: ["The Shell That Sang", "The Sunken City", "The Tide Pool Rescue", "Where the Whales Go"],
  },
  {
    id: "dragon",
    name: "Dragon Adventure",
    emoji: "🐉",
    blurb: "Enormous, misunderstood, and possibly a friend.",
    guidance:
      "The dragon is misjudged before it is met. The story turns on someone deciding to find out rather than assume.",
    seriesTitles: ["The Cave on the Cliff", "The Dragon's Egg", "The Fire That Would Not Light", "Friend of the Mountain"],
  },
  {
    id: "wizard",
    name: "Wizard Adventure",
    emoji: "🧙",
    blurb: "A spell, and everything that goes wrong with it.",
    guidance:
      "A spell goes wrong in a way the hero must undo. The fix requires understanding the mistake rather than casting something bigger.",
    seriesTitles: ["The First Spell", "The Backwards Day", "The Tower of Books", "The Wizard's Test"],
  },
  {
    id: "jungle",
    name: "Jungle Adventure",
    emoji: "🦁",
    blurb: "Green everywhere, and something moving in it.",
    guidance:
      "Real animals in a real habitat, each behaving as its species does. The hero is a visitor in someone else's home and behaves accordingly.",
    seriesTitles: ["Into the Green", "The River Crossing", "The Night Sounds", "The Way Back"],
  },
  {
    id: "detective",
    name: "Detective Mystery",
    emoji: "🕵️",
    blurb: "Something is missing, and the clues are all there.",
    guidance:
      "Plant every clue in view before the solution, so a child could solve it on a second reading. Nothing is explained by information the reader never had.",
    seriesTitles: ["The Missing Lunchbox", "The Footprints in the Flour", "The Case of the Silent Bell", "The Last Clue"],
  },
  {
    id: "wild-west",
    name: "Wild West Adventure",
    emoji: "🤠",
    blurb: "Big skies, a horse, and a long ride.",
    guidance:
      "Horses, canyons and small towns. No guns and no fighting — the problems are weather, distance, animals and getting people to agree.",
    seriesTitles: ["The Runaway Foal", "Canyon Crossing", "The Town with No Water", "The Long Ride Home"],
  },
  {
    id: "race-car",
    name: "Race Car Adventure",
    emoji: "🏎️",
    blurb: "Fast, loud, and won by more than speed.",
    guidance:
      "A race with a real obstacle. Winning depends on preparation, help, or a decision to stop and help someone — never on being fastest alone.",
    seriesTitles: ["The First Race", "The Broken Wheel", "The Night Rally", "The Champion's Choice"],
  },
  {
    id: "winter-kingdom",
    name: "Magical Winter Kingdom",
    emoji: "❄️",
    blurb: "Snow that does not melt, and a kingdom under it.",
    guidance:
      "Cold, bright and quiet. Snow and ice behave magically but consistently — establish a rule early and keep it.",
    seriesTitles: ["The Frozen Gate", "The Snow That Fell Upwards", "The Ice Palace", "The Thaw"],
  },
];

/**
 * Occasions rather than genres.
 *
 * The directive asks for these to be supported "automatically", and for parents
 * to "generate new adventures every year using the same child" — so they are
 * offered when they are relevant rather than buried in a list of twenty-two
 * choices in March.
 *
 * A seasonal story is not a category. It layers onto one: a Christmas Princess
 * story is a princess story that happens at Christmas, and treating it as its
 * own category would mean writing fifteen Christmas variants.
 */
export type SeasonalStory = {
  id: string;
  name: string;
  emoji: string;
  guidance: string;
  /**
   * Months (1–12) when this is offered, or `undefined` for always.
   *
   * Summer and the school year are northern-hemisphere dates. Stated rather
   * than hidden, and `inSeason` takes a hemisphere so the southern edition is a
   * caller's argument rather than a rewrite.
   */
  months?: number[];
  /** Months shift by six in the south; occasions on fixed dates do not. */
  hemisphereSensitive?: boolean;
};

export const SEASONAL_STORIES: SeasonalStory[] = [
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    guidance:
      "Set at Christmas. Keep it about anticipation, giving and family rather than about presents received, and do not assume a particular family shape.",
    months: [11, 12],
  },
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    guidance:
      "Set at Halloween. Spooky in the way a costume is spooky — pumpkins, dressing up, dark gardens. Nothing that would keep a child awake.",
    months: [10],
  },
  {
    id: "birthday",
    name: "Birthday",
    emoji: "🎂",
    guidance:
      "The hero's birthday. The day does not go to plan and turns out better for it. Never state the child's age unless the parent gave it.",
    // No months: a birthday is an occasion, not a season, and it is somebody's
    // birthday every day of the year.
  },
  {
    id: "easter",
    name: "Easter",
    emoji: "🐣",
    guidance: "Set at Easter. Spring, eggs, new animals and something hidden to find. Keep it secular unless asked.",
    months: [3, 4],
  },
  {
    id: "summer",
    name: "Summer Vacation",
    emoji: "🏖️",
    guidance:
      "The long holiday. Somewhere new — a beach, a campsite, a grandparent's house — and a whole day to fill.",
    months: [6, 7, 8],
    hemisphereSensitive: true,
  },
  {
    id: "back-to-school",
    name: "Back to School",
    emoji: "🎒",
    guidance:
      "The first day back. Nervousness that turns into something good. Name the worry honestly before resolving it.",
    months: [8, 9],
    hemisphereSensitive: true,
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💌",
    guidance:
      "About affection of any kind — a friend, a sibling, a grandparent, a pet. Not romance. Somebody makes something for somebody else.",
    months: [2],
  },
];

const CATEGORY_BY_ID = new Map(STORY_CATEGORIES.map((c) => [c.id, c]));
const SEASONAL_BY_ID = new Map(SEASONAL_STORIES.map((s) => [s.id, s]));

export function getCategory(id: string): StoryCategory | null {
  return CATEGORY_BY_ID.get(id) ?? null;
}

export function getSeasonal(id: string): SeasonalStory | null {
  return SEASONAL_BY_ID.get(id) ?? null;
}

/** Six months apart, so the south gets summer stories in January. */
function shiftMonth(month: number): number {
  return ((month + 5) % 12) + 1;
}

export function inSeason(
  seasonal: SeasonalStory,
  date: Date,
  hemisphere: "north" | "south" = "north",
): boolean {
  if (!seasonal.months) return true;
  const month = date.getUTCMonth() + 1;
  const months =
    hemisphere === "south" && seasonal.hemisphereSensitive ? seasonal.months.map(shiftMonth) : seasonal.months;
  return months.includes(month);
}

/** What to offer today, most seasonal first. */
export function seasonalNow(date: Date, hemisphere: "north" | "south" = "north"): SeasonalStory[] {
  return SEASONAL_STORIES.filter((s) => inSeason(s, date, hemisphere));
}

/**
 * The category and occasion, folded into one instruction for the writer.
 *
 * Returned as a string rather than applied here, because this module does not
 * know how the prompt is assembled — and the prompt builder is the thing that
 * is unit-tested for keeping the parent's request authoritative.
 */
export function categoryGuidance(categoryId: string, seasonalId?: string): string {
  const category = getCategory(categoryId);
  const seasonal = seasonalId ? getSeasonal(seasonalId) : null;
  if (!category && !seasonal) return "";

  const parts: string[] = [];
  if (category) parts.push(`Adventure type: ${category.name}. ${category.guidance}`);
  if (seasonal) parts.push(`Occasion: ${seasonal.name}. ${seasonal.guidance}`);
  // The parent's own request still outranks all of this; the prompt builder
  // puts it above, and this line stops the model resolving the tie the other way.
  parts.push("This shapes the setting and the kind of story. It does not replace what the parent asked for.");
  return parts.join("\n");
}

/** The suggested title for the next episode of a series in this category. */
export function suggestedTitle(categoryId: string, episode: number): string {
  const category = getCategory(categoryId);
  if (!category || category.seriesTitles.length === 0) return "";
  return category.seriesTitles[(episode - 1) % category.seriesTitles.length];
}
