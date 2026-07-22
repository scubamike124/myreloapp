import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/design/AppShell";
import AvatarLibrary from "@/components/avatars/AvatarLibrary";
import { ALL_AVATARS, avatarsIn, getCategory, uncategorized } from "@/lib/avatar-categories";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "all") return { title: "All Avatars — Reelo" };
  if (slug === "other") return { title: "Everyone Else — Reelo" };
  const cat = getCategory(slug);
  return { title: cat ? `${cat.name} Avatars — Reelo` : "Avatars — Reelo" };
}

export default async function AvatarCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;

  // Counts come from the catalog every time this renders.
  let title: string;
  let icon: string;
  let description: string;
  let count: number;

  if (slug === "all") {
    title = "All avatars";
    icon = "🌟";
    description = "Every avatar in the catalog.";
    count = ALL_AVATARS.length;
  } else if (slug === "other") {
    title = "Everyone else";
    icon = "👤";
    description = "Avatars whose names don't place them in a category yet.";
    count = uncategorized().length;
  } else {
    const cat = getCategory(slug);
    if (!cat) notFound();
    title = cat.name;
    icon = cat.icon;
    description = cat.description;
    count = avatarsIn(slug).length;
  }

  return (
    <AppShell active="avatars">
      <div className="mb-6">
        <Link href="/avatars" className="text-[13px] font-semibold" style={{ color: "#ff8892" }}>
          ← All categories
        </Link>
        <h1 className="font-display mt-2 flex items-center gap-2.5 text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
          <span aria-hidden>{icon}</span>
          {title}
          <span className="text-2xl font-bold sm:text-3xl" style={{ color: "#ff8892" }}>
            ({count.toLocaleString()})
          </span>
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] leading-[1.6] text-white/55">{description}</p>
      </div>

      <AvatarLibrary category={slug} initialQuery={q ?? ""} />
    </AppShell>
  );
}
