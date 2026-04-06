---
name: agent-behavior-memory-alignment
description: Design técnico fechado nos 8 problemas solicitados, com decisões concretas por arquivo
---

# Design — Agent Behavior Memory Alignment

## Contexto obrigatório

- Referência principal: `docs/specs/andromeda-interface-parameters-report.md`
- Fluxo de entrega: `speckit.specify -> speckit.clarify -> speckit.plan -> speckit.tasks -> speckit.implement`
- Escopo: estritamente os 8 itens solicitados.

---

## Clarificações resolvidas

1. **Caminho real do resolver:** `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`.
2. **Compatibilidade de validação:** a validação Zod de `overrides` nas rotas de agents é estrita; para não perder campos novos em PUT/POST, o design inclui ajuste de compatibilidade no schema de overrides, sem mudar semântica da API.

---

## Decisões técnicas por arquivo

### 1) `frontend/src/App.tsx` (Problema 1)

**Decisão:** aplicar layout full-width na área de agentes com as classes exatas pedidas.

**Detalhes de design:**

- Container principal de agentes com `w-full`.
- Padding horizontal com `px-4 sm:px-6 lg:px-8`.
- Header e tabs com `w-full`.
- Grid principal com `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.

**Fora de escopo:** alteração de comportamento de rotas não relacionadas a agentes.

---

### 2) `frontend/src/types/kernel.ts` (Problemas 2 e 3)

**Decisão:** expandir tipagem canônica sem remover contratos legados ainda usados.

**Detalhes de design:**

- `AgentInstance` passa a incluir blocos novos de:
  - soul
  - voice
  - rules
  - playbook
  - context
  - memory
- `AgentOverrides` recebe os mesmos grupos novos.
- Criar tipos explícitos:
  - `EffectiveBehaviorProfile`
  - `EffectiveExecutionPolicy`
  - `EffectiveChannelPolicy`
  - `EffectiveModelPolicy`
- Campos `effective*` existentes devem referenciar esses tipos.

**Fora de escopo:** redesign completo do contrato de API pública.

---

### 3) `frontend/src/lib/agentMapper.ts` (Problema 3)

**Decisão:** normalizar mapeamento com defaults de memória exatos, mantendo compatibilidade legada.

**Detalhes de design:**

- Mapear blocos novos em ambos os sentidos (backend -> frontend e frontend -> backend).
- Aplicar defaults quando ausentes:
  - `memorySessionEnabled=true`
  - `memoryScopeType='session'`
  - `memoryMaxEntries=50`
  - `memoryShared=false`
  - `memoryRetentionPeriod='session'`
- Preservar campos já existentes e evitar regressão de agentes antigos.

**Fora de escopo:** migração de dados persistidos.

---

### 4) `frontend/src/components/agents/tabs/BehaviorTab.tsx` (Problema 4)

**Decisão:** substituir estrutura atual por 6 sub-abas exatas, sem sub-aba Identity.

**Sub-abas obrigatórias (ordem):**

1. Soul
2. Voice
3. Rules
4. Playbook
5. Context
6. Response Style

**Detalhes de design:**

- Componentes internos obrigatórios no arquivo: `ChipList` e `Card`.
- `ChipList` para listas editáveis (Rules, Playbook, Context).
- `Card` para agrupamento visual de cada bloco.
- Respeitar `readOnly` e `disabled` em todos os controles.

**Fora de escopo:** criar biblioteca compartilhada nova de componentes.

---

### 5) `frontend/src/components/agents/tabs/MemoryTab.tsx` (Problema 5)

**Decisão:** criar aba dedicada para memória, com controles formais e ajuda contextual.

**Detalhes de design:**

- Controles mínimos:
  - toggles
  - select
  - input numérico
- Incluir glossário colapsável (expandir/retrair) para termos de memória.
- Integrar ao padrão de props das tabs existentes (`agent`, `onChange`, `readOnly`, `disabled`).

**Fora de escopo:** persistência independente fora do fluxo padrão de save da página.

---

### 6) `frontend/src/pages/Agents.tsx` (Problema 6)

**Decisão:** integrar `memory` ao sistema de tabs sem alterar fluxo principal de edição.

**Detalhes de design:**

- Adicionar `memory` ao tipo `AgentTab`.
- Adicionar item visual da tab com ícone `BrainCircuit`.
- Renderizar `MemoryTab` no switch de conteúdo ativo.

**Fora de escopo:** reordenação ampla de tabs não pedida.

---

### 7) `core/kernel/src/modules/agents/domain/services/resolution/resolveSystemPrompt.ts` (Problema 7)

**Decisão:** evoluir composição para 15 seções com separador único e telemetria de composição.

**Formato obrigatório:**

- Separador entre seções: `\n\n---\n\n`.
- Quantidade alvo: 15 seções lógicas.

**Ordem de seções (15):**

1. Base Instructions
2. Agent Identity
3. Mission
4. Scope
5. Soul
6. Voice
7. Response Style
8. Rules Must
9. Rules Must Not
10. Rules Delegate When
11. Rules Review When
12. Rules Feedback When
13. Rules Interrupt When
14. Rules Evidence When
15. Playbook e Contexto Operacional

**Logging obrigatório (pino):**

- total de seções emitidas
- tamanho final do prompt

**Fora de escopo:** alterar política de execução/modelo fora da composição textual.

---

### 8) `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts` (Problema 8)

**Decisão:** extrair com segurança novos campos de overrides e encaminhar ao `resolveSystemPrompt`.

**Detalhes de design:**

- Extração defensiva dos blocos novos.
- Encaminhamento explícito para o contrato atualizado de `resolveSystemPrompt`.
- Fallback para agentes legados sem novos campos.

**Fora de escopo:** reescrever pipeline completo de resolução.

---

### Compatibilidade técnica necessária (dependência)

**Arquivo:** `core/kernel/src/contracts/agentModule.schema.ts`

Para viabilizar os 8 problemas sem perda de dados, o schema de `overrides` deve aceitar os novos campos de Behavior/Memory. Isso é ajuste de compatibilidade de validação, não expansão funcional de escopo.

---

## Critérios de coerência do design

1. Não introduzir feature não solicitada.
2. Manter alinhamento direto com os 8 problemas-alvo.
3. Preservar compatibilidade com agentes legados.
