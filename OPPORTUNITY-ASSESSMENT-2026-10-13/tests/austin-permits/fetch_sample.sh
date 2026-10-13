#!/usr/bin/env bash
# Pull a small, recent sample of City of Austin "Issued Construction Permits" (Socrata dataset 3syk-w9eu).
# Read-only, unauthenticated: no app token, no account. Run it where data.austintexas.gov is reachable.
# STATUS: not run against the live host by the session that wrote it (the sandbox egress policy denied the
# host). Paging/merge logic was only exercised against a local copy of a third-party 20-row fixture.
# Usage : fetch_sample.sh OUT_DIR [DAYS_BACK=45] [MAX_ROWS=1000]
# Env   : BASE_URL (default the live resource URL), PAGE (rows per request, default 300)
# Then  : python3 -I analyze_permits.py OUT_DIR/all.json --asof "$(date -u +%F)" --window-days 30
set -euo pipefail
OUT="${1:?usage: fetch_sample.sh OUT_DIR [DAYS_BACK] [MAX_ROWS]}"
DAYS="${2:-45}"
MAX="${3:-1000}"
PAGE="${PAGE:-300}"
BASE="${BASE_URL:-https://data.austintexas.gov/resource/3syk-w9eu.json}"
SINCE="$(python3 -I -c 'import datetime as d,sys; print((d.datetime.now(d.timezone.utc)-d.timedelta(days=int(sys.argv[1]))).strftime("%Y-%m-%dT00:00:00"))' "$DAYS")"
mkdir -p "$OUT"
offset=0
while [ "$offset" -lt "$MAX" ]; do
  f="$OUT/page_$(printf %05d "$offset").json"
  curl -sS --fail --retry 2 --max-time 90 -G "$BASE" \
    --data-urlencode "\$where=issue_date >= '${SINCE}'" \
    --data-urlencode "\$order=issue_date DESC, permit_number DESC" \
    --data-urlencode "\$limit=${PAGE}" --data-urlencode "\$offset=${offset}" -o "$f"
  got="$(python3 -I -c 'import json,sys; print(len(json.load(open(sys.argv[1]))))' "$f")"
  echo "offset=$offset rows=$got -> $f"
  offset=$((offset + PAGE))
  if [ "$got" -lt "$PAGE" ]; then break; fi
  sleep 2
done
python3 -I - "$OUT" <<'PY'
import glob, json, sys
rows = []
for f in sorted(glob.glob(sys.argv[1] + "/page_*.json")):
    rows += json.load(open(f))
json.dump(rows, open(sys.argv[1] + "/all.json", "w"))
print("merged", len(rows), "rows ->", sys.argv[1] + "/all.json")
PY
