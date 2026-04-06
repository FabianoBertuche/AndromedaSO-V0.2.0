---
name: agent-behavior-memory-alignment
description: Requisitos formais para alinhar comportamento e memória de agentes conforme referência oficial da interface
---

# Documento de Requisitos — Agent Behavior Memory Alignment

## Contexto e referência obrigatória

- Referência principal: `docs/specs/andromeda-interface-parameters-report.md`
- Fluxo exigido para execução desta spec: `speckit.specify -> speckit.clarify -> speckit.plan -> speckit.tasks -> speckit.implement`
- Escopo fechado em 8 problemas-alvo solicitados pelo usuário. Não ampliar escopo sem justificativa técnica explícita.

---

## Problemas-alvo (escopo imutável)

1. Layout full-width em `frontend/src/App.tsx`.
2. Expansão de tipos em `frontend/src/types/kernel.ts` (`AgentInstance`, `AgentOverrides`, tipos `Effective*`).
3. Atualização de mapper em `frontend/src/lib/agentMapper.ts`.
4. `BehaviorTab` completa com 6 sub-abas e componentes internos `ChipList`/`Card`.
5. Criação de `MemoryTab`.
6. Inclusão da tab `memory` em `frontend/src/pages/Agents.tsx`.
7. Expansão de `resolveSystemPrompt` (novos blocos, ordem, separador, log).
8. Atualização de `agentConfigResolver` no caminho real `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`.

---

## Requisitos Funcionais

### REQ-01 — App.tsx full-width com classes exatas

**User story:** Como operador, quero editar agentes em área ampla, com layout previsível e sem compressão horizontal.

**Critérios de aceitação:**

1. A área principal da tela de agentes deve usar `w-full`.
2. O container horizontal deve usar `px-4 sm:px-6 lg:px-8`.
3. Header e barra de tabs devem usar `w-full`.
4. O grid principal da tela deve usar `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
5. A mudança não deve alterar semântica de navegação existente.

---

### REQ-02 — Expansão de AgentInstance, AgentOverrides e tipos Effective*

**User story:** Como desenvolvedor, quero contratos explícitos para representar todos os blocos de comportamento e memória exigidos pela referência.

**Critérios de aceitação:**

1. `AgentInstance` deve incluir campos para:
   - soul
   - voice
   - rules
   - playbook
   - context
   - memory
2. `AgentOverrides` deve aceitar os mesmos grupos novos de comportamento e memória adicionados em `AgentInstance`.
3. Devem existir os tipos explícitos:
   - `EffectiveBehaviorProfile`
   - `EffectiveExecutionPolicy`
   - `EffectiveChannelPolicy`
   - `EffectiveModelPolicy`
4. Campos `effective*` em `AgentInstance` devem usar esses tipos explícitos.
5. A tipagem deve manter compatibilidade com agentes legados sem quebrar compilação.

---

### REQ-03 — Atualização de mapper com defaults de memória exatos

**User story:** Como sistema, quero normalizar os novos campos com defaults estáveis para evitar estados indefinidos.

**Critérios de aceitação:**

1. O mapper deve mapear os novos blocos de comportamento e memória no fluxo backend -> frontend e frontend -> backend.
2. Quando memória não vier do backend, aplicar defaults exatos:
   - `memorySessionEnabled=true`
   - `memoryScopeType='session'`
   - `memoryMaxEntries=50`
   - `memoryShared=false`
   - `memoryRetentionPeriod='session'`
3. O mapper deve preservar compatibilidade com payload legado.

---

### REQ-04 — BehaviorTab com 6 sub-abas exatas

**User story:** Como operador, quero configurar comportamento por blocos funcionais específicos.

**Critérios de aceitação:**

1. A `BehaviorTab` deve conter exatamente as sub-abas:
   - Soul
   - Voice
   - Rules
   - Playbook
   - Context
   - Response Style
2. Não deve existir sub-aba separada de Identity dentro da `BehaviorTab`.
3. A `BehaviorTab` deve conter componentes internos `ChipList` e `Card`.
4. Sub-abas devem respeitar estados `readOnly` e `disabled`.

---

### REQ-05 — MemoryTab com controles e glossário colapsável

**User story:** Como operador, quero uma aba dedicada para memória com controles claros e ajuda contextual.

**Critérios de aceitação:**

1. Criar `MemoryTab` dedicada no diretório de tabs de agentes.
2. A tab deve conter:
   - toggles
   - select
   - input numérico
3. Deve existir glossário colapsável na própria aba.
4. A edição deve integrar com o mesmo fluxo de `onChange` já usado em outras tabs.

---

### REQ-06 — Inclusão da tab memory em Agents.tsx com ícone exato

**User story:** Como operador, quero acessar Memory no mesmo conjunto de tabs da página de agentes.

**Critérios de aceitação:**

1. `Agents.tsx` deve incluir a tab `memory` no tipo de tabs e na configuração visual.
2. O ícone da tab `memory` deve ser `BrainCircuit`.
3. O switch/renderização da página deve carregar `MemoryTab` quando `memory` estiver ativa.

---

### REQ-07 — resolveSystemPrompt com 15 seções, separador exato e log pino

**User story:** Como backend, quero composição determinística do prompt para rastreabilidade e previsibilidade.

**Critérios de aceitação:**

1. `resolveSystemPrompt` deve compor o prompt em 15 seções fixas.
2. O separador entre seções deve ser exatamente `\n\n---\n\n`.
3. O logger `pino` deve registrar no mínimo:
   - total de seções emitidas
   - tamanho final do prompt
4. Campos vazios devem ser omitidos sem quebrar a ordem lógica da composição.

---

### REQ-08 — agentConfigResolver com extração segura e encaminhamento

**User story:** Como backend, quero extrair com segurança os novos campos de overrides e encaminhá-los ao resolvedor de prompt sem perda.

**Critérios de aceitação:**

1. O arquivo-alvo é exatamente `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`.
2. O resolver deve fazer extração segura dos novos campos de overrides.
3. O resolver deve encaminhar os campos novos para `resolveSystemPrompt` no contrato esperado.
4. Agentes legados sem esses campos devem continuar funcionando.

---

## Requisitos Não Funcionais

1. Português técnico claro e consistente.
2. Compatibilidade retroativa para dados legados.
3. Sem mudança de semântica pública da API além do necessário para transportar os novos campos.
