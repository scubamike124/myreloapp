import heygen from "@/data/heygen-avatars.json";
import characters from "@/data/character-avatars.json";
import { type CatalogAvatar, primariesFor, filtersFor, inPrimary, inFilter } from "@/lib/avatar-taxonomy";

// ---------------------------------------------------------------------------
// One catalog, several providers.
//
//   source "heygen" — filmed talking-head avatars. Drive AI Avatar Studio.
//   source "reelo"  — generated character images (fruit, dragons, animals…).
//                     Drive Talking Photo, which animates any picture.
//
// The distinction matters at the point of use, not while browsing: a user
// looking for a dragon should find it in the same library as a doctor, and be
// sent to whichever tool can actually animate it.
// ---------------------------------------------------------------------------

const HEYGEN: CatalogAvatar[] = (heygen as CatalogAvatar[]).map((a) => ({ ...a, source: "heygen" }));
const CHARACTERS: CatalogAvatar[] = (characters as CatalogAvatar[]).map((a) => ({ ...a, source: "reelo" }));

export const CATALOG: CatalogAvatar[] = [...CHARACTERS, ...HEYGEN];

export const COUNTS = {
  total: CATALOG.length,
  heygen: HEYGEN.length,
  characters: CHARACTERS.length,
};

/** Which tool can animate this avatar. */
export function studioFor(avatar: CatalogAvatar): { href: string; label: string } {
  return avatar.source === "reelo"
    ? { href: `/create/talking-photo?avatar=${encodeURIComponent(avatar.avatarId)}`, label: "Talking Photo" }
    : { href: `/create/ai-avatar-studio?avatar=${encodeURIComponent(avatar.avatarId)}`, label: "AI Avatar Studio" };
}

export type Query = {
  primary?: string;
  filter?: string;
  q?: string;
  gender?: string;
  premium?: "only" | "exclude" | "any";
  source?: string;
};

/** Single pass, applied in the order that eliminates the most first. */
export function search(query: Query, list: CatalogAvatar[] = CATALOG): CatalogAvatar[] {
  let out = list;
  if (query.primary && query.primary !== "all") out = out.filter((a) => inPrimary(a, query.primary!));
  if (query.filter) out = out.filter((a) => inFilter(a, query.filter!));
  if (query.source) out = out.filter((a) => (a.source ?? "heygen") === query.source);
  if (query.gender) out = out.filter((a) => a.gender.toLowerCase() === query.gender);
  if (query.premium === "only") out = out.filter((a) => a.premium);
  if (query.premium === "exclude") out = out.filter((a) => !a.premium);
  if (query.q) {
    const needle = query.q.toLowerCase();
    out = out.filter(
      (a) => a.name.toLowerCase().includes(needle) || (a.tags ?? []).some((t) => t.toLowerCase().includes(needle)),
    );
  }
  return out;
}

export { primariesFor, filtersFor };
export type { CatalogAvatar };
