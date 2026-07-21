import type { Metadata } from "next";
import { canWrite, readStatuses } from "@/lib/env-vault";
import VaultManager from "@/components/admin/VaultManager";

export const metadata: Metadata = { title: "Key vault — Reelo Admin" };

// Always render fresh: .env.local can change between visits.
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  // readStatuses() returns presence + masked hints only — no secret values
  // reach the client component.
  return <VaultManager initialKeys={await readStatuses()} canWrite={canWrite()} />;
}
