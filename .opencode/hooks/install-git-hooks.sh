#!/bin/sh
# Wire the doc-sync pending-marker dispatcher into this repo's post-commit hook.
#
# `.git/hooks/` is not version-controlled, so a fresh clone has no hook. Run this
# once after cloning (or whenever the block needs restoring):
#
#     sh .opencode/hooks/install-git-hooks.sh
#
# Idempotent: any previous doc-sync block is removed and re-added; a pre-existing
# hook (e.g. Graphify's) is preserved. The Graphify post-commit block is managed
# separately by `graphify hook install` / `graphify hook status`.

set -e

root=$(git rev-parse --show-toplevel)
hook="$root/.git/hooks/post-commit"
rel=".opencode/hooks/post-commit-doc-sync.sh"
start="# doc-sync-pending-start"
end="# doc-sync-pending-end"

mkdir -p "$root/.git/hooks"

# Strip a previous doc-sync block, keeping any other hook content intact.
if [ -f "$hook" ]; then
    awk -v s="$start" -v e="$end" \
        'index($0,s){skip=1} !skip{print} index($0,e){skip=0}' \
        "$hook" > "$hook.tmp" && mv "$hook.tmp" "$hook"
else
    printf '#!/bin/sh\n' > "$hook"
fi

{
    echo ""
    echo "$start"
    echo '_DSP_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)'
    echo "if [ -n \"\$_DSP_ROOT\" ] && [ -f \"\$_DSP_ROOT/$rel\" ]; then"
    echo "    sh \"\$_DSP_ROOT/$rel\" \"\$_DSP_ROOT\""
    echo 'fi'
    echo "$end"
} >> "$hook"

chmod +x "$hook" 2>/dev/null || true

echo "doc-sync pending-marker hook installed at $hook"
