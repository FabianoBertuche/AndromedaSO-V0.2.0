import { z } from 'zod';

export const agentTemplateManifestSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1),
  group: z.string().min(1),
  variant: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(['active', 'disabled', 'deprecated']).default('active'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  config: z.record(z.string(), z.unknown()),
  defaults: z.object({
    operationalParameters: z.record(z.string(), z.unknown()).default({})
  }).default({}),
  tests: z.record(z.string(), z.unknown()).default({}),
  scenarios: z.record(z.string(), z.unknown()).default({})
});

export type AgentTemplateManifest = z.infer<typeof agentTemplateManifestSchema>;

export const agentTemplateConfigSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  role: z.string().min(1),
  goal: z.string().min(1),
  personality: z.string().min(1),
  tone: z.string().min(1),
  responseStyle: z.string().min(1),
  systemInstructions: z.array(z.string().min(1)),
  restrictions: z.array(z.string().min(1)),
  securityRules: z.array(z.string().min(1)),
  defaultLanguage: z.string().min(1),
  visibility: z.enum(['private', 'team', 'public']),
  preferredModel: z.string().min(1).nullable().optional(),
  compatibleModelStrategy: z.string().min(1).nullable().optional(),
  allowedChannels: z.array(z.string().min(1)),
  enabledCapabilities: z.array(z.string().min(1))
});

export type AgentTemplateConfig = z.infer<typeof agentTemplateConfigSchema>;
