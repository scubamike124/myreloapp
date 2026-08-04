"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BIcon from "@/components/design/BIcon";

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "X"] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Item = {
  id: string;
  title: string;
  platforms: string[];
  scheduledAt: string;
  status: string;
  notes: string;
  approvalStatus?: string;
  amberPlaced?: boolean;
  caption?: string;
};

function toLocalInputUnusedRemoved() {
  return null;
}

export default function ContentCalendar() {
  const [items, setItems] = useState<Item[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["TikTok"]);

  const load = async () => {
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setSignedIn(Boolean(data.signedIn));
      setItems(data.items ?? []);
      setNote(data.note ?? "");
    } catch {
      setErr("Couldn't load calendar.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOffset = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const countsByDay = useMemo(() => {
    const map: Record<number, number> = {};
    for (const item of items) {
      const d = new Date(item.scheduledAt);
      if (d.getFullYear() === year && d.getMonth() === month && item.status !== "cancelled") {
        map[d.getDate()] = (map[d.getDate()] ?? 0) + 1;
      }
    }
    return map;
  }, [items, year, month]);

  const upcoming = items
    .filter((i) => i.status !== "cancelled" && i.status !== "done")
    .slice()
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
    .slice(0, 12);

  const planned = items.filter((i) => i.status === "planned").length;
  const due = items.filter((i) => i.status === "due").length;
  const done = items.filter((i) => i.status === "done").length;

  const create = async () => {
    if (!scheduledAt) {
      setErr("Pick a date and time.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled",
          notes,
          platforms,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't save.");
        return;
      }
      setTitle("");
      setNotes("");
      setScheduledAt("");
      await load();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const setApproval = async (id: string, approvalStatus: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setErr(data.error || "Couldn't update approval.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const tryPublish = async (id: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: id }),
      });
      const data = await res.json();
      if (!data.published) {
        setErr(data.error || data.note || "Publish did not succeed — not marked Posted.");
      }
      await load();
    } catch {
      setErr("Publish request failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/schedule?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to use the content calendar." : "Accounts aren't set up yet."}
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
      {note && (
        <p className="rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(95,176,255,.25)", background: "rgba(95,176,255,.06)", color: "#c8dff5" }}>
          {note}
        </p>
      )}
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "calendar" as const, v: String(planned), l: "Planned" },
          { icon: "clock" as const, v: String(due), l: "Due" },
          { icon: "growth" as const, v: String(done), l: "Done" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl p-4 text-center" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={20} />
            <div className="font-display mt-1 text-2xl font-bold">{s.v}</div>
            <div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.45)" }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-sm" style={{ color: "#b9a9ab" }}>←</button>
            <div className="font-display font-bold">
              {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-sm" style={{ color: "#b9a9ab" }}>→</button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px]" style={{ color: "#8e7f81" }}>
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day == null) return <div key={`e-${i}`} />;
              const count = countsByDay[day] ?? 0;
              const today = new Date();
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const pad = (n: number) => String(n).padStart(2, "0");
                    setScheduledAt(`${year}-${pad(month + 1)}-${pad(day)}T09:00`);
                  }}
                  className="relative rounded-lg py-2 text-sm"
                  style={{
                    border: isToday ? "1px solid rgba(255,70,85,.5)" : "1px solid transparent",
                    background: count ? "rgba(255,54,69,.12)" : "transparent",
                    color: "#f3e9e9",
                  }}
                >
                  {day}
                  {count > 0 && (
                    <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: "#ff3645" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.22)", background: "linear-gradient(180deg,rgba(24,9,12,.55),rgba(10,5,7,.5))" }}>
          <div className="mb-3 font-display font-bold">Add to calendar</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="mb-3 w-full rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            style={{ border: "1px solid rgba(255,70,85,.22)" }}
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mb-3 w-full rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none"
            style={{ border: "1px solid rgba(255,70,85,.22)", colorScheme: "dark" }}
          />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="mb-3 w-full resize-none rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            style={{ border: "1px solid rgba(255,70,85,.22)" }}
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={on ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" } : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void create()}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            Save intent
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 font-display text-lg font-bold">Upcoming</div>
        {upcoming.length === 0 ? (
          <p className="text-sm" style={{ color: "#9a8b8d" }}>Nothing scheduled. Add an intent above.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcoming.map((item) => (
              <div key={item.id} id={item.id} className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs" style={{ color: "#8e7f81" }}>
                      {new Date(item.scheduledAt).toLocaleString()} · {item.platforms.join(" · ") || "—"} · {item.status}
                      {item.amberPlaced ? " · Amber" : ""}
                      {item.approvalStatus ? ` · ${item.approvalStatus}` : ""}
                    </div>
                    {item.notes && <p className="mt-1 text-[13px]" style={{ color: "#cabcbe" }}>{item.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.approvalStatus === "pending_approval" && (
                      <>
                        <button type="button" disabled={busy} onClick={() => void setApproval(item.id, "approved")} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                          Approve
                        </button>
                        <button type="button" disabled={busy} onClick={() => void setApproval(item.id, "rejected")} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                          Reject
                        </button>
                      </>
                    )}
                    {item.approvalStatus === "approved" && (
                      <button type="button" disabled={busy} onClick={() => void tryPublish(item.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ border: "1px solid rgba(95,176,255,.35)", color: "#5fb0ff" }}>
                        Amber publish
                      </button>
                    )}
                    {item.status === "due" && (
                      <button type="button" disabled={busy} onClick={() => void setStatus(item.id, "done")} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                        Mark done
                      </button>
                    )}
                    {item.status === "planned" && (
                      <button type="button" disabled={busy} onClick={() => void setStatus(item.id, "cancelled")} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                        Cancel
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void remove(item.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
