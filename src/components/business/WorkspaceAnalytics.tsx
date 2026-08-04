"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BIcon, { type IconKey } from "@/components/design/BIcon";

type Analytics = {
  videos: number;
  images: number;
  total: number;
  balance: number;
  spent: number;
  refunded: number;
  credited: number;
  byDay: { day: string; count: number }[];
  byTool: { name: string; count: number }[];
};

export default function WorkspaceAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspace-analytics");
        const json = await res.json();
        if (cancelled) return;
        setConfigured(Boolean(json.configured));
        setSignedIn(Boolean(json.signedIn));
        setNote(json.note ?? "");
        setData(json.analytics ?? null);
      } catch {
        if (!cancelled) setErr("Couldn't load analytics.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to see workspace analytics." : "Accounts aren't set up yet."}
        </p>
        {configured && (
          <Link href="/login" className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  if (err) return <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>;
  if (!data) return <p className="text-sm" style={{ color: "#9a8b8d" }}>Loading…</p>;

  const maxDay = Math.max(1, ...data.byDay.map((d) => d.count));
  const maxTool = Math.max(1, ...data.byTool.map((t) => t.count));

  const stats: { icon: IconKey; v: string; l: string }[] = [
    { icon: "film", v: String(data.videos), l: "Videos created" },
    { icon: "image", v: String(data.images), l: "Images made" },
    { icon: "bolt", v: String(Math.round(data.balance)), l: "Tokens left" },
    { icon: "chart", v: String(Math.round(data.spent)), l: "Tokens spent" },
  ];

  return (
    <div className="space-y-6">
      {note && (
        <p className="rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(95,176,255,.25)", background: "rgba(95,176,255,.06)", color: "#c8dff5" }}>
          {note}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
            <BIcon name={s.icon} size={20} />
            <div className="font-display mt-2 text-2xl font-bold">{s.v}</div>
            <div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.45)" }}>
          <h2 className="font-display text-lg font-bold">Generations by day</h2>
          <p className="mt-1 text-xs" style={{ color: "#8e7f81" }}>Last {data.byDay.length || 0} active days (up to 30)</p>
          {data.byDay.length === 0 ? (
            <p className="mt-6 text-sm" style={{ color: "#9a8b8d" }}>No generations yet — zeros are honest.</p>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-1">
              {data.byDay.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.count}`}>
                  <div
                    className="w-full max-w-[18px] rounded-t"
                    style={{
                      height: `${Math.max(4, (d.count / maxDay) * 100)}%`,
                      background: "linear-gradient(180deg,#ff5663,#c4101c)",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.45)" }}>
          <h2 className="font-display text-lg font-bold">By tool</h2>
          <p className="mt-1 text-xs" style={{ color: "#8e7f81" }}>
            Credited {Math.round(data.credited)} · refunded {Math.round(data.refunded)}
          </p>
          {data.byTool.length === 0 ? (
            <p className="mt-6 text-sm" style={{ color: "#9a8b8d" }}>No tool usage yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {data.byTool.map((t) => (
                <li key={t.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-2">{t.name}</span>
                    <span style={{ color: "#8e7f81" }}>{t.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(t.count / maxTool) * 100}%`,
                        background: "linear-gradient(90deg,#ff3645,#c4101c)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
