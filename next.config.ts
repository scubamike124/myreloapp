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
    const sha = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "pipe"] }).toString().trim().slice(0, 40);
    console.log(`[next.config] resolved build SHA from git: ${sha}`);
    return sha;
  } catch (e) {
    // Silently returning "unknown" here once meant a stale or missing
    // BUILD_SHA was indistinguishable from "the build succeeded and this
    // just isn't a git checkout" — logged instead so a real deploy failure
    // shows up in build logs rather than looking identical to normal.
    // stderr (not just e.message) is what actually names the reason —
    // e.message alone is just "Command failed: git rev-parse HEAD".
    const stderr = e instanceof Error && "stderr" in e ? String((e as { stderr?: unknown }).stderr) : "";
    console.warn(`[next.config] could not resolve a build SHA (no env var set, git rev-parse failed): ${stderr || (e instanceof Error ? e.message : String(e))}`);
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
      { source: "/contact", destination: "/support", permanent: true },
      // Common bookmarks / external guesses → real routes
      { source: "/settings", destination: "/account", permanent: false },
      { source: "/ai-avatar-studio", destination: "/create/ai-avatar-studio", permanent: true },
      { source: "/create/ai-avatar", destination: "/create/ai-avatar-studio", permanent: false },
    ];
  },

  async headers() {
    // Baseline browser isolation for HTML/app routes. Stripe Checkout + R2 media
    // + Google Fonts are allowlisted; tighten further once third-party embeds settle.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com",
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CF terminates TLS; still declare HSTS so browsers enforce HTTPS on apex/www.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      /*
       * Stop pages being cached at the edge for a year.
       *
       * HTML was going out with `s-maxage=31536000` and nothing purged it on
       * deploy, so the live site served a stale homepage indefinitely: a
       * corrected marketing claim shipped, the Worker had the new code, and
       * https://www.myreelo.com/ still returned the old text — while
       * https://www.myreelo.com/?cb=1 returned the new one. Anything that
       * changed a page and did not change its URL simply never reached
       * customers, and it looked deployed from every angle except opening it.
       *
       * A minute of shared cache keeps the edge doing its job; the browser is
       * told to revalidate every time, and stale-while-revalidate means nobody
       * waits for the origin during that window.
       *
       * Hashed build output is excluded and keeps its immutable caching — those
       * URLs change whenever their content does, which is what makes a long
       * cache correct for them and wrong for HTML.
       */
      {
        source: "/:path((?!_next/static|_next/image|assets/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=86400",
          },
        ],
      },
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
