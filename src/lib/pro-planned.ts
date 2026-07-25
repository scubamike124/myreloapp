/**
 * Internal backlog for Business Center Pro modules that are NOT shipped.
 * Do not import this into public marketing pages. The Pro UI must not render
 * these as clickable product surfaces.
 */
export type PlannedProModule = {
  id: string;
  name: string;
  wave: string;
  note: string;
};

export const PLANNED_PRO_MODULES: PlannedProModule[] = [
  { id: "team-collaboration", name: "Team Collaboration", wave: "later", note: "Requires multi-user orgs and roles." },
  { id: "brand-vault-pro", name: "Brand Vault Pro", wave: "wave2", note: "Multi-brand on brand-kit API." },
  { id: "content-templates", name: "Content Templates", wave: "wave2", note: "Curated presets into live create tools." },
  { id: "bulk-creation", name: "Bulk Creation", wave: "wave2", note: "Real job queue over create tools." },
  { id: "voice-cloning", name: "Voice Cloning Pro", wave: "later", note: "Needs voice provider." },
  { id: "translate-dub", name: "Translate & Dub", wave: "later", note: "Needs TTS + translation pipeline." },
  { id: "smart-cut", name: "Smart Cut & Edit", wave: "later", note: "Needs video edit backend." },
  { id: "stock-media", name: "Stock Media Pro", wave: "later", note: "Needs stock licensing partner." },
  { id: "automated-reposting", name: "Automated Reposting", wave: "later", note: "Needs social publish APIs." },
  { id: "detailed-analytics", name: "Detailed Analytics", wave: "later", note: "Needs platform analytics connectors." },
  { id: "competitor-tracker", name: "Competitor Tracker", wave: "later", note: "Needs research backend." },
  { id: "lead-crm", name: "Lead Capture & CRM", wave: "later", note: "Needs CRM storage + forms." },
  { id: "white-label", name: "White Label Options", wave: "later", note: "Needs tenant theming." },
  { id: "api-access", name: "API Access", wave: "later", note: "Needs public API + keys." },
  { id: "webhooks", name: "Webhooks", wave: "later", note: "Needs event bus." },
  { id: "unlimited-storage", name: "Unlimited Storage", wave: "later", note: "Plan entitlement + R2 quotas." },
  { id: "priority-rendering", name: "Priority Rendering", wave: "later", note: "Queue priority tiers." },
  { id: "revenue-reports", name: "Detailed Revenue Reports", wave: "later", note: "Needs Stripe billing history UI." },
  { id: "account-manager", name: "Dedicated Account Manager", wave: "later", note: "Ops workflow, not product UI." },
];

/** Battles / Revenge — keep code under /battles; do not surface on public chrome. */
export const INTERNAL_BATTLES_NOTE =
  "Avatar Battles and Revenge Videos remain under /battles for future development. Public Header, Footer, Features, Capabilities, Community, and Roadmap must not promote them.";
