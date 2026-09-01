"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type State = {
  configured: boolean;
  user: { id: string; email: string; name: string | null; role?: "USER" | "ADMIN" | "OWNER" } | null;
};

/**
 * A persistent sign-in/out control at the top of every page, not buried on
 * /account. Same data source as TokenPanel (/api/auth GET) -- this is
 * deliberately a second, independent reader of that same state rather than
 * plumbing it through every page, so it can be mounted once, globally, next
 * to AmberDock.
 */
export default function AuthBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch {
        if (!cancelled) setState({ configured: false, user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Both pages already have their own sign-in control front and center;
  // a second one floating in the corner is redundant, not helpful.
  if (pathname === "/login" || pathname === "/signup") return null;
  if (!state || !state.configured) return null;

  const signOut = async () => {
    setBusy(true);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setBusy(false);
    router.push("/");
    router.refresh();
  };

  const pillStyle = {
    border: "1px solid rgba(255,70,85,.25)",
    background: "rgba(14,6,8,.75)",
    backdropFilter: "blur(6px)",
  } as const;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-end p-3 sm:p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px]" style={pillStyle}>
        {state.user ? (
          <>
            <span className="max-w-[140px] truncate font-semibold text-white/85">{state.user.name || state.user.email}</span>
            {(state.user.role === "OWNER" || state.user.role === "ADMIN") && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                {state.user.role}
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="rounded-full px-2.5 py-1 font-semibold text-white/60 transition-colors hover:text-white disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,.12)" }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full px-3 py-1 font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
