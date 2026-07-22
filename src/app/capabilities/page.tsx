import Link from "next/link";
import DesignShell from "@/components/design/DesignShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import { TOOLS, LIVE_TOOLS } from "@/lib/tools";

export const metadata = { title: "Master Feature List — Reelo" };

type Section = {
  id: string;
  title: string;
  icon: IconKey;
  note?: string;
  items?: string[];
  groups?: { name: string; items: string[] }[];
};

const SECTIONS: Section[] = [
  {
    id: "creation", title: "AI Creation Studio", icon: "chip",
    items: ["Talking Photos", "Dancing Photos", "AI Avatar Videos", "AI Talking Avatars", "Website Commercial Generator", "Product Commercial Generator", "Social Media Commercials", "AI Story Maker", "20 Shorts Generator", "AI Video Generator", "Image to Video", "Text to Video", "AI Voiceovers", "AI Revoice", "AI Lip Sync", "AI Background Replacement", "AI Object Removal", "AI Upscaling", "AI Captions", "AI Translation", "AI Subtitle Generator", "AI Script Writer", "AI Hook Generator", "AI CTA Generator", "AI Hashtag Generator", "AI Thumbnail Generator"],
  },
  {
    id: "avatars", title: "Avatar Library", icon: "users", note: "Target: 1,000+ Avatars",
    groups: [
      { name: "Industries", items: ["Business", "Doctors", "Dentists", "Lawyers", "Realtors", "Teachers", "Coaches", "Fitness", "Construction", "Sales", "Corporate", "Luxury"] },
      { name: "Food", items: ["Fruits", "Vegetables", "Fast Food", "Desserts", "Drinks", "Candy"] },
      { name: "Animals", items: ["Dogs", "Cats", "Birds", "Farm Animals", "Jungle Animals", "Ocean Animals", "Dinosaurs"] },
      { name: "Fantasy", items: ["Dragons", "Knights", "Wizards", "Witches", "Fairies", "Elves", "Orcs", "Monsters"] },
      { name: "Entertainment", items: ["Pirates", "Cowboys", "Ninjas", "Samurai", "Detectives", "Superheroes", "Villains"] },
      { name: "Holiday", items: ["Christmas", "Halloween", "Easter", "Valentine's Day", "Thanksgiving"] },
      { name: "Kids", items: ["Babies", "Cartoons", "Toys", "Robots", "Aliens"] },
      { name: "Sports", items: ["Football", "Basketball", "Baseball", "Hockey", "Soccer", "Racing"] },
      { name: "Occupations", items: ["Police", "Firefighter", "Nurse", "Chef", "Pilot", "Astronaut", "Scientist"] },
      { name: "Seasonal", items: ["Summer", "Winter", "Spring", "Fall"] },
      { name: "Custom Uploads", items: ["My Avatars", "Favorites", "Recently Used"] },
    ],
  },
  { id: "business", title: "Business Center", icon: "grid", items: ["Dashboard", "Video Library", "Brand Kit", "Assets", "Social Media Manager", "Publishing", "Scheduling", "Analytics", "Revenue Dashboard", "Trend AI", "Notifications", "Storage Manager", "Client Manager", "Project Manager", "Workspace Settings"] },
  { id: "business-pro", title: "Business Center Pro", icon: "crown", items: ["Agency Dashboard", "Unlimited Brands", "Unlimited Team Members", "Unlimited Clients", "Approval Workflow", "Client Portal", "White Label", "API Access", "Advanced Analytics", "Revenue Intelligence", "Campaign Manager", "CRM Integration", "Invoices", "Contracts", "Billing", "Permissions", "Audit Logs", "Multi-location Support", "Organization Management", "Enterprise Storage", "Priority Support", "Dedicated Success Manager"] },
  { id: "battle", title: "AI Battle Arena", icon: "trophy", items: ["Avatar Battles", "Comedy Battles", "Business Battles", "Rap Battles", "Debates", "Story Battles", "Freestyle Battles", "Friend Battles", "Random Battles", "Ranked Battles", "Seasonal Events", "Leaderboards", "Battle History", "Battle Replays", "AI Judges", "Audience Voting", "Achievements", "Badges", "Battle Arena", "Tournament Brackets"] },
  { id: "judges", title: "AI Judges", icon: "sparkle", items: ["Comedian", "Business Coach", "Marketing Expert", "Movie Critic", "Grandma", "Pirate", "Cowboy", "Robot", "Alien", "Teacher", "Chef", "Motivational Speaker", "Celebrity Style", "Custom Judge Packs"] },
  { id: "trend", title: "Trend AI", icon: "brain", items: ["Trending Videos", "Trending Hooks", "Trending Audio", "Trending Hashtags", "Trending Challenges", "Trending Effects", "Trending Niches", "Viral Predictor", "One Click Create"] },
  { id: "analytics", title: "Analytics", icon: "chart", items: ["Views", "Likes", "Comments", "Shares", "Revenue", "Engagement", "Conversions", "Audience Growth", "Watch Time", "Retention", "Token Usage", "Top Videos", "Best Time To Post"] },
  { id: "social", title: "Social Media", icon: "share", items: ["TikTok", "Instagram", "Facebook", "YouTube", "YouTube Shorts", "LinkedIn", "Pinterest", "X", "Threads", "Snapchat", "Reddit", "Discord", "Telegram", "WhatsApp", "Google Business Profile", "WordPress", "Shopify", "WooCommerce", "Etsy", "Amazon", "eBay", "Vimeo", "Dailymotion", "Rumble"] },
  { id: "publishing", title: "Publishing", icon: "rocket", items: ["One-click Publish", "Drafts", "Scheduled Posts", "Bulk Publishing", "Cross Posting", "Auto Posting", "Campaigns", "Content Calendar"] },
  { id: "brand", title: "Brand Kit", icon: "palette", items: ["Logos", "Colors", "Fonts", "Voice", "Business Information", "Products", "Services", "Contact Information", "Disclaimers", "Media Library"] },
  { id: "tools", title: "AI Tools", icon: "pen", items: ["AI Copywriter", "AI Rewrite", "AI Summarizer", "AI Translator", "AI SEO", "AI Keyword Generator", "AI Product Descriptions", "AI Email Generator", "AI Sales Letters", "AI Blog Writer", "AI Landing Pages"] },
  { id: "mobile", title: "Mobile", icon: "globe", items: ["iPhone", "Android", "Tablet", "Desktop", "PWA", "Offline Support", "Push Notifications"] },
  { id: "admin", title: "Admin", icon: "lock", items: ["User Management", "Subscription Management", "Token Management", "Reports", "Moderation", "Support", "Fraud Detection", "Analytics", "Provider Health", "System Status", "Audit Logs"] },
  { id: "payments", title: "Payments", icon: "dollar", items: ["Stripe", "Token Packs", "Subscriptions", "Coupons", "Taxes", "Invoices", "Receipts", "Business Billing"] },
  { id: "future", title: "Future", icon: "magic", items: ["Marketplace", "Community Templates", "Template Store", "Plugin Store", "AI Agents", "Voice Cloning", "3D Avatars", "Live Streaming", "Virtual Influencers", "AI Podcasts", "AI Music Videos", "Team Collaboration", "Enterprise API", "Developer Platform"] },
];

const TOTAL = SECTIONS.reduce((n, s) => n + (s.items?.length ?? 0) + (s.groups?.reduce((m, g) => m + g.items.length, 0) ?? 0), 0);

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors hover:border-[rgba(255,70,85,.4)] hover:text-white" style={{ border: "1px solid rgba(255,70,85,.15)", background: "rgba(255,60,75,.03)", color: "#cabcbe" }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#ff3645", boxShadow: "0 0 6px rgba(225,29,42,.8)" }} />
      {label}
    </span>
  );
}

export default function CapabilitiesPage() {
  return (
    <DesignShell glow="radial-gradient(900px 450px at 50% -10%,rgba(225,29,42,.22),transparent 65%),radial-gradient(700px 500px at 100% 30%,rgba(140,12,20,.12),transparent 60%)">
      {/* hero */}
      <section className="mx-auto max-w-[1100px] px-8 pb-4 pt-10 text-center">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ff5663" }}>Reelo Product Roadmap</div>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-[52px] sm:leading-[1.04]">
          Where Reelo Is <span style={{ color: "#ff2d3f" }}>Going</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-[16px]" style={{ color: "#a99a9c" }}>
          The full vision — {SECTIONS.length} categories, {TOTAL}+ planned capabilities. Most of this is not built yet.
          Here is what you can actually use today:
        </p>

        {/* Driven by LIVE_TOOLS so this can never drift from what really runs. */}
        <div className="mx-auto mt-6 max-w-[720px] rounded-2xl p-4" style={{ border: "1px solid rgba(95,208,138,.28)", background: "rgba(95,208,138,.06)" }}>
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#5fd08a" }}>
            Live today
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {TOOLS.filter((t) => LIVE_TOOLS.has(t.slug)).map((t) => (
              <Link
                key={t.slug}
                href={`/create/${t.slug}`}
                className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,.16)" }}
              >
                {t.title}
              </Link>
            ))}
            <span className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white" style={{ border: "1px solid rgba(255,255,255,.16)" }}>
              Amber (trends, scripts, captions)
            </span>
          </div>
        </div>

        {/* jump index */}
        <div className="mx-auto mt-8 flex max-w-[940px] flex-wrap justify-center gap-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:text-white" style={{ border: "1px solid rgba(255,70,85,.2)", color: "#b9a9ab" }}>
              {s.title}
            </a>
          ))}
        </div>
      </section>

      {/* sections */}
      <section className="mx-auto flex max-w-[1100px] flex-col gap-5 px-6 pb-20 pt-6">
        {SECTIONS.map((s) => {
          const count = (s.items?.length ?? 0) + (s.groups?.reduce((m, g) => m + g.items.length, 0) ?? 0);
          return (
            <div key={s.id} id={s.id} className="scroll-mt-24 rounded-[22px] p-6 sm:p-7" style={{ border: "1px solid rgba(255,70,85,.2)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "radial-gradient(circle at 50% 40%,rgba(225,29,42,.18),transparent 70%)", border: "1px solid rgba(255,70,85,.25)" }}>
                  <BIcon name={s.icon} size={22} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold sm:text-2xl">{s.title}</h2>
                  <div className="text-xs" style={{ color: "#8e7f81" }}>{s.note ?? `${count} features`}</div>
                </div>
                <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: "#ff8a92", background: "rgba(255,70,85,.12)" }}>{count}</span>
              </div>

              {s.items && (
                <div className="flex flex-wrap gap-2">
                  {s.items.map((it) => <Chip key={it} label={it} />)}
                </div>
              )}

              {s.groups && (
                <div className="flex flex-col gap-4">
                  {s.groups.map((g) => (
                    <div key={g.name}>
                      <div className="mb-2 text-[13px] font-bold uppercase tracking-wide" style={{ color: "#ff5663" }}>{g.name}</div>
                      <div className="flex flex-wrap gap-2">{g.items.map((it) => <Chip key={it} label={it} />)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </DesignShell>
  );
}
