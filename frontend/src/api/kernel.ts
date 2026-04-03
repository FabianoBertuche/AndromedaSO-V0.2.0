import type { Agent, CostData } from '../types/kernel';

export type KernelStatus = {
  status: 'healthy' | 'ok' | 'degraded' | string;
  registrySize: number;
  activeModules: string[];
  metrics: {
    retry_storm_total: number;
  };
};

export type DiscoverModulesRequest = {
  rootPath: string;
};

export type DiscoverModulesResponse = {
  registered: Array<{
    id: string;
    state: string;
  }>;
};

export type AgentPerformanceResponse = {
  agentId: string;
  records: Array<{
    date: string;
    latencyP95: number;
    successRate: number;
    throughput: number;
  }>;
};

export type AgentReputationResponse = Record<string, number>;

export type AgentBudgetResponse = {
  agentId: string;
  budget: {
    dailyLimit: number;
    monthlyLimit: number;
    spentDaily: number;
    spentMonthly: number;
  } | null;
};

export type TaskFeedbackRequest = {
  taskId: string;
  agentId: string;
  capability: string;
  thumbs: boolean;
  note?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Kernel request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchKernelStatus(): Promise<KernelStatus> {
  const response = await fetch('/status');
  return parseJson<KernelStatus>(response);
}

export async function discoverModules(payload: DiscoverModulesRequest): Promise<DiscoverModulesResponse> {
  const response = await fetch('/api/modules/discover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return parseJson<DiscoverModulesResponse>(response);
}

export async function fetchAgentPerformance(agentId: string): Promise<AgentPerformanceResponse> {
  const response = await fetch(`/agents/${encodeURIComponent(agentId)}/performance`);
  return parseJson<AgentPerformanceResponse>(response);
}

export async function fetchAgentReputation(agentId: string): Promise<AgentReputationResponse> {
  const response = await fetch(`/agents/${encodeURIComponent(agentId)}/reputation`);
  return parseJson<AgentReputationResponse>(response);
}

export async function fetchAgentBudget(agentId: string): Promise<AgentBudgetResponse> {
  const response = await fetch(`/agents/${encodeURIComponent(agentId)}/budget`);
  return parseJson<AgentBudgetResponse>(response);
}

export async function fetchAgents(): Promise<string[]> {
  const directResponse = await fetch('/agents');
  if (directResponse.ok) {
    const payload = await directResponse.json() as unknown;
    if (Array.isArray(payload)) {
      return payload.map((value) => typeof value === 'string' ? value : String((value as any)?.id)).filter(Boolean);
    }
    if (Array.isArray((payload as any)?.agents)) {
      return (payload as any).agents
        .map((value: any) => typeof value === 'string' ? value : String(value?.id))
        .filter(Boolean);
    }
  }

  const fallbackResponse = await fetch('/api/modules');
  const fallbackPayload = await parseJson<{ modules: Array<{ id: string }> }>(fallbackResponse);
  return fallbackPayload.modules.map((item) => item.id);
}

export async function fetchAgent(agentId: string): Promise<Agent> {
  const [performance, reputation, budget] = await Promise.all([
    fetchAgentPerformance(agentId),
    fetchAgentReputation(agentId),
    fetchAgentBudget(agentId)
  ]);

  const latestPerformance = performance.records[performance.records.length - 1];
  const reputationValues = Object.values(reputation);
  const reputationScore = reputationValues.length > 0
    ? reputationValues.reduce((sum, value) => sum + value, 0) / reputationValues.length
    : 0;

  const spent = budget.budget?.spentDaily ?? 0;
  const limit = budget.budget?.dailyLimit ?? 0;

  return {
    id: agentId,
    performanceP95: latestPerformance?.latencyP95 ?? 0,
    successRate: latestPerformance?.successRate ?? 0,
    reputationScore,
    budgetSpent: spent,
    budgetLimit: limit
  };
}

export async function fetchCostDashboard(): Promise<CostData> {
  const primaryResponse = await fetch('/dashboard/costs');
  const contentType = primaryResponse.headers.get('content-type') ?? '';
  if (primaryResponse.ok && contentType.includes('application/json')) {
    return parseJson<CostData>(primaryResponse);
  }

  const fallbackResponse = await fetch('/dashboard/costs/data');
  return parseJson<CostData>(fallbackResponse);
}

export async function postTaskFeedback(payload: TaskFeedbackRequest): Promise<{ ok: boolean }> {
  const response = await fetch(`/tasks/${encodeURIComponent(payload.taskId)}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agentId: payload.agentId,
      capability: payload.capability,
      thumbs: payload.thumbs ? 'up' : 'down',
      note: payload.note
    })
  });

  if (!response.ok) {
    throw new Error(`Kernel request failed: ${response.status}`);
  }

  return { ok: true };
}
