"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const field = {
    border: "1px solid rgba(255,70,85,.22)",
    background: "rgba(255,60,75,.05)",
  } as const;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Something went wrong.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-xl px-4 py-3.5 text-[13px] leading-relaxed text-white/80" style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}>
        <p>This reset link is missing its token. Request a new one from the forgot-password page.</p>
        <p className="mt-3">
          <Link href="/forgot-password" className="underline underline-offset-2 hover:text-white">
            Request a reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div>
        <label htmlFor="rp-password" className="mb-1.5 block text-[13px] font-semibold text-white/80">
          New password
        </label>
        <input
          id="rp-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
          style={field}
          placeholder="At least 8 characters"
        />
      </div>
      {err && (
        <p role="alert" className="rounded-xl px-3.5 py-2.5 text-[13px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
      >
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
