/**
 * The one authoritative list of projects Amber Fixes can target. Both the
 * project pills (AmberFixesPanel) and dispatch.ts's text-based resolution
 * read from here, so there is exactly one place that says what a project is
 * called and what synonyms name it -- not two hardcoded copies drifting
 * apart (myreloapp's AmberFixesPanel.tsx and amberai's amber-builder/route.ts
 * previously each hardcoded their own identical-at-the-time PROJECTS array).
 *
 * Keys match amberai's existing PROJECTS map in
 * src/app/api/amber-builder/route.ts exactly -- changing them here without
 * changing them there would silently break project routing on the amberai
 * side, so they are intentionally NOT renamed to match the different
 * (hyphenated) slugs the Product registry uses for the same businesses.
 * Reconciling that naming split is real follow-up work, not done here.
 */

export type ProjectKey = "reelo" | "forma" | "amber_hq" | "launch_ready" | "rest_pilot" | "dayli";

export type ProjectDef = {
  key: ProjectKey;
  label: string;
  /** Lowercase phrases that name this project in ordinary English. Longest
   *  alias wins when several match, so "rest pilot" beats a bare "pilot". */
  aliases: string[];
};

export const PROJECTS: ProjectDef[] = [
  { key: "reelo", label: "Reelo", aliases: ["reelo", "myreelo", "relo"] },
  { key: "forma", label: "Forma", aliases: ["forma"] },
  {
    key: "amber_hq",
    label: "Amber HQ",
    aliases: ["amber hq", "amberhq", "amber one", "amberoneai", "amberai", "amber core"],
  },
  { key: "launch_ready", label: "Launch Ready", aliases: ["launch ready", "launchready"] },
  { key: "rest_pilot", label: "Rest Pilot", aliases: ["rest pilot", "restpilot"] },
  { key: "dayli", label: "Dayli", aliases: ["dayli"] },
];

export function projectLabel(key: string): string {
  return PROJECTS.find((p) => p.key === key)?.label || key;
}

export function isProjectKey(key: string): key is ProjectKey {
  return PROJECTS.some((p) => p.key === key);
}

export type ProjectMention = { key: ProjectKey; label: string; alias: string };

/**
 * Every project explicitly named in free text, longest/most-specific alias
 * match first. Word-boundary matching only -- "forma" must not match inside
 * "format" or "information".
 */
export function findProjectMentions(text: string): ProjectMention[] {
  const lower = text.toLowerCase();
  const hits: ProjectMention[] = [];
  for (const project of PROJECTS) {
    for (const alias of project.aliases) {
      const pattern = new RegExp(`(?<![a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "i");
      if (pattern.test(lower)) {
        hits.push({ key: project.key, label: project.label, alias });
        break; // one hit per project is enough; don't double-count synonyms
      }
    }
  }
  return hits.sort((a, b) => b.alias.length - a.alias.length);
}
