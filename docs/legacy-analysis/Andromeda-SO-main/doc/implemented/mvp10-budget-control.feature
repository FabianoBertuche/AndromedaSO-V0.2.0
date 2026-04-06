# MVP10 — Budget Control
# Caminho: doc/active/evals/mvp10-budget-control.feature

Feature: Budget Control por Agente

  Background:
    Given o sistema está operacional com MVP09 concluído
    And existe um agente "backend-specialist" com tenantId "default"
    And o agente possui uma AgentBudgetPolicy configurada

  Scenario: Configurar limite diário para um agente
    Given o agente não possui budget policy
    When o operador faz PUT /v1/agents/:id/budget com dailyLimitUsd 1.00, warningThresholdPct 0.8, hardStop true
    Then a policy é criada com status 201
    And currentDailySpend é 0.00
    And resetAt é definido para meia-noite UTC do dia seguinte

  Scenario: Execução aprovada quando dentro do limite
    Given o agente possui dailyLimitUsd 1.00 e currentDailySpend 0.50
    And o custo estimado da task é 0.20
    When ExecuteTaskUseCase é chamado para o agente
    Then CheckBudgetBeforeExecutionUseCase retorna "approved"
    And a task é executada normalmente

  Scenario: Warning emitido ao atingir threshold
    Given o agente possui dailyLimitUsd 1.00, warningThresholdPct 0.8
    And currentDailySpend é 0.75 e custo estimado 0.10
    When ExecuteTaskUseCase é chamado
    Then o evento "budget.warning" é emitido com percentual 85%
    And a task é executada normalmente

  Scenario: Execução bloqueada por hardStop ao atingir limite diário
    Given o agente possui dailyLimitUsd 1.00 e hardStop true
    And currentDailySpend é 0.95 e custo estimado 0.10
    When ExecuteTaskUseCase é chamado
    Then CheckBudgetBeforeExecutionUseCase lança BudgetExceededError
    And o controller retorna HTTP 402 com error "BUDGET_EXCEEDED"
    And nenhuma chamada LLM é feita

  Scenario: Execução permitida quando hardStop é false e limite atingido
    Given o agente possui dailyLimitUsd 1.00 e hardStop false
    And currentDailySpend é 1.05
    When ExecuteTaskUseCase é chamado
    Then a task é executada normalmente
    And o evento "budget.exceeded_soft" é emitido

  Scenario: Execução sem policy de budget não é bloqueada
    Given o agente não possui AgentBudgetPolicy
    When ExecuteTaskUseCase é chamado
    Then a task é executada normalmente

  Scenario: Custo real registrado após execução bem-sucedida
    Given o agente possui policy com currentDailySpend 0.50
    When uma task é executada com custo real de 0.032 USD
    Then currentDailySpend é incrementado para 0.532
    And currentMonthlySpend também é incrementado

  Scenario: Falha no RecordSpend não cancela a task concluída
    Given uma task foi executada com sucesso
    When RecordSpendUseCase falha por erro de banco
    Then a task permanece com status "completed"
    And o erro é registrado em DLQ para reprocessamento

  Scenario: Job diário reseta currentDailySpend de todos os agentes
    Given existem 5 agentes com currentDailySpend > 0
    When o job ResetDailyBudgetJob executa às 00:00 UTC
    Then todos os agentes têm currentDailySpend resetado para 0.00
    And o job é idempotente (rodar 2× não causa efeito duplo)

  Scenario: Obter relatório de gastos por agente no mês
    Given existem 3 agentes com gastos em março/2026
    When o operador faz GET /v1/budget/report?period=month
    Then a resposta contém agentes com totalCostUsd, tasksExecuted, avgCostPerTask
    And está ordenada por totalCostUsd decrescente

  Scenario: Exportar relatório como CSV
    When o operador faz POST /v1/budget/report/export com period=month e format=csv
    Then o response tem Content-Type text/csv
    And o arquivo contém cabeçalho: agentId,agentName,totalCostUsd,tasksExecuted,period
