import { z } from 'zod';
import { agentBindingsSchema } from './resolvedAgent.schema.js';

export const agentOverridesSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  role: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  personality: z.string().min(1).optional(),
  tone: z.string().min(1).optional(),
  responseStyle: z.string().min(1).optional(),
  systemInstructions: z.array(z.string().min(1)).optional(),
  restrictions: z.array(z.string().min(1)).optional(),
  securityRules: z.array(z.string().min(1)).optional(),
  defaultLanguage: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  preferredModel: z.string().min(1).nullable().optional(),
  compatibleModelStrategy: z.string().min(1).nullable().optional(),
  allowedChannels: z.array(z.string().min(1)).optional(),
  enabledCapabilities: z.array(z.string().min(1)).optional(),
  operationalParameters: z.record(z.string(), z.unknown()).optional()
});

export const agentInstanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(''),
  templateId: z.string().min(1),
  sourceTemplateId: z.string().min(1),
  status: z.enum(['active', 'disabled']).default('active'),
  visibility: z.enum(['private', 'team', 'public']).default('private'),
  role: z.string().min(1),
  goal: z.string().min(1),
  personality: z.string().min(1),
  tone: z.string().min(1),
  responseStyle: z.string().min(1),
  systemInstructions: z.array(z.string().min(1)).default([]),
  restrictions: z.array(z.string().min(1)).default([]),
  securityRules: z.array(z.string().min(1)).default([]),
  defaultLanguage: z.string().min(1).default('pt-BR'),
  tags: z.array(z.string().min(1)).default([]),
  preferredModel: z.string().min(1).nullable().optional(),
  compatibleModelStrategy: z.string().min(1).nullable().optional(),
  allowedChannels: z.array(z.string().min(1)).default([]),
  enabledCapabilities: z.array(z.string().min(1)).default([]),
  overrides: agentOverridesSchema.default({}),
  deletedAt: z.string().nullable().default(null),
  version: z.number().int().positive().default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type AgentInstance = z.infer<typeof agentInstanceSchema>;
export type AgentOverrides = z.infer<typeof agentOverridesSchema>;

export const createAgentInputSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'team', 'public']).optional(),
  overrides: agentOverridesSchema.optional(),
  status: z.enum(['active', 'disabled']).optional()
});

export type CreateAgentInput = z.infer<typeof createAgentInputSchema>;

export const updateAgentInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'team', 'public']).optional(),
  overrides: agentOverridesSchema.optional(),
  status: z.enum(['active', 'disabled']).optional()
});

export type UpdateAgentInput = z.infer<typeof updateAgentInputSchema>;

export const duplicateAgentInputSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

export type DuplicateAgentInput = z.infer<typeof duplicateAgentInputSchema>;

export type AgentBindings = z.infer<typeof agentBindingsSchema>;

export const loadAgentInputSchema = z.object({
  bindings: agentBindingsSchema.optional(),
  operationalParameters: z.record(z.string(), z.unknown()).optional()
});

export type LoadAgentInput = z.infer<typeof loadAgentInputSchema>;
