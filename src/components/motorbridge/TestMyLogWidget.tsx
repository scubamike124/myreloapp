"use client";

import { useState } from "react";

type ConnectorSummary = {
  slug: string;
  name: string;
  formatBasis: string;
  legalAccessStatus: string;
  maturity: string;
};

const SAMPLE_LABEL: Record<string, string> = {
  generic_obdii_csv: "Load a sample OBD-II mechanic log",
  generic_telemetry_csv: "Load a sample racing telemetry log",
  generic_j1939_log: "Load a sample diesel/commercial (J1939) log",
};

export default function TestMyLogWidget({ connectors }: { connectors: ConnectorSummary[] }) {
  const [connectorSlug, setConnectorSlug] = useState(connectors[0]?.slug ?? "");
  const [fileText, setFileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function loadSample(slug: string) {
    setConnectorSlug(slug);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/motorbridge/samples/${slug}`);
      const text = await res.text();
      setFileText(text);
    } catch {
      setError("Could not load the sample file.");
    }
  }

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/motorbridge/test-log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ connectorSlug, fileText, originLabel: "Test My Log (web)" }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setError(data.error ?? "Something went wrong reading that file.");
      } else {
        setResult(data.record);
      }
    } catch {
      setError("Could not reach MotorBridge. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mx-auto max-w-[900px] rounded-2xl border border-white/10 p-6 sm:p-8"
      style={{ background: "rgba(12,16,22,.55)" }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {connectors.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => loadSample(c.slug)}
            className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: connectorSlug === c.slug ? "#4fd1c5" : "rgba(255,255,255,.15)",
              color: connectorSlug === c.slug ? "#4fd1c5" : "#a9b4bd",
              background: connectorSlug === c.slug ? "rgba(79,209,197,.08)" : "transparent",
            }}
          >
            {SAMPLE_LABEL[c.slug] ?? c.name}
          </button>
        ))}
      </div>

      <textarea
        value={fileText}
        onChange={(e) => setFileText(e.target.value)}
        placeholder="Paste your diagnostic/telemetry export here, or load a sample above."
        rows={8}
        className="w-full rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/90 outline-none focus:border-white/30"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runTest}
          disabled={loading || !fileText.trim()}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: "linear-gradient(135deg,#4fd1c5,#1a8f82)", boxShadow: "0 10px 30px rgba(79,209,197,.35)" }}
        >
          {loading ? "Normalizing…" : "Test My Log Free"}
        </button>
        <span className="text-xs" style={{ color: "#7d8891" }}>
          No account needed. Nothing is stored against you.
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>
      )}

      {result !== null && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#4fd1c5" }}>
            Normalized to the MotorBridge Universal Schema
          </div>
          <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed text-white/85">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
