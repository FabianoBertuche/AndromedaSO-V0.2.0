export interface SubmitTaskFeedbackInput {
    tenantId: string;
    taskId: string;
    userId: string;
    rating: number;
    comment?: string;
    metadata?: Record<string, unknown>;
}

export interface TaskFeedbackView {
    id: string;
    taskId: string;
    agentId: string;
    userId: string;
    rating: number;
    comment: string | null;
    submittedAt: string;
}

export interface TaskFeedbackSummaryView {
    taskId: string;
    items: TaskFeedbackView[];
    summary: {
        positive: number;
        negative: number;
        score: number;
    };
}

export interface TaskExecutionReference {
    taskId: string;
    agentId: string;
}
