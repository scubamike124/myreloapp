# Keys to get

A checklist for when you're ready to collect credentials. Add each one at
**Admin → Key vault** (`npm run setup` first, then `npm run dev`).

The app runs without any of these — you can browse every page. Keys unlock the
generation features.

---

## Actually needed: 2

These are the only two you have to go and sign up for. Everything below this
section is either self-generated or not needed yet.

### 1. `GEMINI_API_KEY` — Google Gemini

- [x] Get one at **https://aistudio.google.com** → "Get API key"
- Two formats are valid: the older `AIza...` and the newer dotted `AQ....`
  that AI Studio issues now. Both work — the vault accepts either.

**Unlocks:**
- Amber (the assistant) — she is unavailable without this
- Website scanning → script + 20 video ideas
- Talking Photo, Dancing Photo (Veo image-to-video)
- Custom Avatar Creator (avatar images)

**⚠️ Important:** the free tier covers Amber, website scanning, and avatar
images fine. But **Veo video generation needs billing enabled** on your Google
Cloud project — the free-tier video quota is very small and you'll hit
"quota exceeded" almost immediately. If Talking Photo / Dancing Photo fail with
a quota error, this is why. Check current pricing before enabling billing.

### 2. `HEYGEN_API_KEY` — HeyGen

- [x] Get one at **https://app.heygen.com** → Settings → API

**Unlocks:**
- AI Avatar Studio (talking-avatar videos)
- Website Commercial (the spokesperson render)
- The live avatar catalog refresh (`npm run refresh:avatars`)

**Note:** the avatar catalog itself already works without this — it ships as a
bundled snapshot. You only need the key to *generate* videos or pull a fresh
catalog. HeyGen trial accounts include a limited number of credits; the vault's
**Test** button will show you how many you have left.

---

### 3. `DATABASE_URL` — Postgres (only if you deploy to Vercel)

- [ ] Only needed on Vercel. Free tier at **https://neon.tech**, no card required
- Create a project, then copy the connection string (starts `postgresql://`)

**You do not need this to run Reelo.** Accounts, token balances and the ledger
all work right now on a local database file (`.data/reelo.db`) using SQLite,
which is built into Node and needs no signup.

It becomes **required on Vercel**, whose filesystem is wiped between requests —
a database file there would look like it worked and silently lose every account.
Reelo detects this and refuses to use SQLite on Vercel rather than losing data.

Any host with a real disk (a VPS, Railway, Render, Fly) needs nothing.

### 4. `BLOB_READ_WRITE_TOKEN` — Vercel Blob (only if you deploy to Vercel)

- [ ] In your Vercel dashboard → **Storage** → **Create** → **Blob**
- Copy the token it gives you (starts `vercel_blob_rw_`)

**Also not needed to run Reelo.** Finished videos are already saved to disk
under `.data/media` and served back by the app. Same story as the database:
Vercel's filesystem cannot hold them, so Blob takes over there.

Videos are kept for **30 days** and then deleted automatically — stated in the
Library, the privacy policy and support. Change it with `MEDIA_RETENTION_DAYS`.

Without any storage at all, the Library keeps the provider's own link, which
expires on their schedule rather than ours.

---

## Self-generated — nothing to sign up for

| Key | How |
| --- | --- |
| `ADMIN_PASSWORD` | You choose it. `npm run setup` prompts for it. |
| `ADMIN_SESSION_SECRET` | `npm run setup` generates a random one automatically. |

---

## Blocking revenue — Stripe

Everything else about billing is now built and tested: accounts, balances, the
ledger, charging every paid generation, refunding failures, and the "not enough
tokens" screen. The one missing piece is taking the money.

- [ ] `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Sign up at **https://stripe.com**, then Developers → API keys

Until this exists, "Buy tokens" leads to the pricing page but no purchase can
complete. No code reads these yet — the checkout gets built once the account
exists, because the webhook has to be tested against a real one.

PayPal (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`) is a later alternative,
not needed for launch.

---

## Not keys — but they're on the site right now

The legal pages show these as literal placeholder text to every visitor. They
live in `src/lib/legal.ts` and need your real details:

- [ ] Registered business name
- [ ] Business address
- [ ] Country / state whose law applies
- [ ] Support email address
- [ ] Billing email address
- [ ] Refund window you want to offer (e.g. 14 days)

Send them over and I'll put them in — it's a five-minute change, and until then
your privacy policy reads "`[YOUR SUPPORT EMAIL]`".

---

## Would unlock more tools — not needed for launch

Three tools in Create have no backend because they need a provider we have not
connected. They say so plainly rather than pretending.

| Tool | Needs |
| --- | --- |
| Revoice | A voice-cloning provider (ElevenLabs or similar) |
| Translate Videos | A dubbing / translation provider |
| AI Quality Enhancement | A video upscaling provider (Topaz or similar) |

A text-to-speech provider would also add spoken voiceover to Story & Memory
Generator, which currently carries written narration on screen only.

---

## Optional — no signup, just values

**Usage caps** (per user, per day). All have working defaults; set them only if
you want different limits.

| Key | Default | Caps |
| --- | --- | --- |
| `VIDEO_DAILY_LIMIT` | 5 | Veo video generations |
| `IMAGE_DAILY_LIMIT` | 20 | Avatar image generations |
| `ANALYZE_DAILY_LIMIT` | 25 | Website scans |
| `HEYGEN_DAILY_LIMIT` | 5 | HeyGen videos |
| `HEYGEN_MAX_SECONDS` | 30 | Spoken length per HeyGen clip |
| `STORYBOOK_DAILY_LIMIT` | 5 | Bedtime storybooks |
| `STORY_MAKER_DAILY_LIMIT` | 5 | Story Maker episodes |
| `MEMORY_FILM_DAILY_LIMIT` | 10 | Memory films (cheap — text only) |
| `MEDIA_RETENTION_DAYS` | 30 | How long finished videos are kept |

These are your main protection against a runaway bill, since every one of those
actions costs money. Worth lowering while you're testing.

**Social links** — just profile URLs. Each one you set adds that icon to the
footer; unset ones are hidden rather than shown as dead links.

- `NEXT_PUBLIC_SOCIAL_TIKTOK`
- `NEXT_PUBLIC_SOCIAL_YOUTUBE`
- `NEXT_PUBLIC_SOCIAL_INSTAGRAM`
- `NEXT_PUBLIC_SOCIAL_FACEBOOK`

---

## Suggested order

1. `npm run setup` → pick an admin password
2. Get the **Gemini** key → Amber and website scanning start working immediately
3. Get the **HeyGen** key → avatar videos start working
4. Hit **Test** on both in the vault to confirm they're live
5. Lower the daily limits while you experiment
6. Enable Google billing only when you want Veo video generation

## Deploying

The vault writes to `.env.local`, which is local-only and gitignored. When you
deploy, set the same keys in your host's environment settings (Vercel →
Settings → Environment Variables). The vault turns read-only on a deployed
server and will tell you this.
