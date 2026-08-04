"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function WorkspaceSettingsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyInapp, setNotifyInapp] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setSignedIn(Boolean(data.signedIn));
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        if (data.settings) {
          setTimezone(data.settings.timezone || "UTC");
          setNotifyEmail(Boolean(data.settings.notifyEmail));
          setNotifyInapp(data.settings.notifyInapp !== false);
        }
      } catch {
        if (!cancelled) setErr("Couldn't load settings.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, notifyEmail, notifyInapp }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't save.");
        return;
      }
      setSaved("Saved");
      setTimeout(() => setSaved(""), 2500);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to edit workspace settings." : "Accounts aren't set up yet."}
        </p>
        {configured && (
          <Link href="/login" className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  const input = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" } as const;

  return (
    <div className="max-w-xl space-y-5 rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/80">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
          style={input}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/80">Account email</label>
        <input value={email} disabled className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white/50 outline-none" style={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/80">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
          style={input}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm" style={{ color: "#cabcbe" }}>
        <input type="checkbox" checked={notifyInapp} onChange={(e) => setNotifyInapp(e.target.checked)} />
        In-app notifications
      </label>
      <label className="flex items-center gap-2 text-sm" style={{ color: "#cabcbe" }}>
        <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
        Email notifications (preference only — email delivery not wired yet)
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Save settings
        </button>
        {saved && <span className="text-sm" style={{ color: "#5fd08a" }}>{saved}</span>}
      </div>
    </div>
  );
}
