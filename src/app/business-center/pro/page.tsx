import Link from "next/link";
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
const CARDS: { n: number; icon: IconKey; t: string; d: string; href?: string; planned?: boolean }[] = [
  { n: 1, icon: "chip", t: "Advanced AI Suite", d: "Access the most powerful AI models for videos, voices, scripts and more.", href: "/create" },
  { n: 2, icon: "users", t: "Team Collaboration", d: "Invite unlimited team members and work together in real time.", planned: true },
  { n: 3, icon: "lock", t: "Brand Vault Pro", d: "Store unlimited brands, templates, logos, fonts and color palettes.", planned: true },
  { n: 4, icon: "layers", t: "Content Templates", d: "Access 1000+ premium templates for every industry and niche.", planned: true },
  { n: 5, icon: "grid", t: "Bulk Creation", d: "Create hundreds of videos at once with bulk upload, scripts and automation.", planned: true },
  { n: 6, icon: "cc", t: "Auto Subtitles", d: "Auto-generate accurate subtitles in 100+ languages.", planned: true },
  { n: 7, icon: "mic", t: "Voice Cloning Pro", d: "Clone voices or create custom AI voices for your brand.", planned: true },
  { n: 8, icon: "globe", t: "Translate & Dub", d: "Translate and dub your videos into 100+ languages instantly.", planned: true },
  { n: 9, icon: "scissors", t: "Smart Cut & Edit", d: "AI-powered editing tools to cut, trim and enhance videos automatically.", planned: true },
  { n: 10, icon: "image", t: "Thumbnail Maker", d: "AI creates high-converting thumbnails that get more clicks.", planned: true },
  { n: 11, icon: "stack", t: "Stock Media Pro", d: "Unlimited access to premium stock videos, images and music.", planned: true },
  { n: 12, icon: "magic", t: "Background Remover", d: "Remove or replace backgrounds with one click.", planned: true },
  { n: 13, icon: "pen", t: "AI Script Writer", d: "Generate viral scripts, hooks and captions in seconds.", href: "/create/shorts-20" },
  { n: 14, icon: "refresh", t: "Automated Reposting", d: "Automatically repost your best content across all platforms.", planned: true },
  { n: 15, icon: "chart", t: "Detailed Analytics", d: "Deep insights on every video, audience and revenue stream.", planned: true },
  { n: 16, icon: "target", t: "Competitor Tracker", d: "Track competitors, keywords and top performing content.", planned: true },
  { n: 17, icon: "contact", t: "Lead Capture & CRM", d: "Capture leads, manage contacts and nurture your audience.", planned: true },
  { n: 18, icon: "tag", t: "White Label Options", d: "Rebrand Reelo with your own logo, domain and custom colors.", planned: true },
  { n: 19, icon: "code", t: "API Access", d: "Integrate Reelo with your apps and workflows using our API.", planned: true },
  { n: 20, icon: "plug", t: "Webhooks", d: "Connect and automate with 3rd party apps seamlessly.", planned: true },
  { n: 21, icon: "cloud", t: "Unlimited Storage", d: "Store all your videos, assets and projects with no limits.", planned: true },
  { n: 22, icon: "gauge", t: "Priority Rendering", d: "Your videos render faster with top priority servers.", planned: true },
  { n: 23, icon: "doc", t: "Detailed Revenue Reports", d: "Track earnings, refunds and growth with detailed financial reports.", planned: true },
  { n: 24, icon: "headset", t: "Dedicated Account Manager", d: "Get a dedicated expert to help you grow and succeed.", planned: true },
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
      <div className="relative mb-6 overflow-hidden rounded-2xl px-6 py-8 text-center" style={{ border: "1px solid rgba(255,70,85,.22)", background: "radial-gradient(700px 220px at 50% -20%,rgba(225,29,42,.32),transparent 70%),rgba(12,6,8,.6)" }}>
        <h1 className="font-display relative flex items-center justify-center gap-3 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
          Business Center <span style={{ color: "#ff2d3f" }}>Pro</span>
          <BIcon name="crown" size={34} />
        </h1>
        <p className="relative mt-2 text-[15px]" style={{ color: "#cabcbe" }}>Unlock the full power of Reelo and scale your content empire.</p>
      </div>

      {/* highlights */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {HIGHLIGHTS.map((h) => (
          <div key={h.t} className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={h.icon} size={26} />
            <div><div className="font-display text-[15px] font-bold leading-tight">{h.t}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>{h.d}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-5 text-center font-display text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#ff2d3f" }}>
        Everything Included in Business Center Pro
      </div>

      {/* 24 cards. Nine open something that works today; the rest are labelled
          PLANNED, because a card that looks clickable and is not is worse than
          one that tells you where it stands. */}
      <div className="mb-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((c) => {
          const inner = (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.5)", color: "#ff5663" }}>{c.n}</span>
                <BIcon name={c.icon} size={24} />
              </div>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-wide">{c.t}</h3>
              <p className="mt-1 text-[12px] leading-[1.45]" style={{ color: "#9a8b8d" }}>{c.d}</p>
              {c.planned ? (
                <span className="mt-2 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ color: "#c98", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>Planned</span>
              ) : (
                <span className="mt-2 inline-block text-[11px] font-bold" style={{ color: "#ff5663" }}>Open now →</span>
              )}
            </>
          );
          const style = { border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" };
          // Every card is clickable, and none of them lies about where it goes:
          // a built feature opens itself, a planned one opens the roadmap.
          return (
            <Link
              key={c.n}
              href={c.href ?? "/roadmap"}
              className="relative block rounded-2xl p-4 transition-all hover:-translate-y-1 hover:border-[rgba(255,70,85,.45)]"
              style={style}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {/* footer band */}
      <div className="grid grid-cols-1 gap-5 rounded-2xl px-6 py-5 sm:grid-cols-2 lg:grid-cols-5" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.5)" }}>
        {FOOTER.map((f) => (
          <div key={f.t} className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ border: "1.5px solid rgba(255,70,85,.4)" }}><BIcon name={f.icon} size={20} /></span>
            <div><div className="text-sm font-bold">{f.t}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{f.d}</div></div>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
