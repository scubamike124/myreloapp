import Link from "next/link";
import Image from "next/image";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";

export const metadata = { title: "Business Center Pro — Reelo" };

const HIGHLIGHTS: { icon: IconKey; t: string; d: string }[] = [
  { icon: "infinity", t: "Unlimited", d: "AI Generations" },
  { icon: "hd", t: "4K", d: "Ultra HD Exports" },
  { icon: "bolt", t: "Priority", d: "Processing" },
  { icon: "chip", t: "Advanced", d: "AI Models" },
  { icon: "users", t: "Team Access", d: "& Collaboration" },
  { icon: "headset", t: "24/7", d: "Pro Support" },
];

// href = this exists today and the card opens it. planned = it does not, and
// the card says so rather than looking clickable and doing nothing.
const CARDS: { n: number; icon: IconKey; art: string; t: string; d: string; href?: string; planned?: boolean }[] = [
  { n: 1, icon: "chip", art: "advanced-ai-suite", t: "Advanced AI Suite", d: "Access the most powerful AI models for videos, voices, scripts and more.", href: "/create" },
  { n: 2, icon: "users", art: "team-collaboration", t: "Team Collaboration", d: "Invite unlimited team members and work together in real time.", planned: true },
  { n: 3, icon: "lock", art: "brand-vault", t: "Brand Vault Pro", d: "Store unlimited brands, templates, logos, fonts and color palettes.", planned: true },
  { n: 4, icon: "layers", art: "content-templates", t: "Content Templates", d: "Access 1000+ premium templates for every industry and niche.", planned: true },
  { n: 5, icon: "grid", art: "bulk-creation", t: "Bulk Creation", d: "Create hundreds of videos at once with bulk upload, scripts and automation.", planned: true },
  { n: 6, icon: "cc", art: "auto-subtitles", t: "Auto Subtitles", d: "Auto-generate accurate subtitles in 100+ languages.", planned: true },
  { n: 7, icon: "mic", art: "voice-cloning", t: "Voice Cloning Pro", d: "Clone voices or create custom AI voices for your brand.", planned: true },
  { n: 8, icon: "globe", art: "translate-dub", t: "Translate & Dub", d: "Translate and dub your videos into 100+ languages instantly.", planned: true },
  { n: 9, icon: "scissors", art: "smart-cut-edit", t: "Smart Cut & Edit", d: "AI-powered editing tools to cut, trim and enhance videos automatically.", planned: true },
  { n: 10, icon: "image", art: "thumbnail-maker", t: "Thumbnail Maker", d: "AI creates high-converting thumbnails that get more clicks.", planned: true },
  { n: 11, icon: "stack", art: "stock-media-pro", t: "Stock Media Pro", d: "Unlimited access to premium stock videos, images and music.", planned: true },
  { n: 12, icon: "magic", art: "background-remover", t: "Background Remover", d: "Remove or replace backgrounds with one click.", planned: true },
  { n: 13, icon: "pen", art: "ai-script-writer", t: "AI Script Writer", d: "Generate viral scripts, hooks and captions in seconds.", href: "/create/shorts-20" },
  { n: 14, icon: "refresh", art: "automated-reposting", t: "Automated Reposting", d: "Automatically repost your best content across all platforms.", planned: true },
  { n: 15, icon: "chart", art: "detailed-analytics", t: "Detailed Analytics", d: "Deep insights on every video, audience and revenue stream.", planned: true },
  { n: 16, icon: "target", art: "competitor-tracker", t: "Competitor Tracker", d: "Track competitors, keywords and top performing content.", planned: true },
  { n: 17, icon: "contact", art: "lead-capture-crm", t: "Lead Capture & CRM", d: "Capture leads, manage contacts and nurture your audience.", planned: true },
  { n: 18, icon: "tag", art: "white-label", t: "White Label Options", d: "Rebrand Reelo with your own logo, domain and custom colors.", planned: true },
  { n: 19, icon: "code", art: "api-access", t: "API Access", d: "Integrate Reelo with your apps and workflows using our API.", planned: true },
  { n: 20, icon: "plug", art: "webhooks", t: "Webhooks", d: "Connect and automate with 3rd party apps seamlessly.", planned: true },
  { n: 21, icon: "cloud", art: "unlimited-storage", t: "Unlimited Storage", d: "Store all your videos, assets and projects with no limits.", planned: true },
  { n: 22, icon: "gauge", art: "priority-rendering", t: "Priority Rendering", d: "Your videos render faster with top priority servers.", planned: true },
  { n: 23, icon: "doc", art: "revenue-reports", t: "Detailed Revenue Reports", d: "Track earnings, refunds and growth with detailed financial reports.", planned: true },
  { n: 24, icon: "headset", art: "account-manager", t: "Dedicated Account Manager", d: "Get a dedicated expert to help you grow and succeed.", planned: true },
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
      {/* header */}
      <div className="relative mb-2.5 overflow-hidden rounded-2xl px-6 py-3 text-center" style={{ border: "1px solid rgba(255,70,85,.22)", background: "radial-gradient(700px 220px at 50% -20%,rgba(225,29,42,.32),transparent 70%),rgba(12,6,8,.6)" }}>
        <h1 className="font-display relative flex items-center justify-center gap-3 text-2xl font-extrabold uppercase tracking-tight sm:text-[32px]">
          Business Center <span style={{ color: "#ff2d3f" }}>Pro</span>
          <BIcon name="crown" size={26} />
        </h1>
        <p className="relative mt-0.5 text-[12.5px]" style={{ color: "#cabcbe" }}>Unlock the full power of Reelo and scale your content empire.</p>
      </div>

      {/* highlights */}
      <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {HIGHLIGHTS.map((h) => (
          <div key={h.t} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={h.icon} size={22} />
            <div><div className="font-display text-[15px] font-bold leading-tight">{h.t}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>{h.d}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-2 text-center font-display text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "#ff2d3f" }}>
        Everything Included in Business Center Pro
      </div>

      {/* 24 cards. Two open a feature that genuinely does what the card claims;
          the other 22 are labelled PLANNED and open the roadmap. A card that
          looks clickable and lies is worse than one that tells you where it
          stands. */}
      <div className="mb-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {CARDS.map((c) => {
          const inner = (
            <>
              {/* Number and icon sit ON the artwork rather than in a row above
                  it. Across 24 cards that row was ~26px each — most of what
                  kept this page from fitting on one screen. */}
              <div className="relative mb-1 grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-lg" style={{ background: "radial-gradient(circle at 50% 40%,rgba(225,29,42,.14),transparent 70%)", border: "1px solid rgba(255,70,85,.1)" }}>
                <Image
                  src={"/assets/tiles/wide/" + c.art + ".webp"}
                  alt=""
                  width={512}
                  height={288}
                  className="h-full w-full object-cover"
                  unoptimized
                />
                <span className="absolute left-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] font-bold backdrop-blur-sm" style={{ border: "1px solid rgba(255,70,85,.5)", color: "#ff5663" }}>{c.n}</span>
                <span className="absolute right-1.5 top-1.5 z-10 grid place-items-center rounded-md bg-black/50 p-0.5 backdrop-blur-sm">
                  <BIcon name={c.icon} size={14} />
                </span>
                <span className="absolute bottom-1 left-1.5 z-10 rounded px-1 py-px text-[8px] font-bold uppercase backdrop-blur-sm" style={c.planned ? { color: "#e9cdb0", background: "rgba(0,0,0,.62)" } : { color: "#ff8892", background: "rgba(0,0,0,.62)" }}>{c.planned ? "Planned" : "Open now"}</span>
              </div>
              <h3 className="font-display text-[11px] font-bold uppercase leading-tight tracking-wide">{c.t}</h3>
              <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-[1.25]" style={{ color: "#9a8b8d" }}>{c.d}</p>

            </>
          );
          const style = { border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" };
          // Every card is clickable, and none of them lies about where it goes:
          // a built feature opens itself, a planned one opens the roadmap.
          return (
            <Link
              key={c.n}
              href={c.href ?? "/roadmap"}
              className="relative block rounded-lg p-1.5 transition-all hover:-translate-y-1 hover:border-[rgba(255,70,85,.45)]"
              style={style}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {/* footer band */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl px-3.5 py-2.5 sm:grid-cols-3 lg:grid-cols-5" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.5)" }}>
        {FOOTER.map((f) => (
          <div key={f.t} className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ border: "1.5px solid rgba(255,70,85,.4)" }}><BIcon name={f.icon} size={16} /></span>
            <div><div className="text-[12.5px] font-bold leading-tight">{f.t}</div><div className="line-clamp-1 text-[10.5px]" style={{ color: "#8e7f81" }}>{f.d}</div></div>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
