"use client";

import { useState } from "react";
import Image from "next/image";
import DesignShell from "@/components/design/DesignShell";

const STATS = [
  { v: "128K", l: "Creators" },
  { v: "2.4M", l: "Videos Shared" },
  { v: "412", l: "Active Challenges" },
];

const CREATORS = [
  { name: "Ava Reyes", handle: "@avacreates", followers: "48.2K", img: "/assets/talking-selfie.jpg" },
  { name: "Leo Marsh", handle: "@leomarsh", followers: "39.1K", img: "/assets/spokesperson.jpg" },
  { name: "Nina Cole", handle: "@ninacole", followers: "31.7K", img: "/assets/avatar-business.jpg" },
  { name: "Maya Stone", handle: "@mayastone", followers: "27.5K", img: "/assets/talking-photo.jpg" },
];

const CHALLENGES = [
  { title: "#TalkingPetChallenge", entries: "12.4K entries", img: "/assets/dancing.jpg" },
  { title: "#30SecondAd", entries: "8.9K entries", img: "/assets/product.jpg" },
  { title: "#FamilyStory", entries: "6.1K entries", img: "/assets/dancing-grandpa.jpg" },
];

const FEED = [
  { who: "Ava Reyes", action: "shared a new Dancing Photo", when: "5m ago", img: "/assets/talking-selfie.jpg" },
  { who: "Nina Cole", action: "shared a new Talking Photo", when: "22m ago", img: "/assets/avatar-business.jpg" },
  { who: "Maya Stone", action: "joined #FamilyStory challenge", when: "1h ago", img: "/assets/talking-photo.jpg" },
];

export default function CommunityPage() {
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const toggle = (n: string) => setFollowing((f) => ({ ...f, [n]: !f[n] }));

  return (
    <DesignShell glow="radial-gradient(900px 450px at 50% -10%,rgba(225,29,42,.2),transparent 65%)">
      <section className="mx-auto max-w-[1100px] px-6 pb-2 pt-10 text-center">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ff5663" }}>Community</div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Create together. <span style={{ color: "#ff2d3f" }}>Grow together.</span></h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[16px]" style={{ color: "#a99a9c" }}>Follow creators, join challenges, and share your best work.</p>
        <div className="mx-auto mt-6 flex max-w-[520px] justify-center gap-3">
          {STATS.map((s) => (
            <div key={s.l} className="flex-1 rounded-2xl px-3 py-3" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
              <div className="font-display text-2xl font-bold">{s.v}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
        {/* trending challenges */}
        <h2 className="font-display mb-3 text-lg font-bold">Trending Challenges</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CHALLENGES.map((c) => (
            <div key={c.title} className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10">
              <Image src={c.img} alt="" fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4"><div className="font-display font-bold">{c.title}</div><div className="text-xs" style={{ color: "#cabcbe" }}>{c.entries}</div></div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* top creators */}
          <div>
            <h2 className="font-display mb-3 text-lg font-bold">Top Creators</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CREATORS.map((c) => { const on = following[c.name]; return (
                <div key={c.name} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full"><Image src={c.img} alt="" fill sizes="44px" className="object-cover" /></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{c.name}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{c.handle} · {c.followers}</div></div>
                  <button onClick={() => toggle(c.name)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors" style={on ? { border: "1px solid rgba(255,70,85,.3)", color: "#ff8a92" } : { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" }}>{on ? "Following" : "Follow"}</button>
                </div>
              ); })}
            </div>
          </div>

          {/* activity feed */}
          <div>
            <h2 className="font-display mb-3 text-lg font-bold">Community Feed</h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
              {FEED.map((f) => (
                <div key={f.who + f.when} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full"><Image src={f.img} alt="" fill sizes="36px" className="object-cover" /></div>
                  <div className="min-w-0 flex-1 text-[13px]"><span className="font-semibold">{f.who}</span> <span style={{ color: "#a99a9c" }}>{f.action}</span></div>
                  <span className="shrink-0 text-[11px]" style={{ color: "#8e7f81" }}>{f.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DesignShell>
  );
}
