# Reelo — infrastructure inventory

What already exists for this project, audited 23 July 2026. The point of this
file is reuse: nothing new needs buying or creating that is not listed as
missing below.

## What exists and works

| Resource | Where | Status |
| --- | --- | --- |
| **Domain** | `myreelo.com` at GoDaddy | Owned by you |
| **DNS** | GoDaddy (`ns41.domaincontrol.com`, `ns42.domaincontrol.com`) | You can edit records |
| **Hosting / deploy** | Vercel (DNS points to Vercel IPs `216.198.79.x` / `64.29.17.x`) | Live, but serving an **old build** |
| **HTTPS / SSL** | Vercel, automatic | Working |
| **Source code** | GitHub `scubamike124/myreloapp` | Owned by you |
| **Gemini API key** | in local `.env.local` | Present |
| **HeyGen API key** | in local `.env.local` | Present |
| **Admin password + session secret** | in local `.env.local` | Present |

## What is missing (would need setting up, not reusing)

| Resource | Needed for | Notes |
| --- | --- | --- |
| **Postgres database** | Accounts, tokens, ledger on Vercel | Vercel wipes its disk, so SQLite can't be used there. Free tier: Neon or Vercel Postgres. |
| **Blob storage** | Storing finished videos on Vercel | Free tier: Vercel Blob. Without it, videos keep only the provider's expiring link. |
| **Business email** | e.g. `support@myreelo.com` | No MX records on the domain — no mailbox exists yet. GoDaddy plans often include one. |
| **Stripe** | Selling tokens | Not started, by your choice. |
| **Analytics** | Traffic insight | None configured. |

## The one real blocker to going live

The domain already points at Vercel, and the code is ready. What is stale is the
**Vercel deployment** — it is serving an old build and has not picked up recent
work (`/api/health` returns 404 on the live site, and that route exists in the
current code).

Updating a Vercel deployment can only be done from inside the Vercel account it
lives in. That account was set up by the previous developer. So the blocker is
**access to that Vercel account** — not a technical gap in the code, and not a
new service to buy.

**Reuse-first recovery, in order of preference:**

1. **Recover the existing Vercel account.** If it was created under one of your
   own emails (e.g. your Gmail/Yahoo), a password reset at vercel.com puts you
   back in control of the existing project and domain — full reuse, no new
   account, no DNS change.
2. **Get the login from the developer**, if the account is under his email.
3. **Only if neither works:** create your own Vercel from the GitHub repo you
   already own, and move the domain to it with one verification record in
   GoDaddy DNS (which you control). Same domain, same host type, one small DNS
   edit.

## What the code is already configured to reuse

- Your existing **Gemini and HeyGen keys** — the app reads them as-is.
- The **domain** `www.myreelo.com` is the built-in production default (no config).
- The database layer is **Vercel-safe**: it uses SQLite on a real disk and
  automatically switches to Postgres when `DATABASE_URL` is set — no code change
  to move between them.
- Storage switches to **Vercel Blob** automatically when `BLOB_READ_WRITE_TOKEN`
  is present.

So once the Vercel account is back in your hands, going live is: connect the
repo, paste the environment variables, deploy. No rebuild, no new accounts
beyond the free Postgres/Blob add-ons.
