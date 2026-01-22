import type { Agent } from "./types.ts";
import { ClaudeAgent } from "./claude.ts";
import { CodexAgent } from "./codex.ts";

export type AgentName = "claude" | "codex";

export function createAgent(name: AgentName): Agent {
  switch (name) {
    case "claude":
      return new ClaudeAgent();
    case "codex":
      return new CodexAgent();
    default:
      throw new Error(`Unknown agent: ${name}`);
  }
}

export type { Agent, AgentResult } from "./types.ts";
