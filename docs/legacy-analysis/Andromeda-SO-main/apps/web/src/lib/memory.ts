import { getApiBaseUrl } from './runtime-config';
import { apiFetch, withApiAuth } from './api-auth';

export type MemoryType = 'session' | 'episodic' | 'semantic';
export type MemoryScopeType = 'session' | 'task' | 'agent' | 'project' | 'user' | 'team';
export type MemoryStatus = 'active' | 'archived' | 'invalidated' | 'deleted';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  scopeType: MemoryScopeType;
  scopeId: string;
  agentId?: string | null;
  taskId?: string | null;
  sessionId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  teamId?: string | null;
  title: string;
  content: string;
  summary?: string | null;
  tags: string[];
  source: string;
  sourceEventId?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  isPinned: boolean;
  status: MemoryStatus;
  importanceScore: number;
  metadata: Record<string, unknown>;
}

export interface MemoryRetrievalRecord {
  id: string;
  taskId: string;
  agentId?: string | null;
  sessionId?: string | null;
  memoryEntryId: string;
  retrievalReason: string;
  retrievalScore: number;
  usedInPromptAssembly: boolean;
  usedAt: string;
  createdAt: string;
}

export interface MemoryPolicy {
  id: string;
  memoryType: MemoryType;
  scopeType: MemoryScopeType;
  retentionMode: 'ttl' | 'session' | 'task' | 'persistent';
  ttlDays?: number | null;
  maxEntries?: number | null;
  allowAutoPromotion: boolean;
  allowManualPin: boolean;
  allowSemanticExtraction: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryRetrieveRequest {
  taskId: string;
  agentId?: string;
  sessionId?: string;
  projectId?: string;
  userId?: string;
  teamId?: string;
  interactionMode?: string;
  prompt: string;
  limit?: number;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
    throw new Error('A API de memórias não respondeu JSON. Verifique o backend e o proxy do Vite.');
  }

  throw new Error(text || 'Resposta inválida da API de memórias.');
}

export function listMemory(params: Record<string, string | number | boolean | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  return requestJson<MemoryEntry[]>(`${getApiBaseUrl()}/memory${query.toString() ? `?${query.toString()}` : ''}`);
}

export function getMemory(id: string) {
  return requestJson<MemoryEntry>(`${getApiBaseUrl()}/memory/${id}`);
}

export function getMemoryLinks(id: string) {
  return requestJson<Array<{ id: string; linkedEntityType: string; linkedEntityId: string; relationType: string; createdAt: string }>>(`${getApiBaseUrl()}/memory/${id}/links`);
}

export function getMemoryUsage(id: string) {
  return requestJson<MemoryRetrievalRecord[]>(`${getApiBaseUrl()}/memory/${id}/usage`);
}

export function listMemoryPolicies() {
  return requestJson<MemoryPolicy[]>(`${getApiBaseUrl()}/memory/policies`);
}

export function retrieveMemory(request: MemoryRetrieveRequest) {
  return requestJson<{ entries: MemoryEntry[]; blocks: string[] }>(`${getApiBaseUrl()}/memory/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export function pinMemory(id: string) {
  return requestJson<MemoryEntry>(`${getApiBaseUrl()}/memory/${id}/pin`, { method: 'POST' });
}

export function invalidateMemory(id: string) {
  return requestJson<MemoryEntry>(`${getApiBaseUrl()}/memory/${id}/invalidate`, { method: 'POST' });
}

export function promoteMemory(id: string, targetType: MemoryType = 'semantic') {
  return requestJson<MemoryEntry>(`${getApiBaseUrl()}/memory/${id}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType }),
  });
}

export function deleteMemory(id: string) {
  return fetch(`${getApiBaseUrl()}/memory/${id}`, withApiAuth({ method: 'DELETE' }));
}
