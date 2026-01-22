# ralph0

A minimalist implementation of the [Ralph Loop](https://ghuntley.com/loop/). Three markdown files. That's the entire system.

```
.ralph/
├── prompt.md     # Instructions for the agent
├── backlog.md    # Task list
└── notepad.md    # Agent's memory
```

No `prd.json`. No `learnings.txt`. No `agent-memory-v2.config.yaml`. Just markdown files you can read, edit, and understand in a minute.

This matters because AI agents are like humans—the simpler the system, the better they work with it.

```
 ████████████████░░░░░░░░  4/8 tasks

 ✓ feat(auth): implement user login endpoint  2m 34s
   4 files  +127 -43
```

## Why?

AI coding agents get worse the longer they run. Every file read, every failed attempt, every tangent—it all piles up in the context window until the model is juggling too much to think straight.

The Ralph Loop fixes this by making agents deliberately forgetful:

- **One task, then exit.** The agent spawns, completes one task, commits, and dies.
- **Memory lives in files.** Three markdown files carry context between iterations.
- **Fresh start every time.** No accumulated cruft, no context pollution.

You write a backlog, hit run, and come back to a built project.

## Prerequisites

You need an AI coding agent CLI installed:

- [Claude Code](https://claude.ai/code) (`claude` CLI) — default
- [OpenAI Codex](https://openai.com/codex) (`codex` CLI)

## Installation

```bash
# Clone and build
git clone https://github.com/user/ralph0.git
cd ralph0
bun run build

# Add to PATH (or move dist/r0 somewhere in your PATH)
export PATH="$PATH:$(pwd)/dist"
```

## Quick Start

```bash
# 1. Initialize in your project
cd your-project
r0 init

# 2. Edit the backlog with your tasks
vim .ralph/backlog.md

# 3. Run the loop
r0 run
```

The loop runs until all tasks are checked off.

## Usage

```bash
r0 init                              # Create .ralph/ folder with templates
r0 run                               # Start the loop with Claude
r0 run --agent codex                 # Use Codex instead
r0 run --hourly-budget 10            # Max 10 iterations per hour
r0 run --daily-budget 50             # Max 50 iterations per day
```

Press `Ctrl+C` to stop cleanly at any time.

## The Three Files

All state lives in `.ralph/`:

### `backlog.md` — Your task list

```markdown
[ ] Implement user authentication
[ ] Add input validation to the signup form
[ ] Write tests for the auth module
[x] Set up project structure
```

The agent picks the most impactful unchecked task each iteration.

### `notepad.md` — The agent's memory

A narrative the agent writes for its future self. Project state, decisions made, gotchas discovered. Think of it as a handoff document:

```markdown
Building a REST API with Express + TypeScript. Auth is the current focus.

Chose bcrypt over argon2 for password hashing—better library support.
The /login endpoint works. Next up: /register with email validation.

Important: use AppError from src/middleware/errors.ts, not raw Error.
```

### `prompt.md` — Instructions for the agent

Base instructions injected every iteration. The default works well, but you can customize per-project.

## How It Works

```
┌─────────────────────────────────────────────────┐
│                  RALPH LOOP                     │
├─────────────────────────────────────────────────┤
│                                                 │
│   1. Read prompt.md, notepad.md, backlog.md     │
│   2. Pick the most impactful unchecked task     │
│   3. Implement it                               │
│   4. Update notepad.md with what happened       │
│   5. Mark task [x] in backlog.md                │
│   6. Commit with conventional commit message    │
│   7. Exit → fresh context next iteration        │
│                                                 │
│   ↺ Repeat until backlog is empty               │
│                                                 │
└─────────────────────────────────────────────────┘
```

Each iteration starts with zero memory of previous runs. The only continuity is what's written in the files. This deliberate amnesia keeps the agent sharp.

## Terminal UI

While running:

```
 ████████████░░░░░░░░░░░░  3/8 tasks

 ⠋ Running agent...  2m 34s
   4 files  +127 -43
```

After each iteration:

```
 ████████████████░░░░░░░░  4/8 tasks

 ✓ feat(auth): implement user login endpoint  2m 34s
   4 files  +127 -43
```

You see progress, elapsed time, and live git stats (files changed, lines added/removed).

## Tips

- **Write good tasks.** Clear, atomic tasks work best. "Implement login" beats "Set up auth stuff".
- **Review the notepad.** If the agent seems confused, check what it wrote—you can edit it.
- **Use budgets for unattended runs.** `--hourly-budget 10` prevents runaway loops while you're away.
- **Customize prompt.md.** Add project-specific conventions, preferred libraries, or coding standards.

## Why "ralph0"?

Iteration zero of the Ralph Loop—the simplest possible implementation. Named after Ralph Wiggum via [Geoffrey Huntley's original technique](https://ghuntley.com/loop/).

## License

MIT
