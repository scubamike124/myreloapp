"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  toolTitle: string;
  kind: string;
  bytes: number | null;
  createdAt: string;
  expiresAt: string | null;
};

type Summary = {
  count: number;
  videos: number;
  images: number;
  bytesLabel: string;
};

export default function StorageManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/storage");
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setSignedIn(Boolean(data.signedIn));
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
      if (data.retentionDays) setRetentionDays(data.retentionDays);
    } catch {
      setErr("Couldn't load storage.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this creation permanently?")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/storage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't delete.");
        return;
      }
      await load();
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
          {configured ? "Sign in to manage storage." : "Accounts aren't set up yet."}
        </p>
        {configured && (
          <Link href="/login" className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Items", v: String(summary.count) },
            { l: "Videos", v: String(summary.videos) },
            { l: "Images", v: String(summary.images) },
            { l: "Used", v: summary.bytesLabel },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
              <div className="font-display text-xl font-bold">{s.v}</div>
              <div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm" style={{ color: "#9a8b8d" }}>
        Media is kept for {retentionDays} days, then removed automatically. Delete anytime below.
      </p>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "#9a8b8d" }}>Nothing stored yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{item.title}</div>
                <div className="text-xs" style={{ color: "#8e7f81" }}>
                  {item.toolTitle} · {item.kind} · {item.bytes != null ? `${Math.round(item.bytes / 1024)} KB` : "—"}
                  {item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              <button type="button" disabled={busy} onClick={() => void remove(item.id)} className="text-xs font-bold" style={{ color: "#ff8a92" }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
