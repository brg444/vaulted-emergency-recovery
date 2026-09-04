#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display dialog "This page needs Bun. Install it from bun.sh, then double-click Recover.command again." buttons {"OK"} default button 1'
  else
    echo "This page needs Bun. Install it from https://bun.sh then try again." >&2
  fi
  exit 1
fi
exec bun serve.ts
