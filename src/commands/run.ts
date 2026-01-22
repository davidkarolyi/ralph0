import { exists } from "fs/promises";
import path from "path";
import chalk from "chalk";
import { createAgent, type AgentName } from "../agents/index.ts";
import { parseBacklog, hasRemainingTasks } from "../backlog.ts";
import { createBudgetState, checkBudget, incrementBudget, type BudgetConfig } from "../budget.ts";
import { renderProgressBar, renderAgentOutput, IterationSpinner } from "../ui.ts";
import { getCombinedGitStats, getLastCommitHash, getLastCommitMessage } from "../git.ts";

export interface RunOptions {
  agent: AgentName;
  hourlyBudget?: number;
  dailyBudget?: number;
}

export async function runCommand(options: RunOptions): Promise<void> {
  const folderPath = path.resolve(process.cwd(), ".ralph");

  // Handle Ctrl+C gracefully
  let currentSpinner: IterationSpinner | null = null;
  let currentStatsInterval: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (currentSpinner) {
      currentSpinner.stop();
    }
    if (currentStatsInterval) {
      clearInterval(currentStatsInterval);
    }
    console.log();
    console.log(chalk.dim("Interrupted"));
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Check if ralph folder exists
  if (!(await exists(folderPath))) {
    console.error(chalk.red("Ralph folder not found: .ralph"));
    console.error(chalk.dim(`Run ${chalk.bold("r0 init")} to create it`));
    process.exit(1);
  }

  const promptPath = path.join(folderPath, "prompt.md");
  const backlogPath = path.join(folderPath, "backlog.md");
  const notepadPath = path.join(folderPath, "notepad.md");

  // Verify required files exist
  for (const filePath of [promptPath, backlogPath, notepadPath]) {
    if (!(await exists(filePath))) {
      console.error(chalk.red(`Missing file: ${filePath}`));
      process.exit(1);
    }
  }

  const agent = createAgent(options.agent);
  const budgetConfig: BudgetConfig = {
    hourlyBudget: options.hourlyBudget,
    dailyBudget: options.dailyBudget,
  };
  const budgetState = createBudgetState();

  console.log();
  console.log(chalk.dim(`Using agent: ${options.agent}`));
  console.log();

  // Main loop
  while (true) {
    // Read current state
    const promptContent = await Bun.file(promptPath).text();
    const backlogContent = await Bun.file(backlogPath).text();
    const notepadContent = await Bun.file(notepadPath).text();

    const backlogState = parseBacklog(backlogContent);

    // Check if there are remaining tasks
    if (!hasRemainingTasks(backlogState)) {
      console.log(renderProgressBar(backlogState.completedCount, backlogState.totalCount));
      console.log();
      console.log(chalk.green("All tasks completed!"));
      break;
    }

    // Check budget
    const budgetCheck = checkBudget(budgetConfig, budgetState);
    if (!budgetCheck.allowed) {
      console.log(renderProgressBar(backlogState.completedCount, backlogState.totalCount));
      console.log();
      console.log(chalk.yellow(budgetCheck.reason));
      break;
    }

    // Display progress
    console.log(renderProgressBar(backlogState.completedCount, backlogState.totalCount));
    console.log();

    // Construct prompt
    const fullPrompt = constructPrompt(promptContent, notepadContent, backlogContent);

    const commitHashBeforeRun = await getLastCommitHash();

    // Start spinner
    currentSpinner = new IterationSpinner();
    currentSpinner.start();

    // Start git stats polling
    currentStatsInterval = setInterval(async () => {
      const stats = await getCombinedGitStats();
      currentSpinner?.updateStats(stats);
    }, 2000);

    // Run agent
    const result = await agent.run(fullPrompt);

    // Stop polling and spinner
    clearInterval(currentStatsInterval);
    currentStatsInterval = null;

    if (!result.success) {
      currentSpinner.fail("Agent failed");
      currentSpinner = null;
      console.log(renderAgentOutput(result.output));
      process.exit(1);
    }

    // Get final stats and commit message
    const finalStats = await getCombinedGitStats();
    const commitHashAfterRun = await getLastCommitHash();
    const hasNewCommit =
      commitHashAfterRun !== null && commitHashAfterRun !== commitHashBeforeRun;
    const commitMessage = hasNewCommit
      ? (await getLastCommitMessage()) ?? "Iteration complete"
      : "No new commit detected";

    currentSpinner.updateStats(finalStats);
    if (hasNewCommit) {
      currentSpinner.succeed(commitMessage);
    } else {
      currentSpinner.warn(commitMessage);
    }
    currentSpinner = null;

    // Show agent output
    if (result.output) {
      console.log();
      console.log(renderAgentOutput(result.output));
    }

    console.log();

    // Increment budget counters
    incrementBudget(budgetState);

    // Small delay before next iteration
    await Bun.sleep(1000);
  }
}

function constructPrompt(basePrompt: string, notepad: string, backlog: string): string {
  return `${basePrompt}

---

## Current Notepad

${notepad}

---

## Current Backlog

${backlog}
`;
}
