import BusinessShell from "@/components/design/BusinessShell";
import BrandKitEditor from "@/components/business/BrandKitEditor";

export const metadata = { title: "Brand Kit — Reelo" };

export default function BrandKitPage() {
  return (
    <BusinessShell active="brand" variant="overview">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Brand Kit</h1>
        <p className="mt-1.5 text-[14.5px]" style={{ color: "#a99a9c" }}>
          Your colours, fonts and logo, saved to your account so they follow you between devices.
        </p>
      </div>
      <BrandKitEditor />
    </BusinessShell>
  );
}
