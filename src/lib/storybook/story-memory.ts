/**
 * What Amber remembers about a series, so book three knows about book one.
 *
 * The directive asks for sequels that continue rather than restart: "Amber
 * should remember previous stories… reuse characters, locations and running
 * jokes." The obvious implementation is to feed the previous manuscripts back
 * into the model, and it does not survive contact with a real series — by
 * episode five that is fifteen thousand words of prompt, most of it prose the
 * model has to re-read to extract six facts from.
 *
 * So a series carries a *summary* that is updated after each episode: who
 * exists, where things happen, what has already been learned. It is small
 * enough to send every time, which means continuity does not quietly stop
 * working once a series gets long.
 *
 * ## Why the lists are capped
 *
 * A cap is a promise that the prompt stays a fixed size. Without one, the
 * twentieth episode sends a memory too large to fit and the model silently
 * loses the *beginning* of it — the earliest, most-established facts, which are
 * exactly the ones a reader would notice going missing. Dropping the oldest
 * deliberately is the same outcome, chosen rather than suffered, and it happens
 * at the point where it can be explained rather than inside a truncated prompt.
 */

export type EpisodeNote = {
  episode: number;
  title: string;
  /** One or two sentences. What happened, not how it was written. */
  summary: string;
};

/**
 * The directive's list, kept as separate lists rather than one bag of facts.
 *
 * "Amber should remember: Characters, Past adventures, Friends, Villains,
 * Kingdoms, Pets, Special powers, Favorite themes." They are separated because
 * the writer needs them differently — a villain is someone to bring back, a
 * power is a rule that constrains what can happen next, and mixing them into
 * one list would leave the model to guess which is which.
 *
 * Favourite themes are deliberately absent: they are a fact about the child
 * across every series, not canon within one, and the library can count them
 * from the stories themselves rather than storing an answer that goes stale.
 */
export type SeriesMemory = {
  episodes: EpisodeNote[];
  /** Friends and side characters who now exist in this world. */
  characters: string[];
  /** Villains — named separately because they are brought back, not just kept consistent. */
  villains: string[];
  /** Animals belonging to the hero. Children notice a missing pet immediately. */
  pets: string[];
  /**
   * Established powers and abilities.
   *
   * The most constraining list: a power introduced in book two is a rule about
   * what book five can no longer treat as impossible.
   */
  powers: string[];
  /** Kingdoms, towns and places the stories have established. */
  places: string[];
  /**
   * Morals already used. Tracked so they are not repeated — a series that
   * teaches "share with your friends" three times reads as one story retold.
   */
  lessons: string[];
  /** Objects that carry between episodes. */
  keepsakes: string[];
};

/** Kept in full. Older episodes survive as their entry in the other lists. */
export const RECENT_EPISODES = 6;
/** Per list. Roughly a paragraph each once rendered into the prompt. */
export const MAX_FACTS = 12;

/**
 * Every list of facts, in the order the briefing presents them.
 *
 * Iterated rather than written out at each call site: the directive says to
 * keep adding to what Amber remembers, and a new kind of fact should be one
 * entry here rather than four functions that must all be found and changed.
 */
export const FACT_LISTS = ["characters", "villains", "pets", "powers", "places", "lessons", "keepsakes"] as const;

export type FactList = (typeof FACT_LISTS)[number];

function emptyFacts(): Record<FactList, string[]> {
  const out = {} as Record<FactList, string[]>;
  for (const key of FACT_LISTS) out[key] = [];
  return out;
}

export const EMPTY_MEMORY: SeriesMemory = { episodes: [], ...emptyFacts() };

function clean(values: unknown, max: number): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (typeof v !== "string") continue;
    const text = v.trim().slice(0, 120);
    if (!text) continue;
    // Case-insensitive: "Grandpa Joe" and "grandpa joe" are one character, and
    // storing both would tell the model there are two.
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

/** Parse whatever is in the database, tolerating anything. */
export function readMemory(raw: unknown): SeriesMemory {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { ...EMPTY_MEMORY };
    }
  }
  if (!value || typeof value !== "object") return { ...EMPTY_MEMORY };
  const rec = value as Record<string, unknown>;
  const episodes = Array.isArray(rec.episodes)
    ? rec.episodes
        .map((e): EpisodeNote | null => {
          const r = (e ?? {}) as Record<string, unknown>;
          const episode = Number(r.episode);
          if (!Number.isFinite(episode)) return null;
          return {
            episode,
            title: typeof r.title === "string" ? r.title.slice(0, 160) : "",
            summary: typeof r.summary === "string" ? r.summary.slice(0, 400) : "",
          };
        })
        .filter((e): e is EpisodeNote => e !== null)
    : [];
  const facts = emptyFacts();
  for (const key of FACT_LISTS) facts[key] = clean(rec[key], MAX_FACTS);
  return { episodes: episodes.sort((a, b) => a.episode - b.episode).slice(-RECENT_EPISODES), ...facts };
}

/**
 * Fold a finished episode into the series memory.
 *
 * New facts go at the *end* of each list, so when the cap bites it is the
 * newest additions that are refused rather than the founding ones dropped. A
 * series' oldest facts are its most established — the family dog introduced in
 * book one should outlive a shopkeeper mentioned once in book nine.
 */
export function rememberEpisode(current: SeriesMemory, note: EpisodeNote, facts: Partial<SeriesMemory>): SeriesMemory {
  const episodes = [...current.episodes.filter((e) => e.episode !== note.episode), note]
    .sort((a, b) => a.episode - b.episode)
    .slice(-RECENT_EPISODES);

  const merged = emptyFacts();
  for (const key of FACT_LISTS) {
    merged[key] = clean([...(current[key] ?? []), ...clean(facts[key], MAX_FACTS)], MAX_FACTS);
  }

  return { episodes, ...merged };
}

/** The episode number a new story in this series should take. */
export function nextEpisode(memory: SeriesMemory): number {
  if (memory.episodes.length === 0) return 1;
  return Math.max(...memory.episodes.map((e) => e.episode)) + 1;
}

/**
 * The continuity briefing handed to the story model when writing a sequel.
 *
 * Written as instructions rather than as a transcript. "These already exist,
 * do not reintroduce them" is a rule the model can follow; a wall of previous
 * chapters is something it has to infer the rule from, and it often infers
 * "write that again".
 */
export function continuityPrompt(memory: SeriesMemory, seriesTitle: string): string {
  if (memory.episodes.length === 0 && memory.characters.length === 0) return "";

  const lines: string[] = [
    `This is a new episode of an existing series called "${seriesTitle}". It must continue that world, not restart it.`,
  ];

  if (memory.episodes.length > 0) {
    lines.push("", "What has already happened:");
    for (const e of memory.episodes) {
      lines.push(`  ${e.episode}. "${e.title}" — ${e.summary}`);
    }
  }

  /*
   * Each list gets its own instruction, because they constrain the writer
   * differently. A place must stay consistent; a lesson must not recur; a
   * power is a rule about what is now possible. One combined "remember these"
   * would leave the model to work out which is which, and it does not.
   */
  const BRIEFING: Record<FactList, { label: string; rule: string }> = {
    characters: {
      label: "Characters who already exist",
      rule: "Use them as established. Do not introduce them again as if they were new.",
    },
    villains: {
      label: "Villains and rivals from earlier books",
      rule: "They may return. If one was defeated or befriended, do not undo that without explaining it.",
    },
    pets: {
      label: "Animals belonging to the hero",
      rule: "They still exist. A child notices when a pet quietly disappears between books.",
    },
    powers: {
      label: "Abilities already established",
      rule: "These still work and still have the same limits. Do not grant a new power that makes an old problem trivial.",
    },
    places: { label: "Places already established", rule: "Keep them consistent with how they were described before." },
    lessons: {
      label: "Lessons already taught",
      rule: "Do NOT repeat any of these. This episode must land on a different lesson.",
    },
    keepsakes: { label: "Things carried over", rule: "These still exist and may appear." },
  };

  for (const key of FACT_LISTS) {
    const values = memory[key];
    if (values.length === 0) continue;
    lines.push("", `${BRIEFING[key].label}: ${values.join("; ")}.`, BRIEFING[key].rule);
  }

  return lines.join("\n");
}
