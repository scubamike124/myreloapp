import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Standalone output is for Docker / VPS Node only. OpenNext Cloudflare builds
// its own Worker bundle — do not enable standalone for `opennextjs-cloudflare build`.
const useStandalone = process.env.DOCKER_BUILD === "1";

function resolveBuildSha(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_BUILD_SHA ||
    process.env.BUILD_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.CF_COMMIT_SHA ||
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().slice(0, 40);
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim().slice(0, 40);
  } catch {
    return "unknown";
  }
}

const buildSha = resolveBuildSha();

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: "standalone" as const } : {}),

  // Bake the commit into the Worker bundle so /api/health can prove which build
  // is live (Cloudflare runtime often omits CI SHA env vars).
  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    BUILD_SHA: buildSha,
  },

  // postgres.js (and legacy pg) need workerd export conditions + full traces.
  serverExternalPackages: ["postgres", "pg", "pg-cloudflare"],
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/postgres/**",
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
      "./node_modules/pg/lib/**",
    ],
  },

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
