// doc-sync-reminder plugin for OpenCode
//
// Two complementary reminders for documentation sync, part of the persistent
// knowledge system (AGENTS.md → "Documentation sync (Obsidian)"):
//
//  1. `tool.execute.after` — right after a successful `git commit`, append a
//     reminder to the Bash tool's output so the agent sees "sync the docs now"
//     at the moment it matters.
//  2. `experimental.chat.system.transform` — once per session, if the pending
//     marker written by the git post-commit hook exists, inject a notice into
//     the system prompt so the reminder survives across sessions/editors.
//
// This is a *reminder*, not an executor: OpenCode plugins cannot author verified
// documentation. The authoritative workflow lives in AGENTS.md; `/sync-docs`
// runs it on demand. The marker is written by the git hook
// `.opencode/hooks/post-commit-doc-sync.sh` (wired from `.git/hooks/post-commit`)
// and cleared ONLY by an explicit, verified sync — never automatically.

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

/** Repo-relative path of the pending-sync marker (keep in sync with the git hook). */
export const PENDING_MARKER_REL = ".opencode/.doc-sync-pending"

/** Parsed contents of the pending marker. */
export interface PendingMarker {
  sha: string | null
  time: string | null
}

/** The shared instruction body — one home for the "what to do now" prose. */
const SYNC_STEPS =
  "run the \"Documentation sync (Obsidian)\" workflow from AGENTS.md (or /sync-docs): inspect `git diff`, " +
  "verify with the relevant tests, update ONLY the affected notes under 01-Projects/Picklesch/ " +
  "(the vault moved to PARA), refresh Graphify for doc/uncommitted changes (`graphify update`), and update " +
  "the project card (01-Projects/Picklesch/Picklesch-Project-Card.md) if status/focus/next-step changed"

const CLEAR_RULE =
  "After a VERIFIED sync, delete .opencode/.doc-sync-pending — the marker is cleared only by an explicit, verified sync, never assumed."

const REMINDER =
  "\n\n[doc-sync] A commit just ran and may have changed behavior documented in the Obsidian knowledge base. " +
  `Now ${SYNC_STEPS}. If this session did work, also /save-progress. ${CLEAR_RULE} ` +
  "Do NOT report completion until this is done; never record unverified results."

/** Absolute path of the pending marker for a given project directory. */
export function pendingMarkerPath(directory: string): string {
  return join(directory, PENDING_MARKER_REL)
}

/** Parse the `sha=…\ntime=…` marker body into its fields. */
export function parseMarker(raw: string): PendingMarker {
  return {
    sha: /^sha=(.+)$/m.exec(raw)?.[1]?.trim() ?? null,
    time: /^time=(.+)$/m.exec(raw)?.[1]?.trim() ?? null,
  }
}

/**
 * Build the system-prompt notice from the pending marker, or null when there is
 * no marker. Pure (reads the file only) so it can be exercised in isolation.
 */
export function buildPendingNotice(directory: string): string | null {
  const marker = pendingMarkerPath(directory)
  if (!existsSync(marker)) return null

  let raw = ""
  try {
    raw = readFileSync(marker, "utf-8")
  } catch {
    raw = ""
  }

  const { sha, time } = parseMarker(raw)
  const parts = [sha && `sha ${sha}`, time && `committed ${time}`].filter(Boolean)
  const where = parts.length > 0 ? ` (${parts.join(", ")})` : ""

  return (
    `[doc-sync] A commit landed and documentation sync is PENDING${where}. ` +
    `Now ${SYNC_STEPS}. ${CLEAR_RULE}`
  )
}

export const DocSyncReminderPlugin: Plugin = async ({ directory }) => {
  // Scope to this project only — never fire in other repos.
  const dir = String(directory ?? "").replace(/\\/g, "/").toLowerCase()
  if (!dir.endsWith("/picklesch")) {
    return {}
  }

  const projectDir = String(directory ?? "")
  let lastRemindedCommand = ""

  // De-duplicate the system-prompt notice per session (the transform hook fires
  // per chat call). The in-session commit reminder covers the current session;
  // the marker covers later sessions.
  const injectedSessions = new Set<string>()

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

    // Inject the persistent pending-sync notice once per session.
    "experimental.chat.system.transform": async (input: any, output: any) => {
      const sessionID = String(input?.sessionID ?? "no-session")
      if (injectedSessions.has(sessionID)) return
      injectedSessions.add(sessionID)

      const notice = buildPendingNotice(projectDir)
      if (notice && output && Array.isArray(output.system)) {
        output.system.push(notice)
      }
    },
  }
}
