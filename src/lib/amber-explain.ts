/** Shared Amber 32 explainability types. */

export type AmberExplanation = {
  why: string;
  alternatives: string[];
  evidence: string[];
  risks: string[];
  successMetrics: string[];
};

export type AmberRecommendation = {
  title: string;
  why: string;
  expectedOutcome: string;
  confidence: number;
  evidence: string[];
  risks: string[];
  explanation?: AmberExplanation;
};

export type AmberHealthScores = {
  overall: number;
  marketingHealth: number;
  contentProduction: number;
  publishingConsistency: number;
  campaignThroughput: number;
  infraReadiness: number;
  verificationRisk: number;
  explanations: Record<string, string>;
  honestyNote: string;
};

export const AMBER_HONESTY_NOTE =
  "Reelo workspace metrics only — not social platform reach, views, or engagement unless a real adapter returns them.";

export function emptyExplanation(why = ""): AmberExplanation {
  return { why, alternatives: [], evidence: [], risks: [], successMetrics: [] };
}

export function asExplanation(raw: unknown): AmberExplanation {
  if (!raw || typeof raw !== "object") return emptyExplanation();
  const o = raw as Record<string, unknown>;
  return {
    why: String(o.why || "").slice(0, 1000),
    alternatives: Array.isArray(o.alternatives) ? o.alternatives.map(String).slice(0, 8) : [],
    evidence: Array.isArray(o.evidence) ? o.evidence.map(String).slice(0, 12) : [],
    risks: Array.isArray(o.risks) ? o.risks.map(String).slice(0, 8) : [],
    successMetrics: Array.isArray(o.successMetrics) ? o.successMetrics.map(String).slice(0, 8) : [],
  };
}

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
