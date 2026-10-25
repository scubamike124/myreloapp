#!/bin/bash
# Starts the disk guard loop once per container. Safe to run repeatedly: disk-guard.sh takes a lock and exits if already running.
# Called by the SessionStart hook in .claude/settings.json, so a restarted or new session restores it.
cd "$(dirname "$0")" || exit 0
nohup bash ./disk-guard.sh loop >> /tmp/disk-guard-start.out 2>&1 &
exit 0
