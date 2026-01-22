import type { Agent, AgentResult } from "./types.ts";

export class CodexAgent implements Agent {
  async run(prompt: string): Promise<AgentResult> {
    try {
      const spawnedProcess = Bun.spawn(["codex", "exec", "--full-auto", prompt], {
        stdout: "pipe",
        stderr: "pipe",
      });

      const output = await new Response(spawnedProcess.stdout).text();
      const errorOutput = await new Response(spawnedProcess.stderr).text();
      const exitCode = await spawnedProcess.exited;

      if (exitCode !== 0) {
        return {
          success: false,
          output: errorOutput || output || "Agent exited with non-zero code",
        };
      }

      return {
        success: true,
        output: output.trim(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start Codex agent";
      return { success: false, output: errorMessage };
    }
  }
}
