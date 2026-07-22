"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Brand Kit editor.
//
// The Business Center card said "store your logos, colors, fonts and brand
// assets" and had no page behind it at all. This is that page: it saves, it
// reloads what you saved, and it says plainly when it cannot.
// ---------------------------------------------------------------------------

type Kit = {
  brandName: string;
  colors: string[];
  headingFont: string;
  bodyFont: string;
  logoUrl: string | null;
};

const FONTS = ["", "Inter", "Poppins", "Montserrat", "Playfair Display", "Georgia", "Roboto", "Oswald", "Lato"];

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}

export default function BrandKitEditor() {
  const [kit, setKit] = useState<Kit | null>(null);
  const [state, setState] = useState<{ configured: boolean; signedIn: boolean }>({ configured: true, signedIn: false });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/brand-kit");
        const data = await res.json();
        if (cancelled) return;
        setKit(data.kit);
        setState({ configured: Boolean(data.configured), signedIn: Boolean(data.signedIn) });
      } catch {
        if (!cancelled) setErr("Couldn't load your brand kit.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof Kit>(key: K, value: Kit[K]) => {
    setKit((k) => (k ? { ...k, [key]: value } : k));
    setSaved("");
  };

  const save = async () => {
    if (!kit) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kit),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't save. Try again.");
        return;
      }
      setKit(data.kit);
      setSaved("Saved");
      setTimeout(() => setSaved(""), 2500);
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onLogo = async (f?: File) => {
    if (!f) return;
    try {
      set("logoUrl", await fileToDataUrl(f));
    } catch {
      setErr("Couldn't read that image.");
    }
  };

  if (!kit) return null;

  const card = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" } as const;
  const input = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" } as const;

  if (!state.configured || !state.signedIn) {
    return (
      <div className="rounded-2xl p-5" style={card}>
        <p className="text-[14px]" style={{ color: "#ffcf9a" }}>
          <strong className="font-bold">
            {state.configured ? "Sign in to save a brand kit." : "Accounts aren't switched on yet."}
          </strong>{" "}
          {state.configured
            ? "Your colours, fonts and logo are stored against your account so they follow you between devices."
            : "A brand kit needs somewhere to live — see KEYS.md."}
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

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-5 rounded-2xl p-5 lg:col-span-2" style={card}>
        <div>
          <label htmlFor="bk-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">
            Brand name
          </label>
          <input
            id="bk-name"
            value={kit.brandName}
            onChange={(e) => set("brandName", e.target.value)}
            placeholder="Harbour Roast"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
            style={input}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-white/80">Colours</p>
          <div className="flex flex-wrap items-center gap-2">
            {kit.colors.map((c, i) => (
              <span key={i} className="relative">
                <input
                  type="color"
                  value={c}
                  aria-label={`Colour ${i + 1}`}
                  onChange={(e) => {
                    const next = [...kit.colors];
                    next[i] = e.target.value;
                    set("colors", next);
                  }}
                  className="h-11 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <button
                  onClick={() => set("colors", kit.colors.filter((_, j) => j !== i))}
                  aria-label={`Remove colour ${i + 1}`}
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "#c4101c" }}
                >
                  ×
                </button>
              </span>
            ))}
            {kit.colors.length < 12 && (
              <button
                onClick={() => set("colors", [...kit.colors, "#ffffff"])}
                className="grid h-11 w-11 place-items-center rounded-lg text-lg text-white/50 transition-colors hover:text-white"
                style={{ border: "1px dashed rgba(255,255,255,.2)" }}
                aria-label="Add colour"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-heading" className="mb-1.5 block text-[13px] font-semibold text-white/80">
              Heading font
            </label>
            <select
              id="bk-heading"
              value={kit.headingFont}
              onChange={(e) => set("headingFont", e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f || "Not set"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bk-body" className="mb-1.5 block text-[13px] font-semibold text-white/80">
              Body font
            </label>
            <select
              id="bk-body"
              value={kit.bodyFont}
              onChange={(e) => set("bodyFont", e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f || "Not set"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-white/80">Logo</p>
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/[.03]"
            style={input}
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
            {kit.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kit.logoUrl} alt="" className="h-14 w-14 rounded-lg object-contain" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>
                🏷️
              </span>
            )}
            <span className="text-[13px] text-white/60">{kit.logoUrl ? "Replace logo" : "Upload your logo"}</span>
          </label>
          {kit.logoUrl && (
            <button
              onClick={() => set("logoUrl", null)}
              className="mt-2 text-[12px] text-white/45 underline underline-offset-2 hover:text-white"
            >
              Remove logo
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            {busy ? "Saving…" : "Save brand kit"}
          </button>
          {saved && (
            <span className="text-[13px] font-semibold" style={{ color: "#5fd08a" }}>
              {saved} ✓
            </span>
          )}
        </div>

        {err && (
          <p
            role="alert"
            className="rounded-xl px-3.5 py-2.5 text-[13px]"
            style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}
          >
            {err}
          </p>
        )}
      </div>

      {/* Live preview, so the kit is something you can see rather than a form. */}
      <div className="rounded-2xl p-5" style={card}>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/35">Preview</p>
        <div className="rounded-xl p-5" style={{ background: kit.colors[2] ?? "#0a0607", border: "1px solid rgba(255,255,255,.08)" }}>
          {kit.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logoUrl} alt="" className="mb-3 h-10 w-auto object-contain" />
          )}
          <div
            className="text-2xl font-bold leading-tight"
            style={{ color: kit.colors[0] ?? "#ff3645", fontFamily: kit.headingFont || undefined }}
          >
            {kit.brandName || "Your brand"}
          </div>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: kit.colors[3] ?? "#ffffff", fontFamily: kit.bodyFont || undefined }}
          >
            This is how your headings and body text look together.
          </p>
          <div className="mt-3 flex gap-1.5">
            {kit.colors.map((c, i) => (
              <span key={i} className="h-6 w-6 rounded-md" style={{ background: c, border: "1px solid rgba(255,255,255,.15)" }} />
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">
          Saved to your account. Reelo does not yet apply the kit to generated videos automatically — that arrives with
          the tools that use it.
        </p>
      </div>
    </div>
  );
}
