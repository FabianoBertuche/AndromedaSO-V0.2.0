# Implementation Plan — MVP11

## Fase 1 — Migrations

```bash
cd packages/api
npx prisma migrate dev --name mvp11_planner
npx prisma generate
Adicionar ao schema.prisma: modelos ExecutionPlan, PlanStep, AgentHandoff (schemas no PRD Blocos A, B, C).

Critério: migrate sem erros, 3 novas tabelas no prisma studio.

Fase 2 — Domain Puro
text
packages/api/src/modules/planner/domain/
  execution-plan.ts
  plan-step.ts
  task-graph.ts      ← implementação completa no PRD Bloco E
  handoff-payload.ts ← interface no PRD Bloco C2
  ports.ts
  errors.ts
typescript
// errors.ts
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
Testes unitários obrigatórios:

text
task-graph.spec.ts
  ✓ getReadySteps retorna apenas steps com dependências satisfeitas
  ✓ validateNoCycles lança CyclicDependencyError
  ✓ getParallelGroups separa paralelos de sequenciais
  ✓ isDeadlocked retorna true quando nenhum step pode avançar
  ✓ isDeadlocked retorna false quando todos completed
Critério: vitest run planner/domain — 100% passando.

Fase 3 — CreateExecutionPlanUseCase
typescript
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
    const agents = await this.agentRepo.findByTenant(input.tenantId)
    if (agents.length === 0) throw new PlanCreationError('Nenhum agente disponível')

    const prompt = buildPlannerPrompt(input.goal, agents) // prompt no PRD Bloco G

    const raw = await this.llmRouter.complete({
      prompt,
      capability: 'planning',
      tenantId: input.tenantId,
      agentId: 'planner-system',
    })

    let planData: PlannerLlmResponse
    try {
      planData = JSON.parse(raw.content)
    } catch {
      throw new PlanCreationError('LLM retornou JSON inválido')
    }

    const maxSteps = Number(process.env.PLANNER_MAX_STEPS ?? 10)
    if (planData.steps.length > maxSteps) throw new MaxStepsExceededError()

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

    const steps = await this.stepRepo.createMany(
      planData.steps.map(s => ({ ...s, planId: plan.id, tenantId: input.tenantId }))
    )

    new TaskGraph(steps).validateNoCycles()
    await this.auditService.log('plan.created', plan.id, input.requestedBy)
    return plan
  }
}
API:

text
POST /v1/plans
Body:     { taskId, goal }
201:      { planId, title, totalSteps, status, steps[] }
422:      { error: "PLAN_CREATION_ERROR" | "MAX_STEPS_EXCEEDED" }
Critério: POST /v1/plans retorna plano com steps estruturados.

Fase 4 — ExecutePlanUseCase (sequencial)
typescript
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
        await this.stepRepo.updateStatus(step.id, 'running')
        await this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
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
ExecutePlanStepJob (BullMQ):

text
1. Verifica budget via CheckBudgetBeforeExecutionUseCase
2. Monta HandoffPayload (memória + knowledge + resultados anteriores)
3. Persiste AgentHandoff com status: accepted
4. Chama ExecuteTaskUseCase com agentId do step
5. Salva output em step.output
6. step.status = completed
7. Emite WebSocket: plan.step.completed
Em falha: retryCount < maxRetries → BullMQ retry | esgotado → step.status = failed
Critério: plano com 3 steps sequenciais completa do início ao fim.

Fase 5 — AgentHandoff
typescript
// Dentro do ExecutePlanStepJob — montagem do HandoffPayload:

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
    completedSoFar: completedSteps.map(s => s.output?.summary ?? '').join('\n'),
    currentObjective: step.description ?? '',
    constraints: (step.continuationInstructions ?? '').split('\n'),
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
Critério: AgentHandoff persistido com payload completo.

Fase 6 — Execução Paralela
typescript
// Substituir loop for por:
const [parallel, sequential] = graph.getParallelGroups()
const maxParallel = Number(process.env.PLANNER_MAX_PARALLEL_STEPS ?? 4)

await Promise.all(
  parallel.slice(0, maxParallel).map(step => {
    this.stepRepo.updateStatus(step.id, 'running')
    return this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
  })
)

for (const step of sequential) {
  await this.stepRepo.updateStatus(step.id, 'running')
  await this.queue.add('execute-plan-step', { planId, stepId: step.id, tenantId })
  await this.waitForStep(step.id)
}
Critério: 2 steps canRunParallel iniciam com menos de 500ms de diferença (verificar startedAt).

Fase 7 — Aprovação Humana
text
Step.requiresApproval = true
  → status: waiting_approval
  → WebSocket: plan.step.approval_required { planId, stepId }
  → UI exibe modal com descrição do step

POST /v1/plans/:id/steps/:stepId/approve
  → ApprovePlanStepUseCase:
      step.approvedBy = userId
      step.approvedAt = now()
      step.status = pending
  → ExecutePlanUseCase retoma

Timeout (PLANNER_APPROVAL_TIMEOUT_HOURS):
  → MonitorPlanJob emite plan.step.approval_timeout
Critério: step para, botão no painel aprova, execução retoma automaticamente.

Fase 8 — Rollback Parcial
typescript
export class RollbackPlanUseCase {
  async execute(planId: string, requestedBy: string): Promise<void> {
    const steps = await this.stepRepo.findByPlanId(planId)

    // Para steps running
    for (const step of steps.filter(s => s.status === 'running')) {
      await this.queue.removeJobs(`execute-plan-step:${step.id}`)
      await this.stepRepo.updateStatus(step.id, 'rolled_back')
    }

    // Reverte completed em ordem reversa
    const completed = steps
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.stepIndex - a.stepIndex)

    const rolledBack: string[] = []
    for (const step of completed) {
      if (step.rollbackAction) await this.executeRollbackAction(step)
      await this.stepRepo.updateStatus(step.id, 'rolled_back')
      rolledBack.push(step.id)
    }

    await this.planRepo.updateStatus(planId, 'rolled_back')
    await this.auditService.log('plan.rolled_back', planId, requestedBy, { rolledBack })
    this.eventEmitter.emit('plan.rolled_back', { planId, rolledBack })
  }
}
Critério: POST /v1/plans/:id/rollback — steps revertidos em ordem reversa + AuditLog.

Fase 9 — UI: Aba Plans
Componentes em apps/web/src/components/plans/:

text
PlanList.tsx           lista de planos com status e progresso
PlanDetail.tsx         detalhe de 1 plano
PlanStepGraph.tsx      grafo de steps e dependências
PlanStepCard.tsx       card de 1 step com status, agente, tempo
PlanApprovalModal.tsx  modal de aprovação
PlanRollbackModal.tsx  modal de rollback
Status visual:

text
⏳ pending           cinza
🔒 waiting_approval  amarelo + botão "Aprovar"
⟳  running           azul animado
✓  completed         verde
✗  failed            vermelho + botão "Retry"
↩  rolled_back       laranja
WebSocket events consumidos:

text
plan.step.completed          → atualiza card
plan.step.failed             → exibe erro + retry
plan.step.approval_required  → exibe modal
plan.completed               → banner sucesso
plan.failed                  → banner erro
plan.rolled_back             → banner rollback
plan.deadlock_detected       → alerta crítico
Critério: steps se atualizam em tempo real via WebSocket.

Fase 10 — Testes
text
planner/domain/task-graph.spec.ts                     5 casos
planner/application/CreateExecutionPlanUseCase.spec.ts 4 casos
planner/application/ExecutePlanUseCase.spec.ts         4 casos
planner/application/RollbackPlanUseCase.spec.ts        3 casos
Integração e2e:

text
POST /v1/plans → plano com 3 steps
POST /v1/plans/:id/execute
GET  /v1/plans/:id → running
GET  /v1/plans/:id/handoffs → payload completo
→ status: completed
Regressão: vitest run — zero falhas em MVP01–MVP10.

Regras Obrigatórias
tenantId em todas as entidades novas

deletedAt (soft delete) em todas as entidades novas

Nenhuma lógica de negócio no controller

Python apenas para cognição — orquestração 100% TypeScript

Budget verificado antes de cada step individualmente

AuditLog em: criação, handoff, aprovação, rollback

WebSocket em cada mudança de status

Rollback é best-effort — AuditLog registra o que foi/não foi revertido
