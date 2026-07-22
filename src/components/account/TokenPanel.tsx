"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Entry = { delta: number; reason: string; created_at: string };
type State = {
  configured: boolean;
  user: { id: string; email: string; name: string | null } | null;
  balance: number;
  history: Entry[];
};

/** Human wording for a ledger reason, so the history reads as a statement. */
function label(reason: string): string {
  if (reason === "welcome") return "Welcome tokens";
  if (reason.startsWith("refund:")) return `Refunded — ${reason.slice(7).replace(/-/g, " ")}`;
  if (reason.startsWith("purchase")) return "Token purchase";
  return reason.replace(/-/g, " ");
}

export default function TokenPanel() {
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
        if (!cancelled) setState({ configured: false, user: null, balance: 0, history: [] });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signOut = async () => {
    setBusy(true);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setBusy(false);
    router.refresh();
    router.push("/");
  };

  if (!state) return null;

  if (!state.configured) {
    return (
      <div className="mb-6 rounded-2xl px-4 py-3.5 text-[13px] leading-relaxed" style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}>
        <strong className="font-bold">Accounts and tokens aren&apos;t switched on yet.</strong> They need a database —
        set <code className="text-[#ffd9ae]">DATABASE_URL</code> in Admin → Key vault.
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3.5" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.04)" }}>
        <p className="flex-1 text-[13.5px] text-white/60">Sign in to see your tokens and keep your videos.</p>
        <Link href="/login" className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Sign in</Link>
        <Link href="/signup" className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold" style={{ color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }}>Create account</Link>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.04)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-white/45">Signed in as</p>
          <p className="truncate font-semibold text-white">{state.user.name || state.user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-white/45">Token balance</p>
          <p className="font-display text-2xl font-bold" style={{ color: "#ff5663" }}>{state.balance.toLocaleString()}</p>
        </div>
        <Link href="/pricing" className="rounded-lg px-3 py-2 text-[12.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Buy tokens</Link>
        <button onClick={signOut} disabled={busy} className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white/55 transition-colors hover:text-white disabled:opacity-50" style={{ border: "1px solid rgba(255,255,255,.12)" }}>
          Sign out
        </button>
      </div>

      {state.history.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/35">Recent activity</p>
          <ul className="flex flex-col gap-1.5">
            {state.history.slice(0, 8).map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="truncate capitalize text-white/60">{label(h.reason)}</span>
                <span className="shrink-0 font-semibold" style={{ color: h.delta > 0 ? "#5fd08a" : "#ff8892" }}>
                  {h.delta > 0 ? "+" : ""}{h.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
