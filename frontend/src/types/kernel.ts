export type Agent = {
  id: string;
  performanceP95: number;
  successRate: number;
  reputationScore: number;
  budgetSpent: number;
  budgetLimit: number;
};

export type CostTrendPoint = {
  agentId: string;
  month: string;
  spent: number;
};

export type CostData = {
  generatedAt: string;
  agents: Array<{
    agentId: string;
    spentDaily: number;
    spentMonthly: number;
    remainingDaily: number;
    remainingMonthly: number;
  }>;
  trend: CostTrendPoint[];
};

export type OrchestratorSubtask = {
  id: string;
  title: string;
  capability: string;
  status: 'pending' | 'running' | 'completed' | 'blocked';
};

export type TaskNode = {
  id: string;
  title: string;
  state: 'pending' | 'running' | 'completed' | 'blocked' | 'human_fallback';
  assignee?: string;
  children?: TaskNode[];
};

export type AgentState = {
  id: string;
  role: string;
  capability: string;
  reputation: number;
  status: 'idle' | 'planning' | 'collaborating' | 'blocked' | 'waiting_human' | 'done';
};

export type OrchestratorStatus = {
  activeTeams: number;
  pending: number;
};

export type OrchestrationDetail = {
  tree: TaskNode[];
  agentStates: AgentState[];
  messages?: Array<{
    from: string;
    to: string;
    content: string;
    timestamp: string;
  }>;
  requiresHumanFallback?: boolean;
};

export type MultiTaskResponse = {
  taskId: string;
  subtasks: OrchestratorSubtask[];
  requiresHumanFallback?: boolean;
};

// ============================================
// AGENTS MODULE TYPES
// ============================================

export type AgentStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'deleted' | 'disabled';
export type AgentVisibility = 'private' | 'internal' | 'public' | 'team';

export type RetryPolicy = {
  maxRetries: number;
  backoffMs: number;
  strategy: 'exponential' | 'fixed';
};

export type EffectiveBehaviorProfile = {
  persona: string;
  tone: string;
  style: string;
  interactionMode: string;
  behaviorProfile: string;
};

export type EffectiveExecutionPolicy = {
  temperature: number;
  topP: number;
  maxTokens: number | null;
  responseFormat: 'text' | 'json' | 'markdown';
  reasoningMode: 'default' | 'deep' | null;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  toolsEnabled: boolean;
  knowledgeEnabled: boolean;
  memoryEnabled: boolean;
  routingEnabled: boolean;
  handoffEnabled: boolean;
  humanEscalationEnabled: boolean;
};

export type EffectiveChannelPolicy = {
  allowedChannels: string[];
  defaultChannelBehavior: Record<string, unknown>;
  channelOverrides: Record<string, Record<string, unknown>>;
};

export type EffectiveModelPolicy = {
  preferredModel: string | null;
  allowedModels: string[];
  providerConstraints: string[];
  reasoningMode: 'default' | 'deep' | null;
};

export type AgentBehaviorRules = {
  must: string[];
  mustNot: string[];
  delegateWhen: string[];
  reviewWhen: string[];
  feedbackWhen: string[];
  interruptWhen: string[];
  evidenceWhen: string[];
};

export type AgentBehaviorPlaybook = {
  start: string[];
  execute: string[];
  review: string[];
  report: string[];
};

export type AgentBehaviorContext = {
  stack: string[];
  architecture: string[];
  objectives: string[];
  decisions: string[];
  constraints: string[];
  patterns: string[];
};

export type AgentMemoryConfig = {
  memorySessionEnabled: boolean;
  memoryScopeType: 'session' | 'persistent';
  memoryMaxEntries: number;
  memoryShared: boolean;
  memoryRetentionPeriod: 'session' | '24h' | '7d' | '30d' | 'forever';
};

// Agent Instance - instância de agente criada pelo usuário
export type AgentInstance = {
  id: string;
  name: string;
  slug: string;

  // Identidade e ciclo de vida
  status: AgentStatus;
  visibility: AgentVisibility;
  owner: string;
  source: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  activatedAt: string | null;
  deactivatedAt: string | null;
  isDeleted: boolean;
  originType: 'manual' | 'template' | 'import' | 'clone';
  cloneOfAgentId: string | null;

  // Descrição
  description: string;
  shortDescription: string;
  longDescription: string;

  // Papel e comportamento legado
  role: string;
  goal: string;
  objective: string;
  mission: string;
  domain: string;
  successCriteria: string[];
  personality: string;
  persona: string;
  tone: string;
  responseStyle: string;
  style: string;
  behaviorProfile: string;
  interactionMode: 'reactive' | 'proactive' | 'guided' | 'strict';
  defaultLanguage: string;

  // Blocos behavior novos
  soul: string;
  voice: string;
  rules: AgentBehaviorRules;
  playbook: AgentBehaviorPlaybook;
  context: AgentBehaviorContext;

  // Instruções legadas
  systemInstructions: string[];
  operatingInstructions: string[];
  restrictions: string[];
  securityRules: string[];
  doRules: string[];
  dontRules: string[];
  guardrails: string[];
  escalationRules: string[];
  systemPrompt: string;

  // Tags/categorias
  tags: string[];
  categories: string[];

  // Template/origem
  templateId: string | null;
  sourceTemplateId: string;
  isTemplateDerived: boolean;
  templateSource: string | null;
  templateVariant: string | null;
  templateManifestRef: string | null;
  originTemplateVersion: string | null;
  templateDefaultsSnapshot: Record<string, unknown> | null;
  templateInheritanceMode: 'copy-on-create' | 'linked-metadata';
  templateLockPolicy: 'none' | 'future' | 'strict';

  // Modelo e execução
  preferredModel: string | null;
  compatibleModelStrategy: string | null;
  allowedModels: string[];
  providerConstraints: string[];
  channelConstraints: string[];
  temperature: number;
  topP: number;
  maxTokens: number | null;
  responseFormat: 'text' | 'json' | 'markdown';
  reasoningMode: 'default' | 'deep' | null;
  timeoutMs: number;
  retryPolicy: RetryPolicy;

  // Capacidades
  toolsEnabled: boolean;
  knowledgeEnabled: boolean;
  memoryEnabled: boolean;
  routingEnabled: boolean;
  handoffEnabled: boolean;
  humanEscalationEnabled: boolean;
  enabledCapabilities: string[];
  capabilities: string[];

  // Canais
  allowedChannels: string[];
  defaultChannelBehavior: Record<string, unknown>;
  channelOverrides: Record<string, Record<string, unknown>>;

  // Memória (flat + agregado)
  memorySessionEnabled: boolean;
  memoryScopeType: 'session' | 'persistent';
  memoryMaxEntries: number;
  memoryShared: boolean;
  memoryRetentionPeriod: 'session' | '24h' | '7d' | '30d' | 'forever';
  memory: AgentMemoryConfig;

  // Governança
  isActive: boolean;
  isEditable: boolean;
  auditMetadata: {
    createdBy: string | null;
    updatedBy: string | null;
    reason: string | null;
  };

  // Resolução
  overrides: Record<string, unknown>;
  explicitParameters: Record<string, unknown>;
  resolvedConfig: Record<string, unknown> | null;
  resolutionTrace: Array<Record<string, unknown>> | null;
  effectiveSystemPrompt: string | null;
  effectiveBehaviorProfile: EffectiveBehaviorProfile | null;
  effectiveExecutionPolicy: EffectiveExecutionPolicy | null;
  effectiveChannelPolicy: EffectiveChannelPolicy | null;
  effectiveModelPolicy: EffectiveModelPolicy | null;
  configSnapshotVersion: number;
  lastResolvedAt: string | null;
  lastValidatedAt: string | null;
};

// Agent Template Manifest - manifesto de template de agente
export type AgentTemplateManifest = {
  templateId: string;
  name: string;
  group: string;
  variant: string;
  version: string;
  status: 'active' | 'disabled' | 'deprecated';
  metadata: Record<string, unknown>;
  config: Record<string, unknown>;
  defaults: {
    operationalParameters: Record<string, unknown>;
  };
  tests: Record<string, unknown>;
  scenarios: Record<string, unknown>;
};

// Resolved Agent Config - configuração resolvida do agente
export type ResolvedAgentConfig = {
  agentId: string;
  templateId: string;
  sourceTemplateId: string;
  name: string;
  slug: string;
  description: string;
  role: string;
  goal: string;
  personality: string;
  tone: string;
  responseStyle: string;
  systemInstructions: string[];
  restrictions: string[];
  securityRules: string[];
  defaultLanguage: string;
  tags: string[];
  status: AgentStatus;
  visibility: AgentVisibility;
  preferredModel: string | null;
  compatibleModelStrategy: string | null;
  allowedChannels: string[];
  enabledCapabilities: string[];
  operationalParameters: Record<string, unknown>;
  bindings: {
    provider?: string;
    model?: string;
    channel?: string;
  };
  resolutionTrace: Array<{
    sourceType: 'template' | 'template-defaults' | 'agent-overrides' | 'operational-parameters' | 'bindings';
    sourceId: string;
  }>;
  configHash: string;
};

// Agent Overrides - overrides permitidos na instância
export type AgentOverrides = {
  name?: string;
  description?: string;
  role?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions?: string[];
  restrictions?: string[];
  securityRules?: string[];
  defaultLanguage?: string;
  tags?: string[];
  preferredModel?: string | null;
  compatibleModelStrategy?: string | null;
  allowedChannels?: string[];
  enabledCapabilities?: string[];
  operationalParameters?: Record<string, unknown>;

  // Campos novos de behavior/memory
  soul?: string;
  voice?: string;
  rules?: Partial<AgentBehaviorRules>;
  playbook?: Partial<AgentBehaviorPlaybook>;
  context?: Partial<AgentBehaviorContext>;
  memory?: Partial<AgentMemoryConfig>;
  memorySessionEnabled?: boolean;
  memoryScopeType?: 'session' | 'persistent';
  memoryMaxEntries?: number;
  memoryShared?: boolean;
  memoryRetentionPeriod?: 'session' | '24h' | '7d' | '30d' | 'forever';
};

// Input para criação de agente
export type CreateAgentInput = {
  templateId: string;
  name?: string;
  slug?: string;
  description?: string;
  visibility?: AgentVisibility;
  overrides?: AgentOverrides;
  status?: AgentStatus;
};

// Input para atualização de agente
export type UpdateAgentInput = {
  name?: string;
  description?: string;
  visibility?: AgentVisibility;
  overrides?: AgentOverrides;
  status?: AgentStatus;
};

// Input para duplicação de agente
export type DuplicateAgentInput = {
  name?: string;
  slug?: string;
};

// Input para carregamento de configuração resolvida
export type LoadAgentInput = {
  bindings?: {
    provider?: string;
    model?: string;
    channel?: string;
  };
  operationalParameters?: Record<string, unknown>;
};

// ============================================
// AGENT CHAT TYPES - Chat com agente (não com modelo)
// ============================================

export type AgentChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AgentChatRequest = {
  messages: AgentChatMessage[];
  stream?: boolean;
};

export type AgentChatResponse = {
  message: {
    role: 'assistant';
    content: string;
  };
  metadata?: {
    agentId: string;
    modelUsed: string;
    timestamp: string;
    [key: string]: unknown;
  };
};
