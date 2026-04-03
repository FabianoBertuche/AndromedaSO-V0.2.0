# MVP10 PRD - Agent Evolution

## Objetivo
Agentes evoluem: versioning, performance, reputation, budget, feedback loop.

## T051 AgentVersion
- snapshot: git commit por agent change
- diff: comparar manifests/versions
- rollback: restore vN → vN-1
- AC: `POST /agents/:id/version/rollback`

## T052 PerformanceRecord
- BullMQ daily job: record latency/success/throughput
- Prisma: PerformanceRecord {agentId, date, latencyP95, successRate}
- AC: `GET /agents/:id/performance`

## T053 ReputationScores
- por capability: score = (successRate * 0.6 + feedback * 0.4)
- Decay: -0.01/semana se inativo
- AC: `GET /agents/:id/reputation` → {capability: score}

## T054 BudgetPolicy
- daily/monthly limits por agent
- Prisma: AgentBudget {agentId, dailyLimit, monthlyLimit, spent}
- Block: if spent > limit → 429
- AC: `POST /agents/:id/budget/set`

## T055 CostDashboard
- React UI: table agents + spent/remaining
- Export CSV, chart monthly trend
- AC: `GET /dashboard/costs` → React page

## T056 TaskFeedback
- thumbs up/down + note após task
- Router usa feedback para score LLM
- AC: `POST /tasks/:id/feedback`

## T057 PlaybookSuggestions
- BullMQ semanal: analisa tasks → sugere playbooks
- AC: `GET /agents/:id/suggestions`

## T058 Evals golden dataset
- 50 tasks fixos para benchmark agents
- AC: `POST /eval/run` → scores

## T059 Tests e2e
- 10 cenários: create agent → task → feedback → budget block
- AC: npm test 50/50

## T060 Docs + Notion
- UPDATE Notion com MVP10
- AC: deployment guide

## Status de Implementacao (2026-04-03)
- T051: concluido - version snapshot/diff/rollback com endpoint de rollback
- T052: concluido - registro e consulta de performance por agente
- T053: concluido - reputacao por capability com formula e decay semanal
- T054: concluido - politica de budget diario/mensal e bloqueio 429
- T055: concluido - dashboard de custos em pagina React + export CSV
- T056: concluido - feedback de tasks integrado ao score de reputacao
- T057: concluido - sugestoes de playbook com refresh semanal simulada
- T058: concluido - eval com golden dataset de 50 tarefas
- T059: concluido - suite e2e com 10 cenarios (fluxo completo)
- T060: concluido - docs atualizadas + guia de deploy MVP10

## Notion Handoff
- Pagina alvo: Product > MVP10 Agent Evolution
- Blocos atualizados:
	- Endpoints implementados (T051-T059)
	- Evidencia de testes: `npm test` com 58/58
	- Riscos conhecidos: logs de fallback PostgreSQL em ambiente local sem credenciais