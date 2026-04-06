import { getApiBaseUrl } from './runtime-config';
import { apiFetch, getApiToken } from './api-auth';

export interface GatewayTaskResponse {
    task?: {
        id: string;
        status: string;
    };
}

export interface GatewayTaskStatus {
    taskId: string;
    status: string;
    updatedAt: string;
    result?: {
        content?: string;
        model?: string;
        error?: string;
        agent?: {
            id: string;
            name: string;
            role: string;
            version: string;
        };
        audit?: {
            overallConformanceScore: number;
            status: string;
            violations: string[];
        };
    };
    auditParecer?: {
        overallConformanceScore: number;
        status: string;
        violations: string[];
    };
}

export interface TaskFeedbackItem {
    id: string;
    taskId: string;
    agentId: string;
    userId: string;
    rating: number;
    comment: string | null;
    submittedAt: string;
}

export interface TaskFeedbackSummary {
    taskId: string;
    items: TaskFeedbackItem[];
    summary: {
        positive: number;
        negative: number;
        score: number;
    };
}

export function getGatewayAuthHeaders(): HeadersInit {
    const token = getApiToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export async function createGatewayTask(payload: unknown): Promise<GatewayTaskResponse> {
    const response = await apiFetch(`${getApiBaseUrl()}/gateway/message`, {
        method: 'POST',
        headers: getGatewayAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errorBody?.error?.message || 'Erro ao enviar o teste para o gateway.');
    }

    return response.json() as Promise<GatewayTaskResponse>;
}

export async function pollGatewayTask(taskId: string, attempts = 25, delayMs = 800): Promise<GatewayTaskStatus> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const response = await apiFetch(`${getApiBaseUrl()}/gateway/tasks/${taskId}/status`);
        if (!response.ok) {
            throw new Error('Falha ao consultar status da task.');
        }

        const status = await response.json() as GatewayTaskStatus;
        if (status.result) {
            return status;
        }
        if (status.status === 'failed' || status.status === 'completed') {
            return status;
        }

        await sleep(delayMs);
    }

    throw new Error('Timeout aguardando resposta da task.');
}

export async function submitTaskFeedback(taskId: string, payload: { rating: 1 | -1; comment?: string }): Promise<TaskFeedbackItem> {
    const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/feedback`, {
        method: 'POST',
        headers: getGatewayAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errorBody?.error?.message || 'Falha ao enviar feedback da task.');
    }

    return response.json() as Promise<TaskFeedbackItem>;
}

export async function getTaskFeedback(taskId: string): Promise<TaskFeedbackSummary> {
    const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/feedback`, {
        headers: getGatewayAuthHeaders(),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errorBody?.error?.message || 'Falha ao carregar feedback da task.');
    }

    return response.json() as Promise<TaskFeedbackSummary>;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}
