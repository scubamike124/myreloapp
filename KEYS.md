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

### 3.  — Neon Postgres

- [ ] Get one at **https://neon.tech** — free tier, no card
- Create a project, copy the connection string (starts )

**Unlocks:**
- User accounts (sign up, sign in)
- Token balances and purchase history
- Charging tokens per generation

Without it the app runs exactly as it does now; sign-in pages say accounts
aren't switched on rather than showing a form that cannot work.

---

## Self-generated — nothing to sign up for

| Key | How |
| --- | --- |
| `ADMIN_PASSWORD` | You choose it. `npm run setup` prompts for it. |
| `ADMIN_SESSION_SECRET` | `npm run setup` generates a random one automatically. |

---

## Not needed yet — don't bother

I checked: **no code reads these.** There is no checkout flow, so getting Stripe
or PayPal credentials right now buys you nothing. The vault lists them only so
the slots exist for when billing gets built.

- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

Come back to these when billing is actually implemented.

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
