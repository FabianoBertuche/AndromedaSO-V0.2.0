# MVP10 — Versionamento de AgentProfile
# Caminho: doc/active/evals/mvp10-agent-versioning.feature

Feature: Versionamento de AgentProfile

  Background:
    Given o sistema está operacional
    And existe um agente "auditor" com currentVersionNumber 1

  Scenario: Snapshot criado automaticamente ao editar agente
    Given o agente "auditor" está na versão 1
    When o operador atualiza o soul.md do agente via PUT /v1/agents/:id
    Then antes de salvar, um AgentVersion é criado com version 2
    And o snapshot JSON contém o estado anterior completo do agente
    And currentVersionNumber é atualizado para 2

  Scenario: Múltiplas edições geram versões sequenciais
    Given o agente está na versão 3
    When o operador faz 3 edições consecutivas
    Then existem versões 4, 5 e 6 no histórico
    And currentVersionNumber é 6

  Scenario: Edição sem alteração real não gera nova versão
    Given o agente está na versão 5
    When o operador salva o agente sem alterar nenhum campo
    Then nenhuma nova AgentVersion é criada
    And currentVersionNumber permanece 5

  Scenario: Listar histórico de versões de um agente
    Given o agente possui versões 1, 2 e 3
    When o operador faz GET /v1/agents/:id/versions
    Then a resposta contém lista com version, changesSummary, createdBy, createdAt
    And está ordenada por version decrescente

  Scenario: Obter snapshot de versão específica
    When o operador faz GET /v1/agents/:id/versions/2
    Then a resposta contém o snapshot completo do AgentProfile na versão 2

  Scenario: Diff entre duas versões
    Given existem versões 3 e 5 do agente
    When o operador faz GET /v1/agents/:id/versions/3/diff/5
    Then a resposta destaca apenas os campos alterados entre v3 e v5

  Scenario: Restaurar agente para versão anterior
    Given o agente está na versão 5 com conformanceMin 0.90
    And a versão 3 tinha conformanceMin 0.75
    When o operador faz POST /v1/agents/:id/versions/3/restore
    Then o AgentProfile é atualizado com os dados do snapshot da versão 3
    And um novo snapshot é criado (versão 6) com changesSummary "Restaurado para v3"
    And currentVersionNumber é 6

  Scenario: Tentativa de restaurar versão inexistente retorna erro
    When o operador faz POST /v1/agents/:id/versions/999/restore
    Then a resposta é HTTP 404 com error "VERSION_NOT_FOUND"

  Scenario: Rollback bloqueado quando agente tem task em execução
    Given o agente está executando uma task ativa
    When o operador tenta restaurar uma versão anterior
    Then a resposta é HTTP 409 com error "AGENT_BUSY"

  Scenario: Aba History exibe timeline de versões no painel
    Given o agente possui 5 versões
    When o operador abre a aba "History" no Agent Console
    Then cada versão exibe: número, data, changesSummary e botão "Restaurar"
    And a versão atual está destacada como "Atual"
