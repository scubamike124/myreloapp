"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  packId: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Starts Stripe Checkout for a token pack. Requires a signed-in user. */
export default function BuyPackButton({ packId, className, style, children = "Buy" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const buy = async () => {
    setErr(null);
    setBusy(true);
    try {
      const me = await fetch("/api/auth");
      const auth = await me.json();
      if (!auth?.user) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErr(data.error || "Checkout unavailable.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setErr("Could not reach checkout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className={className}
        style={style}
      >
        {busy ? "Starting…" : children}
      </button>
      {err && <p className="text-center text-[10px] text-[#ff8892]">{err}</p>}
    </div>
  );
}
