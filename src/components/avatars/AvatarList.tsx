"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Compact avatar list.
//
// Rows rather than cards: a small thumbnail beside the name, several columns
// across, so a few hundred characters are scannable without endless scrolling.
// Designed to stay readable at this density as the catalog grows into the
// tens of thousands — nothing here is per-avatar expensive, and video preview
// happens only on the row you are pointing at.
// ---------------------------------------------------------------------------

type Row = {
  avatarId: string;
  name: string;
  gender: string;
  premium: boolean;
  image: string;
  video: string;
  source?: string;
  tags?: string[];
  href: string;
  studio: string;
};

const PAGE = 200;

export default function AvatarList({
  primary = "all",
  initialQuery = "",
}: {
  primary?: string;
  initialQuery?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [split, setSplit] = useState<{ premium: number; standard: number; female: number; male: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState(initialQuery);
  const [gender, setGender] = useState("");
  const [premium, setPremium] = useState<"any" | "only" | "exclude">("any");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const reqRef = useRef(0);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      const ticket = ++reqRef.current;
      setLoading(true);
      setErr(null);
      try {
        const p = new URLSearchParams({ offset: String(nextOffset), limit: String(PAGE) });
        if (primary && primary !== "all") p.set("primary", primary);
        if (q) p.set("q", q);
        if (gender) p.set("gender", gender);
        if (premium !== "any") p.set("premium", premium);
        if (source) p.set("source", source);
        const res = await fetch(`/api/avatars?${p}`);
        const data = await res.json();
        if (ticket !== reqRef.current) return;
        if (!res.ok) {
          setErr(data.error || "Couldn't load avatars.");
          return;
        }
        setRows((prev) => (replace ? data.avatars : [...prev, ...data.avatars]));
        setTotal(data.total ?? 0);
        setSplit(data.split ?? null);
        setOffset(nextOffset + (data.avatars?.length ?? 0));
      } catch {
        if (ticket === reqRef.current) setErr("Network error. Try again.");
      } finally {
        if (ticket === reqRef.current) setLoading(false);
      }
    },
    [primary, q, gender, premium, source],
  );

  useEffect(() => {
    const t = setTimeout(() => void load(0, true), 200);
    return () => clearTimeout(t);
  }, [load]);

  const chip = (on: boolean) =>
    on
      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)", border: "1px solid transparent" }
      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)", background: "transparent" };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or tag…"
          aria-label="Search avatars"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
          style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
        />

        <div className="flex flex-wrap gap-1.5">
          {[
            { v: "", l: "All" },
            { v: "female", l: split ? `Female (${split.female.toLocaleString()})` : "Female" },
            { v: "male", l: split ? `Male (${split.male.toLocaleString()})` : "Male" },
          ].map((o) => (
            <button key={o.l} onClick={() => setGender(o.v)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors" style={chip(gender === o.v)}>
              {o.l}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-white/10" />
          {[
            { v: "any", l: "Any tier" },
            { v: "only", l: split ? `⭐ Premium (${split.premium.toLocaleString()})` : "Premium" },
            { v: "exclude", l: split ? `Standard (${split.standard.toLocaleString()})` : "Standard" },
          ].map((o) => (
            <button key={o.v} onClick={() => setPremium(o.v as typeof premium)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors" style={chip(premium === o.v)}>
              {o.l}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-white/10" />
          {[
            { v: "", l: "All types" },
            { v: "heygen", l: "Talking avatars" },
            { v: "reelo", l: "Characters" },
          ].map((o) => (
            <button key={o.l} onClick={() => setSource(o.v)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors" style={chip(source === o.v)}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-[12.5px] text-white/45">
        {loading && rows.length === 0 ? "Loading…" : `${total.toLocaleString()} avatar${total === 1 ? "" : "s"}`}
      </p>

      {err && (
        <p role="alert" className="mb-3 rounded-xl px-3.5 py-2.5 text-[13px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
          {err}
        </p>
      )}

      {/* Multi-column rows: dense, but each line still readable. */}
      <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((a) => (
          <Link
            key={a.avatarId}
            href={a.href}
            title={`${a.name} — opens in ${a.studio}`}
            onMouseEnter={() => setHover(a.avatarId)}
            onMouseLeave={() => setHover((h) => (h === a.avatarId ? null : h))}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[.06]"
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-black/40" style={{ border: "1px solid rgba(255,70,85,.18)" }}>
              {hover === a.avatarId && a.video ? (
                <video src={a.video} poster={a.image} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover object-top" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-white">{a.name}</span>
              <span className="block truncate text-[10.5px] leading-tight text-white/35">
                {a.source === "reelo" ? "Character" : "Talking avatar"}
                {a.gender ? ` · ${a.gender}` : ""}
              </span>
            </span>

            {a.premium && (
              <span className="shrink-0 rounded px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                Pro
              </span>
            )}
          </Link>
        ))}
      </div>

      {rows.length > 0 && offset < total && (
        <button
          onClick={() => void load(offset, false)}
          disabled={loading}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Loading…" : `Load more (${(total - offset).toLocaleString()} left)`}
        </button>
      )}

      {!loading && rows.length === 0 && !err && (
        <p className="py-10 text-center text-sm text-white/45">Nothing matches those filters.</p>
      )}
    </div>
  );
}
