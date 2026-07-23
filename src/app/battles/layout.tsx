import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Battles — Reelo",
  description: "Reelo battles — creator challenges and head-to-head video contests.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
