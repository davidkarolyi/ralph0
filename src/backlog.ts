export interface Task {
  text: string;
  completed: boolean;
  lineIndex: number;
}

export interface BacklogState {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
}

const TASK_REGEX = /^\s*(?:[-*+]|\d+\.)?\s*\[([ xX])\]\s*(.+)$/;

export function parseBacklog(content: string): BacklogState {
  const lines = content.split("\n");
  const tasks: Task[] = [];

  lines.forEach((line, index) => {
    const match = line.match(TASK_REGEX);
    if (match) {
      const completed = match[1]?.toLowerCase() === "x";
      const text = match[2]?.trim() ?? "";
      tasks.push({ text, completed, lineIndex: index });
    }
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  return { tasks, completedCount, totalCount };
}

export function getNextTask(state: BacklogState): Task | null {
  return state.tasks.find((task) => !task.completed) ?? null;
}

export function hasRemainingTasks(state: BacklogState): boolean {
  return state.completedCount < state.totalCount;
}
