# Design — agents-canonical-fields

## Visão Geral

Este documento detalha a implementação dos schemas Zod, funções de resolução e estruturas de dados para suportar todos os ~170 campos canônicos do documento de campos canônicos de agentes.

---

## 1. Schemas Zod Principais

### 1.1 RetryPolicy Schema

```typescript
// core/kernel/src/modules/agents/contracts/schemas/retryPolicy.schema.ts
import { z } from 'zod';

export const retryPolicySchema = z.object({
  maxRetries: z.number().min(0).default(0),
  backoffMs: z.number().min(0).default(0),
  strategy: z.enum(['none', 'fixed', 'exponential']).default('none'),
});

export type RetryPolicy = z.infer<typeof retryPolicySchema>;
```

### 1.2 AuditMetadata Schema

```typescript
// core/kernel/src/modules/agents/contracts/schemas/auditMetadata.schema.ts
import { z } from 'zod';

export const auditMetadataSchema = z.object({
  createdBy: z.string().nullable().default(null),
  updatedBy: z.string().nullable().default(null),
  reason: z.string().nullable().default(null),
});

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
```

### 1.3 ChannelBehavior Schema

```typescript
// core/kernel/src/modules/agents/contracts/schemas/channelBehavior.schema.ts
import { z } from 'zod';

export const channelBehaviorSchema = z.record(z.string(), z.unknown()).default({});

export type ChannelBehavior = z.infer<typeof channelBehaviorSchema>;
```

### 1.4 AgentInstance Schema (Completo)

```typescript
// core/kernel/src/modules/agents/contracts/schemas/agentInstance.schema.ts
import { z } from 'zod';
import { retryPolicySchema } from './retryPolicy.schema.js';
import { auditMetadataSchema } from './auditMetadata.schema.js';
import { channelBehaviorSchema } from './channelBehavior.schema.js';

// Enums
export const agentStatusEnum = z.enum(['draft', 'active', 'inactive', 'archived', 'deleted']);
export const templateInheritanceModeEnum = z.enum(['copy-on-create', 'linked-metadata']);
export const templateLockPolicyEnum = z.enum(['none', 'future', 'strict']);
export const interactionModeEnum = z.enum(['reactive', 'proactive', 'guided', 'strict']);
export const responseFormatEnum = z.enum(['text', 'markdown', 'json', 'structured']);
export const reasoningModeEnum = z.enum(['default', 'light', 'standard', 'deep']);
export const originTypeEnum = z.enum(['manual', 'template', 'import', 'clone']);
export const visibilityEnum = z.enum(['private', 'internal', 'public']);

// Agent Instance Schema Completo
export const agentInstanceSchema = z.object({
  // Identidade
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().default(''),
  longDescription: z.string().default(''),
  owner: z.string().default('system'),
  source: z.string().default('manual'),
  version: z.string().default('1.0.0'),
  status: agentStatusEnum.default('draft'),

  // Origem e template
  templateId: z.string().nullable().default(null),
  isTemplateDerived: z.boolean().default(false),
  templateSource: z.string().nullable().default(null),
  templateVariant: z.string().nullable().default(null),
  templateManifestRef: z.string().nullable().default(null),
  originTemplateVersion: z.string().nullable().default(null),
  templateDefaultsSnapshot: z.record(z.unknown()).nullable().default(null),
  templateInheritanceMode: templateInheritanceModeEnum.default('copy-on-create'),
  templateLockPolicy: templateLockPolicyEnum.default('none'),

  // Papel e objetivo
  role: z.string().min(1),
  mission: z.string().default(''),
  domain: z.string().default('general'),
  objective: z.string().min(1),
  successCriteria: z.array(z.string()).default([]),

  // Personalidade e interação
  persona: z.string().min(1),
  tone: z.string().default('neutro'),
  style: z.string().default('claro-e-objetivo'),
  behaviorProfile: z.string().default('default'),
  interactionMode: interactionModeEnum.default('guided'),
  defaultLanguage: z.string().default('pt-BR'),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),

  // Instruções e políticas
  systemPrompt: z.string().min(1),
  operatingInstructions: z.array(z.string()).default([]),
  doRules: z.array(z.string()).default([]),
  dontRules: z.array(z.string()).default([]),
  guardrails: z.array(z.string()).default([]),
  escalationRules: z.array(z.string()).default([]),

  // Modelo e execução
  preferredModel: z.string().nullable().default(null),
  allowedModels: z.array(z.string()).default([]),
  providerConstraints: z.array(z.string()).default([]),
  channelConstraints: z.array(z.string()).default([]),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1.0),
  maxTokens: z.number().nullable().default(null),
  responseFormat: responseFormatEnum.default('markdown'),
  reasoningMode: reasoningModeEnum.nullable().default(null),
  timeoutMs: z.number().min(1000).max(300000).default(30000),
  retryPolicy: retryPolicySchema.default({ maxRetries: 0, backoffMs: 0, strategy: 'none' }),

  // Capacidades
  toolsEnabled: z.boolean().default(false),
  knowledgeEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  routingEnabled: z.boolean().default(false),
  handoffEnabled: z.boolean().default(false),
  humanEscalationEnabled: z.boolean().default(false),
  capabilities: z.array(z.string()).default([]),

  // Canais
  allowedChannels: z.array(z.string()).default([]),
  defaultChannelBehavior: channelBehaviorSchema.default({}),
  channelOverrides: channelBehaviorSchema.default({}),

  // Governança e edição
  isActive: z.boolean().default(false),
  isEditable: z.boolean().default(true),
  visibility: visibilityEnum.default('internal'),
  auditMetadata: auditMetadataSchema.default({ createdBy: null, updatedBy: null, reason: null }),

  // Ciclo de vida
  originType: originTypeEnum.default('manual'),
  cloneOfAgentId: z.string().nullable().default(null),
  isDeleted: z.boolean().default(false),
  deletedAt: z.string().nullable().default(null),
  activatedAt: z.string().nullable().default(null),
  deactivatedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Resolução de configuração
  overrides: z.record(z.unknown()).default({}),
  explicitParameters: z.record(z.unknown()).default({}),
  resolvedConfig: z.record(z.unknown()).nullable().default(null),
  resolutionTrace: z.record(z.unknown()).nullable().default(null),
  effectiveSystemPrompt: z.string().nullable().default(null),
  effectiveBehaviorProfile: z.record(z.unknown()).nullable().default(null),
  effectiveExecutionPolicy: z.record(z.unknown()).nullable().default(null),
  effectiveChannelPolicy: z.record(z.unknown()).nullable().default(null),
  effectiveModelPolicy: z.record(z.unknown()).nullable().default(null),
  configSnapshotVersion: z.number().default(1),
  lastResolvedAt: z.string().nullable().default(null),
  lastValidatedAt: z.string().nullable().default(null),
});

export type AgentInstance = z.infer<typeof agentInstanceSchema>;
```

---

## 2. Resolved Agent Schema

```typescript
// core/kernel/src/modules/agents/contracts/schemas/resolvedAgent.schema.ts
import { z } from 'zod';
import { agentStatusEnum, visibilityEnum, interactionModeEnum, responseFormatEnum, originTypeEnum } from './agentInstance.schema.js';

// Effective Behavior Profile
export const effectiveBehaviorProfileSchema = z.object({
  persona: z.string(),
  tone: z.string(),
  style: z.string(),
  interactionMode: interactionModeEnum,
  behaviorProfile: z.string(),
});

export type EffectiveBehaviorProfile = z.infer<typeof effectiveBehaviorProfileSchema>;

// Effective Execution Policy
export const effectiveExecutionPolicySchema = z.object({
  temperature: z.number(),
  topP: z.number(),
  maxTokens: z.number().nullable(),
  responseFormat: responseFormatEnum,
  reasoningMode: z.string().nullable(),
  timeoutMs: z.number(),
  retryPolicy: z.object({
    maxRetries: z.number(),
    backoffMs: z.number(),
    strategy: z.enum(['none', 'fixed', 'exponential']),
  }),
});

export type EffectiveExecutionPolicy = z.infer<typeof effectiveExecutionPolicySchema>;

// Effective Channel Policy
export const effectiveChannelPolicySchema = z.object({
  allowedChannels: z.array(z.string()),
  defaultChannelBehavior: z.record(z.unknown()),
  channelOverrides: z.record(z.unknown()),
  constraints: z.array(z.string()),
});

export type EffectiveChannelPolicy = z.infer<typeof effectiveChannelPolicySchema>;

// Effective Model Policy
export const effectiveModelPolicySchema = z.object({
  preferredModel: z.string().nullable(),
  allowedModels: z.array(z.string()),
  providerConstraints: z.array(z.string()),
  reasoningMode: z.string().nullable(),
});

export type EffectiveModelPolicy = z.infer<typeof effectiveModelPolicySchema>;

// Resolution Trace Entry
export const resolutionTraceEntrySchema = z.object({
  source: z.enum(['template.baseConfig', 'template.defaults', 'agent.overrides', 'agent.explicitParameters', 'runtime.bindings']),
  value: z.unknown(),
  resolvedAt: z.string(),
});

export type ResolutionTraceEntry = z.infer<typeof resolutionTraceEntrySchema>;

// Resolved Agent Config Schema
export const resolvedAgentSchema = z.object({
  // Identidade resolvida
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  owner: z.string(),
  source: z.string(),
  version: z.string(),
  status: agentStatusEnum,

  // Origem e template resolvida
  templateId: z.string().nullable(),
  isTemplateDerived: z.boolean(),
  templateSource: z.string().nullable(),
  templateVariant: z.string().nullable(),
  originTemplateVersion: z.string().nullable(),

  // Papel e objetivo resolvido
  role: z.string(),
  mission: z.string(),
  domain: z.string(),
  objective: z.string(),
  successCriteria: z.array(z.string()),

  // Personalidade resolvida (effective)
  effectiveBehaviorProfile: effectiveBehaviorProfileSchema,

  // Instruções resolvidas (effective)
  effectiveSystemPrompt: z.string(),

  // Modelo e execução resolvido (effective)
  effectiveExecutionPolicy: effectiveExecutionPolicySchema,

  // Capacidades resolvidas
  toolsEnabled: z.boolean(),
  knowledgeEnabled: z.boolean(),
  memoryEnabled: z.boolean(),
  routingEnabled: z.boolean(),
  handoffEnabled: z.boolean(),
  humanEscalationEnabled: z.boolean(),
  capabilities: z.array(z.string()),

  // Canais resolvidos (effective)
  effectiveChannelPolicy: effectiveChannelPolicySchema,

  // Modelo resolvido (effective)
  effectiveModelPolicy: effectiveModelPolicySchema,

  // Governança resolvida
  isActive: z.boolean(),
  isEditable: z.boolean(),
  visibility: visibilityEnum,

  // Ciclo de vida resolvido
  originType: originTypeEnum,
  createdAt: z.string(),
  updatedAt: z.string(),

  // Metadata de resolução
  resolutionTrace: z.record(z.array(resolutionTraceEntrySchema)),
  configSnapshotVersion: z.number(),
  lastResolvedAt: z.string(),
  lastValidatedAt: z.string().nullable(),
});

export type ResolvedAgentConfig = z.infer<typeof resolvedAgentSchema>;
```

---

## 3. Funções de Resolução

### 3.1 Resolução de SystemPrompt

```typescript
// core/kernel/src/modules/agents/domain/services/resolution/resolveSystemPrompt.ts
import type { AgentInstance } from '../../contracts/schemas/agentInstance.schema.js';

export interface ResolveSystemPromptOptions {
  agent: AgentInstance;
}

export function resolveEffectiveSystemPrompt(options: ResolveSystemPromptOptions): string {
  const { agent } = options;

  const parts: string[] = [agent.systemPrompt];

  // Adicionar operatingInstructions como linhas adicionais
  if (agent.operatingInstructions.length > 0) {
    parts.push('\n--- Instruções Operacionais ---');
    parts.push(...agent.operatingInstructions.map((inst, i) => `${i + 1}. ${inst}`));
  }

  // Adicionar doRules como diretivas positivas
  if (agent.doRules.length > 0) {
    parts.push('\n--- Você DEVE ---');
    parts.push(...agent.doRules.map((rule, i) => `${i + 1}. ${rule}`));
  }

  // Adicionar dontRules como restrições
  if (agent.dontRules.length > 0) {
    parts.push('\n--- Você NÃO DEVE ---');
    parts.push(...agent.dontRules.map((rule, i) => `${i + 1}. ${rule}`));
  }

  return parts.join('\n');
}
```

### 3.2 Resolução de BehaviorProfile

```typescript
// core/kernel/src/modules/agents/domain/services/resolution/resolveBehaviorProfile.ts
import type { AgentInstance } from '../../contracts/schemas/agentInstance.schema.js';
import type { EffectiveBehaviorProfile } from '../../contracts/schemas/resolvedAgent.schema.js';

export interface ResolveBehaviorProfileOptions {
  agent: AgentInstance;
}

export function resolveEffectiveBehaviorProfile(options: ResolveBehaviorProfileOptions): EffectiveBehaviorProfile {
  const { agent } = options;

  return {
    persona: agent.persona,
    tone: agent.tone,
    style: agent.style,
    interactionMode: agent.interactionMode,
    behaviorProfile: agent.behaviorProfile,
  };
}
```

### 3.3 Resolução de ExecutionPolicy

```typescript
// core/kernel/src/modules/agents/domain/services/resolution/resolveExecutionPolicy.ts
import type { AgentInstance } from '../../contracts/schemas/agentInstance.schema.js';
import type { EffectiveExecutionPolicy } from '../../contracts/schemas/resolvedAgent.schema.js';

export interface ResolveExecutionPolicyOptions {
  agent: AgentInstance;
}

export function resolveEffectiveExecutionPolicy(options: ResolveExecutionPolicyOptions): EffectiveExecutionPolicy {
  const { agent } = options;

  const retryPolicy = agent.retryPolicy || { maxRetries: 0, backoffMs: 0, strategy: 'none' };

  return {
    temperature: agent.temperature,
    topP: agent.topP,
    maxTokens: agent.maxTokens,
    responseFormat: agent.responseFormat,
    reasoningMode: agent.reasoningMode,
    timeoutMs: agent.timeoutMs,
    retryPolicy: {
      maxRetries: retryPolicy.maxRetries,
      backoffMs: retryPolicy.backoffMs,
      strategy: retryPolicy.strategy,
    },
  };
}
```

### 3.4 Resolução de ChannelPolicy

```typescript
// core/kernel/src/modules/agents/domain/services/resolution/resolveChannelPolicy.ts
import type { AgentInstance } from '../../contracts/schemas/agentInstance.schema.js';
import type { EffectiveChannelPolicy } from '../../contracts/schemas/resolvedAgent.schema.js';

export interface ResolveChannelPolicyOptions {
  agent: AgentInstance;
}

export function resolveEffectiveChannelPolicy(options: ResolveChannelPolicyOptions): EffectiveChannelPolicy {
  const { agent } = options;

  return {
    allowedChannels: agent.allowedChannels,
    defaultChannelBehavior: agent.defaultChannelBehavior,
    channelOverrides: agent.channelOverrides,
    constraints: agent.channelConstraints,
  };
}
```

### 3.5 Resolução de ModelPolicy

```typescript
// core/kernel/src/modules/agents/domain/services/resolution/resolveModelPolicy.ts
import type { AgentInstance } from '../../contracts/schemas/agentInstance.schema.js';
import type { EffectiveModelPolicy } from '../../contracts/schemas/resolvedAgent.schema.js';

export interface ResolveModelPolicyOptions {
  agent: AgentInstance;
}

export function resolveEffectiveModelPolicy(options: ResolveModelPolicyOptions): EffectiveModelPolicy {
  const { agent } = options;

  return {
    preferredModel: agent.preferredModel,
    allowedModels: agent.allowedModels,
    providerConstraints: agent.providerConstraints,
    reasoningMode: agent.reasoningMode,
  };
}
```

### 3.6 Resolução Completa do Agente

```typescript
// core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts
import type { AgentInstance } from '../contracts/schemas/agentInstance.schema.js';
import type { ResolvedAgentConfig } from '../contracts/schemas/resolvedAgent.schema.js';
import { resolveEffectiveSystemPrompt } from './resolution/resolveSystemPrompt.js';
import { resolveEffectiveBehaviorProfile } from './resolution/resolveBehaviorProfile.js';
import { resolveEffectiveExecutionPolicy } from './resolution/resolveExecutionPolicy.js';
import { resolveEffectiveChannelPolicy } from './resolution/resolveChannelPolicy.js';
import { resolveEffectiveModelPolicy } from './resolution/resolveModelPolicy.js';

export interface ResolutionContext {
  runtimeBindings?: Record<string, unknown>;
}

export interface AgentConfigResolver {
  resolve(agent: AgentInstance, context?: ResolutionContext): ResolvedAgentConfig;
  validateResolvedConfig(config: ResolvedAgentConfig): boolean;
}

export class DefaultAgentConfigResolver implements AgentConfigResolver {
  resolve(agent: AgentInstance, context?: ResolutionContext): ResolvedAgentConfig {
    const now = new Date().toISOString();

    // Resolução de campos efetivos
    const effectiveSystemPrompt = resolveEffectiveSystemPrompt({ agent });
    const effectiveBehaviorProfile = resolveEffectiveBehaviorProfile({ agent });
    const effectiveExecutionPolicy = resolveEffectiveExecutionPolicy({ agent });
    const effectiveChannelPolicy = resolveEffectiveChannelPolicy({ agent });
    const effectiveModelPolicy = resolveEffectiveModelPolicy({ agent });

    // Construir resolução completa
    const resolved: ResolvedAgentConfig = {
      // Identidade
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      shortDescription: agent.shortDescription,
      longDescription: agent.longDescription,
      owner: agent.owner,
      source: agent.source,
      version: agent.version,
      status: agent.status,

      // Origem
      templateId: agent.templateId,
      isTemplateDerived: agent.isTemplateDerived,
      templateSource: agent.templateSource,
      templateVariant: agent.templateVariant,
      originTemplateVersion: agent.originTemplateVersion,

      // Papel e objetivo
      role: agent.role,
      mission: agent.mission,
      domain: agent.domain,
      objective: agent.objective,
      successCriteria: agent.successCriteria,

      // Personalidade (effective)
      effectiveBehaviorProfile,

      // Instruções (effective)
      effectiveSystemPrompt,

      // Modelo e execução (effective)
      effectiveExecutionPolicy,

      // Capacidades
      toolsEnabled: agent.toolsEnabled,
      knowledgeEnabled: agent.knowledgeEnabled,
      memoryEnabled: agent.memoryEnabled,
      routingEnabled: agent.routingEnabled,
      handoffEnabled: agent.handoffEnabled,
      humanEscalationEnabled: agent.humanEscalationEnabled,
      capabilities: agent.capabilities,

      // Canais (effective)
      effectiveChannelPolicy,

      // Modelo (effective)
      effectiveModelPolicy,

      // Governança
      isActive: agent.isActive,
      isEditable: agent.isEditable,
      visibility: agent.visibility,

      // Ciclo de vida
      originType: agent.originType,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,

      // Metadata de resolução
      resolutionTrace: this.buildResolutionTrace(agent, context),
      configSnapshotVersion: agent.configSnapshotVersion + 1,
      lastResolvedAt: now,
      lastValidatedAt: null,
    };

    return resolved;
  }

  validateResolvedConfig(config: ResolvedAgentConfig): boolean {
    // Validar campos críticos obrigatórios
    const requiredFields = [
      'id', 'name', 'slug', 'role', 'objective', 'persona', 'tone', 'style',
      'effectiveSystemPrompt', 'effectiveBehaviorProfile', 'effectiveExecutionPolicy',
      'effectiveChannelPolicy', 'effectiveModelPolicy'
    ];

    for (const field of requiredFields) {
      const value = config[field as keyof ResolvedAgentConfig];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }

    // Validar effectiveSystemPrompt não vazio
    if (!config.effectiveSystemPrompt || config.effectiveSystemPrompt.trim().length === 0) {
      return false;
    }

    // Validar isActive para execução
    if (!config.isActive) {
      return false;
    }

    return true;
  }

  private buildResolutionTrace(agent: AgentInstance, context?: ResolutionContext): Record<string, Array<{ source: string; value: unknown; resolvedAt: string }>> {
    const now = new Date().toISOString();

    return {
      id: [{ source: 'agent.explicitParameters', value: agent.id, resolvedAt: now }],
      name: [{ source: 'agent.explicitParameters', value: agent.name, resolvedAt: now }],
      slug: [{ source: 'agent.explicitParameters', value: agent.slug, resolvedAt: now }],
      effectiveSystemPrompt: [{ source: 'agent.explicitParameters', value: 'merged', resolvedAt: now }],
      effectiveBehaviorProfile: [{ source: 'agent.explicitParameters', value: 'consolidated', resolvedAt: now }],
      effectiveExecutionPolicy: [{ source: 'agent.explicitParameters', value: 'consolidated', resolvedAt: now }],
      effectiveChannelPolicy: [{ source: 'agent.explicitParameters', value: 'consolidated', resolvedAt: now }],
      effectiveModelPolicy: [{ source: 'agent.explicitParameters', value: 'consolidated', resolvedAt: now }],
    };
  }
}
```

---

## 4. Cadeia de Precedência

A cadeia de precedência para resolução de configuração é:

```
1. template.baseConfig
      ↓
2. template.defaults
      ↓
3. agent.overrides
      ↓
4. agent.explicitParameters
      ↓
5. runtimeBindings (quando aplicável)
```

### 4.1 Regras de Merge

| Tipo de Campo | Estratégia de Merge |
|---------------|---------------------|
| strings | Sobrescrever (último wins) |
| arrays | Concatenar e deduplicar |
| objects | Merge recursivo profundo |
| booleans | Sobrescrever (último wins) |
| números | Sobrescrever (último wins) |

### 4.2 Resolução de Campos Derivados

1. **effectiveSystemPrompt**: merge de systemPrompt + operatingInstructions + doRules + dontRules
2. **effectiveBehaviorProfile**: consolidação de persona + tone + style + interactionMode + behaviorProfile
3. **effectiveExecutionPolicy**: consolidação de temperature + maxTokens + timeout + retryPolicy + responseFormat + reasoningMode
4. **effectiveChannelPolicy**: merge de allowedChannels + defaultChannelBehavior + channelOverrides + channelConstraints
5. **effectiveModelPolicy**: merge de preferredModel + allowedModels + providerConstraints

---

## 5. Validação de Execução

### 5.1 Pré-execução

Antes de executar um agente, o sistema DEVE verificar:

1. `resolvedConfig` não é nulo
2. `effectiveSystemPrompt` não está vazio
3. `isActive` é `true`
4. `role` e `objective` estão presentes
5. `persona`, `tone`, `style` estão presentes

### 5.2 Falha de Resolução

Se a resolução falhar, o sistema DEVE:
1. Registrar erro detalhado
2. Manter `resolvedConfig` como `null`
3. Definir `lastValidatedAt` como `null`
4. Impedir execução do agente

---

## 6. Exportação de Schemas

```typescript
// core/kernel/src/modules/agents/contracts/schemas/index.ts
export * from './agentInstance.schema.js';
export * from './resolvedAgent.schema.js';
export * from './retryPolicy.schema.js';
export * from './auditMetadata.schema.js';
export * from './channelBehavior.schema.js';
```

---

## 7. Estrutura de Arquivos

```
core/kernel/src/modules/agents/
├── contracts/
│   └── schemas/
│       ├── index.ts
│       ├── agentInstance.schema.ts
│       ├── resolvedAgent.schema.ts
│       ├── retryPolicy.schema.ts
│       ├── auditMetadata.schema.ts
│       └── channelBehavior.schema.ts
├── domain/
│   └── services/
│       ├── agentConfigResolver.ts
│       └── resolution/
│           ├── index.ts
│           ├── resolveSystemPrompt.ts
│           ├── resolveBehaviorProfile.ts
│           ├── resolveExecutionPolicy.ts
│           ├── resolveChannelPolicy.ts
│           └── resolveModelPolicy.ts
└── __tests__/
    └── resolution/
        ├── resolveSystemPrompt.test.ts
        ├── resolveBehaviorProfile.test.ts
        ├── resolveExecutionPolicy.test.ts
        ├── resolveChannelPolicy.test.ts
        └── resolveModelPolicy.test.ts
```