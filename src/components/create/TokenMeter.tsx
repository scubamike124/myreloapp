"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TOKEN_COST, creditLabel } from "@/lib/token-costs";

// ---------------------------------------------------------------------------
// The customer's side of token charging.
//
// The API already charges, refunds, and answers 402 when a balance is short —
// but until now nothing in the UI said so. Running out looked like a generic
// red "Not enough tokens — this needs 4." with no balance shown and nowhere to
// go, which reads as a malfunction rather than a purchase decision.
//
// Three pieces, shared by every studio so they all behave the same:
//   useTokens()      — balance, kept current after each generation
//   <TokenMeter/>    — what this costs and what you have, before you press go
//   <NotEnoughTokens/> — the 402, with the amount short and a way to buy
//
// All of it stays out of the way when accounts are off or nobody is signed in,
// because generation still works in both cases and charges nothing.
// ---------------------------------------------------------------------------

export type Tokens = {
  ready: boolean;
  /** False when there is no database — nothing is charged, so say nothing. */
  configured: boolean;
  signedIn: boolean;
  balance: number;
  /** Called with the balance an API returned, so the meter never goes stale. */
  setBalance: (n: number | null | undefined) => void;
  refresh: () => void;
};

export function useTokens(): Tokens {
  const [state, setState] = useState<{ ready: boolean; configured: boolean; signedIn: boolean; balance: number }>({
    ready: false,
    configured: false,
    signedIn: false,
    balance: 0,
  });

  const refresh = useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (cancelled) return;
        setState({
          ready: true,
          configured: Boolean(data?.configured),
          signedIn: Boolean(data?.user),
          balance: Number(data?.balance ?? 0),
        });
      } catch {
        // A failed balance lookup must never block generating — the server is
        // the one that enforces the charge, this is only the display.
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refresh(), [refresh]);

  const setBalance = useCallback((n: number | null | undefined) => {
    if (typeof n !== "number") return;
    setState((s) => ({ ...s, balance: n }));
  }, []);

  return { ...state, setBalance, refresh };
}

/** Reads a 402 body. Returns null for every other kind of failure. */
export type Shortfall = { needed: number; balance: number };

export async function shortfallFrom(res: Response, data: unknown): Promise<Shortfall | null> {
  if (res.status !== 402) return null;
  const d = (data ?? {}) as { needed?: unknown; balance?: unknown };
  return {
    needed: Number(d.needed ?? 0),
    balance: Number(d.balance ?? 0),
  };
}

/**
 * The price line under a generate button. It replaces the plain price label the
 * studios used to print, rather than sitting next to it, so there is one place
 * that decides how a price is worded.
 *
 * Signed out — or with accounts switched off — it prints the price alone, since
 * nothing is charged then and showing "you have 0" would be a lie.
 */
export function TokenMeter({
  slug,
  tokens,
  variant = "line",
}: {
  slug: string;
  tokens: Tokens;
  /** "chip" for studios that show the price as a pill in their header. */
  variant?: "line" | "chip";
}) {
  const cost = TOKEN_COST[slug];
  const balanceApplies = tokens.ready && tokens.configured && tokens.signedIn && cost !== undefined && cost > 0;

  if (!balanceApplies) {
    return variant === "chip" ? (
      <span
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{ border: "1px solid rgba(255,70,85,.2)", color: "#cabcbe" }}
      >
        {creditLabel(slug)}
      </span>
    ) : (
      <p className="text-center text-[11.5px] text-white/40">{creditLabel(slug)}</p>
    );
  }

  const short = tokens.balance < cost;

  if (variant === "chip") {
    return (
      <span
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{
          border: short ? "1px solid rgba(255,159,67,.35)" : "1px solid rgba(255,70,85,.2)",
          color: short ? "#ffcf9a" : "#cabcbe",
        }}
      >
        {creditLabel(slug)} · you have {tokens.balance.toLocaleString()}
      </span>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl px-3 py-2 text-[12.5px]"
      style={{
        border: short ? "1px solid rgba(255,159,67,.3)" : "1px solid rgba(255,255,255,.09)",
        background: short ? "rgba(255,159,67,.07)" : "rgba(255,255,255,.02)",
      }}
    >
      <span className="text-white/55">{creditLabel(slug)}</span>
      <span className="text-white/25">·</span>
      <span className="text-white/55">
        you have{" "}
        <strong className="font-bold" style={{ color: short ? "#ffcf9a" : "#ff5663" }}>
          {tokens.balance.toLocaleString()}
        </strong>
      </span>
      {short && (
        <Link
          href="/pricing"
          className="ml-auto rounded-lg px-2.5 py-1 text-[12px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Buy tokens
        </Link>
      )}
    </div>
  );
}

/**
 * Shown in place of the generic error when the server answers 402. States the
 * gap in plain numbers and offers the one action that resolves it — nothing
 * was charged, so it also says that outright.
 */
export function NotEnoughTokens({ needed, balance }: Shortfall) {
  const gap = Math.max(0, needed - balance);
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-3.5 text-[13px] leading-relaxed"
      style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}
    >
      <strong className="font-bold">Not enough tokens.</strong> This needs {needed}{" "}
      {needed === 1 ? "token" : "tokens"} and you have {balance.toLocaleString()}
      {gap > 0 && <> — {gap} short</>}. You have not been charged.
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link
          href="/pricing"
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Buy tokens
        </Link>
        <Link
          href="/account"
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
          style={{ color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }}
        >
          View balance
        </Link>
      </div>
    </div>
  );
}
