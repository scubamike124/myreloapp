/**
 * Public deliverable URLs for marketplaces (WorkProtocol) that require { type, url }.
 * Content is the job submission already stored in amber_earnings_jobs.
 */
import { randomBytes } from "crypto";
import { absoluteUrl } from "@/lib/site";
import { ensureSchema, sqlAsync } from "@/lib/db";

export function newArtifactToken(): string {
  return randomBytes(18).toString("hex");
}

export function artifactPublicUrl(token: string): string {
  return absoluteUrl(`/api/public/amber-artifact/${encodeURIComponent(token)}`);
}

export function encodeWpAcceptance(claimId: string, artifactToken?: string | null): string {
  const parts = [`wpClaim=${claimId}`];
  if (artifactToken) parts.push(`artifact=${artifactToken}`);
  return parts.join(";");
}

export function parseWpAcceptance(acceptance: string): {
  claimId: string | null;
  artifactToken: string | null;
} {
  return {
    claimId: /wpClaim=([0-9a-f-]{36})/i.exec(acceptance || "")?.[1] || null,
    artifactToken: /artifact=([a-f0-9]{20,})/i.exec(acceptance || "")?.[1] || null,
  };
}

export function deliverableTypeFor(category: string, body: string): string {
  const c = (category || "").toLowerCase();
  if (c === "code" || /```/.test(body)) return "code";
  if (c === "data" || /^\s*[\[{]/.test(body)) return "data";
  if (c === "research" || c === "content") return "markdown";
  return "markdown";
}

export async function findJobByArtifactToken(
  token: string,
): Promise<{ submission: string; title: string; contentType: string } | null> {
  if (!token || token.length < 20 || token.length > 80) return null;
  if (!(await ensureSchema())) return null;
  const q = await sqlAsync();
  if (!q) return null;
  const like = `%artifact=${token}%`;
  const rows = (await q`
    SELECT title, submission, description
    FROM amber_earnings_jobs
    WHERE platform_slug = 'workprotocol' AND acceptance LIKE ${like}
    LIMIT 1
  `) as { title: string; submission: string; description: string }[];
  const row = rows[0];
  if (!row?.submission) return null;
  const type = deliverableTypeFor("", row.submission);
  const contentType =
    type === "code"
      ? "text/plain; charset=utf-8"
      : type === "data"
        ? "application/json; charset=utf-8"
        : "text/markdown; charset=utf-8";
  return { submission: row.submission, title: row.title || "Amber deliverable", contentType };
}
