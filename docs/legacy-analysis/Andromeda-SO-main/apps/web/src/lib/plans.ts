import { getApiBaseUrl } from './runtime-config';
import { apiFetch, getApiToken } from './api-auth';

export interface PlanStepSummary {
    id: string;
    stepIndex: number;
    title: string;
    description?: string;
    agentId: string;
    status: string;
    canRunParallel: boolean;
    requiresApproval: boolean;
    dependsOn: string[];
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
}

export interface ExecutionPlanSummary {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    status: string;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    requiresApproval: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PlanDetail extends ExecutionPlanSummary {
    steps: PlanStepSummary[];
}

export async function listPlans(): Promise<ExecutionPlanSummary[]> {
    const response = await apiFetch(`${getApiBaseUrl()}/v1/plans`, {
        headers: { Authorization: `Bearer ${getApiToken()}` },
    });
    if (!response.ok) {
        throw new Error('Falha ao carregar planos.');
    }
    return response.json() as Promise<ExecutionPlanSummary[]>;
}

export async function getPlan(planId: string): Promise<PlanDetail> {
    const response = await apiFetch(`${getApiBaseUrl()}/v1/plans/${planId}`, {
        headers: { Authorization: `Bearer ${getApiToken()}` },
    });
    if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do plano.');
    }
    return response.json() as Promise<PlanDetail>;
}

export async function executePlan(planId: string): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/v1/plans/${planId}/execute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getApiToken()}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || 'Falha ao executar plano.');
    }
}

export async function approvePlanStep(planId: string, stepId: string): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/v1/plans/${planId}/steps/${stepId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getApiToken()}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || 'Falha ao aprovar step.');
    }
}

export async function rollbackPlan(planId: string): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/v1/plans/${planId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getApiToken()}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || 'Falha ao reverter plano.');
    }
}