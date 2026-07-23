# Deployment architecture — is Vercel required?

Analysis before any migration, per the owner's instruction: decide the right
host from the code, not from where the previous developer happened to put it.

## Is the app built for Vercel? No.

Evidence from the code:

- **No Vercel-only dependencies.** Runtime deps are `next`, `react`, `react-dom`
  and a Postgres driver. No Vercel SDKs, no `vercel.json`.
- **It reads Cloudflare headers already** — `cf-ipcountry` sits right beside
  `x-vercel-ip-country`, with Cloudflare as an accepted source.
- **It detects Vercel only to work around it.** `VERCEL=1` is used in one place:
  to *refuse* SQLite/disk storage there, because Vercel's filesystem is wiped
  between requests. The code goes out of its way to run *off* Vercel.
- The `output: "standalone"` build and the `Dockerfile` are platform-neutral and
  run on any Node host.

**Conclusion: Vercel is not required. It is one option among several.**

## What the code actually needs from a host

1. **Node.js ≥ 22.5** (the database is `node:sqlite`, built into Node).
2. **Requests that can run up to 5 minutes.** Video generation polls the
   provider server-side for up to ~320 seconds (`maxDuration = 300`). This is the
   single most important constraint — it rules out short-request platforms.
3. **Somewhere to keep data.** Two supported modes, chosen automatically:
   - **A persistent disk** → SQLite + local media. **No external services.**
   - **An ephemeral host** (Vercel) → needs external Postgres *and* Blob storage.

## Why Cloudflare cannot be the compute host

Cloudflare Workers/Pages run short edge requests on V8 isolates. They cannot
hold a request open for five minutes, and do not offer the Node runtime the app
uses. Hosting the app there would require rewriting every generation flow to an
async job model — large and risky. Cloudflare is still ideal for **DNS, CDN, SSL
and R2 storage** in front of whatever runs the app.

## The options, compared

| Option | Control | Complexity | External services needed | Handles 5-min jobs |
| --- | --- | --- | --- | --- |
| **Persistent server you own** — Railway / Render with a volume, or a VPS (incl. a GoDaddy VPS) | Full | Low–Medium | **None** — SQLite + disk | Yes (real server, no function cap) |
| **Your own Vercel** | Full | Low | Postgres + Blob (2 services) | Yes (via function limits) |
| **GoDaddy shared / cPanel hosting** | Full | — | — | **No** — old Node, short timeouts |
| Cloudflare Workers/Pages | Full | High (rewrite) | R2 + Postgres | No |

## Recommendation

**Deploy the Docker image to a persistent-server host you own** — Railway or
Render (both build the `Dockerfile` straight from your GitHub, offer a volume for
`.data`, ~$5/month), or a VPS if you prefer to run the box yourself. A GoDaddy
VPS qualifies and reuses your existing GoDaddy relationship; GoDaddy *shared*
hosting does not (it can't run Node 22 or hold 5-minute requests).

Why this over Vercel, for an owner who wants control with least complexity:

- **Fewer moving parts.** A real disk means SQLite + local files — no separate
  Postgres, no separate Blob. Just Gemini + HeyGen keys and the app.
- **Better fit for the workload.** A persistent server runs a 5-minute generation
  as an ordinary request; serverless platforms fight that with function caps.
- **Full ownership, no ex-developer dependency**, and nothing tied to Vercel.
- The `Dockerfile` and `/api/health` check are already built for exactly this.

**Vercel remains a valid fallback** if you would rather have zero server
administration and don't mind adding the two free storage/database services. It
is proven — the app runs there today — but it keeps you on the platform you're
trying to move away from, with more services, not fewer.

**Decision needed from the owner:** persistent-server host (recommended) or your
own Vercel. No account is created and nothing is migrated until that choice is
made.
