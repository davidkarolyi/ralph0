#!/usr/bin/env node

import { parseArgs } from "util";
import { initCommand } from "./commands/init.ts";
import { runCommand } from "./commands/run.ts";
import { setupSkillsCommand } from "./commands/setup-skills.ts";
import chalk from "chalk";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    agent: {
      type: "string",
      short: "a",
      default: "claude",
    },
    "hourly-budget": {
      type: "string",
    },
    "daily-budget": {
      type: "string",
    },
    help: {
      type: "boolean",
      short: "h",
    },
    version: {
      type: "boolean",
      short: "v",
    },
  },
  allowPositionals: true,
});

const command = positionals[0];

function printHelp() {
  console.log(`
${chalk.bold("r0")} - A minimalistic Ralph Loop CLI

${chalk.dim("Usage:")}
  r0 init              Initialize a ralph folder with starter templates
  r0 run [options]     Run the loop until the backlog is empty
  r0 setup-skills      Install r0 skill for Claude Code

${chalk.dim("Options:")}
  -a, --agent <name>       Agent to use: claude or codex (default: claude)
  --hourly-budget <n>      Max iterations per hour
  --daily-budget <n>       Max iterations per day

${chalk.dim("Examples:")}
  r0 init
  r0 run
  r0 run --agent codex
  r0 run --hourly-budget 10 --daily-budget 50
`);
}

function printVersion() {
  console.log("0.1.0");
}

function parseBudgetOption(rawValue: string | undefined, optionLabel: string): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    console.error(
      chalk.red(`Invalid ${optionLabel}: ${rawValue}. Must be a positive integer.`),
    );
    process.exit(1);
  }

  return parsedValue;
}

if (values.help) {
  printHelp();
  process.exit(0);
}

if (values.version) {
  printVersion();
  process.exit(0);
}

if (!command) {
  printHelp();
  process.exit(1);
}

function validateAgent(agent: string | undefined): "claude" | "codex" {
  if (agent === "claude" || agent === "codex") {
    return agent;
  }
  console.error(chalk.red(`Invalid agent: ${agent}. Must be 'claude' or 'codex'`));
  process.exit(1);
}

switch (command) {
  case "init":
    await initCommand();
    break;
  case "run":
    await runCommand({
      agent: validateAgent(values.agent),
      hourlyBudget: parseBudgetOption(values["hourly-budget"], "hourly-budget"),
      dailyBudget: parseBudgetOption(values["daily-budget"], "daily-budget"),
    });
    break;
  case "setup-skills":
    await setupSkillsCommand();
    break;
  default:
    console.error(chalk.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
}
