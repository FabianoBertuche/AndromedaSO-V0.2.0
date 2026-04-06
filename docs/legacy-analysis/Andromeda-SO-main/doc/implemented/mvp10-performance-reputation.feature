# MVP10 — Histórico de Desempenho e Reputação
# Caminho: doc/active/evals/mvp10-performance-reputation.feature

Feature: Histórico de Desempenho e Reputação por Capability

  Background:
    Given o sistema está operacional com BullMQ configurado
    And existem agentes com tasks executadas nos últimos 30 dias

  Scenario: Job diário consolida performance de todos os agentes
    Given o agente "backend-specialist" executou 10 tasks ontem (8 succeeded, 2 failed)
    When o job ConsolidatePerformanceJob executa às 01:00 UTC
    Then um AgentPerformanceRecord é criado com tasksTotal 10, tasksSucceeded 8, tasksFailed 2

  Scenario: Job é idempotente — rodar 2× não duplica registros
    Given já existe um AgentPerformanceRecord para o mesmo agente e period
    When o job executa novamente com os mesmos dados
    Then nenhum novo registro é criado (upsert)

  Scenario: Agente sem tasks no dia não gera registro
    Given o agente "new-agent" não executou nenhuma task ontem
    When o job executa
    Then nenhum AgentPerformanceRecord é criado para "new-agent"

  Scenario: Consultar histórico de desempenho de um agente (30 dias)
    When o operador faz GET /v1/agents/:id/performance?period=30d
    Then a resposta contém lista de registros dos últimos 30 dias ordenada por period decrescente

  Scenario: Reputação calculada corretamente por capability
    Given o agente "researcher" tem para capability "research":
      | successRate 0.90 | avgConformanceScore 0.85 | avgFeedbackScore 0.92 |
    When AgentReputationService.calculate("researcher", "research") é chamado
    Then o score é (0.90 × 0.5) + (0.85 × 0.3) + (0.92 × 0.2) = 0.889
    And reputationScores["research"] é atualizado para 0.889

  Scenario: Reputação só considera dados dos últimos 30 dias
    Given existem tasks de "researcher" de 45 dias atrás
    When a reputação é calculada
    Then as tasks com mais de 30 dias são ignoradas

  Scenario: Reputação recalculada automaticamente após feedback
    Given o agente "auditor" tem reputationScores["audit"] = 0.85
    When um feedback com rating 1 é submetido para task de "auditor" com capability "audit"
    Then AgentReputationService é acionado via evento "feedback.submitted"
    And reputationScores["audit"] é recalculado e persistido

  Scenario: Scores de reputação visíveis na tela do agente
    Given o agente "researcher" tem reputationScores definidos
    When o operador abre o Agent Console para "researcher"
    Then a seção "Reputação por Capability" exibe barras de progresso por capability
    And a data de última atualização é exibida
