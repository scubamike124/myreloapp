import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

const DEFAULTS = {
  timezone: "UTC",
  notifyEmail: false,
  notifyInapp: true,
  prefs: {} as Record<string, unknown>,
};

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, settings: DEFAULTS, name: null });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, settings: DEFAULTS, name: null });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, settings: DEFAULTS, name: user.name });
  }

  const rows = (await q`
    SELECT timezone, notify_email AS "notifyEmail", notify_inapp AS "notifyInapp", prefs
    FROM workspace_settings WHERE user_id = ${user.id} LIMIT 1
  `) as {
    timezone: string;
    notifyEmail: boolean | number;
    notifyInapp: boolean | number;
    prefs: string | null;
  }[];

  let prefs: Record<string, unknown> = {};
  try {
    prefs = rows[0]?.prefs ? (JSON.parse(rows[0].prefs) as Record<string, unknown>) : {};
  } catch {
    prefs = {};
  }

  const row = rows[0];
  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    name: user.name,
    email: user.email,
    settings: row
      ? {
          timezone: row.timezone || "UTC",
          notifyEmail: Boolean(row.notifyEmail),
          notifyInapp: Boolean(row.notifyInapp),
          prefs,
        }
      : DEFAULTS,
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const name = body.name !== undefined ? str(body.name, 80) || null : undefined;
  if (name !== undefined) {
    await q`UPDATE users SET name = ${name} WHERE id = ${user.id}`;
  }

  const timezone = str(body.timezone, 80) || "UTC";
  const notifyEmail = Boolean(body.notifyEmail);
  const notifyInapp = body.notifyInapp === undefined ? true : Boolean(body.notifyInapp);
  const prefs =
    body.prefs && typeof body.prefs === "object" && !Array.isArray(body.prefs)
      ? (body.prefs as Record<string, unknown>)
      : {};
  const now = new Date().toISOString();

  await q`DELETE FROM workspace_settings WHERE user_id = ${user.id}`;
  await q`
    INSERT INTO workspace_settings (user_id, timezone, notify_email, notify_inapp, prefs, updated_at)
    VALUES (${user.id}, ${timezone}, ${notifyEmail}, ${notifyInapp}, ${JSON.stringify(prefs)}, ${now})`;

  return Response.json({
    ok: true,
    name: name !== undefined ? name : user.name,
    settings: { timezone, notifyEmail, notifyInapp, prefs },
    savedAt: now,
  });
}
