import Image from "next/image";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon from "@/components/design/BIcon";

export const metadata = { title: "Publishing — Reelo" };

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "X"];

const PUBLISHED = [
  { t: "AI Talking Avatars for Business", platforms: "TikTok · Instagram", time: "2 min ago", status: "Published", img: "/assets/spokesperson.jpg" },
  { t: "Summer Sale Promo", platforms: "All platforms", time: "Tomorrow 9:00 AM", status: "Scheduled", img: "/assets/product.jpg" },
  { t: "Product Showcase Video", platforms: "YouTube", time: "3 hours ago", status: "Published", img: "/assets/product-skincare.jpg" },
  { t: "New Collection Announcement", platforms: "Draft", time: "Not published", status: "Draft", img: "/assets/commercials.jpg" },
];
const STATUS: Record<string, string> = { Published: "#5fd08a", Scheduled: "#5fb0ff", Draft: "#9a8b8d" };

export default function PublishingPage() {
  return (
    <BusinessShell active="publishing" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Publishing</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Publish your content everywhere from one place.</p>
      </div>

      {/* composer */}
      <div className="mb-6 rounded-2xl p-5 sm:p-6" style={{ border: "1px solid rgba(255,70,85,.22)", background: "linear-gradient(180deg,rgba(24,9,12,.55),rgba(10,5,7,.5))" }}>
        <div className="mb-3 font-display font-bold">New Post</div>
        <textarea
          rows={3}
          placeholder="What do you want to publish today?"
          className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-white placeholder-white/35 outline-none"
          style={{ border: "1px solid rgba(255,70,85,.22)" }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: "#8e7f81" }}>Publish to:</span>
          {PLATFORMS.map((p, i) => (
            <span key={p} className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold" style={i < 2 ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" } : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}>{p}</span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled title="Publishing isn't connected yet" className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 20px -6px rgba(225,29,42,.6)" }}>
            <BIcon name="rocket" size={16} color="#fff" glow={false} /> Publish Now
          </button>
          <button disabled title="Scheduling isn't connected yet" className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50" style={{ border: "1px solid rgba(255,70,85,.3)", color: "#f3e9e9" }}>
            <BIcon name="calendar" size={16} glow={false} /> Schedule
          </button>
        </div>
      </div>

      {/* recent */}
      <div className="mb-3 font-display text-lg font-bold">Recent Posts</div>
      <div className="flex flex-col gap-2.5">
        {PUBLISHED.map((p) => (
          <div key={p.t} className="flex items-center gap-3.5 rounded-2xl p-3" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image src={p.img} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{p.t}</div>
              <div className="text-xs" style={{ color: "#8e7f81" }}>{p.platforms} · {p.time}</div>
            </div>
            <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ color: STATUS[p.status], background: `${STATUS[p.status]}1f` }}>{p.status}</span>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
