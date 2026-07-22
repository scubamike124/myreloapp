"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Menu button for the app shell.
//
// AppShell's icon rail is `hidden md:flex`, and it is the only navigation
// there — so below 768px /dashboard, /trends, /account and friends had no way
// to reach anything else. Measured before this existed: 0 nav links reachable
// at 390px on those routes.
//
// Its own client component because the drawer needs state and AppShell is a
// server component.
// ---------------------------------------------------------------------------

export type AppNavLink = { key: string; href: string; title: string };

export default function AppMobileNav({ links, active }: { links: AppNavLink[]; active: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="app-mobile-nav"
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-white/5 md:hidden"
        style={{ border: "1px solid rgba(255,70,85,.24)", background: "rgba(14,7,9,.86)", backdropFilter: "blur(6px)" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e8d9db" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div aria-hidden onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

          <div
            id="app-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            className="absolute inset-y-0 left-0 flex w-[262px] max-w-[86vw] flex-col border-r border-white/10 p-4"
            style={{ background: "linear-gradient(180deg,rgba(18,8,10,.98),rgba(8,4,5,.98))" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <span
                  className="font-display grid h-9 w-9 place-items-center rounded-lg text-lg font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 18px rgba(225,29,42,.55)" }}
                >
                  R
                </span>
                <span className="font-display text-lg font-bold text-white">Reelo</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {links.map((n) => {
                const on = n.key === active;
                return (
                  <Link
                    key={n.key}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={on ? "page" : undefined}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${on ? "" : "hover:bg-white/5"}`}
                    style={
                      on
                        ? { color: "#fff", background: "linear-gradient(135deg,rgba(255,54,69,.22),rgba(196,16,28,.14))", border: "1px solid rgba(255,70,85,.4)" }
                        : { color: "#b9a9ab" }
                    }
                  >
                    {n.title}
                  </Link>
                );
              })}
            </nav>

            {/* Support lives here too: it is the one thing someone stuck on a
                phone most needs to find. */}
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: "#ff8892", border: "1px solid rgba(255,70,85,.24)" }}
            >
              Help &amp; support
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
