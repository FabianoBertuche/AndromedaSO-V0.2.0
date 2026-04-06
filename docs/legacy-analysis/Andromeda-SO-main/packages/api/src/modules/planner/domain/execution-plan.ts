export type ExecutionPlanStatus =
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "rolled_back";

export interface ExecutionPlan {
    id: string;
    tenantId: string;
    taskId: string;
    agentId: string;
    title: string;
    description?: string | null;
    status: ExecutionPlanStatus;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    requiresApproval: boolean;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    failedAt?: Date | null;
    rollbackAt?: Date | null;
    metadata?: Record<string, unknown> | null;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateExecutionPlanInput {
    tenantId: string;
    taskId: string;
    agentId: string;
    title: string;
    description?: string;
    status?: ExecutionPlanStatus;
    totalSteps?: number;
    completedSteps?: number;
    failedSteps?: number;
    requiresApproval?: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    rollbackAt?: Date;
    metadata?: Record<string, unknown>;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export function createExecutionPlan(input: CreateExecutionPlanInput & { id: string }): ExecutionPlan {
    const now = input.createdAt || new Date();

    return {
        id: input.id,
        tenantId: input.tenantId,
        taskId: input.taskId,
        agentId: input.agentId,
        title: input.title,
        description: input.description || null,
        status: input.status || "pending",
        totalSteps: input.totalSteps ?? 0,
        completedSteps: input.completedSteps ?? 0,
        failedSteps: input.failedSteps ?? 0,
        requiresApproval: input.requiresApproval ?? false,
        approvedBy: input.approvedBy || null,
        approvedAt: input.approvedAt || null,
        startedAt: input.startedAt || null,
        completedAt: input.completedAt || null,
        failedAt: input.failedAt || null,
        rollbackAt: input.rollbackAt || null,
        metadata: input.metadata || null,
        deletedAt: input.deletedAt || null,
        createdAt: now,
        updatedAt: input.updatedAt || now,
    };
}
