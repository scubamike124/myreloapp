"use client";

import Link from "next/link";
import BackButton from "@/components/design/BackButton";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
  { href: "/admin/users", label: "Users", icon: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-3-4.6" /></> },
  { href: "/admin/payments", label: "Payments", icon: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></> },
  { href: "/admin/plans", label: "Plans", icon: <><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 20l-4.9 2.6.9-5.5-4-3.9L9.5 7z" /></> },
  { href: "/admin/gateways", label: "Payment gateways", icon: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M6.5 15h4M15 15h2.5" /><circle cx="12" cy="12" r="0.5" /></> },
  { href: "/admin/vault", label: "Key vault", icon: <><rect x="3.5" y="10.5" width="17" height="10" rx="2.5" /><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" /><circle cx="12" cy="15.5" r="1.4" /></> },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Access is enforced server-side in proxy.ts before this ever renders, so the
  // shell only needs to end the session and let the redirect happen.
  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  };

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
        {/* min-w-0 lets this shrink below its content width — without it the
            mobile nav strip and the wide data tables stretched the whole admin
            area and scrolled the page sideways instead of scrolling
            themselves. */}
        <div className="min-w-0 flex-1">
          {/* mobile top nav */}
          <div className="scroll-fade-x flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md md:hidden">
            {NAV.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold" style={active ? { background: "rgba(255,70,85,.14)", color: "#fff" } : { color: "#a99a9c" }}>{n.label}</Link>;
            })}
            <button onClick={logout} className="ml-auto whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-white/50">Log out</button>
          </div>
          <main className="amber-safe mx-auto max-w-[1150px] px-5 py-7 sm:px-8">
            <div className="mb-4"><BackButton /></div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
