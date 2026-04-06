# EDD — MVP11: Planner, Multi-step Orchestration & Agent Handoff

**Data:** 24/03/2026

---

## Contexto

Com MVP10, o Andromeda tem agentes que evoluem, custos controlados e feedback humano. O MVP11 resolve tarefas que não cabem em uma única chamada LLM — múltiplos especialistas, múltiplos passos, com dependências rastreáveis.

Três primitivos:

1. **ExecutionPlan** — representação formal com steps e dependências
2. **TaskGraph** — motor DAG que decide o que executa quando
3. **HandoffPayload** — contrato formal de transferência de contexto

---

## ADR-001: PlannerAgent como UseCase, não Agente LLM

**Decisão:** LLM usado apenas para gerar o JSON do plano (1 chamada). Toda orquestração é TypeScript puro.

**Justificativa:** Orquestração determinística não deve depender de LLM em runtime. Facilita testes unitários.

**Trade-off:** Plano estático após criação. Replanejamento dinâmico → MVP18.

---

## ADR-002: dependsOn como String[]

**Decisão:** String[] no PostgreSQL, não tabela relacional.

**Justificativa:** Simples, eficiente para máx 10 steps. TaskGraph resolvido em memória.

---

## ADR-003: HandoffPayload como Json

**Decisão:** JSONB no Postgres, não campos relacionais.

**Justificativa:** Estrutura variável por tipo de tarefa. Leitura sempre por handoffId — O(1).

---

## ADR-004: Execução paralela via BullMQ, não Promise.all

**Decisão:** BullMQ para steps paralelos.

**Justificativa:** Garante retry, DLQ e rastreabilidade em caso de crash. Consistente com MVP09.

---

## ADR-005: Rollback best-effort, não transacional

**Decisão:** Reverte em ordem reversa, sem garantia de atomicidade total.

**Justificativa:** Steps podem ter efeitos externos irreversíveis. Sistema é auditável — operador sabe exatamente o estado após rollback.

---

## Fluxo Completo

POST /v1/plans { taskId, goal }
→ CreateExecutionPlanUseCase
→ LLM gera JSON (1 chamada)
→ Persiste ExecutionPlan + PlanSteps
→ TaskGraph.validateNoCycles()

POST /v1/plans/:id/execute
→ ExecutePlanUseCase — loop principal
→ TaskGraph.getReadySteps()
→ BullMQ (paralelo ou sequencial)

ExecutePlanStepJob (worker)
→ CheckBudget
→ MemoryService.retrieveForContext()
→ KnowledgeRetrievalService.retrieve()
→ HandoffPayload montado + AgentHandoff persistido
→ ExecuteTaskUseCase (agente do step)
→ step.status = completed
→ WebSocket: plan.step.completed

Todos completed → plan.status = completed → WebSocket: plan.completed

text

---

## Riscos e Mitigações

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| LLM retorna JSON inválido | Média | Alto | try/catch + retry 3x |
| LLM gera ciclo no grafo | Baixa | Alto | validateNoCycles() antes de persistir |
| Step trava em running | Média | Médio | MonitorPlanJob a cada 5min |
| Aprovação pendente indefinidamente | Baixa | Médio | Timeout + evento de escalação |
| BullMQ worker crash | Baixa | Alto | retry + DLQ (MVP09) + retryCount |

---

## Módulos Afetados

| Módulo | O que muda |
|---|---|
| ExecuteTaskUseCase | Detecta complexidade → oferece criar plano |
| MemoryService | retrieveForContext() ao montar HandoffPayload |
| KnowledgeRetrievalService | retrieve() ao montar HandoffPayload |
| CheckBudgetBeforeExecutionUseCase | Chamado por cada PlanStep |
| AuditService | Novos eventos: plan.created, handoff.created, plan.rolled_back |
| GatewayService (WebSocket) | Novos eventos: plan.step.*, plan.* |
