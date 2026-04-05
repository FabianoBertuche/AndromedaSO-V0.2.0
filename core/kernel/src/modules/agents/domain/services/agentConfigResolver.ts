import { createHash } from 'node:crypto';
import pino from 'pino';
import type {
  AgentInstance,
  AgentOverrides
} from '../../../../contracts/agentModule.schema.js';
import type { AgentTemplateManifest } from '../../../../contracts/agentTemplate.schema.js';
import {
  resolvedAgentSchema,
  type ResolutionTraceEntry
} from '../../../../contracts/resolvedAgent.schema.js';

const log = pino({ name: 'agents:resolver' });

interface ResolvedFields {
  name?: string;
  slug?: string;
  role?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions: string[];
  restrictions: string[];
  securityRules: string[];
  defaultLanguage?: string;
  visibility?: 'private' | 'team' | 'public';
  preferredModel?: string | null;
  compatibleModelStrategy?: string | null;
  allowedChannels: string[];
  enabledCapabilities: string[];
  tags: string[];
}

interface TemplateDefaults {
  operationalParameters?: Record<string, unknown>;
}

interface AgentBindings {
  provider?: string;
  model?: string;
  channel?: string;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `"${k}":${stableStringify(v)}`).join(',')}}`;
  }
  return String(value);
}

function deduplicateAndPreserveOrder<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  return arr.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

function computeConfigHash(config: Record<string, unknown>): string {
  const stable = stableStringify(config);
  return createHash('sha256').update(stable, 'utf-8').digest('hex').substring(0, 16);
}

export class AgentConfigResolver {
  resolve(
    agent: AgentInstance,
    template: AgentTemplateManifest,
    explicitOperationalParameters?: Record<string, unknown>,
    bindings?: AgentBindings
  ): ReturnType<typeof resolvedAgentSchema.parse> {
    const resolutionTrace: ResolutionTraceEntry[] = [];

    const templateConfig = template.config as Record<string, unknown>;
    const templateDefaults = (template.defaults ?? {}) as TemplateDefaults;

    resolutionTrace.push({
      sourceType: 'template',
      sourceId: template.templateId
    });

    const resolved: ResolvedFields = {
      name: String(templateConfig.name ?? ''),
      slug: String(templateConfig.slug ?? ''),
      role: String(templateConfig.role ?? ''),
      goal: String(templateConfig.goal ?? ''),
      personality: String(templateConfig.personality ?? ''),
      tone: String(templateConfig.tone ?? ''),
      responseStyle: String(templateConfig.responseStyle ?? ''),
      systemInstructions: [...(Array.isArray(templateConfig.systemInstructions) ? templateConfig.systemInstructions : []) as string[]],
      restrictions: [...(Array.isArray(templateConfig.restrictions) ? templateConfig.restrictions : []) as string[]],
      securityRules: [...(Array.isArray(templateConfig.securityRules) ? templateConfig.securityRules : []) as string[]],
      defaultLanguage: String(templateConfig.defaultLanguage ?? 'pt-BR'),
      visibility: (templateConfig.visibility as 'private' | 'team' | 'public') ?? 'private',
      preferredModel: templateConfig.preferredModel as string | null | undefined,
      compatibleModelStrategy: templateConfig.compatibleModelStrategy as string | null | undefined,
      allowedChannels: [...(Array.isArray(templateConfig.allowedChannels) ? templateConfig.allowedChannels : []) as string[]],
      enabledCapabilities: [...(Array.isArray(templateConfig.enabledCapabilities) ? templateConfig.enabledCapabilities : []) as string[]],
      tags: [...(Array.isArray(templateConfig.tags) ? templateConfig.tags : []) as string[]]
    };

    if (Object.keys(templateDefaults.operationalParameters ?? {}).length > 0) {
      resolutionTrace.push({
        sourceType: 'template-defaults',
        sourceId: template.templateId
      });
    }

    const operationalParameters: Record<string, unknown> = {
      ...(templateDefaults.operationalParameters ?? {})
    };

    const overrides = agent.overrides ?? {};

    if (Object.keys(overrides).length > 0) {
      resolutionTrace.push({
        sourceType: 'agent-overrides',
        sourceId: agent.id
      });
      this.applyOverrides(resolved, operationalParameters, overrides);
    }

    if (explicitOperationalParameters && Object.keys(explicitOperationalParameters).length > 0) {
      resolutionTrace.push({
        sourceType: 'operational-parameters',
        sourceId: agent.id
      });
      Object.assign(operationalParameters, explicitOperationalParameters);
    }

    const resolvedBindings: AgentBindings = bindings ?? {};

    if (resolvedBindings.provider || resolvedBindings.model || resolvedBindings.channel) {
      resolutionTrace.push({
        sourceType: 'bindings',
        sourceId: 'runtime-bindings'
      });
    }

    resolved.systemInstructions = deduplicateAndPreserveOrder(resolved.systemInstructions);
    resolved.restrictions = deduplicateAndPreserveOrder(resolved.restrictions);
    resolved.securityRules = deduplicateAndPreserveOrder(resolved.securityRules);
    resolved.allowedChannels = deduplicateAndPreserveOrder(resolved.allowedChannels);
    resolved.enabledCapabilities = deduplicateAndPreserveOrder(resolved.enabledCapabilities);
    resolved.tags = deduplicateAndPreserveOrder(resolved.tags);

    const finalConfig: Record<string, unknown> = {
      agentId: agent.id,
      templateId: agent.templateId,
      sourceTemplateId: agent.sourceTemplateId,
      name: resolved.name ?? agent.name,
      slug: resolved.slug ?? agent.slug,
      description: agent.description,
      role: resolved.role ?? agent.role,
      goal: resolved.goal ?? agent.goal,
      personality: resolved.personality ?? agent.personality,
      tone: resolved.tone ?? agent.tone,
      responseStyle: resolved.responseStyle ?? agent.responseStyle,
      systemInstructions: resolved.systemInstructions,
      restrictions: resolved.restrictions,
      securityRules: resolved.securityRules,
      defaultLanguage: resolved.defaultLanguage ?? agent.defaultLanguage,
      tags: resolved.tags,
      status: agent.status,
      visibility: resolved.visibility ?? agent.visibility,
      preferredModel: resolved.preferredModel,
      compatibleModelStrategy: resolved.compatibleModelStrategy,
      allowedChannels: resolved.allowedChannels,
      enabledCapabilities: resolved.enabledCapabilities,
      operationalParameters,
      bindings: resolvedBindings,
      resolutionTrace
    };

    finalConfig.configHash = computeConfigHash(finalConfig);

    return resolvedAgentSchema.parse(finalConfig);
  }

  private applyOverrides(
    resolved: ResolvedFields,
    operationalParameters: Record<string, unknown>,
    overrides: AgentOverrides
  ): void {
    if (overrides.name !== undefined) resolved.name = overrides.name;
    if (overrides.role !== undefined) resolved.role = overrides.role;
    if (overrides.goal !== undefined) resolved.goal = overrides.goal;
    if (overrides.personality !== undefined) resolved.personality = overrides.personality;
    if (overrides.tone !== undefined) resolved.tone = overrides.tone;
    if (overrides.responseStyle !== undefined) resolved.responseStyle = overrides.responseStyle;
    if (overrides.systemInstructions !== undefined) {
      resolved.systemInstructions = [...resolved.systemInstructions, ...overrides.systemInstructions];
    }
    if (overrides.restrictions !== undefined) {
      resolved.restrictions = [...resolved.restrictions, ...overrides.restrictions];
    }
    if (overrides.securityRules !== undefined) {
      resolved.securityRules = [...resolved.securityRules, ...overrides.securityRules];
    }
    if (overrides.defaultLanguage !== undefined) resolved.defaultLanguage = overrides.defaultLanguage;
    if (overrides.tags !== undefined) {
      resolved.tags = [...resolved.tags, ...overrides.tags];
    }
    if (overrides.preferredModel !== undefined) resolved.preferredModel = overrides.preferredModel;
    if (overrides.compatibleModelStrategy !== undefined) {
      resolved.compatibleModelStrategy = overrides.compatibleModelStrategy;
    }
    if (overrides.allowedChannels !== undefined) {
      resolved.allowedChannels = [...resolved.allowedChannels, ...overrides.allowedChannels];
    }
    if (overrides.enabledCapabilities !== undefined) {
      resolved.enabledCapabilities = [...resolved.enabledCapabilities, ...overrides.enabledCapabilities];
    }
    if (overrides.operationalParameters !== undefined) {
      Object.assign(operationalParameters, overrides.operationalParameters);
    }
  }
}

export const agentConfigResolver = new AgentConfigResolver();
