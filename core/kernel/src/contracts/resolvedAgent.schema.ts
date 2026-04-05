import { z } from 'zod';

export const resolutionTraceEntrySchema = z.object({
  sourceType: z.enum(['template', 'template-defaults', 'agent-overrides', 'operational-parameters', 'bindings']),
  sourceId: z.string().min(1)
});

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
  configHash: z.string().min(1)
});

export type ResolvedAgentConfig = z.infer<typeof resolvedAgentSchema>;
export type ResolutionTraceEntry = z.infer<typeof resolutionTraceEntrySchema>;
