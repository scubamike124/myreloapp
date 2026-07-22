"use client";

import { useRouter, usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Back control, shown on every page except the home page.
//
// router.back() alone is not enough: if someone lands directly on a deep page
// (a shared link, a bookmark, a new tab) there is nothing to go back TO, and
// the button would do nothing. So when there is no in-app history we navigate
// to a sensible parent instead, which is always somewhere.
// ---------------------------------------------------------------------------

/** Parent route for a path, used when there is no history to pop. */
function parentOf(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return "/";
  return "/" + parts.slice(0, -1).join("/");
}

export default function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => {
        // history.length alone is not a safe test: a freshly opened tab still
        // reports 2 (the blank page counts), so back() would land on about:blank.
        // A same-origin referrer means the previous entry is genuinely a page of
        // ours; anything else falls back to the parent route, which always exists.
        let cameFromApp = false;
        try {
          cameFromApp = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
        } catch {
          cameFromApp = false;
        }
        if (cameFromApp && window.history.length > 1) router.back();
        else router.push(parentOf(pathname));
      }}
      aria-label="Go back"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-white/5 ${className}`}
      style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(14,7,9,.6)", color: "#e8d9db" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
  );
}
