export interface BudgetConfig {
  hourlyBudget?: number;
  dailyBudget?: number;
}

export interface BudgetState {
  hourlyIterations: number;
  dailyIterations: number;
  hourStartTime: number;
  dayStartTime: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createBudgetState(): BudgetState {
  const now = Date.now();
  return {
    hourlyIterations: 0,
    dailyIterations: 0,
    hourStartTime: now,
    dayStartTime: now,
  };
}

export function checkBudget(config: BudgetConfig, state: BudgetState): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Reset hourly counter if hour has passed
  if (now - state.hourStartTime >= HOUR_MS) {
    state.hourlyIterations = 0;
    state.hourStartTime = now;
  }

  // Reset daily counter if day has passed
  if (now - state.dayStartTime >= DAY_MS) {
    state.dailyIterations = 0;
    state.dayStartTime = now;
  }

  // Check hourly budget
  if (config.hourlyBudget !== undefined && state.hourlyIterations >= config.hourlyBudget) {
    const remainingMs = HOUR_MS - (now - state.hourStartTime);
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      allowed: false,
      reason: `Hourly budget exhausted (${config.hourlyBudget}). Resets in ${remainingMinutes} minutes.`,
    };
  }

  // Check daily budget
  if (config.dailyBudget !== undefined && state.dailyIterations >= config.dailyBudget) {
    const remainingMs = DAY_MS - (now - state.dayStartTime);
    const remainingHours = Math.ceil(remainingMs / HOUR_MS);
    return {
      allowed: false,
      reason: `Daily budget exhausted (${config.dailyBudget}). Resets in ${remainingHours} hours.`,
    };
  }

  return { allowed: true };
}

export function incrementBudget(state: BudgetState): void {
  state.hourlyIterations++;
  state.dailyIterations++;
}
