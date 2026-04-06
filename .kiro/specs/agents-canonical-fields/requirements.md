# Requisitos — agents-canonical-fields

## Nome
agents-canonical-fields

## Descrição
Implementar todos os ~170 campos canônicos do documento `docs/suporte/andromeda-agents-canonical-fields.md` no módulo de agentes, incluindo schemas Zod, resolução determinística e validação completa dos contratos.

---

## Requisitos Funcionais

### REQ-IDENT-001: Identidade do agente
O sistema DEVE suportar todos os campos de identidade do agente:
- `id` (string, obrigatório) - Identificador único estável
- `name` (string, obrigatório) - Nome humano principal
- `slug` (string, obrigatório) - Identificador legível e amigável, derivado de name se não informado
- `shortDescription` (string, não obrigatório, default: "") - Resumo curto para listagens
- `longDescription` (string, não obrigatório, default: "") - Descrição detalhada
- `owner` (string, não obrigatório, default: "system") - Dono lógico do agente
- `source` (string, não obrigatório, default: "manual") - Origem de criação
- `version` (string, obrigatório, default: "1.0.0") - Versão lógica do registro
- `status` (enum, obrigatório, default: "draft") - Estado de vida do agente

### REQ-ORIGIN-001: Origem e template
O sistema DEVE suportar todos os campos de origem e template:
- `templateId` (string | null, não obrigatório, default: null) - ID do template de origem
- `isTemplateDerived` (boolean, obrigatório, default: false) - Indica se foi instanciado de template
- `templateSource` (string | null, não obrigatório, default: null) - Origem lógica do template
- `templateVariant` (string | null, não obrigatório, default: null) - Variante concreta do template
- `templateManifestRef` (string | null, não obrigatório, default: null) - Referência ao manifesto
- `originTemplateVersion` (string | null, não obrigatório, default: null) - Versão do template na instanciação
- `templateDefaultsSnapshot` (object | null, não obrigatório, default: null) - Snapshot dos defaults herdados
- `templateInheritanceMode` (enum, não obrigatório, default: "copy-on-create") - Modo de preservação do vínculo
- `templateLockPolicy` (enum, não obrigatório, default: "none") - Política de travamento de campos

### REQ-PURPOSE-001: Papel e objetivo
O sistema DEVE suportar todos os campos de papel e objetivo:
- `role` (string, obrigatório) - Papel principal do agente
- `mission` (string, não obrigatório, default: "") - Missão resumida
- `domain` (string, não obrigatório, default: "general") - Domínio de atuação
- `objective` (string, obrigatório) - Objetivo funcional primário
- `successCriteria` (string[], não obrigatório, default: []) - Critérios de sucesso

### REQ-PERSONA-001: Personalidade e interação
O sistema DEVE suportar todos os campos de personalidade:
- `persona` (string, obrigatório) - Descrição principal da persona
- `tone` (string, obrigatório, default: "neutro") - Tom de voz predominante
- `style` (string, obrigatório, default: "claro-e-objetivo") - Estilo de resposta
- `behaviorProfile` (string, não obrigatório, default: "default") - Nome do perfil comportamental
- `interactionMode` (enum, não obrigatório, default: "guided") - Modo de interação
- `defaultLanguage` (string, não obrigatório, default: "pt-BR") - Idioma padrão
- `tags` (string[], não obrigatório, default: []) - Etiquetas para categorização
- `categories` (string[], não obrigatório, default: []) - Classificações funcionais

### REQ-INSTRUCT-001: Instruções e políticas
O sistema DEVE suportar todos os campos de instruções:
- `systemPrompt` (string, obrigatório) - Instrução-base principal
- `operatingInstructions` (string[], não obrigatório, default: []) - Instruções operacionais complementares
- `doRules` (string[], não obrigatório, default: []) - Regras do que deve fazer
- `dontRules` (string[], não obrigatório, default: []) - Regras do que não pode fazer
- `guardrails` (string[], não obrigatório, default: []) - Restrições de segurança
- `escalationRules` (string[], não obrigatório, default: []) - Regras de escalonamento

### REQ-MODEL-001: Modelo e execução
O sistema DEVE suportar todos os campos de modelo e execução:
- `preferredModel` (string | null, não obrigatório, default: null) - Modelo preferencial
- `allowedModels` (string[], não obrigatório, default: []) - Lista branca de modelos
- `providerConstraints` (string[], não obrigatório, default: []) - Restrições de provider
- `channelConstraints` (string[], não obrigatório, default: []) - Restrições de canal
- `temperature` (number, não obrigatório, default: 0.7) - Grau de criatividade
- `topP` (number, não obrigatório, default: 1.0) - Parâmetro nucleus sampling
- `maxTokens` (number | null, não obrigatório, default: null) - Limite de tokens
- `responseFormat` (enum, não obrigatório, default: "markdown") - Formato de saída
- `reasoningMode` (enum | null, não obrigatório, default: null) - Modo de raciocínio
- `timeoutMs` (number, não obrigatório, default: 30000) - Tempo máximo de execução
- `retryPolicy` (object, não obrigatório, default: {maxRetries: 0}) - Política de retentativas

### REQ-CAPAB-001: Capacidades
O sistema DEVE suportar todos os campos de capacidades:
- `toolsEnabled` (boolean, obrigatório, default: false) - Pode usar ferramentas
- `knowledgeEnabled` (boolean, obrigatório, default: false) - Pode acessar conhecimento
- `memoryEnabled` (boolean, obrigatório, default: false) - Usa memória conversacional
- `routingEnabled` (boolean, obrigatório, default: false) - Participa de roteamento
- `handoffEnabled` (boolean, obrigatório, default: false) - Pode transferir para outro agente
- `humanEscalationEnabled` (boolean, obrigatório, default: false) - Pode escalar para humano
- `capabilities` (string[], não obrigatório, default: []) - Lista declarativa de capacidades

### REQ-CHANNEL-001: Canais
O sistema DEVE suportar todos os campos de canais:
- `allowedChannels` (string[], não obrigatório, default: []) - Lista branca de canais
- `defaultChannelBehavior` (object, não obrigatório, default: {}) - Comportamento padrão por canal
- `channelOverrides` (object, não obrigatório, default: {}) - Configurações específicas por canal

### REQ-GOV-001: Governança e edição
O sistema DEVE suportar todos os campos de governança:
- `isActive` (boolean, obrigatório, default: false) - Aptidão para operar
- `isEditable` (boolean, obrigatório, default: true) - Capacidade de alteração
- `visibility` (enum, não obrigatório, default: "internal") - Nível de visibilidade
- `auditMetadata` (object, não obrigatório, default: {}) - Metadados de auditoria

### REQ-LIFECYCLE-001: Ciclo de vida
O sistema DEVE suportar todos os campos de ciclo de vida:
- `originType` (enum, obrigatório, default: "manual") - Tipo de origem
- `cloneOfAgentId` (string | null, não obrigatório, default: null) - ID do agente original se duplicado
- `isDeleted` (boolean, obrigatório, default: false) - Marca de exclusão lógica
- `deletedAt` (datetime | null, não obrigatório, default: null) - Timestamp de exclusão
- `activatedAt` (datetime | null, não obrigatório, default: null) - Timestamp de ativação
- `deactivatedAt` (datetime | null, não obrigatório, default: null) - Timestamp de desativação
- `createdAt` (datetime, obrigatório) - Data de criação
- `updatedAt` (datetime, obrigatório) - Data da última atualização

### REQ-RESOL-001: Resolução de configuração
O sistema DEVE suportar todos os campos de resolução:
- `overrides` (object, não obrigatório, default: {}) - Overrides específicos do agente
- `explicitParameters` (object, não obrigatório, default: {}) - Parâmetros explícitos
- `resolvedConfig` (object | null, não obrigatório, default: null) - Configuração final consolidada
- `resolutionTrace` (object | null, não obrigatório, default: null) - Rastro de precedência
- `effectiveSystemPrompt` (string | null, não obrigatório, default: null) - Prompt efetivo final
- `effectiveBehaviorProfile` (object | null, não obrigatório, default: null) - Perfil comportamental efetivo
- `effectiveExecutionPolicy` (object | null, não obrigatório, default: null) - Política de execução efetiva
- `effectiveChannelPolicy` (object | null, não obrigatório, default: null) - Política de canais efetiva
- `effectiveModelPolicy` (object | null, não obrigatório, default: null) - Política de modelo efetiva
- `configSnapshotVersion` (number, não obrigatório, default: 1) - Versão do snapshot
- `lastResolvedAt` (datetime | null, não obrigatório, default: null) - Última resolução
- `lastValidatedAt` (datetime | null, não obrigatório, default: null) - Última validação

### REQ-AUX-001: Objetos auxiliares
O sistema DEVE definir schemas para objetos auxiliares:
- `retryPolicy`: maxRetries (number, default: 0), backoffMs (number, default: 0), strategy (enum, default: "none")
- `auditMetadata`: createdBy (string | null), updatedBy (string | null), reason (string | null)

---

## Requisitos de Resolução

### REQ-RESOL-002: effectiveSystemPrompt
O sistema DEVE gerar o effectiveSystemPrompt via merge de:
1. systemPrompt (base)
2. operatingInstructions (anexadas como linhas adicionais)
3. doRules (incorporadas como diretivas positivas)
4. dontRules (incorporadas como restrições)

### REQ-RESOL-003: effectiveBehaviorProfile
O sistema DEVE consolidar o effectiveBehaviorProfile a partir de:
1. persona (descrição principal)
2. tone (tom de voz)
3. style (estilo de resposta)
4. interactionMode (modo de interação)
5. behaviorProfile (nome do perfil)

### REQ-RESOL-004: effectiveExecutionPolicy
O sistema DEVE consolidar o effectiveExecutionPolicy a partir de:
1. temperature
2. maxTokens
3. timeoutMs
4. retryPolicy
5. responseFormat
6. reasoningMode

### REQ-RESOL-005: effectiveChannelPolicy
O sistema DEVE consolidar o effectiveChannelPolicy a partir de:
1. allowedChannels (lista base)
2. defaultChannelBehavior (comportamentos padrão)
3. channelOverrides (overrides específicos)
4. channelConstraints (restrições declaradas)

### REQ-RESOL-006: effectiveModelPolicy
O sistema DEVE consolidar o effectiveModelPolicy a partir de:
1. preferredModel
2. allowedModels (lista branca)
3. providerConstraints
4. reasoningMode

### REQ-RESOL-007: resolutionTrace
O sistema DEVE rastrear a origem de cada campo resolvido:
- Cada campo no resolvedConfig DEVE ter entrada no resolutionTrace
- O resolutionTrace DEVE indicar a fonte (template/baseConfig, template/defaults, agent/overrides, agent/explicitParameters, runtime/bindings)
- O resolutionTrace DEVE ser consultável para auditoria e debugging

### REQ-RESOL-008:链条 de precedência
O sistema DEVE aplicar a seguinte cadeia de precedência:
1. template.baseConfig
2. template.defaults
3. agent.overrides
4. agent.explicitParameters
5. runtimeBindings (quando aplicável)

---

## Critérios de Aceitação

### CA-001: Campos completos
Todos os campos do documento `docs/suporte/andromeda-agents-canonical-fields.md` DEVEM estar presentes nos schemas Zod do módulo de agentes, sem omissões.

### CA-002: effectiveSystemPrompt
O campo effectiveSystemPrompt DEVE ser gerado automaticamente via merge determinístico de systemPrompt + operatingInstructions, sem intervention manual.

### CA-003: effectiveBehaviorProfile
O campo effectiveBehaviorProfile DEVE consolidar persona + tone + style + interactionMode em um único objeto estruturado.

### CA-004: effectiveExecutionPolicy
O campo effectiveExecutionPolicy DEVE consolidar temperature + maxTokens + timeout + retryPolicy em um único objeto.

### CA-005: effectiveChannelPolicy
O campo effectiveChannelPolicy DEVE consolidar allowedChannels + defaultChannelBehavior + channelOverrides.

### CA-006: effectiveModelPolicy
O campo effectiveModelPolicy DEVE consolidar preferredModel + allowedModels + providerConstraints.

### CA-007: resolutionTrace
O campo resolutionTrace DEVE rastrear a origem de cada campo resolvido, indicando claramente a fonte na cadeia de precedência.

### CA-008: resolvedConfig obrigatória
Nenhum agente pode executar sem uma resolvedConfig válida. O sistema DEVE bloquear a execução de agentes com resolvedConfig nula ou inválida.

### CA-009: Recorte mínimo
O sistema DEVE suportar o recorte mínimo obrigatório para criação consistente de um agente v1:
- id, name, slug, version, status, role, objective, persona, tone, style, systemPrompt, isActive, isEditable, originType, createdAt, updatedAt

---

## Regras Canônicas

1. **Nenhum agente deve executar sem resolvedConfig válida** - O runtime DEVE verificar a presença e validade do resolvedConfig antes de permitir execução.

2. **Cadeia de precedência explícita** - Os defaults DEVEM seguir a ordem: template.baseConfig → template.defaults → agent.overrides → agent.explicitParameters → runtimeBindings.

3. **Campos críticos obrigatórios** - Os campos persona, systemPrompt, role e objective NÃO DEVEM ficar implícitos.

4. **Templates adicionáveis por pasta** - Novos templates DEVEM ser adicionados por nova pasta em modules/agents/groups/*/variants/*/templates/*/, sem alteração do código do kernel.