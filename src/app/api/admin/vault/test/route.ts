import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { readRawValue } from "@/lib/env-vault";

export const runtime = "nodejs";
export const maxDuration = 30;

// Verifies a saved key against the provider with the cheapest call available,
// so a bad paste surfaces here instead of halfway through a video render.
// The key itself is read server-side and never crosses back to the browser.

type Check = (key: string) => Promise<{ ok: boolean; detail: string }>;

const CHECKS: Record<string, { keyName: string; label: string; run: Check }> = {
  gemini: {
    keyName: "GEMINI_API_KEY",
    label: "Google Gemini",
    async run(key) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        { signal: AbortSignal.timeout(15000) },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const n = Array.isArray(data?.models) ? data.models.length : 0;
        return { ok: true, detail: n > 0 ? `Working — ${n} models available.` : "Working." };
      }
      return { ok: false, detail: data?.error?.message || `Rejected by Google (${res.status}).` };
    },
  },
  heygen: {
    keyName: "HEYGEN_API_KEY",
    label: "HeyGen",
    async run(key) {
      const res = await fetch("https://api.heygen.com/v2/user/remaining_quota", {
        headers: { "X-Api-Key": key },
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const quota = data?.data?.remaining_quota;
        return {
          ok: true,
          detail: typeof quota === "number" ? `Working — ${quota} credits remaining.` : "Working.",
        };
      }
      return { ok: false, detail: data?.message || `Rejected by HeyGen (${res.status}).` };
    },
  },
};

export async function POST(req: Request) {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let provider: string;
  try {
    provider = String((await req.json()).provider ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const check = CHECKS[provider];
  if (!check) return NextResponse.json({ error: "Nothing to test for that key." }, { status: 400 });

  const key = await readRawValue(check.keyName);
  if (!key) {
    return NextResponse.json({ ok: false, detail: `${check.label} key isn't set yet.` });
  }

  try {
    const result = await check.run(key);
    return NextResponse.json({ ...result, provider });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      provider,
      detail: e instanceof Error ? `Couldn't reach ${check.label}: ${e.message}` : `Couldn't reach ${check.label}.`,
    });
  }
}
