import { createHash } from 'node:crypto';
import pino from 'pino';
import type { RetryPolicy } from '../../../../contracts/schemas/index.js';
import type {
  AgentInstance,
  AgentOverrides
} from '../../../../contracts/agentModule.schema.js';
import type { AgentTemplateManifest } from '../../../../contracts/agentTemplate.schema.js';
import {
  resolvedAgentSchema,
  type ResolutionTraceEntry
} from '../../../../contracts/resolvedAgent.schema.js';
import {
  resolveEffectiveSystemPrompt,
  resolveEffectiveBehaviorProfile,
  resolveEffectiveExecutionPolicy,
  resolveEffectiveChannelPolicy,
  resolveEffectiveModelPolicy
} from './resolution/index.js';

const log = pino({ name: 'agents:resolver' });

interface ResolvedFields {
  name?: string;
  slug?: string;
  role?: string;
  mission?: string;
  scope?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  soul?: string;
  voice?: string;
  rules?: {
    must?: string[];
    mustNot?: string[];
    delegateWhen?: string[];
    reviewWhen?: string[];
    feedbackWhen?: string[];
    interruptWhen?: string[];
    evidenceWhen?: string[];
  };
  playbook?: {
    start?: string[];
    execute?: string[];
    review?: string[];
    report?: string[];
  };
  context?: {
    stack?: string[];
    architecture?: string[];
    objectives?: string[];
    decisions?: string[];
    constraints?: string[];
    patterns?: string[];
  };
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

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
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
    const now = new Date();

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
      mission: String(templateConfig.mission ?? ''),
      scope: String(templateConfig.scope ?? ''),
      goal: String(templateConfig.goal ?? ''),
      personality: String(templateConfig.personality ?? ''),
      tone: String(templateConfig.tone ?? ''),
      responseStyle: String(templateConfig.responseStyle ?? ''),
      soul: String(templateConfig.soul ?? ''),
      voice: String(templateConfig.voice ?? ''),
      rules: {
        must: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.must),
        mustNot: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.mustNot),
        delegateWhen: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.delegateWhen),
        reviewWhen: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.reviewWhen),
        feedbackWhen: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.feedbackWhen),
        interruptWhen: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.interruptWhen),
        evidenceWhen: toStringArray((templateConfig.rules as Record<string, unknown> | undefined)?.evidenceWhen)
      },
      playbook: {
        start: toStringArray((templateConfig.playbook as Record<string, unknown> | undefined)?.start),
        execute: toStringArray((templateConfig.playbook as Record<string, unknown> | undefined)?.execute),
        review: toStringArray((templateConfig.playbook as Record<string, unknown> | undefined)?.review),
        report: toStringArray((templateConfig.playbook as Record<string, unknown> | undefined)?.report)
      },
      context: {
        stack: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.stack),
        architecture: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.architecture),
        objectives: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.objectives),
        decisions: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.decisions),
        constraints: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.constraints),
        patterns: toStringArray((templateConfig.context as Record<string, unknown> | undefined)?.patterns)
      },
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

    const role = resolved.role ?? agent.role;
    const personality = resolved.personality ?? agent.personality;
    const tone = resolved.tone ?? agent.tone;
    const responseStyle = resolved.responseStyle ?? agent.responseStyle;

    const agentGoal = resolved.goal ?? agent.goal ?? '';
    const agentName = resolved.name ?? agent.name ?? 'Agente';
    const agentDescription = agent.description ?? '';

    const promptRules = {
      must: resolved.rules?.must ?? resolved.restrictions,
      mustNot: resolved.rules?.mustNot ?? resolved.securityRules,
      delegateWhen: resolved.rules?.delegateWhen ?? [],
      reviewWhen: resolved.rules?.reviewWhen ?? [],
      feedbackWhen: resolved.rules?.feedbackWhen ?? [],
      interruptWhen: resolved.rules?.interruptWhen ?? [],
      evidenceWhen: resolved.rules?.evidenceWhen ?? []
    };

    const effectiveSystemPrompt = resolveEffectiveSystemPrompt({
      systemPrompt: `Você é ${agentName}, um agente de IA. ${agentGoal} ${agentDescription}`.trim(),
      agentIdentity: `Nome: ${agentName}\nPapel: ${resolved.role ?? agent.role ?? ''}`.trim(),
      mission: resolved.mission,
      scope: resolved.scope,
      soul: resolved.soul,
      voice: resolved.voice,
      responseStyle: resolved.responseStyle,
      rules: promptRules,
      playbook: resolved.playbook,
      context: resolved.context,
      operatingInstructions: resolved.systemInstructions,
      doRules: resolved.restrictions,
      dontRules: resolved.securityRules
    });

    // Adicionar instruções de comportamento ao system prompt
    const behaviorInstructions = [];

    if (resolved.personality) {
      behaviorInstructions.push(`Você tem a personalidade: ${resolved.personality}.`);
    }
    if (resolved.tone) {
      behaviorInstructions.push(`Use um tom ${resolved.tone} em suas respostas.`);
    }
    if (resolved.responseStyle) {
      behaviorInstructions.push(`Seu estilo de resposta é: ${resolved.responseStyle}.`);
    }
    if (resolved.role) {
      behaviorInstructions.push(`Você atua como: ${resolved.role}.`);
    }

    // Instrução fundamental: sempre se apresentar como agente
    behaviorInstructions.push(`
IMPORTANTE: Você é um AGENTE de IA, não apenas um modelo.
- Sempre se apresente como "${resolved.name || agent.name || 'Agente'}'"
- Mantenha sua personalidade consistente
- Responda de forma alinhada com seu papel e objetivo
- Nunca diga que você é "apenas um modelo de linguagem" ou "apenas uma IA"
`);

    // Combinar system prompt com instruções de comportamento
    const enhancedSystemPrompt = behaviorInstructions.length > 0
      ? `${effectiveSystemPrompt}\n\n---\nCOMPORTAMENTO DO AGENTE:\n${behaviorInstructions.join('\n')}`
      : effectiveSystemPrompt;

    const effectiveBehaviorProfile = resolveEffectiveBehaviorProfile({
      persona: personality,
      tone: tone,
      style: responseStyle,
      interactionMode: operationalParameters.interactionMode as string | undefined,
      behaviorProfile: operationalParameters.behaviorProfile as string | undefined
    });

    const effectiveExecutionPolicy = resolveEffectiveExecutionPolicy({
      temperature: operationalParameters.temperature as number | undefined,
      topP: operationalParameters.topP as number | undefined,
      maxTokens: operationalParameters.maxTokens as number | null | undefined,
      responseFormat: operationalParameters.responseFormat as string | undefined,
      reasoningMode: operationalParameters.reasoningMode as string | null | undefined,
      timeoutMs: operationalParameters.timeoutMs as number | undefined,
      retryPolicy: operationalParameters.retryPolicy as RetryPolicy | undefined
    });

    const effectiveChannelPolicy = resolveEffectiveChannelPolicy({
      allowedChannels: resolved.allowedChannels,
      defaultChannelBehavior: operationalParameters.defaultChannelBehavior as Record<string, unknown> | undefined,
      channelOverrides: operationalParameters.channelOverrides as Record<string, Record<string, unknown>> | undefined,
      channelConstraints: operationalParameters.channelConstraints as string[] | undefined
    });

    const effectiveModelPolicy = resolveEffectiveModelPolicy({
      preferredModel: resolved.preferredModel,
      allowedModels: operationalParameters.allowedModels as string[] | undefined,
      providerConstraints: operationalParameters.providerConstraints as string[] | undefined,
      reasoningMode: effectiveExecutionPolicy.reasoningMode
    });

    const finalConfig: Record<string, unknown> = {
      agentId: agent.id,
      templateId: agent.templateId,
      sourceTemplateId: agent.sourceTemplateId,
      name: resolved.name ?? agent.name,
      slug: resolved.slug ?? agent.slug,
      description: agent.description,
      role: role,
      goal: resolved.goal ?? agent.goal,
      personality: personality,
      tone: tone,
      responseStyle: responseStyle,
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
      resolutionTrace,
      effectiveSystemPrompt: enhancedSystemPrompt,
      effectiveBehaviorProfile,
      effectiveExecutionPolicy,
      effectiveChannelPolicy,
      effectiveModelPolicy,
      configSnapshotVersion: 1,
      lastResolvedAt: now.toISOString()
    };

    finalConfig.configHash = computeConfigHash(finalConfig);

    return resolvedAgentSchema.parse(finalConfig);
  }

  private applyOverrides(
    resolved: ResolvedFields,
    operationalParameters: Record<string, unknown>,
    overrides: AgentOverrides
  ): void {
    const rawOverrides = overrides as Record<string, unknown>;

    if (overrides.name !== undefined) resolved.name = overrides.name;
    if (overrides.role !== undefined) resolved.role = overrides.role;
    if (typeof rawOverrides.mission === 'string') resolved.mission = rawOverrides.mission;
    if (typeof rawOverrides.scope === 'string') resolved.scope = rawOverrides.scope;
    if (overrides.goal !== undefined) resolved.goal = overrides.goal;
    if (overrides.personality !== undefined) resolved.personality = overrides.personality;
    if (overrides.tone !== undefined) resolved.tone = overrides.tone;
    if (overrides.responseStyle !== undefined) resolved.responseStyle = overrides.responseStyle;
    if (typeof rawOverrides.soul === 'string') resolved.soul = rawOverrides.soul;
    if (typeof rawOverrides.voice === 'string') resolved.voice = rawOverrides.voice;

    if (rawOverrides.rules && typeof rawOverrides.rules === 'object') {
      const nextRules = rawOverrides.rules as Record<string, unknown>;
      resolved.rules = {
        must: toStringArray(nextRules.must),
        mustNot: toStringArray(nextRules.mustNot),
        delegateWhen: toStringArray(nextRules.delegateWhen),
        reviewWhen: toStringArray(nextRules.reviewWhen),
        feedbackWhen: toStringArray(nextRules.feedbackWhen),
        interruptWhen: toStringArray(nextRules.interruptWhen),
        evidenceWhen: toStringArray(nextRules.evidenceWhen)
      };
    }

    if (rawOverrides.playbook && typeof rawOverrides.playbook === 'object') {
      const nextPlaybook = rawOverrides.playbook as Record<string, unknown>;
      resolved.playbook = {
        start: toStringArray(nextPlaybook.start),
        execute: toStringArray(nextPlaybook.execute),
        review: toStringArray(nextPlaybook.review),
        report: toStringArray(nextPlaybook.report)
      };
    }

    if (rawOverrides.context && typeof rawOverrides.context === 'object') {
      const nextContext = rawOverrides.context as Record<string, unknown>;
      resolved.context = {
        stack: toStringArray(nextContext.stack),
        architecture: toStringArray(nextContext.architecture),
        objectives: toStringArray(nextContext.objectives),
        decisions: toStringArray(nextContext.decisions),
        constraints: toStringArray(nextContext.constraints),
        patterns: toStringArray(nextContext.patterns)
      };
    }

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
