import { redirect } from "next/navigation";

/** Password sign-in was removed (no customers were on it). Nothing to reset. */
export default function ResetPasswordPage() {
  redirect("/login");
}
