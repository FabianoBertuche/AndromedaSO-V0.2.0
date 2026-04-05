import type { Agent, CostData } from '../types/kernel';
import type { MultiTaskResponse, OrchestrationDetail, OrchestratorStatus } from '../types/kernel';
import type {
  AgentInstance,
  AgentTemplateManifest,
  ResolvedAgentConfig,
  CreateAgentInput,
  UpdateAgentInput,
  DuplicateAgentInput,
  LoadAgentInput
} from '../types/kernel';
import type {
  CatalogModel,
  ChatModelOption,
  ConsoleApiError,
  ModelBenchmark,
  Provider,
  ProviderConfig,
  ProviderConnectionTestRequest,
  ProviderConnectionTestResponse,
  ProviderConsoleSavePayload,
  ProviderHealthSummary,
  ProviderVariant,
  ProviderVariantAuthMode,
  ProviderVariantCatalogResponse,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../types/model';

export type ChatModelOptionsBuildResult = {
  options: ChatModelOption[];
  ambiguousModelIds: string[];
};

const providerVariants = new Set<ProviderVariant>(['ollama', 'openai-api', 'openai-oauth']);
const providerVariantAuthModes = new Set<ProviderVariantAuthMode>(['api-key', 'base-url', 'oauth-manual']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function readProviderVariant(value: unknown): ProviderVariant | null {
  return typeof value === 'string' && providerVariants.has(value as ProviderVariant)
    ? value as ProviderVariant
    : null;
}

function readProviderVariantAuthMode(value: unknown): ProviderVariantAuthMode | null {
  return typeof value === 'string' && providerVariantAuthModes.has(value as ProviderVariantAuthMode)
    ? value as ProviderVariantAuthMode
    : null;
}

function normalizeProviderVariantCatalogResponse(payload: unknown): ProviderVariantCatalogResponse {
  if (!isRecord(payload)) {
    return { group: 'providers', variants: [] };
  }

  const variants = Array.isArray(payload.variants)
    ? payload.variants.flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }

      const variant = readProviderVariant(item.variant);
      const authMode = readProviderVariantAuthMode(item.authMode);
      const displayName = typeof item.displayName === 'string' && item.displayName.trim()
        ? item.displayName
        : variant;

      if (!variant || !authMode || !displayName) {
        return [];
      }

      return [{
        variant,
        moduleId: typeof item.moduleId === 'string' ? item.moduleId : undefined,
        group: 'providers' as const,
        authMode,
        displayName,
        description: typeof item.description === 'string' ? item.description : undefined,
        capabilities: readStringArray(item.capabilities),
        requiredFields: readStringArray(item.requiredFields),
        optionalFields: readStringArray(item.optionalFields),
        status: typeof item.status === 'string' ? item.status : undefined,
        saveAllowsDegradedHealth: typeof item.saveAllowsDegradedHealth === 'boolean'
          ? item.saveAllowsDegradedHealth
          : undefined
      }];
    })
    : [];

  return {
    group: 'providers',
    variants
  };
}

function normalizeProviderCatalogResponse(payload: unknown): { providerId: string; selectedModelIds: string[]; models: CatalogModel[] } {
  if (!isRecord(payload)) {
    return { providerId: '', selectedModelIds: [], models: [] };
  }

  return {
    providerId: typeof payload.providerId === 'string' ? payload.providerId : '',
    selectedModelIds: readStringArray(payload.selectedModelIds),
    models: Array.isArray(payload.models) ? payload.models as CatalogModel[] : []
  };
}

function normalizeSendChatMessageResponse(payload: unknown): SendChatMessageResponse {
  if (!isRecord(payload) || !isRecord(payload.message)) {
    throw new Error('Invalid provider chat response.');
  }

  const role = payload.message.role;
  const content = payload.message.content;

  if (role !== 'assistant' || typeof content !== 'string' || !content.trim()) {
    throw new Error('Invalid provider chat response.');
  }

  return {
    message: {
      role: 'assistant',
      content
    }
  };
}

export function buildChatModelOptions(
  providers: Provider[],
  catalogs: Array<{ providerId: string; models: CatalogModel[] }>
): ChatModelOptionsBuildResult {
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const optionsByModelId = new Map<string, ChatModelOption[]>();

  catalogs.forEach((catalog) => {
    const provider = providersById.get(catalog.providerId);

    if (!provider || catalog.models.length === 0) {
      return;
    }

    const originLabel = provider.variant ?? provider.name;

    catalog.models.forEach((model) => {
      const nextOption: ChatModelOption = {
        providerId: provider.id,
        providerName: provider.name,
        modelId: model.modelId,
        displayName: model.displayName,
        label: `${model.displayName} - ${originLabel}`
      };

      const existingOptions = optionsByModelId.get(model.modelId) ?? [];
      optionsByModelId.set(model.modelId, [...existingOptions, nextOption]);
    });
  });

  const options: ChatModelOption[] = [];
  const ambiguousModelIds: string[] = [];

  optionsByModelId.forEach((modelOptions, modelId) => {
    if (modelOptions.length === 1) {
      options.push(modelOptions[0]);
      return;
    }

    ambiguousModelIds.push(modelId);
  });

  return {
    options,
    ambiguousModelIds: ambiguousModelIds.sort((left, right) => left.localeCompare(right))
  };
}

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

export type CreateOpenAiCodexOAuthSessionRequest = {
  origin: string;
};

export type CreateOpenAiCodexOAuthSessionResponse = {
  authUrl: string;
  expiresAt: string;
  redirectUri: string;
  mode: 'manual';
};

export type CompleteOpenAiCodexOAuthRequest =
  | { callbackUrl: string }
  | { code: string; state: string };

export type CompleteOpenAiCodexOAuthResponse = {
  provider: Provider;
  models: CatalogModel[];
};

export type RefreshOpenAiCodexTokenRequest = {
  providerId: string;
};

export type RefreshOpenAiCodexTokenResponse = {
  refreshed: true;
  expiresIn?: number;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Kernel request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function readApiError(response: Response, fallbackMessage: string): Promise<Error> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json() as {
      error?: string;
      code?: string;
      health?: ProviderHealthSummary;
      details?: Record<string, unknown>;
    };
    const error = new Error(payload.error ?? fallbackMessage) as ConsoleApiError;
    error.code = payload.code;
    error.health = payload.health;
    error.details = payload.details;
    return error;
  }

  const text = await response.text();
  return new Error(text || fallbackMessage);
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
  // /agents list endpoint does not exist — use /api/modules as the source of agent IDs
  const response = await fetch('/api/modules');
  if (!response.ok) return [];
  const payload = await response.json() as { modules?: Array<{ id: string }> };
  return (payload.modules ?? []).map((item) => item.id);
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

export async function createMultiTask(task: string): Promise<MultiTaskResponse> {
  const response = await fetch('/tasks/multi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ task })
  });

  return parseJson<MultiTaskResponse>(response);
}

export async function fetchOrchestration(taskId: string): Promise<OrchestrationDetail> {
  const response = await fetch(`/tasks/${encodeURIComponent(taskId)}/orchestration`);
  return parseJson<OrchestrationDetail>(response);
}

export async function sendAgentMessage(from: string, to: string, content: string, taskId?: string): Promise<{ delivered: boolean }> {
  const response = await fetch(`/agents/${encodeURIComponent(from)}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, content, taskId })
  });
  return parseJson<{ delivered: boolean }>(response);
}

export async function fetchOrchestratorStatus(): Promise<OrchestratorStatus> {
  const response = await fetch('/orchestrator/status');
  return parseJson<OrchestratorStatus>(response);
}

export function openOrchestratorStream(taskId: string): EventSource {
  return new EventSource(`/orchestrator/${encodeURIComponent(taskId)}/stream`);
}

export async function createProvider(payload: ProviderConfig): Promise<Provider> {
  const response = await fetch('/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `Create provider failed: ${response.status}`);
  }

  return response.json() as Promise<Provider>;
}

export async function listProviders(): Promise<{ providers: Provider[] }> {
  const response = await fetch('/api/providers');
  return parseJson<{ providers: Provider[] }>(response);
}

export async function listProviderVariants(): Promise<ProviderVariantCatalogResponse> {
  const response = await fetch('/api/providers/variants');

  if (!response.ok) {
    throw await readApiError(response, `List provider variants failed: ${response.status}`);
  }

  const payload = await response.json() as unknown;
  return normalizeProviderVariantCatalogResponse(payload);
}

export async function testProviderConnection(payload: ProviderConnectionTestRequest): Promise<ProviderConnectionTestResponse> {
  const response = await fetch('/api/providers/connection-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `Provider connection test failed: ${response.status}`);
  }

  return response.json() as Promise<ProviderConnectionTestResponse>;
}

export async function saveProviderConsoleConfiguration(payload: ProviderConsoleSavePayload): Promise<Provider> {
  const response = await fetch('/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `Save provider configuration failed: ${response.status}`);
  }

  return response.json() as Promise<Provider>;
}

export async function syncProviderModels(providerId: string): Promise<{ providerId: string; models: CatalogModel[] }> {
  const response = await fetch(`/api/providers/${encodeURIComponent(providerId)}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return parseJson<{ providerId: string; models: CatalogModel[] }>(response);
}

export async function createOpenAiCodexOAuthSession(
  payload: CreateOpenAiCodexOAuthSessionRequest
): Promise<CreateOpenAiCodexOAuthSessionResponse> {
  const response = await fetch('/api/providers/openai-oauth/oauth/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `OpenAI OAuth sign-in start failed: ${response.status}`);
  }

  return response.json() as Promise<CreateOpenAiCodexOAuthSessionResponse>;
}

export async function completeOpenAiCodexOAuth(
  payload: CompleteOpenAiCodexOAuthRequest
): Promise<CompleteOpenAiCodexOAuthResponse> {
  const response = await fetch('/api/providers/openai-oauth/oauth/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `OpenAI OAuth sign-in completion failed: ${response.status}`);
  }

  return response.json() as Promise<CompleteOpenAiCodexOAuthResponse>;
}

export async function getProviderHealth(providerId: string): Promise<{ providerId: string; health: string; latencyMs: number; healthDetails?: ProviderHealthSummary }> {
  const response = await fetch(`/api/providers/${encodeURIComponent(providerId)}/health`);
  return parseJson<{ providerId: string; health: string; latencyMs: number; healthDetails?: ProviderHealthSummary }>(response);
}

export async function getProviderCatalog(providerId: string): Promise<{ providerId: string; selectedModelIds: string[]; models: CatalogModel[] }> {
  const response = await fetch(`/api/providers/${encodeURIComponent(providerId)}/models`);
  const payload = await parseJson<unknown>(response);
  return normalizeProviderCatalogResponse(payload);
}

export async function saveProviderSelectedModels(providerId: string, modelIds: string[]) {
  const response = await fetch(`/api/providers/${encodeURIComponent(providerId)}/models/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelIds })
  });
  return parseJson<{ providerId: string; selectedModelIds: string[] }>(response);
}

export async function sendModelChatMessage(payload: SendChatMessageRequest): Promise<SendChatMessageResponse> {
  const response = await fetch('/api/providers/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await readApiError(response, `Provider chat failed: ${response.status}`);
  }

  const responsePayload = await response.json() as unknown;
  return normalizeSendChatMessageResponse(responsePayload);
}

export async function benchmarkModel(modelId: string, taskType: 'coding' | 'chat'): Promise<{ result: ModelBenchmark & { success: boolean } }> {
  const response = await fetch('/api/llm-router/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, taskType })
  });
  return parseJson<{ result: ModelBenchmark & { success: boolean } }>(response);
}

export async function inferRouting(taskType: 'coding' | 'chat'): Promise<{ decision: { selectedModel: string; score: number } }> {
  const response = await fetch('/api/llm-router/infer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType })
  });
  return parseJson<{ decision: { selectedModel: string; score: number } }>(response);
}

export async function listRoutingDecisions(): Promise<{ decisions: Array<{ taskType: string; selectedModel: string; score: number }> }> {
  const response = await fetch('/api/llm-router/decisions');
  return parseJson<{ decisions: Array<{ taskType: string; selectedModel: string; score: number }> }>(response);
}

export async function listRouterRankings() {
  const response = await fetch('/api/llm-router/rankings');
  return parseJson<{ ranked: Array<{ modelId: string; displayName: string; contextWindow: string; capabilities: string[]; priceLabel: string; score: number; latencyMs: number }> }>(response);
}

export function openProviderHealthStream(providerId: string): EventSource {
  return new EventSource(`/api/providers/${encodeURIComponent(providerId)}/health/stream`);
}

export async function deleteProvider(id: string): Promise<void> {
  const response = await fetch(`/api/providers/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const body = await response.json() as { error?: string };
    throw new Error(body.error ?? `Delete failed: ${response.status}`);
  }
}

// ============================================
// AGENTS MODULE API
// ============================================

async function parseJsonAgents<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

// Listar templates disponíveis
export async function listAgentTemplates(): Promise<AgentTemplateManifest[]> {
  const response = await fetch('/api/agents/templates');
  const data = await parseJsonAgents<{ templates: AgentTemplateManifest[] }>(response);
  return data.templates;
}

// Listar todos os agentes
export async function listAgents(): Promise<AgentInstance[]> {
  const response = await fetch('/api/agents');
  const data = await parseJsonAgents<{ agents: AgentInstance[] }>(response);
  return data.agents;
}

// Obter detalhe de um agente
export async function getAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`);
  return parseJsonAgents<AgentInstance>(response);
}

// Criar agente a partir de template
export async function createAgent(payload: CreateAgentInput): Promise<AgentInstance> {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonAgents<AgentInstance>(response);
}

// Atualizar agente existente
export async function updateAgent(agentId: string, payload: UpdateAgentInput): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonAgents<AgentInstance>(response);
}

// Deletar agente (soft delete)
export async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}

// Duplicar agente
export async function duplicateAgent(agentId: string, payload?: DuplicateAgentInput): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  return parseJsonAgents<AgentInstance>(response);
}

// Ativar agente
export async function activateAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/activate`, {
    method: 'POST'
  });
  return parseJsonAgents<AgentInstance>(response);
}

// Desativar agente
export async function deactivateAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/deactivate`, {
    method: 'POST'
  });
  return parseJsonAgents<AgentInstance>(response);
}

// Carregar configuração resolvida
export async function loadAgentConfig(agentId: string, payload?: LoadAgentInput): Promise<ResolvedAgentConfig> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  return parseJsonAgents<ResolvedAgentConfig>(response);
}
