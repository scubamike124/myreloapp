// ---------------------------------------------------------------------------
// The public web address the site is served from.
//
// One setting, read everywhere a full URL is needed — canonical links, Open
// Graph tags, robots.txt, the sitemap. Set NEXT_PUBLIC_SITE_URL to your real
// domain when you deploy and everything downstream uses it; leave it unset in
// development and it falls back to localhost.
//
//   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
//
// The value is normalised so a trailing slash, or a missing scheme, does not
// produce broken links like "yourdomain.com//about".
// ---------------------------------------------------------------------------

const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function normalise(url: string | undefined): string {
  if (!url) return "http://localhost:3000";
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withScheme.replace(/\/+$/, "");
}

/** e.g. "https://yourdomain.com" — never a trailing slash. */
export const SITE_URL = normalise(raw);

/** True once a real domain is configured, so dev-only behaviour can branch. */
export const SITE_CONFIGURED = Boolean(raw);

/** Build an absolute URL for a path: absoluteUrl("/pricing"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
