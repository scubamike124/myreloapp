#!/bin/bash
# Disk guard: keep free space above the 3 GB floor by removing only things that can be rebuilt or re-fetched.
# Never touches: the scratchpad (assets, samples, leads, reports), /home/user/ops, backups, a worktree with
# uncommitted or untracked files, unpushed commits, no upstream, recent activity, or one in PROTECT.
# Usage: disk-guard.sh [loop]   (loop = check every 10 min for up to ~2 h; the hourly continuation restarts it)
SOFT_KB=$((3700 * 1024))   # start cleaning below ~3.6 GB, before the 3 GB floor
LOG=/home/user/ops/disk-guard.log
PROTECT="wt-log wt-main wt-amberai"
IDLE_MIN=1440              # a worktree must be untouched for 24 h

free_kb() { df -k --output=avail /home/user | tail -1 | tr -d ' '; }
log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; }

sweep_tmp() {
  # Test suites leak mkdtemp folders (prefix-XXXXXX) into /tmp by the tens of thousands (74k / 8 GB on 10-23).
  # Every pass: remove those older than 6 h. Never the session scratchpad (/tmp/claude-*), never files or locks.
  local n
  n=$(find /tmp -maxdepth 1 -mindepth 1 -type d -mmin +360 -regextype posix-extended \
        -regex '/tmp/[a-z0-9][a-z0-9-]*-[A-Za-z0-9]{6}' ! -name 'claude-*' -print -exec rm -rf {} + 2>/dev/null | wc -l)
  [ "$n" -gt 0 ] && log "swept $n stale test temp dirs from /tmp"
}

clean_once() {
  sweep_tmp
  local f; f=$(free_kb)
  [ "$f" -ge "$SOFT_KB" ] && return 0
  log "free $((f/1024)) MB < $((SOFT_KB/1024)) MB: cleaning"
  # 1. Download caches (re-fetched on demand).
  for d in /root/.cache/pip /root/.cache/uv /root/.npm/_cacache; do
    [ -d "$d" ] && { log "rm cache $d ($(du -sh "$d" | cut -f1))"; rm -rf "$d"; }
  done
  # 2. Test temp dirs older than an hour.
  find /tmp -maxdepth 1 \( -name 'mh-last-pass-*' -o -name 'tsx-*' -o -name 'next-*' \) -mmin +60 -exec rm -rf {} + 2>/dev/null
  # 3. Build caches inside worktrees (.next, node_modules/.cache): rebuilt by the next build.
  for w in /home/user/wt-*; do
    for c in "$w/.next" "$w/node_modules/.cache"; do
      [ -d "$c" ] && [ ! -L "$c" ] && [ -z "$(find "$c" -maxdepth 0 -mmin -60)" ] && { log "rm build cache $c"; rm -rf "$c"; }
    done
  done
  [ "$(free_kb)" -ge "$SOFT_KB" ] && { log "ok after caches: $(( $(free_kb)/1024 )) MB"; return 0; }
  # 4. Idle worktrees that are fully on GitHub (clean, upstream set, nothing ahead), oldest first.
  for w in $(ls -dtr /home/user/wt-* 2>/dev/null); do
    [ "$(free_kb)" -ge "$SOFT_KB" ] && break
    n=$(basename "$w"); case " $PROTECT " in *" $n "*) continue;; esac
    [ -n "$(git -C "$w" status --porcelain 2>/dev/null)" ] && continue
    up=$(git -C "$w" rev-parse --abbrev-ref '@{u}' 2>/dev/null) || continue
    git -C "$w" fetch -q origin "${up#origin/}" 2>/dev/null || continue
    [ "$(git -C "$w" rev-list --count '@{u}..HEAD')" = 0 ] || continue
    [ -n "$(find "$w" -maxdepth 2 -mmin -$IDLE_MIN -not -path '*/.git*' 2>/dev/null | head -1)" ] && continue
    common=$(git -C "$w" rev-parse --git-common-dir) || continue
    log "remove worktree $w ($(du -sh "$w" | cut -f1), branch ${up}, pushed and idle)"
    (cd / && git --git-dir="$common" worktree remove "$w") || log "  could not remove $w"
  done
  f=$(free_kb); log "after cleaning: $((f/1024)) MB free"
  [ "$f" -lt $((3072 * 1024)) ] && log "ALERT still under 3 GB floor: needs a manual look"
}

if [ "$1" = loop ]; then
  exec 9>/tmp/amber-disk-guard.lock; flock -n 9 || { echo "ALREADY RUNNING"; exit 0; }
  for _ in $(seq 1 11); do clean_once; sleep 600; done
else
  clean_once
fi
