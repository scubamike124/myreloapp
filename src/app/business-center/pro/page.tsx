import { Suspense } from "react";
import BusinessShell from "@/components/design/BusinessShell";
import BusinessProDashboard from "@/components/business/BusinessProDashboard";
import { getOverview } from "@/lib/business";
import { currentUser } from "@/lib/accounts";

export const metadata = {
  title: "Business Center Pro — Reelo",
  description: "Business Center Pro — workspace dashboard, live Pro tools, brand profile, and reporting.",
};

export const dynamic = "force-dynamic";

function proActive(tab?: string): string {
  switch (tab) {
    case "tools":
      return "pro-tools";
    case "profile":
      return "pro-profile";
    case "assist":
      return "pro-assist";
    case "content":
      return "pro-content";
    case "reports":
      return "pro-reports";
    default:
      return "hubpro";
  }
}

export default async function BusinessCenterProPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ stats, recent, personal, signedIn }, user, sp] = await Promise.all([
    getOverview(),
    currentUser(),
    searchParams,
  ]);

  return (
    <BusinessShell active={proActive(sp.tab)} variant="pro">
      <Suspense fallback={<div className="py-10 text-sm text-white/50">Loading Pro desk…</div>}>
        <BusinessProDashboard
          stats={stats}
          recent={recent}
          personal={personal}
          signedIn={signedIn}
          userName={user?.name || user?.email?.split("@")[0] || ""}
          userEmail={user?.email || ""}
          role={user?.role ?? null}
        />
      </Suspense>
    </BusinessShell>
  );
}
