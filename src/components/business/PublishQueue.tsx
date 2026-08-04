"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BIcon from "@/components/design/BIcon";

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "X"] as const;
const STATUS_COLOR: Record<string, string> = {
  draft: "#9a8b8d",
  ready: "#5fb0ff",
  exported: "#5fd08a",
};

type Creation = { id: string; title: string; toolTitle: string; mediaUrl: string | null; kind: string };
type Item = {
  id: string;
  creationId: string | null;
  title: string;
  caption: string;
  platforms: string[];
  status: string;
  updatedAt: string;
};

export default function PublishQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [creationId, setCreationId] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["TikTok"]);
  const [status, setStatus] = useState("draft");

  const load = async () => {
    try {
      const [pub, lib] = await Promise.all([fetch("/api/publish"), fetch("/api/creations")]);
      const pdata = await pub.json();
      const ldata = await lib.json();
      setConfigured(Boolean(pdata.configured));
      setSignedIn(Boolean(pdata.signedIn));
      setItems(pdata.items ?? []);
      setNote(pdata.note ?? "");
      setCreations(ldata.creations ?? []);
    } catch {
      setErr("Couldn't load publish queue.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const togglePlatform = (p: string) => {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  };

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled post",
          caption,
          creationId: creationId || null,
          platforms,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't save.");
        return;
      }
      setTitle("");
      setCaption("");
      setCreationId("");
      setStatus("draft");
      await load();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const setItemStatus = async (id: string, next: string) => {
    setBusy(true);
    setErr(null);
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (next === "exported") {
        const blob = new Blob(
          [
            `${item.title}\n\n${item.caption}\n\nPlatforms: ${item.platforms.join(", ") || "—"}\nPrepared in Reelo — post manually on each platform.\n`,
          ],
          { type: "text/plain" },
        );
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${item.title.replace(/[^\w\-]+/g, "_").slice(0, 40) || "export"}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        if (item.creationId) {
          const c = creations.find((x) => x.id === item.creationId);
          if (c?.mediaUrl) window.open(c.mediaUrl, "_blank", "noopener,noreferrer");
        }
      }
      const res = await fetch("/api/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't update.");
        return;
      }
      await load();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/publish?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to use the publish queue." : "Accounts aren't set up yet."}
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

      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.22)", background: "linear-gradient(180deg,rgba(24,9,12,.55),rgba(10,5,7,.5))" }}>
        <div className="mb-3 font-display font-bold">Prepare a post</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mb-3 w-full rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
          style={{ border: "1px solid rgba(255,70,85,.22)" }}
        />
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption to copy when you post"
          className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          style={{ border: "1px solid rgba(255,70,85,.22)" }}
        />
        <label className="mt-3 block text-xs" style={{ color: "#8e7f81" }}>
          From Library (optional)
          <select
            value={creationId}
            onChange={(e) => {
              setCreationId(e.target.value);
              const c = creations.find((x) => x.id === e.target.value);
              if (c && !title) setTitle(c.title);
            }}
            className="mt-1 w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none"
            style={{ border: "1px solid rgba(255,70,85,.22)" }}
          >
            <option value="">— none —</option>
            {creations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.toolTitle})
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: "#8e7f81" }}>Target platforms:</span>
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={on ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" } : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}
              >
                {p}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg bg-transparent px-3 py-2 text-sm text-white outline-none"
            style={{ border: "1px solid rgba(255,70,85,.22)" }}
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void create()}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            <BIcon name="rocket" size={16} color="#fff" glow={false} /> Add to queue
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 font-display text-lg font-bold">Queue</div>
        {items.length === 0 ? (
          <p className="text-sm" style={{ color: "#9a8b8d" }}>No items yet. Prepare a caption above.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.title}</div>
                    <div className="mt-0.5 text-xs" style={{ color: "#8e7f81" }}>
                      {(item.platforms.join(" · ") || "No platforms")} · {new Date(item.updatedAt).toLocaleString()}
                    </div>
                    {item.caption && (
                      <p className="mt-2 line-clamp-2 text-[13px]" style={{ color: "#cabcbe" }}>{item.caption}</p>
                    )}
                  </div>
                  <span className="rounded-md px-2.5 py-1 text-[11px] font-bold capitalize" style={{ color: STATUS_COLOR[item.status] ?? "#9a8b8d", background: `${STATUS_COLOR[item.status] ?? "#9a8b8d"}1f` }}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status !== "ready" && item.status !== "exported" && (
                    <button type="button" disabled={busy} onClick={() => void setItemStatus(item.id, "ready")} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ border: "1px solid rgba(95,176,255,.35)", color: "#5fb0ff" }}>
                      Mark ready
                    </button>
                  )}
                  {item.status !== "exported" && (
                    <button type="button" disabled={busy} onClick={() => void setItemStatus(item.id, "exported")} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                      Export & mark exported
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => void remove(item.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
