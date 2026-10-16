# Picklesch — Agent Instructions

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Knowledge base & context routing

The Obsidian vault (PARA layout) is the authoritative long-term project memory.

- Routing document (authoritative map): `99-System/Context-Routing.md` in the vault
  `C:\Users\User\OneDrive - Mapúa Malayan Colleges Mindanao\Documents\AI-Second-Brain`.
- Picklesch project card: `01-Projects/Picklesch/Picklesch-Project-Card.md`.
- Project notes: `01-Projects/Picklesch/`.
- Graph output: `graphify-out/` in this repo.

One fact has one home: status/next-step live in the project card; history and rationale
live in Obsidian; the graph lives in `graphify-out/`. `icm.exe` (persistent memory) is a
separate tool from the routing layer — do not duplicate Obsidian facts into it.

## Context retrieval (before a Picklesch development request)

1. Read the applicable `AGENTS.md` (this file, plus the global user `AGENTS.md`).
2. Identify the task and the affected components.
3. Read the routing document and the Picklesch project card.
4. Retrieve only the relevant Obsidian requirement/decision/session notes they link to.
5. Use Graphify for relationship questions when the graph is fresh.
6. Inspect the actual source code.
7. Flag conflicts between documented expectations and the current implementation.
8. Ask about unresolved requirements instead of guessing.

Do not load the entire vault; retrieve by task, links, and graph relationships.

## Error recovery

If a command, script, graph refresh, doc update, or test fails:

1. Stop dependent steps.
2. Inspect the real error and the relevant files.
3. Diagnose the cause.
4. Propose the smallest appropriate fix.
5. Get approval where these instructions require it.
6. Implement the fix.
7. Verify whether it worked.
8. Report the result.
9. When user confirmation is needed, ask whether the error is resolved.
10. If resolved, ask whether to proceed with the next dependent step.

Never assume a fix succeeded or continue a dependent workflow while the error stands.

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
5. **Context tools** — update the project card when status/focus/next-step changed;
   `icm_memory_store` when decisions/errors/progress changed; refresh Graphify only when
   code relationships changed significantly (the post-commit hook rebuilds the *committed
   code* graph automatically; run `graphify update` for note/doc changes, and for
   uncommitted code changes — the hook does not see those; never assumed automatic).
6. **Report** — code changes, notes updated, verification results, unresolved issues,
   documentation still needing attention.

Fallback trigger: the `/sync-docs` command runs the same workflow on demand.
The `doc-sync-reminder` plugin injects a reminder into agent context whenever a
`git commit` runs, but does not guarantee execution — the AGENTS.md rule above
is the authoritative workflow.

"Saving progress" — when the user says **Save Progress**, append a dated session note
(changes, decisions, errors, verification, remaining tasks) under `01-Projects/Picklesch/`
(or update `03-Development/Progress.md`) and update the project card. `/save-progress`
runs this on demand.

Pending-sync marker: the git post-commit hook `.opencode/hooks/post-commit-doc-sync.sh`
(wired from `.git/hooks/post-commit`) writes `.opencode/.doc-sync-pending` (HEAD sha +
timestamp) after every commit. `.git/hooks/` is not version-controlled, so restore the
wiring on a fresh clone with `sh .opencode/hooks/install-git-hooks.sh` (idempotent; leaves
Graphify's block intact). While the marker exists, the `doc-sync-reminder` plugin injects a
pending-sync notice into the system prompt at the start of each new session, so the
reminder survives across editors, not just the session that committed. The marker is
cleared ONLY after a verified sync (`/sync-docs` or `/save-progress`); it is never cleared
automatically, and a marker alone never counts as documentation having been updated.
