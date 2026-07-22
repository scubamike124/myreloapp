"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Search from the category page. Sends you into the "all" view with the query
 * applied, so search always spans the whole catalog rather than one shelf.
 */
export default function CategorySearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/avatars/all?q=${encodeURIComponent(term)}` : "/avatars/all");
      }}
      className="flex gap-2"
      role="search"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search all avatars by name…"
        aria-label="Search all avatars"
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
        style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
      >
        Search
      </button>
    </form>
  );
}
