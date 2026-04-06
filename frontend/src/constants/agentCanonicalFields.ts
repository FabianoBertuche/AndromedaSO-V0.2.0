// ============================================
// AGENT CANONICAL FIELDS - METADADOS PARA RENDERIZAÇÃO DINÂMICA
// ============================================
// Este arquivo contém metadados completos dos ~170 campos canônicos
// para facilitar renderização dinâmica na UI de agentes

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Tipos suportados para campos de agente
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  | 'datetime'
  | 'json';

/**
 * Metadados de um campo canônico
 */
export type FieldMetadata = {
  name: string;
  type: FieldType;
  required: boolean;
  default: unknown;
  description: string;
  enumValues?: string[];
  category: string;
};

/**
 * Definição de enum com valores possíveis
 */
export type EnumDefinition = {
  name: string;
  values: string[];
  description: string;
};

// ============================================
// ENUMS - VALORES POSSÍVEIS
// ============================================

/**
 * Status do agente no ciclo de vida
 */
export const AgentStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type AgentStatusType = typeof AgentStatus[keyof typeof AgentStatus];

/**
 * Tipo de origem do agente
 */
export const OriginType = {
  MANUAL: 'manual',
  TEMPLATE: 'template',
  IMPORT: 'import',
  CLONE: 'clone',
} as const;

export type OriginTypeType = typeof OriginType[keyof typeof OriginType];

/**
 * Visibilidade do agente
 */
export const Visibility = {
  PRIVATE: 'private',
  INTERNAL: 'internal',
  PUBLIC: 'public',
} as const;

export type VisibilityType = typeof Visibility[keyof typeof Visibility];

/**
 * Modo de interação do agente
 */
export const InteractionMode = {
  REACTIVE: 'reactive',
  PROACTIVE: 'proactive',
  GUIDED: 'guided',
  STRICT: 'strict',
} as const;

export type InteractionModeType = typeof InteractionMode[keyof typeof InteractionMode];

/**
 * Formato de resposta do agente
 */
export const ResponseFormat = {
  TEXT: 'text',
  MARKDOWN: 'markdown',
  JSON: 'json',
  STRUCTURED: 'structured',
} as const;

export type ResponseFormatType = typeof ResponseFormat[keyof typeof ResponseFormat];

/**
 * Modo de raciocínio do agente
 */
export const ReasoningMode = {
  DEFAULT: 'default',
  LIGHT: 'light',
  STANDARD: 'standard',
  DEEP: 'deep',
} as const;

export type ReasoningModeType = typeof ReasoningMode[keyof typeof ReasoningMode];

/**
 * Modo de herança de template
 */
export const TemplateInheritanceMode = {
  COPY_ON_CREATE: 'copy-on-create',
  LINKED_METADATA: 'linked-metadata',
} as const;

export type TemplateInheritanceModeType = typeof TemplateInheritanceMode[keyof typeof TemplateInheritanceMode];

/**
 * Política de bloqueio de template
 */
export const TemplateLockPolicy = {
  NONE: 'none',
  FUTURE: 'future',
  STRICT: 'strict',
} as const;

export type TemplateLockPolicyType = typeof TemplateLockPolicy[keyof typeof TemplateLockPolicy];

/**
 * Estratégia de retry
 */
export const RetryStrategy = {
  NONE: 'none',
  FIXED: 'fixed',
  EXPONENTIAL: 'exponential',
} as const;

export type RetryStrategyType = typeof RetryStrategy[keyof typeof RetryStrategy];

// ============================================
// ENUM DEFINITIONS COLLECTION
// ============================================

export const enumDefinitions: Record<string, EnumDefinition> = {
  agentStatus: {
    name: 'AgentStatus',
    values: Object.values(AgentStatus),
    description: 'Status do agente no ciclo de vida',
  },
  originType: {
    name: 'OriginType',
    values: Object.values(OriginType),
    description: 'Tipo de origem do agente',
  },
  visibility: {
    name: 'Visibility',
    values: Object.values(Visibility),
    description: 'Nível de visibilidade do agente',
  },
  interactionMode: {
    name: 'InteractionMode',
    values: Object.values(InteractionMode),
    description: 'Modo de interação do agente',
  },
  responseFormat: {
    name: 'ResponseFormat',
    values: Object.values(ResponseFormat),
    description: 'Formato de resposta do agente',
  },
  reasoningMode: {
    name: 'ReasoningMode',
    values: Object.values(ReasoningMode),
    description: 'Modo de raciocínio do agente',
  },
  templateInheritanceMode: {
    name: 'TemplateInheritanceMode',
    values: Object.values(TemplateInheritanceMode),
    description: 'Modo de herança de template',
  },
  templateLockPolicy: {
    name: 'TemplateLockPolicy',
    values: Object.values(TemplateLockPolicy),
    description: 'Política de bloqueio de template',
  },
  retryStrategy: {
    name: 'RetryStrategy',
    values: Object.values(RetryStrategy),
    description: 'Estratégia de retry',
  },
};

// ============================================
// FIELD METADATA - IDENTITY FIELDS
// ============================================

export const identityFields: Record<string, FieldMetadata> = {
  id: {
    name: 'id',
    type: 'string',
    required: true,
    default: '',
    description: 'Identificador único do agente (UUID v4)',
    category: 'identity',
  },
  name: {
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'Nome de exibição do agente',
    category: 'identity',
  },
  slug: {
    name: 'slug',
    type: 'string',
    required: true,
    default: '',
    description: 'Identificador URL-friendly do agente',
    category: 'identity',
  },
  shortDescription: {
    name: 'shortDescription',
    type: 'string',
    required: true,
    default: '',
    description: 'Descrição curta do agente (até 160 caracteres)',
    category: 'identity',
  },
  longDescription: {
    name: 'longDescription',
    type: 'string',
    required: true,
    default: '',
    description: 'Descrição completa do agente',
    category: 'identity',
  },
  version: {
    name: 'version',
    type: 'string',
    required: true,
    default: '1.0.0',
    description: 'Versão semântica do agente',
    category: 'identity',
  },
  status: {
    name: 'status',
    type: 'enum',
    required: true,
    default: AgentStatus.DRAFT,
    description: 'Status atual do agente no ciclo de vida',
    enumValues: Object.values(AgentStatus),
    category: 'identity',
  },
  role: {
    name: 'role',
    type: 'string',
    required: true,
    default: '',
    description: 'Papel/função do agente no sistema',
    category: 'identity',
  },
  mission: {
    name: 'mission',
    type: 'string',
    required: true,
    default: '',
    description: 'Declaração de missão do agente',
    category: 'identity',
  },
  domain: {
    name: 'domain',
    type: 'string',
    required: true,
    default: '',
    description: 'Domínio de atuação do agente',
    category: 'identity',
  },
  objective: {
    name: 'objective',
    type: 'string',
    required: true,
    default: '',
    description: 'Objetivo principal do agente',
    category: 'identity',
  },
  successCriteria: {
    name: 'successCriteria',
    type: 'array',
    required: true,
    default: [],
    description: 'Critérios de sucesso para execução do agente',
    category: 'identity',
  },
};

// ============================================
// FIELD METADATA - TEMPLATE FIELDS
// ============================================

export const templateFields: Record<string, FieldMetadata> = {
  templateId: {
    name: 'templateId',
    type: 'string',
    required: false,
    default: null,
    description: 'ID do template de origem (se aplicável)',
    category: 'template',
  },
  isTemplateDerived: {
    name: 'isTemplateDerived',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Indica se o agente foi derivado de um template',
    category: 'template',
  },
  templateSource: {
    name: 'templateSource',
    type: 'string',
    required: false,
    default: null,
    description: 'Fonte/origem do template',
    category: 'template',
  },
  templateVariant: {
    name: 'templateVariant',
    type: 'string',
    required: false,
    default: null,
    description: 'Variante específica do template utilizada',
    category: 'template',
  },
  templateManifestRef: {
    name: 'templateManifestRef',
    type: 'string',
    required: false,
    default: null,
    description: 'Referência ao manifesto do template',
    category: 'template',
  },
  originTemplateVersion: {
    name: 'originTemplateVersion',
    type: 'string',
    required: false,
    default: null,
    description: 'Versão do template na origem',
    category: 'template',
  },
  templateDefaultsSnapshot: {
    name: 'templateDefaultsSnapshot',
    type: 'object',
    required: false,
    default: null,
    description: 'Snapshot dos defaults do template no momento da criação',
    category: 'template',
  },
  templateInheritanceMode: {
    name: 'templateInheritanceMode',
    type: 'enum',
    required: true,
    default: TemplateInheritanceMode.COPY_ON_CREATE,
    description: 'Modo de herança de configurações do template',
    enumValues: Object.values(TemplateInheritanceMode),
    category: 'template',
  },
  templateLockPolicy: {
    name: 'templateLockPolicy',
    type: 'enum',
    required: true,
    default: TemplateLockPolicy.NONE,
    description: 'Política de bloqueio de campos herdados do template',
    enumValues: Object.values(TemplateLockPolicy),
    category: 'template',
  },
  cloneOfAgentId: {
    name: 'cloneOfAgentId',
    type: 'string',
    required: false,
    default: null,
    description: 'ID do agente original (se este for um clone)',
    category: 'template',
  },
};

// ============================================
// FIELD METADATA - PERSONALITY FIELDS
// ============================================

export const personalityFields: Record<string, FieldMetadata> = {
  persona: {
    name: 'persona',
    type: 'string',
    required: true,
    default: '',
    description: 'Persona do agente (caracterização de personalidade)',
    category: 'personality',
  },
  tone: {
    name: 'tone',
    type: 'string',
    required: true,
    default: 'professional',
    description: 'Tom de comunicação do agente',
    category: 'personality',
  },
  style: {
    name: 'style',
    type: 'string',
    required: true,
    default: 'concise',
    description: 'Estilo de comunicação do agente',
    category: 'personality',
  },
  behaviorProfile: {
    name: 'behaviorProfile',
    type: 'string',
    required: true,
    default: 'balanced',
    description: 'Perfil comportamental do agente',
    category: 'personality',
  },
  interactionMode: {
    name: 'interactionMode',
    type: 'enum',
    required: true,
    default: InteractionMode.REACTIVE,
    description: 'Modo de interação com usuários',
    enumValues: Object.values(InteractionMode),
    category: 'personality',
  },
  defaultLanguage: {
    name: 'defaultLanguage',
    type: 'string',
    required: true,
    default: 'pt-BR',
    description: 'Idioma padrão do agente',
    category: 'personality',
  },
  tags: {
    name: 'tags',
    type: 'array',
    required: true,
    default: [],
    description: 'Tags de categorização do agente',
    category: 'personality',
  },
  categories: {
    name: 'categories',
    type: 'array',
    required: true,
    default: [],
    description: 'Categorias do agente',
    category: 'personality',
  },
};

// ============================================
// FIELD METADATA - INSTRUCTIONS FIELDS
// ============================================

export const instructionsFields: Record<string, FieldMetadata> = {
  systemPrompt: {
    name: 'systemPrompt',
    type: 'string',
    required: true,
    default: '',
    description: 'Prompt de sistema principal do agente',
    category: 'instructions',
  },
  operatingInstructions: {
    name: 'operatingInstructions',
    type: 'array',
    required: true,
    default: [],
    description: 'Instruções operacionais do agente',
    category: 'instructions',
  },
  doRules: {
    name: 'doRules',
    type: 'array',
    required: true,
    default: [],
    description: 'Regras do que o agente DEVE fazer',
    category: 'instructions',
  },
  dontRules: {
    name: 'dontRules',
    type: 'array',
    required: true,
    default: [],
    description: 'Regras do que o agente NÃO DEVE fazer',
    category: 'instructions',
  },
  guardrails: {
    name: 'guardrails',
    type: 'array',
    required: true,
    default: [],
    description: 'Barreiras de segurança do agente',
    category: 'instructions',
  },
  escalationRules: {
    name: 'escalationRules',
    type: 'array',
    required: true,
    default: [],
    description: 'Regras de escalonamento para intervenção humana',
    category: 'instructions',
  },
};

// ============================================
// FIELD METADATA - MODEL FIELDS
// ============================================

export const modelFields: Record<string, FieldMetadata> = {
  preferredModel: {
    name: 'preferredModel',
    type: 'string',
    required: false,
    default: null,
    description: 'Modelo LLM preferencial do agente',
    category: 'model',
  },
  allowedModels: {
    name: 'allowedModels',
    type: 'array',
    required: true,
    default: [],
    description: 'Lista de modelos permitidos para o agente',
    category: 'model',
  },
  providerConstraints: {
    name: 'providerConstraints',
    type: 'array',
    required: true,
    default: [],
    description: 'Restrições de provedores de LLM',
    category: 'model',
  },
  channelConstraints: {
    name: 'channelConstraints',
    type: 'array',
    required: true,
    default: [],
    description: 'Restrições de canais de comunicação',
    category: 'model',
  },
  temperature: {
    name: 'temperature',
    type: 'number',
    required: true,
    default: 0.7,
    description: 'Temperatura de amostragem (0.0 a 2.0)',
    category: 'model',
  },
  topP: {
    name: 'topP',
    type: 'number',
    required: true,
    default: 1.0,
    description: 'Nucleus sampling parameter (0.0 a 1.0)',
    category: 'model',
  },
  maxTokens: {
    name: 'maxTokens',
    type: 'number',
    required: false,
    default: null,
    description: 'Máximo de tokens por resposta',
    category: 'model',
  },
  responseFormat: {
    name: 'responseFormat',
    type: 'enum',
    required: true,
    default: ResponseFormat.MARKDOWN,
    description: 'Formato de resposta preferido',
    enumValues: Object.values(ResponseFormat),
    category: 'model',
  },
  reasoningMode: {
    name: 'reasoningMode',
    type: 'enum',
    required: false,
    default: null,
    description: 'Modo de raciocínio do modelo',
    enumValues: Object.values(ReasoningMode),
    category: 'model',
  },
  timeoutMs: {
    name: 'timeoutMs',
    type: 'number',
    required: true,
    default: 30000,
    description: 'Timeout de execução em milissegundos',
    category: 'model',
  },
  retryPolicy: {
    name: 'retryPolicy',
    type: 'object',
    required: true,
    default: { maxRetries: 3, backoffMs: 1000, strategy: RetryStrategy.EXPONENTIAL },
    description: 'Política de retry para falhas recuperáveis',
    category: 'model',
  },
};

// ============================================
// FIELD METADATA - CAPABILITIES FIELDS
// ============================================

export const capabilitiesFields: Record<string, FieldMetadata> = {
  toolsEnabled: {
    name: 'toolsEnabled',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Habilita uso de ferramentas pelo agente',
    category: 'capabilities',
  },
  knowledgeEnabled: {
    name: 'knowledgeEnabled',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Habilita acesso a bases de conhecimento',
    category: 'capabilities',
  },
  memoryEnabled: {
    name: 'memoryEnabled',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Habilita memória persistente de conversas',
    category: 'capabilities',
  },
  routingEnabled: {
    name: 'routingEnabled',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Habilita roteamento para outros agentes',
    category: 'capabilities',
  },
  handoffEnabled: {
    name: 'handoffEnabled',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Habilita handoff para outros agentes',
    category: 'capabilities',
  },
  humanEscalationEnabled: {
    name: 'humanEscalationEnabled',
    type: 'boolean',
    required: true,
    default: true,
    description: 'Habilita escalonamento para intervenção humana',
    category: 'capabilities',
  },
  capabilities: {
    name: 'capabilities',
    type: 'array',
    required: true,
    default: [],
    description: 'Lista de capabilities registradas do agente',
    category: 'capabilities',
  },
};

// ============================================
// FIELD METADATA - CHANNELS FIELDS
// ============================================

export const channelsFields: Record<string, FieldMetadata> = {
  allowedChannels: {
    name: 'allowedChannels',
    type: 'array',
    required: true,
    default: [],
    description: 'Canais de comunicação permitidos',
    category: 'channels',
  },
  defaultChannelBehavior: {
    name: 'defaultChannelBehavior',
    type: 'object',
    required: true,
    default: {},
    description: 'Comportamento padrão por canal',
    category: 'channels',
  },
  channelOverrides: {
    name: 'channelOverrides',
    type: 'object',
    required: true,
    default: {},
    description: 'Overrides específicos por canal',
    category: 'channels',
  },
};

// ============================================
// FIELD METADATA - GOVERNANCE FIELDS
// ============================================

export const governanceFields: Record<string, FieldMetadata> = {
  owner: {
    name: 'owner',
    type: 'string',
    required: true,
    default: '',
    description: 'Proprietário/dono do agente',
    category: 'governance',
  },
  source: {
    name: 'source',
    type: 'string',
    required: true,
    default: '',
    description: 'Fonte/origem do agente',
    category: 'governance',
  },
  isActive: {
    name: 'isActive',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Flag de ativação do agente',
    category: 'governance',
  },
  isEditable: {
    name: 'isEditable',
    type: 'boolean',
    required: true,
    default: true,
    description: 'Flag indicando se o agente pode ser editado',
    category: 'governance',
  },
  visibility: {
    name: 'visibility',
    type: 'enum',
    required: true,
    default: Visibility.PRIVATE,
    description: 'Nível de visibilidade do agente',
    enumValues: Object.values(Visibility),
    category: 'governance',
  },
  auditMetadata: {
    name: 'auditMetadata',
    type: 'object',
    required: true,
    default: { createdBy: null, updatedBy: null, reason: null },
    description: 'Metadados de auditoria',
    category: 'governance',
  },
};

// ============================================
// FIELD METADATA - LIFECYCLE FIELDS
// ============================================

export const lifecycleFields: Record<string, FieldMetadata> = {
  originType: {
    name: 'originType',
    type: 'enum',
    required: true,
    default: OriginType.MANUAL,
    description: 'Tipo de origem da criação do agente',
    enumValues: Object.values(OriginType),
    category: 'lifecycle',
  },
  isDeleted: {
    name: 'isDeleted',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Flag de soft-delete',
    category: 'lifecycle',
  },
  deletedAt: {
    name: 'deletedAt',
    type: 'datetime',
    required: false,
    default: null,
    description: 'Data/hora do soft-delete',
    category: 'lifecycle',
  },
  activatedAt: {
    name: 'activatedAt',
    type: 'datetime',
    required: false,
    default: null,
    description: 'Data/hora da ativação',
    category: 'lifecycle',
  },
  deactivatedAt: {
    name: 'deactivatedAt',
    type: 'datetime',
    required: false,
    default: null,
    description: 'Data/hora da desativação',
    category: 'lifecycle',
  },
  createdAt: {
    name: 'createdAt',
    type: 'datetime',
    required: true,
    default: '',
    description: 'Data/hora de criação',
    category: 'lifecycle',
  },
  updatedAt: {
    name: 'updatedAt',
    type: 'datetime',
    required: true,
    default: '',
    description: 'Data/hora da última atualização',
    category: 'lifecycle',
  },
};

// ============================================
// FIELD METADATA - RESOLUTION FIELDS
// ============================================

export const resolutionFields: Record<string, FieldMetadata> = {
  overrides: {
    name: 'overrides',
    type: 'object',
    required: true,
    default: {},
    description: 'Overrides explícitos aplicados ao agente',
    category: 'resolution',
  },
  explicitParameters: {
    name: 'explicitParameters',
    type: 'object',
    required: true,
    default: {},
    description: 'Parâmetros operacionais explícitos',
    category: 'resolution',
  },
  resolvedConfig: {
    name: 'resolvedConfig',
    type: 'object',
    required: false,
    default: null,
    description: 'Configuração resolvida completa',
    category: 'resolution',
  },
  resolutionTrace: {
    name: 'resolutionTrace',
    type: 'object',
    required: false,
    default: null,
    description: 'Rastro de resolução de configuração',
    category: 'resolution',
  },
  effectiveSystemPrompt: {
    name: 'effectiveSystemPrompt',
    type: 'string',
    required: false,
    default: null,
    description: 'System prompt efetivo após resolução',
    category: 'resolution',
  },
  effectiveBehaviorProfile: {
    name: 'effectiveBehaviorProfile',
    type: 'object',
    required: false,
    default: null,
    description: 'Perfil comportamental efetivo após resolução',
    category: 'resolution',
  },
  effectiveExecutionPolicy: {
    name: 'effectiveExecutionPolicy',
    type: 'object',
    required: false,
    default: null,
    description: 'Política de execução efetiva após resolução',
    category: 'resolution',
  },
  effectiveChannelPolicy: {
    name: 'effectiveChannelPolicy',
    type: 'object',
    required: false,
    default: null,
    description: 'Política de canais efetiva após resolução',
    category: 'resolution',
  },
  effectiveModelPolicy: {
    name: 'effectiveModelPolicy',
    type: 'object',
    required: false,
    default: null,
    description: 'Política de modelo efetiva após resolução',
    category: 'resolution',
  },
  configSnapshotVersion: {
    name: 'configSnapshotVersion',
    type: 'number',
    required: true,
    default: 0,
    description: 'Versão do snapshot de configuração',
    category: 'resolution',
  },
  lastResolvedAt: {
    name: 'lastResolvedAt',
    type: 'datetime',
    required: false,
    default: null,
    description: 'Data/hora da última resolução',
    category: 'resolution',
  },
  lastValidatedAt: {
    name: 'lastValidatedAt',
    type: 'datetime',
    required: false,
    default: null,
    description: 'Data/hora da última validação',
    category: 'resolution',
  },
};

// ============================================
// AGGREGATED FIELD COLLECTIONS
// ============================================

/**
 * Todos os campos canônicos agrupados por categoria
 */
export const allFieldsByCategory: Record<string, Record<string, FieldMetadata>> = {
  identity: identityFields,
  template: templateFields,
  personality: personalityFields,
  instructions: instructionsFields,
  model: modelFields,
  capabilities: capabilitiesFields,
  channels: channelsFields,
  governance: governanceFields,
  lifecycle: lifecycleFields,
  resolution: resolutionFields,
};

/**
 * Array com todos os campos para iteração
 */
export const allFields: FieldMetadata[] = Object.values(allFieldsByCategory).flatMap(
  categoryFields => Object.values(categoryFields)
);

/**
 * Mapa de campos por nome para lookup rápido
 */
export const fieldsByName: Record<string, FieldMetadata> = allFields.reduce(
  (acc, field) => {
    acc[field.name] = field;
    return acc;
  },
  {} as Record<string, FieldMetadata>
);

// ============================================
// TAB MAPPINGS - MAPEAMENTO DE TABS
// ============================================

/**
 * Campos da tab de Identidade
 * Inclui: identidade, governança e ciclo de vida
 */
export const identityTabFields: string[] = [
  ...Object.keys(identityFields),
  ...Object.keys(governanceFields),
  ...Object.keys(lifecycleFields),
];

/**
 * Campos da tab de Comportamento
 * Inclui: personalidade e instruções
 */
export const behaviorTabFields: string[] = [
  ...Object.keys(personalityFields),
  ...Object.keys(instructionsFields),
];

/**
 * Campos da tab de Safeguards (barreiras)
 * Inclui: instruções (guardrails, regras)
 */
export const safeguardsTabFields: string[] = [
  ...Object.keys(instructionsFields),
];

/**
 * Campos da tab de Capacidades
 * Inclui: capacidades do agente
 */
export const capabilitiesTabFields: string[] = [
  ...Object.keys(capabilitiesFields),
];

/**
 * Campos da tab de Canais
 * Inclui: configurações de canais
 */
export const channelsTabFields: string[] = [
  ...Object.keys(channelsFields),
];

/**
 * Mapeamento completo de tabs para campos
 */
export const tabFieldMappings: Record<string, string[]> = {
  identity: identityTabFields,
  behavior: behaviorTabFields,
  safeguards: safeguardsTabFields,
  capabilities: capabilitiesTabFields,
  channels: channelsTabFields,
};

/**
 * Lista de todas as tabs disponíveis
 */
export const availableTabs = Object.keys(tabFieldMappings);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Obtém metadados de um campo pelo nome
 */
export function getFieldMetadata(fieldName: string): FieldMetadata | undefined {
  return fieldsByName[fieldName];
}

/**
 * Obtém todos os campos de uma categoria
 */
export function getFieldsByCategory(category: string): FieldMetadata[] {
  return Object.values(allFieldsByCategory[category] ?? {});
}

/**
 * Obtém todos os campos de uma tab
 */
export function getFieldsByTab(tabName: string): FieldMetadata[] {
  const fieldNames = tabFieldMappings[tabName] ?? [];
  return fieldNames.map(name => fieldsByName[name]).filter(Boolean);
}

/**
 * Verifica se um campo é de um tipo específico
 */
export function isFieldOfType(fieldName: string, type: FieldType): boolean {
  const field = fieldsByName[fieldName];
  return field?.type === type;
}

/**
 * Obtém campos obrigatórios
 */
export function getRequiredFields(): FieldMetadata[] {
  return allFields.filter(field => field.required);
}

/**
 * Obtém campos opcionais
 */
export function getOptionalFields(): FieldMetadata[] {
  return allFields.filter(field => !field.required);
}

/**
 * Obtém campos do tipo enum com seus valores
 */
export function getEnumFields(): FieldMetadata[] {
  return allFields.filter(field => field.type === 'enum');
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Enums
  AgentStatus,
  OriginType,
  Visibility,
  InteractionMode,
  ResponseFormat,
  ReasoningMode,
  TemplateInheritanceMode,
  TemplateLockPolicy,
  RetryStrategy,

  // Enum definitions
  enumDefinitions,

  // Field collections by category
  identityFields,
  templateFields,
  personalityFields,
  instructionsFields,
  modelFields,
  capabilitiesFields,
  channelsFields,
  governanceFields,
  lifecycleFields,
  resolutionFields,

  // Aggregated collections
  allFieldsByCategory,
  allFields,
  fieldsByName,

  // Tab mappings
  identityTabFields,
  behaviorTabFields,
  safeguardsTabFields,
  capabilitiesTabFields,
  channelsTabFields,
  tabFieldMappings,
  availableTabs,

  // Utility functions
  getFieldMetadata,
  getFieldsByCategory,
  getFieldsByTab,
  isFieldOfType,
  getRequiredFields,
  getOptionalFields,
  getEnumFields,
};
