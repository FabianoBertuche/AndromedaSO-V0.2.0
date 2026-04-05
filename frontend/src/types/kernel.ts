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

// Agent Instance - instância de agente criada pelo usuário
export type AgentInstance = {
  id: string;
  name: string;
  slug: string;
  description: string;
  templateId: string;
  sourceTemplateId: string;
  status: 'active' | 'disabled';
  visibility: 'private' | 'team' | 'public';
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
  preferredModel: string | null;
  compatibleModelStrategy: string | null;
  allowedChannels: string[];
  enabledCapabilities: string[];
  overrides: Record<string, unknown>;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
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
  status: 'active' | 'disabled';
  visibility: 'private' | 'team' | 'public';
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
};

// Input para criação de agente
export type CreateAgentInput = {
  templateId: string;
  name?: string;
  slug?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
};

// Input para atualização de agente
export type UpdateAgentInput = {
  name?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
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