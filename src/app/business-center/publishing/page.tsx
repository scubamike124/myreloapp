import BusinessShell from "@/components/design/BusinessShell";
import PublishQueue from "@/components/business/PublishQueue";

export const metadata = { title: "Publish queue — Reelo" };

export default function PublishingPage() {
  return (
    <BusinessShell active="publishing" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Publish queue</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Prepare captions and export packages — then post on each platform yourself.
        </p>
      </div>
      <PublishQueue />
    </BusinessShell>
  );
}
