/**
 * Runtime platform detection for MyReelo.
 *
 * Cloudflare Workers (OpenNext) has no durable local filesystem — SQLite and
 * .data/media must not be used there. Neon Postgres (+ remote blob) is required.
 *
 * Docker / VPS Node remains supported via DOCKER_BUILD / local disk.
 */

export function isCloudflareWorkers(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_WORKERS === "1" ||
      process.env.CF_WORKER === "1" ||
      process.env.CF_PAGES === "1" ||
      process.env.WORKERS_CI === "1",
  );
}

/** True when the filesystem must not be used for durable state. */
export function isEphemeralFilesystem(): boolean {
  if (process.env.VERCEL === "1") return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return true;
  if (process.env.DISABLE_SQLITE === "1") return true;
  if (isCloudflareWorkers()) return true;
  return false;
}
