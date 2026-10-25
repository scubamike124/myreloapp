#!/bin/bash
# Disk guard, fail-closed. It removes only what it can prove is safe, and logs everything it keeps.
#
# Deletes:
#   1. Package-manager download caches (npm, pip, uv). Re-downloaded from registries on demand. Nothing else.
#   2. A worktree under /home/user/wt-* ONLY when ALL of these hold (any doubt = keep):
#      - it is a git worktree, not in PROTECT
#      - no tracked changes, no untracked files and no ignored files at all (git status --ignored is empty)
#      - an upstream is set, and after fetch HEAD equals the upstream (nothing unpushed, nothing ahead or behind)
#      - no stash entries in the repository
#      - no file anywhere in the worktree (including ignored ones) changed in the last IDLE_MIN minutes
# Never touches: /tmp (any pattern), build folders, the scratchpad, /home/user/ops, backups, credentials.
#
# Usage: disk-guard.sh            one pass, logs decisions
#        disk-guard.sh loop       one pass every 10 min (takes a lock; a second copy exits)
SOFT_KB=$((3700 * 1024))   # start cleaning below ~3.6 GB
LOG=${DISK_GUARD_LOG:-/home/user/ops/disk-guard.log}
PROTECT="wt-log wt-main wt-amberai"
IDLE_MIN=1440              # 24 h of no change anywhere in the worktree

free_kb() { df -k --output=avail /home/user | tail -1 | tr -d ' '; }
log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; }

# Returns 0 only with positive proof that the worktree can be deleted. On any other outcome it prints a reason and returns 1.
worktree_removable() {
  local w=$1 n up common
  n=$(basename "$w"); case " $PROTECT " in *" $n "*) echo "protected"; return 1;; esac
  git -C "$w" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "not a git worktree"; return 1; }
  [ -z "$(git -C "$w" status --porcelain --ignored 2>/dev/null)" ] || { echo "has changed, untracked or ignored files"; return 1; }
  up=$(git -C "$w" rev-parse --abbrev-ref '@{u}' 2>/dev/null) || { echo "no upstream"; return 1; }
  git -C "$w" fetch -q origin "${up#origin/}" 2>/dev/null || { echo "fetch failed"; return 1; }
  [ "$(git -C "$w" rev-parse HEAD)" = "$(git -C "$w" rev-parse '@{u}')" ] || { echo "HEAD differs from upstream"; return 1; }
  common=$(git -C "$w" rev-parse --git-common-dir 2>/dev/null) || { echo "no common git dir"; return 1; }
  [ -z "$(git --git-dir="$common" stash list 2>/dev/null)" ] || { echo "repository has stash entries"; return 1; }
  [ -z "$(find "$w" -mmin -"$IDLE_MIN" -print -quit 2>/dev/null)" ] || { echo "changed within $IDLE_MIN minutes"; return 1; }
  return 0
}

clean_once() {
  local f w reason
  f=$(free_kb)
  [ "$f" -ge "$SOFT_KB" ] && return 0
  log "free $((f/1024)) MB < $((SOFT_KB/1024)) MB: cleaning"
  for d in /root/.cache/pip /root/.cache/uv /root/.npm/_cacache; do
    [ -d "$d" ] && [ ! -L "$d" ] && { log "rm package cache $d ($(du -sh "$d" | cut -f1))"; rm -rf -- "$d"; }
  done
  [ "$(free_kb)" -ge "$SOFT_KB" ] && { log "ok after package caches: $(( $(free_kb)/1024 )) MB"; return 0; }
  for w in $(ls -dtr /home/user/wt-* 2>/dev/null); do
    [ "$(free_kb)" -ge "$SOFT_KB" ] && break
    if reason=$(worktree_removable "$w"); then
      common=$(git -C "$w" rev-parse --git-common-dir)
      log "remove worktree $w (proved clean, pushed, idle)"
      (cd / && git --git-dir="$common" worktree remove "$w") || log "  git refused to remove $w"
    else
      log "keep $w: $reason"
    fi
  done
  f=$(free_kb); log "after cleaning: $((f/1024)) MB free"
  [ "$f" -lt $((3072 * 1024)) ] && log "ALERT still under 3 GB floor: needs a manual look"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  if [ "$1" = loop ]; then
    exec 9>/tmp/amber-disk-guard.lock; flock -n 9 || { echo "ALREADY RUNNING"; exit 0; }
    for _ in $(seq 1 11); do clean_once; sleep 600; done
  else
    clean_once
  fi
fi
