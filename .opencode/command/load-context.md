---
description: Load task-scoped Picklesch context (routing doc, project card, relevant notes, graph)
agent: build
---

Load the minimum context needed for the current task, per the "Context retrieval"
workflow in AGENTS.md. Do not load the whole vault.

1. Read `AGENTS.md` (this repo) and the global user `AGENTS.md`.
2. Read the routing document `99-System/Context-Routing.md` in the configured `obsidian`
   reference, and the Picklesch project card `01-Projects/Picklesch/Picklesch-Project-Card.md`.
3. Identify the task and the affected components.
4. Retrieve only the Obsidian notes the card/routing doc link to that are relevant to the
   task (requirements, decisions, session notes, architecture). Skip the rest.
5. For relationship questions, query Graphify (`graphify query "<question>"`) when
   `graphify-out/graph.json` is fresh.
6. Inspect the actual source code for the affected components.
7. Report: which notes/sources you loaded, any conflict between documented expectations
   and the current implementation, and any unresolved requirement you need answered.
