/**
 * What a finished story can be delivered as.
 *
 * The directive asks for three choices at checkout — book, movie, bundle — and
 * for the architecture to accept audiobooks, coloring books, activity books and
 * language editions later "without rebuilding". So the products are data rather
 * than branches: adding one is an entry in `STORY_PRODUCTS`, and every screen,
 * price and pipeline step reads from here.
 *
 * ## One story, many products
 *
 * The rule that shapes everything: **generate once, reuse throughout**. A book
 * and a movie of the same adventure must be the same adventure — same plot,
 * same child, same character bible, same names. Generating them separately
 * would produce two stories that merely share a title, which is exactly what a
 * parent buying the bundle would notice first.
 *
 * So a product never carries a story. It declares which *artifacts* it needs
 * from the one story that was already written, and the pipeline produces those
 * artifacts. `requires` is what makes the bundle cheap: the movie needs the
 * script the book already produced.
 */

/** Things the pipeline can produce from a story. Products are built of these. */
// Relative rather than the "@/" alias: the test runner strips types but does
// not resolve tsconfig paths, and a module that cannot be imported by a test is
// a module whose prices nothing can check.
import { FLAT_TOKEN_COST } from "../token-pricing.ts";

export type StoryArtifact =
  | "manuscript"
  | "illustrations"
  | "character_bible"
  | "ebook_layout"
  | "screenplay"
  | "narration_audio"
  | "scene_video"
  | "final_cut"
  /* Declared for products that are not built yet, so the pipeline can already
     reason about them and a future product is a registry entry rather than a
     new concept. */
  | "audiobook_master"
  | "coloring_pages"
  | "activity_sheets";

export type StoryProductId = "ebook" | "movie" | "bundle";

export type StoryProduct = {
  id: StoryProductId;
  /** Shown on the delivery card. */
  name: string;
  emoji: string;
  /** One line under the name. Concrete, not marketing. */
  summary: string;
  /** Bullets on the card, in the order a parent decides in. */
  includes: string[];
  /** Everything this product needs the pipeline to produce. */
  artifacts: StoryArtifact[];
  /**
   * What it costs, in tokens.
   *
   * Read from FLAT_TOKEN_COST rather than written here. That table says of
   * itself "only defined here - never hard-coded in UI", and a price that
   * exists in two places is a price that will eventually disagree with itself
   * on a checkout screen.
   */
  tokens: number;
  /**
   * The action name the charge is booked against.
   *
   * Carried on the product rather than derived from the id, because a charge
   * slug is a thing the pricing table has to know about and a product id is
   * not. Deriving it as `storybook-${id}` would put the two one typo apart,
   * and an unrecognised action does not fail — `costOf` quietly bills a single
   * token, which on the film is a $40 product sold for $10.
   */
  chargeAction: string;
  /**
   * Featured on the selection screen. Exactly one product may be recommended —
   * two recommendations is no recommendation.
   */
  recommended?: boolean;
  /** Present but not orderable yet, and the UI says why rather than hiding it. */
  comingSoon?: boolean;
};

/**
 * Artifacts every story produces regardless of what is bought.
 *
 * The manuscript and the character bible are written before the parent chooses
 * a delivery, because the choice is offered *after* the story exists — that is
 * what lets the bundle reuse rather than regenerate.
 */
export const ALWAYS_PRODUCED: StoryArtifact[] = ["manuscript", "character_bible", "illustrations"];

export const STORY_PRODUCTS: StoryProduct[] = [
  {
    id: "ebook",
    name: "Personalised e-book",
    emoji: "📖",
    summary: "The illustrated story, laid out as a book you can read tonight.",
    includes: [
      "Your child as the hero, on every page",
      "Original illustrations in one consistent style",
      "Professional book layout",
      "Download as a PDF and keep it forever",
    ],
    artifacts: [...ALWAYS_PRODUCED, "ebook_layout"],
    tokens: FLAT_TOKEN_COST["storybook-ebook"],
    chargeAction: "storybook-ebook",
  },
  {
    id: "movie",
    name: "Cinematic movie",
    emoji: "🎬",
    summary: "The same story, animated, narrated and scored.",
    includes: [
      "The same child and the same characters, animated",
      "Narration and an original score",
      "Camera moves, lighting and scene transitions",
      "Reviewed by Amber before it is delivered",
    ],
    artifacts: [...ALWAYS_PRODUCED, "screenplay", "narration_audio", "scene_video", "final_cut"],
    tokens: FLAT_TOKEN_COST["storybook-movie"],
    chargeAction: "storybook-movie",
  },
  {
    id: "bundle",
    name: "Book + movie",
    emoji: "📚✨",
    summary: "Both, from one story — the book to read and the film to watch.",
    includes: [
      "Everything in both, from the same adventure",
      "One story, so the book and the film match exactly",
      "The character bible is reused, not re-drawn",
      "Cheaper than buying the two separately",
    ],
    // The union, deduplicated by `artifactsFor` — the bundle exists precisely
    // because these overlap.
    artifacts: [
      ...ALWAYS_PRODUCED,
      "ebook_layout",
      "screenplay",
      "narration_audio",
      "scene_video",
      "final_cut",
    ],
    tokens: FLAT_TOKEN_COST["storybook-bundle"],
    chargeAction: "storybook-bundle",
    recommended: true,
  },
];

const BY_ID = new Map(STORY_PRODUCTS.map((p) => [p.id, p]));

export function getStoryProduct(id: string): StoryProduct | null {
  return BY_ID.get(id as StoryProductId) ?? null;
}

/** Orderable today. A `comingSoon` product is shown but cannot be bought. */
export function orderableProducts(): StoryProduct[] {
  return STORY_PRODUCTS.filter((p) => !p.comingSoon);
}

/**
 * The artifacts a product needs, deduplicated and in dependency order.
 *
 * Order matters to the pipeline: a screenplay is written from the manuscript,
 * narration is recorded from the screenplay, and the final cut needs the video.
 * Returning them in a fixed order means a caller can run the list straight
 * through without knowing the rules.
 */
export function artifactsFor(id: StoryProductId): StoryArtifact[] {
  const product = BY_ID.get(id);
  if (!product) return [];
  const order: StoryArtifact[] = [
    "manuscript",
    "character_bible",
    "illustrations",
    "ebook_layout",
    "screenplay",
    "narration_audio",
    "scene_video",
    "final_cut",
    "audiobook_master",
    "coloring_pages",
    "activity_sheets",
  ];
  const wanted = new Set(product.artifacts);
  return order.filter((a) => wanted.has(a));
}

/**
 * What the bundle saves by reusing rather than regenerating.
 *
 * Returned as artifact names rather than a price: what a shared artifact is
 * worth is a pricing decision, and this module does not make those.
 */
export function bundleReuses(): StoryArtifact[] {
  const ebook = new Set(artifactsFor("ebook"));
  return artifactsFor("movie").filter((a) => ebook.has(a));
}
