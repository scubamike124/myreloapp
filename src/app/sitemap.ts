import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

// Served at /sitemap.xml. Lists the public, indexable pages so search engines
// can find them. Personal, admin and API routes are deliberately left out —
// robots.ts disallows them too.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/create",
    "/avatars",
    "/pricing",
    "/features",
    "/how-it-works",
    "/examples",
    "/faq",
    "/trends",
    "/roadmap",
    "/business-center",
    "/business-center/pro",
    "/support",
    "/terms",
    "/privacy",
    "/refunds",
  ];

  const toolPaths = TOOLS.map((t) => `/create/${t.slug}`);

  return [...staticPaths, ...toolPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
