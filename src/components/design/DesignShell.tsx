import Header from "@/components/Header";
import SiteFooter from "@/components/design/SiteFooter";

const DEFAULT_GLOW =
  "radial-gradient(800px 500px at 50% -5%,rgba(225,29,42,.18),transparent 60%),radial-gradient(700px 500px at 90% 30%,rgba(140,12,20,.14),transparent 60%)";

export default function DesignShell({
  children,
  glow,
}: {
  children: React.ReactNode;
  glow?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: glow ?? DEFAULT_GLOW }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "radial-gradient(rgba(255,70,85,.06) 1px,transparent 1px)", backgroundSize: "26px 26px" }}
      />
      <div className="relative z-[1] flex min-h-screen flex-col">
        <Header />
        <main className="amber-safe flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
