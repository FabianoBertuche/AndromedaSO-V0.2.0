
script = '''#!/usr/bin/env python3
"""
Gerador de documentação MVP11 — Andromeda OS
Execute: python3 generate_mvp11_docs.py
Resultado: mvp11-docs.zip com estrutura doc/active/ pronta para copiar
"""

import zipfile, os

# ── CONTEÚDO DOS ARQUIVOS ────────────────────────────────────────────────────

MVP11_PRD = """# PRD — MVP11: Planner, Multi-step Orchestration & Agent Handoff
**Status:** Planejado  
**Iniciado:** —  
**Pré-requisito:** MVP10 (AgentVersion, AgentBudgetPolicy, TaskFeedback, AgentPerformanceRecord)  
**Referência:** doc/active/Project-Context.md

---

## Objetivo

Capacitar o Andromeda OS a decompor tarefas complexas em subtarefas orquestradas, executar planos
com dependências sequenciais e paralelas, transferir contexto formalmente entre agentes via
HandoffPayload, e permitir aprovação humana em pontos críticos — com rastreabilidade completa.

---

## Blocos de Implementação

### Bloco A — ExecutionPlan (entidade formal de plano)

```typescript
model ExecutionPlan {
  id               String     @id @default(cuid())
  tenantId         String     @default("default")
  taskId           String
  agentId          String
  title            String
  description      String?
  status           String     @default("pending")
  // pending | planning | running | paused | completed | failed | rolled_back
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
```

### Bloco B — PlanStep (nós do grafo)

```typescript
model PlanStep {
  id                   String        @id @default(cuid())
  tenantId             String        @default("default")
  planId               String
  plan                 ExecutionPlan @relation(fields: [planId], references: [id])
  stepIndex            Int
  title                String
  description          String?
  agentId              String
  skillId              String?
  status               String        @default("pending")
  // pending | waiting_dependency | waiting_approval | running | completed | failed | skipped | rolled_back
  input                Json?
  output               Json?
  errorMessage         String?
  dependsOn            String[]
  canRunParallel       Boolean       @default(false)
  requiresApproval     Boolean       @default(false)
  approvedBy           String?
  approvedAt           DateTime?
  continuationInstructions String?
  expectedOutputFormat String?
  startedAt            DateTime?
  completedAt          DateTime?
  failedAt             DateTime?
  retryCount           Int           @default(0)
  maxRetries           Int           @default(2)
  deletedAt            DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  handoffs             AgentHandoff[]
  @@map("plan_steps")
}
```

### Bloco C — AgentHandoff (protocolo formal de transferência)

```typescript
model AgentHandoff {
  id             String   @id @default(cuid())
  tenantId       String   @default("default")
  planId         String
  stepId         String
  step           PlanStep @relation(fields: [stepId], references: [id])
  fromAgentId    String
  toAgentId      String
  status         String   @default("pending")
  // pending | accepted | rejected | completed | failed
  payload        Json     // HandoffPayload completo
  result         Json?
  rejectedReason String?
  deletedAt      DateTime?
  createdAt      DateTime @default(now())
  completedAt    DateTime?
  @@map("agent_handoffs")
}
```

**HandoffPayload (contrato TypeScript):**
```typescript
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
```

### Bloco D — Estrutura de módulo

```
packages/api/src/modules/planner/
  application/
    use-cases/
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
  interfaces/
    http/
      planner.routes.ts
      planner.controller.ts
      dependencies.ts
```

### Bloco E — TaskGraph (DAG)

```typescript
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
```

### Bloco F — APIs REST

```
POST   /v1/plans                              CreateExecutionPlanUseCase
GET    /v1/plans/:id                          GetPlanStatusUseCase
GET    /v1/plans/:id/steps                    lista etapas com status
POST   /v1/plans/:id/approve                  aprova plano inteiro
POST   /v1/plans/:id/steps/:stepId/approve    ApprovePlanStepUseCase
POST   /v1/plans/:id/rollback                 RollbackPlanUseCase
GET    /v1/plans/:id/handoffs                 lista handoffs do plano
GET    /v1/agents/:id/plans                   planos em que o agente participou
GET    /v1/tasks/:id/plan                     plano vinculado a uma task
```

### Bloco G — Prompt canônico do PlannerAgent

```
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
```

### Bloco H — Orquestração sequencial e paralela

```
ExecutePlanUseCase:
1. Carregar plano → TaskGraph.validateNoCycles()
2. Loop principal:
   a. getReadySteps() → steps com dependências satisfeitas
   b. Para cada step pronto:
      - requiresApproval e não aprovado → status: waiting_approval → aguarda
      - canRunParallel: true → BullMQ N jobs em paralelo
      - sequencial → BullMQ 1 job, aguarda conclusão
   c. Step completa → HandoffPayload montado → próxima iteração
   d. Step falha → retryCount < maxRetries → reagenda
   e. maxRetries esgotado → plan.status = failed
3. Todos steps completed → plan.status = completed
```

### Bloco I — Integração com sistema existente

| Módulo existente          | O que muda                                          |
|---------------------------|-----------------------------------------------------|
| ExecuteTaskUseCase        | Detecta tarefa complexa → chama CreateExecutionPlan |
| MemoryService             | HandoffPayload busca MemoryEntry relevantes         |
| KnowledgeRetrievalService | HandoffPayload inclui KnowledgeChunks relevantes    |
| BudgetPolicyService       | Budget verificado antes de cada step               |
| AuditService              | Cada handoff gera AuditLog                         |
| WebSocket/Timeline        | Eventos de plano transmitidos em tempo real         |

### Bloco J — UI: aba Plans

```
Plans > Plan #abc123 — "Analisar repositório e gerar relatório"
Status: running (3/5 etapas)

[✓] Step 1 — Clonar repositório          researcher           2s
[✓] Step 2 — Analisar estrutura de código backend-specialist  8s
[⟳] Step 3 — Gerar relatório técnico      writer               em execução...
[⏳] Step 4 — Revisar relatório            auditor              aguardando Step 3
[⏳] Step 5 — Publicar no vault            vault-agent          aguardando Step 4

[Aprovar próximo step]  [Pausar plano]  [Rollback]
```

### Bloco K — Rollback parcial

```typescript
// RollbackPlanUseCase
// 1. Para jobs BullMQ de steps running
// 2. Para cada step completed em ordem reversa (stepIndex desc):
//    - Executa rollbackAction se definida
//    - Marca step como rolled_back
// 3. Marca plano como rolled_back
// 4. Emite evento plan.rolled_back
// 5. Gera AuditLog com lista de steps revertidos
```

---

## Variáveis de Ambiente

```env
PLANNER_MAX_STEPS=10
PLANNER_STEP_TIMEOUT_MS=300000
PLANNER_MONITOR_CRON="*/5 * * * *"
PLANNER_MAX_PARALLEL_STEPS=4
PLANNER_APPROVAL_TIMEOUT_HOURS=24
```

---

## Ordem de Implementação

| Fase | Foco                              | Critério de pronto                                  |
|------|-----------------------------------|-----------------------------------------------------|
| 1    | Migrations Prisma                 | migrate dev sem erro                                |
| 2    | Domain puro (TaskGraph, erros)    | vitest domain 100%                                  |
| 3    | CreateExecutionPlanUseCase        | POST /v1/plans retorna plano com steps              |
| 4    | ExecutePlanUseCase sequencial     | plano de 3 steps completa do início ao fim          |
| 5    | AgentHandoff protocolo            | payload com memória e knowledge persistido          |
| 6    | Execução paralela BullMQ          | 2 steps simultâneos confirmado por timestamps       |
| 7    | Aprovação humana                  | step pausa, UI exibe botão, aprovação retoma        |
| 8    | Rollback parcial                  | steps revertidos em ordem reversa + AuditLog        |
| 9    | UI aba Plans                      | painel exibe grafo de steps em tempo real           |
| 10   | Testes + endurecimento            | vitest run sem falhas, zero regressão MVP01-MVP10   |

---

## Critérios de Pronto

- [ ] Migration mvp11_planner aplicada sem erros
- [ ] CreateExecutionPlanUseCase gera plano estruturado via LLM
- [ ] TaskGraph.validateNoCycles() detecta e rejeita ciclos
- [ ] Execução sequencial completa plano de 3 steps com handoffs
- [ ] Execução paralela roda 2 steps simultaneamente com BullMQ
- [ ] HandoffPayload contém memória e knowledge relevantes
- [ ] Step com requiresApproval pausa e aguarda aprovação
- [ ] Rollback reverte steps em ordem reversa
- [ ] Budget verificado antes de cada step
- [ ] AuditLog gerado para cada handoff
- [ ] WebSocket emite eventos de progresso em tempo real
- [ ] UI exibe grafo de steps com status e botões de controle
- [ ] Testes unitários: TaskGraph, HandoffPayload, estados
- [ ] Teste de integração: plano completo end-to-end
- [ ] Zero regressão em MVP01–MVP10

---

## Fora do Escopo do MVP11

- i18n (MVP12)
- Export/Import de agentes (MVP12)
- Notificações proativas via Telegram/Discord (MVP13)
- Eval Engine formal (MVP14)
- Loop AutoResearch overnight (MVP18)
- Planos com mais de 10 steps
- Planos aninhados (plano dentro de plano)
- Replanejamento dinâmico em runtime
"""

IMPL_PLAN = """# Implementation Plan — MVP11: Planner, Multi-step Orchestration & Agent Handoff
**Status:** Planejado  
**Pré-requisito:** MVP10 concluído  
**Referência:** doc/active/MVP11-PRD.md

---

## Visão Geral das Fases

| Fase | Foco                            | Impacto                     |
|------|---------------------------------|-----------------------------|
| 1    | Migrations + Schema Prisma      | Fundação de dados           |
| 2    | Domain puro + contratos         | Testável isolado, sem banco |
| 3    | CreateExecutionPlanUseCase      | Geração de plano via LLM    |
| 4    | ExecutePlanUseCase sequencial   | Execução step a step        |
| 5    | AgentHandoff protocolo formal   | Transferência de contexto   |
| 6    | Execução paralela BullMQ        | Steps simultâneos           |
| 7    | Aprovação humana                | Pausar e aguardar operador  |
| 8    | Rollback parcial                | Reverter plano executado    |
| 9    | UI aba Plans                    | Visualização do grafo       |
| 10   | Testes + endurecimento          | Cobertura completa          |

---

## Fase 1 — Migrations + Schema Prisma

**Arquivo:** `packages/api/prisma/migrations/20260324000000_mvp11_planner/`

Adicionar ao `schema.prisma` os modelos `ExecutionPlan`, `PlanStep` e `AgentHandoff`
(schemas completos no PRD — Blocos A, B e C).

Campos adicionais obrigatórios em PlanStep:
```prisma
  continuationInstructions String?
  expectedOutputFormat     String?
```

**Comandos:**
```bash
cd packages/api
npx prisma migrate dev --name mvp11_planner
npx prisma generate
```

**Critério de pronto:** migrate sem erros. `npx prisma studio` mostra as 3 novas tabelas.

---

## Fase 2 — Domain Puro + Contratos

**Estrutura:**
```
packages/api/src/modules/planner/domain/
  execution-plan.ts     ← estados válidos e transições
  plan-step.ts          ← estados válidos e transições
  task-graph.ts         ← lógica DAG pura (implementação no PRD Bloco E)
  handoff-payload.ts    ← interface HandoffPayload (no PRD Bloco C)
  ports.ts              ← IExecutionPlanRepository, IPlanStepRepository, IAgentHandoffRepository
  errors.ts             ← erros de domínio
```

**`errors.ts`:**
```typescript
export class PlanCreationError extends Error {}
export class CyclicDependencyError extends Error {
  constructor(stepId: string, depId: string) {
    super(`Ciclo detectado: ${stepId} → ${depId}`)
  }
}
export class HandoffRejectedError extends Error {}
export class PlanDeadlockError extends Error {}
export class StepApprovalTimeoutError extends Error {}
export class PlanStepNotFoundError extends Error {}
export class MaxStepsExceededError extends Error {}
```

**Testes unitários — `vitest run planner/domain`:**
```
task-graph.spec.ts
  ✓ getReadySteps retorna apenas steps com dependências satisfeitas
  ✓ validateNoCycles lança CyclicDependencyError em grafo com ciclo
  ✓ getParallelGroups separa paralelos de sequenciais
  ✓ isDeadlocked retorna true quando nenhum step pode avançar
  ✓ isDeadlocked retorna false quando todos completed
```

**Critério de pronto:** `vitest run planner/domain` — 100% passando.

---

## Fase 3 — CreateExecutionPlanUseCase

**Arquivo:** `packages/api/src/modules/planner/application/use-cases/CreateExecutionPlanUseCase.ts`

```typescript
export class CreateExecutionPlanUseCase {
  constructor(
    private planRepo: IExecutionPlanRepository,
    private stepRepo: IPlanStepRepository,
    private agentRepo: IAgentRepository,
    private llmRouter: ILlmRouter,
    private auditService: IAuditService,
  ) {}

  async execute(input: {
    taskId: string
    goal: string
    tenantId: string
    requestedBy: string
  }): Promise<ExecutionPlan> {

    // 1. Buscar agentes disponíveis do tenant
    const agents = await this.agentRepo.findByTenant(input.tenantId)
    if (agents.length === 0) throw new PlanCreationError('Nenhum agente disponível')

    // 2. Montar prompt canônico (definido no PRD Bloco G)
    const prompt = buildPlannerPrompt(input.goal, agents)

    // 3. Chamar LLM via Router com capability 'planning'
    const raw = await this.llmRouter.complete({
      prompt,
      capability: 'planning',
      tenantId: input.tenantId,
      agentId: 'planner-system',
    })

    // 4. Parsear JSON com retry em caso de falha
    let planData: PlannerLlmResponse
    try {
      planData = JSON.parse(raw.content)
    } catch {
      throw new PlanCreationError('LLM retornou JSON inválido')
    }

    // 5. Validar limite de steps
    if (planData.steps.length > Number(process.env.PLANNER_MAX_STEPS ?? 10)) {
      throw new MaxStepsExceededError()
    }

    // 6. Persistir plano
    const plan = await this.planRepo.create({
      taskId: input.taskId,
      tenantId: input.tenantId,
      agentId: 'planner-system',
      title: planData.title,
      description: planData.description,
      requiresApproval: planData.requiresApproval,
      totalSteps: planData.steps.length,
      status: 'pending',
    })

    // 7. Persistir steps com IDs reais
    const steps = await this.stepRepo.createMany(
      planData.steps.map(s => ({ ...s, planId: plan.id, tenantId: input.tenantId }))
    )

    // 8. Validar grafo — sem ciclos
    const graph = new TaskGraph(steps)
    graph.validateNoCycles()

    // 9. Audit
    await this.auditService.log('plan.created', plan.id, input.requestedBy)

    return plan
  }
}
```

**API:**
```
POST /v1/plans
Body: { taskId: string, goal: string }
Response 201: { planId, title, totalSteps, status, steps[] }
Response 422: { error: "PLAN_CREATION_ERROR" | "MAX_STEPS_EXCEEDED" }
```

**Critério de pronto:** POST /v1/plans retorna plano com steps corretamente estruturados.

---

## Fase 4 — ExecutePlanUseCase (sequencial)

**Arquivo:** `packages/api/src/modules/planner/application/use-cases/ExecutePlanUseCase.ts`

```typescript
export class ExecutePlanUseCase {
  async execute(planId: string, tenantId: string): Promise<void> {
    const plan = await this.planRepo.findById(planId)
    if (!plan) throw new PlanStepNotFoundError()

    await this.planRepo.updateStatus(planId, 'running')

    let steps = await this.stepRepo.findByPlanId(planId)
    const graph = new TaskGraph(steps)

    while (true) {
      const ready = graph.getReadySteps()

      if (ready.length === 0) {
        if (graph.isDeadlocked()) {
          await this.planRepo.updateStatus(planId, 'failed')
          this.eventEmitter.emit('plan.deadlock_detected', { planId })
          throw new PlanDeadlockError()
        }
        break
      }

      for (const step of ready) {
        if (step.requiresApproval && !step.approvedAt) {
          await this.stepRepo.updateStatus(step.id, 'waiting_approval')
          this.eventEmitter.emit('plan.step.approval_required', { planId, stepId: step.id })
          continue
        }
        await this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
        await this.stepRepo.updateStatus(step.id, 'running')
      }

      await this.waitForAnyStepCompletion(planId)
      steps = await this.stepRepo.findByPlanId(planId)
      graph.updateSteps(steps)
    }

    const allDone = steps.every(s => s.status === 'completed')
    await this.planRepo.updateStatus(planId, allDone ? 'completed' : 'failed')
    this.eventEmitter.emit(allDone ? 'plan.completed' : 'plan.failed', { planId })
  }
}
```

**ExecutePlanStepJob (BullMQ):**
```typescript
// infrastructure/jobs/ExecutePlanStepJob.ts
// 1. Busca step e plano
// 2. Verifica budget via CheckBudgetBeforeExecutionUseCase
// 3. Monta HandoffPayload (memória + knowledge + resultados anteriores)
// 4. Persiste AgentHandoff com status: accepted
// 5. Chama ExecuteTaskUseCase com agentId do step
// 6. Salva output em step.output
// 7. Atualiza step.status = completed
// 8. Emite WebSocket: plan.step.completed
// Em caso de falha:
//   retryCount < maxRetries → BullMQ retry automático
//   maxRetries esgotado → step.status = failed → plan reavalia
```

**Critério de pronto:** Plano com 3 steps sequenciais executa do início ao fim.

---

## Fase 5 — AgentHandoff (protocolo formal)

**Montagem do HandoffPayload dentro do ExecutePlanStepJob:**

```typescript
const relevantMemory = await memoryService.retrieveForContext({
  agentId: step.agentId,
  context: step.description,
  limit: 5,
})

const knowledgeChunks = await knowledgeService.retrieve({
  agentId: step.agentId,
  query: step.description,
  limit: 3,
})

const completedSteps = await stepRepo.findCompletedByPlanId(planId)

const payload: HandoffPayload = {
  planId,
  stepId: step.id,
  fromAgentId: previousStep?.agentId ?? 'planner-system',
  toAgentId: step.agentId,
  taskContext: {
    originalTaskId: plan.taskId,
    originalGoal: plan.description ?? '',
    completedSoFar: completedSteps.map(s => s.output?.summary ?? '').join('\\n'),
    currentObjective: step.description ?? '',
    constraints: (step.continuationInstructions ?? '').split('\\n'),
  },
  relevantMemory: {
    episodicEntries: relevantMemory.episodic.map(m => m.id),
    semanticFacts: relevantMemory.semantic.map(m => m.content),
    knowledgeChunks: knowledgeChunks.map(c => c.id),
  },
  intermediateResults: completedSteps.map(s => ({
    stepId: s.id,
    summary: s.output?.summary ?? '',
    artifacts: s.output?.artifacts ?? [],
  })),
  continuationInstructions: step.continuationInstructions ?? '',
  expectedOutputFormat: step.expectedOutputFormat ?? 'text',
  humanApprovalRequired: step.requiresApproval,
}

await handoffRepo.create({ ...payload, status: 'accepted' })
await auditService.log('handoff.created', step.id, 'planner-system')
```

**Critério de pronto:** AgentHandoff persistido com payload completo incluindo memória e knowledge.

---

## Fase 6 — Execução Paralela (BullMQ)

**Alteração em ExecutePlanUseCase:**

```typescript
// Substituir loop for serial pela lógica paralela:
const [parallel, sequential] = graph.getParallelGroups()

const maxParallel = Number(process.env.PLANNER_MAX_PARALLEL_STEPS ?? 4)

// Disparar paralelos simultaneamente (respeitando limite)
const parallelBatch = parallel.slice(0, maxParallel)
await Promise.all(
  parallelBatch.map(step => {
    this.stepRepo.updateStatus(step.id, 'running')
    return this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
  })
)

// Executar sequenciais um a um
for (const step of sequential) {
  await this.stepRepo.updateStatus(step.id, 'running')
  await this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
  await this.waitForStep(step.id)
}
```

**Critério de pronto:** 2 steps `canRunParallel: true` iniciam com menos de 500ms de diferença (verificar timestamps `startedAt` no banco).

---

## Fase 7 — Aprovação Humana

**Fluxo completo:**
```
Step.requiresApproval = true
  → status: waiting_approval
  → WebSocket: plan.step.approval_required { planId, stepId }
  → UI exibe modal de aprovação com descrição do step

Operador clica "Aprovar":
  → POST /v1/plans/:id/steps/:stepId/approve
  → ApprovePlanStepUseCase:
      step.approvedBy = userId
      step.approvedAt = now()
      step.status = 'pending'  ← volta à fila
  → ExecutePlanUseCase retoma na próxima iteração

Timeout (PLANNER_APPROVAL_TIMEOUT_HOURS):
  → MonitorPlanJob detecta waiting_approval há muito tempo
  → Emite: plan.step.approval_timeout { planId, stepId }
  → (MVP13 enviará notificação proativa)
```

**APIs:**
```
POST /v1/plans/:id/steps/:stepId/approve
POST /v1/plans/:id/approve   → aprova plano inteiro (todos os steps)
```

**Critério de pronto:** Step para em `waiting_approval`, botão no painel aprova, execução retoma automaticamente.

---

## Fase 8 — Rollback Parcial

```typescript
// RollbackPlanUseCase.ts
export class RollbackPlanUseCase {
  async execute(planId: string, requestedBy: string): Promise<void> {
    const steps = await this.stepRepo.findByPlanId(planId)

    // 1. Parar steps em execução
    const running = steps.filter(s => s.status === 'running')
    for (const step of running) {
      await this.queue.removeJobs(`execute-plan-step:${step.id}`)
      await this.stepRepo.updateStatus(step.id, 'rolled_back')
    }

    // 2. Reverter completados em ordem reversa
    const completed = steps
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.stepIndex - a.stepIndex)

    const rolledBack: string[] = []
    for (const step of completed) {
      // Executar ação de rollback se definida no step
      if (step.rollbackAction) {
        await this.executeRollbackAction(step)
      }
      await this.stepRepo.updateStatus(step.id, 'rolled_back')
      rolledBack.push(step.id)
    }

    // 3. Marcar plano
    await this.planRepo.updateStatus(planId, 'rolled_back')

    // 4. Audit + evento
    await this.auditService.log('plan.rolled_back', planId, requestedBy, { rolledBack })
    this.eventEmitter.emit('plan.rolled_back', { planId, rolledBack })
  }
}
```

**Critério de pronto:** POST /v1/plans/:id/rollback — todos os steps revertidos em ordem reversa, AuditLog com lista.

---

## Fase 9 — UI: Aba Plans

**Componentes novos em `apps/web/src/components/plans/`:**
```
PlanList.tsx             lista de planos com status e barra de progresso
PlanDetail.tsx           detalhe de 1 plano com todos os steps
PlanStepGraph.tsx        visualização do grafo de steps e dependências
PlanStepCard.tsx         card individual com status, agente, tempo, botões
PlanApprovalModal.tsx    modal de confirmação de aprovação de step
PlanRollbackModal.tsx    modal de confirmação de rollback do plano
```

**Status visual de cada step:**
```
⏳ pending           cinza
🔒 waiting_approval  amarelo — exibe botão "Aprovar"
⟳  running           azul animado
✓  completed         verde
✗  failed            vermelho — exibe botão "Retry"
↩  rolled_back       laranja
```

**WebSocket events consumidos no frontend:**
```
plan.step.completed          → atualiza card do step
plan.step.failed             → exibe erro e botão retry
plan.step.approval_required  → exibe modal de aprovação
plan.completed               → banner de sucesso no topo
plan.failed                  → banner de erro
plan.rolled_back             → banner de rollback
plan.deadlock_detected       → alerta crítico
```

**Critério de pronto:** Painel exibe plano em execução com steps se atualizando em tempo real via WebSocket.

---

## Fase 10 — Testes e Endurecimento

### Unitários (Vitest)
```
planner/domain/task-graph.spec.ts                 (5 cenários)
planner/application/CreateExecutionPlanUseCase.spec.ts  (4 cenários)
planner/application/ExecutePlanUseCase.spec.ts    (4 cenários)
planner/application/RollbackPlanUseCase.spec.ts   (3 cenários)
```

### Integração end-to-end
```typescript
// POST /v1/plans com goal real
// → plano criado com 3 steps
// → POST /v1/plans/:id/execute
// → GET /v1/plans/:id → status: running
// → GET /v1/plans/:id/steps → steps com status progressivo
// → GET /v1/plans/:id/handoffs → handoff com payload completo
// → todos steps completam → status: completed
```

### Regressão
```bash
vitest run --reporter verbose
# Zero falhas em testes MVP01–MVP10
```

---

## Regras Obrigatórias

- `tenantId` em todas as entidades novas
- `deletedAt` (soft delete) em todas as entidades novas
- Nenhuma lógica de negócio no controller
- Python **apenas** para cognição — orquestração 100% em TypeScript
- Budget verificado antes de **cada** step individualmente
- AuditLog em: criação de plano, início de step, handoff, aprovação, rollback
- WebSocket emite evento para cada mudança de status de step ou plano
- Rollback é best-effort — AuditLog registra o que foi e o que não foi revertido
"""

EDD = """# EDD — MVP11: Planner, Multi-step Orchestration & Agent Handoff
**Engineering Design Document**  
**Data:** 24/03/2026  
**Status:** Design finalizado

---

## Contexto e Motivação

Com MVP10 concluído, o Andromeda OS tem agentes que evoluem, custos controlados e feedback humano.
O próximo desafio é tornar o sistema capaz de resolver problemas que **não cabem em uma única
chamada LLM** — tarefas complexas que exigem múltiplos especialistas com dependências entre si.

Hoje, quando um usuário pede "analise o repositório, gere um relatório técnico e publique no vault",
o sistema executa uma task monolítica ou depende do agente LLM para coordenar tudo ad-hoc,
sem rastreabilidade. O MVP11 resolve isso com três primitivos:

1. **ExecutionPlan** — representação formal de um plano com steps e dependências
2. **TaskGraph** — motor de resolução de DAG que decide o que executa quando
3. **HandoffPayload** — contrato formal que garante que o agente receptor receba tudo que precisa

---

## ADR-001: PlannerAgent como UseCase, não como Agente LLM

**Decisão:** `CreateExecutionPlanUseCase` usa o LLM para gerar o JSON do plano,
mas a **lógica de orquestração** é TypeScript puro.

**Justificativa:**
- Orquestração determinística não deve depender de LLM em runtime
- LLM usado apenas para decomposição inicial (uma chamada, parse, persiste)
- Execução é puro código: TaskGraph + BullMQ + estados Prisma
- Facilita testes unitários — orquestração testável sem mock de LLM

**Trade-off:** Plano é estático após criação. Replanejamento dinâmico é candidato ao MVP18.

---

## ADR-002: dependsOn como String[] vs. tabela relacional

**Decisão:** `PlanStep.dependsOn` armazena `String[]` (JSONB/array no PostgreSQL).

**Justificativa:**
- Representação simples, consultável com SQL direto
- TaskGraph carregado em memória para resolução — sem necessidade de JOIN complexo
- Array de strings em Prisma/Postgres é nativo e eficiente para máx 10 steps

**Alternativa rejeitada:** Tabela `PlanStepDependency` — over-engineering para o caso atual.

---

## ADR-003: HandoffPayload serializado como Json

**Decisão:** `AgentHandoff.payload` armazenado como `Json` (JSONB no Postgres).

**Justificativa:**
- HandoffPayload é envelope de contexto com estrutura variável por tipo de tarefa
- Não precisa ser consultado por campos internos em MVP11
- Leitura sempre por `handoffId` ou `stepId` — O(1)
- Consistente com decisão do MVP10 para `AgentVersion.snapshot`

---

## ADR-004: Execução paralela via BullMQ vs. Promise.all

**Decisão:** Steps paralelos são enfileirados via **BullMQ**, não `Promise.all` no use case.

**Justificativa:**
- BullMQ garante retry automático, DLQ e rastreabilidade em caso de crash (MVP09)
- `Promise.all` no use case perde contexto em caso de crash do processo Node.js
- MonitorPlanJob detecta steps "running" há mais de PLANNER_STEP_TIMEOUT_MS e reage
- Consistente com arquitetura de jobs existente

---

## ADR-005: Rollback como best-effort, não transacional

**Decisão:** Rollback reverte steps em ordem reversa, mas **não garante atomicidade total**.

**Justificativa:**
- Steps podem ter efeitos externos (vault writes, API calls) — impossível garantir rollback perfeito
- Sistema é auditável: AuditLog registra o que foi e o que não foi revertido
- Operador notificado sobre steps que não puderam ser revertidos
- Atomicidade transacional verdadeira exigiria saga pattern — candidato a MVP futuro

---

## Fluxo Completo

```
Usuário: "Analise o repositório e gere relatório técnico"
  │
  ▼
POST /v1/plans { taskId, goal }
  │
  ▼
CreateExecutionPlanUseCase
  ├── LLM gera JSON do plano (1 chamada)
  ├── Persiste ExecutionPlan + PlanSteps
  └── TaskGraph.validateNoCycles()
  │
  ▼
POST /v1/plans/:id/approve  (se requiresApproval = true)
  │
  ▼
ExecutePlanUseCase — loop principal
  │
  ├── TaskGraph.getReadySteps()
  ├── Steps prontos → BullMQ (paralelo ou sequencial)
  └── Ao completar → HandoffPayload → próxima iteração
  │
  ▼
ExecutePlanStepJob (BullMQ worker)
  ├── CheckBudgetBeforeExecutionUseCase
  ├── MemoryService.retrieveForContext()
  ├── KnowledgeRetrievalService.retrieve()
  ├── Monta HandoffPayload + persiste AgentHandoff
  ├── ExecuteTaskUseCase (agente do step)
  ├── Salva output em PlanStep
  └── WebSocket: plan.step.completed
  │
  ▼
Todos steps completed
  → ExecutionPlan.status = completed
  → WebSocket: plan.completed
```

---

## Riscos e Mitigações

| Risco                              | Prob  | Impacto | Mitigação                                          |
|------------------------------------|-------|---------|-----------------------------------------------------|
| LLM gera JSON inválido             | Média | Alto    | Try/catch com retry 3x antes de falhar              |
| LLM gera ciclo no grafo            | Baixa | Alto    | validateNoCycles() antes de persistir               |
| Step trava em running              | Média | Médio   | MonitorPlanJob a cada 5min detecta e falha o step   |
| Aprovação pendente indefinidamente | Baixa | Médio   | Timeout configurável + escalação via evento         |
| Rollback incompleto                | Baixa | Médio   | AuditLog + operador notificado                      |
| BullMQ worker crash durante step   | Baixa | Alto    | BullMQ retry + DLQ (MVP09) + retryCount no step     |

---

## Módulos Afetados (código existente)

| Módulo                    | Arquivo                              | O que muda                                     |
|---------------------------|--------------------------------------|------------------------------------------------|
| tasks                     | ExecuteTaskUseCase.ts                | Detecta complexidade → oferece criar plano     |
| budget                    | CheckBudgetBeforeExecutionUseCase.ts | Chamado por cada PlanStep antes de executar    |
| memory                    | MemoryService.ts                     | retrieveForContext() ao montar HandoffPayload  |
| knowledge                 | KnowledgeRetrievalService.ts         | retrieve() ao montar HandoffPayload            |
| audit                     | AuditService.ts                      | Novos eventos: plan.created, handoff.created   |
| websocket                 | GatewayService.ts                    | Novos eventos: plan.step.*, plan.*             |
"""

FEATURE_PLAN = """Feature: Criação e Execução de Planos
  Background:
    Given o sistema está operacional com MVP10 concluído
    And existem agentes disponíveis: researcher, backend-specialist, writer, auditor

  # Criação
  Scenario: PlannerAgent decompõe tarefa complexa em steps
    When o operador faz POST /v1/plans com goal "Analisar repositório e gerar relatório técnico"
    Then um ExecutionPlan é criado com status "pending"
    And o plano contém pelo menos 2 PlanSteps
    And cada step tem agentId, title, description e dependsOn preenchidos
    And o grafo de dependências não contém ciclos

  Scenario: Plano rejeitado quando LLM retorna JSON inválido
    Given o LLM retorna string não-JSON
    When o operador cria um plano
    Then a resposta é HTTP 422 com error "PLAN_CREATION_ERROR"
    And nenhum ExecutionPlan é persistido

  Scenario: Plano rejeitado quando excede MAX_STEPS
    Given o LLM retorna plano com 11 steps
    When o operador cria um plano
    Then a resposta é HTTP 422 com error "MAX_STEPS_EXCEEDED"

  # Execução sequencial
  Scenario: Plano com 3 steps sequenciais executa do início ao fim
    Given existe um plano com steps A → B → C (B depende de A, C depende de B)
    When o operador faz POST /v1/plans/:id/execute
    Then step A executa primeiro
    And step B inicia somente após step A completar
    And step C inicia somente após step B completar
    And ao final, plan.status = "completed" e completedSteps = 3

  # Execução paralela
  Scenario: Steps com canRunParallel executam simultaneamente
    Given existe um plano com steps A e B sem dependências e canRunParallel: true
    When o plano executa
    Then A e B iniciam com diferença de menos de 500ms entre si
    And ambos completam antes de qualquer step dependente iniciar

  # Aprovação humana
  Scenario: Step com requiresApproval pausa execução
    Given existe um plano com step X marcado requiresApproval: true
    When o plano alcança o step X
    Then o step fica com status "waiting_approval"
    And o evento WebSocket "plan.step.approval_required" é emitido
    And nenhum step dependente de X inicia

  Scenario: Aprovação libera execução do step
    Given o step X está com status "waiting_approval"
    When o operador faz POST /v1/plans/:id/steps/:stepId/approve
    Then step.approvedBy e step.approvedAt são preenchidos
    And step.status volta para "pending"
    And o step executa normalmente na próxima iteração do loop

  # Rollback
  Scenario: Rollback reverte steps em ordem reversa
    Given um plano com steps A(completed), B(completed), C(running)
    When o operador faz POST /v1/plans/:id/rollback
    Then step C é parado imediatamente
    And step B é revertido (rolled_back)
    And step A é revertido (rolled_back)
    And plan.status = "rolled_back"
    And AuditLog registra os IDs dos steps revertidos

  # Deadlock
  Scenario: Plano entra em deadlock e é marcado como failed
    Given step B depende de step A, mas step A falhou com maxRetries esgotado
    When ExecutePlanUseCase detecta que nenhum step pode avançar
    Then plan.status = "failed"
    And evento WebSocket "plan.deadlock_detected" é emitido
"""

FEATURE_HANDOFF = """Feature: Agent Handoff Protocol
  Background:
    Given o sistema está operacional
    And existe um plano em execução com 2 steps
    And step 1 foi executado pelo agente "researcher" com output { summary: "análise completa" }

  Scenario: HandoffPayload contém contexto completo ao passar para próximo agente
    When step 2 inicia (agente "writer" depende do step 1)
    Then um AgentHandoff é persistido com fromAgentId "researcher" e toAgentId "writer"
    And payload.taskContext.completedSoFar contém o summary do step 1
    And payload.taskContext.currentObjective contém a descrição do step 2
    And payload.relevantMemory.episodicEntries contém IDs de MemoryEntry relevantes
    And payload.continuationInstructions está preenchido

  Scenario: HandoffPayload inclui knowledge chunks relevantes
    Given o agente "writer" tem knowledgeEnabled: true
    When o HandoffPayload é montado para o step 2
    Then payload.relevantMemory.knowledgeChunks contém pelo menos 1 chunk

  Scenario: AgentHandoff é auditado
    When um handoff é criado
    Then um AuditLog é gerado com action "handoff.created"
    And o AuditLog contém planId, stepId, fromAgentId e toAgentId

  Scenario: Listar handoffs de um plano
    Given o plano tem 3 steps completados com handoffs
    When o operador faz GET /v1/plans/:id/handoffs
    Then a resposta contém 3 AgentHandoff ordenados por createdAt

  Scenario: Listar handoffs de um agente específico
    When o operador faz GET /v1/agents/researcher/handoffs
    Then a resposta contém apenas handoffs onde fromAgentId ou toAgentId = "researcher"
"""

# ── GERAÇÃO DO ZIP ───────────────────────────────────────────────────────────

files = {
    'doc/active/MVP11-PRD.md':                        MVP11_PRD,
    'doc/active/Implementation-Plan-MVP11.md':        IMPL_PLAN,
    'doc/active/EDD-MVP11-Planner.md':                EDD,
    'doc/active/evals/mvp11-execution-plan.feature':  FEATURE_PLAN,
    'doc/active/evals/mvp11-agent-handoff.feature':   FEATURE_HANDOFF,
}

zip_path = 'mvp11-docs.zip'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for dest, content in files.items():
        zf.writestr(dest, content)

print(f"ZIP gerado: {os.path.getsize(zip_path):,} bytes")
with zipfile.ZipFile(zip_path) as zf:
    for info in zf.infolist():
        print(f"  {info.filename}  ({info.file_size:,} bytes)")
'''

with open('/root/output/generate_mvp11_docs.py', 'w') as f:
    f.write(script)

print(f"Script gerado: {len(script):,} chars")
print(f"Salvo em: /root/output/generate_mvp11_docs.py")