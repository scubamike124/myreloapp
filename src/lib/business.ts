import { dbConfigured, ensureSchema, sql } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { balanceOf } from "@/lib/tokens";
import { RETENTION_DAYS } from "@/lib/storage";

// ---------------------------------------------------------------------------
// The numbers on the Business Center overview.
//
// These used to be written into the page: 128 videos, 1.2M views, $12.4K
// revenue. Shown to a signed-in customer, invented figures about their own
// account are not decoration — they are a lie about their business, and the
// first thing a real customer would notice is that the money is not theirs.
//
// So the tiles keep their design and report what we can actually count. Views,
// likes and shares are not among them: nothing here publishes anywhere, so
// there is no such number to report and none is claimed.
// ---------------------------------------------------------------------------

export type Stat = { value: string; label: string };

export type Activity = {
  id: string;
  title: string;
  toolTitle: string;
  status: string;
  kind: string;
  mediaUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type Overview = {
  /** False when accounts are off or nobody is signed in. */
  personal: boolean;
  signedIn: boolean;
  stats: Stat[];
  recent: Activity[];
};

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function bytes(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} GB`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} MB`;
  if (n >= 1000) return `${Math.round(n / 1000)} KB`;
  return `${n} B`;
}

/** The signed-out view: real labels, honest dashes, nothing invented. */
function empty(signedIn: boolean): Overview {
  return {
    personal: false,
    signedIn,
    stats: [
      { value: "—", label: "Videos Created" },
      { value: "—", label: "Images Made" },
      { value: "—", label: "Made This Month" },
      { value: "—", label: "Tokens Left" },
      { value: `${RETENTION_DAYS}`, label: "Days Kept" },
    ],
    recent: [],
  };
}

export async function getOverview(): Promise<Overview> {
  if (!dbConfigured()) return empty(false);

  const user = await currentUser();
  if (!user) return empty(false);

  const q = sql();
  if (!q || !(await ensureSchema())) return empty(true);

  try {
    const rows = (await q`
      SELECT kind, bytes, created_at AS "createdAt"
      FROM creations
      WHERE user_id = ${user.id}
        AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
    `) as { kind: string; bytes: number | null; createdAt: string }[];

    const monthAgo = Date.now() - 30 * 86400_000;
    let videos = 0;
    let images = 0;
    let thisMonth = 0;
    let stored = 0;
    for (const r of rows) {
      if (r.kind === "video") videos++;
      else images++;
      stored += Number(r.bytes ?? 0);
      if (new Date(r.createdAt).getTime() >= monthAgo) thisMonth++;
    }

    const balance = await balanceOf(user.id);

    const recent = (await q`
      SELECT id, title, tool_title AS "toolTitle", status, kind,
             media_url AS "mediaUrl", created_at AS "createdAt", expires_at AS "expiresAt"
      FROM creations
      WHERE user_id = ${user.id}
        AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
      ORDER BY created_at DESC
      LIMIT 4
    `) as Activity[];

    return {
      personal: true,
      signedIn: true,
      stats: [
        { value: compact(videos), label: "Videos Created" },
        { value: compact(images), label: "Images Made" },
        { value: compact(thisMonth), label: "Made This Month" },
        { value: compact(balance), label: "Tokens Left" },
        { value: stored > 0 ? bytes(stored) : `${RETENTION_DAYS}d`, label: stored > 0 ? "Storage Used" : "Days Kept" },
      ],
      recent,
    };
  } catch {
    return empty(true);
  }
}

/** "2 min ago" — the activity list reads as a feed, not a timestamp column. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
