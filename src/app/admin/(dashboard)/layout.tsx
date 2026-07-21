import AdminShell from "@/components/admin/AdminShell";

// Everything in this group is behind the proxy.ts session gate.
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
