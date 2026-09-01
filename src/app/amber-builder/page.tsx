import { redirect } from "next/navigation";
import AmberFixesPanel from "@/components/amber/AmberFixesPanel";
import { dbConfigured } from "@/lib/db";
import { requireAdminAccess } from "@/lib/roles";

export const metadata = { title: "Amber Fixes — Reelo" };
export const dynamic = "force-dynamic";

export default async function AmberBuilderPage() {
  if (!dbConfigured()) {
    return (
      <main style={{ padding: 24, background: "#f6f6f4", color: "#111", minHeight: "100vh" }}>
        <h1>Amber Fixes</h1>
        <p>Accounts aren’t available yet.</p>
      </main>
    );
  }

  const access = await requireAdminAccess().catch(() => ({ ok: false as const, status: 401 as const }));
  if (!access.ok) {
    redirect(`/admin/login?next=/amber-builder`);
  }

  return <AmberFixesPanel />;
}
