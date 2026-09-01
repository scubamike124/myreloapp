import type { Metadata } from "next";
import { getProFeature, PRO_REDIRECTS } from "@/lib/pro-features";
import { notFound, redirect } from "next/navigation";
import ProFeatureStudio from "@/components/business/ProFeatureStudio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (PRO_REDIRECTS[slug]) return { title: "Business Center Pro — Reelo" };
  const feature = getProFeature(slug);
  if (!feature) return { title: "Business Center Pro — Reelo" };
  return { title: `${feature.title} — Reelo`, description: feature.blurb };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (PRO_REDIRECTS[slug]) redirect(PRO_REDIRECTS[slug]);
  const feature = getProFeature(slug);
  if (!feature) notFound();
  return <ProFeatureStudio feature={feature} />;
}
