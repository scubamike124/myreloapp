#!/usr/bin/env python3
"""Turn a discovery pass's candidate file into runner targets: each rules/home/submit page as an html probe, each fediverse host as an API
probe, and each site's home or sign-up page as a sign-up-form probe (discover=true). Usage: python3 -I scan/build-targets.py <candidates.json> <batch-name> <tag>"""
import json, re, sys
src, batch, tag = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(src)); seen = set(); t = []
def sid(s): return re.sub(r"[^a-z0-9]+", "-", (s or "").lower())[:40]
def add(kind, cc, site, u, cat, label="", extra=None):
    u = (u or "").strip()
    if not u.startswith("http"): return
    k = ("S:" if kind == "signup" else "") + u.rstrip("/").lower()
    if k in seen: return
    seen.add(k)
    x = {"id": f"{'signup' if kind=='signup' else 'fedi' if kind=='mastodon' else 'rules'}{tag}:{cc}:{sid(site)}{':'+label if label else ''}", "kind": kind, "url": u, "country": cc, "site": site + (f" ({label})" if label else ""), "category": cat if kind != "signup" else "signup-form"}
    if kind == "signup": x["discover"] = True
    if kind == "mastodon": x["region"] = "fediverse"
    if extra: x.update(extra)
    t.append(x)
for c in d:
    site = c.get("site") or ""; cc = c.get("country") or "GLOBAL"; typ = (c.get("type") or c.get("category") or "other").lower()
    ex = {"free_option": (c.get("free_option") or "")[:300], "audience": (c.get("audience") or "")[:200]}
    if typ == "fediverse":
        m = re.match(r"https?://([^/]+)", (c.get("url") or c.get("rules_url") or ""))
        if m: add("mastodon", cc, site, f"https://{m.group(1)}", "fediverse", "", ex)
        add("html", cc, site, c.get("rules_url"), "fediverse", "rules page", ex)
        continue
    cat = {"classifieds": "classifieds", "forum": "student-forum", "directory": "directory"}.get(typ, "other")
    for key, label in (("rules_url", "rules page"), ("submit_url", "submit page"), ("url", "home"), ("signup_url", "sign-up page")):
        add("html", cc, site, c.get(key), cat, label, ex)
    add("signup", cc, site, c.get("signup_url") or c.get("url"), cat)
out = f"scan/targets/{batch}.json"; json.dump(t, open(out, "w"), indent=1, ensure_ascii=False)
print(len(d), "candidates ->", len(t), "targets ->", out)
