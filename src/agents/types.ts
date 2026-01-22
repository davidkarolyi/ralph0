export interface AgentResult {
  success: boolean;
  output: string;
}

export interface Agent {
  run(prompt: string): Promise<AgentResult>;
}
