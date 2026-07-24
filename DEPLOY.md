# Deploying Reelo

**Strategy:** Cloudflare Workers (OpenNext) is the primary production runtime.
**Docker / VPS Node** remains the migration fallback with a persistent `.data` volume.
**Vercel is optional** and not required. Do **not** use `@cloudflare/next-on-pages`.

See `docs/CLOUDFLARE_WORKERS.md` and `.env.production.example` for the Workers path.

Reelo on a normal Node server needs **Node 22.5 or newer** (local SQLite uses
`node:sqlite`) and **one writable folder** that survives restarts. On Cloudflare
Workers, SQLite/disk are disabled — you must set **Neon `DATABASE_URL`** (and
ideally remote blob storage).

## The one thing that matters: persistence

Accounts, token balances and finished videos must survive restarts.

So pick one:

- **Cloudflare Workers + Neon (preferred production)** — OpenNext Worker with
  `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` (or future R2). No local `.data`.
- **Cloudflare DNS + Docker/VPS (fallback)** — container or VPS with a volume at
  `/app/.data`. Cloudflare for DNS/TLS/WAF in front.
- **A host with a real disk** — Railway, Render, Fly, or any VPS. `.data` just
  works. Use Cloudflare for DNS/TLS even when the origin is Docker.
- **A fully ephemeral serverless host** — then you must give it a Postgres
  database and blob storage (see managed services below).

Check which mode you are in at any time: `GET /api/health` reports the live
database and storage drivers.

## Option A — Docker (migration fallback / origin)

```bash
docker build -t reelo .
docker run -p 3000:3000 --env-file .env.local -v reelo-data:/app/.data reelo
```

Docker runs `npm run build:next` (plain Next standalone). Cloudflare Workers use
`npm run build` → OpenNext (see `docs/CLOUDFLARE_WORKERS.md`).

The `-v reelo-data:/app/.data` is the persistent folder. Drop it and you lose
accounts and videos on every restart. Point Cloudflare DNS at this host and
enable the proxy for TLS/WAF.

## Option B — a plain server / VPS

```bash
npm ci
npm run build
npm run setup          # once — sets your admin password in .env.local
npm start              # serves on PORT (default 3000)
# or: node .next/standalone/server.js
```

Put it behind Cloudflare (or nginx/Caddy) for TLS, and keep it running with
`pm2`, `systemd` or similar. `.data` sits in the project directory; make sure
that directory is on persistent storage and backed up.

## Environment

The only secret needed to boot is the admin password, which `npm run setup`
writes to `.env.local`. Everything else is added through **Admin → Key vault**
in the running app, or set as environment variables on your host:

| Variable | What it unlocks | Needed to launch? |
| --- | --- | --- |
| `GEMINI_API_KEY` | Amber, and most of the video tools | To generate anything |
| `HEYGEN_API_KEY` | AI Avatar Studio, Website Commercial | For those two tools |
| `ADMIN_PASSWORD` | the admin login | Yes — `npm run setup` sets it |
| `ADMIN_SESSION_SECRET` | admin session signing | `npm run setup` generates it |
| `DATABASE_URL` | Postgres instead of SQLite | Only on ephemeral/serverless hosts |
| `BLOB_READ_WRITE_TOKEN` | Remote blob instead of local disk | Only on ephemeral hosts (optional) |
| `MEDIA_RETENTION_DAYS` | how long videos are kept (default 30) | No |

The daily usage caps (`VIDEO_DAILY_LIMIT`, `HEYGEN_DAILY_LIMIT`, and the rest)
are your protection against a runaway provider bill — see `KEYS.md`. Lower them
while testing.

Note: the vault turns **read-only** on a deployed server, because a deployed
filesystem should not be edited from the browser. Set keys as host environment
variables in production; use the vault only in local development.

Amber HQ stores deploy tokens separately: prefer `CLOUDFLARE_API_TOKEN` in the
Amber Credential Vault. `VERCEL_TOKEN` is optional and not a deploy blocker.

## Managed services (only if your host is serverless)

- **Postgres** — set `DATABASE_URL` (Neon, Supabase, any Postgres). Reelo uses
  it automatically whenever the variable is present. The schema is created on
  first run; no migration step.
- **Blob storage** — set `BLOB_READ_WRITE_TOKEN` only if you need remote blobs
  on an ephemeral filesystem. Prefer Docker + local disk behind Cloudflare when
  possible.

With both Postgres and blob set, Reelo can run more statelessly on ephemeral hosts.

## Verifying a deploy

```bash
curl https://your-host/api/health
```

```json
{
  "status": "up",
  "accounts": true,          // false => no database; accounts won't work
  "persistsVideos": true,    // false => videos keep only an expiring link
  "database": "sqlite",      // or "postgres"
  "storage": "disk",         // or "blob"
  "providers": { "gemini": true, "heygen": true, "stripe": false }
}
```

If `accounts` or `persistsVideos` is `false` and you did not intend that, your
`.data` folder is not persistent — fix the volume, or add the managed services
above.
