import type { GitDiffStats } from "./ui.ts";

interface FileDiffStats {
  insertions: number;
  deletions: number;
}

async function getGitDiffStatsByFile(commandArguments: string[]): Promise<Map<string, FileDiffStats>> {
  try {
    const spawnedProcess = Bun.spawn(commandArguments, {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(spawnedProcess.stdout).text();
    await spawnedProcess.exited;

    return parseGitStatsByFile(output);
  } catch {
    return new Map();
  }
}

export async function getGitDiffStats(): Promise<GitDiffStats> {
  const fileStatsByPath = await getGitDiffStatsByFile(["git", "diff", "--numstat"]);
  return summarizeGitStats(fileStatsByPath);
}

export async function getGitDiffStatsStaged(): Promise<GitDiffStats> {
  const fileStatsByPath = await getGitDiffStatsByFile([
    "git",
    "diff",
    "--cached",
    "--numstat",
  ]);
  return summarizeGitStats(fileStatsByPath);
}

export async function getCombinedGitStats(): Promise<GitDiffStats> {
  const [unstagedStatsByPath, stagedStatsByPath] = await Promise.all([
    getGitDiffStatsByFile(["git", "diff", "--numstat"]),
    getGitDiffStatsByFile(["git", "diff", "--cached", "--numstat"]),
  ]);

  const combinedStatsByPath = new Map<string, FileDiffStats>();

  for (const [filePath, fileStats] of unstagedStatsByPath) {
    combinedStatsByPath.set(filePath, { ...fileStats });
  }

  for (const [filePath, fileStats] of stagedStatsByPath) {
    const existingStats = combinedStatsByPath.get(filePath);
    if (existingStats) {
      combinedStatsByPath.set(filePath, {
        insertions: existingStats.insertions + fileStats.insertions,
        deletions: existingStats.deletions + fileStats.deletions,
      });
    } else {
      combinedStatsByPath.set(filePath, { ...fileStats });
    }
  }

  return summarizeGitStats(combinedStatsByPath);
}

function summarizeGitStats(fileStatsByPath: Map<string, FileDiffStats>): GitDiffStats {
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  for (const fileStats of fileStatsByPath.values()) {
    filesChanged += 1;
    insertions += fileStats.insertions;
    deletions += fileStats.deletions;
  }

  return { filesChanged, insertions, deletions };
}

function parseGitStatsByFile(output: string): Map<string, FileDiffStats> {
  const fileStatsByPath = new Map<string, FileDiffStats>();
  const trimmedOutput = output.trim();

  if (trimmedOutput === "") {
    return fileStatsByPath;
  }

  const lines = trimmedOutput.split("\n").filter(Boolean);

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 3) {
      continue;
    }

    const addedRaw = parts[0] ?? "0";
    const deletedRaw = parts[1] ?? "0";
    const filePath = parts.slice(2).join("\t").trim();

    if (!filePath) {
      continue;
    }

    const insertions = parseGitNumber(addedRaw);
    const deletions = parseGitNumber(deletedRaw);

    const existingStats = fileStatsByPath.get(filePath);
    if (existingStats) {
      fileStatsByPath.set(filePath, {
        insertions: existingStats.insertions + insertions,
        deletions: existingStats.deletions + deletions,
      });
    } else {
      fileStatsByPath.set(filePath, { insertions, deletions });
    }
  }

  return fileStatsByPath;
}

function parseGitNumber(rawValue: string): number {
  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export async function getLastCommitHash(): Promise<string | null> {
  try {
    const spawnedProcess = Bun.spawn(["git", "rev-parse", "HEAD"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(spawnedProcess.stdout).text();
    const exitCode = await spawnedProcess.exited;

    if (exitCode !== 0) {
      return null;
    }

    return output.trim() || null;
  } catch {
    return null;
  }
}

export async function getLastCommitMessage(): Promise<string | null> {
  try {
    const spawnedProcess = Bun.spawn(["git", "log", "-1", "--pretty=%s"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(spawnedProcess.stdout).text();
    const exitCode = await spawnedProcess.exited;

    if (exitCode !== 0) return null;

    return output.trim() || null;
  } catch {
    return null;
  }
}
