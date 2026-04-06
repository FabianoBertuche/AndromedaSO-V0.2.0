# PRD — MVP10: Agent Evolution & Versioning + Budget Control

**Status:** 🔄 Em implementação
**Iniciado:** 23/03/2026
**Pré-requisito:** MVP09 ✅ (Auth, Multi-tenancy, DLQ, Rate Limiting, Health)

---

## Objetivo

Tornar agentes entidades que evoluem com o tempo de forma rastreável, introduzir controle real de custos por agente e criar o primeiro canal de feedback humano que alimenta o sistema de forma contínua.

---

## Blocos de Implementação

### Bloco A — Versionamento de AgentProfile

**Objetivo:** Cada mudança significativa em um agente gera um snapshot versionado, permitindo comparação, auditoria e rollback.

**Entidades novas:**
```typescript
AgentVersion {
  id: string
  agentId: string
  version: number          // auto-incremento por agente
  snapshot: Json           // AgentProfile completo serializado
  changesSummary: string   // "Alterado: soul.md, conformanceMin"
  createdBy: string        // userId
  createdAt: DateTime
}
```

**Comportamento:**
- Toda edição no AgentProfile → snapshot automático antes de salvar
- API `GET /v1/agents/:id/versions` → lista de versões com diff resumido
- API `POST /v1/agents/:id/versions/:v/restore` → rollback para versão anterior
- UI: aba "History" no Agent Console com timeline de versões e botão Restore

---

### Bloco B — Histórico de Desempenho

**Objetivo:** Registrar métricas operacionais reais por agente ao longo do tempo.

**Entidade nova:**
```typescript
AgentPerformanceRecord {
  id: string
  agentId: string
  period: string           // "2026-03-23"
  tasksTotal: number
  tasksSucceeded: number
  tasksFailed: number
  avgConformanceScore: Float
  avgLatencyMs: Float
  totalTokensUsed: number
  totalCostUsd: Float
  createdAt: DateTime
}
```

**Geração:** job diário (BullMQ) consolida tasks do dia por agente → persiste registro.

---

### Bloco C — Reputação por Domínio/Capability

**Objetivo:** Score calculado por capability (`coding`, `audit`, `research`...) baseado em histórico real de tasks + feedback.

**Campo novo em Agent:**
```typescript
reputationScores: Json   // { "coding": 0.92, "audit": 0.87, ... }
reputationUpdatedAt: DateTime
```

**Cálculo:** `(taxa_sucesso × 0.5) + (conformance_avg × 0.3) + (feedback_score × 0.2)`

---

### Bloco D — Budget Control

**Objetivo:** Teto de gasto configurável por agente com alertas e bloqueio automático.

**Entidade nova:**
```typescript
AgentBudgetPolicy {
  id: string
  agentId: string
  tenantId: string
  dailyLimitUsd: Float?
  monthlyLimitUsd: Float?
  sessionLimitUsd: Float?
  warningThresholdPct: Float   // default 0.8 (80%)
  hardStop: Boolean            // bloqueia ao atingir limite
  currentDailySpend: Float
  currentMonthlySpend: Float
  resetAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Comportamento:**
- Antes de cada chamada LLM → verifica orçamento do agente
- >= warningThreshold → emite evento `budget.warning`
- >= limite + hardStop=true → rejeita execução com erro `BUDGET_EXCEEDED` (HTTP 402)
- Job diário (BullMQ) → reseta `currentDailySpend`
- Job mensal → reseta `currentMonthlySpend`

**APIs:**
- `GET /v1/agents/:id/budget`
- `PUT /v1/agents/:id/budget`
- `GET /v1/budget/report?period=month&agentId=`
- `POST /v1/budget/report/export`

---

### Bloco E — Dashboard de Custos

**UI — Nova aba "Costs" no painel:**
- Gráfico: gasto diário/semanal/mensal por agente
- Tabela: ranking de agentes por custo
- Filtros: período, agente, capability
- Export: CSV/JSON

---

### Bloco F — Feedback do Usuário

**Objetivo:** Thumbs up/down + nota opcional por resultado de task.

**Entidade nova:**
```typescript
TaskFeedback {
  id: string
  taskId: string
  agentId: string
  userId: string
  tenantId: string
  rating: Int              // 1 (👎) ou 5 (👍)
  note: string?
  dimension: string?       // "accuracy" | "tone" | "completeness"
  createdAt: DateTime
}
```

**Efeitos downstream:**
- LLM Router: feedback negativo reduz score do modelo usado
- Agent Evolution: feedback alimenta `reputationScores`
- Evals (MVP14): feedback real como sinal de qualidade golden

---

### Bloco G — Lições Aprendidas

**Entidade nova:**
```typescript
PlaybookSuggestion {
  id: string
  agentId: string
  suggestion: string
  sourceEpisodes: string[]
  status: "pending" | "approved" | "rejected"
  createdAt: DateTime
  reviewedAt: DateTime?
  reviewedBy: string?
}
```

**Comportamento:** Job semanal (BullMQ) → analisa episódios → chama cognitive-python → gera sugestões → humano aprova → append no playbook.md

---

## Ordem de Implementação

1. Migrations (todas as entidades novas)
2. Bloco D — Budget Control
3. Bloco F — Feedback do usuário
4. Bloco A — Versionamento de AgentProfile
5. Bloco B — Histórico de desempenho
6. Bloco C — Reputação por capability
7. Bloco E — Dashboard de custos
8. Bloco G — Lições aprendidas
9. Testes + regressão

---

## Critérios de Pronto

- [ ] AgentProfile versionado automaticamente a cada edição
- [ ] Rollback de versão funcionando via API e UI
- [ ] Budget policy configurável por agente
- [ ] Execução bloqueada quando orçamento esgotado (hardStop=true)
- [ ] Alertas de custo disparados no threshold configurado
- [ ] Dashboard de custos com gráfico e export CSV
- [ ] Botões 👍👎 visíveis após conclusão de task
- [ ] Feedback persistido e influenciando Router scores
- [ ] Histórico de desempenho consolidado diariamente por BullMQ
- [ ] Reputação por capability calculada e exibida
- [ ] Sugestões de playbook geradas e aprovadas via UI
- [ ] npm test 100% passando

---

## Fora do Escopo do MVP10

- OAuth/SSO para login (MVP09 scope)
- Planner multi-etapas → **MVP11**
- Export/Import de agentes → MVP12
- Eval Engine formal → MVP14
- Billing multi-tenant completo
