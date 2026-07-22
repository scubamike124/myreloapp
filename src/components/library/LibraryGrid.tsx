"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { TOOLS } from "@/lib/tools";
import { type Creation, deleteCreation, getServerSnapshot, readCreations, subscribe } from "@/lib/workspace";

// Reads the real workspace instead of the hardcoded demo list this page used to
// show. An empty library is now genuinely empty — which is the honest state for
// a new user, and the moment Amber is most useful.

const POSTER_BY_SLUG = new Map(TOOLS.map((t) => [t.slug, t.poster]));

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LibraryGrid() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  // Subscribes to the workspace without a setState-in-effect round trip, and
  // renders the empty server snapshot during SSR so hydration always matches.
  // React swaps in the real list immediately after hydration.
  const items = useSyncExternalStore(subscribe, readCreations, getServerSnapshot);

  // Only offer filters the user actually has creations for.
  const filters = useMemo(() => {
    const tools = [...new Set(items.map((i) => i.toolTitle))].sort();
    return ["All", ...tools];
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== "All" && i.toolTitle !== filter) return false;
      if (!q) return true;
      return i.title.toLowerCase().includes(q) || i.toolTitle.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">Library</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Video Library</h1>
          <p className="mt-2 text-white/55">
            {items.length === 0 ? "Everything you create will appear here." : "Every video you've made."}
          </p>
        </div>
        {items.length > 0 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your videos…"
            aria-label="Search your videos"
            className="w-64 rounded-full border border-white/15 bg-black/45 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none backdrop-blur-md focus:border-amber-400/60"
          />
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {filters.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-gradient-to-r from-amber-400 to-red-500 text-white"
                      : "border border-white/15 bg-black/40 text-white/65 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="mt-10 text-white/45">No creations match that search.</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((c) => (
                <Card key={c.id} creation={c} onDelete={() => deleteCreation(c.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

type CaptionResult = { captions: string[]; hashtags: string[]; note: string | null };

const PLATFORMS: { id: string; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
];

function Card({ creation, onDelete }: { creation: Creation; onDelete: () => void }) {
  const poster = POSTER_BY_SLUG.get(creation.toolSlug) ?? "/assets/commercials.jpg";
  const failed = creation.status === "failed";

  const [showCaptions, setShowCaptions] = useState(false);
  const [platform, setPlatform] = useState("tiktok");
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate(target: string) {
    setLoading(true);
    setCaptionError(null);
    setResult(null);
    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: creation.title,
          toolTitle: creation.toolTitle,
          platform: target,
          // Best guess at the audience; the server prefers its edge header.
          country: navigator.language?.includes("-") ? navigator.language.split("-")[1] : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCaptionError(data.error || "Couldn't generate captions.");
        return;
      }
      setResult({ captions: data.captions ?? [], hashtags: data.hashtags ?? [], note: data.note ?? null });
    } catch {
      setCaptionError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1600);
    } catch {
      setCaptionError("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-amber-400/40">
      <div className="relative aspect-video overflow-hidden">
        {creation.mediaUrl && creation.kind === "video" ? (
          <video src={creation.mediaUrl} className="absolute inset-0 h-full w-full object-cover" muted loop playsInline />
        ) : creation.mediaUrl && creation.kind === "image" ? (
          <Image src={creation.mediaUrl} alt={creation.title} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover" unoptimized />
        ) : (
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width:1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${failed ? "opacity-30" : "opacity-60"}`}
          />
        )}

        {failed && (
          <span className="absolute left-2 top-2 rounded bg-[rgba(255,60,75,.9)] px-1.5 py-0.5 text-[11px] font-bold">
            Failed
          </span>
        )}
        {/* Media lives only in the tab that made it — say so instead of
            offering a download link that would resolve to nothing. */}
        {!creation.mediaUrl && !failed && (
          <span className="absolute bottom-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white/70">
            Preview expired
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{creation.title}</p>
          <p className="text-xs text-white/45">
            {creation.toolTitle} · {timeAgo(creation.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!failed && (
            <button
              onClick={() => {
                const next = !showCaptions;
                setShowCaptions(next);
                if (next && !result && !loading) void generate(platform);
              }}
              aria-expanded={showCaptions}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              Caption
            </button>
          )}
          {creation.mediaUrl ? (
            <a
              href={creation.mediaUrl}
              download={`reelo-${creation.toolSlug}.${creation.kind === "image" ? "png" : "mp4"}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              Download
            </a>
          ) : (
            <Link
              href={`/create/${creation.toolSlug}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              {failed ? "Retry" : "Make again"}
            </Link>
          )}
          <button
            onClick={onDelete}
            aria-label={`Remove ${creation.title}`}
            className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showCaptions && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPlatform(p.id);
                  void generate(p.id);
                }}
                disabled={loading}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  platform === p.id
                    ? "bg-amber-400/20 text-amber-200"
                    : "border border-white/12 text-white/55 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
            {result && !loading && (
              <button
                onClick={() => void generate(platform)}
                className="ml-auto text-[11px] font-semibold text-white/45 hover:text-white"
              >
                Regenerate
              </button>
            )}
          </div>

          {loading && <p className="text-xs text-white/50">Checking what&apos;s working right now…</p>}

          {captionError && (
            <p role="alert" className="text-xs text-[#ff9aa3]">
              {captionError}
            </p>
          )}

          {result && !loading && (
            <div className="space-y-3">
              {result.captions.map((c, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[.03] p-2.5">
                  <p className="text-[12.5px] leading-relaxed text-white/85">{c}</p>
                  <button
                    onClick={() => void copy(c, `caption-${i}`)}
                    className="mt-1.5 text-[11px] font-semibold text-amber-300/80 hover:text-amber-200"
                  >
                    {copied === `caption-${i}` ? "Copied" : "Copy caption"}
                  </button>
                </div>
              ))}

              {result.hashtags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtags.map((h) => (
                      <span key={h} className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[11px] text-white/70">
                        #{h}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => void copy(result.hashtags.map((h) => `#${h}`).join(" "), "tags")}
                    className="mt-2 text-[11px] font-semibold text-amber-300/80 hover:text-amber-200"
                  >
                    {copied === "tags" ? "Copied" : "Copy all hashtags"}
                  </button>
                </div>
              )}

              {result.note && <p className="text-[11px] leading-relaxed text-white/45">{result.note}</p>}

              {/* Reelo does not attach these to the video — be explicit, so the
                  feature does not read as "already applied". */}
              <p className="text-[11px] text-white/30">
                Copy these into the app when you post — Reelo doesn&apos;t attach them to the video.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const starters = TOOLS.filter((t) =>
    ["talking-photo", "dancing-photo", "custom-avatar-creator", "website-commercial"].includes(t.slug),
  );

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-red-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="M21 7l-4 3 4 3z" />
        </svg>
      </span>
      <h2 className="mt-4 text-xl font-bold">Your library is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
        Make your first video and it will show up here. Not sure where to start? Ask Amber — she&apos;s in the bottom
        corner of every page.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {starters.map((t) => (
          <Link
            key={t.slug}
            href={`/create/${t.slug}`}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-amber-400/50 hover:text-white"
          >
            {t.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
