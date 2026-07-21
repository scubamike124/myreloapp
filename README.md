# Reelo

An AI video platform. Turn photos, scripts, and websites into short-form videos,
talking avatars, and commercials.

Built with Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.

## Getting started

```bash
npm install
npm run setup     # sets an admin password, creates .env.local
npm run dev
```

Then open http://localhost:3000/admin and add the rest of your keys under
**Key vault** — no file editing needed.

📋 **[KEYS.md](KEYS.md) is the checklist of what to go and get.** Short version:
only two keys need signing up for (Gemini and HeyGen); everything else is
self-generated, optional, or for features that don't exist yet.

Prefer files? `cp .env.example .env.local` works too; every variable is
documented there. Nothing is required just to browse the app — routes that need
a key fail with a clear message naming the one that's missing.

### The key vault

`Admin → Key vault` is a UI for your API keys. Keys are sent to the server and
written to `.env.local`; they are **never** stored in the browser, and saved
values are never sent back (you see a masked hint like `••••••••3xyz`). There's
a **Test** button for the Gemini and HeyGen keys that verifies them against the
real provider, so a bad paste surfaces immediately.

Two deliberate limits:

- **Only known keys can be written.** An allowlist blocks arbitrary env vars —
  without it, writing something like `NODE_OPTIONS` to `.env.local` would be a
  code-execution vector.
- **Editing is disabled in production.** Deployed filesystems are read-only and
  ephemeral, so the vault becomes read-only there and points you at your host's
  environment settings instead.

Changing a key requires restarting the server to take effect; the vault tells
you when that's pending.

`npm run setup` exists because the vault sits behind the admin login, and the
admin password is itself a key — something has to set that first one. For
scripted installs use `SETUP_ADMIN_PASSWORD=... npm run setup`.

| Variable | Needed for |
| --- | --- |
| `GEMINI_API_KEY` | Amber, website scanning, avatar video/image generation |
| `HEYGEN_API_KEY` | Avatar catalog and HeyGen avatar videos |
| `ADMIN_PASSWORD` | Access to `/admin`. Unset = admin stays locked |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | One-time bootstrap: creates `.env.local` with an admin password |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`next lint` was removed in Next 16) |
| `npm run test:responsive` | Layout audit across every route × 5 viewports |
| `npm run test:interactions` | Clicks every button, resolves every link |
| `npm run refresh:avatars` | Regenerate the bundled HeyGen avatar snapshot |

## Architecture

```
src/
  app/                    Routes (App Router)
    api/                  Route handlers
    admin/(dashboard)/    Admin pages — gated by proxy.ts
  components/
    amber/                Amber — the single assistant surface
    create/               Tool studios
    design/               Layout shells and shared UI
  lib/
    amber/                Amber persona + grounding context
    workspace.ts          The user's creation history
    api-guard.ts          Rate limiting, payload caps, SSRF guard
  proxy.ts                Request gate (Next 16's renamed middleware)
```

### Amber

There is **one** Amber. Her persona lives in `src/lib/amber/persona.ts` and every
surface routes through `/api/amber`. If Amber needs to behave differently
somewhere, pass richer context — do not fork the persona or add a second
assistant.

### Admin access

`/admin` is gated in `src/proxy.ts` before any page renders. The password is
server-only and compared in constant time; the session is an HMAC-signed,
expiring, `httpOnly` cookie. Set `ADMIN_PASSWORD` (and ideally
`ADMIN_SESSION_SECRET`) to enable it.

## Responsive testing

```bash
npm run build && npm start          # audit the production build
AUDIT_ADMIN_PASSWORD=<pw> npm run test:responsive
```

Loads every route at 320 / 390 / 768 / 1280 / 1920 px and fails on measurable
layout defects: horizontal page overflow, elements wider than the viewport,
content pushed off the left edge, and undersized touch targets. It drives the
Chrome already on your machine via `puppeteer-core` — nothing is downloaded.

- `-- --shots` also writes screenshots to `.responsive-audit/`
- Setting `AUDIT_ADMIN_PASSWORD` logs in so the admin pages are covered too —
  without it that whole authenticated area goes unchecked
- Exits non-zero on real breakage, so it can gate a build

Findings are written to `.responsive-audit.json`. Both output paths are
gitignored.

> Geometry passing is not the same as looking right. The audit catches overflow;
> it cannot tell you a chart is rendering empty bars. Use `--shots` and actually
> look at the images when changing layout.

## Interaction testing

```bash
AUDIT_ADMIN_PASSWORD=<pw> npm run test:interactions
```

Resolves every link target with a real request (so a link to a deleted route
shows up as a 404) and **clicks every button**, comparing URL, DOM, focus, open
dialogs and network activity before and after.

Findings are split deliberately:

- `inert-button` — no click handler at all. A genuinely dead control. **Fails the run.**
- `broken-link` / `dead-link` — a 4xx target or `href="#"`. **Fails the run.**
- `no-op-click` — has a handler, but this click changed nothing. Almost always
  the already-selected tab or filter, which *should* do nothing. Informational.

> Run it with **no provider keys set**. Generation buttons then stop at the
> route's key check instead of spending real Gemini/HeyGen credits, while still
> producing an observable error state — which is the correct behaviour.

## What is and isn't wired up

Being explicit so nothing in the UI misleads you:

**Working end to end**
- Talking Photo, Dancing Photo, Custom Avatar Creator (Gemini / Veo)
- AI Avatar Studio and Website Commercial (HeyGen, with live status polling)
- Website scanning → script + 20 video ideas (Gemini)
- Amber, on every page
- Your Library, backed by real generation history
- Admin dashboard access control

**Not wired up yet** — and labelled as such in the UI
- The other 7 tools in `/create` show their inputs but cannot generate
- Business Center (publishing, scheduling, analytics, revenue, social)
- Billing and plans — no checkout flow consumes the gateway credentials
- There is no user auth or database

## Known limitations

- **No persistence layer.** Creation history lives in `localStorage`, so it is
  per-browser and generated media is not retained after the tab closes.
- **Rate limits are in-memory.** They reset on restart and are not shared across
  serverless instances. Move them to Vercel KV or Redis before treating them as
  a hard spend control.
- **Generated media is returned as base64 data URLs**, which is memory-hungry.
  Object storage with signed URLs is the right fix.
- **`public/assets/hero-launch.mp4` is 38MB** — far too large for a homepage
  hero. The player no longer eagerly buffers it (`preload="metadata"`, and
  autoplay is skipped on Save-Data / slow / reduced-motion), but the file itself
  still needs re-encoding. Something like:
  ```bash
  ffmpeg -i hero-launch.mp4 -vf scale=1280:-2 -c:v libx264 -crf 26 \
         -preset slow -movflags +faststart -an hero-launch.mp4
  ```
  should land it under ~3MB. `-movflags +faststart` matters: it moves the index
  to the front so playback can begin before the file finishes downloading.
