import { resolveAmberAccess } from "@/lib/amber-autonomous";

export const runtime = "nodejs";

/** Lightweight gate for UI — does not leak other users' data. */
export async function GET() {
  const access = await resolveAmberAccess();
  return Response.json({
    ok: true,
    allowed: access.allowed,
    flagEnabled: access.flagEnabled,
    emergencyStop: access.emergencyStop,
    isSuperAdmin: access.isSuperAdmin,
    isAllowlistedTester: access.isAllowlistedTester,
    reason: access.reason,
    note: access.allowed
      ? "Amber Autonomous Mode is available for this admin/testing session."
      : "Amber Autonomous Mode is internal admin-only and OFF for customers.",
  });
}
