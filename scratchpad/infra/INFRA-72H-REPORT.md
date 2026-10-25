# Amber infrastructure report, 72 h to 2026-10-25 ~16:20Z (read-only; nothing changed)

Tags: [V] verified (source given), [I] inferred, [U] unknown.
Repos: production code is scubamike124/amberai (checkout /home/user/work/amberai). /home/user/myreloapp is a different, stale repo. The scratchpad/heap-trace/HEAP-JUMP-ANALYSIS.md and scratchpad/overnight-*.md files were NOT found in any checkout I could read [U].

## 1. Timeline
| Time (Z) | Event | Evidence | Cause class |
|---|---|---|---|
| 10-22 ~03:20, 04:05, 08:38 | Dev-container restarts (3) | overnight-log branch docs/overnight/2026-10-22.md l.43,61,87 | platform/container, reason not recorded |
| 10-22 ~05:00 and "~hourly" | More container restarts | same file l.195,205 | same |
| 10-22 17:25 | "Railway recovered" after platform outage (outage banner noted 10-23 ~18:5x in QUEUE.md l.188) | overnight-log QUEUE.md / 2026-10-22.md l.112 | Railway platform [V as logged by workers] |
| 10-22 ~20:30 to 10-25 04:49 | ~45 amber-hq-web deploys; each = SIGTERM of the previous process | GitHub commit statuses "amber-hq - amber-hq-web" per main commit (e.g. 83ccfa5 20:30:45, 7de58b6a 01:19:29 on 10-23, ... a29637ed 04:49:28 on 10-25) | DELIBERATE (deploy) |
| 10-23 13:56, 15:24, 16:28, 17:16 | web statuses error/failure on 07fd113e, feb3be85, 74286945, 43632016 | statuses, each stamped within seconds of a newer commit's success | superseded by newer deploy [I]; not crashes |
| 10-25 04:49:28 | web deploy a29637ed | status | deploy |
| 10-25 13:39:15 | web deploy e25469d6 (#1046 cached snapshot) | status | deploy |
| 10-25 14:01:49 | web deploy 2d7f216f (#1047 chunked save) | status | deploy |
| ~14:50 | Dev-container restart (coordinator saw "up 2 min" 14:52Z) | coordinator report; cannot be re-read from this boot [U] | platform [I] |
| 10-25 14:58:55 | web deploy 90f421c8; new process started ~14:58:50 | status; prev process lifetime 3900 s ends 16:03:48 | deploy |
| 15:26:20 | Dev-container boot (PID 1 start 15:26:20, uptime 52 min at 16:18:21) | `ps -p 1`, /proc/uptime 3121 s | platform [I] |
| 10-25 16:03:48 | Prod process ended "signal SIGTERM", up 3900 s, RSS 1186 MB, heap 815 MB | /api/health/public vitals.previousProcess | deploy SIGTERM (web success status 76844cfc at 16:04:09Z; new startedAt 16:04:03.858Z) |
| 16:04:03 | Current web process (76844cfc) starts | health version.startedAt | deploy |

Web commits 402355b6, 64d32654, b64dd23a (and several on 10-23) never got a web "success": Railway superseded them with the next push [V statuses show only "pending"].

## 2. Findings ranked by evidence strength
1. [V] The most recent production restart was a deploy SIGTERM, not an OOM. Exit recorder wrote "signal SIGTERM" (a hard OOM kill leaves "no exit record", per src/lib/ops/exit-recorder.ts header), and the end time precedes the 76844cfc web success by 21 s. The 1186 MB RSS was a normal level, not a kill.
2. [V] Prod restarts in this window are dominated by deploys: ~45 web deploys in ~66 h (one every ~1.5 h), 8 today alone (04:49, 13:39, 14:01, 14:58, 16:04 successes; superseded ones skipped). Every SIGTERM is a restart and every deploy is also followed by a worker redeploy.
3. [V] Memory is high but is not currently killing the process. Samples (health): uptime 865 s RSS 1169/heap 787; 881 s 1222/936; 938 s 688/514; 1012 s 779/559. Phase marks show RSS 1146-1154 MB, heap 975-995 MB at 16:07:56 (report phase, ~230 s after boot), peak 1168 MB. Node is started with --max-old-space-size=${WEB_MAX_OLD_SPACE_MB:-1280} (Dockerfile l.138,200), so heap 995 MB is ~78% of the V8 cap. The previous process held 815 MB heap at 3900 s. RSS swings 1.2 GB to 0.7 GB within a minute, so there is a transient report-time spike, not a monotonic leak [I from 4 samples; sample span was only ~2.5 min, not 10].
4. [V] Self-restart: I found NO heap-cycle / "production heap cycle" restart code in main (grep for heap cycle/recycle/RSS-restart found nothing relevant in src/scripts). Only observation exists (loop-lag.ts HEAVY_HEAP_MB=700). The only process.exit sites are scripts. So no intentional memory self-restarts are verified [V absence in main; the branch/PR with it, if any, was not found [U]].
5. [V] Railway config: railway.json healthcheckPath /api/health/public, timeout 300 s, restartPolicy ON_FAILURE max 10 retries. A crash is auto-restarted up to 10 times; a Railway container memory limit is NOT in the repo [U].
6. [V] Dev container (not production): Firecracker VM, PID 1 started 15:26:20Z, 16 GB RAM, no swap, now 8.1 GB free. dmesg (this boot) has boot lines only, no OOM or ENOSPC; journalctl: no journal files. Disk: /dev/vda reports 252 G total, 38-39 G used, yet only 1.5 G free at 16:18 and 84 M free (100%) minutes later; inodes 5% used. Used and free do not reconcile with size (host-side quota/thin volume) [I]. /tmp is 14 GB in 6,483 entries (kdp-pub 1194, kdp-pipe 950, kdp-draft 598, kdp-check 492, kdp-pkg 401, desk-run 251, acp-census 245); this exceeds the 3.3 GB quoted earlier. /tmp creation bursts by hour (mtime counts): 04Z 887, 05Z 831, 06Z 1070, 07Z 540, 08Z 347, 12Z 1587, 13Z 411, 15Z 423, 16Z 199; the contents survived restarts (/tmp dir mtime 10-22 17:54 shows the filesystem is persistent).
7. [I] Disk exhaustion as a cause of dev-container restarts: NOT verified. No ENOSPC in /home/user/work/*.log (last modified 02:19-03:17Z), no kernel message, and the VM boot gaps (14:50, 15:26) have no preceding disk-full log I can read. The reviewer's "disk filled mid-run, crashed suite output" is plausible given 84 M free now [V current state], but the crash itself is [U]. A full disk is verified as a current hazard; as a cause of a suite crash it is inferred only. Memory pressure is not supported: no OOM in dmesg, 8 GB free now; load average 9.5/7.0/5.7 (load from concurrent suites/Chromium is high). The overnight log states earlier restarts were "~hourly" with no cause recorded, and QUEUE.md says a heavy-compute lock exists "to avoid OOM restarts" [V stated by operators, not proven].
8. [V] CI is not an infra crash source: today's red Amber CI runs are real test failures (e.g. run 40176396307 failed step "npm run test:amber-earnings") or "Draft: suites not run" (run 40204592587). Earlier (10-22) the log says Actions was "billing-blocked" (2026-10-22.md l.159,205); no billing failure was seen on today's runs. Factory watchdog (read-only) succeeded 04:53 and 11:44Z. The "amber-os-worker Deployment failed" statuses on every older sha appear exactly when the next sha's worker success arrives (e.g. 402355b6 failure 15:47:40 vs 76844cfc worker success 15:47:44): superseded deploys, not crashes [I].
9. [V] Other 502 pattern: exit-recorder.ts header records a 10-04 case of a web restart causing HTTP 502 to the worker; web-probe counts restartsSeen (uptime decreasing between probes). It is the existing mechanism to count restarts; no history file of it was readable from prod.

## 3. Deliberate vs unplanned
Deliberate: all Railway deploys (SIGTERM at deploy), including the 3900 s process. Unplanned and verified in this window: none in production. Unplanned (container, not prod): restarts at ~14:50 and 15:26 on 10-25 and several on 10-22, causes unrecorded.
Publishing: publishHealth.totalFailures 12, last failure 10-19 01:21Z "Could not publish the handoff: update issue 500"; 0 consecutive; unrelated to restarts.

## 4. Unknown and what would settle it
- Whether any prod process in the window died by OOM: only the last previousProcess is exposed. Persist every boot's previousProcess (append to a JSONL on the volume and expose last 20 in health); alert when endedHow starts with "no exit record".
- Railway memory limit and Railway's own restart/OOM events: need the Railway deployment log or metrics (Railway dashboard/API), not available here.
- Cause of the 14:50 and 15:26 container restarts: need host/platform event log; locally record `date`, /proc/uptime, `df`, `free` every minute to /home/user/ops (survives restarts since disk persists) plus a boot-time line with last kernel messages.
- Disk-full to crash correlation: run suites with stderr captured to a file and grep ENOSPC; log free space before/after each suite; the disk guard script (ops/disk-guard.sh) deliberately never touches /tmp, so the 14 GB of kdp-*/desk-run-* leak is not reclaimed (only worktrees and package caches; also threshold 3.6 GB vs observed 0.08 GB).
- Heap trend: need >=30 min of samples; mine covers ~3 min. Chart rss/heap from the 15-second heartbeat file if exposed.

## 5. Recommended fixes (none applied)
1. Batch deploys: ~1.5 h cadence restarts prod each time; merge in groups or add graceful drain.
2. Persist restart history and expose it (above); keep SIGTERM vs "no exit record" distinction.
3. Add /tmp cleanup of kdp-*/desk-run-* older than N hours to the test harnesses (afterAll rm) and to the disk guard (currently forbidden by design); investigate why used (39 G) and size (252 G) disagree with 84 M free.
4. Cap concurrent suites/Chromium on the dev box (load 9.5).
5. Reduce report-phase heap peak (995 MB of a 1280 MB cap) and consider raising WEB_MAX_OLD_SPACE_MB only after the Railway limit is known; the #1046/#1047 fixes did not show a visible drop yet (post-fix RSS still ~1.17-1.22 GB peak) [I].
