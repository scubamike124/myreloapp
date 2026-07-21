"use client";

import { openAmber } from "./AmberDock";

/**
 * Opens the single global Amber dock. Used by navigation surfaces so that
 * "Chat"/"Ask Amber" entry points all reach the same assistant instead of
 * spawning their own.
 */
export default function AmberNavButton({ className = "", label = "Ask Amber" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={openAmber} title={label} aria-label={label} className={className} style={{ color: "#9a8b8d" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />
      </svg>
    </button>
  );
}
