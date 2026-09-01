/** Catalog of Business Center Pro features — every card maps here. */
export type ProFeature = {
  slug: string;
  title: string;
  blurb: string;
  kind: "create" | "workspace" | "ops";
  /** Primary input mode for the generic studio. */
  input: "prompt" | "upload-image" | "upload-video" | "upload-audio" | "form" | "none";
  /** Gemini / HeyGen action key for /api/pro/run */
  action: string;
  cta: string;
};

export const PRO_FEATURES: ProFeature[] = [
  { slug: "advanced-ai-suite", title: "Advanced AI Suite", blurb: "Create hub for every live generation tool.", kind: "create", input: "none", action: "redirect", cta: "Open Create" },
  { slug: "team", title: "Team Collaboration", blurb: "Invite editors to work on your library.", kind: "ops", input: "form", action: "team", cta: "Invite teammate" },
  { slug: "brand-kit", title: "Brand Vault Pro", blurb: "Brand colours, fonts and logo.", kind: "workspace", input: "none", action: "redirect", cta: "Open Brand Kit" },
  { slug: "templates", title: "Content Templates", blurb: "Niche templates that prefill a shorts batch.", kind: "create", input: "form", action: "templates", cta: "Use template" },
  { slug: "bulk-creation", title: "Bulk Creation", blurb: "Plan a month of shorts at once.", kind: "create", input: "none", action: "redirect", cta: "Open Bulk Creation" },
  { slug: "auto-subtitles", title: "Auto Subtitles", blurb: "Transcribe speech into editable SRT captions.", kind: "create", input: "upload-audio", action: "auto-subtitles", cta: "Generate subtitles" },
  { slug: "voice-cloning", title: "Voice Cloning Pro", blurb: "Script + brand voice → talking video (AI voice).", kind: "create", input: "form", action: "voice-clone", cta: "Generate voice video" },
  { slug: "translate-dub", title: "Translate & Dub", blurb: "Translate a script and produce a dubbed talking video.", kind: "create", input: "form", action: "translate-dub", cta: "Translate & dub" },
  { slug: "smart-cut", title: "Smart Cut & Edit", blurb: "AI edit brief: cuts, hooks, and a tighter caption.", kind: "create", input: "prompt", action: "smart-cut", cta: "Build edit brief" },
  { slug: "thumbnail-maker", title: "Thumbnail Maker", blurb: "High-CTR thumbnail stills for Shorts and Reels.", kind: "create", input: "upload-image", action: "thumbnail", cta: "Make thumbnail" },
  { slug: "stock-media", title: "Stock Media Pro", blurb: "Search first-party stock + generate on-brand stills.", kind: "create", input: "prompt", action: "stock", cta: "Find / generate stock" },
  { slug: "background-remover", title: "Background Remover", blurb: "Isolate your subject on a clean studio background.", kind: "create", input: "upload-image", action: "background-remove", cta: "Remove background" },
  { slug: "ai-script-writer", title: "AI Script Writer", blurb: "Hooks, scripts and captions for short-form.", kind: "create", input: "none", action: "redirect", cta: "Open Script Writer" },
  { slug: "reposting", title: "Automated Reposting", blurb: "Clone a post onto the schedule for later platforms.", kind: "ops", input: "form", action: "repost", cta: "Schedule reposts" },
  { slug: "analytics", title: "Detailed Analytics", blurb: "Tracked publishes Amber registered.", kind: "workspace", input: "none", action: "redirect", cta: "Open Analytics" },
  { slug: "competitors", title: "Competitor Tracker", blurb: "Gemini briefs on competitors and niches.", kind: "ops", input: "form", action: "competitors", cta: "Run brief" },
  { slug: "leads", title: "Lead Capture & CRM", blurb: "Capture and manage leads from your content funnel.", kind: "ops", input: "form", action: "leads", cta: "Add lead" },
  { slug: "white-label", title: "White Label Options", blurb: "Apply your brand chrome across Business Center.", kind: "ops", input: "form", action: "white-label", cta: "Save white label" },
  { slug: "api-access", title: "API Access", blurb: "Create API keys for your library and publish hooks.", kind: "ops", input: "form", action: "api-keys", cta: "Create API key" },
  { slug: "webhooks", title: "Webhooks", blurb: "Receive signed callbacks when creations finish.", kind: "ops", input: "form", action: "webhooks", cta: "Save webhook" },
  { slug: "library", title: "Media Library", blurb: "Every video and image you’ve made.", kind: "workspace", input: "none", action: "redirect", cta: "Open Library" },
  { slug: "priority", title: "Priority Rendering", blurb: "Prefer speed when routing generation jobs.", kind: "ops", input: "form", action: "priority", cta: "Save preference" },
  { slug: "revenue", title: "Detailed Revenue Reports", blurb: "Real token spend from your ledger.", kind: "workspace", input: "none", action: "redirect", cta: "Open Revenue" },
  { slug: "account-manager", title: "Dedicated Account Manager", blurb: "Message your success desk — we email you back.", kind: "ops", input: "form", action: "support", cta: "Send message" },
  { slug: "social", title: "Social Account Manager", blurb: "Connect and manage your social channels.", kind: "workspace", input: "none", action: "redirect", cta: "Open Social" },
  { slug: "publishing", title: "Publishing Queue", blurb: "Prepare and queue posts for every platform.", kind: "workspace", input: "none", action: "redirect", cta: "Open Publishing" },
  { slug: "scheduling", title: "Content Scheduling", blurb: "Calendar for planned posts and Amber drafts.", kind: "workspace", input: "none", action: "redirect", cta: "Open Scheduling" },
  { slug: "amber-earnings", title: "Amber Earnings", blurb: "Autonomous income command center — platforms, jobs, Needs Mike.", kind: "ops", input: "none", action: "redirect", cta: "Open Amber Earnings" },
  { slug: "property-intelligence", title: "Amber Property Intelligence", blurb: "California property research, $299 individual unlocks, private opportunities.", kind: "ops", input: "none", action: "redirect", cta: "Open Property Intelligence" },
];

export function getProFeature(slug: string): ProFeature | undefined {
  return PRO_FEATURES.find((f) => f.slug === slug);
}

/** Card number → feature slug (matches Business Center Pro grid). */
export const PRO_CARD_SLUGS: Record<number, string> = {
  1: "advanced-ai-suite",
  2: "team",
  3: "brand-kit",
  4: "templates",
  5: "bulk-creation",
  6: "auto-subtitles",
  7: "voice-cloning",
  8: "translate-dub",
  9: "smart-cut",
  10: "thumbnail-maker",
  11: "stock-media",
  12: "background-remover",
  13: "ai-script-writer",
  14: "reposting",
  15: "analytics",
  16: "competitors",
  17: "leads",
  18: "white-label",
  19: "api-access",
  20: "webhooks",
  21: "library",
  22: "priority",
  23: "revenue",
  24: "account-manager",
  25: "social",
  26: "publishing",
  27: "scheduling",
  28: "amber-earnings",
  29: "property-intelligence",
};

export const PRO_REDIRECTS: Record<string, string> = {
  "advanced-ai-suite": "/create",
  "brand-kit": "/business-center/brand-kit",
  "bulk-creation": "/create/shorts-20",
  "ai-script-writer": "/create/shorts-20",
  analytics: "/business-center/analytics",
  library: "/library",
  revenue: "/business-center/revenue",
  social: "/business-center/social",
  publishing: "/business-center/publishing",
  scheduling: "/business-center/scheduling",
  "amber-earnings": "/business-center/amber-earnings",
  "property-intelligence": "/business-center/property-intelligence",
};

export const CONTENT_TEMPLATES = [
  { id: "local-service", name: "Local Service Ads", prompt: "Local service business tips that convert homeowners into booked jobs", niche: "Home services" },
  { id: "saas-hooks", name: "SaaS Hook Pack", prompt: "SaaS product hooks for founders who hate boring demos", niche: "Software" },
  { id: "fitness", name: "Fitness Challenges", prompt: "30-second fitness challenges for busy professionals", niche: "Health" },
  { id: "real-estate", name: "Real Estate Walkthroughs", prompt: "Listing walkthrough hooks that stop the scroll", niche: "Real estate" },
  { id: "ecommerce", name: "Product Drop Hype", prompt: "E-commerce product drop hype with urgency and social proof", niche: "Ecommerce" },
  { id: "coaching", name: "Coach Authority", prompt: "Authority-building tips for online coaches", niche: "Coaching" },
  { id: "food", name: "Food Truck / Cafe", prompt: "Quick food content that drives foot traffic", niche: "Food" },
  { id: "beauty", name: "Beauty Before/After", prompt: "Beauty transformation hooks with clear before/after framing", niche: "Beauty" },
];
