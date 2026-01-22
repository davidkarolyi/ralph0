import chalk from "chalk";

const PROGRESS_BAR_WIDTH = 24;
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface GitDiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export function renderProgressBar(completed: number, total: number): string {
  const percentage = total === 0 ? 0 : completed / total;
  const filled = Math.round(PROGRESS_BAR_WIDTH * percentage);
  const empty = PROGRESS_BAR_WIDTH - filled;

  const filledBar = chalk.green("█".repeat(filled));
  const emptyBar = chalk.dim("░".repeat(empty));

  return ` ${filledBar}${emptyBar}  ${completed}/${total} tasks`;
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export function renderGitDiffInline(stats: GitDiffStats): string {
  if (stats.filesChanged === 0) {
    return "";
  }

  const files = `${stats.filesChanged} file${stats.filesChanged === 1 ? "" : "s"}`;
  const insertions = chalk.green(`+${stats.insertions}`);
  const deletions = chalk.red(`-${stats.deletions}`);

  return `  ${chalk.dim(files)} ${insertions} ${deletions}`;
}

export function renderGitDiff(stats: GitDiffStats): string {
  if (stats.filesChanged === 0) {
    return chalk.dim("   No changes");
  }

  const files = `${stats.filesChanged} file${stats.filesChanged === 1 ? "" : "s"}`;
  const insertions = chalk.green(`+${stats.insertions}`);
  const deletions = chalk.red(`-${stats.deletions}`);

  return `   ${files}  ${insertions} ${deletions}`;
}

export function renderAgentOutput(output: string): string {
  const lines = output.trim().split("\n");
  const indented = lines.map((line) => `   ${line}`).join("\n");
  return chalk.dim(indented);
}

export function renderError(message: string): string {
  return ` ${chalk.red("✗")} ${message}`;
}

export class IterationSpinner {
  private startTime: number = 0;
  private frameIndex: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentStats: GitDiffStats = {
    filesChanged: 0,
    insertions: 0,
    deletions: 0,
  };

  start(): void {
    this.startTime = Date.now();
    this.frameIndex = 0;
    this.render();

    this.intervalId = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
      this.render();
    }, 80);
  }

  updateStats(stats: GitDiffStats): void {
    this.currentStats = stats;
  }

  private render(): void {
    const frame = chalk.cyan(SPINNER_FRAMES[this.frameIndex]);
    const elapsed = formatDuration(Date.now() - this.startTime);
    const diffStr = renderGitDiffInline(this.currentStats);

    const line = ` ${frame} Running agent...  ${chalk.dim(elapsed)}${diffStr}`;

    process.stdout.write(`\r\x1b[K${line}`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    process.stdout.write("\r\x1b[K");
  }

  succeed(message: string): void {
    this.stop();
    const elapsed = formatDuration(Date.now() - this.startTime);
    const diffStr = renderGitDiffInline(this.currentStats);
    console.log(` ${chalk.green("✓")} ${message}  ${chalk.dim(elapsed)}${diffStr}`);
  }

  warn(message: string): void {
    this.stop();
    const elapsed = formatDuration(Date.now() - this.startTime);
    const diffStr = renderGitDiffInline(this.currentStats);
    console.log(` ${chalk.yellow("!")} ${message}  ${chalk.dim(elapsed)}${diffStr}`);
  }

  fail(message: string): void {
    this.stop();
    console.log(renderError(message));
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}
