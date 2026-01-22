# AGENTS.md

Guidance for AI coding agents working on this repository.

## The Problem ralph0 Solves

AI coding agents have a fatal flaw: context pollution. Every file they read, every failed attempt, every tangent—it all accumulates in the context window until the model loses focus. By the time you're halfway through a complex task, the agent is drowning in its own history.

The Ralph Loop (named after Ralph Wiggum by [Geoffrey Huntley](https://ghuntley.com/loop/)) solves this through deliberate amnesia. Instead of fighting context limits, we embrace them:

1. **Fresh start every iteration** — The agent spawns, does one task, then dies. No accumulated cruft.
2. **State lives in files, not memory** — Three markdown files are the agent's only continuity between iterations.
3. **One task, full focus** — No context spent remembering what happened three tasks ago.

## Development

```bash
bun run dev              # Run CLI directly without building
bun run build            # Compile to standalone binary at dist/r0
bun run typecheck        # TypeScript type checking
```

## Architecture

The codebase is intentionally minimal—about 500 lines of TypeScript. Every piece exists for a reason.

### The Loop (`src/commands/run.ts`)

The heart of ralph0. Each iteration:
1. Reads the three state files from `.ralph/`
2. Constructs a prompt by combining them
3. Spawns an agent process
4. Waits for completion
5. Checks if tasks remain, loops or exits

Signal handlers (SIGINT/SIGTERM) ensure Ctrl+C exits cleanly without leaving orphaned processes.

### State Files (`.ralph/`)

All persistence happens through three markdown files:

- **`prompt.md`** — Base instructions injected every iteration. Customizable per-project.
- **`backlog.md`** — Task list using `[ ]`/`[x]` checkbox syntax. The loop continues until all boxes are checked.
- **`notepad.md`** — The agent's long-term memory. Written as a narrative for the next iteration to pick up where this one left off.

The backlog parser (`src/backlog.ts`) uses a regex to extract tasks and their completion state.

### Agent System (`src/agents/`)

Agents implement one interface:

```typescript
interface Agent {
  run(prompt: string): Promise<AgentResult>;
}
```

Currently supported:
- **`claude`** — Spawns `claude --print --dangerously-skip-permissions`
- **`codex`** — Spawns `codex exec --full-auto`

Adding a new agent: create a class implementing `Agent` in `src/agents/`, register it in `src/agents/index.ts`.

### Budget System (`src/budget.ts`)

Guardrails against runaway loops. Tracks iterations per hour and per day with automatic reset when the time window passes. If budget is exhausted, the loop pauses with a message showing when it resets.

### Terminal UI (`src/ui.ts`)

Custom single-line spinner using raw ANSI escape codes (`\r\x1b[K`). No external libraries—just careful control of cursor position. Shows:
- Progress bar (completed/total tasks)
- Spinner with elapsed time
- Live git diff stats (files changed, insertions, deletions)

The git stats (`src/git.ts`) poll both staged and unstaged changes, combining them to show total work in progress.

## Design Principles

**Minimalism over features.** This is "iteration zero"—the simplest possible implementation. No plugin systems, no configuration files, no complex state machines. If it can be a markdown file, it is.

**Files as the source of truth.** The agent's memory, task list, and instructions are all human-readable markdown. You can inspect, edit, or reset state with any text editor.

**Agent-agnostic.** The loop doesn't care which AI runs the tasks. Claude, Codex, or something else—they all get the same prompt and the same expectations.
