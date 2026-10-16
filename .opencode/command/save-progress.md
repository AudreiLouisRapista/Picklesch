---
description: Save session progress to Obsidian (dated session note + project card)
agent: build
---

Save progress for the current session. Record only what was actually done and verified.

1. Inspect the session: `git status` + `git diff` and the work performed. Do not invent
   completed work.
2. Verify: run the relevant tests/build/checks and record the real results. Never record
   unverified behavior as implemented.
3. Append a dated session note (format `YYYY-MM-DD — <topic>`) covering: changes,
   decisions, errors encountered/resolved, verification results, and remaining tasks.
   Put it under `01-Projects/Picklesch/03-Development/` (or update `Progress.md`).
4. Update the project card `01-Projects/Picklesch/Picklesch-Project-Card.md` if status,
   current focus, next step, or last-updated changed.
5. Use frontmatter on any new note: `type`, `tags`, `date`, `summary`.
6. Preserve existing notes; link rather than duplicate. Never overwrite unrelated content.
7. Report what was written and where.
8. Clear the pending marker: after a verified save, delete `.opencode/.doc-sync-pending`
   (written by the git post-commit hook). Leave it in place if the save is incomplete.
