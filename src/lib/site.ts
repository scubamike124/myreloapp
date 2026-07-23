// ---------------------------------------------------------------------------
// The public web address the site is served from.
//
// Read everywhere a full URL is needed — canonical links, Open Graph tags,
// robots.txt, the sitemap. The product domain is www.myreelo.com, so a
// production build defaults to that with nothing to configure; local
// development defaults to localhost.
//
// NEXT_PUBLIC_SITE_URL overrides both, which is only needed to preview the site
// under a different address (a staging URL, an IP) before DNS points here.
//
// The value is normalised so a trailing slash, or a missing scheme, does not
// produce broken links like "www.myreelo.com//about".
// ---------------------------------------------------------------------------

/** The domain Michael owns; the production default. */
export const PRODUCTION_URL = "https://www.myreelo.com";

const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function normalise(url: string | undefined): string {
  if (!url) return process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000";
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withScheme.replace(/\/+$/, "");
}

/** e.g. "https://www.myreelo.com" — never a trailing slash. */
export const SITE_URL = normalise(raw);

/** True when serving under the real production domain rather than localhost. */
export const SITE_CONFIGURED = SITE_URL === PRODUCTION_URL || Boolean(raw);

/** Build an absolute URL for a path: absoluteUrl("/pricing"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
