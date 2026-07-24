# Cloudflare Workers (OpenNext) — MyReelo

Primary production target: **Cloudflare Workers** via `@opennextjs/cloudflare`.

Do **not** use Vercel or `@cloudflare/next-on-pages` for this path.

## Cloudflare Workers Builds (Git)

Default Cloudflare settings work with this repo:

| Cloudflare field | Expected command | What it does here |
|------------------|------------------|-------------------|
| Build command | `npm run build` | Runs `opennextjs-cloudflare build` → emits `.open-next/` (including `open-next.config.edge.mjs` + `worker.js`) |
| Deploy command | `npx wrangler deploy` | Detects OpenNext and runs `opennextjs-cloudflare deploy` against those artifacts |

`open-next.config.ts` sets `buildCommand: "npx next build"` so OpenNext does **not** recurse into `npm run build`.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run build` | **OpenNext Worker build** (Cloudflare CI entrypoint) |
| `npm run build:next` | Plain Next.js build (Docker / local Node standalone) |
| `npm run cf:build` | Alias for OpenNext build |
| `npm run preview` | OpenNext build + local Workers preview |
| `npm run deploy` | OpenNext build + deploy (owner approval required) |
| `npm run upload` | OpenNext build + version upload (non-production branches) |
| `npm run cf-typegen` | Generate `cloudflare-env.d.ts` |

Local Node development remains `npm run dev` / `npm start`.

Docker fallback uses `DOCKER_BUILD=1` + `npm run build:next` for `output: "standalone"`.

## Wrangler entry

`wrangler.jsonc`:

- `main`: `.open-next/worker.js`
- `assets.directory`: `.open-next/assets`
- `compatibility_flags`: `nodejs_compat`, `global_fetch_strictly_public`

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

1. `npm run build` produces `.open-next/worker.js` and `.open-next/.build/open-next.config.edge.mjs`
2. Owner approves deploy
