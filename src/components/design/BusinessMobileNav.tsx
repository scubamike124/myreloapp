"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BIcon, { type IconKey } from "@/components/design/BIcon";

// ---------------------------------------------------------------------------
// Business Center navigation for narrow screens.
//
// The sidebar in BusinessShell is `hidden lg:flex`, and it is the only nav in
// that shell — so below 1024px there was no way to move between sections at
// all. A previous attempt solved this with an always-visible bar across the
// top, which changed how the pages looked. This is the quieter fix: one small
// button that is invisible until tapped, so the layout is untouched.
//
// It lives in its own client component because the drawer needs state and
// BusinessShell is a server component.
// ---------------------------------------------------------------------------

export type MobileNavItem = { key: string; label: string; href: string; icon: IconKey; badge?: string | null };

export default function BusinessMobileNav({
  items,
  active,
}: {
  items: MobileNavItem[];
  active: string;
}) {
  const [open, setOpen] = useState(false);

  // Escape closes, and the page must not scroll behind an open drawer.
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
        aria-label="Open Business Center menu"
        aria-expanded={open}
        aria-controls="business-mobile-nav"
        // mr-auto keeps it left while the profile chip stays right; lg:hidden
        // removes it entirely on desktop, leaving that row exactly as it was.
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-white/5 lg:hidden"
        style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.6)" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e8d9db" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          <div
            id="business-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Business Center sections"
            className="absolute inset-y-0 left-0 flex w-[268px] max-w-[86vw] flex-col border-r border-white/10 p-4"
            style={{ background: "linear-gradient(180deg,rgba(18,8,10,.98),rgba(8,4,5,.98))" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white">Business Center</span>
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
              {items.map((n) => {
                const on = n.key === active;
                return (
                  <Link
                    key={n.key}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${on ? "" : "hover:bg-white/5"}`}
                    style={
                      on
                        ? { color: "#fff", background: "linear-gradient(135deg,rgba(255,54,69,.22),rgba(196,16,28,.14))", border: "1px solid rgba(255,70,85,.4)" }
                        : { color: "#b9a9ab" }
                    }
                  >
                    <BIcon name={n.icon} size={18} color={on ? "#ff5663" : "#9a8b8d"} glow={on} />
                    {n.label}
                    {n.badge && (
                      <span
                        className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={
                          n.badge === "SOON"
                            ? { color: "#c98", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }
                            : { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        }
                      >
                        {n.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
