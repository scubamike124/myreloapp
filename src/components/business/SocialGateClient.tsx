"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SocialAccountManager from "@/components/business/SocialAccountManager";

export default function SocialGateClient() {
  const [state, setState] = useState<"loading" | "allowed" | "blocked">("loading");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/amber/access");
        const data = await res.json();
        if (cancelled) return;
        if (data.allowed) setState("allowed");
        else {
          setState("blocked");
          setReason(data.reason || "Admin-only feature.");
        }
      } catch {
        if (!cancelled) {
          setState("blocked");
          setReason("Couldn't verify access.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <p className="text-sm" style={{ color: "#9a8b8d" }}>Checking access…</p>;
  }

  if (state === "blocked") {
    return (
      <div className="rounded-2xl p-6" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <h2 className="font-display text-xl font-bold">Social connections</h2>
        <p className="mt-2 text-sm" style={{ color: "#a99a9c" }}>
          Amber Autonomous Mode is an internal admin-only feature and is not available for customer workspaces yet.
          Use the Content calendar and Publish queue to prepare posts manually.
        </p>
        <p className="mt-3 text-xs" style={{ color: "#8e7f81" }}>{reason}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/business-center/scheduling" className="text-sm font-bold" style={{ color: "#ff8a92" }}>
            Content calendar →
          </Link>
          <Link href="/business-center/publishing" className="text-sm font-bold" style={{ color: "#ff8a92" }}>
            Publish queue →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(240,185,79,.35)", background: "rgba(240,185,79,.08)", color: "#f0d9a0" }}>
        Admin testing only — Amber Autonomous Mode. Prefer{" "}
        <Link href="/admin/amber" className="font-bold underline">Admin → Amber</Link>.
      </p>
      <SocialAccountManager />
    </>
  );
}
