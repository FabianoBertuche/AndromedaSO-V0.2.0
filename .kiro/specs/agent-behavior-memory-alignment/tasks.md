---
name: agent-behavior-memory-alignment
description: Tasks executáveis em ordem estrita para os 8 problemas-alvo solicitados
---

# Tasks — Agent Behavior Memory Alignment

## Instrução obrigatória de tracking

- Ao iniciar uma task: `- [ ] -> - [-]`
- Ao concluir uma task: `- [-] -> - [x]`
- Não avançar para a próxima task sem passar no checkpoint de compilação da task atual.

---

## Ordem de execução (estrita)

- [x] 1. Ajustar layout full-width em `frontend/src/App.tsx` (classes exatas de largura/padding/grid)
- [x] 2. Expandir `AgentInstance`, `AgentOverrides` e tipos `Effective*` em `frontend/src/types/kernel.ts`
- [x] 3. Atualizar `frontend/src/lib/agentMapper.ts` com os novos campos e defaults exatos de memória
- [x] 4. Refatorar `frontend/src/components/agents/tabs/BehaviorTab.tsx` para 6 sub-abas exatas: Soul, Voice, Rules, Playbook, Context, Response Style
- [x] 5. Criar `frontend/src/components/agents/tabs/MemoryTab.tsx` com toggles/select/input e glossário colapsável
- [x] 6. Integrar tab `memory` com ícone `BrainCircuit` em `frontend/src/pages/Agents.tsx`
- [x] 7. Expandir `core/kernel/src/modules/agents/domain/services/resolution/resolveSystemPrompt.ts` para 15 seções, separador `\n\n---\n\n` e log pino
- [x] 8. Atualizar `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts` para extração segura de overrides e encaminhamento ao resolvedor
- [x] 8.1. Subtarefa de compatibilidade técnica: ajustar `core/kernel/src/contracts/agentModule.schema.ts` para aceitar os novos campos de overrides (dependência para não perder dados em PUT/POST)

---

## Detalhamento por task

### Task 1 — App.tsx full-width

**Arquivo-alvo:** `frontend/src/App.tsx`

**Objetivo:**

- Aplicar `w-full` na área de agentes.
- Aplicar `px-4 sm:px-6 lg:px-8` no container horizontal.
- Garantir header/tabs com `w-full`.
- Garantir grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 2 — Tipos canônicos e Effective*

**Arquivo-alvo:** `frontend/src/types/kernel.ts`

**Objetivo:**

- Expandir `AgentInstance` com soul/voice/rules/playbook/context/memory.
- Expandir `AgentOverrides` com os mesmos campos novos.
- Adicionar tipos `EffectiveBehaviorProfile`, `EffectiveExecutionPolicy`, `EffectiveChannelPolicy`, `EffectiveModelPolicy`.

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 3 — Mapper com defaults exatos de memória

**Arquivo-alvo:** `frontend/src/lib/agentMapper.ts`

**Objetivo:**

- Mapear os novos blocos de behavior/memory em ambos os sentidos.
- Aplicar defaults exatos quando ausentes:
  - `memorySessionEnabled=true`
  - `memoryScopeType='session'`
  - `memoryMaxEntries=50`
  - `memoryShared=false`
  - `memoryRetentionPeriod='session'`

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 4 — BehaviorTab com 6 sub-abas exatas

**Arquivo-alvo:** `frontend/src/components/agents/tabs/BehaviorTab.tsx`

**Objetivo:**

- Implementar as sub-abas exatas: Soul, Voice, Rules, Playbook, Context, Response Style.
- Não criar sub-aba Identity dentro da BehaviorTab.
- Implementar componentes internos `ChipList` e `Card`.

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 5 — Criar MemoryTab

**Arquivo-alvo:** `frontend/src/components/agents/tabs/MemoryTab.tsx`

**Objetivo:**

- Criar tab com toggles/select/input numérico para memória.
- Incluir glossário colapsável.
- Integrar com `onChange` padrão das tabs.

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 6 — Integrar tab memory em Agents.tsx

**Arquivo-alvo:** `frontend/src/pages/Agents.tsx`

**Objetivo:**

- Adicionar `memory` ao tipo de tabs.
- Adicionar tab visual com ícone `BrainCircuit`.
- Renderizar `MemoryTab` no switch da página.

**Checkpoint obrigatório:**

`cd frontend && npx tsc --noEmit`

---

### Task 7 — Expandir resolveSystemPrompt

**Arquivo-alvo:** `core/kernel/src/modules/agents/domain/services/resolution/resolveSystemPrompt.ts`

**Objetivo:**

- Compor 15 seções.
- Usar separador exato `\n\n---\n\n`.
- Registrar log pino com total de seções e tamanho final do prompt.

**Checkpoint obrigatório:**

`cd core/kernel && npx tsc --noEmit`

---

### Task 8 — Atualizar agentConfigResolver

**Arquivo-alvo:** `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`

**Objetivo:**

- Fazer extração segura dos novos overrides.
- Encaminhar os novos campos para `resolveSystemPrompt`.
- Manter fallback para agentes legados.

**Checkpoint obrigatório:**

`cd core/kernel && npx tsc --noEmit`

---

### Task 8.1 — Subtarefa de compatibilidade técnica (dependência)

**Arquivo-alvo:** `core/kernel/src/contracts/agentModule.schema.ts`

**Objetivo:**

- Permitir os novos campos de overrides na validação Zod das rotas de agents.
- Evitar perda silenciosa de campos no PUT/POST.

**Checkpoint obrigatório:**

`cd core/kernel && npx tsc --noEmit`
