import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config.
 * Incremental cache via R2 can be enabled later — see docs/CLOUDFLARE_WORKERS.md.
 * Keeping the default (no R2) lets the Worker build without a bucket binding.
 */
export default defineCloudflareConfig({});
