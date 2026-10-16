---
description: Run the Obsidian documentation synchronization workflow for recent code changes
agent: build
---

Run the "Documentation sync (Obsidian)" workflow defined in AGENTS.md for the current
state of this repository.

1. Inspect changes: `git status` and `git diff` (modified, added, deleted, renamed files).
   If no code changes exist since the last documentation-synced state, say so and stop —
   do not touch any notes.
2. Verify: run the relevant tests, build, or checks. Report failures honestly; never
   document unverified behavior as implemented.
3. Analyze impact: map the verified changes against the Obsidian notes in the
   `01-Projects/Picklesch/` knowledge base (architecture, database schemas, API endpoints,
   business rules, auth, matchmaking, ratings, match verification, mobile screens). Identify
   outdated, missing, or conflicting information.
4. Update Obsidian: edit only the affected notes under `01-Projects/Picklesch/` in the
   configured `obsidian` reference. Preserve structure, naming, and note style. Mark items as
   implemented / partially implemented / planned / deprecated. Never invent
   requirements, never silently change approved business rules, never overwrite
   unrelated notes. If the vault is unreachable, ask instead of guessing.
5. Context tools: `icm_memory_store` when decisions/errors/progress changed. The git
   post-commit hook rebuilds the *committed code* graph automatically; run `graphify update`
   for doc/Markdown changes and for uncommitted code changes (the hook does not see those).
   Update the project card `01-Projects/Picklesch/Picklesch-Project-Card.md` if
   status/focus/next-step changed.
6. Report: summarize code changes, list Obsidian notes updated, report verification
   results, and mention unresolved issues plus documentation still needing attention.
7. Clear the pending marker: only after a verified sync, delete `.opencode/.doc-sync-pending`
   (written by the git post-commit hook; it gates the next session's reminder). If the sync
   could not be completed or verified, leave the marker in place.
