// ---------------------------------------------------------------------------
// Avatar taxonomy.
//
// Designed for a catalog that will eventually be tens of thousands of avatars,
// from more than one provider.
//
// Three levels, deliberately separate:
//
//   PRIMARY   — who or what the avatar IS. How people browse. One per avatar.
//               "Healthcare", "Dragons", "Fruit".
//   SECONDARY — other groups it legitimately belongs to. Many per avatar.
//               A doctor is also a Business Professional.
//   TAGS      — everything else you might filter by: setting, attire, pose,
//               mood, colour. Free-form, many per avatar. "hospital",
//               "medical coat", "standing", "friendly".
//
// One avatar therefore appears in several places without ever being duplicated.
//
// Nothing here stores a count. Counts are computed from the live catalog, so
// they cannot drift from reality.
// ---------------------------------------------------------------------------

export type Group = { slug: string; name: string; icon: string; description: string; children: Primary[] };
export type Primary = {
  slug: string;
  name: string;
  icon: string;
  /** Matched against avatar name when an avatar has no explicit primary. */
  keywords: string[];
};

/**
 * The browse taxonomy. Groups are the top level of navigation; primaries are
 * what a user actually clicks. Anything with no avatars yet stays hidden until
 * it has some — the structure is here so it fills in on its own.
 */
export const GROUPS: Group[] = [
  {
    slug: "professions",
    name: "Professions & Industries",
    icon: "💼",
    description: "Real-world jobs and the people who do them.",
    children: [
      { slug: "business", name: "Business & Professionals", icon: "💼", keywords: ["business", "suit", "blazer", "office", "corporate", "executive", "professional", "formal", "lobby"] },
      { slug: "healthcare", name: "Healthcare", icon: "🏥", keywords: ["doctor", "nurse", "medical", "scrub", "dentist", "surgeon", "hospital", "clinic", "physician", "therapist", "pharmac"] },
      { slug: "construction", name: "Construction & Contractors", icon: "👷", keywords: ["construction", "contractor", "hard hat", "hardhat", "builder", "site", "hi-vis", "foreman"] },
      { slug: "hvac", name: "HVAC", icon: "❄️", keywords: ["hvac", "air conditioning", "heating", "ventilation", "furnace"] },
      { slug: "plumbing", name: "Plumbing", icon: "🔧", keywords: ["plumber", "plumbing", "pipefitter"] },
      { slug: "electrical", name: "Electrical", icon: "⚡", keywords: ["electrician", "electrical", "lineman"] },
      { slug: "roofing", name: "Roofing", icon: "🏠", keywords: ["roofer", "roofing"] },
      { slug: "carpentry", name: "Carpentry", icon: "🪚", keywords: ["carpenter", "carpentry", "woodwork", "joiner"] },
      { slug: "restaurants", name: "Restaurants", icon: "🍽️", keywords: ["chef", "waiter", "waitress", "restaurant", "kitchen", "cook", "barista", "bartender"] },
      { slug: "hospitality", name: "Hospitality", icon: "🛎️", keywords: ["hotel", "hospitality", "concierge", "receptionist", "housekeep"] },
      { slug: "retail", name: "Retail", icon: "🛍", keywords: ["retail", "shop", "store", "cashier", "merchandis", "boutique"] },
      { slug: "education", name: "Education", icon: "🎓", keywords: ["teacher", "education", "school", "professor", "student", "classroom", "training", "tutor", "university"] },
      { slug: "technology", name: "Technology", icon: "🧑‍💻", keywords: ["developer", "tech", "coder", "programmer", "laptop", "macbook", "ipad", "computer", "startup", "it "] },
      { slug: "finance", name: "Finance", icon: "💰", keywords: ["banker", "finance", "accountant", "bank", "financial", "trader"] },
      { slug: "insurance", name: "Insurance", icon: "📋", keywords: ["insurance", "underwriter", "claims", "actuary"] },
      { slug: "legal", name: "Legal", icon: "⚖️", keywords: ["lawyer", "attorney", "judge", "legal", "court", "barrister", "solicitor"] },
      { slug: "real-estate", name: "Real Estate", icon: "🏘️", keywords: ["real estate", "realtor", "property", "realty", "estate agent"] },
      { slug: "automotive", name: "Automotive", icon: "🚗", keywords: ["mechanic", "automotive", "garage", "dealership", "car sales"] },
      { slug: "manufacturing", name: "Manufacturing", icon: "🏭", keywords: ["factory", "manufactur", "warehouse", "assembly", "machinist", "welder"] },
      { slug: "agriculture", name: "Agriculture", icon: "🌾", keywords: ["farmer", "agricultur", "farm", "rancher", "harvest"] },
      { slug: "beauty", name: "Beauty & Salon", icon: "💄", keywords: ["salon", "beauty", "makeup", "stylist", "spa", "barber", "cosmet", "hairdress"] },
      { slug: "fitness", name: "Fitness", icon: "🏋️", keywords: ["yoga", "fitness", "gym", "sport", "trainer", "athlete", "workout", "coach"] },
      { slug: "travel", name: "Travel", icon: "✈️", keywords: ["pilot", "flight", "travel", "tourism", "airline", "cabin crew", "tour guide"] },
      { slug: "government", name: "Government", icon: "🏛️", keywords: ["government", "official", "mayor", "politician", "civil service"] },
      { slug: "police", name: "Police", icon: "👮", keywords: ["police", "sheriff", "patrol", "detective", "officer"] },
      { slug: "firefighters", name: "Firefighters", icon: "🚒", keywords: ["firefight", "fireman", "rescue"] },
      { slug: "military", name: "Military", icon: "🪖", keywords: ["military", "soldier", "army", "navy", "marine", "veteran", "air force"] },
      { slug: "scientists", name: "Scientists", icon: "🔬", keywords: ["scientist", "researcher", "laboratory", "chemist", "biologist"] },
      { slug: "engineers", name: "Engineers", icon: "📐", keywords: ["engineer", "engineering"] },
      { slug: "customer-service", name: "Customer Service", icon: "🎧", keywords: ["customer service", "support agent", "call centre", "call center", "helpdesk"] },
      { slug: "sales", name: "Sales", icon: "📈", keywords: ["sales", "salesperson", "account manager"] },
      { slug: "news-media", name: "News & Media", icon: "📰", keywords: ["news", "anchor", "reporter", "journalist", "presenter", "broadcast"] },
    ],
  },
  {
    slug: "people",
    name: "People & Life Stages",
    icon: "👨‍👩‍👧",
    description: "Everyday people, by who they are rather than what they do.",
    children: [
      { slug: "children", name: "Children", icon: "👶", keywords: ["child", "kid ", "toddler", "boy ", "girl "] },
      { slug: "teens", name: "Teens", icon: "🧑", keywords: ["teen", "teenager", "youth"] },
      { slug: "families", name: "Families", icon: "👨‍👩‍👧", keywords: ["family", "mother", "father", "parent", "mom ", "dad "] },
      { slug: "seniors", name: "Seniors", icon: "👵", keywords: ["senior", "elder", "grandma", "grandpa", "grandmother", "grandfather"] },
    ],
  },
  {
    slug: "characters",
    name: "Characters",
    icon: "🧙",
    description: "Heroes, villains and everything invented.",
    children: [
      { slug: "superheroes", name: "Superheroes", icon: "🦸", keywords: ["superhero", "super hero", "caped"] },
      { slug: "villains", name: "Villains", icon: "😈", keywords: ["villain", "supervillain", "evil"] },
      { slug: "fantasy", name: "Fantasy", icon: "🧝", keywords: ["fantasy", "elf", "fairy", "sorcer", "mythical"] },
      { slug: "wizards", name: "Wizards & Witches", icon: "🧙", keywords: ["wizard", "witch", "mage", "warlock", "sorceress"] },
      { slug: "warriors", name: "Warriors & Warlords", icon: "⚔️", keywords: ["warlord", "warrior", "knight", "viking", "samurai", "gladiator", "barbarian"] },
      { slug: "pirates", name: "Pirates", icon: "🏴‍☠️", keywords: ["pirate", "buccaneer", "corsair"] },
      { slug: "cowboys", name: "Cowboys", icon: "🤠", keywords: ["cowboy", "cowgirl", "western", "sheriff"] },
      { slug: "royalty", name: "Kings, Queens & Royalty", icon: "👑", keywords: ["king", "queen", "princess", "prince", "royal", "crown"] },
      { slug: "aliens", name: "Aliens", icon: "👽", keywords: ["alien", "extraterrestrial", "martian"] },
      { slug: "robots", name: "Robots", icon: "🤖", keywords: ["robot", "cyborg", "android", "mech"] },
      { slug: "monsters", name: "Monsters & Undead", icon: "🧟", keywords: ["monster", "zombie", "vampire", "ghost", "werewolf", "mummy", "goblin", "orc", "troll"] },
      { slug: "dragons", name: "Dragons", icon: "🐉", keywords: ["dragon", "wyvern", "drake"] },
      { slug: "mermaids", name: "Mermaids", icon: "🧜", keywords: ["mermaid", "merman", "siren"] },
      { slug: "anime", name: "Anime & Cartoon", icon: "🎌", keywords: ["anime", "manga", "cartoon", "toon"] },
      { slug: "historical", name: "Historical Characters", icon: "📜", keywords: ["historical", "victorian", "medieval", "renaissance", "roman", "egyptian", "pharaoh"] },
    ],
  },
  {
    slug: "animals",
    name: "Animals & Creatures",
    icon: "🐶",
    description: "Non-human avatars, from pets to prehistoric.",
    children: [
      { slug: "animals", name: "Animals", icon: "🐾", keywords: ["animal"] },
      { slug: "dogs", name: "Dogs", icon: "🐶", keywords: ["dog", "puppy", "retriever", "terrier", "husky"] },
      { slug: "cats", name: "Cats", icon: "🐱", keywords: ["cat", "kitten", "tabby"] },
      { slug: "birds", name: "Birds", icon: "🐦", keywords: ["bird", "owl", "eagle", "parrot", "rooster", "penguin"] },
      { slug: "farm-animals", name: "Farm Animals", icon: "🐄", keywords: ["cow", "farm", "pig", "sheep", "goat", "horse", "rooster"] },
      { slug: "ocean-animals", name: "Ocean Animals", icon: "🐬", keywords: ["dolphin", "shark", "whale", "octopus", "turtle", "fish", "ocean"] },
      { slug: "jungle-animals", name: "Jungle Animals", icon: "🦁", keywords: ["lion", "tiger", "monkey", "elephant", "giraffe", "jungle", "bear", "fox"] },
      { slug: "dinosaurs", name: "Dinosaurs", icon: "🦕", keywords: ["dinosaur", "t-rex", "raptor", "triceratops"] },
      { slug: "fantasy-animals", name: "Fantasy Animals", icon: "🦄", keywords: ["unicorn", "phoenix", "griffin", "pegasus"] },
    ],
  },
  {
    slug: "food",
    name: "Food & Drink",
    icon: "🍎",
    description: "Edible characters for food, retail and health brands.",
    children: [
      { slug: "fruit", name: "Fruit", icon: "🍎", keywords: ["apple", "banana", "orange", "strawberry", "watermelon", "pineapple", "grape", "lemon", "peach", "cherry", "mango", "avocado", "fruit"] },
      { slug: "vegetables", name: "Vegetables", icon: "🥕", keywords: ["carrot", "broccoli", "tomato", "corn", "potato", "pepper", "eggplant", "mushroom", "pumpkin", "onion", "vegetable"] },
      { slug: "prepared-food", name: "Prepared Food", icon: "🍕", keywords: ["pizza", "burger", "hamburger", "fries", "hot dog", "sandwich", "taco"] },
      { slug: "desserts", name: "Desserts & Sweets", icon: "🍦", keywords: ["ice cream", "cake", "donut", "candy", "dessert", "cookie", "chocolate"] },
      { slug: "drinks", name: "Drinks", icon: "☕", keywords: ["coffee", "tea", "juice", "smoothie", "drink", "soda"] },
      { slug: "bakery", name: "Bakery", icon: "🥐", keywords: ["bread", "bakery", "croissant", "baker", "pastry"] },
    ],
  },
  {
    slug: "vehicles",
    name: "Vehicles",
    icon: "🚗",
    description: "Vehicles with faces, for transport and trade brands.",
    children: [
      { slug: "cars", name: "Cars", icon: "🚗", keywords: ["car", "sedan", "sports car"] },
      { slug: "trucks", name: "Trucks", icon: "🚚", keywords: ["truck", "lorry", "pickup", "semi"] },
      { slug: "motorcycles", name: "Motorcycles", icon: "🏍️", keywords: ["motorcycle", "motorbike", "scooter"] },
      { slug: "boats", name: "Boats", icon: "⛵", keywords: ["boat", "ship", "yacht", "sailboat"] },
      { slug: "airplanes", name: "Airplanes", icon: "✈️", keywords: ["airplane", "aeroplane", "jet", "helicopter"] },
      { slug: "construction-equipment", name: "Construction Equipment", icon: "🚜", keywords: ["excavator", "bulldozer", "digger", "crane", "forklift"] },
      { slug: "farm-equipment", name: "Farm Equipment", icon: "🚜", keywords: ["tractor", "combine", "harvester"] },
      { slug: "emergency-vehicles", name: "Emergency Vehicles", icon: "🚑", keywords: ["ambulance", "fire truck", "police car", "emergency"] },
    ],
  },
  {
    slug: "holiday",
    name: "Holidays & Occasions",
    icon: "🎄",
    description: "Seasonal characters for time-limited campaigns.",
    children: [
      { slug: "christmas", name: "Christmas", icon: "🎄", keywords: ["santa", "christmas", "elf", "reindeer", "snowman"] },
      { slug: "halloween", name: "Halloween", icon: "🎃", keywords: ["halloween", "pumpkin", "ghost", "witch", "zombie", "vampire"] },
      { slug: "valentines", name: "Valentine's Day", icon: "💝", keywords: ["valentine", "cupid", "heart"] },
      { slug: "thanksgiving", name: "Thanksgiving", icon: "🦃", keywords: ["thanksgiving", "turkey"] },
      { slug: "easter", name: "Easter", icon: "🐰", keywords: ["easter", "bunny", "egg"] },
      { slug: "new-year", name: "New Year's", icon: "🎆", keywords: ["new year", "fireworks", "countdown"] },
      { slug: "wedding", name: "Wedding", icon: "💒", keywords: ["wedding", "bride", "groom", "marriage"] },
      { slug: "birthday", name: "Birthday", icon: "🎂", keywords: ["birthday", "party"] },
      { slug: "graduation", name: "Graduation", icon: "🎓", keywords: ["graduation", "graduate", "diploma"] },
    ],
  },
  {
    slug: "mascots",
    name: "Mascots",
    icon: "🎭",
    description: "Brand, sports and school mascots.",
    children: [
      { slug: "sports-mascots", name: "Sports Mascots", icon: "🏆", keywords: ["sports mascot", "team mascot"] },
      { slug: "business-mascots", name: "Business Mascots", icon: "🏢", keywords: ["business mascot", "brand mascot", "corporate mascot"] },
      { slug: "school-mascots", name: "School Mascots", icon: "🏫", keywords: ["school mascot", "college mascot"] },
      { slug: "mascots", name: "Mascots", icon: "🎭", keywords: ["mascot"] },
    ],
  },
];

/**
 * SECONDARY categories — kept from the previous library, demoted as requested.
 * These describe setting, attire and framing rather than who someone is, so
 * they are filters rather than the way people browse.
 */
export const FILTERS: Primary[] = [
  { slug: "lounge", name: "Sofa & Lounge", icon: "🛋️", keywords: ["sofa", "lounge", "couch", "armchair", "sitting"] },
  { slug: "casual", name: "Casual & Everyday", icon: "👕", keywords: ["casual", "sweater", "t-shirt", "tshirt", "hoodie", "jeans", "polo", "denim"] },
  { slug: "outdoor", name: "Outdoor", icon: "🌳", keywords: ["outdoor", "outside", "park", "street", "garden", "beach"] },
  { slug: "office", name: "Office", icon: "🏢", keywords: ["office", "desk", "lobby", "meeting", "boardroom"] },
  { slug: "standing", name: "Standing", icon: "🧍", keywords: ["standing", "stand"] },
  { slug: "seated", name: "Seated", icon: "🪑", keywords: ["sitting", "seated", "sofa", "chair"] },
  { slug: "formal", name: "Formal Wear", icon: "🤵", keywords: ["suit", "blazer", "tie", "formal", "dress"] },
  { slug: "uniform", name: "Uniform", icon: "🥼", keywords: ["uniform", "scrub", "coat", "vest", "apron"] },
];

export const ALL_PRIMARIES: Primary[] = GROUPS.flatMap((g) => g.children);

const PRIMARY_BY_SLUG = new Map(ALL_PRIMARIES.map((p) => [p.slug, p]));
const FILTER_BY_SLUG = new Map(FILTERS.map((f) => [f.slug, f]));
const GROUP_BY_SLUG = new Map(GROUPS.map((g) => [g.slug, g]));

export function getPrimary(slug: string) {
  return PRIMARY_BY_SLUG.get(slug);
}
export function getFilter(slug: string) {
  return FILTER_BY_SLUG.get(slug);
}
export function getGroup(slug: string) {
  return GROUP_BY_SLUG.get(slug);
}

/** A catalog record, from any provider. */
export type CatalogAvatar = {
  avatarId: string;
  name: string;
  gender: string;
  premium: boolean;
  image: string;
  video: string;
  /** "heygen" drives AI Avatar Studio; "reelo" images drive Talking Photo. */
  source?: string;
  /** Explicit classification, when the record carries one. */
  primary?: string;
  secondary?: string[];
  tags?: string[];
};

/**
 * Keyword matchers, compiled once and anchored to word boundaries.
 *
 * Plain substring matching put 61 avatars in "Cars" because "car" appears
 * inside Carlotta and Caroline, and 15 in "Cats" via Catherine. A catalog that
 * files a woman named Caroline under Vehicles is not a professional library,
 * so every keyword must match a whole word (or the start of a hyphenated one).
 */
const MATCHERS = new Map<string, RegExp>();

function matcherFor(keyword: string): RegExp {
  let re = MATCHERS.get(keyword);
  if (!re) {
    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // \b on both ends, but allow a trailing plural or -ing/-er form.
    re = new RegExp(`\\b${escaped}(?:s|es|ing|er)?\\b`, "i");
    MATCHERS.set(keyword, re);
  }
  return re;
}

function nameMatches(name: string, keywords: string[]): boolean {
  return keywords.some((k) => matcherFor(k).test(name));
}

/**
 * Every primary category an avatar belongs to. An explicit `primary`/`secondary`
 * on the record wins; otherwise the name is matched against keywords. Multiple
 * categories per avatar is the point — one doctor is also a professional.
 */
export function primariesFor(avatar: CatalogAvatar): string[] {
  // An explicit classification is authoritative — never second-guess it with
  // keywords, or "Hot Dog" ends up filed under Dogs. Inference exists only for
  // provider records (HeyGen) that carry no categories of their own.
  if (avatar.primary) {
    return [...new Set([avatar.primary, ...(avatar.secondary ?? [])])];
  }

  const out = new Set<string>();
  const haystack = `${avatar.name} ${(avatar.tags ?? []).join(" ")}`.toLowerCase();
  for (const p of ALL_PRIMARIES) {
    if (nameMatches(haystack, p.keywords)) out.add(p.slug);
  }
  return [...out];
}

/** Filter slugs (setting, attire, pose) that apply to an avatar. */
export function filtersFor(avatar: CatalogAvatar): string[] {
  const haystack = `${avatar.name} ${(avatar.tags ?? []).join(" ")}`.toLowerCase();
  return FILTERS.filter((f) => nameMatches(haystack, f.keywords)).map((f) => f.slug);
}

export function inPrimary(avatar: CatalogAvatar, slug: string): boolean {
  // Same rule as primariesFor: explicit wins outright.
  if (avatar.primary) {
    return avatar.primary === slug || (avatar.secondary ?? []).includes(slug);
  }
  const p = PRIMARY_BY_SLUG.get(slug);
  if (!p) return false;
  return nameMatches(`${avatar.name} ${(avatar.tags ?? []).join(" ")}`.toLowerCase(), p.keywords);
}

export function inFilter(avatar: CatalogAvatar, slug: string): boolean {
  const f = FILTER_BY_SLUG.get(slug);
  if (!f) return false;
  return nameMatches(`${avatar.name} ${(avatar.tags ?? []).join(" ")}`.toLowerCase(), f.keywords);
}

/**
 * Live counts per primary category. Single pass over the catalog, so this stays
 * cheap as the library grows. No count is ever stored.
 */
export function primaryCounts(list: CatalogAvatar[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of ALL_PRIMARIES) counts.set(p.slug, 0);
  for (const a of list) {
    for (const slug of primariesFor(a)) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}

export function groupCounts(list: CatalogAvatar[]): Map<string, number> {
  const per = primaryCounts(list);
  const out = new Map<string, number>();
  for (const g of GROUPS) {
    // Avatars can sit in several children; count distinct avatars per group.
    out.set(g.slug, g.children.reduce((n, c) => n + (per.get(c.slug) ?? 0), 0));
  }
  return out;
}
