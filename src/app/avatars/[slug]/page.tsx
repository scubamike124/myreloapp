import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/design/AppShell";
import AvatarList from "@/components/avatars/AvatarList";
import { CATALOG, COUNTS, search } from "@/lib/avatar-catalog";
import { getPrimary, getFilter } from "@/lib/avatar-taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "all") return { title: "All Avatars — Reelo" };
  const p = getPrimary(slug);
  return { title: p ? `${p.name} Avatars — Reelo` : "Avatars — Reelo" };
}

export default async function AvatarCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { slug } = await params;
  const { q, filter } = await searchParams;

  let title: string;
  let icon: string;
  let count: number;

  if (slug === "all") {
    title = "All avatars";
    icon = "🌟";
    count = filter ? search({ filter }, CATALOG).length : COUNTS.total;
  } else {
    const p = getPrimary(slug);
    if (!p) notFound();
    title = p.name;
    icon = p.icon;
    count = search({ primary: slug }, CATALOG).length;
  }

  const activeFilter = filter ? getFilter(filter) : undefined;

  return (
    <AppShell active="avatars">
      <div className="mb-5">
        <Link href="/avatars" className="text-[13px] font-semibold" style={{ color: "#ff8892" }}>
          ← All categories
        </Link>
        <h1 className="font-display mt-2 flex flex-wrap items-center gap-2.5 text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">
          <span aria-hidden>{icon}</span>
          {title}
          {activeFilter && <span className="text-white/40">· {activeFilter.name}</span>}
          <span className="text-xl font-bold sm:text-2xl" style={{ color: "#ff8892" }}>
            ({count.toLocaleString()})
          </span>
        </h1>
        {activeFilter && (
          <Link href={`/avatars/${slug}`} className="mt-1 inline-block text-[12.5px]" style={{ color: "#ff8892" }}>
            Clear the {activeFilter.name} filter
          </Link>
        )}
      </div>

      <AvatarList primary={slug} initialQuery={q ?? ""} />
    </AppShell>
  );
}
