import { mkdir, exists } from "fs/promises";
import path from "path";
import chalk from "chalk";

const RALPH_FOLDER = ".ralph";

const PROMPT_TEMPLATE = `You are operating in an automated loop. Each iteration, you start with fresh context - your only memory is what's written in the notepad.

## Your Task

1. Read \`${RALPH_FOLDER}/notepad.md\` to understand what happened in previous iterations
2. Read \`${RALPH_FOLDER}/backlog.md\` to see all pending tasks
3. Choose the **next logical** unchecked task and implement it
4. Update \`${RALPH_FOLDER}/notepad.md\`
5. Mark the completed task with \`[x]\` in \`${RALPH_FOLDER}/backlog.md\`
6. Commit your changes with a conventional commit message (e.g., \`feat:\`, \`fix:\`, \`refactor:\`)

### Notepad

Your scratchpad. The only thing that survives between iterations.

Write it like you're catching up a coworker who just joined mid-project:
- Where are we? What's built, what's the current state of things.
- What just happened? What you did this iteration and any relevant context.
- What do we know? Learnings, gotchas, decisions that would bite someone who didn't know.
- What's on your mind? Internal todos, next steps, open threads to pick up.

Keep it alive:
- Rewrite sections as things evolve. Old news becomes noise.
- If it doesn't help the next iteration, delete it.
- This isn't a log. It's a living briefing.

### Task Workflow
- Once you picked a task, read all relevant files first and become an expert of the topic.
- Make a practical plan. Break down the task into smaller steps. Feel free to persist any thoughts in your notepad.
- Implement the changes.
- Once you feel like you're done, read all the changed files again. Do you see any oversights, functional flaws, wrong assumptions? Fix them. Look for files that should have changed but we missed to do so? How does the implementation fit into the bigger picture?
- Once you're confident, mark the task as complete in the notepad and commit your changes.

### Important

- Focus on ONE task only.
- The notepad is your long-term memory. Keep it concise but complete.
- Always commit your work before exiting.
`;

const BACKLOG_TEMPLATE = `# Backlog

[ ] Your first task here
`;

const NOTEPAD_TEMPLATE = `# Notepad

This is the start of the project. No iterations have been completed yet.
`;

export async function initCommand(): Promise<void> {
  const folderPath = path.resolve(process.cwd(), RALPH_FOLDER);

  if (await exists(folderPath)) {
    console.log(chalk.yellow(`${RALPH_FOLDER} folder already exists`));
    return;
  }

  await mkdir(folderPath, { recursive: true });

  await Bun.write(path.join(folderPath, "prompt.md"), PROMPT_TEMPLATE);
  await Bun.write(path.join(folderPath, "backlog.md"), BACKLOG_TEMPLATE);
  await Bun.write(path.join(folderPath, "notepad.md"), NOTEPAD_TEMPLATE);

  console.log(chalk.green(`Initialized ${RALPH_FOLDER}`));
  console.log();
  console.log(
    `  ${chalk.bold("backlog.md")}   ${chalk.dim("Your task list. Add tasks as [ ] checkboxes.")}`,
  );
  console.log(
    `  ${chalk.bold("notepad.md")}   ${chalk.dim("Agent's memory. It writes here to remember things.")}`,
  );
  console.log(
    `  ${chalk.bold("prompt.md")}    ${chalk.dim("Instructions for the agent. Customize if needed.")}`,
  );
  console.log();
  console.log(chalk.dim("Quick start:"));
  console.log(
    `  1. Edit ${chalk.bold(".ralph/backlog.md")} and add your tasks`,
  );
  console.log(`  2. Run ${chalk.bold("r0 run")} to start the loop`);
  console.log();
  console.log(chalk.dim("Example with all options:"));
  console.log();
  console.log(
    `    ${chalk.cyan("r0 run --agent claude --hourly-budget 10 --daily-budget 50")}`,
  );
  console.log();
  console.log(
    chalk.dim(
      "The agent will pick tasks one by one until the backlog is empty.",
    ),
  );
}
