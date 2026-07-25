import BusinessShell from "@/components/design/BusinessShell";
import SoonBanner from "@/components/design/SoonBanner";

export const metadata = { title: "Social — Reelo" };

const CHANNELS = [
  { name: "TikTok", handle: "Connect your account", c: "#ff3645" },
  { name: "Instagram", handle: "Connect your account", c: "#ff4a57" },
  { name: "YouTube", handle: "Connect your channel", c: "#ff2d3f" },
  { name: "Facebook", handle: "Connect your page", c: "#9a8b8d" },
  { name: "X", handle: "Connect your profile", c: "#9a8b8d" },
  { name: "LinkedIn", handle: "Connect your page", c: "#9a8b8d" },
];

export default function SocialPage() {
  return (
    <BusinessShell active="social" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Social</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Connect and grow your social channels.</p>
      </div>

      <SoonBanner feature="Social connections" />

      <div className="mb-3 font-display text-lg font-bold">Channels</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((ch) => (
          <div key={ch.name} className="flex items-center gap-3.5 rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}>
            <span className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: `linear-gradient(135deg,${ch.c},#1a0a0c)`, border: "1px solid rgba(255,70,85,.3)" }}>{ch.name[0]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{ch.name}</div>
              <div className="truncate text-xs" style={{ color: "#8e7f81" }}>{ch.handle}</div>
            </div>
            <button disabled title="Social account connections aren't available yet" className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Connect</button>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
