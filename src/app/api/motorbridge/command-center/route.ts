import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/roles";
import { getUploadCounts, getCustomerCounts, isPausedAll } from "@/lib/motorbridge/persist";
import { CONNECTOR_CATALOG, VENDOR_RESEARCH_QUEUE, testedConnectorCount } from "@/lib/motorbridge/connectors";

export const runtime = "nodejs";

/**
 * MotorBridge Command Center (§40-44) — Michael's admin-only view of the
 * business, separate from the customer-facing product. Every number here
 * comes from a real query; there is no synthetic/placeholder branch. A
 * pre-launch state legitimately returns zeros, and the UI is expected to
 * render that as "not launched yet," not hide it or invent a number (§50).
 */
export async function GET() {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.status === 401 ? "Unauthorized" : "Forbidden" }, { status: access.status });
  }

  const [uploads, customers, pausedAll] = await Promise.all([getUploadCounts(), getCustomerCounts(), isPausedAll()]);

  return NextResponse.json({
    ok: true,
    pausedAll,
    // §41 sales funnel — only the stages this build can actually measure
    // today are populated with real counts; later stages (contacted,
    // replied, demo'd) are listed at zero until outreach infrastructure
    // exists to produce them, rather than omitted or invented.
    funnel: {
      uploadsTotal: uploads.totalUploads,
      trialUploads: uploads.trialUploads,
      activeTrials: customers.activeTrials,
      paidCustomers: customers.paidCustomers,
      dataPartners: customers.dataPartners,
    },
    customers,
    uploads,
    compatibility: CONNECTOR_CATALOG.map((c) => ({
      slug: c.slug,
      name: c.name,
      categories: c.categories,
      legalAccessStatus: c.legalAccessStatus,
      maturity: c.maturity,
      recordsProcessed: uploads.byConnector.find((b) => b.connectorSlug === c.slug)?.count ?? 0,
    })),
    testedConnectorCount: testedConnectorCount(),
    catalogTotal: CONNECTOR_CATALOG.length,
    vendorResearchQueue: VENDOR_RESEARCH_QUEUE,
  });
}
