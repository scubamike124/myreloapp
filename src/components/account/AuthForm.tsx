"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Sign in and sign up — both are the same Google Sign-In control now.
 * Password auth was removed (no customers were on it yet); this stays a
 * single component because there is nothing left that differs between the
 * two modes except the surrounding page copy and the switch-mode link below.
 */
export default function AuthForm({ mode, googleEnabled = false }: { mode: "login" | "signup"; googleEnabled?: boolean }) {
  const isSignup = mode === "signup";
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="flex flex-col gap-3.5">
      {error && (
        <p role="alert" className="rounded-xl px-3.5 py-2.5 text-[13px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
          {error}
        </p>
      )}

      {googleEnabled ? (
        <a
          href={`/api/auth/google/start?next=${encodeURIComponent("/account")}`}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white py-3 text-sm font-bold text-[#1f1f1f] transition-transform hover:scale-[1.01]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.73A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.19.28-1.73V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.06l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </a>
      ) : (
        <p className="rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed" style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}>
          Sign-in isn&apos;t configured on this server right now.
        </p>
      )}

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
    </div>
  );
}
