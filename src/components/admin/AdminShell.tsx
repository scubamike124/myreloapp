"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "reelo-admin";
const AUTH_KEY = "reelo-admin-auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
  { href: "/admin/users", label: "Users", icon: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-3-4.6" /></> },
  { href: "/admin/payments", label: "Payments", icon: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></> },
  { href: "/admin/plans", label: "Plans", icon: <><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 20l-4.9 2.6.9-5.5-4-3.9L9.5 7z" /></> },
  { href: "/admin/gateways", label: "Payment gateways", icon: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M6.5 15h4M15 15h2.5" /><circle cx="12" cy="12" r="0.5" /></> },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setErr(false);
    } else {
      setErr(true);
    }
  };
  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPw("");
  };

  // Avoid a flash before we know auth state.
  if (authed === null) return <div className="min-h-screen" style={{ background: "#0a0607" }} />;

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-white" style={{ background: "#0a0607" }}>
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(900px 500px at 50% -5%,rgba(225,29,42,.18),transparent 60%)" }} />
        <form onSubmit={login} className="relative w-full max-w-[380px] rounded-3xl border border-white/10 bg-black/50 p-7 backdrop-blur-md">
          <div className="mb-5 flex items-center gap-2">
            <span className="font-display grid h-9 w-9 place-items-center rounded-xl text-lg font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 22px rgba(225,29,42,.55)" }}>R</span>
            <div>
              <div className="font-display text-lg font-bold leading-none">Reelo Admin</div>
              <div className="text-xs text-white/45">Restricted access</div>
            </div>
          </div>
          <label className="mb-2 block text-sm font-semibold text-white/85">Admin password</label>
          <input autoFocus type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="Enter password" className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none" style={{ border: `1px solid ${err ? "#ff3645" : "rgba(255,70,85,.22)"}`, background: "rgba(255,60,75,.04)" }} />
          {err && <p className="mt-2 text-xs font-medium text-[#ff6673]">Incorrect password. Try again.</p>}
          <button type="submit" className="mt-4 w-full rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01]" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>Unlock dashboard</button>
          <p className="mt-4 text-center text-[11px] text-white/30">Demo access — default password: reelo-admin</p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(900px 500px at 100% -5%,rgba(225,29,42,.1),transparent 60%)" }} />
      <div className="relative flex min-h-screen">
        {/* sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-white/10 bg-black/40 px-4 py-5 backdrop-blur-md md:flex">
          <Link href="/admin" className="mb-7 flex items-center gap-2 px-2">
            <span className="font-display grid h-8 w-8 place-items-center rounded-lg text-sm font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}>R</span>
            <span className="font-display font-bold">Reelo Admin</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors" style={active ? { background: "rgba(255,70,85,.12)", color: "#fff", border: "1px solid rgba(255,70,85,.3)" } : { color: "#a99a9c" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1">
            <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/50 hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              Log out
            </button>
          </div>
        </aside>

        {/* content */}
        <div className="flex-1">
          {/* mobile top nav */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md md:hidden">
            {NAV.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold" style={active ? { background: "rgba(255,70,85,.14)", color: "#fff" } : { color: "#a99a9c" }}>{n.label}</Link>;
            })}
            <button onClick={logout} className="ml-auto whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-white/50">Log out</button>
          </div>
          <main className="mx-auto max-w-[1150px] px-5 py-7 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
