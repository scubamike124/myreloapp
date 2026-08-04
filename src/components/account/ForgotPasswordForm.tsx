"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { mailed: boolean; supportEmail: string }>(null);
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
        body: JSON.stringify({ action: "request-reset", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Something went wrong.");
        return;
      }
      setDone({
        mailed: Boolean(data.emailed),
        supportEmail: String(data.supportEmail || "support@myreelo.com"),
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl px-4 py-3.5 text-[13px] leading-relaxed text-white/80" style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}>
        {done.mailed ? (
          <p>If an account exists for that email, a reset link is on its way. Check your inbox (and spam) within the next few minutes.</p>
        ) : (
          <p>
            Automated reset email is not configured yet. Email{" "}
            <a className="underline underline-offset-2" href={`mailto:${done.supportEmail}?subject=Password%20reset`}>
              {done.supportEmail}
            </a>{" "}
            from the address on your account and we&apos;ll verify identity and help you back in. No reset link was emailed.
          </p>
        )}
        <p className="mt-3">
          <Link href="/login" className="underline underline-offset-2 hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div>
        <label htmlFor="fp-email" className="mb-1.5 block text-[13px] font-semibold text-white/80">
          Email
        </label>
        <input
          id="fp-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
          style={field}
          placeholder="you@example.com"
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
        {busy ? "Just a moment…" : "Send reset link"}
      </button>
      <p className="text-center text-[13px] text-white/45">
        Remembered it?{" "}
        <Link href="/login" className="underline underline-offset-2 hover:text-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
