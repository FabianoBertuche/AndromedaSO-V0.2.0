## Context

O Andromeda SO possui um documento canônico (`docs/suporte/andromeda-agents-canonical-fields.md`) que define aproximadamente ~170 campos para configuração de agentes. A UI atual (`frontend/src/pages/Agents.tsx`) implementa apenas um subconjunto desses campos, focando principalmente em Identity (informações básicas) e parte da configuração via sub-tabs inline.

O sistema legado (`docs/legacy-analysis/Andromeda-SO-main`) possuía uma estrutura de UI com 8 tabs principais para gestão de agentes. A nova implementação deve replicar essa estrutura enquanto adiciona capacidades modernas.

## Goals / Non-Goals

**Goals:**
- Implementar UI completa com TODOS os ~170 campos canônicos expostos e funcionais
- Seguir estrutura de 8 tabs do legado: Identity, History, Performance, Suggestions, Behavior, Safeguards, Sandbox, Chat
- Adicionar 2 novas tabs: Capabilities e Channels
- Incluir seção Configuração Resolvida (read-only) com todos os campos efetivos
- Manter compatibilidade com React 18 + TanStack Query + TailwindCSS
- Garantir que o agente receba todos os parâmetros e possa agir/pensar de acordo com eles

**Non-Goals:**
- Alterar contratos de API do backend (reutilizar endpoints existentes)
- Implementar funcionalidades de Performance e Suggestions (apenas estrutura UI)
- Criar chat funcional (apenas estrutura UI)
- Modificar regras de negócio do kernel

## Decisions

1. **Organização em 10 tabs principais**
   Rationale: As 8 tabs do legado mais 2 novas (Capabilities, Channels) fornecem organização lógica. A seção Configuração Resolvida será um painel lateral ou tab adicional.
   Alternativas consideradas: formulário monolítico (rejeitado por complexidade), accordion (rejeitado por perder contexto visual)

2. **Mapeamento completo dos ~170 campos**
   Rationale: Todos os campos definidos no documento canônico DEVEM estar presentes na UI, mesmo que em seções avançadas.
   Alternativas consideradas: mostrar apenas campos comuns (rejeitado - viola requisito absoluto)

3. **Lazy loading de conteúdo de tabs**
   Rationale: ~170 campos podem impactar performance inicial. Tabs não ativas são montadas sob demanda.
   Alternativas consideradas: render all at once (rejeitado por performance), virtualização complexa (rejeitado por over-engineering)

4. **Sub-divisão interna em seções por categoria**
   Rationale: Dentro de cada tab, campos são agrupados logicamente (ex: Identity contém Identidade, Origem/Template, Papel e Objetivo, Governança)
   Alternativas consideradas: lista linear (rejeitado por dificuldade de navegação)

5. **Configuração Resolvida como painel read-only**
   Rationale: Permite visualizar configuração efetiva após merge de templates, overrides e defaults, sem permitir edição direta.
   Alternativas consideradas: edição inline (rejeitado - viola conceito de "resolvida")

## Field Mapping by Tab

### Tab 1: Identity
**Seção 1.1 - Identidade**
- `id` (read-only, hidden ou display)
- `name` (text, required)
- `slug` (text, auto-generated from name)
- `shortDescription` (text, textarea)
- `longDescription` (text, textarea)
- `owner` (text)
- `source` (select: manual, template, import)
- `version` (text, default "1.0.0")
- `status` (select: draft, active, inactive, archived, deleted)

**Seção 1.2 - Origem e Template**
- `templateId` (text, read-only se derived)
- `isTemplateDerived` (checkbox)
- `templateSource` (text)
- `templateVariant` (text)
- `templateManifestRef` (text)
- `originTemplateVersion` (text)
- `templateDefaultsSnapshot` (json display)
- `templateInheritanceMode` (select: copy-on-create, linked-metadata)
- `templateLockPolicy` (select: none, future, strict)

**Seção 1.3 - Papel e Objetivo**
- `role` (text, required)
- `mission` (text, textarea)
- `domain` (text, default "general")
- `objective` (text, required)
- `successCriteria` (array of strings)

**Seção 1.4 - Governança e Edição**
- `isActive` (checkbox)
- `isEditable` (checkbox)
- `visibility` (select: private, internal, public)
- `auditMetadata.createdBy` (text, read-only)
- `auditMetadata.updatedBy` (text, read-only)
- `auditMetadata.reason` (text)

**Seção 1.5 - Ciclo de Vida**
- `originType` (select: manual, template, import, clone)
- `cloneOfAgentId` (text, read-only)
- `isDeleted` (checkbox)
- `deletedAt` (datetime, read-only)
- `activatedAt` (datetime, read-only)
- `deactivatedAt` (datetime, read-only)
- `createdAt` (datetime, read-only)
- `updatedAt` (datetime, read-only)

### Tab 2: History
**Seção 2.1 - Timeline de Eventos**
- `createdAt` (display)
- `updatedAt` (display)
- `activatedAt` (display)
- `deactivatedAt` (display)
- `deletedAt` (display)
- Lista de eventos (placeholder para futura implementação)

**Seção 2.2 - Versões**
- `version` (display)
- `configSnapshotVersion` (display)
- Histórico de versões (placeholder)

### Tab 3: Performance (Stub - estrutura apenas)
**Seção 3.1 - Métricas**
- Placeholder para success rate
- Placeholder para conformance
- Placeholder para latência média
- Placeholder para throughput

**Seção 3.2 - Histórico de Execuções**
- Lista placeholder

### Tab 4: Suggestions (Stub - estrutura apenas)
**Seção 4.1 - Sugestões de Playbook**
- Lista placeholder
- Botão "Aplicar sugestão"

**Seção 4.2 - Recomendações**
- Área placeholder para recomendações automáticas

### Tab 5: Behavior
**Seção 5.1 - Personalidade e Interação**
- `persona` (textarea, required)
- `tone` (select: neutro, tecnico, cordial, formal, direto, amigavel)
- `style` (select: claro-e-objetivo, detalhado, resumido, narrativo, tecnico)
- `behaviorProfile` (text)
- `interactionMode` (select: reactive, proactive, guided, strict)
- `defaultLanguage` (text, default "pt-BR")
- `tags` (array of strings, chip input)
- `categories` (array of strings, chip input)

**Seção 5.2 - Instruções**
- `systemPrompt` (textarea, required, monospace font)
- `operatingInstructions` (array of strings, list input)

### Tab 6: Safeguards
**Seção 6.1 - Regras**
- `doRules` (array of strings, list input)
- `dontRules` (array of strings, list input)
- `guardrails` (array of strings, list input)
- `escalationRules` (array of strings, list input)

### Tab 7: Sandbox
**Seção 7.1 - Configuração Sandbox**
- Placeholder para configurações de ambiente isolado
- Placeholder para variáveis de ambiente

### Tab 8: Chat (Stub - estrutura apenas)
**Seção 8.1 - Interface de Chat**
- Placeholder para interface de teste
- Placeholder para histórico de conversas de teste

### Tab 9: Capabilities (Nova)
**Seção 9.1 - Toggles de Capacidades**
- `toolsEnabled` (checkbox)
- `knowledgeEnabled` (checkbox)
- `memoryEnabled` (checkbox)
- `routingEnabled` (checkbox)
- `handoffEnabled` (checkbox)
- `humanEscalationEnabled` (checkbox)

**Seção 9.2 - Capacidades Adicionais**
- `capabilities` (array of strings, chip input)

### Tab 10: Channels (Nova)
**Seção 10.1 - Restrições de Canal**
- `allowedChannels` (array of strings, chip input)
- `channelConstraints` (array of strings, chip input)

**Seção 10.2 - Configuração por Canal**
- `defaultChannelBehavior` (JSON editor)
- `channelOverrides` (JSON editor)

### Seção: Modelo e Execução (Parte de Identity ou tab dedicada)
**Campos de Modelo**
- `preferredModel` (select from available models)
- `allowedModels` (array of strings, chip input)
- `providerConstraints` (array of strings, chip input)
- `channelConstraints` (array of strings - moved to Channels tab)

**Parâmetros de Execução**
- `temperature` (number, slider 0-2)
- `topP` (number, slider 0-1)
- `maxTokens` (number, nullable)
- `responseFormat` (select: text, markdown, json, structured)
- `reasoningMode` (select: default, light, standard, deep)
- `timeoutMs` (number)
- `retryPolicy` (object with nested fields):
  - `maxRetries` (number)
  - `backoffMs` (number)
  - `strategy` (select: none, fixed, exponential)

### Seção: Configuração Resolvida (Read-Only Panel)
**Campos de Resolução**
- `overrides` (JSON view)
- `explicitParameters` (JSON view)
- `resolvedConfig` (JSON view, formatted)
- `resolutionTrace` (JSON view)
- `effectiveSystemPrompt` (textarea, read-only)
- `effectiveBehaviorProfile` (JSON view)
- `effectiveExecutionPolicy` (JSON view)
- `effectiveChannelPolicy` (JSON view)
- `effectiveModelPolicy` (JSON view)
- `configSnapshotVersion` (display)
- `lastResolvedAt` (datetime, read-only)
- `lastValidatedAt` (datetime, read-only)

## Component Architecture

```
Agents.tsx (container principal)
├── AgentListPanel (esquerda - lista e criação)
│   ├── AgentList
│   └── CreateAgentForm
└── AgentDetailPanel (direita - tabs)
    ├── AgentHeader
    ├── TabNavigation (10 tabs)
    └── TabContent
        ├── IdentityTab
        │   ├── IdentitySection
        │   ├── TemplateSection
        │   ├── RoleSection
        │   ├── GovernanceSection
        │   └── LifecycleSection
        ├── HistoryTab
        ├── PerformanceTab (stub)
        ├── SuggestionsTab (stub)
        ├── BehaviorTab
        │   ├── PersonalitySection
        │   └── InstructionsSection
        ├── SafeguardsTab
        ├── SandboxTab (stub)
        ├── ChatTab (stub)
        ├── CapabilitiesTab
        └── ChannelsTab
```

## Field Types Mapping

| Tipo Canônico | Componente UI |
|---------------|---------------|
| `string` | TextInput |
| `string` (long) | TextArea |
| `string` (select) | SelectDropdown |
| `boolean` | Checkbox |
| `number` | NumberInput |
| `number` (range) | Slider |
| `string[]` | ChipInput (tags) |
| `object` | JSONEditor ou campo nested |
| `datetime` | DateTimeDisplay (read-only) |
| `enum` | SelectDropdown |

## Risks / Trade-offs

- [Complexidade de UI com ~170 campos] -> Mitigação: organização em tabs e seções, lazy loading
- [Performance de renderização] -> Mitigação: React.memo em componentes de campo, lazy mounting de tabs
- [Sobrecarga cognitiva do usuário] -> Mitigação: campos organizados por relevância, seções colapsáveis
- [Manutenção de mapeamento de campos] -> Mitigação: geração automática de tipos TypeScript a partir do documento canônico
- [Validação de JSON em campos complexos] -> Mitigação: syntax highlighting e validação inline

## Visual Design

- Manter tema neon matrix (verde/ciano sobre fundo escuro)
- Tabs com ícones do Lucide
- Seções com bordas sutilmente destacadas
- Campos obrigatórios marcados com indicador visual
- Campos read-only com aparência desabilitada
- Tooltips explicativos para campos complexos
