#!/usr/bin/env python3
"""Read-only profile of City of Austin "Issued Construction Permits" rows (Socrata 3syk-w9eu).

Input : one or more JSON files, each a list of objects as returned by
        https://data.austintexas.gov/resource/3syk-w9eu.json
Run   : python3 -I analyze_permits.py DATA.json [DATA2.json ...] [--asof 2026-10-12]
            [--window-days 30] [--min-valuation 100000] [--trade roofing] [--out result.json]
        python3 -I analyze_permits.py --selftest      (logic test on a few hand-made rows; not data)
Stdlib only. No network. Socrata drops keys whose value is null, so a missing key and an
empty string are both "absent".
"""
import argparse
import datetime as dt
import json
import re
import sys
from collections import Counter, defaultdict

RULES = """\
RULES (documented; change by flags or by editing this file)
 R1 absent    : key missing, empty, or 'null'.
 R2 valuation : total_job_valuation > 0 is "known". If absent/zero and the trade-part columns exist
                (building/electrical/mechanical/plumbing/medgas_valuation) their positive sum is used.
 R3 project   : rows are linked when they share (a) a non-zero masterpermitnum, (b) a masterpermitnum equal
                to another row's project_id (trade permit -> parent building permit), (c) the same
                permit-number stem such as '2026-082819' (its BP/EP/MP/PP), or (d) when a row has NO master:
                the same address stem and issue dates within 45 days. Connected rows = ONE project.
                project_id alone is NOT a project key (observed: one id per permit).
 R4 address   : address stem = address with unit/bldg/suite words and '1/2' removed. Address groups that hold
                more than one R3 project are 'needs human review' (separate jobs OR one job with two masters).
 R5 recency   : issue_date within --window-days of --asof.
 R6 status    : status_current in {active, issued}; Final/expired/void/etc. are out.
 R7 trade     : roofing = residential, permittype BP, work_class New/Addition (roof still to be bought),
                total valuation >= --min-valuation, and at least one named builder/applicant.
"""

NULLS = {"", "null", "none", "n/a"}
PHONE_HINT = re.compile(r"phone|fax|mobile", re.I)
EMAIL_HINT = re.compile(r"e_?mail", re.I)
LICENSE_HINT = re.compile(r"licen[sc]e", re.I)
OWNER_HINT = re.compile(r"owner", re.I)
NAME_FIELDS = ["contractor_company_name", "contractor_full_name", "applicant_organization", "applicant_full_name"]
EXPECTED = ["permit_number", "permittype", "permit_class_mapped", "work_class", "status_current", "issue_date",
            "total_job_valuation", "masterpermitnum", "project_id", "original_address1"] + NAME_FIELDS + \
           ["contractor_phone", "applicant_phone"]
VAL_PRIMARY = "total_job_valuation"
VAL_PARTS = ["building_valuation", "electrical_valuation", "mechanical_valuation", "plumbing_valuation",
             "medgas_valuation"]
TRADES = {
    "roofing": dict(types={"BP"}, classes={"residential"}, work={"new", "addition"}),
}


def get(r, k):
    v = r.get(k)
    if isinstance(v, dict):
        v = v.get("url") or v.get("human_address") or json.dumps(v, sort_keys=True)
    if v is None:
        return None
    s = str(v).strip()
    return None if s.lower() in NULLS else s


def num(r, k):
    s = get(r, k)
    if s is None:
        return None
    try:
        return float(re.sub(r"[,$\s]", "", s))
    except ValueError:
        return None


def valuation(r):
    """-> (amount or None, kind) with kind in positive_primary|positive_parts|zero|absent"""
    p = num(r, VAL_PRIMARY)
    if p is not None and p > 0:
        return p, "positive_primary"
    parts = [num(r, k) for k in VAL_PARTS]
    s = sum(x for x in parts if x is not None and x > 0)
    if s > 0:
        return s, "positive_parts"
    if p == 0 or any(x == 0 for x in parts if x is not None):
        return None, "zero"
    return None, "absent"


def pdate(s):
    try:
        return dt.date.fromisoformat(s[:10]) if s else None
    except ValueError:
        return None


def clean_name(s):
    if not s:
        return None
    s = re.sub(r"\*+\s*MAIN\s*\*+", " ", s, flags=re.I)
    s = s.replace("*", " ")
    s = re.sub(r"\s+", " ", s).strip(" ,.-")
    return s or None


def stem(r):
    m = re.match(r"^\s*(\d{4}-\d{5,7})", get(r, "permit_number") or "")
    return m.group(1) if m else None


def addr_stem(r):
    a = (get(r, "original_address1") or get(r, "permit_location") or "").upper()
    a = re.sub(r"\b(BLDG|BUILDING|STE|SUITE|UNIT|APT|FL|FLOOR|RM|ROOM)\b\.?\s*[\w-]+", " ", a)
    a = re.sub(r"#\s*[\w-]+", " ", a)
    a = re.sub(r"(?<=\d)\s+\d/\d\b", " ", a)
    a = re.sub(r"\b(ST|DR|AVE|BLVD|LN|RD|CT|PKWY|HWY|WAY|TRL|CIR|PL)\s+[A-Z]$", r"\1", a)
    a = re.sub(r"[^\w\s]", " ", a)
    return re.sub(r"\s+", " ", a).strip() or None


class UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


def families(rows, near_days=45):
    n = len(rows)
    uf = UF(n)
    by_master, by_pid, by_stem, by_addr = (defaultdict(list) for _ in range(4))
    masters = []
    for i, r in enumerate(rows):
        m = get(r, "masterpermitnum")
        m = None if m in (None, "0") else m
        masters.append(m)
        if m:
            by_master[m].append(i)
        pid = get(r, "project_id")
        if pid:
            by_pid[pid].append(i)
        s = stem(r)
        if s:
            by_stem[s].append(i)
        a = addr_stem(r)
        if a:
            by_addr[a].append(i)
    for grp in list(by_master.values()) + list(by_stem.values()):
        for j in grp[1:]:
            uf.union(grp[0], j)
    for i, m in enumerate(masters):
        if m and m in by_pid:
            for j in by_pid[m]:
                uf.union(i, j)
    for idx in by_addr.values():
        for i in idx:
            if masters[i]:
                continue
            di = pdate(get(rows[i], "issue_date"))
            for j in idx:
                if j != i:
                    dj = pdate(get(rows[j], "issue_date"))
                    if di and dj and abs((di - dj).days) <= near_days:
                        uf.union(i, j)
    comp = defaultdict(list)
    for i in range(n):
        comp[uf.find(i)].append(i)
    return list(comp.values()), by_addr


def analyze(rows, a):
    n = len(rows)
    keys = sorted(set().union(*[r.keys() for r in rows])) if rows else []
    out = {"n_rows": n, "n_distinct_keys": len(keys), "keys": keys,
           "expected_but_absent_in_data": [k for k in EXPECTED if k not in keys]}
    out["counts"] = {k: Counter((get(r, k) or "(absent)") for r in rows).most_common(10)
                     for k in ("permittype", "permit_type_desc", "permit_class_mapped", "work_class",
                               "permit_class", "status_current")}
    asof = dt.date.fromisoformat(a.asof)
    known = [d for d in (pdate(get(r, "issue_date")) for r in rows) if d]
    out["recency"] = {"min": str(min(known)) if known else None, "max": str(max(known)) if known else None,
                      "missing_date": n - len(known), "future_dated": sum(1 for d in known if d > asof),
                      "in_window": sum(1 for d in known if 0 <= (asof - d).days <= a.window_days),
                      "window_days": a.window_days, "asof": a.asof}
    kinds = Counter(valuation(r)[1] for r in rows)
    out["valuation"] = {k: kinds[k] for k in ("positive_primary", "positive_parts", "zero", "absent")}
    out["valuation"]["missing_or_zero"] = kinds["zero"] + kinds["absent"]
    out["valuation"]["primary_not_positive"] = sum(1 for r in rows if not (num(r, VAL_PRIMARY) or 0) > 0)

    fams, by_addr = families(rows)
    fam_of = {i: k for k, f in enumerate(fams) for i in f}
    pids = [get(r, "project_id") for r in rows if get(r, "project_id")]
    masters = [get(r, "masterpermitnum") for r in rows]
    masters = [m for m in masters if m and m != "0"]
    amb = {x: idx for x, idx in by_addr.items() if len({fam_of[i] for i in idx}) > 1}
    out["projects"] = {
        "rows": n, "distinct_project_id": len(set(pids)), "rows_with_master": len(masters),
        "distinct_master": len(set(masters)), "projects_R3": len(fams),
        "multi_permit_projects": sum(1 for f in fams if len(f) > 1),
        "rows_in_multi_permit_projects": sum(len(f) for f in fams if len(f) > 1),
        "mixed_trade_projects": sum(1 for f in fams if len({(get(rows[i], "permittype") or "?").upper() for i in f}) > 1),
        "distinct_address_stems": len(by_addr) + sum(1 for r in rows if not addr_stem(r)),
        "address_groups_needing_review": len(amb), "rows_in_those_groups": sum(len(v) for v in amb.values()),
    }
    cols = set(keys)
    pc = sorted(c for c in cols if PHONE_HINT.search(c))
    names = {k: sum(1 for r in rows if clean_name(get(r, k))) for k in NAME_FIELDS if k in cols}
    out["contacts"] = {
        "name_fields_present_in_data": names,
        "any_named_party": sum(1 for r in rows if any(clean_name(get(r, k)) for k in NAME_FIELDS)),
        "phone_columns": pc, "email_columns": sorted(c for c in cols if EMAIL_HINT.search(c)),
        "license_columns": sorted(c for c in cols if LICENSE_HINT.search(c)),
        "owner_columns": sorted(c for c in cols if OWNER_HINT.search(c)),
        "rows_with_any_phone": sum(1 for r in rows if any(get(r, c) for c in pc)),
        "builder_names_with_artifacts": sum(1 for r in rows for k in NAME_FIELDS
                                            if get(r, k) and ("*" in get(r, k) or "  " in get(r, k))),
    }
    t = TRADES[a.trade]
    steps = [("raw rows", n, len(fams))]
    alive = list(range(n))

    def step(name, pred):
        nonlocal alive
        alive = [i for i in alive if pred(i)]
        steps.append((name, len(alive), len({fam_of[i] for i in alive})))

    def in_window(i):
        d = pdate(get(rows[i], "issue_date"))
        return d is not None and 0 <= (asof - d).days <= a.window_days

    def named(i):
        return any(clean_name(get(rows[i], k)) for k in NAME_FIELDS)

    step("issued in last %d days" % a.window_days, in_window)
    step("status active/issued", lambda i: (get(rows[i], "status_current") or "").lower() in ("active", "issued"))
    step("residential", lambda i: (get(rows[i], "permit_class_mapped") or "").lower() in t["classes"])
    step("BP + work_class " + "/".join(sorted(t["work"])),
         lambda i: (get(rows[i], "permittype") or "").upper() in t["types"]
         and (get(rows[i], "work_class") or "").lower() in t["work"])
    in_scope = list(alive)
    step("valuation >= $%s" % format(int(a.min_valuation), ","), lambda i: (valuation(rows[i])[0] or 0) >= a.min_valuation)
    step("named builder/applicant", named)
    q = list(alive)
    out["funnel"] = {"trade": a.trade, "min_valuation": a.min_valuation, "steps": steps,
                     "qualified_rows": len(q), "qualified_projects": len({fam_of[i] for i in q}),
                     "qualified_projects_per_raw_row": round(len({fam_of[i] for i in q}) / n, 4) if n else None,
                     "qualified_with_phone": sum(1 for i in q if any(get(rows[i], c) for c in pc)),
                     "lost_to_missing_or_zero_valuation": sum(1 for i in in_scope if named(i)
                                                              and (valuation(rows[i])[0] or 0) < a.min_valuation
                                                              and valuation(rows[i])[1] in ("zero", "absent")),
                     "roof_keyword_rows_in_window": sum(1 for i in range(n) if in_window(i)
                                                        and re.search(r"\broof", get(rows[i], "description") or "", re.I))}
    return out


def pct(a, b):
    return "%d/%d (%.0f%%)" % (a, b, 100.0 * a / b) if b else "0/0"


def render(o, paths):
    n = o["n_rows"]
    L = ["AUSTIN ISSUED CONSTRUCTION PERMITS - sample profile", "inputs: " + ", ".join(paths),
         "rows: %d | distinct keys in data: %d | asof %s | window %d days" % (
             n, o["n_distinct_keys"], o["recency"]["asof"], o["recency"]["window_days"])]
    if n < 100:
        L.append("!! SMALL SAMPLE (n<100): shares below are NOT population rates.")
    L += ["", RULES, "-- counts (top 10) --"]
    for k, v in o["counts"].items():
        L.append("  %s: %s" % (k, "; ".join("%s=%d" % x for x in v)))
    r = o["recency"]
    L += ["-- recency --", "  issue_date %s .. %s | in window: %s | missing date %d | future-dated %d" % (
        r["min"], r["max"], pct(r["in_window"], n), r["missing_date"], r["future_dated"])]
    v = o["valuation"]
    L += ["-- valuation --",
          "  positive via total_job_valuation: %s | positive via trade parts: %d | zero: %d | absent: %d" % (
              pct(v["positive_primary"], n), v["positive_parts"], v["zero"], v["absent"]),
          "  MISSING OR ZERO overall: %s | total_job_valuation not positive: %s" % (
              pct(v["missing_or_zero"], n), pct(v["primary_not_positive"], n))]
    p = o["projects"]
    L += ["-- duplicate-project risk --",
          "  rows %d | distinct project_id %d (equal to rows => id is per permit, not per job)" % (n, p["distinct_project_id"]),
          "  rows with masterpermitnum %s | distinct masters %d" % (pct(p["rows_with_master"], n), p["distinct_master"]),
          "  PROJECTS after R3 de-dup: %d  (= %.0f%% of rows; %d rows collapsed)" % (
              p["projects_R3"], 100.0 * p["projects_R3"] / n if n else 0, n - p["projects_R3"]),
          "  multi-permit projects: %d (%d rows) | mixed-trade projects (BP+EP/MP/PP): %d" % (
              p["multi_permit_projects"], p["rows_in_multi_permit_projects"], p["mixed_trade_projects"]),
          "  distinct address stems: %d | address groups holding >1 project (human review): %d (%d rows)" % (
              p["distinct_address_stems"], p["address_groups_needing_review"], p["rows_in_those_groups"])]
    c = o["contacts"]
    L += ["-- contacts --",
          "  name fields present in data / rows with a usable name: %s" % ", ".join(
              "%s=%d" % x for x in c["name_fields_present_in_data"].items()),
          "  any named party: %s | builder names with artefacts (*, double space): %d" % (
              pct(c["any_named_party"], n), c["builder_names_with_artifacts"]),
          "  phone columns in data: %s | rows with any phone: %s" % (c["phone_columns"] or "NONE", pct(c["rows_with_any_phone"], n)),
          "  email columns: %s | licence columns: %s | owner columns: %s" % (
              c["email_columns"] or "NONE", c["license_columns"] or "NONE", c["owner_columns"] or "NONE"),
          "  expected-but-absent keys in this file: %s" % (o["expected_but_absent_in_data"] or "none")]
    f = o["funnel"]
    L.append("-- lead funnel: %s (min valuation $%s) --" % (f["trade"], format(int(f["min_valuation"]), ",")))
    L.append("  %-44s %6s %9s" % ("step", "rows", "projects"))
    for name, rws, prj in f["steps"]:
        L.append("  %-44s %6d %9d" % (name, rws, prj))
    L += ["  QUALIFIED projects per raw row: %d / %d = %s" % (f["qualified_projects"], n, f["qualified_projects_per_raw_row"]),
          "  qualified rows with a phone: %d | lost only to missing/zero valuation: %d | roof-keyword rows in window "
          "(already-contracted roofing work): %d" % (f["qualified_with_phone"], f["lost_to_missing_or_zero_valuation"],
                                                       f["roof_keyword_rows_in_window"])]
    return "\n".join(L)


def load(paths):
    seen, rows, dup = set(), [], 0
    for p in paths:
        with open(p, encoding="utf-8") as fh:
            d = json.load(fh)
        if not isinstance(d, list):
            sys.exit("%s: expected a JSON list of objects" % p)
        for r in d:
            k = json.dumps(r, sort_keys=True)
            if k in seen:
                dup += 1
            else:
                seen.add(k)
                rows.append(r)
    return rows, dup


def selftest():
    def row(num_, typ, cls, work, status, date, **kw):
        d = {"permit_number": num_, "permittype": typ, "permit_class_mapped": cls, "work_class": work,
             "status_current": status, "issue_date": date + "T00:00:00.000"}
        d.update(kw)
        return d
    rows = [
        row("2026-000001 BP", "BP", "Residential", "New", "Active", "2026-10-01", total_job_valuation="300000",
            masterpermitnum="M1", project_id="P1", original_address1="1 MAIN ST",
            contractor_company_name="ACME HOMES  *MAIN**", contractor_phone="5125550100"),
        row("2026-000001 EP", "EP", "Residential", "New", "Active", "2026-10-02", masterpermitnum="P1",
            project_id="P2", original_address1="1 MAIN ST"),
        row("2026-000002 PP", "PP", "Residential", "New", "Active", "2026-10-02", masterpermitnum="M1",
            project_id="P3", original_address1="1 MAIN ST"),
        row("2026-000003 BP", "BP", "Residential", "Addition", "Active", "2026-10-03", total_job_valuation="0",
            project_id="P4", original_address1="2 OAK ST", contractor_company_name="Oak Builders"),
        row("2026-000005 BP", "BP", "Residential", "New", "Active", "2026-10-05", total_job_valuation="120000",
            project_id="P5", original_address1="2 OAK ST #B"),
        row("2026-000004 BP", "BP", "Commercial", "New", "Active", "2026-10-04", total_job_valuation="900000",
            masterpermitnum="M9", project_id="P6", original_address1="3 ELM ST", contractor_company_name="Big GC"),
        row("2026-000006 BP", "BP", "Residential", "New", "Final", "2026-09-01", total_job_valuation="500000",
            masterpermitnum="M2", project_id="P7", original_address1="1 MAIN ST", contractor_company_name="Old Homes"),
    ]
    a = argparse.Namespace(asof="2026-10-12", window_days=30, min_valuation=100000, trade="roofing")
    o = analyze(rows, a)
    p, v, f, c = o["projects"], o["valuation"], o["funnel"], o["contacts"]
    assert p["projects_R3"] == 4, p                       # {A,B,C} {D,F} {E} {G}
    assert p["distinct_address_stems"] == 3, p            # 1 MAIN ST, 2 OAK ST, 3 ELM ST
    assert p["address_groups_needing_review"] == 1, p     # 1 MAIN ST holds two projects
    assert p["mixed_trade_projects"] == 1, p              # BP+EP+PP family
    assert (v["positive_primary"], v["zero"], v["absent"]) == (4, 1, 2), v
    assert [s[1] for s in f["steps"]] == [7, 6, 6, 5, 3, 2, 1], f["steps"]
    assert f["qualified_projects"] == 1 and f["qualified_with_phone"] == 1, f
    assert f["lost_to_missing_or_zero_valuation"] == 1, f
    assert clean_name("ACME HOMES  *MAIN**") == "ACME HOMES" and clean_name("Power Design Inc****MAIN**") == "Power Design Inc"
    assert addr_stem({"original_address1": "4325 1/2 JAMES CASEY ST"}) == "4325 JAMES CASEY ST"
    assert addr_stem({"original_address1": "808 EBERHART LN BLDG 9"}) == "808 EBERHART LN"
    assert c["builder_names_with_artifacts"] == 1, c
    print("selftest OK (logic only; hand-made rows, not data, nothing here is a finding)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*")
    ap.add_argument("--asof", default=dt.date.today().isoformat())
    ap.add_argument("--window-days", type=int, default=30)
    ap.add_argument("--min-valuation", type=float, default=100000)
    ap.add_argument("--trade", default="roofing", choices=sorted(TRADES))
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.files:
        ap.error("give at least one JSON file or --selftest")
    rows, dup = load(a.files)
    o = analyze(rows, a)
    o["exact_duplicate_rows_removed_on_load"] = dup
    print(render(o, a.files))
    if dup:
        print("(exact duplicate rows removed on load: %d)" % dup)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            json.dump(o, fh, indent=1, default=list)


if __name__ == "__main__":
    main()
