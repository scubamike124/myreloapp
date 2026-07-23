# Deploying Reelo

Reelo is a normal Node server. It needs **Node 22.5 or newer** (the database is
built into Node itself, `node:sqlite`) and **one writable folder** that survives
restarts. Nothing else — no managed database or object store is required to go
live, though you can add them later.

## The one thing that matters: `.data`

Accounts, token balances and finished videos are written under `.data/` in the
app directory. **That folder must persist between restarts.** On a normal server
or a mounted disk it does; on a "serverless" host with an ephemeral filesystem
(Vercel, Netlify, plain Lambda) it does not — and Reelo detects that case and
refuses to use SQLite there rather than lose accounts silently.

So pick one:

- **A host with a real disk** — a VPS, Railway, Render, Fly, a container with a
  volume. `.data` just works. This is the simplest path and needs no signups.
- **A serverless host** — then you must give it a Postgres database and blob
  storage instead (see "Managed services" below).

Check which mode you are in at any time: `GET /api/health` reports the live
database and storage drivers.

## Option A — Docker (works anywhere)

```bash
docker build -t reelo .
docker run -p 3000:3000 --env-file .env.local -v reelo-data:/app/.data reelo
```

The `-v reelo-data:/app/.data` is the persistent folder. Drop it and you lose
accounts and videos on every restart. Railway, Render and Fly all build this
Dockerfile directly — point them at the repo and add a volume mounted at
`/app/.data`.

## Option B — a plain server / VPS

```bash
npm ci
npm run build
npm run setup          # once — sets your admin password in .env.local
npm start              # serves on PORT (default 3000)
```

Put it behind nginx/Caddy for TLS, and keep it running with `pm2`, `systemd` or
similar. `.data` sits in the project directory; make sure that directory is on
persistent storage and backed up.

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
| `DATABASE_URL` | Postgres instead of SQLite | Only on serverless hosts |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob instead of local disk | Only on serverless hosts |
| `MEDIA_RETENTION_DAYS` | how long videos are kept (default 30) | No |

The daily usage caps (`VIDEO_DAILY_LIMIT`, `HEYGEN_DAILY_LIMIT`, and the rest)
are your protection against a runaway provider bill — see `KEYS.md`. Lower them
while testing.

Note: the vault turns **read-only** on a deployed server, because a deployed
filesystem should not be edited from the browser. Set keys as host environment
variables in production; use the vault only in local development.

## Managed services (only if your host is serverless)

- **Postgres** — set `DATABASE_URL` (Neon, Supabase, any Postgres). Reelo uses
  it automatically whenever the variable is present. The schema is created on
  first run; no migration step.
- **Blob storage** — set `BLOB_READ_WRITE_TOKEN` (Vercel Blob). Finished videos
  go there instead of local disk.

With both set, Reelo runs statelessly and can scale horizontally.

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
