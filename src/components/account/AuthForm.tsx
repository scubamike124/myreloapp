"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Sign in and sign up. One component, because the two forms differ by a single
 * field and keeping them together stops them drifting apart.
 */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Something went wrong.");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = {
    border: "1px solid rgba(255,70,85,.22)",
    background: "rgba(255,60,75,.05)",
  } as const;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      {isSignup && (
        <div>
          <label htmlFor="af-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">Your name</label>
          <input
            id="af-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
            style={field}
            placeholder="Michael"
          />
        </div>
      )}

      <div>
        <label htmlFor="af-email" className="mb-1.5 block text-[13px] font-semibold text-white/80">Email</label>
        <input
          id="af-email"
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

      <div>
        <label htmlFor="af-password" className="mb-1.5 block text-[13px] font-semibold text-white/80">Password</label>
        <input
          id="af-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
          style={field}
          placeholder={isSignup ? "At least 8 characters" : ""}
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
        {busy ? "Just a moment…" : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-[13px] text-white/45">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-2 hover:text-white">Sign in</Link>
          </>
        ) : (
          <>
            New to Reelo?{" "}
            <Link href="/signup" className="underline underline-offset-2 hover:text-white">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
