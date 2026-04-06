import { z } from 'zod';
import { retryPolicySchema } from './retryPolicy.schema.js';
import { auditMetadataSchema } from './auditMetadata.schema.js';
import { channelBehaviorSchema } from './channelBehavior.schema.js';

// =============================================================================
// Enums locales para AgentInstance (derivados do documento canônico)
// =============================================================================

const agentStatusEnum = z.enum(['draft', 'active', 'inactive', 'archived', 'deleted']);
type AgentStatus = z.infer<typeof agentStatusEnum>;

const templateInheritanceModeEnum = z.enum(['copy-on-create', 'linked-metadata']);
type TemplateInheritanceMode = z.infer<typeof templateInheritanceModeEnum>;

const templateLockPolicyEnum = z.enum(['none', 'future', 'strict']);
type TemplateLockPolicy = z.infer<typeof templateLockPolicyEnum>;

const interactionModeEnum = z.enum(['reactive', 'proactive', 'guided', 'strict']);
type InteractionMode = z.infer<typeof interactionModeEnum>;

const responseFormatEnum = z.enum(['text', 'markdown', 'json', 'structured']);
type ResponseFormat = z.infer<typeof responseFormatEnum>;

const reasoningModeEnum = z.enum(['default', 'light', 'standard', 'deep']).nullable();
type ReasoningMode = z.infer<typeof reasoningModeEnum>;

const originTypeEnum = z.enum(['manual', 'template', 'import', 'clone']);
type OriginType = z.infer<typeof originTypeEnum>;

const visibilityEnum = z.enum(['private', 'internal', 'public']);
type Visibility = z.infer<typeof visibilityEnum>;

// =============================================================================
// Schema AgentInstance - Todos os campos canônicos
// =============================================================================

export const agentInstanceSchema = z.object({
  // ---------------------------------------------------------------------------
  // Identidade
  // ---------------------------------------------------------------------------
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  shortDescription: z.string().max(500).default(''),
  longDescription: z.string().max(5000).default(''),
  owner: z.string().default('system'),
  source: z.string().default('manual'),
  version: z.string().default('1.0.0'),
  status: agentStatusEnum.default('draft'),

  // ---------------------------------------------------------------------------
  // Origem e template
  // ---------------------------------------------------------------------------
  templateId: z.string().nullable().default(null),
  isTemplateDerived: z.boolean().default(false),
  templateSource: z.string().nullable().default(null),
  templateVariant: z.string().nullable().default(null),
  templateManifestRef: z.string().nullable().default(null),
  originTemplateVersion: z.string().nullable().default(null),
  templateDefaultsSnapshot: z.record(z.string(), z.unknown()).nullable().default(null),
  templateInheritanceMode: templateInheritanceModeEnum.default('copy-on-create'),
  templateLockPolicy: templateLockPolicyEnum.default('none'),

  // ---------------------------------------------------------------------------
  // Papel e objetivo
  // ---------------------------------------------------------------------------
  role: z.string().min(1).max(100),
  mission: z.string().max(1000).default(''),
  domain: z.string().max(100).default('general'),
  objective: z.string().min(1).max(2000),
  successCriteria: z.array(z.string()).default([]),

  // ---------------------------------------------------------------------------
  // Personalidade e interação
  // ---------------------------------------------------------------------------
  persona: z.string().min(1).max(5000),
  tone: z.string().default('neutro'),
  style: z.string().default('claro-e-objetivo'),
  behaviorProfile: z.string().max(100).default('default'),
  interactionMode: interactionModeEnum.default('guided'),
  defaultLanguage: z.string().default('pt-BR'),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),

  // ---------------------------------------------------------------------------
  // Instruções e políticas
  // ---------------------------------------------------------------------------
  systemPrompt: z.string().min(1).max(20000),
  operatingInstructions: z.array(z.string()).default([]),
  doRules: z.array(z.string()).default([]),
  dontRules: z.array(z.string()).default([]),
  guardrails: z.array(z.string()).default([]),
  escalationRules: z.array(z.string()).default([]),

  // ---------------------------------------------------------------------------
  // Modelo e execução
  // ---------------------------------------------------------------------------
  preferredModel: z.string().nullable().default(null),
  allowedModels: z.array(z.string()).default([]),
  providerConstraints: z.array(z.string()).default([]),
  channelConstraints: z.array(z.string()).default([]),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1.0),
  maxTokens: z.number().int().positive().nullable().default(null),
  responseFormat: responseFormatEnum.default('markdown'),
  reasoningMode: reasoningModeEnum.default(null),
  timeoutMs: z.number().int().positive().default(30000),
  retryPolicy: retryPolicySchema.default({ maxRetries: 0 }),

  // ---------------------------------------------------------------------------
  // Capacidades
  // ---------------------------------------------------------------------------
  toolsEnabled: z.boolean().default(false),
  knowledgeEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  routingEnabled: z.boolean().default(false),
  handoffEnabled: z.boolean().default(false),
  humanEscalationEnabled: z.boolean().default(false),
  capabilities: z.array(z.string()).default([]),

  // ---------------------------------------------------------------------------
  // Canais
  // ---------------------------------------------------------------------------
  allowedChannels: z.array(z.string()).default([]),
  defaultChannelBehavior: channelBehaviorSchema.default({}),
  channelOverrides: z.record(z.string(), z.unknown()).default({}),

  // ---------------------------------------------------------------------------
  // Governança e edição
  // ---------------------------------------------------------------------------
  isActive: z.boolean().default(false),
  isEditable: z.boolean().default(true),
  visibility: visibilityEnum.default('internal'),
  auditMetadata: auditMetadataSchema.default({}),

  // ---------------------------------------------------------------------------
  // Ciclo de vida
  // ---------------------------------------------------------------------------
  originType: originTypeEnum.default('manual'),
  cloneOfAgentId: z.string().uuid().nullable().default(null),
  isDeleted: z.boolean().default(false),
  deletedAt: z.string().datetime().nullable().default(null),
  activatedAt: z.string().datetime().nullable().default(null),
  deactivatedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // ---------------------------------------------------------------------------
  // Resolução de configuração
  // ---------------------------------------------------------------------------
  overrides: z.record(z.string(), z.unknown()).default({}),
  explicitParameters: z.record(z.string(), z.unknown()).default({}),
  resolvedConfig: z.record(z.string(), z.unknown()).nullable().default(null),
  resolutionTrace: z.record(z.string(), z.unknown()).nullable().default(null),
  effectiveSystemPrompt: z.string().nullable().default(null),
  effectiveBehaviorProfile: z.record(z.string(), z.unknown()).nullable().default(null),
  effectiveExecutionPolicy: z.record(z.string(), z.unknown()).nullable().default(null),
  effectiveChannelPolicy: z.record(z.string(), z.unknown()).nullable().default(null),
  effectiveModelPolicy: z.record(z.string(), z.unknown()).nullable().default(null),
  configSnapshotVersion: z.number().int().positive().default(1),
  lastResolvedAt: z.string().datetime().nullable().default(null),
  lastValidatedAt: z.string().datetime().nullable().default(null)
});

export type AgentInstance = z.infer<typeof agentInstanceSchema>;

// =============================================================================
// Exportações adicionais para uso em outros schemas
// =============================================================================

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
};