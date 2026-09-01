import { redirect } from "next/navigation";

/** Legacy / mistaken admin path — Amber Fix lives at /amber-builder. */
export default function AdminAmberFixRedirect() {
  redirect("/amber-builder");
}
