"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  memberEmail: string;
  memberUserId: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export default function TeamInvites() {
  const [members, setMembers] = useState<Member[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setSignedIn(Boolean(data.signedIn));
      setMembers(data.members ?? []);
      setNote(data.note ?? "");
    } catch {
      setErr("Couldn't load team.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const invite = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't invite.");
        return;
      }
      setEmail("");
      await load();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/team?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to manage team invites." : "Accounts aren't set up yet."}
        </p>
        {configured && (
          <Link href="/login" className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {note && (
        <p className="rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(95,176,255,.25)", background: "rgba(95,176,255,.06)", color: "#c8dff5" }}>
          {note}
        </p>
      )}
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}

      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.22)", background: "linear-gradient(180deg,rgba(24,9,12,.55),rgba(10,5,7,.5))" }}>
        <div className="mb-3 font-display font-bold">Add teammate by email</div>
        <p className="mb-3 text-xs" style={{ color: "#8e7f81" }}>
          They must already have a Reelo account. We do not send invite emails yet.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="min-w-[220px] flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            style={{ border: "1px solid rgba(255,70,85,.22)" }}
          />
          <button
            type="button"
            disabled={busy || !email}
            onClick={() => void invite()}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            Add to roster
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 font-display text-lg font-bold">Members & invites</div>
        {members.length === 0 ? (
          <p className="text-sm" style={{ color: "#9a8b8d" }}>No invites yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
                <div>
                  <div className="text-sm font-semibold">{m.memberEmail}</div>
                  <div className="text-xs capitalize" style={{ color: "#8e7f81" }}>
                    {m.role} · {m.status} · {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button type="button" disabled={busy} onClick={() => void remove(m.id)} className="text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
