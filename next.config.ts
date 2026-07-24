import type { NextConfig } from "next";

// Standalone output is for Docker / VPS Node only. OpenNext Cloudflare builds
// its own Worker bundle — do not enable standalone for `opennextjs-cloudflare build`.
const useStandalone = process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: "standalone" as const } : {}),

  // The dev indicator defaults to bottom-left, where it sits on top of Amber's
  // composer on narrow screens and hides the first characters you type. Moved
  // out of the way rather than disabled, so compile errors still surface.
  devIndicators: { position: "top-left" },

  // The old /studio/* routes were a second, mock-only implementation of the
  // same tools now served by /create/*. They are gone; these redirects keep any
  // bookmarked or externally-linked URLs working.
  async redirects() {
    const moved: Record<string, string> = {
      commercials: "website-commercial",
      shorts: "shorts-20",
      "talking-photo": "talking-photo",
      dancing: "dancing-photo",
      product: "product-commercial",
      spokesperson: "ai-avatar-studio",
    };
    return [
      ...Object.entries(moved).map(([from, to]) => ({
        source: `/studio/${from}`,
        destination: `/create/${to}`,
        permanent: true,
      })),
      { source: "/studio", destination: "/create", permanent: true },
      // /business-hub was an unreachable, mock-only duplicate of the Business
      // Center. Removed, with the URL preserved.
      { source: "/business-hub", destination: "/business-center", permanent: true },
    ];
  },
};

export default nextConfig;

// Enables Cloudflare bindings during `next dev` only (avoids NFT tracing the
// whole project during production / OpenNext builds).
if (process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
