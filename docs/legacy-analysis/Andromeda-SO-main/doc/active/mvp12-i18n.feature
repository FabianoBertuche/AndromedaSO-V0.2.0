Feature: MVP12 - i18n Nativa PT-BR / EN-US

  Background:
    Given o sistema Andromeda OS está rodando
    And a API está disponível em "http://localhost:3000"
    And o Python cognitive service está disponível em "http://localhost:8000"
    And existem locales registrados: "pt-BR" e "en-US"

  Scenario: Listar locales disponíveis
    When eu faço GET "/v1/i18n/locales"
    Then o status é 200
    And a resposta contém locale com code "pt-BR" e isDefault true
    And a resposta contém locale com code "en-US"

  Scenario: Obter mensagens do sistema em PT-BR
    When eu faço GET "/v1/i18n/messages?locale=pt-BR&category=system"
    Then o status é 200
    And a resposta contém mensagem com key "task.created" em português
    And a resposta contém mensagem com key "task.failed" em português

  Scenario: Fallback para EN-US quando tradução PT-BR não existe
    Given existe mensagem com key "feature.experimental" apenas em "en-US"
    When o sistema tenta obter key "feature.experimental" no locale "pt-BR"
    Then retorna o valor em "en-US"
    And não retorna erro

  Scenario: Atualizar preferência de locale do usuário
    Given estou autenticado como usuário "user-001"
    When eu faço PUT "/v1/users/me/preferences" com preferredLocale "en-US"
    Then o status é 200
    And "preferences.preferredLocale" é "en-US"

  Scenario: Preferência de locale persiste entre sessões
    Given o usuário "user-001" tem preferredLocale "en-US"
    When eu faço GET "/v1/users/me/preferences"
    Then "preferredLocale" é "en-US"

  Scenario: Criar agente com locale preferido
    Given estou autenticado como admin do tenant "tenant-001"
    When eu crio agente com name "Agente Pesquisador" e preferredLocale "pt-BR" e fallbackLocale "en-US"
    Then o status é 201
    And "agent.preferredLocale" é "pt-BR"
    And "agent.fallbackLocale" é "en-US"

  Scenario: Atualizar locale de agente existente
    Given existe agente "agent-001" com preferredLocale "en-US"
    When eu faço PATCH "/v1/agents/agent-001" com preferredLocale "pt-BR"
    Then o status é 200
    And "agent.preferredLocale" é "pt-BR"

  Scenario: Detectar idioma de texto em português
    When eu faço POST "/language/detect" no Python service com text "O sistema de agentes está funcionando corretamente"
    Then o status é 200
    And "lang_code" é "pt"
    And "locale" é "pt-BR"
    And "confidence" é maior que 0.8
    And "fallback" é false

  Scenario: Detectar idioma de texto em inglês
    When eu faço POST "/language/detect" no Python service com text "The agent system is working correctly"
    Then o status é 200
    And "lang_code" é "en"
    And "locale" é "en-US"

  Scenario: Fallback para EN-US quando texto é muito curto
    When eu faço POST "/language/detect" no Python service com text "OK" e min_confidence 0.8
    Then o status é 200
    And "fallback" é true
    And "locale" é "en-US"

  Scenario: Documento ingerido tem idioma detectado automaticamente
    Given existe coleção "col-001" no tenant "tenant-001"
    When eu faço upload de documento com texto em português para "col-001"
    Then o status é 201
    And o documento salvo tem "detectedLang" igual a "pt"
    And o documento salvo tem "detectedLocale" igual a "pt-BR"
    And o documento salvo tem "langConfidence" maior que 0.8

  Scenario: Retrieval prioriza chunks no idioma do agente
    Given existe agente "agent-pt" com preferredLocale "pt-BR"
    And existem chunks em PT-BR e EN-US na mesma coleção
    When "agent-pt" faz retrieval com lang_filter "pt"
    Then os chunks retornados são majoritariamente em "pt"
