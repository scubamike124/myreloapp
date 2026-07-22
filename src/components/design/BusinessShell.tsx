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
  // Both of these once pointed at "#" and were removed for it. They are back
  // because they now have real pages behind them, not because the design asked
  // for the row.
  { key: "brand", label: "Brand Kit", href: "/business-center/brand-kit", icon: "palette" },
  { key: "assets", label: "Assets", href: "/business-center/assets", icon: "folder" },
  { key: "social", label: "Social", href: "/business-center/social", icon: "share" },
  { key: "publishing", label: "Publishing", href: "/business-center/publishing", icon: "rocket" },
  { key: "scheduling", label: "Scheduling", href: "/business-center/scheduling", icon: "calendar" },
  { key: "analytics", label: "Analytics", href: "/business-center/analytics", icon: "chart" },
  { key: "revenue", label: "Revenue", href: "/business-center/revenue", icon: "dollar" },
  { key: "trend", label: "Trend AI", href: "/trends", icon: "brain" },
  { key: "hubpro", label: "Hub Pro", href: "/business-center/pro", icon: "crown" },
];

/**
 * SOON marks a section with no backend. It is the honest half of the design:
 * every one of these pages exists and explains itself, but none of them can
 * publish, schedule or report on anything yet, and the badge says so before
 * you click rather than after.
 */
const OVERVIEW_BADGES: Record<string, string> = {
  assets: "NEW",
  social: "SOON",
  publishing: "SOON",
  scheduling: "SOON",
  analytics: "SOON",
  revenue: "SOON",
  trend: "SOON",
  hubpro: "SOON",
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
        <div className="flex items-center justify-end gap-2 px-5 pt-3 sm:px-8">
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
            <span className="relative h-8 w-8 overflow-hidden rounded-full" style={{ border: "1px solid rgba(255,70,85,.4)" }}>
              <Image src="/assets/spokesperson.jpg" alt="Profile" fill sizes="36px" className="object-cover" />
            </span>
            {/* Hidden on the narrowest phones: with Back and the menu button
                also in this row, 320px could not fit the chip, and the overflow
                pushed Back off the left edge entirely. */}
            <div className="hidden leading-tight min-[380px]:block">
              <div className="text-sm font-bold">ReeloMaster</div>
              <div className="text-[11px]" style={{ color: "#ff5663" }}>Pro Plan</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a8b8d" strokeWidth="2" className="hidden min-[380px]:block"><path d="m6 9 6 6 6-6" /></svg>
          </Link>
        </div>

        {/* The preview banner used to live here. Every unbuilt section already
            wears a SOON badge — in the sidebar and on its own card — so the
            banner repeated what the page says anyway, and cost a strip across
            the top of a design meant to fit one screen. */}
        <div className="amber-safe px-5 pt-1.5 pb-4 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
