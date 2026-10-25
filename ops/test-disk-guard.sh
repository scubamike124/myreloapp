#!/bin/bash
# Tests for disk-guard.sh. Builds disposable repositories in a test folder, never touches /home/user/wt-*.
# Each case states what must happen. Exit 0 only if every case matches.
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d "$HERE/../guard-test-XXXX") || exit 1
export DISK_GUARD_LOG="$T/guard.log"
. "$HERE/disk-guard.sh"          # sourcing does not run a pass
fail=0

origin="$T/origin.git"
git init -q --bare "$origin"
seed="$T/seed"; git init -q "$seed"
(cd "$seed" && printf 'x\n' > a.txt && printf '.env\nnode_modules/\n' > .gitignore && git add . && git -c user.name=t -c user.email=t@t commit -q -m init && git branch -M main && git remote add origin "$origin" && git push -q -u origin main)

# make_wt NAME: creates worktree NAME on a branch NAME, pushed with upstream, idle (old mtimes)
make_wt() {
  local name=$1 wt="$T/wt-$1"
  git -C "$seed" worktree add -q -b "$name" "$wt" main 2>/dev/null || git -C "$seed" worktree add -q -b "$name$RANDOM" "$wt" main
  git -C "$wt" -c user.name=t -c user.email=t@t push -q -u origin HEAD 2>/dev/null
  echo "$wt"
}
age() { find "$1" -exec touch -h -d '3 days ago' {} + 2>/dev/null; }
expect() { # expect NAME WANT(0 removable|1 keep) GOT_EXIT REASON
  local name=$1 want=$2 got=$3 why=$4
  if [ "$want" = "$got" ]; then echo "PASS $name ($why)"; else echo "FAIL $name: wanted $want got $got ($why)"; fail=1; fi
}
run() { worktree_removable "$1" >/dev/null 2>&1; echo $?; }

# 1. Clean, fully pushed, idle: must be removable (positive proof).
w=$(make_wt clean); age "$w"; expect clean-pushed-idle 0 "$(run "$w")" "all proofs hold"

# 2. Ignored secret file: must be kept.
w=$(make_wt envfile); echo SECRET > "$w/.env"; age "$w"; expect ignored-env 1 "$(run "$w")" "ignored file present"

# 3. Untracked file: must be kept.
w=$(make_wt untracked); echo new > "$w/new.txt"; age "$w"; expect untracked 1 "$(run "$w")" "untracked file present"

# 4. Modified tracked file: must be kept.
w=$(make_wt modified); echo changed >> "$w/a.txt"; age "$w"; expect modified 1 "$(run "$w")" "uncommitted change"

# 5. Unpushed commit: must be kept.
w=$(make_wt unpushed); (cd "$w" && echo more >> a.txt && git -c user.name=t -c user.email=t@t commit -qam local); age "$w"; expect unpushed 1 "$(run "$w")" "commit not on remote"

# 6. No upstream: must be kept.
w="$T/wt-noupstream"; git -C "$seed" worktree add -q -b noupstream "$w" main; age "$w"; expect no-upstream 1 "$(run "$w")" "no upstream set"

# 7. Only node_modules (ignored): must be kept, because build folders are not verified as disposable.
w=$(make_wt nodemods); mkdir -p "$w/node_modules/p" && echo x > "$w/node_modules/p/i.js"; age "$w"; expect node-modules-only 1 "$(run "$w")" "ignored build folder present"

# 8. Recently changed file (not old): must be kept.
w=$(make_wt recent); age "$w"; touch "$w/a.txt"; expect recent-change 1 "$(run "$w")" "changed within idle window"

# 9. Stash entry in the repository: must be kept.
w=$(make_wt stashed); age "$w"; (cd "$w" && echo s >> a.txt && git -c user.name=t -c user.email=t@t stash -q); age "$w"; expect stash-present 1 "$(run "$w")" "stash entry in repo"

echo "log: $DISK_GUARD_LOG"; echo "--- decisions"; cat "$DISK_GUARD_LOG" 2>/dev/null || true
if [ $fail = 0 ]; then echo "ALL CASES PASS"; else echo "FAILURES"; fi
exit $fail
