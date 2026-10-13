#!/usr/bin/env python3
"""Profile an HTML report of Austin permits (tables of permits) WITHOUT printing people's details.

Input : one HTML file (for example Austin-Permit-Sample-2026-10-12.html).
Run   : python3 -I analyze_sample_html.py REPORT.html [--asof 2026-10-13] [--rows-csv OUT.csv] [--json OUT.json]
        python3 -I analyze_sample_html.py --selftest        (runs on a built-in SYNTHETIC page; not data)
Stdlib only, no network. Reads <table> elements (with the nearest preceding heading as the table's label),
falls back to JSON arrays of objects embedded in <script> tags. Columns are matched to canonical fields by
header words, so unfamiliar headers are listed rather than guessed.

What it prints: counts, fill rates, valuation spread, contact coverage (phone/email/licence), duplicate-project
risk, link coverage and hosts, status and date spread, and how trade permits join to building permits.
What it never prints: a phone number, an email address, or a person's name. Row-level output goes only to the
file named by --rows-csv (keep that file out of any repository).
"""
import argparse
import collections
import csv
import datetime as dt
import json
import re
import statistics
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

# ----------------------------------------------------------------------------- HTML -> tables

class TableParser(HTMLParser):
    HEADINGS = {"h1", "h2", "h3", "h4", "h5", "caption"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []          # {"label": str, "rows": [[{"text","links"}]], "header_rows": int}
        self.scripts = []         # raw script texts
        self._stack = []          # open tables
        self._row = None
        self._cell = None
        self._last_heading = ""
        self._heading_buf = None
        self._heading_tag = None
        self._in_script = False
        self._script_buf = []
        self._th_in_row = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.HEADINGS:
            self._heading_buf, self._heading_tag = [], tag
        if tag == "script":
            self._in_script, self._script_buf = True, []
        if tag == "table":
            self._stack.append({"label": self._last_heading, "rows": [], "header_rows": 0})
        elif tag == "tr" and self._stack:
            self._row, self._th_in_row = [], False
        elif tag in ("td", "th") and self._stack and self._row is not None:
            self._cell = {"text": [], "links": []}
            if tag == "th":
                self._th_in_row = True
        elif tag == "a" and self._cell is not None and a.get("href"):
            self._cell["links"].append(a["href"])
        elif tag == "br" and self._cell is not None:
            self._cell["text"].append(" ")

    def handle_endtag(self, tag):
        if tag in self.HEADINGS and self._heading_buf is not None and tag == self._heading_tag:
            text = " ".join("".join(self._heading_buf).split())
            if text:
                self._last_heading = text
            self._heading_buf = None
        if tag == "script" and self._in_script:
            self.scripts.append("".join(self._script_buf))
            self._in_script = False
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._cell["text"] = " ".join("".join(self._cell["text"]).split())
            self._row.append(self._cell)
            self._cell = None
        elif tag == "tr" and self._stack and self._row is not None:
            if self._row:
                t = self._stack[-1]
                t["rows"].append(self._row)
                if self._th_in_row and len(t["rows"]) == t["header_rows"] + 1:
                    t["header_rows"] += 1
            self._row = None
        elif tag == "table" and self._stack:
            self.tables.append(self._stack.pop())

    def handle_data(self, data):
        if self._in_script:
            self._script_buf.append(data)
            return
        if self._heading_buf is not None:
            self._heading_buf.append(data)
        if self._cell is not None:
            self._cell["text"].append(data)


# ----------------------------------------------------------------------------- column mapping

CANON = collections.OrderedDict([
    ("permit_number", ["permitnumber", "permitno", "permitnum", "permit", "permitid"]),
    ("master_permit", ["masterpermit", "masterpermitnum", "master", "parentpermit", "project", "projectid"]),
    ("issued", ["issued", "issuedate", "dateissued", "issuedon", "date"]),
    ("status", ["status", "statuscurrent"]),
    ("valuation", ["valuation", "totaljobvaluation", "jobvalue", "projectvalue", "value", "cost", "estimatedcost"]),
    ("address", ["address", "siteaddress", "originaladdress", "projectaddress", "location", "site"]),
    ("permit_type", ["permittype", "type", "permittypedesc", "permitclass", "class", "workclass", "category", "trade"]),
    ("description", ["description", "scope", "workdescription", "projectdescription", "details"]),
    ("contractor", ["contractor", "contractorcompany", "contractorcompanyname", "company", "applicant", "builder", "contractorname"]),
    ("phone", ["phone", "contractorphone", "telephone", "tel", "phonenumber", "contactphone"]),
    ("email", ["email", "contactemail"]),
    ("license", ["license", "licence", "licensenumber", "contractorlicense"]),
    ("link", ["link", "source", "sourcelink", "url", "permitlink", "sourceurl", "permiturl"]),
])


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def map_columns(headers):
    """Return {canonical: index} and the list of unmatched header texts."""
    mapping, used = {}, set()
    normed = [norm(h) for h in headers]
    for canon, words in CANON.items():
        best = None
        for w in words:                    # exact word first, in priority order
            for i, h in enumerate(normed):
                if i not in used and h == w:
                    best = i
                    break
            if best is not None:
                break
        if best is None:
            for w in words:                # then substring, but only for words of 4+ letters
                if len(w) < 4:
                    continue
                for i, h in enumerate(normed):
                    if i not in used and w in h:
                        best = i
                        break
                if best is not None:
                    break
        if best is not None:
            mapping[canon] = best
            used.add(best)
    unmatched = [headers[i] for i in range(len(headers)) if i not in used]
    return mapping, unmatched


# ----------------------------------------------------------------------------- value parsing

def parse_money(s):
    if s is None:
        return None
    m = re.search(r"\$?\s*([0-9][0-9,]*\.?[0-9]*)\s*([kKmM])?", str(s))
    if not m:
        return None
    try:
        v = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    if m.group(2):
        v *= 1000 if m.group(2) in "kK" else 1_000_000
    return v


def parse_date(s):
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d", "%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            return dt.datetime.strptime(s[:26] if "T" in fmt else s, fmt).date()
        except ValueError:
            continue
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        return dt.date.fromisoformat(m.group(1))
    return None


PHONE_RX = re.compile(r"(?:\+?1[\s.-]*)?\(?([2-9]\d{2})\)?[\s.-]*([2-9]\d{2})[\s.-]*(\d{4})")


def phone_digits(s):
    m = PHONE_RX.search(str(s or ""))
    return (m.group(1) + m.group(2) + m.group(3)) if m else None


def address_stem(a):
    a = (a or "").lower()
    a = re.sub(r"\b(suite|ste|unit|bldg|building|apt|#)\s*[\w-]*", " ", a)
    a = re.sub(r"\b1/2\b", " ", a)
    a = re.sub(r"[^a-z0-9 ]", " ", a)
    return " ".join(a.split())


def stem_of_permit(p):
    m = re.match(r"\s*(\d{4}-\d{5,7})", p or "")
    return m.group(1) if m else None


# ----------------------------------------------------------------------------- analysis

def rows_from_table(t):
    rows = t["rows"]
    if not rows:
        return [], [], []
    hdr_n = t["header_rows"] or 1
    headers = [c["text"] for c in rows[hdr_n - 1]]
    body = rows[hdr_n:]
    return headers, body, rows


def analyze_table(t, asof):
    headers, body, _ = rows_from_table(t)
    mapping, unmatched = map_columns(headers)
    out = {"label": t["label"], "n_rows": len(body), "headers": headers, "mapped": {k: headers[v] for k, v in mapping.items()}, "unmatched_headers": unmatched}
    recs = []
    for r in body:
        rec = {}
        for canon, idx in mapping.items():
            if idx < len(r):
                rec[canon] = r[idx]["text"]
                if canon == "link":
                    rec["_links"] = r[idx]["links"]
        # any link anywhere in the row (source links are often on the permit number)
        rec["_alllinks"] = [l for c in r for l in c["links"]]
        recs.append(rec)

    def fill(field):
        return sum(1 for r in recs if (r.get(field) or "").strip() not in ("", "-", "n/a", "N/A", "null", "None"))

    n = max(len(recs), 1)
    out["fill_rate"] = {f: f"{fill(f)}/{len(recs)}" for f in CANON if f in mapping}
    # valuation
    vals = [parse_money(r.get("valuation")) for r in recs]
    known = [v for v in vals if v and v > 0]
    out["valuation"] = {
        "known_positive": f"{len(known)}/{len(recs)}",
        "missing_or_zero": len(recs) - len(known),
        "min": min(known) if known else None,
        "median": statistics.median(known) if known else None,
        "max": max(known) if known else None,
        "at_least_100k": sum(1 for v in known if v >= 100_000),
    }
    # dates
    ds = [parse_date(r.get("issued")) for r in recs]
    ds_ok = [d for d in ds if d]
    out["dates"] = {
        "parsed": f"{len(ds_ok)}/{len(recs)}",
        "earliest": str(min(ds_ok)) if ds_ok else None,
        "latest": str(max(ds_ok)) if ds_ok else None,
        "span_days": (max(ds_ok) - min(ds_ok)).days if ds_ok else None,
        "age_of_latest_days": (asof - max(ds_ok)).days if ds_ok else None,
    }
    st = collections.Counter((r.get("status") or "").strip().lower() for r in recs if r.get("status"))
    out["status_counts"] = dict(st.most_common(8))
    ty = collections.Counter((r.get("permit_type") or "").strip() for r in recs if r.get("permit_type"))
    out["type_counts"] = dict(ty.most_common(10))
    # contacts (never print values)
    ph = [phone_digits(r.get("phone")) for r in recs]
    ph_ok = [p for p in ph if p]
    em = [r for r in recs if re.search(r"[^@\s]+@[^@\s]+\.[a-z]{2,}", r.get("email") or "")]
    lic = [r for r in recs if (r.get("license") or "").strip() not in ("", "-")]
    cons = [(r.get("contractor") or "").strip().lower() for r in recs if (r.get("contractor") or "").strip() not in ("", "-")]
    cc = collections.Counter(cons)
    out["contacts"] = {
        "contractor_named": f"{len(cons)}/{len(recs)}",
        "distinct_contractors": len(cc),
        "contractors_with_2plus_permits": sum(1 for v in cc.values() if v >= 2),
        "top_contractor_permit_counts": [v for _, v in cc.most_common(5)],
        "phone_present_valid_10_digit": f"{len(ph_ok)}/{len(recs)}",
        "distinct_phone_numbers": len(set(ph_ok)),
        "phone_shared_by_multiple_contractors": sum(1 for v in collections.Counter(ph_ok).values() if v >= 2),
        "email_present": f"{len(em)}/{len(recs)}",
        "license_present": f"{len(lic)}/{len(recs)}",
        "names_with_odd_characters": sum(1 for r in recs if re.search(r"[*]{1,}|\s{2,}|\?", r.get("contractor") or "")),
    }
    # links
    links = [(r.get("_links") or r.get("_alllinks") or []) for r in recs]
    with_link = [l for l in links if l]
    hosts = collections.Counter(urlparse(l[0]).netloc.lower() for l in with_link if l and l[0].startswith("http"))
    out["links"] = {"rows_with_a_link": f"{len(with_link)}/{len(recs)}", "hosts": dict(hosts.most_common(5))}
    # duplicate-project risk
    perm = [r.get("permit_number") or "" for r in recs]
    master = [r.get("master_permit") or "" for r in recs]
    out["duplicates"] = {
        "distinct_permit_numbers": len(set(p for p in perm if p)),
        "rows": len(recs),
        "distinct_master_or_project_ids": len(set(m for m in master if m and m not in ("0", "-"))),
        "rows_with_master_or_project_id": sum(1 for m in master if m and m not in ("0", "-")),
        "distinct_address_stems": len(set(address_stem(r.get("address")) for r in recs if r.get("address"))),
        "permit_number_stems": len(set(stem_of_permit(p) for p in perm if stem_of_permit(p))),
    }
    out["_recs"] = recs
    return out


def join_tables(a, b):
    """How rows in b (trade permits) attach to rows in a (building permits): by master id, permit stem, address stem."""
    def keys(r):
        k = set()
        for fld in ("master_permit", "permit_number"):
            v = (r.get(fld) or "").strip()
            if v and v not in ("0", "-"):
                k.add("id:" + v.lower())
                s = stem_of_permit(v)
                if s:
                    k.add("stem:" + s)
        ad = address_stem(r.get("address"))
        if ad:
            k.add("addr:" + ad)
        return k

    ka = [keys(r) for r in a["_recs"]]
    kb = [keys(r) for r in b["_recs"]]
    b_to_a = sum(1 for k in kb if any(k & x for x in ka))
    a_to_b = sum(1 for x in ka if any(x & k for k in kb))
    by = collections.Counter()
    for k in kb:
        for i, x in enumerate(ka):
            common = k & x
            if common:
                by["+".join(sorted({c.split(":")[0] for c in common}))] += 1
                break
    return {
        "rows_in_second_table_that_attach_to_first": f"{b_to_a}/{len(b['_recs'])}",
        "rows_in_first_table_with_a_match_in_second": f"{a_to_b}/{len(a['_recs'])}",
        "match_basis_counts": dict(by),
    }


def json_arrays_from_scripts(scripts):
    found = []
    for s in scripts:
        for m in re.finditer(r"(\[\s*\{.*?\}\s*\])", s, flags=re.S):
            try:
                arr = json.loads(m.group(1))
            except Exception:
                continue
            if isinstance(arr, list) and arr and isinstance(arr[0], dict) and len(arr) >= 5:
                found.append(arr)
    return found


def table_from_json(arr, label):
    headers = list(arr[0].keys())
    rows = [[{"text": h, "links": []} for h in headers]]
    for o in arr:
        rows.append([{"text": str(o.get(h, "") if o.get(h) is not None else ""), "links": [str(o[h])] if isinstance(o.get(h), str) and str(o[h]).startswith("http") else []} for h in headers])
    return {"label": label, "rows": rows, "header_rows": 1}


def run(html, asof):
    p = TableParser()
    p.feed(html)
    tables = [t for t in p.tables if len(t["rows"]) >= 3]
    if not tables:
        for i, arr in enumerate(json_arrays_from_scripts(p.scripts)):
            tables.append(table_from_json(arr, f"embedded json array {i+1}"))
    return [analyze_table(t, asof) for t in tables]


def print_report(results, asof):
    print(f"as of {asof} | tables with 3+ rows: {len(results)}")
    for i, r in enumerate(results, 1):
        print(f"\n=== table {i}: label={r['label']!r} rows={r['n_rows']}")
        print("headers:", r["headers"])
        print("mapped :", r["mapped"])
        if r["unmatched_headers"]:
            print("UNMATCHED headers (not used):", r["unmatched_headers"])
        for k in ("fill_rate", "valuation", "dates", "status_counts", "type_counts", "contacts", "links", "duplicates"):
            print(f"{k}:", json.dumps(r[k]))
    if len(results) >= 2:
        print("\n=== join: second table -> first table")
        print(json.dumps(join_tables(results[0], results[1])))
        if len(results) > 2:
            print("(only the first two tables are joined)")


SELFTEST_HTML = """<html><body>
<h2>SYNTHETIC TEST INPUT A: commercial building permits (invented rows)</h2>
<table><tr><th>Permit</th><th>Issued</th><th>Address</th><th>Valuation</th><th>Status</th><th>Contractor</th><th>Phone</th><th>Source</th></tr>
<tr><td>2026-000101 BP</td><td>2026-09-14</td><td>100 EXAMPLE ST</td><td>$2,500,000</td><td>Active</td><td>Example Builders LLC</td><td>(512) 555-0101</td><td><a href="https://example.test/p/1">link</a></td></tr>
<tr><td>2026-000102 BP</td><td>2026-09-15</td><td>200 EXAMPLE AVE STE 4</td><td>$150,000</td><td>Active</td><td>Sample Construction Co</td><td>512-555-0102</td><td><a href="https://example.test/p/2">link</a></td></tr>
<tr><td>2026-000103 BP</td><td>2026-09-16</td><td>300 EXAMPLE BLVD</td><td></td><td>Final</td><td>Example Builders LLC</td><td>(512) 555-0101</td><td><a href="https://example.test/p/3">link</a></td></tr>
</table>
<h2>SYNTHETIC TEST INPUT B: mechanical and electrical permits (invented rows)</h2>
<table><tr><th>Permit Number</th><th>Master Permit</th><th>Type</th><th>Issued</th><th>Address</th><th>Contractor</th><th>Contractor Phone</th><th>License</th></tr>
<tr><td>2026-000101 MP</td><td>2026-000101 BP</td><td>Mechanical Permit</td><td>2026-09-20</td><td>100 EXAMPLE ST</td><td>Example HVAC Inc</td><td>(512) 555-0111</td><td>TACLA00001</td></tr>
<tr><td>2026-000101 EP</td><td>2026-000101 BP</td><td>Electrical Permit</td><td>2026-09-21</td><td>100 EXAMPLE ST</td><td>Example Electric LLC</td><td>(512) 555-0112</td><td></td></tr>
<tr><td>2026-000999 EP</td><td></td><td>Electrical Permit</td><td>2026-09-22</td><td>999 NOWHERE RD</td><td>Example Electric LLC</td><td></td><td></td></tr>
</table></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html", nargs="?")
    ap.add_argument("--asof", default=str(dt.date.today()))
    ap.add_argument("--rows-csv")
    ap.add_argument("--json")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    asof = dt.date.fromisoformat(a.asof)
    if a.selftest:
        res = run(SELFTEST_HTML, dt.date(2026, 10, 13))
        print("SELFTEST on a SYNTHETIC page (scaffold check; nothing below is a finding)")
        print_report(res, dt.date(2026, 10, 13))
        t0, t1 = res[0], res[1]
        assert t0["n_rows"] == 3 and t1["n_rows"] == 3
        assert t0["valuation"]["missing_or_zero"] == 1 and t0["valuation"]["at_least_100k"] == 2
        assert t0["contacts"]["phone_present_valid_10_digit"] == "3/3" and t0["contacts"]["distinct_phone_numbers"] == 2
        assert t1["contacts"]["phone_present_valid_10_digit"] == "2/3"
        j = join_tables(res[0], res[1])
        assert j["rows_in_second_table_that_attach_to_first"] == "2/3", j
        assert j["rows_in_first_table_with_a_match_in_second"] == "1/3", j
        print("\nselftest OK")
        return
    if not a.html:
        ap.error("give an HTML file or --selftest")
    html = open(a.html, encoding="utf-8", errors="replace").read()
    res = run(html, asof)
    print_report(res, asof)
    if a.json:
        json.dump([{k: v for k, v in r.items() if k != "_recs"} for r in res], open(a.json, "w"), indent=1)
    if a.rows_csv:
        with open(a.rows_csv, "w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["table", *CANON.keys(), "links"])
            for i, r in enumerate(res, 1):
                for rec in r["_recs"]:
                    w.writerow([i, *[rec.get(k, "") for k in CANON], " ".join(rec.get("_alllinks", []))])
        print("row-level CSV written (contains contact details; keep private):", a.rows_csv)


if __name__ == "__main__":
    main()
