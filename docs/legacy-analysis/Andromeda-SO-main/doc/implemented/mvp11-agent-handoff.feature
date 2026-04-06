Feature: Agent Handoff Protocol
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