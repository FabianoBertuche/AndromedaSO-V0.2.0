Feature: MVP12 - Export/Import de Agentes

  Background:
    Given o sistema Andromeda OS está rodando
    And a API está disponível em "http://localhost:3000"
    And existe tenant "tenant-001" com admin "admin-001"
    And existe agente "agent-exportable" no tenant "tenant-001"

  Scenario: Admin exporta agente com sucesso
    Given estou autenticado como "admin-001"
    When eu faço POST "/v1/agents/agent-exportable/export" com includesVersions true
    Then o status é 200
    And "bundle.id" está presente
    And "bundle.checksum" é uma string SHA-256 válida com 64 hex chars
    And "bundle.downloadUrl" está presente

  Scenario: Download do bundle gerado
    Given existe bundle "bundle-001" exportado para "agent-exportable"
    When eu faço GET "/v1/agents/agent-exportable/bundles/bundle-001/download"
    Then o status é 200
    And o Content-Type é "application/zip"

  Scenario: Bundle contém estrutura obrigatória
    Given o bundle "bundle-001" foi baixado e descomprimido
    Then contém "manifest.json"
    And contém "profile/identity.md"
    And contém "profile/soul.md"
    And contém "profile/rules.md"
    And contém "config.json"
    And "manifest.json" tem campo "schemaVersion" igual a "1.0"

  Scenario: Operador não pode exportar agente
    Given estou autenticado como "operator-001" com role "operator"
    When eu faço POST "/v1/agents/agent-exportable/export"
    Then o status é 403

  Scenario: Admin importa agente com bundle válido
    Given estou autenticado como "admin-001"
    And o bundle "agent-test.andromeda-agent" é válido
    And não existe agente com o mesmo slug no tenant
    When eu faço POST "/v1/agents/import" com o bundle e conflictPolicy "ABORT"
    Then o status é 202
    And após polling "job.status" é "COMPLETED"
    And "job.importedAgentId" está presente
    And o agente importado aparece em GET "/v1/agents"

  Scenario: Import falha com checksum inválido
    Given o arquivo "corrupted.andromeda-agent" tem checksum declarado incorreto
    When eu faço POST "/v1/agents/import" com o arquivo
    Then após polling "job.status" é "FAILED"
    And "job.errorMessage" contém "Checksum mismatch"
    And nenhum agente foi criado

  Scenario: Import falha sem arquivos obrigatórios
    Given o bundle não contém "profile/identity.md"
    When eu faço POST "/v1/agents/import"
    Then após polling "job.status" é "FAILED"
    And "job.errorMessage" contém "Missing required file"

  Scenario: Import é atômico - falha não deixa agente parcial
    Given o banco falha durante a criação do agente
    When o import é executado e falha no meio
    Then "job.status" é "FAILED"
    And nenhum registro parcial do agente existe no banco

  Scenario: Import com slug duplicado e política ABORT
    Given existe agente com slug "analista-dados" no tenant "tenant-001"
    And o bundle contém agente com slug "analista-dados"
    When eu faço POST "/v1/agents/import" com conflictPolicy "ABORT"
    Then após polling "job.status" é "CONFLICT_DETECTED"
    And "job.conflictAgentId" é o id do agente existente
    And nenhum agente novo foi criado

  Scenario: Resolver conflito com RENAME
    Given "job-001" está com status "CONFLICT_DETECTED"
    When eu faço POST "/v1/agents/import/job-001/resolve" com resolution "RENAME"
    Then o status é 200
    And após polling "job.status" é "COMPLETED"
    And o agente importado tem slug com sufixo "-imported"
    And o agente original não foi alterado

  Scenario: Resolver conflito com OVERWRITE
    Given "job-001" está com status "CONFLICT_DETECTED"
    When eu faço POST "/v1/agents/import/job-001/resolve" com resolution "OVERWRITE"
    Then após polling "job.status" é "COMPLETED"
    And o agente existente foi substituído pelos dados do bundle

  Scenario: CLI export de agente
    Given o CLI do Andromeda está instalado
    When eu executo "andromeda agents export agent-exportable --output ./test.andromeda-agent"
    Then o arquivo "test.andromeda-agent" é criado
    And é um ZIP válido contendo "manifest.json"

  Scenario: CLI import sem conflito
    Given o arquivo "agent-test.andromeda-agent" existe e é válido
    When eu executo "andromeda agents import ./agent-test.andromeda-agent --conflict abort"
    Then a saída contém "Import concluído com sucesso"
    And a saída contém o ID do agente criado

  Scenario: CLI import com conflito e flag rename
    Given existe agente com slug igual ao do bundle
    When eu executo "andromeda agents import ./agent-test.andromeda-agent --conflict rename"
    Then a saída contém "Conflito detectado"
    And o agente importado aparece com slug renomeado
