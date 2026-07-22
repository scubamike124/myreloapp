import Link from "next/link";
import AppShell from "@/components/design/AppShell";
import CategorySearch from "@/components/avatars/CategorySearch";
import { CATALOG, COUNTS } from "@/lib/avatar-catalog";
import { GROUPS, FILTERS, primaryCounts } from "@/lib/avatar-taxonomy";

export const metadata = {
  title: "Avatar Library — Reelo",
  description: "Browse AI avatars and characters by industry, character type, animal, food and more.",
};

export default async function AvatarsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const showEmpty = all === "1";

  // Counted from the live catalog on every render. Nothing is stored.
  const counts = primaryCounts(CATALOG);

  return (
    <AppShell active="avatars">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
          Avatar Library
        </h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-[1.6] text-white/55">
          {COUNTS.total.toLocaleString()} avatars — {COUNTS.heygen.toLocaleString()} talking presenters and{" "}
          {COUNTS.characters.toLocaleString()} characters. Browse by who or what you need.
        </p>
      </div>

      <CategorySearch />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/avatars/all"
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Browse all {COUNTS.total.toLocaleString()}
        </Link>
        {/* Secondary categories: setting, attire and pose. Filters, not the way
            you browse — as requested, kept but demoted. */}
        {FILTERS.map((f) => (
          <Link
            key={f.slug}
            href={`/avatars/all?filter=${f.slug}`}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:text-white"
            style={{ color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }}
          >
            {f.icon} {f.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {GROUPS.map((group) => {
          const children = group.children
            .map((c) => ({ c, n: counts.get(c.slug) ?? 0 }))
            .filter((x) => showEmpty || x.n > 0)
            .sort((a, b) => b.n - a.n);
          if (children.length === 0) return null;

          const groupTotal = group.children.reduce((n, c) => n + (counts.get(c.slug) ?? 0), 0);

          return (
            <section key={group.slug}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  <span aria-hidden className="mr-1.5">{group.icon}</span>
                  {group.name}
                </h2>
                <span className="text-[12.5px] text-white/35">{groupTotal.toLocaleString()}</span>
              </div>

              {/* Small, dense category chips rather than large cards. */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {children.map(({ c, n }) => (
                  <Link
                    key={c.slug}
                    href={`/avatars/${c.slug}`}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${n === 0 ? "opacity-40" : "hover:bg-white/[.06]"}`}
                    style={{ border: "1px solid rgba(255,70,85,.16)" }}
                  >
                    <span className="text-[15px] leading-none" aria-hidden>{c.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-white">{c.name}</span>
                    <span className="shrink-0 text-[12px] font-bold" style={{ color: n > 0 ? "#ff8892" : "#6c5f61" }}>
                      {n.toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8">
        <Link href={showEmpty ? "/avatars" : "/avatars?all=1"} className="text-[13px] font-semibold" style={{ color: "#ff8892" }}>
          {showEmpty ? "Hide empty categories" : "Show every category, including empty ones →"}
        </Link>
      </div>
    </AppShell>
  );
}
