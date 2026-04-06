# MVP10 — Feedback do Usuário
# Caminho: doc/active/evals/mvp10-feedback.feature

Feature: Feedback do Usuário sobre Resultados de Tasks

  Background:
    Given o sistema está operacional
    And existe um usuário autenticado "operador-1"
    And existe uma task concluída "task-abc" executada pelo agente "researcher"

  Scenario: Usuário submete thumbs up após task concluída
    When o operador faz POST /v1/tasks/task-abc/feedback com rating 5
    Then o TaskFeedback é persistido com rating 5
    And o evento "feedback.submitted" é emitido
    And a resposta é HTTP 201 com feedbackId

  Scenario: Usuário submete thumbs down com nota
    When o operador faz POST /v1/tasks/task-abc/feedback com rating 1 e note "Resposta incompleta"
    Then o TaskFeedback é persistido com rating 1 e a nota

  Scenario: Feedback duplicado retorna erro
    Given já existe um TaskFeedback para "task-abc" do "operador-1"
    When o operador tenta submeter feedback novamente
    Then a resposta é HTTP 409 com error "FEEDBACK_ALREADY_SUBMITTED"

  Scenario: Feedback em task em execução retorna erro
    Given a task "task-xyz" está com status "running"
    When o operador tenta submeter feedback para "task-xyz"
    Then a resposta é HTTP 422 com error "TASK_NOT_COMPLETED"

  Scenario: Feedback negativo reduz score do modelo usado na task
    Given a task "task-abc" usou o modelo "gpt-4o" com capability "research"
    And o score atual de "gpt-4o" para "research" é 0.88
    When o usuário submete feedback com rating 1
    Then LlmRouterScoreService recalcula o score de "gpt-4o" para "research"
    And o novo score é menor que 0.88

  Scenario: Feedback positivo mantém ou aumenta score do modelo
    Given o score atual de "claude-3-5-sonnet" para "audit" é 0.91
    When o usuário submete feedback com rating 5
    Then o score de "claude-3-5-sonnet" para "audit" permanece >= 0.91

  Scenario: Feedback alimenta reputação do agente por capability
    Given o agente "researcher" tem reputationScore para "research" de 0.80
    When 5 feedbacks positivos são submetidos para tasks de "researcher"
    Then o reputationScore para "research" é >= 0.80 após recálculo

  Scenario: Botões de feedback aparecem após task concluída no painel
    Given a task "task-abc" tem status "completed"
    When o operador visualiza a task card
    Then os botões 👍 e 👎 estão visíveis abaixo do resultado

  Scenario: Após submeter feedback botões são substituídos por confirmação
    When o operador clica em 👍 na task card
    Then os botões somem e aparece "✅ Obrigado pelo feedback"
    And não é possível submeter feedback novamente para essa task
