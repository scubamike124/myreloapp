import { NextResponse } from "next/server";
import { FIXTURE_CONTENT_BY_CONNECTOR } from "@/lib/motorbridge/fixtures/content";

export const runtime = "nodejs";

/**
 * Serves the exact same fixture text the parser tests run against (see
 * fixtures/content.ts), so "load a sample" on the marketing page is provably
 * the same file that made the connector's TEST_PASSED status true — not a
 * separate, prettier demo file. Bundled string constants rather than a disk
 * read: the deployed target is OpenNext on Cloudflare Workers, which has no
 * runtime filesystem (see src/lib/db.ts's isCloudflareWorkers handling).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const text = FIXTURE_CONTENT_BY_CONNECTOR[slug];
  if (!text) {
    return NextResponse.json({ error: "No sample available for this connector." }, { status: 404 });
  }
  return new NextResponse(text, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
