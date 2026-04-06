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
Bloco B — PlanStep
text
model PlanStep {
  id                       String        @id @default(cuid())
  tenantId                 String        @default("default")
  planId                   String
  plan                     ExecutionPlan @relation(fields: [planId], references: [id])
  stepIndex                Int
  title                    String
  description              String?
  agentId                  String
  skillId                  String?
  status                   String        @default("pending")
  input                    Json?
  output                   Json?
  errorMessage             String?
  dependsOn                String[]
  canRunParallel           Boolean       @default(false)
  requiresApproval         Boolean       @default(false)
  approvedBy               String?
  approvedAt               DateTime?
  continuationInstructions String?
  expectedOutputFormat     String?
  startedAt                DateTime?
  completedAt              DateTime?
  failedAt                 DateTime?
  retryCount               Int           @default(0)
  maxRetries               Int           @default(2)
  deletedAt                DateTime?
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
  handoffs                 AgentHandoff[]
  @@map("plan_steps")
}
Bloco C — AgentHandoff
text
model AgentHandoff {
  id             String   @id @default(cuid())
  tenantId       String   @default("default")
  planId         String
  stepId         String
  step           PlanStep @relation(fields: [stepId], references: [id])
  fromAgentId    String
  toAgentId      String
  status         String   @default("pending")
  payload        Json
  result         Json?
  rejectedReason String?
  deletedAt      DateTime?
  createdAt      DateTime @default(now())
  completedAt    DateTime?
  @@map("agent_handoffs")
}
Bloco C2 — HandoffPayload (contrato TypeScript)
typescript
// packages/core/src/contracts/handoff.ts
export interface HandoffPayload {
  planId: string
  stepId: string
  fromAgentId: string
  toAgentId: string
  taskContext: {
    originalTaskId: string
    originalGoal: string
    completedSoFar: string
    currentObjective: string
    constraints: string[]
  }
  relevantMemory: {
    episodicEntries: string[]
    semanticFacts: string[]
    knowledgeChunks: string[]
  }
  intermediateResults: {
    stepId: string
    summary: string
    artifacts: string[]
  }[]
  continuationInstructions: string
  expectedOutputFormat: string
  humanApprovalRequired: boolean
  deadline?: string
}
Bloco D — Estrutura de módulo
text
packages/api/src/modules/planner/
  application/use-cases/
    CreateExecutionPlanUseCase.ts
    ExecutePlanUseCase.ts
    ApprovePlanStepUseCase.ts
    RollbackPlanUseCase.ts
    GetPlanStatusUseCase.ts
  domain/
    execution-plan.ts
    plan-step.ts
    task-graph.ts
    handoff-payload.ts
    ports.ts
    errors.ts
  infrastructure/
    persistence/
      PrismaExecutionPlanRepository.ts
      PrismaPlanStepRepository.ts
      PrismaAgentHandoffRepository.ts
    jobs/
      ExecutePlanStepJob.ts
      MonitorPlanJob.ts
  interfaces/http/
    planner.routes.ts
    planner.controller.ts
    dependencies.ts
Bloco E — TaskGraph
typescript
export class TaskGraph {
  constructor(private steps: PlanStep[]) {}

  getReadySteps(): PlanStep[] {
    return this.steps.filter(step =>
      step.status === 'pending' &&
      step.dependsOn.every(depId =>
        this.steps.find(s => s.id === depId)?.status === 'completed'
      )
    )
  }

  validateNoCycles(): void {
    const visited = new Set<string>()
    const stack = new Set<string>()
    const dfs = (stepId: string) => {
      visited.add(stepId); stack.add(stepId)
      const step = this.steps.find(s => s.id === stepId)
      for (const depId of step?.dependsOn ?? []) {
        if (!visited.has(depId)) dfs(depId)
        else if (stack.has(depId)) throw new CyclicDependencyError(stepId, depId)
      }
      stack.delete(stepId)
    }
    this.steps.forEach(s => { if (!visited.has(s.id)) dfs(s.id) })
  }

  getParallelGroups(): [PlanStep[], PlanStep[]] {
    const ready = this.getReadySteps()
    return [ready.filter(s => s.canRunParallel), ready.filter(s => !s.canRunParallel)]
  }

  isDeadlocked(): boolean {
    const pending = this.steps.filter(s =>
      s.status === 'pending' || s.status === 'waiting_dependency'
    )
    return pending.length > 0 && this.getReadySteps().length === 0
  }
}
Bloco F — APIs REST
text
POST   /v1/plans
GET    /v1/plans/:id
GET    /v1/plans/:id/steps
POST   /v1/plans/:id/approve
POST   /v1/plans/:id/steps/:stepId/approve
POST   /v1/plans/:id/rollback
GET    /v1/plans/:id/handoffs
GET    /v1/agents/:id/plans
GET    /v1/tasks/:id/plan
Bloco G — Prompt canônico do PlannerAgent
text
Você é um PlannerAgent do Andromeda OS.
Decomponha a tarefa abaixo em etapas atômicas e retorne SOMENTE JSON válido.

Tarefa: {goal}
Agentes disponíveis: {agents_with_capabilities}

Retorne exatamente neste formato:
{
  "title": "string",
  "description": "string",
  "requiresApproval": boolean,
  "steps": [
    {
      "stepIndex": number,
      "title": "string",
      "description": "string",
      "agentId": "string",
      "skillId": "string | null",
      "dependsOn": ["stepIndex_anterior"],
      "canRunParallel": boolean,
      "requiresApproval": boolean,
      "continuationInstructions": "string",
      "expectedOutputFormat": "string"
    }
  ]
}

Regras:
- Máximo 10 etapas por plano
- Cada etapa atribuída a UM agente
- dependsOn só referencia stepIndex anteriores (sem ciclos)
- Etapas sem dependências podem ter canRunParallel: true
- requiresApproval: true apenas em ações destrutivas ou irreversíveis
Bloco H — Fluxo de orquestração
text
ExecutePlanUseCase:
1. Carregar plano → TaskGraph.validateNoCycles()
2. Loop principal:
   a. getReadySteps()
   b. requiresApproval e não aprovado → waiting_approval → aguarda
   c. canRunParallel → BullMQ N jobs paralelos
   d. sequencial → BullMQ 1 job, aguarda
   e. falha → retryCount < maxRetries → reagenda
   f. maxRetries esgotado → plan.status = failed
3. Todos completed → plan.status = completed
Bloco I — Integração existente
Módulo O que muda
ExecuteTaskUseCase Detecta complexidade → chama CreateExecutionPlan
MemoryService retrieveForContext() ao montar HandoffPayload
KnowledgeRetrievalService retrieve() ao montar HandoffPayload
BudgetPolicyService Budget verificado antes de cada step
AuditService Eventos: plan.created, handoff.created, plan.rolled_back
WebSocket Eventos: plan.step., plan. em tempo real
Bloco J — UI: aba Plans
text
[✓] Step 1 — researcher       2s
[✓] Step 2 — backend-spec     8s
[⟳] Step 3 — writer           em execução...
[⏳] Step 4 — auditor          aguardando Step 3
[⏳] Step 5 — vault-agent      aguardando Step 4

[Aprovar próximo step]  [Pausar]  [Rollback]
Bloco K — Rollback parcial
text
1. Para jobs BullMQ de steps running
2. Para cada step completed (ordem reversa por stepIndex):
   - Executa rollbackAction se definida
   - Marca como rolled_back
3. plan.status = rolled_back
4. AuditLog com lista de steps revertidos
5. Emite evento plan.rolled_back
Variáveis de Ambiente
text
PLANNER_MAX_STEPS=10
PLANNER_STEP_TIMEOUT_MS=300000
PLANNER_MONITOR_CRON="*/5 * * * *"
PLANNER_MAX_PARALLEL_STEPS=4
PLANNER_APPROVAL_TIMEOUT_HOURS=24
Ordem de Implementação
Fase Foco Critério de pronto
1 Migrations Prisma migrate dev sem erro
2 Domain puro (TaskGraph, erros) vitest domain 100%
3 CreateExecutionPlanUseCase POST /v1/plans retorna plano
4 ExecutePlanUseCase sequencial 3 steps completam em sequência
5 AgentHandoff protocolo payload com memória e knowledge
6 Execução paralela BullMQ 2 steps simultâneos por timestamp
7 Aprovação humana step pausa, UI aprova, retoma
8 Rollback parcial revertido em ordem reversa + audit
9 UI aba Plans grafo em tempo real
10 Testes + regressão zero falhas MVP01–MVP10
Critérios de Pronto
 Migration mvp11_planner sem erros

 CreateExecutionPlanUseCase gera plano via LLM

 TaskGraph.validateNoCycles() rejeita ciclos

 Execução sequencial: 3 steps com handoffs

 Execução paralela: 2 steps simultâneos

 HandoffPayload com memória e knowledge

 Step com requiresApproval pausa e aguarda

 Rollback reverte em ordem reversa

 Budget verificado por step

 AuditLog por handoff

 WebSocket em tempo real

 UI com grafo de steps

 Testes unitários e integração

 Zero regressão MVP01–MVP10
