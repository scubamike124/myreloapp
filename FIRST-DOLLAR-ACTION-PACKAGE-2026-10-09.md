# First-dollar action package — 2026-10-09 (evening)

Three prospects, found by Amber's outreach lane from public map data and one or two public pages of each site (robots.txt allowed, plain GET, no login, no cookies). Nothing in the lane can send: every email below is sent by you, from your own mail program, or not at all. Amber records "sent" only when you tell it.

Source of each prospect: OpenStreetMap, category pest control / plumber / HVAC, Phoenix area; pages checked: home, about, contact (three at most). Report with all ten: GitHub issue #105, the "Outreach" comment.

## The opener (your wording, 2026-10-09)

Subject: quick website note

```
Hi there, I noticed one small issue on your website that may affect how some people use the site.

Do you want me to send what I saw?

Mike
```

None of Amber's five checks is about phones (they are screen-reader and page-structure checks), so no draft says "from a phone". The code and the kit now carry this wording; the ten drafts already in the queue are refreshed to it on the lane's next run after the deploy.

## 1. Seal Out Scorpions — pest control, Tempe — score 59

- Website: https://sealoutscorpions.com/ (home, /about-us/, /contact-us/ checked)
- Email: **from the map** (OpenStreetMap lists it): support@sealoutscorpions.com
- Seen: on the about page, one image has no text description; one form field has no label

First email: the opener above, to support@sealoutscorpions.com.

If they reply "what did you see?":

```
Subject: Re: quick website note

Thanks. What I saw: on your about page, one image has no text description, so it is blank for people who use a screen reader. It is a small fix: add a short description to the image.

That was a quick first-pass look at one or two public pages, not a full audit, and nothing on your site has been changed.

I check small-business sites for this kind of thing. If it is useful, I can look at up to five of your pages and send you a short report with a fix list. No obligation either way.

Mike
```

## 2. All Vee's Plumbing Services — plumber, Phoenix — score 59

- Website: https://allveesplumbing.com/ (home, /about/, /contact/ checked)
- Email: **from the map**: cody@allveesplumbing.com
- Seen: on the home page, one image has no text description; four form fields have no label

First email: the opener above, to cody@allveesplumbing.com.

If they reply "what did you see?":

```
Subject: Re: quick website note

Thanks. What I saw: on your home page, one image has no text description, so it is blank for people who use a screen reader. It is a small fix: add a short description to the image.

That was a quick first-pass look at one or two public pages, not a full audit, and nothing on your site has been changed.

I check small-business sites for this kind of thing. If it is useful, I can look at up to five of your pages and send you a short report with a fix list. No obligation either way.

Mike
```

## 3. Any Hour Services (electric, plumbing, heating and air) — HVAC, Phoenix — score 59

- Website: https://anyhourservices.com/arizona/ (/arizona/, /arizona/contact-us/, /arizona/about-us/ checked)
- Email: **from the map**: ahazccr@anyhour.com
- Seen: on the /arizona page, two form fields may have no label; five heading-order issues

First email: the opener above, to ahazccr@anyhour.com.

If they reply "what did you see?":

```
Subject: Re: quick website note

Thanks. What I saw: on your /arizona page, 2 form fields may have no label, so people who use a screen reader may not know what to type. It is a small fix: give each field a visible label.

That was a quick first-pass look at one or two public pages, not a full audit, and nothing on your site has been changed.

I check small-business sites for this kind of thing. If it is useful, I can look at up to five of your pages and send you a short report with a fix list. No obligation either way.

Mike
```

## The $49 price reply (kit section 10, as written)

```
Subject: Re: quick website note

It is $49 for up to five public pages. You get a plain-English report with a fix checklist within two business days of ordering. It is a first-pass automated check that a person reviews before sending, not a full audit, so it finds the common things and tells you what to look at next.

You can order here: https://hq.amberoneai.com/website-snapshot (you pay first, then enter the five page addresses). If not, no problem at all.

Mike
```

**Do not send this reply yet.** The order link answers 404 today: the page is hidden until `WEBSITE_SNAPSHOT_CHECKOUT=true` is set on amber-hq-web (see below). Until one payment path is live, the honest reply is the same text with the order sentence replaced by "I will send you the order link shortly."

## What has to be true for someone to pay $49 today (owner steps)

Two payment paths exist. Either one makes the price reply sendable.

**A. Ko-fi Commission (no code, about 35 minutes on your phone):** the paste package is in KO-FI-PASTE-PACKAGE-2026-10-09.md (title, $49, description, terms, the five buyer fields, notification email, the taps in order). Needs a Ko-fi account connected to your PayPal or Stripe (Ko-fi's own verification). Once the Commission is public, its link replaces the order link in the price reply, and you send Amber the listing URL so it is recorded. Status: package ready; not published; no URL received.

**B. Website Snapshot checkout on hq.amberoneai.com (two variables, your approval):** on amber-hq-web set `WEBSITE_SNAPSHOT_CHECKOUT=true` and `WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true`; the live Stripe key is already in the vault (the API products sell with it). Railway redeploys the web service; the page and the three API routes appear; then one real $49 order from your own card proves the loop before anyone else is told (docs/WEBSITE-SNAPSHOT-LAUNCH.md, "Going live"). Status: code ready and tested; switches off; waiting on your approval of final publish.

Amber does neither: publishing and live payments are owner-only by your standing rule.

## What Amber does after a reply

Forward the reply to listings.owner_outreach@ your inbound domain, or tell Amber "sent <domain>" / "reply <domain>: <summary>". The prospect leaves the list, is never drafted again, and the reply is recorded with its stage. When an order arrives on either path, the report pipeline runs as for any order and you review the PDF before it goes out.

## Website Snapshot checkout readiness (reviewed 2026-10-09 18:50Z, read-only; nothing switched on)

- Code: the offer page (`/website-snapshot`), the sample, terms and thanks pages, and the three API routes (checkout, intake, verify) exist on main; the Website Snapshot test suite passes 210 of 210 on main; the rendered test-mode walkthrough with screenshots was done earlier today.
- Gates, as coded: everything answers 404 until `WEBSITE_SNAPSHOT_CHECKOUT=true` on amber-hq-web. With it on, a live Stripe key (`sk_live_…`) is refused with a clear message unless `WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true` is also set; only a test key creates sessions otherwise. Payment is verified by reading the session back from Stripe, so no webhook secret is needed for the order path.
- The live Stripe key is already in the vault (the API products sell with it). No code change is needed to go live.
- Owner steps to take $49 on the site (docs/WEBSITE-SNAPSHOT-LAUNCH.md, "Going live"): Stripe account verified with bank and tax complete; set `WEBSITE_SNAPSHOT_CHECKOUT=true` and `WEBSITE_SNAPSHOT_LIVE_PAYMENTS=true` on amber-hq-web; one real $49 order from your own card to prove the loop; then record the live checkout with `npm run listing:published -- site https://hq.amberoneai.com/website-snapshot` is not needed, Amber records it under `site_checkout` when you confirm the order went through.
- Amber will not set either variable, publish the page, or take a payment without your explicit approval.
