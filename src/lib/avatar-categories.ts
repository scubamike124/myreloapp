import snapshot from "@/data/heygen-avatars.json";

// ---------------------------------------------------------------------------
// Avatar categories.
//
// The catalog records carry no category field — only avatarId, name, gender,
// premium, image and video. So categories are DERIVED by matching keywords
// against the avatar name, and every count is computed from the live catalog
// at request time. No count is ever written down here; add or remove avatars
// and the numbers move on their own.
//
// Categories with zero matches are hidden by default rather than shown as
// empty shelves. They stay defined so that the day the catalog gains, say,
// fictional characters, that category appears on its own with a real count.
// ---------------------------------------------------------------------------

export type Avatar = {
  avatarId: string;
  name: string;
  gender: string;
  premium: boolean;
  image: string;
  video: string;
};

export const ALL_AVATARS = snapshot as Avatar[];

export type Category = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  /** Lowercase substrings matched against the avatar name. */
  keywords: string[];
};

export const CATEGORIES: Category[] = [
  // --- how this catalog is actually composed ---------------------------------
  {
    slug: "business",
    name: "Business Professionals",
    icon: "💼",
    description: "Suits, blazers and boardrooms — the corporate presenter look.",
    keywords: ["business", "suit", "blazer", "office", "corporate", "executive", "professional", "formal", "tie", "lobby"],
  },
  {
    slug: "casual",
    name: "Casual & Everyday",
    icon: "👕",
    description: "Relaxed, approachable presenters in everyday clothes.",
    keywords: ["casual", "sweater", "t-shirt", "tshirt", "hoodie", "jeans", "polo", "denim"],
  },
  {
    slug: "lounge",
    name: "Sofa & Lounge",
    icon: "🛋️",
    description: "Seated, informal settings that suit conversational scripts.",
    keywords: ["sofa", "lounge", "couch", "armchair", "sitting"],
  },
  {
    slug: "outdoor",
    name: "Outdoor",
    icon: "🌳",
    description: "Filmed outside — natural light and open backgrounds.",
    keywords: ["outdoor", "outside", "park", "street", "garden", "beach"],
  },

  // --- occupational -----------------------------------------------------------
  {
    slug: "healthcare",
    name: "Healthcare & Medical",
    icon: "🏥",
    description: "Doctors, nurses and clinical settings.",
    keywords: ["doctor", "nurse", "medical", "scrub", "dentist", "surgeon", "hospital", "clinic", "physician", "therapist", "lab coat", "pharmac"],
  },
  {
    slug: "fitness",
    name: "Fitness & Sports",
    icon: "🏋️",
    description: "Trainers, athletes and wellness presenters.",
    keywords: ["yoga", "fitness", "gym", "sport", "trainer", "athlete", "workout", "coach", "tennis", "soccer", "running"],
  },
  {
    slug: "technology",
    name: "Technology & IT",
    icon: "🧑‍💻",
    description: "Presenters with laptops, tablets and technical settings.",
    keywords: ["developer", "tech", "coder", "programmer", "engineer", "laptop", "macbook", "ipad", "computer", "startup"],
  },
  {
    slug: "education",
    name: "Education",
    icon: "🎓",
    description: "Teachers, trainers and classroom settings.",
    keywords: ["teacher", "education", "school", "professor", "student", "classroom", "training", "lecture", "tutor", "university"],
  },
  {
    slug: "construction",
    name: "Construction & Contractors",
    icon: "👷",
    description: "Trades, site work and high-visibility gear.",
    keywords: ["construction", "contractor", "hard hat", "hardhat", "maintenance", "builder", "worker", "hi-vis", "vest", "plumber", "electrician", "carpenter", "welder", "factory", "warehouse"],
  },
  {
    slug: "hospitality",
    name: "Restaurants & Hospitality",
    icon: "🍽️",
    description: "Chefs, front-of-house and hotel staff.",
    keywords: ["chef", "waiter", "waitress", "barista", "restaurant", "kitchen", "cook", "hotel", "hospitality", "bartender", "cafe"],
  },
  {
    slug: "beauty",
    name: "Beauty & Salon",
    icon: "💄",
    description: "Salon, spa and cosmetics presenters.",
    keywords: ["salon", "beauty", "makeup", "stylist", "spa", "barber", "cosmet", "hairdress"],
  },
  {
    slug: "legal",
    name: "Legal Professionals",
    icon: "⚖️",
    description: "Lawyers, courtrooms and legal settings.",
    keywords: ["lawyer", "attorney", "judge", "legal", "court", "barrister", "solicitor"],
  },
  {
    slug: "seasonal",
    name: "Holiday & Seasonal",
    icon: "🎃",
    description: "Seasonal looks for time-limited campaigns.",
    keywords: ["santa", "christmas", "halloween", "holiday", "easter", "winter hat", "festive"],
  },

  // --- defined but usually empty in this catalog ------------------------------
  // Kept so they light up automatically if the catalog gains these avatars.
  { slug: "real-estate", name: "Real Estate", icon: "🏠", description: "Agents, viewings and property settings.", keywords: ["real estate", "realtor", "property", "realty", "estate agent"] },
  { slug: "automotive", name: "Automotive", icon: "🚗", description: "Mechanics, dealerships and workshops.", keywords: ["mechanic", "automotive", "garage", "dealership", "car sales"] },
  { slug: "finance", name: "Finance & Banking", icon: "💰", description: "Bankers, advisers and financial settings.", keywords: ["banker", "finance", "accountant", "bank", "financial", "adviser", "advisor"] },
  { slug: "retail", name: "Retail & Ecommerce", icon: "🛍", description: "Shop floor, checkout and product presenters.", keywords: ["retail", "shop", "store", "cashier", "ecommerce", "merchandis", "boutique"] },
  { slug: "entertainment", name: "Entertainment", icon: "🎬", description: "Performers, musicians and stage presence.", keywords: ["singer", "musician", "actor", "dancer", "performer", "stage", "band"] },
  { slug: "law-enforcement", name: "Law Enforcement", icon: "👮", description: "Police and security personnel.", keywords: ["police", "sheriff", "patrol", "detective", "security guard"] },
  { slug: "fire-rescue", name: "Fire & Rescue", icon: "🚒", description: "Firefighters, paramedics and emergency response.", keywords: ["firefight", "fireman", "rescue", "paramedic", "ambulance", "emergency"] },
  { slug: "military", name: "Military", icon: "🪖", description: "Service members and uniformed personnel.", keywords: ["military", "soldier", "army", "navy", "marine", "veteran", "air force"] },
  { slug: "travel", name: "Travel & Tourism", icon: "✈️", description: "Pilots, cabin crew and travel guides.", keywords: ["pilot", "flight", "travel", "tourism", "airline", "cabin crew", "tour guide"] },
  { slug: "cultural", name: "Cultural & International", icon: "🌎", description: "Traditional and regional dress from around the world.", keywords: ["traditional", "cultural", "kimono", "saree", "sari", "hanbok", "abaya", "hijab", "kilt", "folk"] },
  { slug: "families", name: "Families", icon: "👨‍👩‍👧", description: "Parents and family groups.", keywords: ["family", "mother", "father", "parent", "mom ", "dad "] },
  { slug: "children", name: "Children", icon: "👶", description: "Younger presenters.", keywords: ["child", "kid ", "boy ", "girl ", "teen", "toddler"] },
  { slug: "seniors", name: "Seniors", icon: "👵", description: "Older presenters.", keywords: ["senior", "elder", "grandma", "grandpa", "grandmother", "grandfather"] },
  { slug: "fictional", name: "Fictional Characters", icon: "🧙", description: "Invented characters and personas.", keywords: ["fictional", "character", "elf", "wizard", "witch", "vampire", "fairy"] },
  { slug: "superheroes", name: "Superheroes", icon: "🦸", description: "Caped, masked and heroic.", keywords: ["superhero", "super hero", "hero", "caped"] },
  { slug: "sci-fi", name: "Robots & Sci-Fi", icon: "🤖", description: "Robots, androids and futuristic looks.", keywords: ["robot", "cyborg", "android", "sci-fi", "scifi", "alien", "futuristic", "cyber"] },
  { slug: "historical", name: "Historical Characters", icon: "👑", description: "Period dress and historical figures.", keywords: ["historical", "viking", "knight", "pirate", "victorian", "medieval", "renaissance", "roman"] },
  { slug: "fantasy", name: "Fantasy Characters", icon: "🎭", description: "Fantasy worlds and mythical figures.", keywords: ["fantasy", "dragon", "mythical", "sorcer", "warrior", "orc"] },
  { slug: "gaming", name: "Gaming Characters", icon: "🎮", description: "Game-style characters and streamers.", keywords: ["gaming", "gamer", "esport", "streamer"] },
  { slug: "animals", name: "Animals & Mascots", icon: "🐶", description: "Animal characters and brand mascots.", keywords: ["animal", "mascot", "dog", "cat ", "bear", "fox", "lion"] },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return BY_SLUG.get(slug);
}

/** Does this avatar belong to the category? Name-keyword match. */
export function matches(avatar: Avatar, category: Category): boolean {
  const name = avatar.name.toLowerCase();
  return category.keywords.some((k) => name.includes(k));
}

export function avatarsIn(slug: string, list: Avatar[] = ALL_AVATARS): Avatar[] {
  const cat = BY_SLUG.get(slug);
  if (!cat) return [];
  return list.filter((a) => matches(a, cat));
}

/**
 * Live counts for every category, computed from the catalog on each call.
 * Nothing here is stored or hardcoded — the numbers follow the data.
 */
export function categoryCounts(list: Avatar[] = ALL_AVATARS): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of CATEGORIES) counts.set(c.slug, 0);
  for (const a of list) {
    const name = a.name.toLowerCase();
    for (const c of CATEGORIES) {
      if (c.keywords.some((k) => name.includes(k))) counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
    }
  }
  return counts;
}

/** Categories that currently contain at least one avatar, largest first. */
export function populatedCategories(list: Avatar[] = ALL_AVATARS): { category: Category; count: number }[] {
  const counts = categoryCounts(list);
  return CATEGORIES.map((category) => ({ category, count: counts.get(category.slug) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Categories defined but currently empty — shown only on request. */
export function emptyCategories(list: Avatar[] = ALL_AVATARS): Category[] {
  const counts = categoryCounts(list);
  return CATEGORIES.filter((c) => (counts.get(c.slug) ?? 0) === 0);
}

/** Avatars matching no category at all, so nothing is unreachable. */
export function uncategorized(list: Avatar[] = ALL_AVATARS): Avatar[] {
  return list.filter((a) => !CATEGORIES.some((c) => matches(a, c)));
}
