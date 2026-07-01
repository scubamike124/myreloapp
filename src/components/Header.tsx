"use client";

import { useState } from "react";
import Link from "next/link";

export const NAV = [
  { label: "Create", href: "/create" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export const EXPLORE: { group: string; items: { label: string; href: string }[] }[] = [
  {
    group: "Phase 1 · Core Creation Studio",
    items: [
      { label: "AI Avatars", href: "/create/ai-avatar-studio" },
      { label: "Talking Photos", href: "/create/talking-photo" },
      { label: "Dancing Photos", href: "/create/dancing-photo" },
      { label: "AI Voices", href: "/create/revoice" },
      { label: "AI Videos", href: "/create" },
      { label: "Commercials & Product Videos", href: "/create/product-commercial" },
      { label: "20 Shorts from One Description", href: "/create/shorts-20" },
    ],
  },
  {
    group: "Phase 2 · Growth & Engagement",
    items: [
      { label: "Avatar Battles", href: "/battles" },
      { label: "Groups & Social", href: "/community" },
      { label: "Trend AI – What's Working Now", href: "/trends" },
      { label: "Greeting Videos (Birthdays, Holidays)", href: "/create/story-memory-generator" },
      { label: "Revenge Videos", href: "/battles" },
      { label: "Leaderboards & Challenges", href: "/competitions" },
    ],
  },
  {
    group: "Phase 3 · Scale & Automation",
    items: [
      { label: "TikTok/Instagram/YouTube Scheduling", href: "/business-center/scheduling" },
      { label: "Advanced Analytics", href: "/business-center/analytics" },
      { label: "Batch Creation & Queue", href: "/create/shorts-20" },
      { label: "AI Story Maker (Episodic Videos)", href: "/create/ai-story-maker" },
      { label: "Product Commercial Engine", href: "/create/product-commercial" },
      { label: "Enterprise & Team Tools", href: "/business-center/pro" },
    ],
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 22px rgba(225,29,42,.55)" }}>R</span>
          <span className="font-display text-xl font-bold tracking-tight text-white">Reelo</span>
        </Link>

        <button aria-label="Toggle menu" onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white transition-colors hover:bg-white/5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /> : <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-[100] max-h-[80vh] overflow-y-auto border-t border-white/10 bg-black/95 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">{item.label}</Link>
            ))}
            {EXPLORE.map((sec) => (
              <div key={sec.group} className="mt-2 border-t border-white/10 pt-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#ff5663" }}>{sec.group}</div>
                {sec.items.map((it) => (
                  <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">{it.label}</Link>
                ))}
              </div>
            ))}
            <Link href="/roadmap" onClick={() => setOpen(false)} className="mt-2 rounded-lg border-t border-white/10 px-3 pt-3 text-sm font-semibold" style={{ color: "#ff8a92" }}>View full roadmap →</Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-white/80">Sign in</Link>
              <Link href="/create" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Get Started</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
