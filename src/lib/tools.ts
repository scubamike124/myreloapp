import type { IconKey } from "@/components/design/BIcon";
import { creditLabel } from "@/lib/token-costs";
import { LANGUAGES } from "@/lib/languages";

/** Clip length requested by the Veo route; shown so the card cannot claim 10s. */
const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 8);

export type Field =
  | { kind: "url" | "text"; name: string; label: string; placeholder: string; hint?: string }
  | { kind: "textarea"; name: string; label: string; placeholder: string; hint?: string }
  | { kind: "upload"; name: string; label: string; hint?: string }
  | { kind: "select"; name: string; label: string; options: string[] }
  | { kind: "slider"; name: string; label: string; min: number; max: number; step: number; default: number; unit?: string }
  | { kind: "segment"; name: string; label: string; options: string[] }
  | { kind: "multi"; name: string; label: string; options: string[] }
  | { kind: "choices"; name: string; label: string; options: { label: string; value: string; img?: string; icon?: string }[] };

export type Tool = {
  slug: string;
  title: string;
  tagline: string;
  icon: IconKey;
  poster: string;
  credits: string;
  cta: string;
  fields: Field[];
};

// "Clone my voice" removed until a real clone upload/flow exists — it was a dead option.
const VOICES = ["Natural (Female)", "Natural (Male)", "Warm (Female)", "Deep (Male)", "Confident (Female)"];
/** Same catalog as storybooks / shorts — generated speech & copy honor this list. */
const LANGS = LANGUAGES.map((l) => l.name);

export const TOOLS: Tool[] = [
  {
    slug: "bedtime-storybook", title: "Storybook", tagline: "An illustrated picture book starring your photo subject.", icon: "doc", poster: "/assets/storybook.webp", credits: creditLabel("bedtime-storybook"), cta: "Make the book",
    // StoryBook renders its own interface; these fields describe the tool for
    // the Create page and for Amber, so both stay in step with what it needs.
    fields: [
      { kind: "upload", name: "photo", label: "Photo of the main character", hint: "JPG or PNG under ~8MB. Large photos are auto-shrunk." },
      { kind: "text", name: "characterName", label: "Character's name", placeholder: "Alex" },
      { kind: "textarea", name: "idea", label: "What should the story be about?", placeholder: "An older gentleman looking for a kind companion…" },
      { kind: "select", name: "theme", label: "They become a… (costume / role)", options: ["Superhero", "Explorer", "Astronaut", "Pirate", "Knight", "Wizard", "Detective", "Animal friend"] },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "talking-photo", title: "Talking Photo", tagline: "Make any photo speak naturally.", icon: "mic", poster: "/assets/talking-selfie.jpg", credits: creditLabel("talking-photo"), cta: "Generate talking video",
    fields: [
      { kind: "upload", name: "photo", label: "Upload a photo", hint: "JPG or PNG from your phone works best. HEIC/Live Photos often fail — convert to JPG in Photos first. Large images are auto-shrunk." },
      { kind: "textarea", name: "script", label: "What should they say?", placeholder: "Hey everyone! Today I want to show you something incredible…" },
      { kind: "select", name: "voice", label: "Voice", options: VOICES },
      { kind: "select", name: "language", label: "Spoken language", options: LANGS },
    ],
  },
  {
    slug: "dancing-photo", title: "Dancing Photo", tagline: "Bring any photo to life with dance.", icon: "sparkle", poster: "/assets/dancing.jpg", credits: creditLabel("dancing-photo", `max ${VIDEO_SECONDS}s`), cta: "Make it dance",
    fields: [
      { kind: "upload", name: "photo", label: "Upload a photo", hint: "JPG or PNG under ~8MB — full or upper body. Large photos are auto-shrunk." },
      { kind: "choices", name: "move", label: "Pick a move", options: [
        { label: "Hip Shake", value: "hip", icon: "💃" }, { label: "Moonwalk", value: "moon", icon: "🕺" }, { label: "Robot", value: "robot", icon: "🤖" },
        { label: "Spin", value: "spin", icon: "🌀" }, { label: "Twerk", value: "twerk", icon: "🍑" }, { label: "Jump", value: "jump", icon: "⚡" },
      ] },
      { kind: "select", name: "music", label: "Music", options: ["Upbeat", "Hip-Hop", "Pop", "EDM", "Afrobeat"] },
    ],
  },
  {
    slug: "ai-avatar-studio", title: "AI Avatar Studio", tagline: "Website or message + avatar or your photo → talking video.", icon: "users", poster: "/assets/spokesperson.jpg", credits: creditLabel("ai-avatar-studio"), cta: "Generate avatar video",
    fields: [
      { kind: "url", name: "url", label: "Website URL (optional)", placeholder: "https://yourbrand.com" },
      { kind: "choices", name: "avatar", label: "Choose an avatar", options: [
        { label: "Ava", value: "ava", img: "/assets/talking-selfie.jpg" }, { label: "Leo", value: "leo", img: "/assets/spokesperson.jpg" },
        { label: "Nina", value: "nina", img: "/assets/avatar-business.jpg" }, { label: "Maya", value: "maya", img: "/assets/talking-photo.jpg" },
      ] },
      { kind: "textarea", name: "script", label: "Script", placeholder: "Introducing the easiest way to create videos that convert…" },
      { kind: "select", name: "voice", label: "Voice", options: VOICES },
      { kind: "select", name: "language", label: "Spoken language", options: LANGS },
    ],
  },
  {
    slug: "custom-avatar-creator", title: "Custom Avatar Creator", tagline: "Turn your photo into a reusable avatar.", icon: "magic", poster: "/assets/Custom Avatar Creator.png", credits: creditLabel("custom-avatar-creator"), cta: "Create avatar",
    fields: [
      { kind: "upload", name: "photo", label: "Upload your photo", hint: "JPG or PNG under ~8MB. Large photos are auto-shrunk before upload." },
      { kind: "text", name: "name", label: "Avatar name", placeholder: "e.g. Brand Spokesperson" },
      { kind: "select", name: "style", label: "Style", options: ["3D Character", "Cartoon", "Anime", "Realistic Studio", "Cinematic"] },
    ],
  },
  {
    slug: "website-commercial", title: "Website Commercial", tagline: "Paste a URL. Get up to 20 video ideas and a cinematic ad — pick your avatar.", icon: "film", poster: "/assets/website commershial.png", credits: creditLabel("website-commercial"), cta: "Generate commercial",
    fields: [
      { kind: "url", name: "url", label: "Website URL", placeholder: "https://yourbrand.com", hint: "We scrape copy, colors, and product shots." },
      { kind: "slider", name: "ideaCount", label: "How many video ideas (up to 20)", min: 5, max: 20, step: 5, default: 10 },
      { kind: "select", name: "tone", label: "Style", options: ["Cinematic", "Energetic", "Luxury", "Playful", "Minimal"] },
      { kind: "select", name: "ratio", label: "Aspect ratio", options: ["9:16 (Vertical)", "1:1 (Square)", "16:9 (Wide)"] },
      { kind: "slider", name: "duration", label: "Duration (max 30s)", min: 15, max: 30, step: 15, default: 30, unit: "s" },
    ],
  },
  {
    slug: "shorts-20", title: "Shorts Generator", tagline: "Up to 20 shorts — choose text scripts or video handoff.", icon: "grid", poster: "/assets/shorts.jpg", credits: creditLabel("shorts-20"), cta: "Generate shorts",
    fields: [
      { kind: "segment", name: "source", label: "Source", options: ["Website", "Prompt"] },
      { kind: "segment", name: "output", label: "Output", options: ["Text scripts", "Video handoff"] },
      { kind: "url", name: "url", label: "Website URL", placeholder: "https://yourbrand.com" },
      { kind: "textarea", name: "prompt", label: "Topic or prompt", placeholder: "e.g. healthy meal-prep tips for busy parents" },
      { kind: "slider", name: "count", label: "How many shorts (up to 20)", min: 5, max: 20, step: 5, default: 10 },
      { kind: "select", name: "platform", label: "Platform", options: ["TikTok", "Reels", "Shorts", "All of them"] },
      { kind: "select", name: "tone", label: "Tone", options: ["Punchy", "Educational", "Funny", "Inspirational"] },
    ],
  },
  {
    slug: "product-commercial", title: "Product Commercial", tagline: "Your product photo, animated into a cinematic ad.", icon: "rocket", poster: "/assets/product.jpg", credits: creditLabel("product-commercial"), cta: "Generate product video",
    fields: [
      { kind: "upload", name: "image", label: "Upload product image", hint: "Or paste a product URL below." },
      { kind: "url", name: "url", label: "Product URL (optional)", placeholder: "https://store.com/product" },
      { kind: "select", name: "look", label: "Look", options: ["Studio", "Lifestyle", "Outdoor", "Neon", "Marble & Gold"] },
      { kind: "select", name: "music", label: "Music", options: ["Upbeat", "Ambient", "Luxury", "Energetic"] },
    ],
  },
  {
    slug: "story-memory-generator", title: "Story & Memory Generator", tagline: "Your own photos, cut into one memory film you can keep.", icon: "sparkle", poster: "/assets/dancing-grandpa.jpg", credits: creditLabel("story-memory-generator"), cta: "Make the film",
    fields: [
      { kind: "choices", name: "type", label: "Story type", options: [
        { label: "Family", value: "family", icon: "👨‍👩‍👧" }, { label: "Pet", value: "pet", icon: "🐶" }, { label: "Fantasy", value: "fantasy", icon: "🐉" },
        { label: "Anime", value: "anime", icon: "🌸" }, { label: "Kids", value: "kids", icon: "🧸" }, { label: "Tribute", value: "tribute", icon: "🕊️" },
        { label: "Wedding", value: "wedding", icon: "💍" }, { label: "Vacation", value: "vacation", icon: "🏝️" },
      ] },
      { kind: "upload", name: "photos", label: "Add photos", hint: "We weave them into the story." },
      { kind: "textarea", name: "prompt", label: "Story details", placeholder: "Our trip to the mountains last summer with grandpa…" },
      { kind: "select", name: "voice", label: "Narration voice", options: ["Warm (Female)", "Warm (Male)", "Cinematic", "Storyteller"] },
    ],
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// ---------------------------------------------------------------------------
// Which tools actually have a working generation backend.
//
// Single source of truth: the tool pages use it to decide whether to enable the
// form, and Amber uses it so she never tells someone to use a tool that cannot
// run. Add a slug here only once its route genuinely generates something.
// ---------------------------------------------------------------------------

/** Tools backed by Veo image-to-video (AI Avatar Studio uses HeyGen via its own page). */
export const VIDEO_TOOLS = new Set(["talking-photo", "dancing-photo"]);

/** Tools backed by Gemini image generation. */
export const IMAGE_TOOLS = new Set(["custom-avatar-creator"]);

/** Every tool that can currently produce a result. */
export const LIVE_TOOLS = new Set<string>([
  ...VIDEO_TOOLS,
  ...IMAGE_TOOLS,
  "ai-avatar-studio",
  "website-commercial",
  "bedtime-storybook",
  "product-commercial",
  "story-memory-generator",
  "shorts-20",
]);

export function isToolLive(slug: string): boolean {
  return LIVE_TOOLS.has(slug);
}

/** Which external service a live tool depends on — used for Amber's guidance. */
export const TOOL_SERVICE: Record<string, "gemini" | "heygen"> = {
  "bedtime-storybook": "gemini",
  "product-commercial": "gemini",
  "story-memory-generator": "gemini",
  "shorts-20": "gemini",
  "talking-photo": "gemini",
  "dancing-photo": "gemini",
  "custom-avatar-creator": "gemini",
  "ai-avatar-studio": "heygen",
  "website-commercial": "heygen",
};
