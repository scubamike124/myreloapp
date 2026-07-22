import Image from "next/image";
import Link from "next/link";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";

export const metadata = { title: "Business Center — Reelo" };

function Skyline() {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full opacity-40" aria-hidden>
      <g fill="rgba(120,12,18,.5)">
        {Array.from({ length: 40 }).map((_, i) => {
          const w = 22 + ((i * 17) % 20);
          const h = 30 + ((i * 53) % 70);
          return <rect key={i} x={i * 30} y={120 - h} width={w} height={h} />;
        })}
      </g>
    </svg>
  );
}

const STATS: { icon: IconKey; value: string; label: string }[] = [
  { icon: "film", value: "128", label: "Videos Created" },
  { icon: "eye", value: "1.2M", label: "Total Views" },
  { icon: "heart", value: "85.6K", label: "Likes" },
  { icon: "growth", value: "24.5K", label: "Shares" },
  { icon: "dollar", value: "$12.4K", label: "Revenue" },
];

const CARDS: { n: number; icon: IconKey; title: string; desc: string; badge?: string; href?: string }[] = [
  { n: 1, icon: "pen", title: "Create", desc: "Make amazing videos in minutes.", href: "/create" },
  { n: 2, icon: "film", title: "Video Library", desc: "Manage and organize all your creations.", href: "/library" },
  { n: 3, icon: "palette", title: "Brand Kit", desc: "Store your logos, colors, fonts, and brand assets." },
  { n: 4, icon: "folder", title: "Assets", desc: "Access and manage all your media and resources.", badge: "NEW" },
  { n: 5, icon: "share", title: "Social", desc: "Connect and grow your social channels.", href: "/business-center/social" },
  { n: 6, icon: "rocket", title: "Publishing", desc: "Publish your content everywhere.", href: "/business-center/publishing" },
  { n: 7, icon: "calendar", title: "Scheduling", desc: "Schedule posts and never miss a beat.", href: "/business-center/scheduling" },
  { n: 8, icon: "chart", title: "Analytics", desc: "Track performance and grow faster.", href: "/business-center/analytics" },
  { n: 9, icon: "dollar", title: "Revenue", desc: "Monitor earnings and growth.", href: "/business-center/revenue" },
  { n: 10, icon: "brain", title: "Trend AI", desc: "Discover trending topics and ideas.", href: "/trends" },
  { n: 11, icon: "crown", title: "Hub Pro", desc: "Unlock all pro tools and advanced features.", href: "/business-center/pro" },
];

const ACTIVITY = [
  { t: "AI Talking Avatars for Business", time: "2 min ago", status: "Published", img: "/assets/spokesperson.jpg" },
  { t: "Summer Sale Promo", time: "1 hour ago", status: "Scheduled", img: "/assets/product.jpg" },
  { t: "Product Showcase Video", time: "3 hours ago", status: "Published", img: "/assets/product-skincare.jpg" },
  { t: "New Collection Announcement", time: "5 hours ago", status: "Draft", img: "/assets/commercials.jpg" },
];
const STATUS: Record<string, string> = { Published: "#5fd08a", Scheduled: "#5fb0ff", Draft: "#9a8b8d" };

const QUICK: { icon: IconKey; label: string }[] = [
  { icon: "film", label: "New Video" }, { icon: "upload", label: "Upload Media" }, { icon: "bolt", label: "Create Short" },
  { icon: "users", label: "AI Avatar" }, { icon: "doc", label: "Video to Script" }, { icon: "refresh", label: "Clone Video" },
];

const FOOTER: { icon: IconKey; t: string; d: string }[] = [
  { icon: "layers", t: "All-in-One Platform", d: "Everything you need in one place." },
  { icon: "clock", t: "Save Time", d: "Powerful tools to work smarter." },
  { icon: "growth", t: "Grow Faster", d: "Create more. Engage more. Earn more." },
  { icon: "chip", t: "AI Powered", d: "Next-gen AI to boost your content." },
];

function Tile({ icon }: { icon: IconKey }) {
  return (
    <div className="mb-3 grid h-[84px] place-items-center rounded-xl" style={{ background: "radial-gradient(circle at 50% 40%,rgba(225,29,42,.16),transparent 70%)", border: "1px solid rgba(255,70,85,.12)" }}>
      <BIcon name={icon} size={38} />
    </div>
  );
}

export default function BusinessCenterPage() {
  return (
    <BusinessShell active="overview" variant="overview">
      {/* header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl px-6 py-8 text-center" style={{ border: "1px solid rgba(255,70,85,.18)", background: "radial-gradient(700px 220px at 50% -20%,rgba(225,29,42,.3),transparent 70%),rgba(12,6,8,.6)" }}>
        <Skyline />
        <h1 className="font-display relative text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Business Center</h1>
        <p className="relative mt-2 text-[15px]" style={{ color: "#cabcbe" }}>Everything you need to create, manage, and grow your content empire.</p>
      </div>

      {/* stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={26} />
            <div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs" style={{ color: "#8e7f81" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* feature cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CARDS.map((c) => {
          const inner = (
            <>
              <span className="absolute left-3 top-3 grid h-6 w-6 place-items-center rounded-full text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.5)", color: "#ff5663" }}>{c.n}</span>
              {c.badge && <span className="absolute right-3 top-3 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase" style={c.badge === "NEW" ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" } : { color: "#c98", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>{c.badge}</span>}
              <Tile icon={c.icon} />
              <h3 className="font-display text-base font-bold">{c.title}</h3>
              <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: "#9a8b8d" }}>{c.desc}</p>
            </>
          );
          const cls = "relative block rounded-2xl p-4 transition-all hover:-translate-y-1 hover:border-[rgba(255,70,85,.45)]";
          const st = { border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" };
          return c.href
            ? <Link key={c.n} href={c.href} className={cls} style={st}>{inner}</Link>
            : <div key={c.n} className={cls} style={st}>{inner}</div>;
        })}
      </div>

      {/* activity / quick / whatsnew */}
      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="mb-3 flex items-center justify-between"><span className="font-display font-bold">Recent Activity</span><span className="text-xs" style={{ color: "#ff5663" }}>View All</span></div>
          <div className="flex flex-col gap-2.5">
            {ACTIVITY.map((a) => (
              <div key={a.t} className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg">
                  <Image src={a.img} alt="" fill sizes="36px" className="object-cover" />
                  <span className="relative grid h-full w-full place-items-center bg-black/30"><BIcon name="play" size={12} color="#fff" glow={false} /></span>
                </span>
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{a.t}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>{a.time}</div></div>
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: STATUS[a.status], background: `${STATUS[a.status]}1f` }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="font-display mb-3 font-bold">Quick Actions</div>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK.map((q) => (
              <div key={q.label} className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center" style={{ border: "1px solid rgba(255,70,85,.14)" }}>
                <BIcon name={q.icon} size={20} />
                <span className="text-[11px] font-medium leading-tight">{q.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.24)", background: "radial-gradient(360px 160px at 90% 10%,rgba(225,29,42,.2),transparent 70%),rgba(14,6,8,.55)" }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-display font-bold">What&apos;s New in Reelo</span>
            <Link href="/roadmap" className="text-xs hover:underline" style={{ color: "#ff5663" }}>Roadmap</Link>
          </div>
          {/* Was badged NEW with a "Try It Now" button for a feature that does
              not exist. It is on the roadmap, so it is labelled as such. */}
          <span className="mt-2 w-fit rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: "#c98", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)" }}>PLANNED</span>
          <div className="font-display mt-2 text-2xl font-extrabold leading-none">ASSETS<br />MANAGER</div>
          <p className="mt-2 text-[13px]" style={{ color: "#a99a9c" }}>Organize, find, and reuse your media faster than ever.</p>
          <Link href="/roadmap" className="mt-3 w-fit rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>See the roadmap</Link>
        </div>
      </div>

      {/* footer band */}
      <div className="grid grid-cols-1 gap-5 rounded-2xl px-6 py-5 sm:grid-cols-2 lg:grid-cols-4" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.5)" }}>
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
