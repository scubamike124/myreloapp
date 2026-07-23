import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Community — Reelo",
  description: "The Reelo community — share what you make and discover what others are creating.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
