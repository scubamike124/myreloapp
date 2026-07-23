# Cloudflare-first deployment — architecture and migration plan

Analysis of running Reelo on Cloudflare instead of Vercel, evidenced from the
code (23 July 2026). Verdict up front: **yes, it can run Cloudflare-first, but it
needs a focused refactor — it is not a config switch.** The good news is the
codebase already contains the pattern that removes the single hardest blocker.

## Can it run on Cloudflare Pages / Workers?

Yes, via the `@opennextjs/cloudflare` adapter, **after** the changes below. Today
the app assumes a long-running Node server; Cloudflare runs short-lived Workers
on V8 isolates. The gap is specific and countable, not vague.

## Does it need a full Node.js runtime?

Right now, yes — in a few places. The migration replaces each Node-server
assumption with a Cloudflare-native equivalent, after which it no longer needs a
persistent Node server:

| What the code does now | Why it breaks on Workers | Cloudflare replacement |
| --- | --- | --- |
| **Server-side polls Veo for up to 5 min** (`generate-avatar`, `product-commercial`) | Workers can't hold a request open that long | **Async pattern the repo already uses for HeyGen** — kick off, return a job id, let the client poll a status route. The Veo operation name is the job handle. |
| **Local disk storage + media serving** (`storage.ts`, `api/media`) | No filesystem on Workers | **R2** bucket + binding |
| **Reads character images from `public/` via `readFile`** (`story-maker`) | No `node:fs` on Workers | Fetch them as static asset URLs |
| **In-memory daily rate limiter** (`api-guard.ts`) | Memory isn't shared across isolates | **Workers KV** (or Durable Objects for exactness) |
| **`node:sqlite` + `node:module` createRequire** (`db.ts`) | Not available on Workers | Not needed — the DB is already **Neon Postgres**, whose driver runs on Workers over HTTP. Optionally migrate to **D1** later. |

## Which Cloudflare services are appropriate

| Service | Use in Reelo | Verdict |
| --- | --- | --- |
| **Pages** | Hosts the Next.js app (build via OpenNext adapter) | **Primary compute** |
| **Workers** | The runtime under Pages Functions | Used automatically |
| **R2** | Store finished videos and served media | **Yes — replaces disk/Blob** |
| **KV** | Per-user daily limits, small counters | **Yes** |
| **Neon Postgres** *(kept)* | Accounts, tokens, ledger — driver is edge-native | **Keep; least change** |
| **D1** | Cloudflare-native SQLite | Optional later; needs a SQL-layer rewrite |
| **Durable Objects** | Only if we want exact rate limits or job coordination | Optional |
| **DNS** | Move `myreelo.com` nameservers from GoDaddy to Cloudflare | **Yes — you manage DNS in Cloudflare** |
| **SSL / CDN** | Automatic once DNS is on Cloudflare | **Yes** |
| **Zero Trust** | Gate `/admin` behind Cloudflare Access | Optional, recommended |

## Changes needed — phased so the app keeps working throughout

**Phase 1 — decouple long jobs (also improves every other host).**
Refactor the two Veo routes to the async kick-off + client-poll pattern already
proven by the HeyGen tools. This removes the 5-minute-request liability
everywhere, not just on Cloudflare, and is testable locally. No Cloudflare
account required.

**Phase 2 — storage on R2.**
Add an R2 driver to the existing storage-driver model, and serve `api/media`
from R2. Env-gated, so disk still works locally.

**Phase 3 — edge-safe state.**
Move the daily limiter to KV; fetch story-maker character images as static
assets; guard the `node:sqlite`/`node:module` paths so they are never loaded on
Workers (the DB stays Neon).

**Phase 4 — Cloudflare build + deploy.**
Add `@opennextjs/cloudflare` and `wrangler` config, wire the R2/KV bindings and
`DATABASE_URL`, and deploy to a **Pages preview** (staging) first. This phase
needs your Cloudflare login to build and test.

**Phase 5 — DNS + cutover.**
Move nameservers to Cloudflare, verify the preview, then point production at it.
DNS and cutover are your approval, not automatic.

## Honest cost comparison

- **Cloudflare-first** (this plan): best global performance, cheapest at scale,
  everything owned in your Cloudflare account — but it is a real refactor
  (Phases 1-3 are engineering, with the usual risk of changing working code) and
  Phase 4 can only be built and tested with your Cloudflare account.
- **Docker on a host you own** (Render/VPS): **zero code changes**, runs today,
  Cloudflare still used in front for DNS/CDN/R2. Less "Cloudflare-native", but
  far less work.

Both give you full ownership and remove the ex-developer's Vercel. Cloudflare-
first is the right choice if owning the whole stack in Cloudflare is worth the
refactor; the Docker path is right if you want it live with the least change.

## What can start now without your login

Phases 1-3 are code, testable locally, and each leaves the app working on every
host. Phase 4 onward needs your Cloudflare account. So preparation begins with
Phase 1.
