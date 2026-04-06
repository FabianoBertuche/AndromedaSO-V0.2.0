# MVP10 — Lições Aprendidas e Sugestões de Playbook
# Caminho: doc/active/evals/mvp10-playbook-suggestions.feature

Feature: Consolidação de Lições Aprendidas em Sugestões de Playbook

  Background:
    Given o sistema está operacional com cognitive-python disponível
    And o agente "backend-specialist" possui episódios de memória das últimas 2 semanas

  Scenario: Job semanal gera sugestões via Python
    Given o agente tem 12 episódios episódicos relevantes
    When o job LearnFromEpisodesJob executa no domingo às 02:00 UTC
    Then o job faz POST /evolution/analyze-episodes no cognitive-python
    And persiste sugestões com confidence >= 0.7 como PlaybookSuggestion status "pending"

  Scenario: Sugestões de baixa confiança são filtradas
    Given o cognitive-python retorna 3 sugestões com confidence 0.85, 0.65, 0.72
    When o job processa as sugestões
    Then apenas 2 PlaybookSuggestions são criadas (confidence >= 0.7)

  Scenario: Falha no cognitive-python vai para DLQ e não bloqueia outros agentes
    Given o cognitive-python retorna erro 500 para o agente "researcher"
    When o job executa para múltiplos agentes
    Then o job falha apenas para "researcher" e vai para DLQ
    And os demais agentes são processados normalmente

  Scenario: Operador aprova sugestão — conteúdo adicionado ao playbook
    Given existe PlaybookSuggestion com status "pending"
    When o operador faz POST /v1/agents/:id/playbook-suggestions/:sid/approve
    Then o status muda para "approved"
    And o conteúdo é adicionado ao playbook.md do agente
    And um AgentVersion snapshot é criado automaticamente

  Scenario: Operador rejeita sugestão
    When o operador faz POST /v1/agents/:id/playbook-suggestions/:sid/reject
    Then o status muda para "rejected"
    And o playbook.md não é alterado

  Scenario: Sugestão nunca aplicada automaticamente sem aprovação
    Given existem sugestões com status "pending" há 7 dias
    When qualquer processo é executado
    Then nenhuma sugestão com status "pending" é aplicada ao playbook

  Scenario: Aba Suggestions exibe sugestões pendentes no Agent Console
    Given o agente tem 2 sugestões pendentes e 1 aprovada
    When o operador abre a aba "Suggestions"
    Then as 2 pendentes aparecem com botões [✅ Aprovar] e [❌ Rejeitar]
    And a sugestão aprovada aparece na seção "Histórico" com badge verde
