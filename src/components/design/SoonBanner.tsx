/** Shared honesty banner for Business Center modules that are shells only. */
export default function SoonBanner({ feature }: { feature: string }) {
  return (
    <div
      className="mb-5 rounded-xl px-4 py-3 text-sm leading-relaxed"
      style={{ border: "1px solid rgba(233,205,176,.35)", background: "rgba(233,205,176,.08)", color: "#e9cdb0" }}
      role="status"
    >
      <span className="mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "rgba(0,0,0,.35)" }}>
        Soon
      </span>
      {feature} isn&apos;t connected yet. Numbers and lists below are placeholders — nothing here publishes, schedules, or reports real account data.
    </div>
  );
}
