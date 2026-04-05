export type AgentStatus = 'active' | 'disabled';
export type AgentVisibility = 'private' | 'team' | 'public';

export type AgentBehaviorProfile = {
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
};

export type AgentExecutionPolicy = {
  operationalParameters: Record<string, unknown>;
};

export type AgentChannelPolicy = {
  allowedChannels: string[];
};

export type AgentModelPolicy = {
  preferredModel: string | null;
  compatibleModelStrategy: string;
};

export type AgentAuditRecord = {
  id: string;
  agentId: string;
  operation: 'create' | 'update' | 'duplicate' | 'activate' | 'deactivate' | 'soft-delete' | 'load';
  timestamp: string;
  details?: Record<string, unknown>;
};
