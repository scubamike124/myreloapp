import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reelo Admin",
  robots: { index: false, follow: false },
};

// Deliberately bare: the signed-in chrome lives in the (dashboard) route group
// so /admin/login can render without the sidebar it has no access to yet.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
