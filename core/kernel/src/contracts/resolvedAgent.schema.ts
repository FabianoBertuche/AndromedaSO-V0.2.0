import { z } from 'zod';

export const resolutionTraceEntrySchema = z.object({
  sourceType: z.enum(['template', 'template-defaults', 'agent-overrides', 'operational-parameters', 'bindings']),
  sourceId: z.string().min(1)
});

export const effectiveBehaviorProfileSchema = z.object({
  persona: z.string().min(1),
  tone: z.string().min(1),
  style: z.string().min(1),
  interactionMode: z.string().min(1),
  behaviorProfile: z.string().min(1)
});
export type EffectiveBehaviorProfile = z.infer<typeof effectiveBehaviorProfileSchema>;

export const effectiveExecutionPolicySchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1.0),
  maxTokens: z.number().int().positive().nullable().default(null),
  responseFormat: z.string().min(1).default('markdown'),
  reasoningMode: z.string().min(1).nullable().default(null),
  timeoutMs: z.number().int().positive().default(30000),
  retryPolicy: z.record(z.string(), z.unknown()).optional()
});
export type EffectiveExecutionPolicy = z.infer<typeof effectiveExecutionPolicySchema>;

export const effectiveChannelPolicySchema = z.object({
  allowedChannels: z.array(z.string().min(1)),
  defaultChannelBehavior: z.record(z.string(), z.unknown()),
  channelOverrides: z.record(z.string(), z.unknown()),
  constraints: z.array(z.string().min(1)).default([])
});
export type EffectiveChannelPolicy = z.infer<typeof effectiveChannelPolicySchema>;

export const effectiveModelPolicySchema = z.object({
  preferredModel: z.string().min(1).nullable().default(null),
  allowedModels: z.array(z.string().min(1)).default([]),
  providerConstraints: z.array(z.string().min(1)).default([]),
  reasoningMode: z.string().min(1).nullable().default(null)
});
export type EffectiveModelPolicy = z.infer<typeof effectiveModelPolicySchema>;

export const agentBindingsSchema = z.object({
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  channel: z.string().min(1).optional()
}).default({});

export const resolvedAgentSchema = z.object({
  agentId: z.string().min(1),
  templateId: z.string().min(1),
  sourceTemplateId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  role: z.string().min(1),
  goal: z.string().min(1),
  personality: z.string().min(1),
  tone: z.string().min(1),
  responseStyle: z.string().min(1),
  systemInstructions: z.array(z.string().min(1)),
  restrictions: z.array(z.string().min(1)),
  securityRules: z.array(z.string().min(1)),
  defaultLanguage: z.string().min(1),
  tags: z.array(z.string().min(1)),
  status: z.enum(['active', 'disabled']),
  visibility: z.enum(['private', 'team', 'public']),
  preferredModel: z.string().min(1).nullable().optional(),
  compatibleModelStrategy: z.string().min(1).nullable().optional(),
  allowedChannels: z.array(z.string().min(1)),
  enabledCapabilities: z.array(z.string().min(1)),
  operationalParameters: z.record(z.string(), z.unknown()),
  bindings: agentBindingsSchema,
  resolutionTrace: z.array(resolutionTraceEntrySchema),
  configHash: z.string().min(1),
  effectiveSystemPrompt: z.string().min(1),
  effectiveBehaviorProfile: effectiveBehaviorProfileSchema,
  effectiveExecutionPolicy: effectiveExecutionPolicySchema,
  effectiveChannelPolicy: effectiveChannelPolicySchema,
  effectiveModelPolicy: effectiveModelPolicySchema,
  configSnapshotVersion: z.number().int().positive().default(1),
  lastResolvedAt: z.string().datetime()
});

export type ResolvedAgentConfig = z.infer<typeof resolvedAgentSchema>;
export type ResolutionTraceEntry = z.infer<typeof resolutionTraceEntrySchema>;
export type AgentBindings = z.infer<typeof agentBindingsSchema>;
