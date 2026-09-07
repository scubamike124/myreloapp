import type { EventStatus, RunStatus } from "@/lib/amber/execution-types";
import { colorForStatus } from "@/lib/amber/execution-types";

const DOT_CLASS: Record<ReturnType<typeof colorForStatus>, string> = {
  red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.6)]",
  yellow: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,.6)]",
  green: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]",
  neutral: "bg-white/30",
};

/** A small color-coded dot — the one visual language repeated everywhere in
 *  the workspace: red = error, yellow = working/warning, green = verified. */
export function StatusDot({
  status,
  pulse,
  className = "",
}: {
  status: RunStatus | EventStatus | undefined;
  pulse?: boolean;
  className?: string;
}) {
  const color = colorForStatus(status);
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[color]} ${pulse && color === "yellow" ? "animate-pulse" : ""} ${className}`}
    />
  );
}

const TEXT_CLASS: Record<ReturnType<typeof colorForStatus>, string> = {
  red: "text-red-400",
  yellow: "text-amber-300",
  green: "text-emerald-300",
  neutral: "text-white/50",
};

const BADGE_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  testing: "Testing",
  succeeded: "Completed",
  failed: "Failed",
  needs_owner: "Blocked",
  needs_runtime: "Blocked",
  interrupted: "Interrupted",
};

/** A compact status pill for job cards / headers. */
export function StatusBadge({ status }: { status: RunStatus }) {
  const color = colorForStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TEXT_CLASS[color]}`}
      style={{ borderColor: "currentColor", opacity: 1 }}
    >
      <StatusDot status={status} pulse={status === "running" || status === "testing" || status === "queued"} />
      {BADGE_LABEL[status] || status}
    </span>
  );
}
