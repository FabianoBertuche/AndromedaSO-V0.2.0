import { ExecutionPlan, ExecutionPlanStatus } from "./execution-plan";
import { AgentHandoff, HandoffPayload } from "./handoff-payload";
import { PlanStep, PlanStepStatus } from "./plan-step";

export interface IExecutionPlanRepository {
    create(input: Omit<ExecutionPlan, "createdAt" | "updatedAt"> & Partial<Pick<ExecutionPlan, "createdAt" | "updatedAt">>): Promise<ExecutionPlan>;
    findById(planId: string, tenantId?: string): Promise<ExecutionPlan | null>;
    findByTaskId(taskId: string, tenantId: string): Promise<ExecutionPlan | null>;
    findByTenant(tenantId: string): Promise<ExecutionPlan[]>;
    updateStatus(planId: string, status: ExecutionPlanStatus): Promise<void>;
    softDelete(planId: string, tenantId: string, deletedAt?: Date): Promise<void>;
}

export interface IPlanStepRepository {
    create(input: Omit<PlanStep, "createdAt" | "updatedAt"> & Partial<Pick<PlanStep, "createdAt" | "updatedAt">>): Promise<PlanStep>;
    createMany(input: Array<Omit<PlanStep, "createdAt" | "updatedAt"> & Partial<Pick<PlanStep, "createdAt" | "updatedAt">>>): Promise<PlanStep[]>;
    findById(stepId: string, tenantId?: string): Promise<PlanStep | null>;
    findByPlanId(planId: string, tenantId?: string): Promise<PlanStep[]>;
    findCompletedByPlanId(planId: string, tenantId?: string): Promise<PlanStep[]>;
    updateStatus(stepId: string, status: PlanStepStatus): Promise<void>;
    update(stepId: string, patch: Partial<PlanStep>): Promise<PlanStep>;
    softDeleteByPlanId(planId: string, tenantId: string, deletedAt?: Date): Promise<void>;
}

export interface IAgentHandoffRepository {
    create(input: Omit<AgentHandoff, "createdAt"> & Partial<Pick<AgentHandoff, "createdAt">>): Promise<AgentHandoff>;
    findByPlanId(planId: string, tenantId?: string): Promise<AgentHandoff[]>;
    findByAgentId(agentId: string, tenantId: string): Promise<AgentHandoff[]>;
    updateStatus(handoffId: string, status: AgentHandoff["status"], result?: Record<string, unknown>): Promise<void>;
}

export interface PlannerAgentSummary {
    id: string;
    name: string;
    description?: string;
    capabilities: string[];
}

export interface IAgentRepository {
    findByTenant(tenantId: string): Promise<PlannerAgentSummary[]>;
}

export interface PlannerLlmResponse {
    title: string;
    description?: string;
    requiresApproval: boolean;
    steps: Array<{
        id?: string;
        stepIndex: number;
        title: string;
        description?: string;
        agentId: string;
        skillId?: string;
        dependsOn: string[];
        canRunParallel?: boolean;
        requiresApproval?: boolean;
        continuationInstructions?: string;
        expectedOutputFormat?: string;
        maxRetries?: number;
    }>;
}

export interface ILlmRouter {
    complete(input: {
        prompt: string;
        capability: string;
        tenantId: string;
        agentId: string;
    }): Promise<{ content: string }>;
}

export interface IAuditService {
    log(action: string, resourceId: string, requestedBy: string, metadata?: Record<string, unknown>): Promise<void>;
}

export interface IPlanEventEmitter {
    emit(eventName: string, payload: Record<string, unknown>): void;
}

export interface IPlannerQueue {
    add(jobName: string, payload: Record<string, unknown>): Promise<void>;
    removeJobs(jobIdPattern: string): Promise<void>;
}

export interface IApprovalService {
    requestApproval(input: {
        tenantId: string;
        planId: string;
        stepId: string;
        requestedBy: string;
    }): Promise<void>;
}

export interface IKnowledgeService {
    retrieve(input: { agentId: string; query: string; limit: number }): Promise<Array<{ id: string }>>;
}

export interface IMemoryService {
    retrieveForContext(input: { agentId: string; context: string; limit: number }): Promise<{
        episodic: Array<{ id: string }>;
        semantic: Array<{ content: string }>;
    }>;
}

export interface ITaskExecutionPort {
    execute(input: {
        tenantId: string;
        taskId: string;
        agentId: string;
        payload: HandoffPayload;
    }): Promise<Record<string, unknown>>;
}
