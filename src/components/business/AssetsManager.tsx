"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Assets.
//
// Everything the account has made or uploaded, in one place. It reads the same
// creations the Library does — so an asset and a finished video are the same
// record, not two systems that disagree — and uploads go through the same
// storage with the same 30-day retention.
//
// The card for this in the Business Center used to lead nowhere while wearing
// a NEW badge.
// ---------------------------------------------------------------------------

type Asset = {
  id: string;
  title: string;
  toolTitle: string;
  kind: string;
  mediaUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "video", label: "Videos" },
  { key: "image", label: "Images" },
  { key: "upload", label: "Uploads" },
] as const;

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86400_000)) : null;
}

export default function AssetsManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [state, setState] = useState({ configured: true, signedIn: false, ready: false, storage: "none" });
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetching is kept separate from setting state so the effect below does not
  // call setState through a helper — the two callers want the same data but
  // reach it at different times.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/creations");
      const data = await res.json();
      setAssets(Array.isArray(data.creations) ? data.creations : []);
      setState({
        configured: Boolean(data.configured),
        signedIn: Boolean(data.signedIn),
        ready: true,
        storage: String(data.storage ?? "none"),
      });
    } catch {
      setState((s) => ({ ...s, ready: true }));
      setErr("Couldn't load your assets.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/creations");
        const data = await res.json();
        if (cancelled) return;
        setAssets(Array.isArray(data.creations) ? data.creations : []);
        setState({
          configured: Boolean(data.configured),
          signedIn: Boolean(data.signedIn),
          ready: true,
          storage: String(data.storage ?? "none"),
        });
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, ready: true }));
          setErr("Couldn't load your assets.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch("/api/creations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolSlug: "upload",
            toolTitle: "Upload",
            title: file.name,
            status: "completed",
            kind: file.type.startsWith("video") ? "video" : "image",
            mediaUrl: dataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErr(data.error || "Couldn't upload that file.");
          break;
        }
      }
      await load();
    } catch {
      setErr("Network error while uploading.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const card = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" } as const;

  if (!state.ready) return null;

  if (!state.configured || !state.signedIn) {
    return (
      <div className="rounded-2xl p-5" style={card}>
        <p className="text-[14px]" style={{ color: "#ffcf9a" }}>
          <strong className="font-bold">
            {state.configured ? "Sign in to keep your assets." : "Accounts aren't switched on yet."}
          </strong>{" "}
          {state.configured
            ? "Signed out, your work lives only in the browser that made it."
            : "Assets need somewhere to live — see KEYS.md."}
        </p>
        {state.configured && (
          <div className="mt-3 flex gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-[12.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg px-3 py-2 text-[12.5px] font-semibold"
              style={{ color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }}
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    );
  }

  const shown = assets.filter((a) => {
    if (filter === "all") return true;
    if (filter === "upload") return a.toolTitle === "Upload";
    return a.kind === filter;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? assets.length
              : f.key === "upload"
                ? assets.filter((a) => a.toolTitle === "Upload").length
                : assets.filter((a) => a.kind === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={
                filter === f.key
                  ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                  : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
              }
            >
              {f.label} ({count})
            </button>
          );
        })}

        <label
          className="ml-auto cursor-pointer rounded-lg px-3.5 py-2 text-[12.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          {busy ? "Uploading…" : "Upload media"}
        </label>
      </div>

      {err && (
        <p
          role="alert"
          className="mb-4 rounded-xl px-3.5 py-2.5 text-[13px]"
          style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}
        >
          {err}
        </p>
      )}

      {shown.length === 0 ? (
        <div
          className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center"
          style={{ border: "1px dashed rgba(255,70,85,.2)", background: "rgba(20,10,12,.35)" }}
        >
          <span className="text-4xl" aria-hidden>
            📁
          </span>
          <p className="font-display text-lg font-bold">{assets.length === 0 ? "Nothing here yet" : "Nothing matches that filter"}</p>
          <p className="max-w-[380px] text-[13px] leading-relaxed" style={{ color: "#8d7f81" }}>
            {assets.length === 0 ? (
              <>
                Anything you make in{" "}
                <Link href="/create" className="underline underline-offset-2 hover:text-white">
                  Create
                </Link>{" "}
                appears here, and you can upload your own media too.
              </>
            ) : (
              "Try another filter."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((a) => {
            const left = daysLeft(a.expiresAt);
            return (
              <div key={a.id} className="overflow-hidden rounded-xl" style={card}>
                <div className="relative aspect-square bg-black/40">
                  {a.mediaUrl ? (
                    a.kind === "video" ? (
                      <video src={a.mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.mediaUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <span className="grid h-full w-full place-items-center text-2xl" aria-hidden>
                      {a.kind === "video" ? "🎬" : "🖼️"}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[12.5px] font-semibold">{a.title}</p>
                  <p className="truncate text-[11px]" style={{ color: "#8e7f81" }}>
                    {a.toolTitle}
                    {left !== null && ` · ${left}d left`}
                  </p>
                  {a.mediaUrl && (
                    <a
                      href={a.mediaUrl}
                      download
                      className="mt-1.5 block rounded-md py-1 text-center text-[11.5px] font-semibold text-white/60 transition-colors hover:text-white"
                      style={{ border: "1px solid rgba(255,255,255,.12)" }}
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">
        {state.storage === "none"
          ? "No file storage is configured, so links here come from the AI provider and expire on their schedule."
          : "Files are kept for 30 days, then deleted automatically. Download anything you want to keep for good."}
      </p>
    </>
  );
}
