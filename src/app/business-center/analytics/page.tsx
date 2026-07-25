import Image from "next/image";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import SoonBanner from "@/components/design/SoonBanner";

export const metadata = { title: "Analytics — Reelo" };

const STATS: { icon: IconKey; v: string; l: string; delta: string }[] = [
  { icon: "eye", v: "1.2M", l: "Total Views", delta: "↑ 31% this month" },
  { icon: "clock", v: "48.5K", l: "Watch Hours", delta: "↑ 22% this month" },
  { icon: "heart", v: "8.7%", l: "Avg Engagement", delta: "↑ 19% this month" },
  { icon: "users", v: "248K", l: "Followers", delta: "↑ 12.4K new" },
];

const TOP = [
  { t: "AI Talking Avatars for Business", views: "284K", eng: "11.2%", img: "/assets/spokesperson.jpg" },
  { t: "Dance Challenge Promo", views: "176K", eng: "9.8%", img: "/assets/dancing.jpg" },
  { t: "Product Showcase Video", views: "142K", eng: "8.1%", img: "/assets/product.jpg" },
  { t: "Website Commercial", views: "98K", eng: "7.4%", img: "/assets/commercials.jpg" },
];

const PLATFORMS = [
  { name: "TikTok", pct: 46 },
  { name: "Instagram", pct: 28 },
  { name: "YouTube", pct: 18 },
  { name: "Facebook", pct: 8 },
];

export default function AnalyticsPage() {
  return (
    <BusinessShell active="analytics" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Analytics</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Track performance and grow faster.</p>
      </div>

      <SoonBanner feature="Analytics" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={22} />
            <div className="font-display mt-2 text-2xl font-bold">{s.v}</div>
            <div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
            <div className="mt-1 text-[11px]" style={{ color: "#5fd08a" }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* views chart */}
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="mb-3 flex items-center justify-between"><span className="font-display font-bold">Views Trend</span><span className="text-xs" style={{ color: "#8e7f81" }}>Last 30 days</span></div>
          <svg viewBox="0 0 600 170" className="h-44 w-full" preserveAspectRatio="none">
            <defs><linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,70,85,.4)" /><stop offset="1" stopColor="rgba(255,70,85,0)" /></linearGradient></defs>
            <path d="M0 140 L75 120 L150 128 L225 95 L300 102 L375 64 L450 72 L525 38 L600 22" fill="none" stroke="#ff3645" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 140 L75 120 L150 128 L225 95 L300 102 L375 64 L450 72 L525 38 L600 22 L600 170 L0 170 Z" fill="url(#av)" />
          </svg>
        </div>

        {/* platform breakdown */}
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="font-display mb-4 font-bold">Traffic by Platform</div>
          <div className="flex flex-col gap-3.5">
            {PLATFORMS.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex justify-between text-xs"><span style={{ color: "#cabcbe" }}>{p.name}</span><span className="font-semibold" style={{ color: "#ff8a92" }}>{p.pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,70,85,.12)" }}>
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* top videos */}
      <div className="mb-3 font-display text-lg font-bold">Top Performing Videos</div>
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
        {TOP.map((v, i) => (
          <div key={v.t} className="flex items-center gap-3.5 border-b border-white/5 px-4 py-3 last:border-0">
            <span className="font-display w-5 text-sm font-bold" style={{ color: "#ff5663" }}>{i + 1}</span>
            <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg"><Image src={v.img} alt="" fill sizes="56px" className="object-cover" /></div>
            <div className="min-w-0 flex-1 truncate text-sm font-semibold">{v.t}</div>
            <div className="text-right"><div className="text-sm font-bold">{v.views}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>views</div></div>
            <div className="hidden text-right sm:block"><div className="text-sm font-bold" style={{ color: "#5fd08a" }}>{v.eng}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>engagement</div></div>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
