"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/design/AppShell";
import TokenPanel from "@/components/account/TokenPanel";

const TABS = ["Profile", "Billing", "Usage", "Security", "Family", "Preferences"];

export default function AccountPage() {
  const [tab, setTab] = useState("Profile");

  return (
    <AppShell active="settings">
      <TokenPanel />

      <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Account Settings</h1>
      <p className="mb-[22px] mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Manage your account, preferences, and billing.</p>

      {/* Bleeds to the viewport edges on small screens and fades the trailing
          edge, so a cut-off tab reads as "scroll for more" instead of broken. */}
      <div
        className="scroll-fade-x mb-6 -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
        style={{ borderBottom: "1px solid rgba(255,70,85,.14)" }}
      >
        {TABS.map((t) => {
          const on = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="-mb-px cursor-pointer whitespace-nowrap px-4 py-[11px] text-[13.5px] font-semibold transition-all"
              style={{ color: on ? "#ff5663" : "#9a8b8d", borderBottom: `2px solid ${on ? "#ff5663" : "transparent"}` }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Family" ? (
        <div className="mb-[18px] rounded-[18px] p-6" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
          <div className="font-display mb-2 text-lg font-bold">Family Members</div>
          <p className="mb-4 text-[13.5px]" style={{ color: "#8e7f81" }}>
            Shared seats aren&apos;t available yet. Your signed-in account is the only profile on this workspace.
          </p>
          <Link
            href="/add-ons"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px rgba(225,29,42,.4)" }}
          >
            See add-ons
          </Link>
        </div>
      ) : (
        <div className="mb-[18px] rounded-[18px] p-6" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
          <div className="font-display mb-2 text-lg font-bold">{tab}</div>
          <p className="text-[13.5px]" style={{ color: "#8e7f81" }}>
            {tab === "Billing" || tab === "Usage"
              ? "Live token balance and checkout are in the panel above."
              : "Manage this section from the controls above, or continue creating videos."}
          </p>
        </div>
      )}
    </AppShell>
  );
}
