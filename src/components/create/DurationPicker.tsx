"use client";

import {
  type DurationOption,
  creditLabelForSeconds,
  durationOptionsFor,
} from "@/lib/token-costs";

/**
 * Length picker for video tools. Shows tokens + USD from global pricing.
 * Longer tiers prompt that the price is higher.
 */
export default function DurationPicker({
  action,
  value,
  onChange,
}: {
  action: string;
  value: number;
  onChange: (seconds: number) => void;
}) {
  const options = durationOptionsFor(action);
  if (!options?.length) return null;

  const selected = options.find((o) => o.seconds === value) ?? options[0];
  const cheapest = Math.min(...options.map((o) => o.tokens));
  const isPremium = selected.tokens > cheapest;
  const isWebsite = action === "website-commercial";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white/85">
        {isWebsite ? "Commercial length" : "Video length"}
      </label>
      <div className={`grid gap-2 ${options.length > 4 ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        {options.map((o) => (
          <DurationButton
            key={o.seconds}
            option={o}
            selected={o.seconds === value}
            action={action}
            onClick={() => onChange(o.seconds)}
          />
        ))}
      </div>
      {isPremium ? (
        <p
          className="mt-2 rounded-xl px-3 py-2 text-[12.5px] leading-relaxed"
          style={{ border: "1px solid rgba(255,159,67,.35)", background: "rgba(255,159,67,.08)", color: "#ffcf9a" }}
        >
          {isWebsite ? "Premium commercial — " : "Longer videos cost more — "}
          {creditLabelForSeconds(action, value)} before you generate.
        </p>
      ) : (
        <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">
          {isWebsite
            ? "Website commercials include analysis, scripting, and spokesperson production."
            : "Pick a longer length anytime — tokens and price update before you generate."}
        </p>
      )}
    </div>
  );
}

function DurationButton({
  option,
  selected,
  action,
  onClick,
}: {
  option: DurationOption;
  selected: boolean;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-3.5 py-3 text-left transition-colors"
      style={
        selected
          ? { border: "2px solid #ff3645", background: "rgba(255,60,75,.12)" }
          : { border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.03)" }
      }
    >
      <span className="block text-sm font-semibold text-white">{option.label}</span>
      <span className="mt-0.5 block text-[12px]" style={{ color: selected ? "#ffb3b9" : "#a99a9c" }}>
        {creditLabelForSeconds(action, option.seconds)}
      </span>
      {option.priceNote && (
        <span className="mt-1 block text-[11px] font-medium" style={{ color: "#ffcf9a" }}>
          {option.priceNote}
        </span>
      )}
    </button>
  );
}
