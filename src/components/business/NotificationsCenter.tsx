"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Note = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsCenter() {
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setSignedIn(Boolean(data.signedIn));
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      setErr("Couldn't load notifications.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const mark = async (id?: string) => {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to see notifications." : "Accounts aren't set up yet."}
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
    <div className="space-y-4">
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "#9a8b8d" }}>
          {unread} unread
        </p>
        {unread > 0 && (
          <button type="button" disabled={busy} onClick={() => void mark()} className="text-xs font-bold" style={{ color: "#ff8a92" }}>
            Mark all read
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "#9a8b8d" }}>No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl px-4 py-3"
              style={{
                border: "1px solid rgba(255,70,85,.14)",
                background: n.readAt ? "rgba(255,60,75,.02)" : "rgba(255,60,75,.08)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <p className="mt-0.5 text-[13px]" style={{ color: "#cabcbe" }}>{n.body}</p>}
                  <div className="mt-1 text-[11px]" style={{ color: "#8e7f81" }}>
                    {n.kind} · {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {n.href && (
                    <Link href={n.href} className="text-xs font-bold" style={{ color: "#ff8a92" }}>
                      Open
                    </Link>
                  )}
                  {!n.readAt && (
                    <button type="button" disabled={busy} onClick={() => void mark(n.id)} className="text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                      Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
