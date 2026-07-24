# Cloudflare Workers (OpenNext) — MyReelo

Primary production target: **Cloudflare Workers** via `@opennextjs/cloudflare`.

Do **not** use Vercel or `@cloudflare/next-on-pages` for this path.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run build` | Standard Next.js production build (preserved) |
| `npm run cf:build` | OpenNext Worker bundle |
| `npm run preview` | Build + local Workers runtime preview |
| `npm run deploy` | Build + deploy (only after owner approval) |
| `npm run cf-typegen` | Generate `cloudflare-env.d.ts` |

Local Node development remains `npm run dev` / `npm start`.

Docker fallback still uses `DOCKER_BUILD=1` for `output: "standalone"`.

## Compatibility notes

| Feature | Workers status |
|---------|----------------|
| Neon Postgres (`DATABASE_URL`) | **Required** — use `@neondatabase/serverless` |
| SQLite / `.data` disk | **Disabled** (`DISABLE_SQLITE=1`) |
| Local media (`/api/media`) | **Unavailable** — set `BLOB_READ_WRITE_TOKEN` (or future R2) |
| Auth (admin + accounts) | Compatible (Edge Middleware + Neon) |
| API routes | Compatible with `nodejs_compat` |
| Puppeteer audits | **Scripts only** — not part of Worker |
| Long Veo polls (`maxDuration` 300s) | **Risk** — may hit Workers CPU/wall limits; prefer client-poll patterns (HeyGen already does) |

**Middleware:** Next.js 16 prefers `proxy.ts` (Node), but OpenNext Cloudflare does not support Node middleware yet. This repo uses Edge `src/middleware.ts` for `/admin` protection so Workers builds succeed (Next may show a deprecation warning).

## Secrets

See `.env.production.example`. Set secrets in Cloudflare dashboard — never commit them.

## Deploy gate

Do not run `npm run deploy` or change DNS until:

1. `npm run build` passes
2. `npm run cf:build` (or `preview`) passes
3. Owner approves deploy
