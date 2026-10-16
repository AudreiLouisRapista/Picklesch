#!/bin/sh
# Writes the documentation-sync pending marker after a commit.
#
# Consumed by the OpenCode plugin .opencode/plugins/doc-sync-reminder.ts and
# cleared ONLY by an explicit, verified sync (/sync-docs or /save-progress).
# Keeping the marker on disk makes the reminder durable across sessions and
# editors — not just the OpenCode session that made the commit.
#
# Invoked from .git/hooks/post-commit (see its "# doc-sync-pending-start" block),
# which passes the repository root as $1.

root="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$root" ] || exit 0

sha=$(git -C "$root" rev-parse --short HEAD 2>/dev/null) || exit 0
ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)

mkdir -p "$root/.opencode" 2>/dev/null || exit 0
printf 'sha=%s\ntime=%s\n' "$sha" "$ts" > "$root/.opencode/.doc-sync-pending" 2>/dev/null || exit 0

exit 0
