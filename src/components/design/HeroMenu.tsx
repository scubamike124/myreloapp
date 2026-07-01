"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV, EXPLORE } from "@/components/Header";

export default function HeroMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mb-9 flex items-center">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 22px rgba(225,29,42,.55)" }}>R</span>
        <span className="font-display text-xl font-bold tracking-tight text-white">Reelo</span>
      </Link>

      <button aria-label="Toggle menu" onClick={() => setOpen((v) => !v)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white transition-colors hover:bg-white/5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /> : <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-2 max-h-[70vh] w-[min(92vw,560px)] overflow-y-auto rounded-2xl border border-white/10 bg-black/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
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
          </div>
        </div>
      )}
    </div>
  );
}
