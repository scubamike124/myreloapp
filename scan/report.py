#!/usr/bin/env python3
"""Build the StudyProofs region-scan report from scan/results/*.jsonl, scan/targets/*.json,
scan/review/verdicts.json (hand review with quotes), scan/review/candidates/*.json (discovery notes)
and scan/review/live.json (publicly verified posts). No network. Python 3.10+, no dependencies.

  python3 -I scan/report.py  ->  STUDYPROOFS-EXPERIMENT-2026-10-11/REGION-SCAN-2026-10-16.md (+ .csv)
"""
import csv, glob, json, re, collections, datetime, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)
DAY = "2026-10-16"
OUT_MD = R("STUDYPROOFS-EXPERIMENT-2026-10-11", f"REGION-SCAN-{DAY}.md")
OUT_CSV = R("STUDYPROOFS-EXPERIMENT-2026-10-11", f"REGION-SCAN-{DAY}.csv")

countries = json.load(open(R("scan/review/countries.json")))
CODE2REGION = {c["code"]: c["region"] for c in countries}
CODE2NAME = {c["code"]: c["name"] for c in countries}
NAME2CODE = {c["name"].lower(): c["code"] for c in countries}
NAME2CODE.update({"the netherlands": "NL", "türkiye": "TR", "turkey": "TR", "czechia": "CZ", "south korea": "KR", "united states": "US", "united kingdom": "GB", "russia": None})
REGIONS = []
for c in countries:
    if c["region"] not in REGIONS: REGIONS.append(c["region"])
EXTRA_REGIONS = ["Global (directories, protocols)", "Fediverse servers outside the 54 countries"]
LANG2CODE = {"sv": "SE", "nl": "NL", "ko": "KR", "ja": "JP", "pl": "PL", "pt": "PT", "es": "ES", "fr": "FR", "de": "DE", "it": "IT", "zh": "TW", "zh-CN": "TW", "zh-TW": "TW", "th": "TH", "vi": "VN", "tr": "TR", "uk": "UA", "he": "IL", "ar": "AE", "fi": "FI", "da": "DK", "no": "NO", "nb": "NO", "cs": "CZ", "hu": "HU", "ro": "RO", "el": "GR", "id": "ID", "ms": "MY", "bn": "BD", "hi": "IN", "ur": "PK", "tl": "PH"}
TLD2CODE = {"pl": "PL", "ca": "CA", "au": "AU", "nz": "NZ", "uk": "GB", "ie": "IE", "se": "SE", "no": "NO", "dk": "DK", "fi": "FI", "de": "DE", "fr": "FR", "nl": "NL", "be": "BE", "ch": "CH", "at": "AT", "es": "ES", "it": "IT", "pt": "PT", "gr": "GR", "cz": "CZ", "hu": "HU", "ro": "RO", "ua": "UA", "tr": "TR", "il": "IL", "ae": "AE", "sa": "SA", "eg": "EG", "ma": "MA", "ng": "NG", "ke": "KE", "gh": "GH", "za": "ZA", "in": "IN", "pk": "PK", "bd": "BD", "jp": "JP", "kr": "KR", "tw": "TW", "hk": "HK", "sg": "SG", "my": "MY", "th": "TH", "id": "ID", "ph": "PH", "vn": "VN", "br": "BR", "mx": "MX", "ar": "AR", "cl": "CL", "co": "CO", "pe": "PE", "us": "US"}

VERDICT_LABEL = {
    "qualified": "Qualified: its own rules allow a free StudyProofs post or listing",
    "open-relay": "Open Nostr relay (NIP-11 policy: no payment, no auth, no write restriction)",
    "conditional": "Allowed with conditions, or free posting shown but the account rules were not fully read",
    "banned": "Its rules prohibit advertising, promotion, commercial accounts or automation",
    "skip-age": "Skipped: asks for a date of birth or sets an age rule at sign-up",
    "skip-phone": "Skipped: phone number or SMS verification",
    "skip-identity": "Skipped: identity, student or third-party login verification",
    "skip-payment": "Skipped: paid listing only",
    "skip-approval": "Skipped: manual moderator, admin or editorial approval",
    "skip-automation": "Skipped: automated posting prohibited",
    "skip-ai": "Skipped: AI accounts or AI-written content prohibited",
    "skip-captcha": "Skipped: CAPTCHA at sign-up or posting (not bypassed)",
    "skip-fit": "Skipped: local business entity required, off-topic or reputational",
    "skip-closed": "Skipped: registrations closed or archive only",
    "blocked": "Not read: bot wall (403/429/5xx) on the runner",
    "unreachable": "Not read: unreachable or not resolving",
    "missing": "Not read: rules page returned 404",
    "unverified": "Read, but no rule about free posting or promotion was found (not counted as qualified)",
    "open-allows": "Open registration and a rule that mentions bots, brands or own-work promotion as allowed (first pass; hand review pending)",
    "signup-email-only": "Sign-up form read: asks for e-mail and password only (no phone, date of birth or CAPTCHA seen)",
    "signup-unclear": "Sign-up form read: fields not readable (JavaScript shell or no form found)",
}
ORDER = list(VERDICT_LABEL)
SKIP_FROM_SUMMARY = {"signup-email-only", "signup-unclear"}

BAN = re.compile(r"(no (advertis|promot|commercial|spam)|advertis\w* (is|are) (not|forbidden|prohibited)|(advertis|promot|commercial)\w*.{0,60}(not allowed|forbidden|prohibited|banned|will be (removed|suspended|deleted|actioned))|keine werbung|werbung.{0,40}(verboten|untersagt|nicht erlaubt)|publicit[ée].{0,40}(interdit|prohib)|pas de pub|publicidad.{0,40}(prohibid|no (está|esta) permitid)|pubblicit[àa].{0,40}(vietat|non (è|e) (consentit|permess))|nessuna pubblicit|vietat.{0,30}pubblicit|reklam\w*.{0,40}(zakaz|niedozwol|zabronion)|zakaz.{0,30}reklam|宣伝.{0,20}禁止|広告.{0,20}禁止|广告.{0,20}(禁止|不允许)|광고.{0,20}(금지|불가)|automated accounts? (are|is) (not|prohibited|forbidden)|bots? (are|is) (not allowed|prohibited|forbidden|banned)|no (automated|bot) accounts)", re.I)

ALLOW = re.compile(r"(bots? (are|is) (allowed|welcome|permitted|ok|fine)|bot accounts? (are|is) (allowed|welcome|permitted)|automated accounts? (are|is) (allowed|welcome|permitted|fine)|(bots|automated accounts)[^.]{0,80}(must|should|need to) (be )?(marked|flagged|labelled|labeled|identif)|(companies|businesses|organi[sz]ations|brands|commercial accounts)[^.]{0,40}(are |is )?(welcome|allowed|permitted)|(advertis|promot)\w*[^.]{0,60}(own work|your own|allowed|permitted|is fine|is ok)|self[- ]promotion (is )?(allowed|welcome|fine|ok)|bots sind (erlaubt|willkommen)|bots? (sont|est) (autoris|bienvenu)|bots? (permitid|bienvenid)|boty (są )?dozwolon|広告.{0,20}(可|OK|許可)|bot.{0,20}(可|OK|許可)|광고.{0,20}허용|봇.{0,20}허용)", re.I)
verdicts = json.load(open(R("scan/review/verdicts.json")))
V_BY_HOST, V_BY_URL = {}, {}
def norm_url(u): return (u or "").strip().rstrip("/").lower()
def host_of(u):
    m = re.match(r"^(?:https?|wss)://([^/]+)", (u or "").strip(), re.I)
    return m.group(1).lower() if m else ""
for v in verdicts:
    m = v["match"]
    if "://" in m: V_BY_URL[norm_url(m)] = v
    else: V_BY_HOST[m.lower()] = v

# discovery notes (agents' candidate files) by host and by rules url
notes_by_url, notes_by_host = {}, {}
for f in sorted(glob.glob(R("scan/review/candidates/group-*.json"))):
    for c in json.load(open(f)):
        for u in (c.get("rules_url"), c.get("url"), c.get("rules_url_alt")):
            if u: notes_by_url.setdefault(norm_url(u), c)
        h = host_of(c.get("url") or c.get("rules_url"))
        if h: notes_by_host.setdefault(h, c)

targets = {}
for f in sorted(glob.glob(R("scan/targets/*.json"))):
    for t in json.load(open(f)): targets[t["id"]] = t

rows = []
for f in sorted(glob.glob(R("scan/results/*.jsonl"))):
    batch = os.path.basename(f).replace(".jsonl", "")
    for line in open(f):
        line = line.strip()
        if not line: continue
        r = json.loads(line)
        if r.get("kind") == "note": continue
        r["_batch"] = batch
        rows.append(r)

def region_for(r, t, code):
    if code and code in CODE2REGION: return CODE2REGION[code], code
    reg = (t or {}).get("region") or r.get("region")
    if reg in REGIONS: return reg, code
    if reg in ("Global", "global", "Global (directories, protocols)"): return EXTRA_REGIONS[0], "GLOBAL"
    return EXTRA_REGIONS[1], code

def country_code_for(r, t):
    c = (t or {}).get("country") or r.get("country")
    if c and c != "GLOBAL": return c
    if c == "GLOBAL": return "GLOBAL"
    loc = r.get("location")
    if loc:
        if loc in CODE2REGION: return loc
        if loc.lower() in NAME2CODE and NAME2CODE[loc.lower()]: return NAME2CODE[loc.lower()]
    res = r.get("result") or {}
    for lang in (res.get("languages") or []):
        if lang in LANG2CODE: return LANG2CODE[lang]
    tld = host_of(r.get("url")).rsplit(".", 1)[-1]
    if r.get("region") == "fediverse" and tld in TLD2CODE: return TLD2CODE[tld]
    return None

def auto_verdict(r):
    k, res = r.get("kind"), (r.get("result") or {})
    if not res.get("reachable"): return "unreachable", "", ""
    b = res.get("bans") or {}
    if k == "html":
        st = res.get("status")
        if st == 404: return "missing", "", ""
        if st in (401, 403, 406, 429, 503, 526, 530): return "blocked", "", f"HTTP {st}"
        if b.get("blocked"): return "banned", b.get("quote") or "", b.get("why") or ""
        return "unverified", "", ""
    if k == "mastodon":
        reg = res.get("registrations") or {}
        rules = res.get("rules") or []
        if not reg.get("enabled"): return "skip-closed", "", ""
        if reg.get("approval_required"): return "skip-approval", "", "sign-ups need the admins' approval"
        if reg.get("min_age"): return "skip-age", f"(registration API: min_age {reg.get('min_age')})", ""
        for s in rules:
            if BAN.search(s): return "banned", s[:300], ""
        if b.get("blocked"): return "banned", b.get("quote") or "", b.get("why") or ""
        for s in rules + [res.get("description") or ""]:
            if ALLOW.search(s): return "open-allows", s[:300], "open registration; a rule speaks of bots, brands or promotion as allowed"
        return "unverified", "", "open registration; no rule about promotion found; not individually reviewed"
    if k == "lemmy":
        mode = res.get("registration_mode")
        if mode == "Closed": return "skip-closed", "", ""
        if mode == "RequireApplication": return "skip-approval", "", "application question at sign-up"
        if res.get("captcha"): return "skip-captcha", "", ""
        if b.get("blocked"): return "banned", b.get("quote") or "", ""
        return "unverified", "", "open Lemmy instance; no rule about promotion found"
    if k == "misskey":
        if res.get("disableRegistration"): return "skip-closed", "", ""
        cap = res.get("captcha") or {}
        if any(cap.values()): return "skip-captcha", "", ""
        if b.get("blocked"): return "banned", b.get("quote") or "", ""
        return "unverified", "", "open Misskey instance; rules on a JavaScript page; no Misskey publisher built"
    if k == "pixelfed":
        if not res.get("openRegistrations"): return "skip-closed", "", ""
        return "unverified", "", "open, but Pixelfed signs up through its web form only (no API)"
    if k == "peertube":
        s = res.get("signup") or {}
        if not s.get("allowed"): return "skip-closed", "", ""
        if s.get("requiresApproval"): return "skip-approval", "", ""
        if res.get("videoQuota") == 0: return "skip-fit", "", "no upload quota"
        if b.get("blocked"): return "banned", b.get("quote") or "", b.get("why") or ""
        return "unverified", "", "open sign-up; terms carry no statement about promotion; not individually reviewed"
    if k == "signup":
        if res.get("blocked"): return "blocked", "", f"HTTP {res.get('status')}"
        cap = res.get("captcha") or {}
        if any(cap.values()): return "skip-captcha", "", "CAPTCHA on the sign-up form (" + ", ".join(k2 for k2, v in cap.items() if v) + ")"
        if res.get("phone"): return "skip-phone", "", "phone field on the sign-up form"
        if res.get("dob"): return "skip-age", "", "date-of-birth field on the sign-up form"
        oauth = res.get("oauth") or {}
        if not res.get("formFound") and any(oauth.values()): return "skip-identity", "", "sign-up only through " + ", ".join(k2 for k2, v in oauth.items() if v)
        if res.get("formFound") and res.get("email"): return "signup-email-only", "", "fields: " + ", ".join(f"{i.get('type')}:{i.get('name') or i.get('placeholder') or '?'}" for i in (res.get("inputs") or [])[:8])
        return "signup-unclear", "", "no readable form" + (" (JavaScript shell)" if res.get("jsOnly") else "")
    if k == "nostr":
        if res.get("payments_required") or res.get("fees"): return "skip-payment", "", "paid relay"
        if res.get("auth_required"): return "skip-identity", "", "auth required"
        if res.get("restricted_writes"): return "skip-fit", "", "restricted writes"
        return "open-relay", "", ""
    return "unverified", "", ""

out = {}
for r in rows:
    t = targets.get(r.get("id")) or {}
    url = r.get("url") or ""
    h = host_of(url)
    key = h if r.get("kind") != "html" else norm_url(url)
    v, quote, note = auto_verdict(r)
    man = V_BY_URL.get(norm_url(url)) if r.get("kind") == "html" else V_BY_HOST.get(h)
    if not man and r.get("kind") == "html": man = V_BY_HOST.get(h) if V_BY_HOST.get(h) and V_BY_HOST[h]["match"] == h and False else None
    basis = ""
    can_act = ""
    free_option = t.get("free_option") or ""
    audience = t.get("audience") or ""
    account = ""; automation = ""
    n = notes_by_url.get(norm_url(url)) or (notes_by_host.get(h) if r.get("kind") != "html" or t.get("category") else None)
    if n:
        free_option = free_option or n.get("free_option") or ""
        audience = audience or n.get("audience") or ""
        account = n.get("account_requirements") or ""
        automation = n.get("automation_note") or ""
    if man:
        v = man["verdict"]; quote = man.get("quote") or quote; note = man.get("note") or note
        basis = man.get("basis") or ""; can_act = man.get("can_act") or ""
        free_option = man.get("free_option") or free_option; audience = man.get("audience") or audience
        account = man.get("account") or account; automation = man.get("automation") or automation
    code = country_code_for(r, t)
    region, code = region_for(r, t, code)
    res = r.get("result") or {}
    site = t.get("site") or res.get("title") or r.get("title") or h or url
    if r.get("kind") not in ("html", "signup"): site = f"{h}" + (f" ({res.get('title')})" if res.get("title") and res.get("title") != h else "")
    cat = t.get("category") or {"mastodon": "fediverse", "peertube": "fediverse video", "lemmy": "fediverse forum", "misskey": "fediverse", "pixelfed": "fediverse photos", "nostr": "nostr relay", "signup": "signup-form"}.get(r.get("kind"), "other")
    if r.get("kind") == "signup": key = "signup:" + norm_url(url)
    users = res.get("users") or r.get("users")
    rec = {"region": region, "country": code or "", "site": site, "category": cat, "kind": r.get("kind"), "url": url, "verdict": v, "basis": basis, "quote": quote, "free_option": free_option, "audience": audience, "account": account, "automation": automation, "can_act": can_act, "note": note, "users": users, "status": res.get("status") if r.get("kind") == "html" else ("api" if res.get("reachable") else "down"), "batch": r["_batch"], "at": r.get("at")}
    prev = out.get(key)
    if prev is None or ORDER.index(v) < ORDER.index(prev["verdict"]) or (prev["verdict"] == v and r["_batch"] > prev["batch"]):
        out[key] = rec
recs = list(out.values())
# One row per site for the tables and totals: pages of the same host collapse onto the host's best row (the CSV keeps every page).
best_by_host = {}
for x in recs:
    if x["kind"] == "signup": continue
    hk = host_of(x["url"]).replace("www.", "")
    cur = best_by_host.get(hk)
    if cur is None or ORDER.index(x["verdict"]) < ORDER.index(cur["verdict"]): best_by_host[hk] = x
site_recs = [x for x in recs if x["kind"] == "signup" or best_by_host.get(host_of(x["url"]).replace("www.", "")) is x]

def reg_key(x): return (REGIONS + EXTRA_REGIONS).index(x) if x in REGIONS + EXTRA_REGIONS else 99
recs.sort(key=lambda x: (reg_key(x["region"]), x["country"] or "~", ORDER.index(x["verdict"]), x["site"].lower()))

# ---------- CSV ----------
with open(OUT_CSV, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["region", "country", "site", "category", "url", "verdict", "verdict_label", "basis", "rule_quote", "free_option", "audience", "account_requirements", "automation_permission", "amber_can_act", "note", "users", "http_status", "batch", "read_at"])
    for x in recs:
        w.writerow([x["region"], x["country"], x["site"], x["category"], x["url"], x["verdict"], VERDICT_LABEL[x["verdict"]], x["basis"], x["quote"], x["free_option"], x["audience"], x["account"], x["automation"], x["can_act"], x["note"], x["users"] or "", x["status"], x["batch"], x["at"]])

# ---------- Markdown ----------
live = json.load(open(R("scan/review/live.json")))
by_region = collections.defaultdict(list)
for x in site_recs:
    if x["kind"] != "signup": by_region[x["region"]].append(x)
def count(xs, *vs): return sum(1 for x in xs if x["verdict"] in vs)
SKIPS = [v for v in ORDER if v.startswith("skip-")]
NOTREAD = ["blocked", "unreachable", "missing"]
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%MZ")
md = []
md.append(f"# StudyProofs free-promotion region scan — {DAY}\n")
md.append(f"Built {now} from {len(rows)} read-only probes ({len(recs)} distinct pages and servers, {sum(1 for x in site_recs if x['kind'] != 'signup')} distinct sites) made by GitHub Actions runners during the night of 2026-10-15/16, plus the hand review in `scan/review/verdicts.json`. Regenerate with `python3 -I scan/report.py`. The CSV beside this file carries every row.\n")
md.append("**Standard.** A site counts as **qualified** only when its own current rules or submission page, read tonight, allow a free StudyProofs listing or promotional post and nothing on the page asks for a date of birth, phone number, identity check, CAPTCHA bypass, payment or a manual approval. \"Allowed with conditions\" means the page allows it with a condition (labelled ads, an introduction first, a backlink, a specific language) or shows free posting but the account rules were not fully read. Everything else is listed under the reason it was skipped. Research and account set-ups are not advertisements: only a publicly verified post counts as live.\n")
md.append("The owner's note asked for \"all 36 regions in our existing region list\"; the list in the code (`src/lib/scout-network/country-registry.ts` and `countries.ts` in amberai) has 12 regions and 54 countries, and all 54 are covered below, with a Global row for worldwide directories and protocols and one row for fediverse servers outside the 54.\n")
md.append("## Live posts (publicly verified)\n")
md.append("| Time (UTC) | Platform | Account | Post | Public URL | Verification |\n|---|---|---|---|---|---|")
for p in live: md.append(f"| {p['when']} | {p['platform']} | {p['account']} | {p['post']} | {p['url']} | {p['verified']} |")
md.append(f"\n{len(live)} live post(s). Nothing else was posted tonight; see the \"Amber can act\" column for what is queued.\n")
md.append("## Totals by region\n")
md.append("| Region | Countries | Sites checked | Read | Qualified | Conditional | Open relays | Rules prohibit | Skipped (DOB / phone / identity / payment / approval / automation / AI / CAPTCHA / fit / closed) | Not read (bot wall / unreachable / 404) | Read, unverified |\n|---|---|---|---|---|---|---|---|---|---|---|")
tot = collections.Counter()
for reg in REGIONS + EXTRA_REGIONS:
    xs = by_region.get(reg, [])
    if not xs: continue
    cs = sorted({x["country"] for x in xs if x["country"] and x["country"] != "GLOBAL"})
    read = sum(1 for x in xs if x["verdict"] not in NOTREAD)
    sk = [count(xs, s) for s in SKIPS]
    nr = [count(xs, s) for s in NOTREAD]
    md.append(f"| {reg} | {', '.join(cs) if cs else '—'} | {len(xs)} | {read} | **{count(xs,'qualified')}** | {count(xs,'conditional')} | {count(xs,'open-relay')} | {count(xs,'banned')} | {sum(sk)} ({' / '.join(map(str,sk))}) | {sum(nr)} ({' / '.join(map(str,nr))}) | {count(xs,'unverified')} |")
    for v in ORDER: tot[v] += count(xs, v)
    tot["_all"] += len(xs); tot["_read"] += read
md.append(f"| **All** | 54 | **{tot['_all']}** | {tot['_read']} | **{tot['qualified']}** | {tot['conditional']} | {tot['open-relay']} | {tot['banned']} | {sum(tot[s] for s in SKIPS)} ({' / '.join(str(tot[s]) for s in SKIPS)}) | {sum(tot[s] for s in NOTREAD)} ({' / '.join(str(tot[s]) for s in NOTREAD)}) | {tot['unverified']} |\n")

def table(xs, title, blurb=""):
    md.append(f"## {title}\n")
    if blurb: md.append(blurb + "\n")
    if not xs: md.append("_none_\n"); return
    md.append("| Region | Country | Site | Free option | Audience | Promotion rule (their words) | Account requirements | Automation | Source | Amber can act? |\n|---|---|---|---|---|---|---|---|---|---|")
    for x in xs:
        q = (x["quote"] or "").replace("|", "\\|").replace("\n", " ")
        md.append(f"| {x['region']} | {x['country'] or '—'} | {x['site']} ({x['category']}) | {(x['free_option'] or '—').replace('|','/')} | {(x['audience'] or '—').replace('|','/')} | {q or '—'} | {(x['account'] or '—').replace('|','/')} | {(x['automation'] or '—').replace('|','/')} | {x['url']} | {(x['can_act'] or '—').replace('|','/')} |")
    md.append("")
table([x for x in site_recs if x["verdict"] == "qualified"], "Qualified sites", "Verified from the site's own rules or submission page. `basis` in the CSV says whether the page allows promotion explicitly or simply has no rule against it while prohibiting spam.")
table([x for x in site_recs if x["verdict"] == "conditional"], "Allowed with conditions", "The page allows a free post or listing under a condition, or shows free posting while the sign-up rules were not fully read tonight. None of these was acted on.")
table([x for x in site_recs if x["verdict"] == "open-allows"], "Open servers whose rules speak of bots, brands or promotion as allowed (first pass)", "Found by the scanner's wording match on open-registration servers; each still needs the hand review before it counts as qualified.")
rel = [x for x in site_recs if x["verdict"] == "open-relay"]
md.append("## Open Nostr relays\n")
md.append(f"{len(rel)} relays answered a NIP-11 policy request with no payment, auth or write restriction: " + ", ".join(sorted(host_of(x['url']) for x in rel)) + ". Nostr has no accounts and no site rules; a post needs a keypair and a publisher (secp256k1 signing), which is not built, and the audience is not students. Recorded, not acted.\n")
md.append("## Rules that prohibit advertising, promotion or automation\n")
md.append("| Region | Country | Site | Their words | Source |\n|---|---|---|---|---|")
for x in [x for x in site_recs if x["verdict"] == "banned"]:
    md.append(f"| {x['region']} | {x['country'] or '—'} | {x['site']} | {(x['quote'] or x['note'] or '—').replace('|','/').replace(chr(10),' ')[:260]} | {x['url']} |")
md.append("")
md.append("## Skipped sites and why\n")
md.append("Counts per reason, with the sites named (fediverse servers by host). The CSV has every row with its quote.\n")
for s in SKIPS:
    xs = [x for x in site_recs if x["verdict"] == s]
    if not xs: continue
    names = [f"{x['site'].split(' (')[0]}" + (f" [{x['country']}]" if x['country'] else "") for x in xs]
    shown = names[:60]
    more = f" … and {len(names)-60} more" if len(names) > 60 else ""
    md.append(f"- **{VERDICT_LABEL[s]}** — {len(xs)}: " + "; ".join(shown) + more)
md.append("")
md.append("## Not read tonight\n")
for s in NOTREAD:
    xs = [x for x in site_recs if x["verdict"] == s]
    if not xs: continue
    names = sorted({x['site'].split(' (')[0] for x in xs})
    md.append(f"- **{VERDICT_LABEL[s]}** — {len(xs)}: " + "; ".join(names[:80]) + (f" … and {len(names)-80} more" if len(names) > 80 else ""))
md.append("")
sg = [x for x in recs if x["kind"] == "signup"]
if sg:
    md.append("## Sign-up forms read\n")
    md.append("What each site's own registration form asks for, read without filling anything (a home page was followed to its sign-up link). E-mail-only forms are the ones Amber could use; a phone, date-of-birth or CAPTCHA field is a recorded blocker.\n")
    md.append("| Country | Site | Form | Finding | Page |\n|---|---|---|---|---|")
    for x in sorted(sg, key=lambda x: (ORDER.index(x["verdict"]), x["country"] or "", x["site"])):
        md.append(f"| {x['country'] or '—'} | {x['site']} | {VERDICT_LABEL[x['verdict']].replace('Sign-up form read: ', '')} | {(x['note'] or '').replace('|', '/')[:200]} | {x['url']} |")
    md.append("")
unv = [x for x in site_recs if x["verdict"] == "unverified"]
md.append("## Read, but not qualified\n")
md.append(f"{len(unv)} pages or servers answered, but nothing on them says a free promotional post or listing is allowed (open fediverse servers with no rule about promotion, home pages without the rules, JavaScript-only pages). They stay out of the qualified count on purpose; the CSV lists them.\n")
md.append("## Method and limits\n")
md.append("- Probes ran on GitHub Actions runners (`.github/workflows/sp-region-scan.yml`, `scan/probe.mjs`): Mastodon-family servers through `/api/v2/instance` (registrations, min_age, rules), PeerTube through `/api/v1/config`, Lemmy `/api/v3/site`, Misskey `/api/meta`, Pixelfed nodeinfo, Nostr NIP-11, and plain pages for classifieds, forums and directories with keyword markers (CAPTCHA, phone, date of birth, identity, payment, approval) in nine languages.\n- Candidates came from the fediverse directories (FediDB, JoinPeerTube, Lemmyverse) and from six discovery passes over the 54 countries in local languages; sites behind bot walls could not be read from a runner and are listed as not read rather than guessed.\n- No account was created tonight beyond the PeerTube channel that already exists; Amber's Mastodon registrar (amberai #847) will open the StudyProofs account on the first qualified server in its list when it deploys, and the first post goes out at the next tick (amberai #846).\n- Nothing was paid, no CAPTCHA was bypassed, no birthday, phone number or identity document was supplied, and no one was messaged.\n")
open(OUT_MD, "w").write("\n".join(md))
print(f"rows={len(rows)} sites={len(recs)} ->", OUT_MD)
print({v: tot[v] for v in ORDER})
