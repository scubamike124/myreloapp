import Header from "@/components/Header";
import Pricing from "@/components/Pricing";
import SiteFooter from "@/components/design/SiteFooter";

export const metadata = { title: "Pricing — Reelo", description: "Simple token-based pricing. Start free, then pay only for what you create — plans and packs for creators, businesses and agencies." };

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "radial-gradient(1100px 380px at 50% -8%,rgba(225,29,42,.16),transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,70,85,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,70,85,.04) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(180deg,rgba(0,0,0,.6),transparent 30%)",
          WebkitMaskImage: "linear-gradient(180deg,rgba(0,0,0,.6),transparent 30%)",
        }}
      />
      <div className="relative z-[1] flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pt-2">
          <Pricing />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
