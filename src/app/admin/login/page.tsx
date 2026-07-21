import type { Metadata } from "next";
import { adminConfigured } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in — Reelo",
  robots: { index: false, follow: false },
};

// searchParams is async in Next 16 — reading it on the server avoids needing a
// useSearchParams Suspense boundary in the client form.
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only accept internal paths — never bounce to an attacker-supplied origin.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return <AdminLoginForm configured={adminConfigured()} next={safeNext} />;
}
