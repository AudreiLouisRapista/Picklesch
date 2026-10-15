# Picklesch — Agent Instructions

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Documentation sync (Obsidian)

Run this workflow at the end of every feature implementation or code modification,
before reporting completion:

1. **Inspect** — `git status` + `git diff` for modified/added/deleted/renamed files;
   read changed sources and the notes covering them. Never assume a modified file is complete.
2. **Verify** — run the relevant tests/build/checks. Record failures, untested behavior,
   and incomplete features honestly. Never document unverified behavior as implemented.
3. **Analyze impact** — map changes against vault notes: architecture, database schemas,
   API endpoints, business rules, auth, matchmaking, ratings, match verification, mobile
   screens. Identify outdated, missing, or conflicting documentation.
4. **Update Obsidian** — edit only notes affected by verified changes. Preserve vault
   structure, naming, and style. Mark items implemented / partially implemented /
   planned / deprecated. Never invent requirements, never silently change approved
   business rules, never overwrite unrelated notes. If the vault is unreachable, ask.
5. **Context tools** — `icm_memory_store` when decisions/errors/progress changed;
   refresh Graphify only when code relationships changed significantly (explicit run —
   never assumed to sync automatically).
6. **Report** — code changes, notes updated, verification results, unresolved issues,
   documentation still needing attention.

Fallback trigger: the `/sync-docs` command runs the same workflow on demand.
The `doc-sync-reminder` plugin injects a reminder into agent context whenever a
`git commit` runs, but does not guarantee execution — the AGENTS.md rule above
is the authoritative workflow.
