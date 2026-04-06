/**
 * Agent Mapper - Converte entre formato legado do backend e canônico do frontend
 *
 * Backend (legado) -> Frontend (canônico):
 * - personality -> persona
 * - responseStyle -> style
 * - systemInstructions -> systemPrompt (array -> string)
 * - goal -> objective
 * - description -> shortDescription
 *
 * Frontend (canônico) -> Backend (legado):
 * - persona -> personality
 * - style -> responseStyle
 * - systemPrompt -> systemInstructions (string -> array)
 * - objective -> goal
 * - shortDescription -> description
 */

import type { AgentInstance } from '../types/kernel.js';

// Tipo para representar o agente retornado pela API (formato legado)
export interface BackendAgent {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  description?: string;
  goal?: string;
  personality?: string;
  responseStyle?: string;
  systemInstructions?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Outros campos opcionais que podem vir do backend
  role?: string;
  templateId?: string | null;
  isActive?: boolean;
  visibility?: string;
  overrides?: Record<string, unknown>;
  [key: string]: unknown;
}

// Tipo para payload de atualização no backend
export interface BackendUpdatePayload {
  name?: string;
  description?: string;
  goal?: string;
  personality?: string;
  responseStyle?: string;
  systemInstructions?: string[];
  role?: string;
  status?: string;
  visibility?: string;
  isActive?: boolean;
  overrides?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Converte array de strings para string com separador duplo de newline
 */
function joinInstructions(instructions: string[] | undefined): string {
  if (!instructions || !Array.isArray(instructions)) return '';
  return instructions.join('\n\n');
}

/**
 * Converte string para array de instruções, split por separador duplo de newline
 */
function splitInstructions(systemPrompt: string | undefined): string[] {
  if (!systemPrompt || typeof systemPrompt !== 'string') return [];
  const split = systemPrompt.split(/\n\n+/);
  return split.filter(line => line.trim().length > 0);
}

/**
 * Valida e converte timestamp do backend para formato ISO
 */
function parseTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = new Date(value as string | number | Date);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

/**
 * Valida e converte status do backend para formato canônico
 */
function parseStatus(status: unknown): AgentInstance['status'] {
  const validStatuses: AgentInstance['status'][] = ['draft', 'active', 'inactive', 'archived', 'deleted'];
  if (typeof status === 'string' && validStatuses.includes(status as AgentInstance['status'])) {
    return status as AgentInstance['status'];
  }
  return 'draft';
}

/**
 * Valida e converte visibility para formato canônico
 */
function parseVisibility(visibility: unknown): AgentInstance['visibility'] {
  const validVisibilities: AgentInstance['visibility'][] = ['private', 'internal', 'public'];
  if (typeof visibility === 'string' && validVisibilities.includes(visibility as AgentInstance['visibility'])) {
    return visibility as AgentInstance['visibility'];
  }
  return 'private';
}

/**
 * Converte dados do backend (legado) para formato canônico do frontend
 *
 * @param agent - Dados retornados pela API do backend
 * @returns Agente no formato canônico do frontend
 */
export function mapBackendToFrontend(agent: BackendAgent): AgentInstance {
  if (!agent || typeof agent !== 'object') {
    throw new Error('Invalid agent data: expected object');
  }

  const now = new Date().toISOString();
  const overrides = (agent.overrides as Record<string, unknown>) || {};

  return {
    // Identidade (campos diretos)
    id: String(agent.id ?? ''),
    name: String(agent.name ?? ''),
    slug: String(agent.slug ?? agent.name ?? ''),
    owner: '',
    source: '',
    version: '1.0.0',

    // Status e visibilidade
    status: parseStatus(agent.status),
    visibility: parseVisibility(agent.visibility),
    isActive: Boolean(agent.isActive ?? false),

    // Mapeamento de campos legados para canônicos
    shortDescription: String(agent.description ?? ''),
    longDescription: '',
    objective: String(agent.goal ?? ''),
    persona: String(agent.personality ?? ''),
    style: String(agent.responseStyle ?? ''),
    systemPrompt: joinInstructions(agent.systemInstructions),

    // Papel e objetivo
    role: String(agent.role ?? ''),
    mission: '',
    domain: '',
    successCriteria: [],

    // Personalidade (campos canônicos sem equivalente no backend)
    tone: '',
    behaviorProfile: '',
    interactionMode: 'reactive',
    defaultLanguage: 'pt-BR',
    tags: [],
    categories: [],

    // Instruções e políticas
    operatingInstructions: [],
    doRules: [],
    dontRules: [],
    guardrails: [],
    escalationRules: [],

    // Template e origem
    templateId: agent.templateId ?? null,
    isTemplateDerived: Boolean(agent.templateId),
    templateSource: null,
    templateVariant: null,
    templateManifestRef: null,
    originTemplateVersion: null,
    templateDefaultsSnapshot: null,
    templateInheritanceMode: 'copy-on-create',
    templateLockPolicy: 'none',

    // Modelo e execução (lê de overrides se existir)
    preferredModel: (overrides.preferredModel as string | null) ?? null,
    allowedModels: (overrides.allowedModels as string[]) ?? [],
    providerConstraints: (overrides.providerConstraints as string[]) ?? [],
    channelConstraints: (overrides.channelConstraints as string[]) ?? [],
    temperature: (overrides.temperature as number) ?? 0.7,
    topP: (overrides.topP as number) ?? 1.0,
    maxTokens: (overrides.maxTokens as number | null) ?? null,
    responseFormat: (overrides.responseFormat as AgentInstance['responseFormat']) ?? 'text',
    reasoningMode: (overrides.reasoningMode as AgentInstance['reasoningMode']) ?? null,
    timeoutMs: (overrides.timeoutMs as number) ?? 30000,
    retryPolicy: {
      maxRetries: (overrides.retryPolicy as { maxRetries?: number })?.maxRetries ?? 3,
      backoffMs: (overrides.retryPolicy as { backoffMs?: number })?.backoffMs ?? 1000,
      strategy: ((overrides.retryPolicy as { strategy?: string })?.strategy ?? 'exponential') as 'exponential' | 'fixed',
    },

    // Capacidades (defaults)
    toolsEnabled: false,
    knowledgeEnabled: false,
    memoryEnabled: false,
    routingEnabled: false,
    handoffEnabled: false,
    humanEscalationEnabled: false,
    capabilities: [],

    // Canais (defaults)
    allowedChannels: [],
    defaultChannelBehavior: {},
    channelOverrides: {},

    // Governança
    isEditable: true,
    auditMetadata: {
      createdBy: null,
      updatedBy: null,
      reason: null,
    },

    // Ciclo de vida
    originType: 'manual',
    cloneOfAgentId: null,
    isDeleted: false,
    deletedAt: null,
    activatedAt: null,
    deactivatedAt: null,
    createdAt: parseTimestamp(agent.createdAt),
    updatedAt: parseTimestamp(agent.updatedAt),

    // Resolução de configuração
    overrides: agent.overrides ?? {},
    explicitParameters: {},
    resolvedConfig: null,
    resolutionTrace: null,
    effectiveSystemPrompt: null,
    effectiveBehaviorProfile: null,
    effectiveExecutionPolicy: null,
    effectiveChannelPolicy: null,
    effectiveModelPolicy: null,
    configSnapshotVersion: 1,
    lastResolvedAt: null,
    lastValidatedAt: null,
  };
}

/**
 * Converte atualizações canônicas do frontend para formato legado do backend
 *
 * @param updates - Atualizações no formato canônico do frontend
 * @returns Payload para enviar à API do backend
 */
export function mapFrontendToBackend(updates: Partial<AgentInstance>): BackendUpdatePayload {
  if (!updates || typeof updates !== 'object') {
    throw new Error('Invalid updates: expected object');
  }

  const payload: BackendUpdatePayload = {};

  // Campos diretos (sem transformação)
  if ('name' in updates && updates.name !== undefined) {
    payload.name = updates.name;
  }

  if ('role' in updates && updates.role !== undefined) {
    payload.role = updates.role;
  }

  if ('status' in updates && updates.status !== undefined) {
    payload.status = updates.status;
  }

  if ('visibility' in updates && updates.visibility !== undefined) {
    payload.visibility = updates.visibility;
  }

  if ('isActive' in updates && updates.isActive !== undefined) {
    payload.isActive = updates.isActive;
  }

  // Mapeamento de campos canônicos para legados
  if ('shortDescription' in updates && updates.shortDescription !== undefined) {
    payload.description = updates.shortDescription;
  }

  if ('objective' in updates && updates.objective !== undefined) {
    payload.goal = updates.objective;
  }

  if ('persona' in updates && updates.persona !== undefined) {
    payload.personality = updates.persona;
  }

  if ('style' in updates && updates.style !== undefined) {
    payload.responseStyle = updates.style;
  }

  if ('systemPrompt' in updates && updates.systemPrompt !== undefined) {
    payload.systemInstructions = splitInstructions(updates.systemPrompt);
  }

  // Preserva overrides se existirem
  if ('overrides' in updates && updates.overrides !== undefined) {
    payload.overrides = updates.overrides;
  }

  // Campos de modelo e execução
  if ('preferredModel' in updates && updates.preferredModel !== undefined) {
    // O backend pode não suportar preferredModel diretamente
    // Então vamos colocar nos overrides
    payload.overrides = {
      ...payload.overrides,
      preferredModel: updates.preferredModel
    };
  }

  if ('temperature' in updates && updates.temperature !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      temperature: updates.temperature
    };
  }

  if ('maxTokens' in updates && updates.maxTokens !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      maxTokens: updates.maxTokens
    };
  }

  if ('timeoutMs' in updates && updates.timeoutMs !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      timeoutMs: updates.timeoutMs
    };
  }

  if ('topP' in updates && updates.topP !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      topP: updates.topP
    };
  }

  if ('responseFormat' in updates && updates.responseFormat !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      responseFormat: updates.responseFormat
    };
  }

  if ('reasoningMode' in updates && updates.reasoningMode !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      reasoningMode: updates.reasoningMode
    };
  }

  if ('retryPolicy' in updates && updates.retryPolicy !== undefined) {
    payload.overrides = {
      ...payload.overrides,
      retryPolicy: updates.retryPolicy
    };
  }

  return payload;
}

/**
 * Converte array de agentes do backend para array de agentes canônicos
 *
 * @param agents - Lista de agentes retornada pela API
 * @returns Lista de agentes no formato canônico
 */
export function mapBackendAgentsToFrontend(agents: BackendAgent[]): AgentInstance[] {
  if (!Array.isArray(agents)) return [];
  return agents.map(mapBackendToFrontend);
}
