"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// The full avatar catalog as a browsable page.
//
// 1,264 avatars previously existed only inside a small panel in AI Avatar
// Studio — you had to already be making a video to discover them. This is the
// shop window: searchable, filterable, linkable, and one click from making a
// video with any of them.
//
// Paged through the existing API rather than importing the 400KB snapshot into
// the client bundle.
// ---------------------------------------------------------------------------

type Avatar = { avatarId: string; name: string; gender: string; premium: boolean; image: string; video: string };

// The API clamps limit to 96; asking for more would silently get 96 back.
const PAGE = 96;

export default function AvatarLibrary() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("");
  const [premium, setPremium] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Guards against an older, slower request overwriting a newer one.
  const reqRef = useRef(0);

  const load = useCallback(
    async (nextOffset: number, replace: boolean, query: string, g: string, prem: boolean) => {
      const ticket = ++reqRef.current;
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ offset: String(nextOffset), limit: String(PAGE) });
        if (query) params.set("q", query);
        if (g) params.set("gender", g);
        if (prem) params.set("includePremium", "1");
        const res = await fetch(`/api/heygen-avatars?${params}`);
        const data = await res.json();
        if (ticket !== reqRef.current) return; // superseded
        if (!res.ok) {
          setErr(data.error || "Couldn't load avatars.");
          return;
        }
        setAvatars((prev) => (replace ? data.avatars : [...prev, ...data.avatars]));
        setTotal(data.total ?? 0);
        setTotalAll(data.totalAll ?? 0);
        setOffset(nextOffset + (data.avatars?.length ?? 0));
      } catch {
        if (ticket === reqRef.current) setErr("Network error. Try again.");
      } finally {
        if (ticket === reqRef.current) setLoading(false);
      }
    },
    [],
  );

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => void load(0, true, q, gender, premium), 220);
    return () => clearTimeout(t);
  }, [q, gender, premium, load]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search avatars by name…"
            aria-label="Search avatars"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { v: "", l: "All" },
            { v: "female", l: "Female" },
            { v: "male", l: "Male" },
          ].map((o) => (
            <button
              key={o.l}
              onClick={() => setGender(o.v)}
              className="rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors"
              style={
                gender === o.v
                  ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                  : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
              }
            >
              {o.l}
            </button>
          ))}
          <button
            onClick={() => setPremium((p) => !p)}
            aria-pressed={premium}
            className="rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors"
            style={
              premium
                ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
            }
          >
            Include premium
          </button>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-white/45">
        {loading && avatars.length === 0
          ? "Loading avatars…"
          : `${total.toLocaleString()} avatar${total === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}${
              totalAll && total !== totalAll ? ` of ${totalAll.toLocaleString()}` : ""
            }`}
      </p>

      {err && (
        <p role="alert" className="mb-4 rounded-xl px-3.5 py-2.5 text-[13px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
          {err}
        </p>
      )}

      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(112px,1fr))" }}>
        {avatars.map((a) => (
          <Link
            key={a.avatarId}
            href={`/create/ai-avatar-studio?avatar=${encodeURIComponent(a.avatarId)}`}
            onMouseEnter={() => setHovered(a.avatarId)}
            onMouseLeave={() => setHovered((h) => (h === a.avatarId ? null : h))}
            className="group relative block overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5 hover:z-10 hover:scale-[1.06]"
            style={{ border: "1px solid rgba(255,70,85,.16)" }}
          >
            <div className="relative aspect-square bg-black/40">
              {/* Video preview only on hover — 1,264 autoplaying videos would
                  melt the page. */}
              {hovered === a.avatarId && a.video ? (
                <video src={a.video} poster={a.image} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover object-top" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt={a.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
              )}
              {a.premium && (
                <span className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                  Pro
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 px-1.5 py-1" style={{ background: "linear-gradient(180deg,transparent,rgba(8,4,5,.9))" }}>
                <p className="truncate text-[10px] font-semibold text-white">{a.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {avatars.length > 0 && offset < total && (
        <button
          onClick={() => void load(offset, false, q, gender, premium)}
          disabled={loading}
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Loading…" : `Load more (${(total - offset).toLocaleString()} left)`}
        </button>
      )}

      {!loading && avatars.length === 0 && !err && (
        <p className="py-12 text-center text-sm text-white/45">No avatars match that search.</p>
      )}
    </div>
  );
}
