// doc-sync-reminder plugin for OpenCode
//
// Injects a documentation-sync reminder into agent-visible context whenever a
// `git commit` command succeeds in this project. This is a *reminder*, not an
// executor: it appends a line to the Bash tool's output so the agent sees
// "run the Documentation sync workflow now" at the moment it matters.
// The authoritative workflow lives in AGENTS.md ("Documentation sync");
// `/sync-docs` is the on-demand trigger.
//
// Hook surface per OpenCode plugin API: `tool.execute.after` mutates the
// result in place (same pattern as the icm plugin).

import type { Plugin } from "@opencode-ai/plugin"

const REMINDER =
  "\n\n[doc-sync] This commit may have changed behavior covered by the Picklesch/ Obsidian knowledge base. " +
  "Run the \"Documentation sync (Obsidian)\" workflow from AGENTS.md now (or invoke /sync-docs) " +
  "before reporting completion."

export const DocSyncReminderPlugin: Plugin = async ({ directory }) => {
  // Scope to this project only — never fire in other repos.
  const dir = String(directory ?? "").replace(/\\/g, "/").toLowerCase()
  if (!dir.endsWith("/picklesch")) {
    return {}
  }

  let lastRemindedCommand = ""

  return {
    "tool.execute.after": async (input: any, result: any) => {
      const tool = String(input?.tool ?? "")
      if (tool !== "Bash") return

      const command = String(input?.args?.command ?? input?.command ?? "")
      if (!/\bgit\s+(?:-c\s+\S+\s+)*commit\b/.test(command)) return

      // Don't double-inject for the same command execution.
      if (command === lastRemindedCommand) return

      // Read current output (OpenCode stores Bash output in result.metadata.output).
      const current = result?.metadata?.output ?? result?.output
      if (typeof current !== "string" || current.length === 0) return

      // Only remind on likely-successful commits.
      if (/fatal:|error:|nothing (?:to )?commit/i.test(current)) return
      if (current.includes("[doc-sync]")) return

      const reminder = current + REMINDER
      if (result?.metadata && typeof result.metadata === "object") {
        result.metadata.output = reminder
      } else if (result && typeof result === "object") {
        result.output = reminder
      }
      lastRemindedCommand = command
    },
  }
}
