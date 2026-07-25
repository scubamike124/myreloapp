import Image from "next/image";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import SoonBanner from "@/components/design/SoonBanner";

export const metadata = { title: "Scheduling — Reelo" };

const STATS: { icon: IconKey; v: string; l: string }[] = [
  { icon: "calendar", v: "12", l: "Scheduled" },
  { icon: "clock", v: "3", l: "Today" },
  { icon: "growth", v: "28", l: "Published This Month" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FIRST_OFFSET = 1; // June 2026 starts on Monday
const DAYS = 30;
const EVENTS: Record<number, number> = { 3: 1, 9: 2, 14: 1, 21: 3, 27: 1, 29: 2 };
const TODAY = 28;

const UPCOMING = [
  { t: "Summer Sale Promo", when: "Today · 5:00 PM", platform: "TikTok · Instagram", img: "/assets/product.jpg" },
  { t: "AI Avatar Weekly Tips", when: "Tomorrow · 9:00 AM", platform: "YouTube", img: "/assets/spokesperson.jpg" },
  { t: "Product Showcase", when: "Jun 30 · 12:00 PM", platform: "All platforms", img: "/assets/product-skincare.jpg" },
  { t: "Dance Challenge Repost", when: "Jul 1 · 6:30 PM", platform: "TikTok", img: "/assets/dancing.jpg" },
];

export default function SchedulingPage() {
  const cells: (number | null)[] = [...Array(FIRST_OFFSET).fill(null), ...Array.from({ length: DAYS }, (_, i) => i + 1)];

  return (
    <BusinessShell active="scheduling" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Scheduling</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Schedule posts and never miss a beat.</p>
      </div>

      <SoonBanner feature="Scheduling" />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {STATS.map((s) => (
          <div key={s.l} className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={22} />
            <div><div className="font-display text-2xl font-bold">{s.v}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* calendar */}
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-display font-bold">June 2026</span>
            <div className="flex gap-2 text-white/50">
              <BIcon name="play" size={14} glow={false} color="#9a8b8d" />
            </div>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold" style={{ color: "#8e7f81" }}>
            {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <div key={i} className="relative grid aspect-square place-items-center rounded-lg text-sm" style={d == null ? {} : d === TODAY ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff", fontWeight: 700 } : { border: "1px solid rgba(255,70,85,.1)", color: "#cabcbe" }}>
                {d}
                {d && EVENTS[d] && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {Array.from({ length: EVENTS[d] }).map((_, k) => <span key={k} className="h-1 w-1 rounded-full" style={{ background: d === TODAY ? "#fff" : "#ff5663" }} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* upcoming */}
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
          <div className="font-display mb-3 font-bold">Upcoming Posts</div>
          <div className="flex flex-col gap-2.5">
            {UPCOMING.map((u) => (
              <div key={u.t} className="flex items-center gap-3 rounded-xl p-2" style={{ border: "1px solid rgba(255,70,85,.1)" }}>
                <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg"><Image src={u.img} alt="" fill sizes="56px" className="object-cover" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{u.t}</div><div className="text-[11px]" style={{ color: "#8e7f81" }}>{u.platform}</div></div>
                <span className="shrink-0 text-[11px] font-semibold" style={{ color: "#ff8a92" }}>{u.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BusinessShell>
  );
}
