#!/usr/bin/env python3
"""Profile the owner's Austin permit sample (transcribed from the report text into a pipe-delimited file).

Prints counts and rates only: no phone number and no personal name is printed. Contractor *company* names are
printed only where a repeat count is the point. Read-only, stdlib, no network.
Run: python3 -I analyze_owner_sample.py owner-sample-2026-10-12.psv
"""
import collections
import csv
import datetime as dt
import re
import statistics
import sys

path = sys.argv[1]
rows = list(csv.DictReader(open(path, encoding="utf-8"), delimiter="|"))
A = [r for r in rows if r["sample"] == "A"]
B = [r for r in rows if r["sample"] == "B"]
print(f"rows: A={len(A)} B={len(B)}")


def d(s):
    return dt.date.fromisoformat(s)


def digits(s):
    return re.sub(r"\D", "", s or "")


def phone_state(s):
    n = digits(s)
    if not n:
        return "absent"
    if len(n) == 10:
        return "valid10"
    return f"odd_length_{len(n)}"


def area(s):
    n = digits(s)
    return n[:3] if len(n) >= 10 else None


# ----------------------------------------------------------------------------------------- sample A
print("\n=== SAMPLE A: commercial building permits with total_job_valuation > $100,000")
dates = [d(r["issued"]) for r in A]
print("issue dates:", min(dates), "to", max(dates), "| span days:", (max(dates) - min(dates)).days)
masters = collections.Counter(r["master"] for r in A)
print("distinct permit numbers:", len({r['permit'] for r in A}), "| distinct address strings:", len({r['site'] for r in A}), "| distinct master ids:", len(masters))
top = masters.most_common(3)
print("largest master id share of rows:", f"{top[0][1]}/{len(A)} = {top[0][1]/len(A):.0%}", "| next two:", [c for _, c in top[1:]])
print("work classes:", dict(collections.Counter(r["work"] for r in A)), "| statuses:", dict(collections.Counter(r["status"] for r in A)))

vals = {r["permit"]: float(r["value"]) for r in A}
exact1m = [p for p, v in vals.items() if v == 1_000_000]
print(f"rows whose valuation is exactly $1,000,000: {len(exact1m)}/{len(A)}")
small = re.compile(r"trash|carport|(?<!parking )garage|dumpster|retaining wall", re.I)
small_rows = [r for r in A if small.search(r["scope"])]
print(f"rows describing a small site structure (trash enclosure, carport, detached garage, dumpster enclosure, retaining wall; real parking garages excluded): {len(small_rows)}/{len(A)}; of those valued at least $1,000,000: {sum(1 for r in small_rows if float(r['value'])>=1_000_000)}")
by_master = collections.defaultdict(list)
for r in A:
    by_master[r["master"]].append(float(r["value"]))
raw_sum = sum(vals.values())
master_sum = sum(max(v) for v in by_master.values())
print(f"sum of valuations if every row is counted: ${raw_sum:,.0f} | counting each master-ID group once (its largest value): ${master_sum:,.0f} | overstatement factor: {raw_sum/master_sum:.2f}x")
same_value_pairs = sum(1 for m, v in by_master.items() if len(v) > 1 and len(set(v)) == 1)
print(f"master ids with 2+ permits that all carry an identical valuation: {same_value_pairs}/{sum(1 for v in by_master.values() if len(v)>1)}")
print("master-level valuation (one value per master, sorted):", sorted((int(max(v)) for v in by_master.values())))
mv = [max(v) for v in by_master.values()]
print(f"master-level median ${statistics.median(mv):,.0f}; at least $1M: {sum(1 for v in mv if v>=1_000_000)}/{len(mv)}")

# Master-ID groups by ISO week of first issue. A master id is the City's administrative grouping of related permits, NOT a count of independent projects
# (in the trade sample one four-floor remodel carries four master ids). The sample is the 50 most recent permits that pass a filter, so the cap sets the window and
# may cut off its first day; one window under one filter cannot establish a weekly volume, so no weekly rate is computed or claimed.
first = {}
for r in A:
    first[r["master"]] = min(first.get(r["master"], d(r["issued"])), d(r["issued"]))
wk = collections.Counter(f"{x.isocalendar()[0]}-W{x.isocalendar()[1]:02d}" for x in first.values())
print("master-ID groups by ISO week of first issue (first week cut by the 50-row cap; not a weekly rate):", dict(sorted(wk.items())))
earliest = min(dates)
print(f"master-ID groups first issued after the earliest date ({earliest}, the day the cap may cut off): {sum(1 for x in first.values() if x > earliest)} of {len(first)}")
print("no weekly rate is computed: one capped window, one filter, and 64% of commercial permits carry no valuation, so the filter cannot see them")

# contacts
st = collections.Counter(phone_state(r["phone"]) for r in A)
print("phone field state (rows):", dict(st))
ac = collections.Counter(area(r["phone"]) for r in A if area(r["phone"]))
local = {"512", "737"}
mfirst = {}
for r in A:
    mfirst.setdefault(r["master"], r)
loc = sum(1 for r in mfirst.values() if area(r["phone"]) in local)
nonloc = sum(1 for r in mfirst.values() if area(r["phone"]) and area(r["phone"]) not in local)
oddm = sum(1 for r in mfirst.values() if phone_state(r["phone"]) != "valid10")
print(f"contractor per master id: local area code (512/737) {loc}, other area code {nonloc}, unusable phone value {oddm} (of {len(mfirst)})")
print("contractor name artefacts (asterisks or run-together words):", sum(1 for r in mfirst.values() if re.search(r"\*|[a-z][A-Z][a-z]+Construction", r["contractor"])))

# scope buckets relevant to an electrical or HVAC distributor
buckets = collections.OrderedDict([
    ("EV charging", r"EV charger|charging station"),
    ("generator or switchboard", r"generator|switch ?board"),
    ("multifamily apartments or shell", r"apartment|multi family|affordable housing"),
    ("office, storage, industrial or club building", r"office|storage|welding|club house"),
    ("restaurant change of use", r"restaurant"),
    ("garage structure", r"parking garage"),
    ("small site structures (enclosures, carports, detached garages, walls)", r"trash|carport|detached garage|dumpster|retaining wall"),
])
bm = collections.defaultdict(set)
for r in A:
    for name, rx in buckets.items():
        if re.search(rx, r["scope"], re.I):
            bm[name].add(r["master"])
            break
    else:
        bm["other"].add(r["master"])
print("master ids by scope bucket (first match wins):", {k: len(v) for k, v in bm.items()})

# ----------------------------------------------------------------------------------------- sample B
print("\n=== SAMPLE B: recent commercial mechanical and electrical permits")
dates = [d(r["issued"]) for r in B]
print("issue dates:", min(dates), "to", max(dates), "| distinct issue days:", len(set(dates)))
kind = collections.Counter()
for r in B:
    t = r["trade"]
    kind[t if t else "missing trade/company/phone"] += 1
print("by recorded contractor trade:", dict(kind))
print("permit type:", dict(collections.Counter(r["permit"].split()[-1] for r in B)), "| statuses:", dict(collections.Counter(r["status"] for r in B)))
sign = [r for r in B if r["work"] == "Wall" or re.search(r"\(sign\)|sign\b|channel letter|elevation", r["scope"], re.I)]
print(f"sign permits (work class Wall or sign wording): {len(sign)}/{len(B)}; of the {sum(1 for r in B if not r['trade'])} rows with no contractor, signs: {sum(1 for r in sign if not r['trade'])}")
nonsign = [r for r in B if r not in sign]
print("non-sign rows:", len(nonsign), "| by work class:", dict(collections.Counter(r["work"] for r in nonsign)))
mech = [r for r in B if r["trade"] == "Mechanical Contractor"]
print("mechanical rows by work class:", dict(collections.Counter(r["work"] for r in mech)))
elec = [r for r in B if r["trade"] == "Electrical Contractor" and r not in sign]
print("electrical non-sign rows:", len(elec), "| by work class:", dict(collections.Counter(r["work"] for r in elec)))
named = [r for r in B if r["contractor"]]
cc = collections.Counter(r["contractor"] for r in named)
print(f"contractor-linked rows {len(named)}; distinct contractor companies {len(cc)}; companies with 2+ permits: {sum(1 for v in cc.values() if v>=2)} (their permit counts: {sorted([v for v in cc.values() if v>=2], reverse=True)})")
nn = collections.Counter(r["contractor"] for r in nonsign if r["contractor"])
print(f"non-sign contractor-linked rows {sum(nn.values())}; distinct companies {len(nn)}")
print("phone field state (rows with a contractor):", dict(collections.Counter(phone_state(r['phone']) for r in named)))
ev = [r for r in B if r["elec_val_remodel"]]
print(f"rows with an electrical_valuation_remodel figure: {len(ev)}/{len(B)} (of the {sum(1 for r in B if r['permit'].endswith('EP') and r['trade'])} electrical rows with a contractor); values >= $100,000: {sum(1 for r in ev if float(r['elec_val_remodel'])>=100000)}")
evs = [(r["site"], float(r["elec_val_remodel"])) for r in ev if r["site"].startswith("6433 CHAMPION")]
print("same electrical_valuation_remodel repeated on sibling permits at one address:", len(evs), "permits at", sorted({v for _, v in evs}))
print("rows with a master id:", sum(1 for r in B if r["master"]), "| without:", sum(1 for r in B if not r["master"]))
addr = collections.Counter(r["site"] for r in B)
print("addresses with 2+ trade permits:", sum(1 for v in addr.values() if v >= 2), "| rows involved:", sum(v for v in addr.values() if v >= 2))

# ----------------------------------------------------------------------------------------- join
print("\n=== JOIN")
ma = {r["master"] for r in A}
mb = {r["master"] for r in B if r["master"]}
print("master ids shared between sample A and sample B:", len(ma & mb))
print("the owner's report found 1 linked electrical record, by the rule trade.masterpermitnum == building.project_id; that record was issued 2026-04-21, five months BEFORE its building permit (2026-10-01)")

# ----------------------------------------------------------------------------------------- report cross-check
print("\n=== CROSS-CHECK against the report's stated figures")
claims = [
    ("A rows", 50, len(A)), ("A distinct address strings", 48, len({r['site'] for r in A})), ("A distinct master ids", 13, len(masters)),
    ("A New", 46, sum(1 for r in A if r['work']=='New')), ("A Shell", 2, sum(1 for r in A if r['work']=='Shell')),
    ("A Addition and Remodel", 2, sum(1 for r in A if r['work']=='Addition and Remodel')),
    ("B mechanical", 15, len(mech)), ("B electrical", 23, sum(1 for r in B if r['trade']=='Electrical Contractor')),
    ("B missing contractor", 12, sum(1 for r in B if not r['trade'])), ("B with master id", 39, sum(1 for r in B if r['master'])),
    ("B Final status", 2, sum(1 for r in B if r['status']=='Final')),
    ("A issue-date range start", "2026-09-15", str(min(d(r['issued']) for r in A))), ("A issue-date range end", "2026-10-11", str(max(d(r['issued']) for r in A))),
]
bad = 0
for name, want, got in claims:
    ok = want == got
    bad += (not ok)
    print(f"  {'OK ' if ok else 'DIFF'} {name}: report {want} | recomputed {got}")
print("cross-check differences:", bad)
print("population counts quoted by the report (not recomputable here): 345 commercial BP issued 2026-09-12..10-12; valuation present 124 (%.1f%%), company 316 (%.1f%%), phone 344 (%.1f%%)" % (124/345*100, 316/345*100, 344/345*100))
