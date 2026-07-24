import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config.
 *
 * Cloudflare Workers Builds typically run:
 *   1) npm run build
 *   2) npx wrangler deploy  →  opennextjs-cloudflare deploy
 *
 * So package.json "build" is `opennextjs-cloudflare build`. That CLI would
 * recurse if it invoked `npm run build` again — point it at Next directly.
 *
 * Incremental cache via R2 can be enabled later — see docs/CLOUDFLARE_WORKERS.md.
 */
const config = defineCloudflareConfig({});

export default {
  ...config,
  buildCommand: "npx next build",
};
