import Link from "next/link";
import Image from "next/image";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import BusinessMobileNav from "@/components/design/BusinessMobileNav";
import BackButton from "@/components/design/BackButton";

type NavItem = { key: string; label: string; href: string; icon: IconKey };

const NAV: NavItem[] = [
  { key: "overview", label: "Overview", href: "/business-center", icon: "home" },
  { key: "create", label: "Create", href: "/create", icon: "pen" },
  { key: "library", label: "Video Library", href: "/library", icon: "film" },
  // Brand Kit and Assets were listed here pointing at "#". Both features are
  // unbuilt, so they are omitted rather than shown as dead nav items.
  { key: "social", label: "Social", href: "/business-center/social", icon: "share" },
  { key: "publishing", label: "Publishing", href: "/business-center/publishing", icon: "rocket" },
  { key: "scheduling", label: "Scheduling", href: "/business-center/scheduling", icon: "calendar" },
  { key: "analytics", label: "Analytics", href: "/business-center/analytics", icon: "chart" },
  { key: "revenue", label: "Revenue", href: "/business-center/revenue", icon: "dollar" },
  { key: "trend", label: "Trend AI", href: "/trends", icon: "brain" },
  { key: "hubpro", label: "Hub Pro", href: "/business-center/pro", icon: "crown" },
];

const OVERVIEW_BADGES: Record<string, string> = {
  assets: "NEW", hubpro: "SOON",
};

function Badge({ text }: { text: string }) {
  const isSoon = text === "SOON";
  return (
    <span
      className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={isSoon
        ? { color: "#c98", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }
        : { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
    >
      {text}
    </span>
  );
}

export default function BusinessShell({
  active,
  variant,
  children,
}: {
  active: string;
  variant: "overview" | "pro";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen" style={{ background: "#0a0607" }}>
      {/* sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-white/8 p-4 lg:flex" style={{ background: "linear-gradient(180deg,rgba(18,8,10,.9),rgba(8,4,5,.9))" }}>
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="font-display grid h-9 w-9 place-items-center rounded-lg text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)", boxShadow: "0 0 18px rgba(225,29,42,.55)" }}>R</span>
          <span className="font-display text-xl font-bold">Reelo</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => {
            const on = n.key === active;
            const badge = variant === "pro" ? (n.key === "overview" ? null : "PRO") : OVERVIEW_BADGES[n.key];
            return (
              <Link
                key={n.key}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${on ? "" : "hover:bg-white/5"}`}
                style={on ? { color: "#fff", background: "linear-gradient(135deg,rgba(255,54,69,.22),rgba(196,16,28,.14))", border: "1px solid rgba(255,70,85,.4)" } : { color: "#b9a9ab" }}
              >
                <BIcon name={n.icon} size={18} color={on ? "#ff5663" : "#9a8b8d"} glow={on} />
                {n.label}
                {badge && <Badge text={badge} />}
              </Link>
            );
          })}
        </nav>

        {/* bottom card */}
        <div className="mt-4 rounded-2xl p-4 text-center" style={{ border: "1px solid rgba(255,70,85,.3)", background: "radial-gradient(200px 120px at 50% 0,rgba(225,29,42,.2),transparent 70%),rgba(14,6,8,.6)" }}>
          {variant === "pro" ? (
            <>
              <div className="text-sm font-semibold text-white/70">You&apos;re on</div>
              <div className="font-display text-lg font-bold" style={{ color: "#ff2d3f" }}>Pro Plan</div>
              <div className="mt-1.5 text-xs" style={{ color: "#a99a9c" }}>All features unlocked.<br />All limits removed.</div>
              <div className="mt-3 flex justify-center"><BIcon name="crown" size={34} /></div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-white/70">Upgrade to</div>
              <div className="font-display text-lg font-bold" style={{ color: "#ff2d3f" }}>Hub Pro</div>
              <div className="mt-1.5 text-xs" style={{ color: "#a99a9c" }}>Unlock all upcoming powerful features.</div>
              <Link href="/business-center/pro" className="mt-3 block rounded-lg py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Learn More</Link>
            </>
          )}
        </div>
      </aside>

      {/* main */}
      <main className="relative min-w-0 flex-1">
        {/* top profile chip */}
        <div className="flex items-center justify-end gap-2 px-5 pt-5 sm:px-8">
          <BackButton className="mr-auto" />
          {/* Invisible on desktop, so this row looks exactly as it did. */}
          <BusinessMobileNav
            active={active}
            items={NAV.map((n) => ({
              ...n,
              badge: variant === "pro" ? (n.key === "overview" ? null : "PRO") : OVERVIEW_BADGES[n.key] ?? null,
            }))}
          />
          <Link href="/account" className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:border-[rgba(255,70,85,.45)]" style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.6)" }}>
            <span className="relative h-9 w-9 overflow-hidden rounded-full" style={{ border: "1px solid rgba(255,70,85,.4)" }}>
              <Image src="/assets/spokesperson.jpg" alt="Profile" fill sizes="36px" className="object-cover" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold">ReeloMaster</div>
              <div className="text-[11px]" style={{ color: "#ff5663" }}>Pro Plan</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a8b8d" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </Link>
        </div>

        <div className="amber-safe px-5 pt-2 sm:px-8">
          <PreviewNotice />
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * The Business Center is a designed preview: publishing, scheduling, analytics,
 * revenue and social connections have no backend yet. Saying so once here is
 * more honest than scattering buttons that quietly do nothing.
 */
function PreviewNotice() {
  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed"
      style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-px shrink-0"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      <span>
        <strong className="font-bold">Preview.</strong> The Business Center isn&apos;t connected to live data yet —
        figures shown are examples, and publishing, scheduling and social connections aren&apos;t active. Video
        generation in <Link href="/create" className="underline underline-offset-2">Create</Link> is fully working.
      </span>
    </div>
  );
}
