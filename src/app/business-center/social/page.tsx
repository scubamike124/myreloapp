import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";

export const metadata = { title: "Social — Reelo" };

const STATS: { icon: IconKey; v: string; l: string }[] = [
  { icon: "users", v: "248K", l: "Total Followers" },
  { icon: "heart", v: "8.7%", l: "Avg Engagement" },
  { icon: "growth", v: "+12.4K", l: "New This Month" },
  { icon: "calendar", v: "12", l: "Scheduled Posts" },
];

const CHANNELS = [
  { name: "TikTok", handle: "@reelomaster", followers: "124K", connected: true, c: "#ff3645" },
  { name: "Instagram", handle: "@reelo.app", followers: "89K", connected: true, c: "#ff4a57" },
  { name: "YouTube", handle: "Reelo Studio", followers: "35K", connected: true, c: "#ff2d3f" },
  { name: "Facebook", handle: "Connect your page", followers: "—", connected: false, c: "#9a8b8d" },
  { name: "X", handle: "Connect your profile", followers: "—", connected: false, c: "#9a8b8d" },
  { name: "LinkedIn", handle: "Connect your page", followers: "—", connected: false, c: "#9a8b8d" },
];

export default function SocialPage() {
  return (
    <BusinessShell active="social" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Social</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Connect and grow your social channels.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={24} />
            <div><div className="font-display text-2xl font-bold">{s.v}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-3 font-display text-lg font-bold">Connected Channels</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((ch) => (
          <div key={ch.name} className="flex items-center gap-3.5 rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}>
            <span className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: `linear-gradient(135deg,${ch.c},#1a0a0c)`, border: "1px solid rgba(255,70,85,.3)" }}>{ch.name[0]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{ch.name}</div>
              <div className="truncate text-xs" style={{ color: "#8e7f81" }}>{ch.handle}{ch.connected && ` · ${ch.followers}`}</div>
            </div>
            {ch.connected ? (
              <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ color: "#5fd08a", background: "rgba(95,208,138,.14)" }}>Connected</span>
            ) : (
              <button disabled title="Social account connections aren't available yet" className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Connect</button>
            )}
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
