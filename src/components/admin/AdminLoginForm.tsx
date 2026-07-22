"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm({
  configured,
  next,
}: {
  configured: boolean;
  next: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Sign in failed.");
        setPw("");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // No background fill here: html already carries #0a0607, and an opaque fill
  // would paint straight over the motherboard canvas behind every page.
  return (
    <div className="grid min-h-screen place-items-center px-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ backgroundImage: "radial-gradient(900px 500px at 50% -5%,rgba(225,29,42,.18),transparent 60%)" }}
      />
      <form onSubmit={submit} className="relative w-full max-w-[380px] rounded-3xl border border-white/10 bg-black/50 p-7 backdrop-blur-md">
        <div className="mb-5 flex items-center gap-2">
          <span
            className="font-display grid h-9 w-9 place-items-center rounded-xl text-lg font-bold"
            style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 22px rgba(225,29,42,.55)" }}
          >
            R
          </span>
          <div>
            <div className="font-display text-lg font-bold leading-none">Reelo Admin</div>
            <div className="text-xs text-white/45">Restricted access</div>
          </div>
        </div>

        {!configured ? (
          <p className="rounded-xl border border-[rgba(255,70,85,.25)] bg-[rgba(255,60,75,.06)] p-4 text-sm leading-relaxed text-white/70">
            Admin access is not configured. Set <code className="text-[#ff8892]">ADMIN_PASSWORD</code> in your server
            environment, then reload this page.
          </p>
        ) : (
          <>
            <label htmlFor="admin-pw" className="mb-2 block text-sm font-semibold text-white/85">
              Admin password
            </label>
            <input
              id="admin-pw"
              autoFocus
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr(null);
              }}
              placeholder="Enter password"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{
                border: `1px solid ${err ? "#ff3645" : "rgba(255,70,85,.22)"}`,
                background: "rgba(255,60,75,.04)",
              }}
            />
            {err && (
              <p role="alert" className="mt-2 text-xs font-medium text-[#ff6673]">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || pw.length === 0}
              className="mt-4 w-full rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}
            >
              {busy ? "Signing in…" : "Unlock dashboard"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
