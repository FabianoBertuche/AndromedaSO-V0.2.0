import { Task } from "../task/Task";

export interface ExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    strategyUsed?: string;
}

export interface ExecutionStrategy {
    execute(task: Task): Promise<ExecutionResult>;
}
