import { redirect } from "next/navigation";

/** Short admin alias → Amber Fix. */
export default function AdminFixRedirect() {
  redirect("/amber-builder");
}
