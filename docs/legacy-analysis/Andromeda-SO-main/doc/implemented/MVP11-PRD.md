# PRD — MVP11: Planner, Multi-step Orchestration & Agent Handoff

**Status:** Planejado  
**Pré-requisito:** MVP10 (AgentVersion, AgentBudgetPolicy, TaskFeedback, AgentPerformanceRecord)

---

## Objetivo

Capacitar o Andromeda OS a decompor tarefas complexas em subtarefas orquestradas, executar planos com dependências sequenciais e paralelas, transferir contexto formalmente entre agentes via HandoffPayload, e permitir aprovação humana em pontos críticos — com rastreabilidade completa.

---

## Blocos de Implementação

### Bloco A — ExecutionPlan

```prisma
model ExecutionPlan {
  id               String     @id @default(cuid())
  tenantId         String     @default("default")
  taskId           String
  agentId          String
  title            String
  description      String?
  status           String     @default("pending")
  totalSteps       Int        @default(0)
  completedSteps   Int        @default(0)
  failedSteps      Int        @default(0)
  requiresApproval Boolean    @default(false)
  approvedBy       String?
  approvedAt       DateTime?
  startedAt        DateTime?
  completedAt      DateTime?
  failedAt         DateTime?
  rollbackAt       DateTime?
  metadata         Json?
  deletedAt        DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  steps            PlanStep[]
  @@map("execution_plans")
}
