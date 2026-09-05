"use client";

import Link from "next/link";
import type { ProjectDef } from "@/lib/amber/project-registry";

/**
 * The project explorer. PROJECTS is real configuration data (project-
 * registry.ts) rendered as a list here -- this component has no project
 * names baked into its own JSX, so a future tenant/owner with an entirely
 * different set of repos is a different array passed in, not a different
 * build of this component.
 *
 * Each project's status dot reflects that project's own most recent real
 * run (statusByProject, built from the same /api/amber-builder run list the
 * workspace already polls) -- a project with no runs yet is shown idle, not
 * given a fabricated status.
 */

export type ProjectStatus = { status?: string; prUrl?: string; mergedAt?: string };

type Account = { name: string | null; email: string; role?: "USER" | "ADMIN" | "OWNER" };

function dotToneFor(s: ProjectStatus | undefined): "idle" | "red" | "yellow" | "green" {
  if (!s || !s.status) return "idle";
  if (s.status === "failed") return "red";
  if (s.status === "succeeded" && s.mergedAt) return "green";
  if (s.status === "succeeded") return "yellow"; // PR open, awaiting approval
  return "yellow"; // queued / running / testing / needs_owner / needs_runtime / interrupted
}

export default function AmberProjectSidebar({
  projects,
  activeKey,
  onSelect,
  statusByProject,
  collapsed,
  onToggleCollapse,
  account,
  signingOut,
  onSignOut,
}: {
  projects: ProjectDef[];
  activeKey: string;
  onSelect: (key: string) => void;
  statusByProject: Record<string, ProjectStatus>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  account: Account | null;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <>
      {!collapsed && <button type="button" className="amber-sidebar-scrim" aria-label="Close project list" onClick={onToggleCollapse} />}
      <aside className={`amber-sidebar${collapsed ? " amber-sidebar--collapsed" : ""}`} aria-label="Projects">
        <div className="amber-sidebar-top">
          <span className="amber-sidebar-brand">Amber Fix</span>
          <button
            type="button"
            className="amber-sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Show projects" : "Hide projects"}
          >
            <ChevronMark collapsed={collapsed} />
          </button>
        </div>

        <Link href="/business-center" className="amber-sidebar-back">
          ← Business Center
        </Link>

        <nav className="amber-sidebar-list" aria-label="Project explorer">
          {projects.map((p) => {
            const tone = dotToneFor(statusByProject[p.key]);
            const isOn = p.key === activeKey;
            return (
              <button
                key={p.key}
                type="button"
                className={`amber-sidebar-item${isOn ? " is-on" : ""}`}
                onClick={() => onSelect(p.key)}
                aria-current={isOn ? "true" : undefined}
              >
                <span className={`amber-sidebar-dot amber-sidebar-dot--${tone}`} aria-hidden />
                <span className="amber-sidebar-label">{p.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="amber-sidebar-footer">
          {account ? (
            <>
              <div className="amber-sidebar-account">
                <span className="amber-sidebar-account-name">{account.name || account.email}</span>
                {(account.role === "OWNER" || account.role === "ADMIN") && (
                  <span className="amber-sidebar-account-role">{account.role}</span>
                )}
              </div>
              <button type="button" className="amber-sidebar-signout" onClick={onSignOut} disabled={signingOut}>
                Sign out
              </button>
            </>
          ) : (
            <span className="amber-sidebar-account-name">Not signed in</span>
          )}
        </div>
      </aside>
    </>
  );
}

function ChevronMark({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      {collapsed ? <path d="M9 5l7 7-7 7" /> : <path d="M15 5l-7 7 7 7" />}
    </svg>
  );
}
