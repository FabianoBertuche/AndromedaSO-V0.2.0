/**
 * Agent Mapper - Converte entre formato legado do backend e canônico do frontend.
 */

import type {
  AgentBehaviorContext,
  AgentBehaviorPlaybook,
  AgentBehaviorRules,
  AgentInstance,
  AgentMemoryConfig
} from '../types/kernel.js';

export interface BackendAgent {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  description?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions?: string[];
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  templateId?: string | null;
  isActive?: boolean;
  visibility?: string;
  overrides?: Record<string, unknown>;
  [key: string]: unknown;
}

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

const DEFAULT_MEMORY: AgentMemoryConfig = {
  memorySessionEnabled: true,
  memoryScopeType: 'session',
  memoryMaxEntries: 50,
  memoryShared: false,
  memoryRetentionPeriod: 'session'
};

const DEFAULT_RULES: AgentBehaviorRules = {
  must: [],
  mustNot: [],
  delegateWhen: [],
  reviewWhen: [],
  feedbackWhen: [],
  interruptWhen: [],
  evidenceWhen: []
};

const DEFAULT_PLAYBOOK: AgentBehaviorPlaybook = {
  start: [],
  execute: [],
  review: [],
  report: []
};

const DEFAULT_CONTEXT: AgentBehaviorContext = {
  stack: [],
  architecture: [],
  objectives: [],
  decisions: [],
  constraints: [],
  patterns: []
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function joinInstructions(instructions: string[] | undefined): string {
  if (!instructions || !Array.isArray(instructions)) return '';
  return instructions.join('\n\n');
}

function splitInstructions(systemPrompt: string | undefined): string[] {
  if (!systemPrompt || typeof systemPrompt !== 'string') return [];
  return systemPrompt.split(/\n\n+/).map((line) => line.trim()).filter(Boolean);
}

function parseTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseStatus(status: unknown): AgentInstance['status'] {
  const valid: AgentInstance['status'][] = ['draft', 'active', 'inactive', 'archived', 'deleted', 'disabled'];
  return typeof status === 'string' && valid.includes(status as AgentInstance['status'])
    ? (status as AgentInstance['status'])
    : 'draft';
}

function parseVisibility(visibility: unknown): AgentInstance['visibility'] {
  const valid: AgentInstance['visibility'][] = ['private', 'internal', 'public', 'team'];
  return typeof visibility === 'string' && valid.includes(visibility as AgentInstance['visibility'])
    ? (visibility as AgentInstance['visibility'])
    : 'private';
}

function setOverride(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

export function mapBackendToFrontend(agent: BackendAgent): AgentInstance {
  if (!agent || typeof agent !== 'object') {
    throw new Error('Invalid agent data: expected object');
  }

  const overrides = asRecord(agent.overrides);
  const rules = {
    ...DEFAULT_RULES,
    ...(asRecord(overrides.rules) as Partial<AgentBehaviorRules>)
  };
  const playbook = {
    ...DEFAULT_PLAYBOOK,
    ...(asRecord(overrides.playbook) as Partial<AgentBehaviorPlaybook>)
  };
  const context = {
    ...DEFAULT_CONTEXT,
    ...(asRecord(overrides.context) as Partial<AgentBehaviorContext>)
  };
  const memory = {
    ...DEFAULT_MEMORY,
    ...(asRecord(overrides.memory) as Partial<AgentMemoryConfig>)
  };

  memory.memorySessionEnabled = (overrides.memorySessionEnabled as boolean | undefined) ?? memory.memorySessionEnabled;
  memory.memoryScopeType = (overrides.memoryScopeType as AgentMemoryConfig['memoryScopeType'] | undefined) ?? memory.memoryScopeType;
  memory.memoryMaxEntries = (overrides.memoryMaxEntries as number | undefined) ?? memory.memoryMaxEntries;
  memory.memoryShared = (overrides.memoryShared as boolean | undefined) ?? memory.memoryShared;
  memory.memoryRetentionPeriod = (overrides.memoryRetentionPeriod as AgentMemoryConfig['memoryRetentionPeriod'] | undefined) ?? memory.memoryRetentionPeriod;

  return {
    id: String(agent.id ?? ''),
    name: String(agent.name ?? ''),
    slug: String(agent.slug ?? agent.name ?? ''),
    status: parseStatus(agent.status),
    visibility: parseVisibility(agent.visibility),
    owner: String(overrides.owner ?? 'system'),
    source: String(overrides.source ?? (agent.templateId ? 'template' : 'manual')),
    version: String(overrides.version ?? '1.0.0'),
    createdAt: parseTimestamp(agent.createdAt),
    updatedAt: parseTimestamp(agent.updatedAt),
    deletedAt: null,
    activatedAt: null,
    deactivatedAt: null,
    isDeleted: false,
    originType: 'manual',
    cloneOfAgentId: (overrides.cloneOfAgentId as string | null | undefined) ?? null,

    description: String(agent.description ?? ''),
    shortDescription: String(agent.description ?? ''),
    longDescription: String(overrides.longDescription ?? ''),

    role: String(agent.role ?? ''),
    goal: String(agent.goal ?? ''),
    objective: String(agent.goal ?? ''),
    mission: String(overrides.mission ?? ''),
    domain: String(overrides.domain ?? ''),
    successCriteria: asStringArray(overrides.successCriteria),
    personality: String(agent.personality ?? ''),
    persona: String(agent.personality ?? ''),
    tone: String(agent.tone ?? overrides.tone ?? ''),
    responseStyle: String(agent.responseStyle ?? ''),
    style: String(agent.responseStyle ?? ''),
    behaviorProfile: String(overrides.behaviorProfile ?? ''),
    interactionMode: (overrides.interactionMode as AgentInstance['interactionMode'] | undefined) ?? 'reactive',
    defaultLanguage: String(overrides.defaultLanguage ?? 'pt-BR'),

    soul: String(overrides.soul ?? ''),
    voice: String(overrides.voice ?? ''),
    rules,
    playbook,
    context,

    systemInstructions: asStringArray(agent.systemInstructions),
    operatingInstructions: asStringArray(overrides.operatingInstructions),
    restrictions: asStringArray(overrides.restrictions),
    securityRules: asStringArray(overrides.securityRules),
    doRules: asStringArray(overrides.doRules).length > 0 ? asStringArray(overrides.doRules) : rules.must,
    dontRules: asStringArray(overrides.dontRules).length > 0 ? asStringArray(overrides.dontRules) : rules.mustNot,
    guardrails: asStringArray(overrides.guardrails),
    escalationRules: asStringArray(overrides.escalationRules),
    systemPrompt: joinInstructions(agent.systemInstructions),

    tags: asStringArray(overrides.tags),
    categories: asStringArray(overrides.categories),

    templateId: (agent.templateId ?? null) as string | null,
    sourceTemplateId: String(overrides.sourceTemplateId ?? agent.templateId ?? ''),
    isTemplateDerived: Boolean(agent.templateId),
    templateSource: (overrides.templateSource as string | null | undefined) ?? null,
    templateVariant: (overrides.templateVariant as string | null | undefined) ?? null,
    templateManifestRef: (overrides.templateManifestRef as string | null | undefined) ?? null,
    originTemplateVersion: (overrides.originTemplateVersion as string | null | undefined) ?? null,
    templateDefaultsSnapshot: (overrides.templateDefaultsSnapshot as Record<string, unknown> | null | undefined) ?? null,
    templateInheritanceMode: (overrides.templateInheritanceMode as AgentInstance['templateInheritanceMode'] | undefined) ?? 'copy-on-create',
    templateLockPolicy: (overrides.templateLockPolicy as AgentInstance['templateLockPolicy'] | undefined) ?? 'none',

    preferredModel: (overrides.preferredModel as string | null | undefined) ?? null,
    compatibleModelStrategy: (overrides.compatibleModelStrategy as string | null | undefined) ?? null,
    allowedModels: asStringArray(overrides.allowedModels),
    providerConstraints: asStringArray(overrides.providerConstraints),
    channelConstraints: asStringArray(overrides.channelConstraints),
    temperature: (overrides.temperature as number | undefined) ?? 0.7,
    topP: (overrides.topP as number | undefined) ?? 1,
    maxTokens: (overrides.maxTokens as number | null | undefined) ?? null,
    responseFormat: (overrides.responseFormat as AgentInstance['responseFormat'] | undefined) ?? 'text',
    reasoningMode: (overrides.reasoningMode as AgentInstance['reasoningMode'] | undefined) ?? null,
    timeoutMs: (overrides.timeoutMs as number | undefined) ?? 30000,
    retryPolicy: {
      maxRetries: (asRecord(overrides.retryPolicy).maxRetries as number | undefined) ?? 3,
      backoffMs: (asRecord(overrides.retryPolicy).backoffMs as number | undefined) ?? 1000,
      strategy: (asRecord(overrides.retryPolicy).strategy as AgentInstance['retryPolicy']['strategy'] | undefined) ?? 'exponential'
    },

    toolsEnabled: Boolean(overrides.toolsEnabled ?? false),
    knowledgeEnabled: Boolean(overrides.knowledgeEnabled ?? false),
    memoryEnabled: Boolean(overrides.memoryEnabled ?? false),
    routingEnabled: Boolean(overrides.routingEnabled ?? false),
    handoffEnabled: Boolean(overrides.handoffEnabled ?? false),
    humanEscalationEnabled: Boolean(overrides.humanEscalationEnabled ?? false),
    enabledCapabilities: asStringArray(overrides.enabledCapabilities),
    capabilities: asStringArray(overrides.capabilities),

    allowedChannels: asStringArray(overrides.allowedChannels),
    defaultChannelBehavior: asRecord(overrides.defaultChannelBehavior),
    channelOverrides: asRecord(overrides.channelOverrides) as Record<string, Record<string, unknown>>,

    memorySessionEnabled: memory.memorySessionEnabled,
    memoryScopeType: memory.memoryScopeType,
    memoryMaxEntries: memory.memoryMaxEntries,
    memoryShared: memory.memoryShared,
    memoryRetentionPeriod: memory.memoryRetentionPeriod,
    memory,

    isActive: Boolean(agent.isActive ?? false),
    isEditable: Boolean(overrides.isEditable ?? true),
    auditMetadata: {
      createdBy: (overrides.createdBy as string | null | undefined) ?? null,
      updatedBy: (overrides.updatedBy as string | null | undefined) ?? null,
      reason: (overrides.reason as string | null | undefined) ?? null
    },

    overrides,
    explicitParameters: {},
    resolvedConfig: (agent.resolvedConfig as Record<string, unknown> | null | undefined) ?? null,
    resolutionTrace: (agent.resolutionTrace as Array<Record<string, unknown>> | null | undefined) ?? null,
    effectiveSystemPrompt: (agent.effectiveSystemPrompt as string | null | undefined) ?? null,
    effectiveBehaviorProfile: (agent.effectiveBehaviorProfile as AgentInstance['effectiveBehaviorProfile']) ?? null,
    effectiveExecutionPolicy: (agent.effectiveExecutionPolicy as AgentInstance['effectiveExecutionPolicy']) ?? null,
    effectiveChannelPolicy: (agent.effectiveChannelPolicy as AgentInstance['effectiveChannelPolicy']) ?? null,
    effectiveModelPolicy: (agent.effectiveModelPolicy as AgentInstance['effectiveModelPolicy']) ?? null,
    configSnapshotVersion: (overrides.configSnapshotVersion as number | undefined) ?? 1,
    lastResolvedAt: (agent.lastResolvedAt as string | null | undefined) ?? null,
    lastValidatedAt: (agent.lastValidatedAt as string | null | undefined) ?? null
  };
}

export function mapFrontendToBackend(updates: Partial<AgentInstance>): BackendUpdatePayload {
  if (!updates || typeof updates !== 'object') {
    throw new Error('Invalid updates: expected object');
  }

  const payload: BackendUpdatePayload = {};
  const overrides: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;
  if (updates.isActive !== undefined) payload.isActive = updates.isActive;
  if (updates.shortDescription !== undefined) payload.description = updates.shortDescription;
  if (updates.objective !== undefined) payload.goal = updates.objective;
  if (updates.persona !== undefined) payload.personality = updates.persona;
  if (updates.style !== undefined) payload.responseStyle = updates.style;
  if (updates.systemPrompt !== undefined) payload.systemInstructions = splitInstructions(updates.systemPrompt);

  setOverride(overrides, 'preferredModel', updates.preferredModel);
  setOverride(overrides, 'temperature', updates.temperature);
  setOverride(overrides, 'maxTokens', updates.maxTokens);
  setOverride(overrides, 'timeoutMs', updates.timeoutMs);
  setOverride(overrides, 'topP', updates.topP);
  setOverride(overrides, 'responseFormat', updates.responseFormat);
  setOverride(overrides, 'reasoningMode', updates.reasoningMode);
  setOverride(overrides, 'retryPolicy', updates.retryPolicy);

  setOverride(overrides, 'soul', updates.soul);
  setOverride(overrides, 'voice', updates.voice);
  setOverride(overrides, 'rules', updates.rules);
  setOverride(overrides, 'playbook', updates.playbook);
  setOverride(overrides, 'context', updates.context);

  setOverride(overrides, 'memory', updates.memory);
  setOverride(overrides, 'memorySessionEnabled', updates.memorySessionEnabled);
  setOverride(overrides, 'memoryScopeType', updates.memoryScopeType);
  setOverride(overrides, 'memoryMaxEntries', updates.memoryMaxEntries);
  setOverride(overrides, 'memoryShared', updates.memoryShared);
  setOverride(overrides, 'memoryRetentionPeriod', updates.memoryRetentionPeriod);

  if (updates.overrides && typeof updates.overrides === 'object') {
    Object.assign(overrides, updates.overrides);
  }

  if (Object.keys(overrides).length > 0) {
    payload.overrides = overrides;
  }

  return payload;
}

export function mapBackendAgentsToFrontend(agents: BackendAgent[]): AgentInstance[] {
  if (!Array.isArray(agents)) return [];
  return agents.map(mapBackendToFrontend);
}
