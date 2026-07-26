import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous } from "@/lib/amber-autonomous";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Alias for strategy planning — forwards to amber/ops with action=strategy. */
export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 32_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const headers = new Headers({ "Content-Type": "application/json" });
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const { POST: opsPost } = await import("../ops/route");
  return opsPost(
    new Request(req.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, action: str(body.action, 40) || "strategy" }),
    }),
  );
}
