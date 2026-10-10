"""Builds SPRINT-TEN-OFFERS-2026-10-10/RESULTS.md from: the registry and demo QA (offers.json, dumped from the code), the
research summary (evidence-summary.json), the worker's live buyer-evidence check and the offer tracker (both read from #105),
and the pilot runner's importer list.

usage (from this folder, with `gh` signed in to read amberai #105):
  python3 -I gen-results.py ../RESULTS.md --importers <slug,slug,...> --items <amberai checkout>/src/lib/offers/evidence-items.ts

data/offers.json is the registry and demo QA dumped from the amberai code (dump-offers.ts); data/evidence-summary.json is the
research summary written from the two buyer-evidence files in ../evidence/. --items is needed only when the ranking ties
across second place (the tie-break reads each item's kind)."""
import json, os, re, subprocess, sys, datetime

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
out_path = sys.argv[1]
importers = set()
if "--importers" in sys.argv:
    importers = set(sys.argv[sys.argv.index("--importers") + 1].split(","))
offers = json.load(open(f"{HERE}/offers.json"))
research = json.load(open(f"{HERE}/evidence-summary.json"))

def gh_comments():
    r = subprocess.run(["gh", "api", "--paginate", "repos/scubamike124/amberai/issues/105/comments?per_page=100", "--jq", ".[] | {id, updated_at, body}"], capture_output=True, text=True)
    return [json.loads(l) for l in r.stdout.splitlines() if l.strip()]

comments = gh_comments()
def marked(marker):
    c = [x for x in comments if (x["body"] or "").lstrip().startswith(marker)]
    return c[0] if c else None
ev = marked("<!-- amber-offer-evidence -->")
tr = marked("<!-- amber-offer-tracker -->")

name_to_slug = {o["name"]: o["slug"] for o in offers}
verified = {}
ev_asof = None
if ev:
    m = re.search(r"As of `([^`]+)`", ev["body"]); ev_asof = m.group(1) if m else ev["updated_at"]
    for row in re.findall(r"^\| ([^|]+?) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$", ev["body"], re.M):
        slug = name_to_slug.get(row[0].replace("\\|", "|").strip())
        if slug: verified[slug] = dict(items=int(row[1]), found=int(row[2]), notFound=int(row[3]), blocked=int(row[4]), other=int(row[5]))
items_by_offer = {}
if ev:
    for r in re.findall(r"^\| ([a-z0-9-]+) \| (.*?) \| (https?://\S+?) \| (\*\*([^*]+)\*\*|not checked yet) \| (.*) \|$", ev["body"], re.M):
        items_by_offer.setdefault(r[0], []).append(dict(shows=r[1].replace("\\|", "|"), url=r[2], status=(r[4] or "not checked yet"), detail=re.sub(r"\s*\(\d{4}-\d\d-\d\d \d\d:\d\dZ\)$", "", r[5]).strip()))
track = {}
tr_asof = None
tr_revenue = None
if tr:
    m = re.search(r"As of `([^`]+)`", tr["body"]); tr_asof = m.group(1) if m else tr["updated_at"]
    m = re.search(r"Verified revenue so far: ([^*]+)\.\*\*", tr["body"]); tr_revenue = m.group(1) if m else None
    for row in re.findall(r"^\| \d+ \| \[[^\]]+\]\(https://hq\.amberoneai\.com/offers/([a-z0-9-]+)\) \| (\d+) · (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (\d+) \| (\d+) \| ([^|]+) \|$", tr["body"], re.M):
        track[row[0]] = dict(pageVisits=int(row[1]), sampleVisits=int(row[2]), inquiries=int(row[3]), demoRequests=int(row[4]), pilotInterest=int(row[5]), qualified=int(row[6]), paid=int(row[7]), revenue=row[8].strip(), medianDelivery=row[9].strip(), costs=row[10].strip(), failures=int(row[11]), repeat=int(row[12]), qa=row[13].strip())

# Price fit: the pilot price against what buyers already pay for comparable ONE-OFF work (research "range"). A judgement made
# from the research files before the live check ran; written down here so it can be argued with.
PRICE_FIT = {
    "missed-call-follow-up": ("partial", "buyers pay $29 to $1,725 a month, but for real-time answering; one-off text-back setups sell for $25 to $100"),
    "stale-estimate-follow-up": ("weak", "mostly bundled into $25 to $299 a month software; no standalone paid report found"),
    "job-cost-exceptions": ("inside", "one-time construction bookkeeping cleanups sell for $300 to $1,000"),
    "receipt-invoice-matching": ("weak", "comparable one-off reconciliation sells for $10 to $56 on Fiverr; Hubdoc is free with Xero"),
    "unpaid-invoice-tracking": ("inside", "reminder tools cost $49 to $199 a month; the pilot is $149 for a month of weekly reports"),
    "website-health-report": ("inside", "freelance audits sell for $25 to $600; free scanners cap the low end"),
    "crm-cleanup": ("inside", "Upwork cleanups $25 to $620; review-only audits $250 to $750"),
    "inbox-triage": ("thin", "one-off support audits $160 to $1,100, but only one buyer post was found; drafts are built into helpdesks"),
    "catalog-cleanup": ("inside", "Upwork catalog cleanups $50 to $1,200; buyers mostly pay for ongoing sync"),
    "video-ad-variations": ("inside", "Upwork buyers posted $150 and $225 for 3 to 4 hook variations; edited videos $40 to $200 each"),
}
FIT_RANK = {"inside": 3, "partial": 2, "thin": 1, "weak": 0}
BLOCKERS = {
    "missed-call-follow-up": "Buyers pay for real-time response; this pilot is a reviewed list the owner acts on later.",
    "stale-estimate-follow-up": "Competes with follow-up features already in Jobber and Housecall Pro.",
    "job-cost-exceptions": "Percent complete is rarely in any export; the client must supply it. Read-only.",
    "receipt-invoice-matching": "Reads extracted receipt fields, not images. Read-only.",
    "unpaid-invoice-tracking": "Free built-in reminders exist; the pilot must win on which invoices to chase and how the draft reads.",
    "website-health-report": "The site's own checkout is in Stripe test mode, so Ko-fi is the live payment path.",
    "crm-cleanup": "Contact exports are personal data and need a data-handling agreement first.",
    "inbox-triage": "Customer emails are personal data and need a data-handling agreement; export only, no mailbox access.",
    "catalog-cleanup": "Needs two exports; buyers mostly pay for ongoing sync, not audits.",
    "video-ad-variations": "Needs customer video with usage rights; the pilot cuts and captions only.",
}

def strength(o):
    v = verified.get(o["slug"])
    r = research.get(o["slug"], {})
    prov = r.get("provisional", 1)
    if not v or v["items"] == 0: return 1, prov, 0, "not checked yet"
    half = v["found"] * 2 >= v["items"]
    return (prov if half else 1), prov, v["found"], f"{v['found']} of {v['items']} found"

def signal(o):
    t = track.get(o["slug"], {})
    return (t.get("paid", 0), t.get("qualified", 0), t.get("inquiries", 0))

rows = []
for o in offers:
    eff, prov, found, label = strength(o)
    fit, fit_why = PRICE_FIT[o["slug"]]
    rows.append(dict(o=o, eff=eff, prov=prov, found=found, label=label, fit=fit, fit_why=fit_why, signal=signal(o)))
KEY = lambda r: (r["signal"], r["eff"], r["found"], FIT_RANK[r["fit"]])
ranked = sorted(rows, key=KEY, reverse=True)
pos = []
for i, r in enumerate(ranked):
    pos.append(pos[-1] if i and KEY(r) == KEY(ranked[i - 1]) else i + 1)

# Tie-break data (used only when the declared rule ties across second place): per offer, the verified items that show buyers
# spending money directly (buyers' posted budgets, review counts on paid tools), the verified asking prices, and the verified
# items that came from the original research rather than a replacement. Read from the item list (--items) joined to the report.
tb = {}
items_path = sys.argv[sys.argv.index("--items") + 1] if "--items" in sys.argv else None
if items_path and ev:
    st = {}
    for x in re.findall(r"^\| ([a-z0-9-]+) \| (.*?) \| (https?://\S+?) \| (\*\*([^*]+)\*\*|not checked yet) \| (.*) \|$", ev["body"], re.M):
        st[(x[0], x[2], x[1].replace("\\|", "|"))] = x[4]
    for line in open(items_path, encoding="utf-8").read().splitlines():
        m = re.match(r'\s*\{ id: (".*?"), offer: (".*?"), shows: (".*?"), url: (".*?"), quote: (".*?"), kind: (".*?") \},(\s*// replaces )?', line)
        if not m: continue
        offer, shows, url, kind = (json.loads(m.group(i)) for i in (2, 3, 4, 6))
        t = tb.setdefault(offer, dict(direct=0, prices=0, original=0, matched=0))
        if (offer, url, shows) in st: t["matched"] += 1
        if st.get((offer, url, shows)) != "found": continue
        t["direct"] += kind in ("paid-demand", "review-count")
        t["prices"] += kind == "price"
        t["original"] += not m.group(7)
checked = bool(verified)

now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
L = []
L.append("# Ten pilot offers: results")
L.append("")
L.append(f"Generated {now} from the code (registry and demo QA), the research files, and two reports Amber's worker publishes on #105: the live buyer-evidence check{f' (as of {ev_asof})' if ev_asof else ' (not published yet)'} and the offer tracker{f' (as of {tr_asof})' if tr_asof else ' (not published yet)'}.")
L.append("")
L.append(f"**Revenue: {tr_revenue or '$0.00'}.** Revenue counts only when payment or escrow is verified. No payment was taken during the sprint, and no pilot is a finished production service.")
L.append("")
L.append("## Results table")
L.append("")
L.append("| # | Offer | Test price (hypothesis) | Buyer evidence: research score, live check | Status | Direct cost | Tracker: visits · inquiries · qualified · paid | Blocker |")
L.append("|---|---|---|---|---|---|---|---|")
for r in rows:
    o = r["o"]; t = track.get(o["slug"])
    price = f"${o['price']['usd']} {o['price']['unit']}" + (" (existing price)" if o["price"]["basis"] == "existing-price" else "")
    status = f"Pilot page and sample; sample QA {o['qa']['passed']}/{o['qa']['total']}" + ("; runs on client files" if o["slug"] in importers else "")
    tcell = f"{t['pageVisits'] + t['sampleVisits']} · {t['inquiries']} · {t['qualified']} · {t['paid']}" if t else "not published yet"
    L.append(f"| {o['number']} | {o['name']} | {price} | {r['prov']} if the search results hold; live check: {r['label']} | {status} | $0 (no model or paid API) | {tcell} | {BLOCKERS[o['slug']]} |")
L.append("")
L.append("Research score: the 1 to 5 rubric in the evidence files, given \"if the search results hold up\". The strict score is 1 for every offer, because this session could not open the cited pages. The live check is the worker opening each cited page once, with robots.txt honoured, and looking for the quoted text. Only \"found\" counts as verified.")
L.append("")
ev_fp = re.search(r"Item list `([0-9a-f]{12})`", ev["body"]).group(1) if ev and re.search(r"Item list `([0-9a-f]{12})`", ev["body"]) else None
if ev_fp == "63a671d4fa7a":
    L.append("Replacements: the first two checks (18:22Z and 20:57Z) gave identical counts, with 24 items unverified. Each of those 24 then got one replacement attempt, the same rule for every offer (amberai #792). 23 were replaced, one had no replacement, and every offer kept its number of items. The counts above come from the check of that new list (item list `63a671d4fa7a`). A replacement counts only if its quote was found on its live page.")
    L.append("")
L.append("## Recommendation: the two offers for the next build cycle")
L.append("")
L.append("The rule was written down before the live check ran, and uses buyer evidence only:")
L.append("")
L.append("1. Real buyer behaviour on the tracker comes first: a paid pilot, then a qualified reply, then an inquiry.")
L.append("2. Then the research score, counted at face value only when at least half of the offer's evidence items were found on the live pages. Otherwise the strict score of 1 applies.")
L.append("3. Then the number of items found.")
L.append("4. Then price fit: whether the test price sits inside what buyers already pay for comparable one-off work.")
L.append("")
L.append("| Rank | Offer | Paid · qualified · inquiries | Effective score | Items found | Price fit |")
L.append("|---|---|---|---|---|---|")
for i, r in enumerate(ranked):
    p, q, n = r["signal"]
    L.append(f"| {pos[i]}{'=' if pos.count(pos[i]) > 1 else ''} | {r['o']['name']} | {p} · {q} · {n} | {r['eff']} | {r['label']} | {r['fit']}: {r['fit_why']} |")
L.append("")
top = ranked[:2]
if not checked:
    L.append("**Not decided yet:** the live evidence check has not published, so every offer still has the strict score of 1. The ranking above is a tie broken only by price fit.")
else:
    straddle = len(ranked) > 2 and KEY(ranked[1]) == KEY(ranked[2])
    if not straddle:
        L.append(f"**Recommended: {top[0]['o']['name']} and {top[1]['o']['name']}.** They rank first on the rule above. The ranking will change as soon as a real buyer replies or pays, because the tracker outranks research.")
        L.append("")
    else:
        group = [r for r in ranked if KEY(r) == KEY(ranked[1])]
        above = [r for r in ranked if KEY(r) > KEY(ranked[1])]
        assert tb and all(tb.get(r["o"]["slug"], {}).get("matched") == (verified.get(r["o"]["slug"]) or {}).get("items") for r in group), "tie-break needs --items matching the report"
        tbk = lambda r: (tb[r["o"]["slug"]]["direct"], tb[r["o"]["slug"]]["original"])
        alt = lambda r: (tb[r["o"]["slug"]]["direct"] + tb[r["o"]["slug"]]["prices"], tb[r["o"]["slug"]]["original"])
        picked = above + sorted(group, key=tbk, reverse=True)[: 2 - len(above)]
        alt_picked = above + sorted(group, key=alt, reverse=True)[: 2 - len(above)]
        top = picked
        def names(rs):
            parts = [f"{x['o']['number']} ({x['o']['name']})" for x in rs]
            return parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " and " + parts[-1]
        L.append(f"**Recommended: {top[0]['o']['name']} and {top[1]['o']['name']}.**")
        L.append("")
        L.append(f"The rule above does not pick two offers on its own: offers {names(group)} are level on all four steps. The tie-break below was added after the tie appeared, and it uses buyer evidence only. It ranks first by verified items that show buyers already spending money directly (budgets buyers posted, and review counts on paid tools), then by items from the original research that were verified without a replacement.")
        L.append("")
        L.append("| Offer | Direct spending evidence, verified | Original research items verified | Vendors' asking prices, verified |")
        L.append("|---|---|---|---|")
        for r in sorted(group, key=tbk, reverse=True):
            t = tb[r["o"]["slug"]]
            L.append(f"| {r['o']['number']}. {r['o']['name']} | {t['direct']} | {t['original']} of {verified[r['o']['slug']]['items']} | {t['prices']} |")
        L.append("")
        if [x["o"]["slug"] for x in alt_picked] != [x["o"]["slug"] for x in picked]:
            swapped_in = [x for x in alt_picked if x not in picked]
            L.append(f"Counting vendors' asking prices as spending evidence would pick {names(swapped_in)} instead. An asking price shows what a vendor charges, not that a buyer paid it, so it is not counted here. The evidence separates these offers only weakly; the first real inquiry or reply on the tracker outranks all of it.")
        else:
            L.append("Counting vendors' asking prices as spending evidence would not change the pick. The evidence separates these offers only weakly; the first real inquiry or reply on the tracker outranks all of it.")
        L.append("")
    blocked_heavy = [r for r in rows if (verified.get(r["o"]["slug"]) or {}).get("blocked", 0) * 2 >= max(1, (verified.get(r["o"]["slug"]) or {}).get("items", 0)) and r not in top]
    if blocked_heavy:
        L.append("Not ruled out by evidence against them: " + "; ".join(f"{r['o']['name']} ({verified[r['o']['slug']]['blocked']} of {verified[r['o']['slug']]['items']} cited pages blocked the check)" for r in blocked_heavy) + ". Their evidence leans on marketplace pages that answer automated readers with a bot challenge, so their low verified counts reflect the check's reach. Opening those pages by hand would settle it.")
        L.append("")
    total_inq = sum(t.get("inquiries", 0) for t in track.values())
    L.append(f"What this rests on: the verified items are asking prices, review counts on paid tools, published surveys and buyers' complaints. None of them is a sale of these pilots. Inquiries so far: {total_inq}.")
    if any(r["o"]["slug"] == "website-health-report" for r in top):
        L.append("")
        L.append("Offer 6 already has a live paid path: the $49 Website Snapshot Report on Ko-fi. Its next build cycle is the booking-form check inside that paid report, not a new product.")
L.append("")
L.append("## Per offer: what the live check verified, and the main risk")
L.append("")
L.append("Each line under \"Verified\" is a fact whose quoted text the worker found on the cited page. \"Not verified\" lists the rest with the reason; a bot-challenge page (HTTP 403) was never fetched around. The research summary after them comes from search results and is unverified where its items are.")
L.append("")
for r in rows:
    o = r["o"]; res = research.get(o["slug"], {})
    its = items_by_offer.get(o["slug"], [])
    ok = [i for i in its if i["status"] == "found"]
    no = [i for i in its if i["status"] != "found"]
    L.append(f"### {o['number']}. {o['name']}")
    L.append("")
    if its:
        L.append(f"Verified ({len(ok)} of {len(its)}):")
        L.extend(f"- {i['shows']} ({i['url']})" for i in ok)
        if not ok: L.append("- none")
        L.append("")
        L.append(f"Not verified ({len(no)}):")
        L.extend(f"- {i['shows'].rstrip('.')}: {i['status']}{'; ' + i['detail'] if i['detail'] and i['status'] != 'challenge page' else ''} ({i['url']})" for i in no)
        if not no: L.append("- none")
        L.append("")
    L.append(f"Research summary: {res.get('strongest', '')} Buyers pay: {res.get('range', '')}. Risk: {res.get('risk', '')}")
    L.append("")
open(out_path, "w").write("\n".join(L))
print(f"wrote {out_path}: evidence {'yes' if checked else 'no'}, tracker {'yes' if track else 'no'}, top: {[r['o']['slug'] for r in top]}")
