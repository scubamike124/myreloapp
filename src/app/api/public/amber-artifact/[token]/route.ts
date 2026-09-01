import { NextResponse } from "next/server";
import { findJobByArtifactToken } from "@/lib/amber-earnings/artifacts";

export const dynamic = "force-dynamic";

/** Public deliverable body for WorkProtocol (and similar) URL submissions. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const found = await findJobByArtifactToken(String(token || "").trim());
  if (!found) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }
  return new NextResponse(found.submission, {
    status: 200,
    headers: {
      "Content-Type": found.contentType,
      "Cache-Control": "public, max-age=60",
      "X-Amber-Artifact-Title": encodeURIComponent(found.title).slice(0, 200),
    },
  });
}
