Feature: Criação e Execução de Planos
  Background:
    Given o sistema está operacional com MVP10 concluído
    And existem agentes disponíveis: researcher, backend-specialist, writer, auditor

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

  Scenario: Plano com 3 steps sequenciais executa do início ao fim
    Given existe um plano com steps A → B → C (B depende de A, C depende de B)
    When o operador faz POST /v1/plans/:id/execute
    Then step A executa primeiro
    And step B inicia somente após step A completar
    And step C inicia somente após step B completar
    And ao final plan.status = "completed" e completedSteps = 3

  Scenario: Steps com canRunParallel executam simultaneamente
    Given existe um plano com steps A e B sem dependências e canRunParallel: true
    When o plano executa
    Then A e B iniciam com diferença de menos de 500ms entre si
    And ambos completam antes de qualquer step dependente iniciar

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
    And o step executa normalmente na próxima iteração

  Scenario: Rollback reverte steps em ordem reversa
    Given um plano com steps A(completed) B(completed) C(running)
    When o operador faz POST /v1/plans/:id/rollback
    Then step C é parado imediatamente
    And step B é revertido (rolled_back)
    And step A é revertido (rolled_back)
    And plan.status = "rolled_back"
    And AuditLog registra os IDs dos steps revertidos

  Scenario: Plano entra em deadlock e é marcado como failed
    Given step B depende de step A mas step A falhou com maxRetries esgotado
    When ExecutePlanUseCase detecta que nenhum step pode avançar
    Then plan.status = "failed"
    And evento WebSocket "plan.deadlock_detected" é emitido