/**
 * Real project routing for Amber Fixes.
 *
 * Confirmed live: project selection depended entirely on which pill button
 * was last clicked. Typing "fix Reelo" while the Forma pill was selected
 * queued work against Forma -- the request text was never checked. A
 * second, worse instance of the same bug lived in /api/amber's own
 * auto-fix shortcut, which hardcoded "the Relo (myreloapp) repository" in
 * the task brief it wrote, regardless of pill state OR what the owner
 * actually typed.
 *
 * This resolves the target project from the message text itself, falling
 * back to the pill only when the text names no project at all -- and
 * surfaces genuine ambiguity (two different projects named) instead of
 * silently guessing one.
 */
import { PROJECTS, findProjectMentions, type ProjectKey } from "./project-registry.ts";

export type DispatchResolution =
  | { kind: "resolved"; projectKey: ProjectKey; label: string; source: "text" | "pill" }
  | { kind: "ambiguous"; candidates: { key: ProjectKey; label: string }[] };

export function resolveDispatchProject(text: string, currentPillKey: string): DispatchResolution {
  const mentions = findProjectMentions(text);
  const uniqueKeys = [...new Set(mentions.map((m) => m.key))];

  if (uniqueKeys.length === 1) {
    const hit = mentions.find((m) => m.key === uniqueKeys[0])!;
    return { kind: "resolved", projectKey: hit.key, label: hit.label, source: "text" };
  }

  if (uniqueKeys.length > 1) {
    return {
      kind: "ambiguous",
      candidates: uniqueKeys.map((k) => ({ k, p: PROJECTS.find((p) => p.key === k)! })).map(({ p }) => ({ key: p.key, label: p.label })),
    };
  }

  // No project named in the text at all -- the pill is a real signal here,
  // not a guess, since the owner had every opportunity to name a different
  // project and didn't.
  const pill = PROJECTS.find((p) => p.key === currentPillKey) || PROJECTS[0];
  return { kind: "resolved", projectKey: pill.key, label: pill.label, source: "pill" };
}
