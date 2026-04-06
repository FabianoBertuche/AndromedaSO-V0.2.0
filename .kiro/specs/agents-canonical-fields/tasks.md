# Tasks — agents-canonical-fields

## Visão Geral
Este arquivo lista as tasks ordenadas para implementação faseada dos campos canônicos de agentes. As tasks seguem uma ordem lógica de dependência: primeiro schemas básicos, depois schemas completos, depois funções de resolução, e finalmente validação e testes.

---

## Fase 1: Schemas Auxiliares

### Task 1.1: Criar retryPolicy Schema
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/retryPolicy.schema.ts`
- [x] Definir schema Zod com campos: maxRetries (default: 0), backoffMs (default: 0), strategy (enum: none/fixed/exponential, default: none)
- [x] Exportar tipo RetryPolicy
- [x] Executar `npx tsc --noEmit` para validar

### Task 1.2: Criar auditMetadata Schema
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/auditMetadata.schema.ts`
- [x] Definir schema Zod com campos: createdBy (nullable), updatedBy (nullable), reason (nullable)
- [x] Exportar tipo AuditMetadata
- [x] Executar `npx tsc --noEmit` para validar

### Task 1.3: Criar channelBehavior Schema
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/channelBehavior.schema.ts`
- [x] Definir schema Zod como record<string, unknown> com default {}
- [x] Exportar tipo ChannelBehavior
- [x] Executar `npx tsc --noEmit` para validar

---

## Fase 2: AgentInstance Schema Completo

### Task 2.1: Criar enums base
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/enums.ts`
- [x] Definir todos os enums: agentStatusEnum, templateInheritanceModeEnum, templateLockPolicyEnum, interactionModeEnum, responseFormatEnum, reasoningModeEnum, originTypeEnum, visibilityEnum
- [x] Exportar todos os enums
- [x] Executar `npx tsc --noEmit` para validar

### Task 2.2: Criar agentInstanceSchema completo
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/agentInstance.schema.ts`
- [x] Importar schemas auxiliares e enums
- [x] Definir agentInstanceSchema com todos os campos das seções:
  - Identidade (id, name, slug, shortDescription, longDescription, owner, source, version, status)
  - Origem e template (templateId, isTemplateDerived, templateSource, templateVariant, templateManifestRef, originTemplateVersion, templateDefaultsSnapshot, templateInheritanceMode, templateLockPolicy)
  - Papel e objetivo (role, mission, domain, objective, successCriteria)
  - Personalidade e interação (persona, tone, style, behaviorProfile, interactionMode, defaultLanguage, tags, categories)
  - Instruções e políticas (systemPrompt, operatingInstructions, doRules, dontRules, guardrails, escalationRules)
  - Modelo e execução (preferredModel, allowedModels, providerConstraints, channelConstraints, temperature, topP, maxTokens, responseFormat, reasoningMode, timeoutMs, retryPolicy)
  - Capacidades (toolsEnabled, knowledgeEnabled, memoryEnabled, routingEnabled, handoffEnabled, humanEscalationEnabled, capabilities)
  - Canais (allowedChannels, defaultChannelBehavior, channelOverrides)
  - Governança e edição (isActive, isEditable, visibility, auditMetadata)
  - Ciclo de vida (originType, cloneOfAgentId, isDeleted, deletedAt, activatedAt, deactivatedAt, createdAt, updatedAt)
  - Resolução (overrides, explicitParameters, resolvedConfig, resolutionTrace, effectiveSystemPrompt, effectiveBehaviorProfile, effectiveExecutionPolicy, effectiveChannelPolicy, effectiveModelPolicy, configSnapshotVersion, lastResolvedAt, lastValidatedAt)
- [x] Aplicar defaults consistentes com o documento canônico
- [x] Exportar tipo AgentInstance
- [x] Executar `npx tsc --noEmit` para validar

### Task 2.3: Criar index.ts para schemas
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/index.ts`
- [x] Exportar todos os schemas e tipos das fases 1 e 2
- [x] Executar `npx tsc --noEmit` para validar

---

## Fase 3: ResolvedAgent Schema

### Task 3.1: Criar effectiveBehaviorProfile Schema
- [x] Criar arquivo `core/kernel/src/modules/agents/contracts/schemas/resolvedAgent.schema.ts` (seção inicial)
- [x] Definir effectiveBehaviorProfileSchema com campos: persona, tone, style, interactionMode, behaviorProfile
- [x] Exportar tipo EffectiveBehaviorProfile

### Task 3.2: Criar effectiveExecutionPolicy Schema
- [x] Adicionar ao arquivo `resolvedAgent.schema.ts`
- [x] Definir effectiveExecutionPolicySchema com campos: temperature, topP, maxTokens, responseFormat, reasoningMode, timeoutMs, retryPolicy
- [x] Exportar tipo EffectiveExecutionPolicy

### Task 3.3: Criar effectiveChannelPolicy Schema
- [x] Adicionar ao arquivo `resolvedAgent.schema.ts`
- [x] Definir effectiveChannelPolicySchema com campos: allowedChannels, defaultChannelBehavior, channelOverrides, constraints
- [x] Exportar tipo EffectiveChannelPolicy

### Task 3.4: Criar effectiveModelPolicy Schema
- [x] Adicionar ao arquivo `resolvedAgent.schema.ts`
- [x] Definir effectiveModelPolicySchema com campos: preferredModel, allowedModels, providerConstraints, reasoningMode
- [x] Exportar tipo EffectiveModelPolicy

### Task 3.5: Criar resolvedAgentSchema completo
- [x] Adicionar ao arquivo `resolvedAgent.schema.ts`
- [x] Definir resolvedAgentSchema com todos os campos resolvidos:
  - Identidade resolvida
  - Origem e template resolvida
  - Papel e objetivo resolvido
  - effectiveBehaviorProfile
  - effectiveSystemPrompt
  - effectiveExecutionPolicy
  - Capacidades
  - effectiveChannelPolicy
  - effectiveModelPolicy
  - Governança
  - Ciclo de vida
  - Metadata de resolução (resolutionTrace, configSnapshotVersion, lastResolvedAt, lastValidatedAt)
- [x] Exportar tipo ResolvedAgentConfig
- [x] Executar `npx tsc --noEmit` para validar

### Task 3.6: Atualizar index.ts
- [x] Atualizar `core/kernel/src/modules/agents/contracts/schemas/index.ts`
- [x] Adicionar exports de resolvedAgentSchema e tipos relacionados
- [x] Executar `npx tsc --noEmit` para validar

---

## Fase 4: Funções de Resolução

### Task 4.1: Criar diretório de resolução
- [x] Criar diretório `core/kernel/src/modules/agents/domain/services/resolution/`
- [x] Criar arquivo `index.ts` para exports

### Task 4.2: Implementar resolveSystemPrompt
- [x] Criar arquivo `resolveSystemPrompt.ts`
- [x] Implementar função que faz merge de systemPrompt + operatingInstructions + doRules + dontRules
- [x] Formatar saída com seções claras
- [x] Exportar função resolveEffectiveSystemPrompt
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.3: Implementar resolveBehaviorProfile
- [x] Criar arquivo `resolveBehaviorProfile.ts`
- [x] Implementar função que consolida persona + tone + style + interactionMode + behaviorProfile
- [x] Exportar função resolveEffectiveBehaviorProfile
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.4: Implementar resolveExecutionPolicy
- [x] Criar arquivo `resolveExecutionPolicy.ts`
- [x] Implementar função que consolida temperature + topP + maxTokens + timeoutMs + retryPolicy + responseFormat + reasoningMode
- [x] Exportar função resolveEffectiveExecutionPolicy
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.5: Implementar resolveChannelPolicy
- [x] Criar arquivo `resolveChannelPolicy.ts`
- [x] Implementar função que consolida allowedChannels + defaultChannelBehavior + channelOverrides + channelConstraints
- [x] Exportar função resolveEffectiveChannelPolicy
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.6: Implementar resolveModelPolicy
- [x] Criar arquivo `resolveModelPolicy.ts`
- [x] Implementar função que consolida preferredModel + allowedModels + providerConstraints + reasoningMode
- [x] Exportar função resolveEffectiveModelPolicy
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.7: Implementar agentConfigResolver
- [x] Criar arquivo `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`
- [x] Implementar classe DefaultAgentConfigResolver
- [x] Implementar método resolve() que chama todas as funções de resolução
- [x] Implementar método validateResolvedConfig() que verifica campos críticos
- [x] Implementar método buildResolutionTrace() que rastreia origem dos campos
- [x] Exportar interface AgentConfigResolver e implementação
- [x] Executar `npx tsc --noEmit` para validar

### Task 4.8: Atualizar index.ts de resolução
- [x] Atualizar `core/kernel/src/modules/agents/domain/services/resolution/index.ts`
- [x] Exportar todas as funções de resolução
- [x] Executar `npx tsc --noEmit` para validar

---

## Fase 5: Validação e Integração

### Task 5.1: Integrar resolver ao módulo de agentes
- [ ] Revisar `agents-module/tasks.md` para entender integração existente
- [ ] Atualizar serviço de aplicação de agentes para usar agentConfigResolver
- [ ] Garantir que resolvedConfig seja calculado antes de persistência
- [ ] Executar `npx tsc --noEmit` para validar

### Task 5.2: Implementar validação de execução
- [ ] Criar arquivo `core/kernel/src/modules/agents/domain/services/agentExecutionValidator.ts`
- [ ] Implementar função que verifica se agente pode executar (isActive, resolvedConfig válida, campos críticos presentes)
- [ ] Exportar função canExecuteAgent
- [ ] Executar `npx tsc --noEmit` para validar

---

## Fase 6: Testes Unitários

### Task 6.1: Testar resolveSystemPrompt
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/resolveSystemPrompt.test.ts`
- [ ] Testar merge sem instruções adicionais
- [ ] Testar merge com operatingInstructions
- [ ] Testar merge com doRules e dontRules
- [ ] Testar merge com todos os campos
- [ ] Executar testes e verificar passar

### Task 6.2: Testar resolveBehaviorProfile
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/resolveBehaviorProfile.test.ts`
- [ ] Testar consolidação de todos os campos
- [ ] Testar valores padrão
- [ ] Executar testes e verificar passar

### Task 6.3: Testar resolveExecutionPolicy
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/resolveExecutionPolicy.test.ts`
- [ ] Testar consolidação de todos os campos
- [ ] Testar retryPolicy
- [ ] Executar testes e verificar passar

### Task 6.4: Testar resolveChannelPolicy
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/resolveChannelPolicy.test.ts`
- [ ] Testar consolidação de todos os campos
- [ ] Testar channelOverrides
- [ ] Executar testes e verificar passar

### Task 6.5: Testar resolveModelPolicy
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/resolveModelPolicy.test.ts`
- [ ] Testar consolidação de todos os campos
- [ ] Testar allowedModels vazio
- [ ] Executar testes e verificar passar

### Task 6.6: Testar agentConfigResolver
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/agentConfigResolver.test.ts`
- [ ] Testar resolução completa de agente
- [ ] Testar validação de resolvedConfig válida
- [ ] Testar validação de resolvedConfig inválida
- [ ] Testar resolutionTrace
- [ ] Executar testes e verificar passar

### Task 6.7: Testar agentExecutionValidator
- [ ] Criar arquivo `core/kernel/src/modules/agents/__tests__/resolution/agentExecutionValidator.test.ts`
- [ ] Testar agente pode executar (isActive=true, resolvedConfig válida)
- [ ] Testar agente não pode executar (isActive=false)
- [ ] Testar agente não pode executar (resolvedConfig nula)
- [ ] Testar agente não pode executar (effectiveSystemPrompt vazio)
- [ ] Executar testes e verificar passar

---

## Fase 7: Testes de Integração

### Task 7.1: Testar criação de agente com campos completos
- [ ] Criar teste de integração para POST /agents com todos os campos
- [ ] Verificar que resolvedConfig é gerado automaticamente
- [ ] Verificar que effectiveSystemPrompt contém merge correto
- [ ] Executar testes e verificar passar

### Task 7.2: Testar resolução após edição
- [ ] Criar teste de integração para PUT /agents/:id
- [ ] Verificar que resolvedConfig é recalculado
- [ ] Verificar que effective* fields são atualizados
- [ ] Executar testes e verificar passar

### Task 7.3: Testar validação de execução
- [ ] Criar teste de integração para load de agente
- [ ] Verificar que agente inativo não pode ser carregado
- [ ] Verificar que agente sem resolvedConfig não pode ser carregado
- [ ] Executar testes e verificar passar

---

## Resumo de Tasks por Fase

| Fase | Tasks | Total |
|------|-------|-------|
| 1: Schemas Auxiliares | 1.1, 1.2, 1.3 | 3 |
| 2: AgentInstance Schema | 2.1, 2.2, 2.3 | 3 |
| 3: ResolvedAgent Schema | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | 6 |
| 4: Funções de Resolução | 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8 | 8 |
| 5: Validação e Integração | 5.1, 5.2 | 2 |
| 6: Testes Unitários | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7 | 7 |
| 7: Testes de Integração | 7.1, 7.2, 7.3 | 3 |
| **Total** | | **32** |

---

## Dependências Externas

- Schema Zod já está em uso no projeto
- Drizzle ORM já está em uso no projeto
- Fastify já está em uso no projeto
- Não são necessárias novas dependências

---

## Notas de Implementação

1. Todos os arquivos DEVEM seguir a convenção de imports com extensão `.js` (ESM)
2. O logger DEVE usar `pino({ name: 'nome-do-modulo' })` sem console.log
3. Nenhum campo pode ter tipo `any` sem justificativa em comentário
4. Após cada task obrigatória, executar `npx tsc --noEmit` para validar
5. Tasks com `*` são opcionais e só devem ser implementadas se explicitamente solicitadas
