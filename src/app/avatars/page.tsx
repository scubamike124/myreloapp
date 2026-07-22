import Link from "next/link";
import AppShell from "@/components/design/AppShell";
import CategorySearch from "@/components/avatars/CategorySearch";
import { ALL_AVATARS, populatedCategories, emptyCategories, uncategorized } from "@/lib/avatar-categories";

export const metadata = {
  title: "Avatar Library — Reelo",
  description: "Browse AI avatars by category and start a video with any of them.",
};

export default async function AvatarsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showEmpty = all === "1";

  // Every number below is computed here, from the catalog, on each request.
  const populated = populatedCategories();
  const empty = emptyCategories();
  const other = uncategorized().length;
  const total = ALL_AVATARS.length;

  return (
    <AppShell active="avatars">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
          Avatar Library
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-[1.6] text-white/55">
          {total.toLocaleString()} AI avatars, grouped by what they suit. Pick a category, or search across the whole
          catalog.
        </p>
      </div>

      <CategorySearch />

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/avatars/all"
          className="group rounded-2xl p-4 transition-all hover:-translate-y-0.5"
          style={{ border: "1px solid rgba(255,70,85,.4)", background: "linear-gradient(135deg,rgba(255,54,69,.16),rgba(196,16,28,.08))" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none" aria-hidden>🌟</span>
            <div className="min-w-0">
              <p className="font-display text-[15.5px] font-bold text-white">
                All avatars <span style={{ color: "#ff8892" }}>({total.toLocaleString()})</span>
              </p>
              <p className="mt-1 text-[13px] leading-[1.5] text-white/55">Every avatar in the catalog, newest first.</p>
            </div>
          </div>
        </Link>

        {populated.map(({ category, count }) => (
          <Link
            key={category.slug}
            href={`/avatars/${category.slug}`}
            className="group rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(255,70,85,.45)]"
            style={{ border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none" aria-hidden>{category.icon}</span>
              <div className="min-w-0">
                <p className="font-display text-[15.5px] font-bold text-white">
                  {category.name} <span style={{ color: "#ff8892" }}>({count.toLocaleString()})</span>
                </p>
                <p className="mt-1 text-[13px] leading-[1.5] text-white/55">{category.description}</p>
              </div>
            </div>
          </Link>
        ))}

        {other > 0 && (
          <Link
            href="/avatars/other"
            className="group rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(255,70,85,.45)]"
            style={{ border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none" aria-hidden>👤</span>
              <div className="min-w-0">
                <p className="font-display text-[15.5px] font-bold text-white">
                  Everyone else <span style={{ color: "#ff8892" }}>({other.toLocaleString()})</span>
                </p>
                <p className="mt-1 text-[13px] leading-[1.5] text-white/55">
                  Avatars whose names don&apos;t place them in a category yet.
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Categories are defined for a much wider catalog than this one. Rather
          than a wall of "(0)", they are listed quietly and light up on their own
          the moment matching avatars exist. */}
      {empty.length > 0 && (
        <div className="mt-10">
          {showEmpty ? (
            <>
              <p className="mb-3 text-[13px] text-white/45">
                {empty.length} categories are defined but have no avatars in the catalog yet. They will appear above
                automatically, with a live count, as soon as they do.
              </p>
              <div className="flex flex-wrap gap-2">
                {empty.map((c) => (
                  <span
                    key={c.slug}
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-white/40"
                    style={{ border: "1px solid rgba(255,255,255,.08)" }}
                  >
                    {c.icon} {c.name} (0)
                  </span>
                ))}
              </div>
              <Link href="/avatars" className="mt-3 inline-block text-[13px] font-semibold" style={{ color: "#ff8892" }}>
                Hide empty categories
              </Link>
            </>
          ) : (
            <Link href="/avatars?all=1" className="text-[13px] font-semibold" style={{ color: "#ff8892" }}>
              Show {empty.length} categories waiting on avatars →
            </Link>
          )}
        </div>
      )}
    </AppShell>
  );
}
