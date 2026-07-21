"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/design/AppShell";

const TABS = ["Profile", "Billing", "Usage", "Security", "Family", "Preferences"];

const MEMBERS = [
  { name: "Michael (You)", email: "michael@email.com", role: "Account Owner", owner: true, img: "/assets/spokesperson.jpg" },
  { name: "Sarah", email: "sarah@email.com", role: "Member", owner: false, img: "/assets/talking-selfie.jpg" },
  { name: "Emma", email: "emma@email.com", role: "Member", owner: false, img: "/assets/avatar-business.jpg" },
  { name: "Jake", email: "jake@email.com", role: "Member", owner: false, img: "/assets/talking-photo.jpg" },
];

export default function AccountPage() {
  const [tab, setTab] = useState("Family");

  return (
    <AppShell active="settings">
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

      {/* family members */}
      <div className="mb-[18px] rounded-[18px] p-6" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
        <div className="mb-[18px] flex items-center justify-between">
          <div className="font-display text-lg font-bold">Family Members</div>
          {/* Disabled, not dead: there is no auth or user store yet, so these
              cannot do anything. Saying so beats a button that silently
              ignores the click. */}
          <button
            disabled
            title="Inviting members needs user accounts, which aren't built yet"
            className="flex items-center gap-[7px] rounded-[10px] px-4 py-[9px] text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 6px 16px rgba(225,29,42,.35)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Invite Member
          </button>
        </div>
        <div className="mb-4 text-[13px]" style={{ color: "#8e7f81" }}>Manage your family members and invitations.</div>
        <div className="flex flex-col gap-2.5">
          {MEMBERS.map((m) => (
            // Wraps on narrow screens: without it the "Account Owner" badge
            // squeezed the email down to "m..".
            <div key={m.name} className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[13px] px-3.5 py-[13px]" style={{ border: "1px solid rgba(255,70,85,.1)", background: "rgba(255,60,75,.02)" }}>
              <div className="relative h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-full" style={{ border: "1px solid rgba(255,70,85,.4)" }}>
                <Image src={m.img} alt={m.name} fill sizes="42px" className="object-cover" />
              </div>
              <div className="min-w-[8rem] flex-1">
                <div className="text-[14.5px] font-semibold">{m.name}</div>
                <div className="truncate text-[12.5px]" style={{ color: "#8e7f81" }}>{m.email} · {m.role}</div>
              </div>
              {m.owner ? (
                <span className="ml-auto shrink-0 rounded-[7px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em]" style={{ color: "#ffb3b9", background: "rgba(255,70,85,.14)", border: "1px solid rgba(255,70,85,.3)" }}>Account Owner</span>
              ) : (
                <button
                  disabled
                  title="Removing members needs user accounts, which aren't built yet"
                  className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: "#ff7b85", border: "1px solid rgba(255,70,85,.25)" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* add member */}
      <div className="flex flex-col items-start gap-5 rounded-[18px] px-7 py-6 sm:flex-row sm:items-center" style={{ border: "1px solid rgba(255,70,85,.24)", background: "radial-gradient(500px 180px at 85% 50%,rgba(225,29,42,.16),transparent 70%),rgba(18,7,9,.5)" }}>
        <div className="flex-1">
          <div className="font-display mb-1 text-lg font-bold">Add Family Member</div>
          <div className="mb-0.5 text-sm font-semibold" style={{ color: "#ff8a92" }}>$10 / month per member</div>
          <div className="text-[13px]" style={{ color: "#8e7f81" }}>Each member gets their own account and features.</div>
        </div>
        <Link href="/add-ons" className="flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-[13px] text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px rgba(225,29,42,.4)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add Member
        </Link>
      </div>
    </AppShell>
  );
}
