/**
 * Where a storybook goes after it is made.
 *
 * Until this file existed, nowhere. `/api/storybook` generated a book and
 * returned it, and StoryMaker's UI told the truth about the consequence:
 * *"Episodes live in this page only — save or print them before you close
 * it."* Everything the directive asks for downstream — a library, a sequel, a
 * character who looks the same in book four as in book one, a movie ordered
 * from a story written last week — is blocked on the same missing step, which
 * is writing it down.
 *
 * ## Illustrations are stored as links, not as text
 *
 * The generator hands back each illustration as a `data:` URL, roughly a
 * megabyte of base64 apiece. Putting ten of those in the row would make the
 * story row eight to twelve megabytes, and the library — which only wants
 * titles and covers — would drag all of it across the wire to render a list.
 * So the bytes go through `ingestBytes`, the same door Veo's videos use, and
 * the row keeps a URL.
 *
 * ## Failing to save never fails the request
 *
 * A parent has already paid tokens and waited two minutes by the time we get
 * here; the book is in the response either way. If persistence fails they lose
 * the library entry, not the book. So every function here returns null rather
 * than throwing, and the route reports `saved: false` so the UI can say so
 * plainly instead of pretending.
 */

import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { ingestBytes } from "@/lib/media-ingest";
import type { CharacterBible } from "./character-bible";
import { EMPTY_MEMORY, nextEpisode, readMemory, rememberEpisode, type EpisodeNote, type SeriesMemory } from "./story-memory";
import type { StoryArtifact, StoryProductId } from "./products";

type Row = Record<string, unknown>;
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

export type StoredPage = {
  text: string;
  /** Same-origin or blob URL. Empty when that page's illustration failed. */
  image: string;
  /** The scene description the illustration was drawn from. */
  illustration: string;
};

export type StoryRecord = {
  id: string;
  userId: string;
  characterId: string | null;
  seriesId: string | null;
  episode: number;
  title: string;
  dedication: string;
  category: string;
  theme: string;
  languageCode: string;
  request: string;
  pages: StoredPage[];
  characterVersion: number;
  product: StoryProductId;
  createdAt: string;
  updatedAt: string;
};

/** A library row: everything except the pages. */
export type StorySummary = Omit<StoryRecord, "pages" | "request"> & {
  pageCount: number;
  /** First page's illustration, for the shelf. */
  cover: string;
};

export type ArtifactStatus = "pending" | "producing" | "ready" | "failed";

export type ArtifactRecord = {
  id: string;
  storyId: string;
  kind: StoryArtifact;
  status: ArtifactStatus;
  url: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type SeriesRecord = {
  id: string;
  userId: string;
  characterId: string | null;
  title: string;
  memory: SeriesMemory;
  episodes: number;
  createdAt: string;
  updatedAt: string;
};

async function db(): Promise<Sql | null> {
  if (!dbConfigured()) return null;
  try {
    if (!(await ensureSchema())) return null;
    return (await sqlAsync()) as Sql | null;
  } catch {
    return null;
  }
}

const now = () => new Date().toISOString();
const text = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// --- illustrations ----------------------------------------------------------

// [\s\S] rather than the `s` flag, which this tsconfig's target predates.
const DATA_URL = /^data:([^;,]+);base64,([\s\S]+)$/;

/**
 * Move each illustration out of the response body and into storage.
 *
 * A page whose upload fails keeps its text and loses its picture, rather than
 * taking the whole book down with it. The count of what survived is returned
 * so the caller can be honest about a partly-illustrated book instead of
 * discovering it later on the shelf.
 */
export async function storeIllustrations(
  pages: { text: string; image?: string; illustration?: string }[],
): Promise<{ pages: StoredPage[]; stored: number }> {
  const out: StoredPage[] = [];
  let stored = 0;

  for (const page of pages) {
    const image = text(page.image);
    const match = DATA_URL.exec(image);
    if (!match) {
      // Already a URL (or absent) — keep it as it is.
      out.push({ text: text(page.text), image, illustration: text(page.illustration) });
      if (image) stored++;
      continue;
    }
    try {
      const bytes = Buffer.from(match[2], "base64");
      // Dashes kept: /api/media/[file] matches a 36-character UUID exactly, so
      // a stripped id would 404 on disk-backed hosts.
      const ingested = await ingestBytes(randomUUID(), new Uint8Array(bytes), match[1]);
      out.push({ text: text(page.text), image: ingested?.url ?? "", illustration: text(page.illustration) });
      if (ingested?.url) stored++;
    } catch {
      out.push({ text: text(page.text), image: "", illustration: text(page.illustration) });
    }
  }

  return { pages: out, stored };
}

// --- character bibles -------------------------------------------------------

function toBible(row: Row): CharacterBible {
  return {
    id: text(row.id),
    userId: text(row.userId),
    name: text(row.name),
    ageBand: (text(row.ageBand) || undefined) as CharacterBible["ageBand"],
    face: text(row.face),
    hair: text(row.hair),
    clothing: text(row.clothing),
    bodyProportions: text(row.bodyProportions) || undefined,
    animationStyle: text(row.animationStyle) || undefined,
    expressions: parseJson<string[]>(row.expressions, []),
    personality: parseJson<string[]>(row.personality, []),
    voice: parseJson<CharacterBible["voice"]>(row.voice, {}),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
    version: num(row.version, 1),
  };
}

export async function saveCharacter(
  userId: string,
  bible: Omit<CharacterBible, "id" | "userId" | "createdAt" | "updatedAt" | "version">,
): Promise<CharacterBible | null> {
  const q = await db();
  if (!q || !userId) return null;
  const id = randomUUID();
  const stamp = now();
  try {
    await q`
      INSERT INTO story_characters
        (id, user_id, name, age_band, face, hair, clothing, body_proportions, animation_style,
         expressions, personality, voice, version, created_at, updated_at)
      VALUES
        (${id}, ${userId}, ${bible.name}, ${bible.ageBand ?? null}, ${bible.face}, ${bible.hair},
         ${bible.clothing}, ${bible.bodyProportions ?? null}, ${bible.animationStyle ?? null},
         ${JSON.stringify(bible.expressions ?? [])}, ${JSON.stringify(bible.personality ?? [])},
         ${JSON.stringify(bible.voice ?? {})}, 1, ${stamp}, ${stamp})`;
    return { ...bible, id, userId, createdAt: stamp, updatedAt: stamp, version: 1 };
  } catch {
    return null;
  }
}

export async function getCharacter(userId: string, id: string): Promise<CharacterBible | null> {
  const q = await db();
  if (!q || !userId || !id) return null;
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", name, age_band AS "ageBand", face, hair, clothing,
             body_proportions AS "bodyProportions", animation_style AS "animationStyle",
             expressions, personality, voice, version,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM story_characters WHERE id = ${id} AND user_id = ${userId}`;
    return rows[0] ? toBible(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listCharacters(userId: string): Promise<CharacterBible[]> {
  const q = await db();
  if (!q || !userId) return [];
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", name, age_band AS "ageBand", face, hair, clothing,
             body_proportions AS "bodyProportions", animation_style AS "animationStyle",
             expressions, personality, voice, version,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM story_characters WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 50`;
    return rows.map(toBible);
  } catch {
    return [];
  }
}

/**
 * Write a merged bible back.
 *
 * The merge itself lives in `applyBibleUpdate`, which knows the rule that a
 * partial update must never blank a field. This only stores the result.
 */
export async function writeCharacter(bible: CharacterBible): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  try {
    await q`
      UPDATE story_characters SET
        name = ${bible.name},
        age_band = ${bible.ageBand ?? null},
        face = ${bible.face},
        hair = ${bible.hair},
        clothing = ${bible.clothing},
        body_proportions = ${bible.bodyProportions ?? null},
        animation_style = ${bible.animationStyle ?? null},
        expressions = ${JSON.stringify(bible.expressions ?? [])},
        personality = ${JSON.stringify(bible.personality ?? [])},
        voice = ${JSON.stringify(bible.voice ?? {})},
        version = ${bible.version},
        updated_at = ${bible.updatedAt}
      WHERE id = ${bible.id} AND user_id = ${bible.userId}`;
    return true;
  } catch {
    return false;
  }
}

// --- series -----------------------------------------------------------------

function toSeries(row: Row): SeriesRecord {
  return {
    id: text(row.id),
    userId: text(row.userId),
    characterId: text(row.characterId) || null,
    title: text(row.title),
    memory: readMemory(row.memory),
    episodes: num(row.episodes, 0),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  };
}

export async function createSeries(
  userId: string,
  title: string,
  characterId: string | null,
): Promise<SeriesRecord | null> {
  const q = await db();
  if (!q || !userId) return null;
  const id = randomUUID();
  const stamp = now();
  try {
    await q`
      INSERT INTO story_series (id, user_id, character_id, title, memory, episodes, created_at, updated_at)
      VALUES (${id}, ${userId}, ${characterId}, ${title}, ${JSON.stringify(EMPTY_MEMORY)}, 0, ${stamp}, ${stamp})`;
    return {
      id,
      userId,
      characterId,
      title,
      memory: { ...EMPTY_MEMORY },
      episodes: 0,
      createdAt: stamp,
      updatedAt: stamp,
    };
  } catch {
    return null;
  }
}

export async function getSeries(userId: string, id: string): Promise<SeriesRecord | null> {
  const q = await db();
  if (!q || !userId || !id) return null;
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", character_id AS "characterId", title, memory, episodes,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM story_series WHERE id = ${id} AND user_id = ${userId}`;
    return rows[0] ? toSeries(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listSeries(userId: string): Promise<SeriesRecord[]> {
  const q = await db();
  if (!q || !userId) return [];
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", character_id AS "characterId", title, memory, episodes,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM story_series WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 50`;
    return rows.map(toSeries);
  } catch {
    return [];
  }
}

/**
 * Fold a finished episode into a series' memory.
 *
 * The `episodes` counter is stored rather than counted, because it is the
 * number the next sequel takes and it must not change when an old story is
 * deleted — episode four staying episode four is what makes "what happened
 * before" true.
 */
export async function recordEpisode(
  series: SeriesRecord,
  note: EpisodeNote,
  facts: Partial<SeriesMemory>,
): Promise<SeriesRecord | null> {
  const q = await db();
  if (!q) return null;
  const memory = rememberEpisode(series.memory, note, facts);
  const stamp = now();
  const episodes = Math.max(series.episodes, note.episode);
  try {
    await q`
      UPDATE story_series
      SET memory = ${JSON.stringify(memory)}, episodes = ${episodes}, updated_at = ${stamp}
      WHERE id = ${series.id} AND user_id = ${series.userId}`;
    return { ...series, memory, episodes, updatedAt: stamp };
  } catch {
    return null;
  }
}

/** The episode number a new story in this series should take. */
export function episodeFor(series: SeriesRecord | null): number {
  if (!series) return 1;
  return Math.max(series.episodes + 1, nextEpisode(series.memory));
}

// --- stories ----------------------------------------------------------------

export type NewStory = {
  userId: string;
  characterId?: string | null;
  seriesId?: string | null;
  episode?: number;
  title: string;
  dedication?: string;
  category?: string;
  theme?: string;
  languageCode?: string;
  request?: string;
  pages: StoredPage[];
  characterVersion?: number;
  product?: StoryProductId;
};

export async function saveStory(input: NewStory): Promise<StoryRecord | null> {
  const q = await db();
  if (!q || !input.userId) return null;
  const id = randomUUID();
  const stamp = now();
  const record: StoryRecord = {
    id,
    userId: input.userId,
    characterId: input.characterId ?? null,
    seriesId: input.seriesId ?? null,
    episode: input.episode ?? 1,
    title: input.title,
    dedication: input.dedication ?? "",
    category: input.category ?? "",
    theme: input.theme ?? "",
    languageCode: input.languageCode ?? "en",
    request: input.request ?? "",
    pages: input.pages,
    characterVersion: input.characterVersion ?? 1,
    product: input.product ?? "ebook",
    createdAt: stamp,
    updatedAt: stamp,
  };
  try {
    await q`
      INSERT INTO stories
        (id, user_id, character_id, series_id, episode, title, dedication, category, theme,
         language_code, request, pages, character_version, product, created_at, updated_at)
      VALUES
        (${record.id}, ${record.userId}, ${record.characterId}, ${record.seriesId}, ${record.episode},
         ${record.title}, ${record.dedication}, ${record.category}, ${record.theme},
         ${record.languageCode}, ${record.request}, ${JSON.stringify(record.pages)},
         ${record.characterVersion}, ${record.product}, ${stamp}, ${stamp})`;
    return record;
  } catch {
    return null;
  }
}

function toStory(row: Row): StoryRecord {
  return {
    id: text(row.id),
    userId: text(row.userId),
    characterId: text(row.characterId) || null,
    seriesId: text(row.seriesId) || null,
    episode: num(row.episode, 1),
    title: text(row.title),
    dedication: text(row.dedication),
    category: text(row.category),
    theme: text(row.theme),
    languageCode: text(row.languageCode, "en"),
    request: text(row.request),
    pages: parseJson<StoredPage[]>(row.pages, []),
    characterVersion: num(row.characterVersion, 1),
    product: (text(row.product, "ebook") || "ebook") as StoryProductId,
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  };
}

export async function getStory(userId: string, id: string): Promise<StoryRecord | null> {
  const q = await db();
  if (!q || !userId || !id) return null;
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", character_id AS "characterId", series_id AS "seriesId",
             episode, title, dedication, category, theme, language_code AS "languageCode",
             request, pages, character_version AS "characterVersion", product,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM stories WHERE id = ${id} AND user_id = ${userId}`;
    return rows[0] ? toStory(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * The shelf.
 *
 * Pages are read to derive a cover and a page count and then dropped, rather
 * than selected — the alternative is a JSON accessor that differs between
 * postgres and sqlite, and this list is capped at 100 rows.
 */
export async function listStories(userId: string): Promise<StorySummary[]> {
  const q = await db();
  if (!q || !userId) return [];
  try {
    const rows = await q`
      SELECT id, user_id AS "userId", character_id AS "characterId", series_id AS "seriesId",
             episode, title, dedication, category, theme, language_code AS "languageCode",
             request, pages, character_version AS "characterVersion", product,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM stories WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 100`;
    return rows.map((row) => {
      const story = toStory(row);
      const { pages, request: _request, ...rest } = story;
      return {
        ...rest,
        pageCount: pages.length,
        cover: pages.find((p) => p.image)?.image ?? "",
      };
    });
  } catch {
    return [];
  }
}

export async function deleteStory(userId: string, id: string): Promise<boolean> {
  const q = await db();
  if (!q || !userId || !id) return false;
  try {
    await q`DELETE FROM stories WHERE id = ${id} AND user_id = ${userId}`;
    return true;
  } catch {
    return false;
  }
}

// --- artifacts --------------------------------------------------------------

function toArtifact(row: Row): ArtifactRecord {
  return {
    id: text(row.id),
    storyId: text(row.storyId),
    kind: text(row.kind) as StoryArtifact,
    status: (text(row.status, "pending") || "pending") as ArtifactStatus,
    url: text(row.url) || null,
    detail: parseJson<Record<string, unknown>>(row.detail, {}),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  };
}

/**
 * Record where one artifact has got to.
 *
 * Upsert rather than insert: the movie pipeline writes the same row several
 * times as a scene goes pending → producing → ready, and a second row for the
 * same kind would leave two answers to "is the film done?".
 */
export async function setArtifact(
  storyId: string,
  kind: StoryArtifact,
  status: ArtifactStatus,
  url: string | null = null,
  detail: Record<string, unknown> = {},
): Promise<ArtifactRecord | null> {
  const q = await db();
  if (!q || !storyId) return null;
  const stamp = now();
  const payload = JSON.stringify(detail);
  try {
    const existing = await q`SELECT id FROM story_artifacts WHERE story_id = ${storyId} AND kind = ${kind}`;
    if (existing[0]) {
      const id = text(existing[0].id);
      await q`
        UPDATE story_artifacts
        SET status = ${status}, url = ${url}, detail = ${payload}, updated_at = ${stamp}
        WHERE id = ${id}`;
      return { id, storyId, kind, status, url, detail, createdAt: stamp, updatedAt: stamp };
    }
    const id = randomUUID();
    await q`
      INSERT INTO story_artifacts (id, story_id, kind, status, url, detail, created_at, updated_at)
      VALUES (${id}, ${storyId}, ${kind}, ${status}, ${url}, ${payload}, ${stamp}, ${stamp})`;
    return { id, storyId, kind, status, url, detail, createdAt: stamp, updatedAt: stamp };
  } catch {
    return null;
  }
}

export async function listArtifacts(storyId: string): Promise<ArtifactRecord[]> {
  const q = await db();
  if (!q || !storyId) return [];
  try {
    const rows = await q`
      SELECT id, story_id AS "storyId", kind, status, url, detail,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM story_artifacts WHERE story_id = ${storyId} ORDER BY created_at`;
    return rows.map(toArtifact);
  } catch {
    return [];
  }
}
