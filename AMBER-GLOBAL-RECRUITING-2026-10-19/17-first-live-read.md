# 17. The first real read (2026-10-19, 20:13 UTC)

Run with `scripts/recruiting-live-demo.ts` after the owner opened the 12 allowed domains. It reads public pages only. **Nothing was sent, no one was contacted, nothing was stored except a local report file.** The full report (it names real companies) is kept out of the repository.

## What was actually read, live
| Source | Result |
|---|---|
| Remotive jobs API | read, 12 roles |
| Jobicy remote jobs API | read, 50 roles |
| Hacker News "Who is hiring?" thread | read, 153 posts |
| Ashby job boards (15 reads) | read |
| Greenhouse job boards (2 reads) | read |
| Map data (Overpass), 3 servers listed as allowed | **reachable but answered HTTP 503 / 502 on every call (overloaded)**: no staffing business was found; the box-splitting discovery has still never completed a real read |
| Workable | blocked: the site redirects to `apply.workable.com`, which is not on the list |
| Personio | blocked: `*.jobs.personio.de` is not on the list (optional) |

Totals: 1,147 roles seen, **185 employers found**, 526 open roles, 6 US employers with a role open 45 days or more. No format problem was reported by any reader that answered. Format and field checks passed against live answers for the five sources that answered.

## What did not work or is not shown
- **Staffing businesses found: 0** (map servers busy). The agency channel has no real data yet.
- **The business websites could not be opened** (16 domains, none allowed), so no hiring address was found for any business. The note for a real employer was therefore not written, correctly: a note needs a published address.
- The lifecycle simulation (invented firms, simulated owner steps) passed 30 of 30 after one fix: it reads stages from the owner page's first 150 rows, and a real run finds more than 150 employers, so an invented firm fell off the page. The simulation now joins only the best 100 employers to the invented firms. This was a fault in the rehearsal, not in the product.
- The first-note and follow-up shown in the report are written for **invented** firms and are labelled so.

## Still needed from the owner for the next round
1. Add `apply.workable.com` to the allowed domains (the Workable adapter's real host). Optional: `*.jobs.personio.de`, `*.recruitee.com`.
2. For round 2 (reading the best employers' own sites for a published hiring address): the domains listed in the run's `needed-domains.txt` (it names the 10 best employers' sites). Alternatively choose "Full" network access for a supervised run. Each is the owner's call.
3. Try the map servers again later: 503 is the public servers being busy, not a block.
