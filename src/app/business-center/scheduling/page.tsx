import BusinessShell from "@/components/design/BusinessShell";
import ContentCalendar from "@/components/business/ContentCalendar";

export const metadata = { title: "Content calendar — Reelo" };

export default function SchedulingPage() {
  return (
    <BusinessShell active="scheduling" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Content calendar</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Plan when you intend to post — Reelo does not auto-post to social platforms.
        </p>
      </div>
      <ContentCalendar />
    </BusinessShell>
  );
}
