import { apiFetch } from './api-auth';
import { getApiBaseUrl } from './runtime-config';

export interface CostsSummaryPoint {
  bucket: string;
  costUsd: number;
  tokensUsed: number;
  executions: number;
}

export interface CostsSummaryView {
  range: { from: string; to: string };
  currency: string;
  totals: {
    costUsd: number;
    tokensUsed: number;
    executions: number;
    avgCostPerExecutionUsd: number;
  };
  series: CostsSummaryPoint[];
}

export interface CostsByAgentItem {
  agentId: string;
  executions: number;
  tokensUsed: number;
  costUsd: number;
  avgLatencyMs: number | null;
}

export interface CostsByAgentView {
  range: { from: string; to: string };
  items: CostsByAgentItem[];
}

export async function getCostsSummary(params?: { from?: string; to?: string }): Promise<CostsSummaryView> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const response = await apiFetch(`${getApiBaseUrl()}/costs/summary${query.size > 0 ? `?${query}` : ''}`);
  ensureOk(response, 'Falha ao carregar o resumo de custos.');
  return response.json() as Promise<CostsSummaryView>;
}

export async function getCostsByAgent(params?: { from?: string; to?: string; limit?: number }): Promise<CostsByAgentView> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
  const response = await apiFetch(`${getApiBaseUrl()}/costs/by-agent${query.size > 0 ? `?${query}` : ''}`);
  ensureOk(response, 'Falha ao carregar os custos por agente.');
  return response.json() as Promise<CostsByAgentView>;
}

export async function exportCostsCsv(payload: { from?: string; to?: string; groupBy?: 'agent' | 'day' }): Promise<{ fileName: string; contentType: string; data: string; }> {
  const response = await apiFetch(`${getApiBaseUrl()}/costs/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao exportar custos em CSV.');
  return response.json() as Promise<{ fileName: string; contentType: string; data: string; }>;
}

function ensureOk(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
}
