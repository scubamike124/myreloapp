"use client";

import { useEffect, useRef, useState } from "react";
import type { ExecutionEvent } from "@/lib/amber/execution-types";
import { buildFeedItems, type FeedItem, type FeedTone } from "@/lib/amber/feed";
import { DiffView } from "./DiffView";

const DOT: Record<FeedTone, string> = {
  pending: "bg-amber-500",
  ok: "bg-emerald-500",
  error: "bg-red-500",
};

// The status of each step is carried by the text color itself, not just the
// dot beside it — amber while a step is actively working, green once it's
// verified done, red the moment something fails — so the shape of a run is
// readable at a glance without inspecting every dot.
const TEXT: Record<FeedTone, string> = {
  pending: "text-amber-700",
  ok: "text-emerald-700",
  error: "text-red-600",
};

/** Near-bottom threshold, in px, below which the feed counts as "at live". */
const LIVE_THRESHOLD = 64;

function Row({ item, isLast }: { item: FeedItem; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const expandable = item.events.some((e) => e.diff || e.detail || e.command);
  const pulsing = isLast && item.tone === "pending";

  return (
    <li className="flex gap-3">
      <span className="flex w-4 shrink-0 justify-center pt-1.5">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${DOT[item.tone]} ${pulsing ? "animate-pulse" : ""}`} />
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <button
          type="button"
          disabled={!expandable}
          onClick={() => setOpen((o) => !o)}
          className={`block w-full text-left ${expandable ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className={`text-[14.5px] leading-relaxed ${TEXT[item.tone]}`}>{item.text}</span>
          {item.meta && <span className="ml-2 text-[12.5px] text-black/45">{item.meta}</span>}
          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-2 text-[12.5px] text-sky-700 hover:underline"
            >
              View ↗
            </a>
          )}
          {expandable && <span className="ml-1.5 text-[10px] text-black/30">{open ? "▾" : "▸ details"}</span>}
        </button>

        {open && (
          <div className="mt-1.5 space-y-1.5">
            {item.events.map((e) => (
              <div key={e.id}>
                {e.command && (
                  <pre className="overflow-x-auto rounded-lg border border-black/8 bg-black/[.03] px-2.5 py-1.5 font-mono text-[11px] text-emerald-700">
                    <span className="text-black/35">$ </span>
                    {e.command}
                  </pre>
                )}
                {e.diff && <DiffView diff={e.diff} />}
                {e.detail && !e.diff && !e.command && (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-black/8 bg-black/[.03] px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-black/60">
                    {e.detail}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The primary, continuously-updating view of a task. Confirmed live: a real
 * user on a real phone had to manually scroll to keep up with Amber's work
 * — unacceptable for a live feed. This component owns its own scroll
 * position: it follows the newest event automatically, and only stops when
 * the person deliberately scrolls up to read something older, at which
 * point it offers a way back rather than fighting their scroll.
 */
export function LiveFeed({ events, idleLabel }: { events: ExecutionEvent[]; idleLabel: string }) {
  const items = buildFeedItems(events);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const lastCountRef = useRef(items.length);

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= LIVE_THRESHOLD;
  };

  // New real events arrived: if the user hasn't scrolled away, follow them
  // to the bottom. If they have, do nothing — the "Jump to Live" button
  // (rendered below) is the only thing allowed to move their scroll then.
  useEffect(() => {
    if (items.length === lastCountRef.current) return;
    lastCountRef.current = items.length;
    if (following && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length, following]);

  const onScroll = () => {
    const atBottom = isNearBottom();
    setFollowing(atBottom);
  };

  const jumpToLive = () => {
    setFollowing(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[160px] items-center justify-center text-center text-[13px] text-black/40">{idleLabel}</div>
        ) : (
          <ol className="space-y-2.5">
            {items.map((item, i) => (
              <Row key={item.id} item={item} isLast={i === items.length - 1} />
            ))}
          </ol>
        )}
      </div>

      {!following && items.length > 0 && (
        <button
          type="button"
          onClick={jumpToLive}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          ↓ Jump to Live
        </button>
      )}
    </div>
  );
}
