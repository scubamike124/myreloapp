import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS, getTool } from "@/lib/tools";
import ToolStudio from "@/components/create/ToolStudio";
import WebsiteCommercial from "@/components/create/WebsiteCommercial";
import AiAvatarStudio from "@/components/create/AiAvatarStudio";
import StoryBook from "@/components/create/StoryBook";
import StoryMaker from "@/components/create/StoryMaker";
import BackButton from "@/components/design/BackButton";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  return { title: tool ? `${tool.title} — Reelo` : "Create — Reelo" };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  // The tool studios render their own full-page layouts rather than going
  // through a shell, so Back is added here — these are the pages people most
  // need to get out of.
  const studio =
    slug === "bedtime-storybook" ? <StoryBook /> : slug === "ai-story-maker" ? <StoryMaker /> : slug === "website-commercial" ? <WebsiteCommercial /> : slug === "ai-avatar-studio" ? <AiAvatarStudio /> : <ToolStudio tool={tool} />;

  // Most studios open with their own sticky header carrying a "← Create" link.
  // Floating a second Back button over that both duplicated the control and,
  // below 1440px, sat directly on top of the header's logo — the narrower the
  // screen, the worse it got, so every phone had them overlapping. Storybook is
  // the one studio with no header of its own, so it still needs the floater.
  const hasOwnHeader = slug !== "bedtime-storybook";

  return (
    <>
      {!hasOwnHeader && (
        <div className="pointer-events-none fixed left-4 top-4 z-50 sm:left-6 sm:top-6">
          <div className="pointer-events-auto">
            <BackButton />
          </div>
        </div>
      )}
      {studio}
    </>
  );
}
