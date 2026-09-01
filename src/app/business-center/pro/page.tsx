import Link from "next/link";
import Image from "next/image";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import { PRO_CARD_SLUGS, PRO_REDIRECTS } from "@/lib/pro-features";

export const metadata = {
  title: "Business Center Pro — Reelo",
  description: "Business Center Pro — the full power of Reelo for agencies and teams.",
};

const HIGHLIGHTS: { icon: IconKey; t: string; d: string }[] = [
  { icon: "infinity", t: "Unlimited", d: "AI Generations" },
  { icon: "hd", t: "4K", d: "Ultra HD Exports" },
  { icon: "bolt", t: "Priority", d: "Processing" },
  { icon: "chip", t: "Advanced", d: "AI Models" },
  { icon: "users", t: "Team Access", d: "& Collaboration" },
  { icon: "headset", t: "24/7", d: "Pro Support" },
];

export type ProCard = {
  n: number;
  icon: IconKey;
  art: string;
  t: string;
  d: string;
  href: string;
};

function proHref(n: number): string {
  const slug = PRO_CARD_SLUGS[n];
  if (!slug) return "/business-center/pro";
  return PRO_REDIRECTS[slug] ?? `/business-center/pro/${slug}`;
}

export const PRO_CARDS: ProCard[] = [
  {
    n: 1,
    icon: "chip",
    art: "advanced-ai-suite",
    t: "Advanced AI Suite",
    d: "Open the Create hub — talking photo, avatars, commercials, stories and more.",
    href: proHref(1),
  },
  {
    n: 2,
    icon: "users",
    art: "team-collaboration",
    t: "Team Collaboration",
    d: "Invite editors and admins to work on your library together.",
    href: proHref(2),
  },
  {
    n: 3,
    icon: "lock",
    art: "brand-vault",
    t: "Brand Vault Pro",
    d: "Save your brand name, colours, fonts and logo to your account.",
    href: proHref(3),
  },
  {
    n: 4,
    icon: "layers",
    art: "content-templates",
    t: "Content Templates",
    d: "Niche templates that prefill a shorts batch ready to generate.",
    href: proHref(4),
  },
  {
    n: 5,
    icon: "grid",
    art: "bulk-creation",
    t: "Bulk Creation",
    d: "Plan a batch of short-form videos — hooks, scripts and captions ready to film.",
    href: proHref(5),
  },
  {
    n: 6,
    icon: "cc",
    art: "auto-subtitles",
    t: "Auto Subtitles",
    d: "Transcribe speech into editable SRT captions for Shorts and Reels.",
    href: proHref(6),
  },
  {
    n: 7,
    icon: "mic",
    art: "voice-cloning",
    t: "Voice Cloning Pro",
    d: "Script + studio AI voice → talking video for your brand.",
    href: proHref(7),
  },
  {
    n: 8,
    icon: "globe",
    art: "translate-dub",
    t: "Translate & Dub",
    d: "Translate a script and produce a dubbed talking video.",
    href: proHref(8),
  },
  {
    n: 9,
    icon: "scissors",
    art: "smart-cut-edit",
    t: "Smart Cut & Edit",
    d: "AI edit brief: cuts, hooks, and a tighter caption for your footage.",
    href: proHref(9),
  },
  {
    n: 10,
    icon: "image",
    art: "thumbnail-maker",
    t: "Thumbnail Maker",
    d: "AI creates high-converting thumbnails that get more clicks.",
    href: proHref(10),
  },
  {
    n: 11,
    icon: "stack",
    art: "stock-media-pro",
    t: "Stock Media Pro",
    d: "Generate on-brand stock stills and related search queries.",
    href: proHref(11),
  },
  {
    n: 12,
    icon: "magic",
    art: "background-remover",
    t: "Background Remover",
    d: "Isolate your subject on a clean studio background.",
    href: proHref(12),
  },
  {
    n: 13,
    icon: "pen",
    art: "ai-script-writer",
    t: "AI Script Writer",
    d: "Generate viral hooks, spoken scripts and captions for a month of shorts.",
    href: proHref(13),
  },
  {
    n: 14,
    icon: "refresh",
    art: "automated-reposting",
    t: "Automated Reposting",
    d: "Clone a post onto the schedule across platforms and days.",
    href: proHref(14),
  },
  {
    n: 15,
    icon: "chart",
    art: "detailed-analytics",
    t: "Detailed Analytics",
    d: "See the YouTube Shorts Amber registered for tracking, with watch links.",
    href: proHref(15),
  },
  {
    n: 16,
    icon: "target",
    art: "competitor-tracker",
    t: "Competitor Tracker",
    d: "Gemini briefs on competitors, niches and content angles.",
    href: proHref(16),
  },
  {
    n: 17,
    icon: "contact",
    art: "lead-capture-crm",
    t: "Lead Capture & CRM",
    d: "Capture leads, manage contacts and nurture your audience.",
    href: proHref(17),
  },
  {
    n: 18,
    icon: "tag",
    art: "white-label",
    t: "White Label Options",
    d: "Apply your brand name and colours across Business Center.",
    href: proHref(18),
  },
  {
    n: 19,
    icon: "code",
    art: "api-access",
    t: "API Access",
    d: "Create API keys for your library and publish hooks.",
    href: proHref(19),
  },
  {
    n: 20,
    icon: "plug",
    art: "webhooks",
    t: "Webhooks",
    d: "Register callback URLs for when creations finish.",
    href: proHref(20),
  },
  {
    n: 21,
    icon: "cloud",
    art: "unlimited-storage",
    t: "Media Library",
    d: "Open every video and image you’ve created — download, revisit, create another.",
    href: proHref(21),
  },
  {
    n: 22,
    icon: "gauge",
    art: "priority-rendering",
    t: "Priority Rendering",
    d: "Prefer speed when routing your generation jobs.",
    href: proHref(22),
  },
  {
    n: 23,
    icon: "doc",
    art: "revenue-reports",
    t: "Detailed Revenue Reports",
    d: "Real token spend and purchases from your ledger.",
    href: proHref(23),
  },
  {
    n: 24,
    icon: "headset",
    art: "account-manager",
    t: "Dedicated Account Manager",
    d: "Message your success desk — we keep every ticket on file.",
    href: proHref(24),
  },
  {
    n: 25,
    icon: "share",
    art: "social",
    t: "Social Account Manager",
    d: "Connect TikTok, Instagram, YouTube and more — manage every channel in one place.",
    href: proHref(25),
  },
  {
    n: 26,
    icon: "rocket",
    art: "publishing",
    t: "Publishing Queue",
    d: "Queue captions and platforms, then export or hand off ready-to-post packages.",
    href: proHref(26),
  },
  {
    n: 27,
    icon: "calendar",
    art: "scheduling",
    t: "Content Scheduling",
    d: "Plan post dates on a real calendar — Amber can place drafts you approve.",
    href: proHref(27),
  },
  {
    n: 28,
    icon: "dollar",
    art: "revenue-reports",
    t: "Amber Earnings",
    d: "Autonomous income command center — platforms, jobs, Needs Mike, cloud workers.",
    href: proHref(28),
  },
  {
    n: 29,
    icon: "home",
    art: "hub-pro",
    t: "Amber Property Intelligence",
    d: "California Property & Investor Intelligence — research, matching, introductions.",
    href: proHref(29),
  },
];

const FOOTER: { icon: IconKey; t: string; d: string }[] = [
  { icon: "growth", t: "Maximum Growth", d: "Scale your content empire without limits." },
  { icon: "clock", t: "Save Time", d: "Powerful tools and automation that do the work for you." },
  { icon: "dollar", t: "Earn More", d: "More views, more engagement, more revenue." },
  { icon: "trophy", t: "Stay Ahead", d: "Advanced AI and insights keep you ahead of the game." },
  { icon: "headset", t: "Pro Support", d: "24/7 priority support whenever you need it." },
];

export default function BusinessCenterProPage() {
  return (
    <BusinessShell active="hubpro" variant="pro">
      <div
        className="relative mb-2.5 overflow-hidden rounded-2xl px-6 py-3 text-center"
        style={{
          border: "1px solid rgba(255,70,85,.22)",
          background:
            "radial-gradient(700px 220px at 50% -20%,rgba(225,29,42,.32),transparent 70%),rgba(12,6,8,.6)",
        }}
      >
        <h1 className="font-display relative flex items-center justify-center gap-3 text-2xl font-extrabold uppercase tracking-tight sm:text-[32px]">
          Business Center <span style={{ color: "#ff2d3f" }}>Pro</span>
          <BIcon name="crown" size={26} />
        </h1>
        <p className="relative mt-0.5 text-[12.5px]" style={{ color: "#cabcbe" }}>
          {PRO_CARDS.length} live tools — every card opens a working feature
        </p>
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.t}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}
          >
            <BIcon name={h.icon} size={22} />
            <div>
              <div className="font-display text-[15px] font-bold leading-tight">{h.t}</div>
              <div className="text-[11px]" style={{ color: "#8e7f81" }}>
                {h.d}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mb-2 text-center font-display text-[11.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "#ff2d3f" }}
      >
        Everything Included in Business Center Pro
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {PRO_CARDS.map((c) => {
          const inner = (
            <>
              <div
                className="relative mb-1 grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-lg"
                style={{
                  background: "radial-gradient(circle at 50% 40%,rgba(225,29,42,.14),transparent 70%)",
                  border: "1px solid rgba(255,70,85,.1)",
                }}
              >
                <Image
                  src={"/assets/tiles/wide/" + c.art + ".webp"}
                  alt=""
                  width={512}
                  height={288}
                  className="h-full w-full object-cover"
                  unoptimized
                />
                <span
                  className="absolute left-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] font-bold backdrop-blur-sm"
                  style={{ border: "1px solid rgba(255,70,85,.5)", color: "#ff5663" }}
                >
                  {c.n}
                </span>
                <span className="absolute right-1.5 top-1.5 z-10 grid place-items-center rounded-md bg-black/50 p-0.5 backdrop-blur-sm">
                  <BIcon name={c.icon} size={14} />
                </span>
                <span
                  className="absolute bottom-1 left-1.5 z-10 rounded px-1 py-px text-[8px] font-bold uppercase backdrop-blur-sm"
                  style={{ color: "#ff8892", background: "rgba(0,0,0,.62)" }}
                >
                  Open now
                </span>
              </div>
              <h3 className="font-display text-[11px] font-bold uppercase leading-tight tracking-wide">{c.t}</h3>
              <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-[1.25]" style={{ color: "#9a8b8d" }}>
                {c.d}
              </p>
            </>
          );
          const style = {
            border: "1px solid rgba(255,70,85,.18)",
            background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))",
          };
          return (
            <Link
              key={c.n}
              href={c.href}
              data-pro-card={c.n}
              data-pro-status="live"
              data-pro-href={c.href}
              className="relative block rounded-lg p-1.5 transition-all hover:-translate-y-1 hover:border-[rgba(255,70,85,.45)]"
              style={style}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div
        className="grid grid-cols-2 gap-2.5 rounded-xl px-3.5 py-2.5 sm:grid-cols-3 lg:grid-cols-5"
        style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.5)" }}
      >
        {FOOTER.map((f) => (
          <div key={f.t} className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
              style={{ border: "1.5px solid rgba(255,70,85,.4)" }}
            >
              <BIcon name={f.icon} size={16} />
            </span>
            <div>
              <div className="text-[12.5px] font-bold leading-tight">{f.t}</div>
              <div className="line-clamp-1 text-[10.5px]" style={{ color: "#8e7f81" }}>
                {f.d}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
