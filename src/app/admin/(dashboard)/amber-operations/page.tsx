import type { Metadata } from "next";
import { fetchAmberOperations } from "@/lib/amber/operations-telemetry";
import AmberOperationsDashboard from "@/components/admin/AmberOperationsDashboard";

export const metadata: Metadata = { title: "Amber Operations — Reelo Admin" };

/**
 * Never cached. A status page answering from a build-time snapshot would
 * report the moment it was built forever, and would look most convincing
 * exactly when it was most wrong.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AmberOperationsPage() {
  /**
   * Fetched server-side so the bridge secret stays on the server, and passed
   * in as the first paint. `fetchAmberOperations` never throws: an
   * unreachable Amber HQ arrives as data saying so, which is the single most
   * important thing this page can report.
   */
  const initial = await fetchAmberOperations();
  return <AmberOperationsDashboard initial={initial} />;
}
