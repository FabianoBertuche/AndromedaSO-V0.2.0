# Implementation Plan — MVP10: Agent Evolution & Budget Control

**Status:** 🔄 Em implementação
**Iniciado:** 23/03/2026
**Pré-requisito:** MVP09 ✅ (Auth/IAM, tenantId, DLQ, Rate Limiting, Health)
**Referência:** `doc/active/MVP10-PRD.md`

---

## Visão Geral das Fases

| Fase | Foco | Impacto |
|------|------|---------|
| 1 | Migrations + Schema | Fundação de dados |
| 2 | Budget Control | Bloqueia execuções acima do limite |
| 3 | Feedback do usuário | UI + persistência |
| 4 | Versionamento de AgentProfile | Snapshot automático |
| 5 | Histórico de desempenho | Job BullMQ diário |
| 6 | Reputação por capability | Cálculo + campo em Agent |
| 7 | Dashboard de custos | UI Costs |
| 8 | Lições aprendidas | Job BullMQ semanal + approval |
| 9 | Testes + endurecimento | Integração, e2e, regressão |

---

## Fase 1 — Migrations & Schema Prisma

**Arquivo:** `packages/api/prisma/migrations/20260323000000_mvp10_agent_evolution/`

```prisma
model AgentVersion {
  id             String   @id @default(cuid())
  agentId        String
  tenantId       String   @default("default")
  version        Int
  snapshot       Json
  changesSummary String
  createdBy      String
  createdAt      DateTime @default(now())
  @@unique([agentId, version])
  @@map("agent_versions")
}

model AgentPerformanceRecord {
  id                  String   @id @default(cuid())
  agentId             String
  tenantId            String   @default("default")
  period              String
  tasksTotal          Int      @default(0)
  tasksSucceeded      Int      @default(0)
  tasksFailed         Int      @default(0)
  avgConformanceScore Float    @default(0)
  avgLatencyMs        Float    @default(0)
  totalTokensUsed     Int      @default(0)
  totalCostUsd        Float    @default(0)
  createdAt           DateTime @default(now())
  @@unique([agentId, period])
  @@map("agent_performance_records")
}

model AgentBudgetPolicy {
  id                   String   @id @default(cuid())
  agentId              String   @unique
  tenantId             String   @default("default")
  dailyLimitUsd        Float?
  monthlyLimitUsd      Float?
  sessionLimitUsd      Float?
  warningThresholdPct  Float    @default(0.8)
  hardStop             Boolean  @default(true)
  currentDailySpend    Float    @default(0)
  currentMonthlySpend  Float    @default(0)
  resetAt              DateTime
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  @@map("agent_budget_policies")
}

model TaskFeedback {
  id        String   @id @default(cuid())
  taskId    String
  agentId   String
  userId    String
  tenantId  String   @default("default")
  rating    Int
  note      String?
  dimension String?
  createdAt DateTime @default(now())
  @@map("task_feedbacks")
}

model PlaybookSuggestion {
  id             String    @id @default(cuid())
  agentId        String
  tenantId       String    @default("default")
  suggestion     String
  sourceEpisodes String[]
  status         String    @default("pending")
  createdAt      DateTime  @default(now())
  reviewedAt     DateTime?
  reviewedBy     String?
  @@map("playbook_suggestions")
}
```

**Campos novos em Agent:**
```prisma
reputationScores      Json?
reputationUpdatedAt   DateTime?
currentVersionNumber  Int      @default(1)
```

**Comando:**
```bash
cd packages/api
npx prisma migrate dev --name mvp10_agent_evolution
```

**Critério de pronto:** `npx prisma generate` sem erros, migration aplicada.

---

## Fase 2 — Budget Control

**Módulo:** `packages/api/src/modules/budget/`

```
budget/
├── application/use-cases/
│   ├── GetBudgetPolicyUseCase.ts
│   ├── UpsertBudgetPolicyUseCase.ts
│   ├── CheckBudgetBeforeExecutionUseCase.ts  ← crítico
│   ├── RecordSpendUseCase.ts
│   └── ResetDailyBudgetUseCase.ts
├── domain/
│   ├── budget-policy.ts
│   ├── ports.ts                              ← IBudgetPolicyRepository
│   └── errors.ts                            ← BudgetExceededError
├── infrastructure/persistence/
│   └── PrismaBudgetPolicyRepository.ts
├── interfaces/http/
│   ├── budget.routes.ts
│   └── budget.controller.ts
└── dependencies.ts
```

**Hook no ExecuteTaskUseCase (ponto crítico):**
```typescript
// packages/api/src/modules/tasks/application/use-cases/ExecuteTaskUseCase.ts
// Antes de chamar o LLM:
await checkBudgetBeforeExecution.execute({ agentId, estimatedCostUsd })
// Lança BudgetExceededError se hardStop=true e limite atingido
// Após execução:
await recordSpend.execute({ agentId, actualCostUsd })
```

**APIs:**
```
GET  /v1/agents/:id/budget
PUT  /v1/agents/:id/budget
GET  /v1/budget/report?agentId=&period=month
POST /v1/budget/report/export
```

**Job BullMQ:**
```typescript
// ResetDailyBudgetJob.ts — cron: "0 0 * * *" (00:00 UTC)
// ResetMonthlyBudgetJob.ts — cron: "0 0 1 * *" (1º dia do mês)
```

**Critério de pronto:** mvp10-budget-control.feature 100% verde.

---

## Fase 3 — Feedback do Usuário

**Módulo:** `packages/api/src/modules/feedback/`

**APIs:**
```
POST /v1/tasks/:id/feedback
GET  /v1/tasks/:id/feedback
GET  /v1/agents/:id/feedback?period=week
```

**Evento emitido:** `feedback.submitted`
**Consumidores:** `LlmRouterScoreService`, `AgentReputationService`

**UI — Task Card:**
```
✅ Task concluída — "Analisar logs"
Agente: backend-specialist | Custo: $0.0032

👍  Foi útil?  👎
[Adicionar nota...]
```

**Critério de pronto:** mvp10-feedback.feature 100% verde.

---

## Fase 4 — Versionamento de AgentProfile

```typescript
// AgentVersioningService.ts
async snapshotBeforeUpdate(agentId: string, updatedBy: string, changesSummary: string) {
  const current = await this.agentRepo.findById(agentId)
  const nextVersion = current.currentVersionNumber + 1
  await this.agentVersionRepo.create({
    agentId, version: nextVersion,
    snapshot: JSON.stringify(current),
    changesSummary, createdBy: updatedBy
  })
  await this.agentRepo.update(agentId, { currentVersionNumber: nextVersion })
}
```

**Hook:** toda chamada a `UpdateAgentProfileUseCase` → `snapshotBeforeUpdate` antes de salvar.

**APIs:**
```
GET  /v1/agents/:id/versions
GET  /v1/agents/:id/versions/:v
POST /v1/agents/:id/versions/:v/restore
GET  /v1/agents/:id/versions/:v/diff/:v2
```

**Critério de pronto:** mvp10-agent-versioning.feature 100% verde.

---

## Fase 5 — Histórico de Desempenho

```typescript
// ConsolidatePerformanceJob.ts — cron: "0 1 * * *" (01:00 UTC)
// Para cada agente com tasks no dia:
//   → upsert AgentPerformanceRecord com period = "YYYY-MM-DD"
```

**APIs:**
```
GET /v1/agents/:id/performance?period=30d
GET /v1/agents/:id/performance/trend
```

---

## Fase 6 — Reputação por Capability

```typescript
// AgentReputationService.ts
function calculateScore(successRate: number, conformance: number, feedback: number): number {
  return (successRate * 0.5) + (conformance * 0.3) + (feedback * 0.2)
}
// Trigger: após feedback.submitted e após ConsolidatePerformanceJob
```

**Critério de pronto:** mvp10-performance-reputation.feature 100% verde.

---

## Fase 7 — Dashboard de Custos

**UI — `/costs`:**
```
Resumo do período (total, agente mais caro, média/task)
Gráfico: gasto diário por agente (linha, 30 dias)
Tabela: ranking por custo + filtros
[Export CSV] [Export JSON]
```

**APIs:**
```
GET /v1/costs/summary?period=month&tenantId=
GET /v1/costs/by-agent?period=month
GET /v1/costs/export?period=month&format=csv
```

---

## Fase 8 — Lições Aprendidas

**Endpoint Python (novo):**
```python
# POST /evolution/analyze-episodes
# Input:  { agentId, episodes: MemoryEntry[] }
# Output: { suggestions: [{ text, sourceEpisodeIds, confidence }] }
```

**Job BullMQ:**
```typescript
// LearnFromEpisodesJob.ts — cron: "0 2 * * 0" (domingo 02:00 UTC)
// Filtro: confidence >= 0.7
// Resultado: PlaybookSuggestion com status "pending"
```

**APIs:**
```
GET  /v1/agents/:id/playbook-suggestions
POST /v1/agents/:id/playbook-suggestions/:sid/approve
POST /v1/agents/:id/playbook-suggestions/:sid/reject
```

**Critério de pronto:** mvp10-playbook-suggestions.feature 100% verde.

---

## Fase 9 — Testes & Endurecimento

**Unitários (Vitest):**
- BudgetPolicyService: abaixo/acima/no threshold, hardStop true/false
- AgentVersioningService: snapshot, restore, diff
- AgentReputationService: cálculo com diferentes pesos
- TaskFeedbackService: persistência e propagação de evento

**Integração:**
- Fluxo: task → spend → budget → feedback → reputação
- Job idempotente: 2× no mesmo dia = 1 registro

**Regressão:**
```bash
vitest run --reporter=verbose
```

---

## Variáveis de Ambiente

```env
BUDGET_RESET_CRON="0 0 * * *"
PERFORMANCE_CONSOLIDATE_CRON="0 1 * * *"
LEARN_FROM_EPISODES_CRON="0 2 * * 0"
REPUTATION_DECAY_DAYS=30
```

---

## Estrutura de Módulos Novos

```
packages/api/src/modules/
├── budget/       ← Fase 2
├── feedback/     ← Fase 3
├── evolution/    ← Fases 4, 6, 8
│   ├── versioning/
│   ├── reputation/
│   └── playbook/
├── performance/  ← Fase 5
└── costs/        ← Fase 7
```
