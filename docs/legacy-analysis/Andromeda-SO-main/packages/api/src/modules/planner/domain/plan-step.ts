export type PlanStepStatus =
    | "pending"
    | "waiting_dependency"
    | "waiting_approval"
    | "running"
    | "completed"
    | "failed"
    | "rolled_back";

export interface PlanStepOutput {
    summary?: string;
    artifacts?: string[];
    [key: string]: unknown;
}

export interface PlanStep {
    id: string;
    tenantId: string;
    planId: string;
    stepIndex: number;
    title: string;
    description?: string | null;
    agentId: string;
    skillId?: string | null;
    status: PlanStepStatus;
    input?: Record<string, unknown> | null;
    output?: PlanStepOutput | null;
    errorMessage?: string | null;
    dependsOn: string[];
    canRunParallel: boolean;
    requiresApproval: boolean;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    continuationInstructions?: string | null;
    expectedOutputFormat?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    failedAt?: Date | null;
    retryCount: number;
    maxRetries: number;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePlanStepInput {
    tenantId: string;
    planId: string;
    stepIndex: number;
    title: string;
    description?: string;
    agentId: string;
    skillId?: string;
    status?: PlanStepStatus;
    input?: Record<string, unknown>;
    output?: PlanStepOutput;
    errorMessage?: string;
    dependsOn?: string[];
    canRunParallel?: boolean;
    requiresApproval?: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    continuationInstructions?: string;
    expectedOutputFormat?: string;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    retryCount?: number;
    maxRetries?: number;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export function createPlanStep(input: CreatePlanStepInput & { id: string }): PlanStep {
    const now = input.createdAt || new Date();

    return {
        id: input.id,
        tenantId: input.tenantId,
        planId: input.planId,
        stepIndex: input.stepIndex,
        title: input.title,
        description: input.description || null,
        agentId: input.agentId,
        skillId: input.skillId || null,
        status: input.status || "pending",
        input: input.input || null,
        output: input.output || null,
        errorMessage: input.errorMessage || null,
        dependsOn: input.dependsOn || [],
        canRunParallel: input.canRunParallel ?? false,
        requiresApproval: input.requiresApproval ?? false,
        approvedBy: input.approvedBy || null,
        approvedAt: input.approvedAt || null,
        continuationInstructions: input.continuationInstructions || null,
        expectedOutputFormat: input.expectedOutputFormat || null,
        startedAt: input.startedAt || null,
        completedAt: input.completedAt || null,
        failedAt: input.failedAt || null,
        retryCount: input.retryCount ?? 0,
        maxRetries: input.maxRetries ?? 2,
        deletedAt: input.deletedAt || null,
        createdAt: now,
        updatedAt: input.updatedAt || now,
    };
}
