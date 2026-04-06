## 1. Estrutura Base e Tipos

- [ ] 1.1 Verificar/estender tipos TypeScript em `frontend/src/types/kernel.ts` para garantir cobertura de todos os ~170 campos canônicos
- [ ] 1.2 Criar arquivo de constantes `frontend/src/constants/agentCanonicalFields.ts` com metadados dos campos (tipo, obrigatório, default, descrição)
- [ ] 1.3 Criar componente base `AgentFormField` para renderização dinâmica de campos baseado em tipo
- [ ] 1.4 Verificar tipos de API em `frontend/src/api/kernel.ts` e garantir compatibilidade com todos os campos

## 2. Componentes de Seção Reutilizáveis

- [ ] 2.1 Criar `frontend/src/components/agents/FormSection.tsx` - wrapper para seções colapsáveis
- [ ] 2.2 Criar `frontend/src/components/agents/ChipInput.tsx` - input para arrays de strings (tags, categories, etc)
- [ ] 2.3 Criar `frontend/src/components/agents/JSONEditor.tsx` - editor com syntax highlighting para campos object
- [ ] 2.4 Criar `frontend/src/components/agents/RetryPolicyForm.tsx` - formulário nested para retryPolicy
- [ ] 2.5 Criar `frontend/src/components/agents/AuditMetadataDisplay.tsx` - display read-only de auditMetadata

## 3. Tabs Principais - Identity

- [ ] 3.1 Criar `frontend/src/components/agents/tabs/IdentityTab.tsx`
- [ ] 3.2 Implementar Seção 1.1: Campos de Identidade (id, name, slug, shortDescription, longDescription, owner, source, version, status)
- [ ] 3.3 Implementar Seção 1.2: Campos de Origem e Template (templateId, isTemplateDerived, templateSource, templateVariant, templateManifestRef, originTemplateVersion, templateDefaultsSnapshot, templateInheritanceMode, templateLockPolicy)
- [ ] 3.4 Implementar Seção 1.3: Campos de Papel e Objetivo (role, mission, domain, objective, successCriteria)
- [ ] 3.5 Implementar Seção 1.4: Campos de Governança (isActive, isEditable, visibility, auditMetadata)
- [ ] 3.6 Implementar Seção 1.5: Campos de Ciclo de Vida (originType, cloneOfAgentId, isDeleted, deletedAt, activatedAt, deactivatedAt, createdAt, updatedAt)

## 4. Tabs Principais - History

- [ ] 4.1 Criar `frontend/src/components/agents/tabs/HistoryTab.tsx`
- [ ] 4.2 Implementar Seção 2.1: Timeline de Eventos (eventos básicos de ciclo de vida)
- [ ] 4.3 Implementar Seção 2.2: Informações de Versão (version, configSnapshotVersion)

## 5. Tabs Principais - Performance (Stub)

- [ ] 5.1 Criar `frontend/src/components/agents/tabs/PerformanceTab.tsx`
- [ ] 5.2 Implementar estrutura UI para métricas (placeholders para dados futuros)
- [ ] 5.3 Implementar estrutura para histórico de execuções

## 6. Tabs Principais - Suggestions (Stub)

- [ ] 6.1 Criar `frontend/src/components/agents/tabs/SuggestionsTab.tsx`
- [ ] 6.2 Implementar estrutura UI para sugestões de playbook
- [ ] 6.3 Implementar estrutura para recomendações

## 7. Tabs Principais - Behavior

- [ ] 7.1 Criar `frontend/src/components/agents/tabs/BehaviorTab.tsx`
- [ ] 7.2 Implementar Seção 5.1: Personalidade (persona, tone, style, behaviorProfile, interactionMode, defaultLanguage, tags, categories)
- [ ] 7.3 Implementar Seção 5.2: Instruções (systemPrompt, operatingInstructions)

## 8. Tabs Principais - Safeguards

- [ ] 8.1 Criar `frontend/src/components/agents/tabs/SafeguardsTab.tsx`
- [ ] 8.2 Implementar regras positivas (doRules) com ChipInput
- [ ] 8.3 Implementar regras negativas (dontRules) com ChipInput
- [ ] 8.4 Implementar guardrails com ChipInput
- [ ] 8.5 Implementar regras de escalação (escalationRules) com ChipInput

## 9. Tabs Principais - Sandbox (Stub)

- [ ] 9.1 Criar `frontend/src/components/agents/tabs/SandboxTab.tsx`
- [ ] 9.2 Implementar estrutura UI básica para configuração de sandbox

## 10. Tabs Principais - Chat (Stub)

- [ ] 10.1 Criar `frontend/src/components/agents/tabs/ChatTab.tsx`
- [ ] 10.2 Implementar estrutura UI para interface de chat de teste

## 11. Tabs Novas - Capabilities

- [ ] 11.1 Criar `frontend/src/components/agents/tabs/CapabilitiesTab.tsx`
- [ ] 11.2 Implementar Seção 9.1: Toggles de Capacidades (toolsEnabled, knowledgeEnabled, memoryEnabled, routingEnabled, handoffEnabled, humanEscalationEnabled)
- [ ] 11.3 Implementar Seção 9.2: Capacidades Adicionais (capabilities array)

## 12. Tabs Novas - Channels

- [ ] 12.1 Criar `frontend/src/components/agents/tabs/ChannelsTab.tsx`
- [ ] 12.2 Implementar Seção 10.1: Restrições de Canal (allowedChannels, channelConstraints)
- [ ] 12.3 Implementar Seção 10.2: Configuração por Canal (defaultChannelBehavior, channelOverrides) com JSONEditor

## 13. Seção Modelo e Execução

- [ ] 13.1 Criar `frontend/src/components/agents/ModelExecutionSection.tsx`
- [ ] 13.2 Implementar campos de seleção de modelo (preferredModel, allowedModels, providerConstraints)
- [ ] 13.3 Implementar parâmetros de execução (temperature, topP, maxTokens, responseFormat, reasoningMode, timeoutMs)
- [ ] 13.4 Implementar formulário de retryPolicy (maxRetries, backoffMs, strategy)
- [ ] 13.5 Integrar seção na Identity Tab ou criar tab dedicada

## 14. Seção Configuração Resolvida

- [ ] 14.1 Criar `frontend/src/components/agents/ResolvedConfigPanel.tsx`
- [ ] 14.2 Implementar visualização read-only de overrides
- [ ] 14.3 Implementar visualização read-only de explicitParameters
- [ ] 14.4 Implementar visualização formatada de resolvedConfig
- [ ] 14.5 Implementar visualização de resolutionTrace
- [ ] 14.6 Implementar display de effectiveSystemPrompt, effectiveBehaviorProfile, effectiveExecutionPolicy, effectiveChannelPolicy, effectiveModelPolicy
- [ ] 14.7 Implementar display de metadados de resolução (configSnapshotVersion, lastResolvedAt, lastValidatedAt)

## 15. Refatoração da Página Principal

- [ ] 15.1 Refatorar `frontend/src/pages/Agents.tsx` para estrutura de container
- [ ] 15.2 Implementar AgentListPanel (coluna esquerda - extraído do código atual)
- [ ] 15.3 Implementar AgentDetailPanel (coluna direita) com navegação de 10 tabs
- [ ] 15.4 Implementar lazy loading de conteúdo de tabs (React.lazy + Suspense)
- [ ] 15.5 Implementar estado global do formulário para persistência entre tabs

## 16. Integração e State Management

- [ ] 16.1 Criar custom hook `useAgentForm` para gerenciar estado do formulário multi-tab
- [ ] 16.2 Implementar função de validação de campos obrigatórios
- [ ] 16.3 Integrar com hooks useUpdateAgent para persistência
- [ ] 16.4 Implementar dirty state tracking para detectar mudanças
- [ ] 16.5 Implementar confirmação de navegação com mudanças não salvas

## 17. Estilização e UX

- [ ] 17.1 Aplicar estilos Tailwind consistentes com tema neon matrix
- [ ] 17.2 Implementar ícones Lucide para todas as tabs
- [ ] 17.3 Adicionar tooltips explicativos para campos complexos
- [ ] 17.4 Implementar indicadores visuais para campos obrigatórios
- [ ] 17.5 Implementar loading states e skeletons
- [ ] 17.6 Adicionar feedback visual de salvamento (toast notifications)

## 18. Verificação e Testes

- [ ] 18.1 Verificar compilação TypeScript: `cd frontend && npx tsc --noEmit`
- [ ] 18.2 Verificar lint: `cd frontend && npm run lint`
- [ ] 18.3 Testar criação de agente com todos os campos preenchidos
- [ ] 18.4 Testar edição de agente em cada tab individualmente
- [ ] 18.5 Testar persistência de dados entre navegação de tabs
- [ ] 18.6 Verificar que todos os ~170 campos são exibidos e editáveis (checklist)
- [ ] 18.7 Testar visualização de Configuração Resolvida

## 19. Documentação

- [ ] 19.1 Atualizar comentários inline em componentes complexos
- [ ] 19.2 Criar documentação de mapeamento de campos (opcional - se necessário)

## Checklist Final dos ~170 Campos Canônicos

Campos a verificar em cada seção:

**Identidade (9 campos)**: id, name, slug, shortDescription, longDescription, owner, source, version, status

**Origem e Template (8 campos)**: templateId, isTemplateDerived, templateSource, templateVariant, templateManifestRef, originTemplateVersion, templateDefaultsSnapshot, templateInheritanceMode, templateLockPolicy

**Papel e Objetivo (5 campos)**: role, mission, domain, objective, successCriteria

**Personalidade e Interação (8 campos)**: persona, tone, style, behaviorProfile, interactionMode, defaultLanguage, tags, categories

**Instruções e Políticas (5 campos)**: systemPrompt, operatingInstructions, doRules, dontRules, guardrails, escalationRules

**Modelo e Execução (9 campos)**: preferredModel, allowedModels, providerConstraints, channelConstraints, temperature, topP, maxTokens, responseFormat, reasoningMode, timeoutMs, retryPolicy

**Capacidades (7 campos)**: toolsEnabled, knowledgeEnabled, memoryEnabled, routingEnabled, handoffEnabled, humanEscalationEnabled, capabilities

**Canais (3 campos)**: allowedChannels, defaultChannelBehavior, channelOverrides

**Governança (3 campos)**: isActive, isEditable, visibility, auditMetadata

**Ciclo de Vida (7 campos)**: originType, cloneOfAgentId, isDeleted, deletedAt, activatedAt, deactivatedAt, createdAt, updatedAt

**Resolução de Configuração (11 campos)**: overrides, explicitParameters, resolvedConfig, resolutionTrace, effectiveSystemPrompt, effectiveBehaviorProfile, effectiveExecutionPolicy, effectiveChannelPolicy, effectiveModelPolicy, configSnapshotVersion, lastResolvedAt, lastValidatedAt

Total: ~170 campos
