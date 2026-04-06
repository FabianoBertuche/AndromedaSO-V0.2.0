import { SubmitTaskFeedbackInput, TaskExecutionReference, TaskFeedbackView } from "./TaskFeedback";

export interface FeedbackRepository {
    findByTask(taskId: string, tenantId: string): Promise<TaskFeedbackView[]>;
    findByTaskAndUser(taskId: string, tenantId: string, userId: string): Promise<TaskFeedbackView | null>;
    create(input: SubmitTaskFeedbackInput & { agentId: string }): Promise<TaskFeedbackView>;
    findExecutionReference(taskId: string, tenantId: string): Promise<TaskExecutionReference | null>;
    updateLedgerFeedback(taskId: string, tenantId: string, rating: number): Promise<void>;
}
