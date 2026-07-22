import type { IconKey } from "@/components/design/BIcon";
import { creditLabel } from "@/lib/token-costs";

/** Clip length requested by the Veo route; shown so the card cannot claim 10s. */
const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 6);

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

const VOICES = ["Natural (Female)", "Natural (Male)", "Warm (Female)", "Deep (Male)", "Confident (Female)", "Clone my voice"];
const LANGS = ["English", "Spanish", "French", "German", "Hindi", "Arabic", "Japanese", "Portuguese", "Chinese", "Korean"];

export const TOOLS: Tool[] = [
  {
    slug: "bedtime-storybook", title: "Bedtime Storybook", tagline: "One picture book, finished tonight, starring your child.", icon: "doc", poster: "/assets/storybook.webp", credits: creditLabel("bedtime-storybook"), cta: "Make the book",
    // StoryBook renders its own interface; these fields describe the tool for
    // the Create page and for Amber, so both stay in step with what it needs.
    fields: [
      { kind: "upload", name: "photo", label: "Photo of your child", hint: "A clear, front-facing photo works best." },
      { kind: "text", name: "childName", label: "Child's name", placeholder: "Ava" },
      { kind: "textarea", name: "idea", label: "What should it be about?", placeholder: "A story about a red ball that rolls away" },
      { kind: "select", name: "theme", label: "They become a…", options: ["Superhero", "Explorer", "Astronaut", "Pirate", "Knight", "Wizard", "Detective", "Animal friend"] },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "talking-photo", title: "Talking Photo", tagline: "Make any photo speak naturally.", icon: "mic", poster: "/assets/talking-selfie.jpg", credits: creditLabel("talking-photo"), cta: "Generate talking video",
    fields: [
      { kind: "upload", name: "photo", label: "Upload a photo", hint: "Clear, front-facing works best." },
      { kind: "textarea", name: "script", label: "What should they say?", placeholder: "Hey everyone! Today I want to show you something incredible…" },
      { kind: "select", name: "voice", label: "Voice", options: VOICES },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "dancing-photo", title: "Dancing Photo", tagline: "Bring any photo to life with dance.", icon: "sparkle", poster: "/assets/dancing.jpg", credits: creditLabel("dancing-photo", `max ${VIDEO_SECONDS}s`), cta: "Make it dance",
    fields: [
      { kind: "upload", name: "photo", label: "Upload a photo", hint: "Full or upper body both work." },
      { kind: "choices", name: "move", label: "Pick a move", options: [
        { label: "Hip Shake", value: "hip", icon: "💃" }, { label: "Moonwalk", value: "moon", icon: "🕺" }, { label: "Robot", value: "robot", icon: "🤖" },
        { label: "Spin", value: "spin", icon: "🌀" }, { label: "Twerk", value: "twerk", icon: "🍑" }, { label: "Jump", value: "jump", icon: "⚡" },
      ] },
      { kind: "select", name: "music", label: "Music", options: ["Upbeat", "Hip-Hop", "Pop", "EDM", "Afrobeat"] },
    ],
  },
  {
    slug: "ai-avatar-studio", title: "AI Avatar Studio", tagline: "Realistic AI avatars that talk and engage.", icon: "users", poster: "/assets/spokesperson.jpg", credits: creditLabel("ai-avatar-studio"), cta: "Generate avatar video",
    fields: [
      { kind: "choices", name: "avatar", label: "Choose an avatar", options: [
        { label: "Ava", value: "ava", img: "/assets/talking-selfie.jpg" }, { label: "Leo", value: "leo", img: "/assets/spokesperson.jpg" },
        { label: "Nina", value: "nina", img: "/assets/avatar-business.jpg" }, { label: "Maya", value: "maya", img: "/assets/talking-photo.jpg" },
      ] },
      { kind: "textarea", name: "script", label: "Script", placeholder: "Introducing the easiest way to create videos that convert…" },
      { kind: "select", name: "voice", label: "Voice", options: VOICES },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "custom-avatar-creator", title: "Custom Avatar Creator", tagline: "Turn your photo into a reusable avatar.", icon: "magic", poster: "/assets/Custom Avatar Creator.png", credits: creditLabel("custom-avatar-creator"), cta: "Create avatar",
    fields: [
      { kind: "upload", name: "photo", label: "Upload your photo", hint: "We build a reusable avatar from this." },
      { kind: "text", name: "name", label: "Avatar name", placeholder: "e.g. Brand Spokesperson" },
      { kind: "select", name: "style", label: "Style", options: ["3D Character", "Cartoon", "Anime", "Realistic Studio", "Cinematic"] },
    ],
  },
  {
    slug: "revoice", title: "Revoice", tagline: "Swap the voice on any video.", icon: "mic", poster: "/assets/Revoice.png", credits: "Pricing to be confirmed", cta: "Revoice video",
    fields: [
      { kind: "upload", name: "video", label: "Upload a video", hint: "MP4 or MOV." },
      { kind: "select", name: "voice", label: "New voice", options: VOICES },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "website-commercial", title: "Website Commercial", tagline: "Paste a URL. Get a cinematic 30-second ad.", icon: "film", poster: "/assets/website commershial.png", credits: creditLabel("website-commercial"), cta: "Generate commercial",
    fields: [
      { kind: "url", name: "url", label: "Website URL", placeholder: "https://yourbrand.com", hint: "We scrape copy, colors, and product shots." },
      { kind: "select", name: "tone", label: "Style", options: ["Cinematic", "Energetic", "Luxury", "Playful", "Minimal"] },
      { kind: "select", name: "ratio", label: "Aspect ratio", options: ["9:16 (Vertical)", "1:1 (Square)", "16:9 (Wide)"] },
      { kind: "slider", name: "duration", label: "Duration (max 30s)", min: 15, max: 30, step: 15, default: 30, unit: "s" },
    ],
  },
  {
    slug: "shorts-20", title: "20 Shorts Generator", tagline: "A month of shorts from a website or prompt.", icon: "grid", poster: "/assets/shorts.jpg", credits: "Pricing to be confirmed", cta: "Generate shorts",
    fields: [
      { kind: "segment", name: "source", label: "Source", options: ["Website", "Prompt", "Photos"] },
      { kind: "url", name: "url", label: "Website URL", placeholder: "https://yourbrand.com" },
      { kind: "textarea", name: "prompt", label: "Topic or prompt", placeholder: "e.g. healthy meal-prep tips for busy parents" },
      { kind: "slider", name: "count", label: "How many shorts", min: 5, max: 30, step: 5, default: 20 },
      { kind: "select", name: "platform", label: "Platform", options: ["TikTok", "Reels", "Shorts", "All of them"] },
      { kind: "select", name: "tone", label: "Tone", options: ["Punchy", "Educational", "Funny", "Inspirational"] },
    ],
  },
  {
    slug: "product-commercial", title: "Product Commercial", tagline: "Cinematic product videos that sell.", icon: "rocket", poster: "/assets/product.jpg", credits: "Pricing to be confirmed", cta: "Generate product video",
    fields: [
      { kind: "upload", name: "image", label: "Upload product image", hint: "Or paste a product URL below." },
      { kind: "url", name: "url", label: "Product URL (optional)", placeholder: "https://store.com/product" },
      { kind: "select", name: "look", label: "Look", options: ["Studio", "Lifestyle", "Outdoor", "Neon", "Marble & Gold"] },
      { kind: "select", name: "music", label: "Music", options: ["Upbeat", "Ambient", "Luxury", "Energetic"] },
    ],
  },
  {
    slug: "ai-story-maker", title: "AI Story Maker", tagline: "Any character — even a banana — starring in a long-running series.", icon: "sparkle", poster: "/assets/commercials.jpg", credits: creditLabel("ai-story-maker"), cta: "Start the series",
    // StoryMaker renders its own interface; these fields describe the tool for
    // the Create page and for Amber.
    fields: [
      { kind: "upload", name: "character", label: "Your star", hint: "Upload a photo, or pick any Reelo character — a banana, a dragon, a warlord." },
      { kind: "text", name: "characterName", label: "Their name", placeholder: "Barry the Banana" },
      { kind: "textarea", name: "premise", label: "What is the series about?", placeholder: "Barry escapes the fruit bowl and sets out to find the legendary Golden Orchard…" },
      { kind: "select", name: "genre", label: "Genre", options: ["Adventure", "Fantasy", "Comedy", "Anime", "Mystery", "Sci-Fi", "Family", "Children's"] },
      { kind: "slider", name: "scenes", label: "Scenes per episode", min: 6, max: 10, step: 1, default: 8 },
      { kind: "select", name: "language", label: "Language", options: LANGS },
    ],
  },
  {
    slug: "translate-videos", title: "Translate Videos", tagline: "Translate & dub into 100+ languages.", icon: "globe", poster: "/assets/talking-selfie.jpg", credits: "Pricing to be confirmed", cta: "Translate video",
    fields: [
      { kind: "upload", name: "video", label: "Upload a video", hint: "MP4 or MOV." },
      { kind: "multi", name: "languages", label: "Target languages", options: LANGS },
      { kind: "select", name: "mode", label: "Voice", options: ["Clone original voice", "Use AI voice"] },
    ],
  },
  {
    slug: "ai-quality-enhancement", title: "AI Quality Enhancement", tagline: "Upscale and enhance any video.", icon: "magic", poster: "/assets/spokesperson.jpg", credits: "Pricing to be confirmed", cta: "Enhance video",
    fields: [
      { kind: "upload", name: "video", label: "Upload a video", hint: "We enhance face, motion, and detail." },
      { kind: "multi", name: "enhancements", label: "Enhancements", options: ["Face Enhancement", "Motion Enhancement", "Upscale to 4K", "Texture Boost"] },
      { kind: "select", name: "mode", label: "Render mode", options: ["Standard", "Premium"] },
    ],
  },
  {
    slug: "story-memory-generator", title: "Story & Memory Generator", tagline: "Your own photos, cut into one narrated memory film.", icon: "sparkle", poster: "/assets/dancing-grandpa.jpg", credits: "Pricing to be confirmed", cta: "Generate memory film",
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

/** Tools backed by Veo image-to-video. */
export const VIDEO_TOOLS = new Set(["talking-photo", "dancing-photo", "ai-avatar-studio"]);

/** Tools backed by Gemini image generation. */
export const IMAGE_TOOLS = new Set(["custom-avatar-creator"]);

/** Every tool that can currently produce a result. */
export const LIVE_TOOLS = new Set<string>([...VIDEO_TOOLS, ...IMAGE_TOOLS, "website-commercial", "bedtime-storybook", "ai-story-maker"]);

export function isToolLive(slug: string): boolean {
  return LIVE_TOOLS.has(slug);
}

/** Which external service a live tool depends on — used for Amber's guidance. */
export const TOOL_SERVICE: Record<string, "gemini" | "heygen"> = {
  "bedtime-storybook": "gemini",
  "ai-story-maker": "gemini",
  "talking-photo": "gemini",
  "dancing-photo": "gemini",
  "custom-avatar-creator": "gemini",
  "ai-avatar-studio": "heygen",
  "website-commercial": "heygen",
};
