export enum TaskStatus {
    RECEIVED = "received",
    STRUCTURING = "structuring",
    RESOLVING = "resolving",
    EXECUTING = "executing",
    AUDITING = "auditing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export class TaskState {
    private static transitions: Record<TaskStatus, TaskStatus[]> = {
        [TaskStatus.RECEIVED]: [TaskStatus.STRUCTURING, TaskStatus.FAILED],
        [TaskStatus.STRUCTURING]: [TaskStatus.RESOLVING, TaskStatus.FAILED],
        [TaskStatus.RESOLVING]: [TaskStatus.EXECUTING, TaskStatus.FAILED],
        [TaskStatus.EXECUTING]: [TaskStatus.AUDITING, TaskStatus.FAILED],
        [TaskStatus.AUDITING]: [TaskStatus.COMPLETED, TaskStatus.FAILED],
        [TaskStatus.COMPLETED]: [],
        [TaskStatus.FAILED]: [TaskStatus.RECEIVED], // Optional: allow retry
    };

    static canTransition(from: TaskStatus, to: TaskStatus): boolean {
        return this.transitions[from].includes(to);
    }
}
