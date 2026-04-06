// Fase 1: Schemas Auxiliares
export { retryPolicySchema, retryStrategyEnum, type RetryPolicy, type RetryStrategy } from './retryPolicy.schema.js';
export { auditMetadataSchema, type AuditMetadata } from './auditMetadata.schema.js';
export { channelBehaviorSchema, type ChannelBehavior } from './channelBehavior.schema.js';

// Fase 2: Enums
export { 
  agentStatusEnum, 
  templateInheritanceModeEnum, 
  templateLockPolicyEnum, 
  interactionModeEnum, 
  responseFormatEnum, 
  reasoningModeEnum, 
  originTypeEnum, 
  visibilityEnum,
  type AgentStatus,
  type TemplateInheritanceMode,
  type TemplateLockPolicy,
  type InteractionMode,
  type ResponseFormat,
  type ReasoningMode,
  type OriginType,
  type Visibility
} from './enums.js';

// Fase 2: AgentInstance Schema
export { agentInstanceSchema, type AgentInstance } from './agentInstance.schema.js';