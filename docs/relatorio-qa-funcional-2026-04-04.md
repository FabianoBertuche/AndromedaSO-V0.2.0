# Relatorio de Validacao Funcional - 2026-04-04

## Objetivo
Executar validacao funcional do sistema com servicos locais ativos e identificar tudo que precisa ser corrigido.

## Ambiente Validado
- OS: Windows
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Docker infra: ja ativo (conforme orientacao)

## Escopo de Validacao
- Leitura completa da documentacao de fluxo e arquitetura.
- Mapeamento de telas, componentes e controles do frontend.
- Smoke tests de endpoints usados por cada controle.
- Execucao de suites de teste frontend e backend.

## Limitacao de Execucao
Nao foi possivel realizar clique automatizado real no navegador integrado pela ferramenta atual (sem automacao de interacao habilitada para click/typing). Para mitigar, a validacao foi feita por:
- cobertura dos endpoints acionados pelos controles
- leitura de implementacao de cada controle
- execucao de testes automatizados existentes

## Resultado Executivo
- Frontend: base funcional e testes passando (56/56), mas com bugs de navegacao e controles com logica incompleta.
- Backend: principais rotas respondendo, porem com falhas criticas em discover parcial, ranking/inferencia sem pre-condicao e autenticacao inexistente para a change login-system.
- Testes backend: 3 falhas atuais na camada de repository factory (mock construtor).

---

## Matriz por Tela e Controles

### Dashboard
1. Kernel Runtime / StatusCard
- Controle: consulta periodica de status
- Endpoint: GET /status
- Resultado: OK (200)

2. Module Discover
- Controle: botao Discover
- Endpoint: POST /api/modules/discover
- Resultado:
  - OK ao usar raiz modules completa (count=5)
  - FALHA 500 ao usar subpastas (ex.: modules/channels)
- Impacto: comportamento inconsistente dependendo do caminho informado.

3. Agent Table
- Controles: listagem, detalhe em modal, abertura feedback
- Endpoints: GET /api/modules, GET /agents/:id/performance, GET /agents/:id/reputation, GET /agents/:id/budget
- Resultado: OK (200)

4. Cost Dashboard
- Controles: grafico/tabela + export CSV
- Endpoint: GET /dashboard/costs/data (fallback de /dashboard/costs)
- Resultado: OK (200)
- Observacao: sem dados reais no momento (agents/trend vazios), mas renderiza.

5. Orchestrator (na dashboard e aba propria)
- Controles: criar tarefa, ver status, enviar mensagem
- Endpoints: POST /tasks/multi, GET /tasks/:id/orchestration, GET /orchestrator/status, POST /agents/:id/message
- Resultado: OK (200)

### Aba Agents
- Reusa AgentTable
- Resultado: OK conforme endpoints acima.

### Aba Costs
- Reusa CostDashboard
- Resultado: OK.

### Aba Models
1. Add Provider
- Endpoint: POST /api/providers
- Resultado: OK (201)

2. Test Health
- Endpoint: GET /api/providers/:id/health
- Resultado: OK (200)

3. Sync Models
- Endpoint: POST /api/providers/:id/sync
- Resultado: OK (200)

4. Catalog / Save Selected
- Endpoints: GET /api/providers/:id/models, POST /api/providers/:id/models/select
- Resultado: OK (200)

5. Delete Provider
- Endpoint: DELETE /api/providers/:id
- Resultado: OK no fluxo com providerId valido.

### Aba Router Intelligence
1. Cards de ranking
- Endpoint: GET /api/llm-router/rankings
- Resultado: FALHA 500 em cenario sem pre-condicoes adequadas.

2. LLM Testbed (Run Routing Decision)
- Endpoint: POST /api/llm-router/infer
- Resultado: FALHA 400 quando nao ha modelos selecionados/estado minimo.

3. Benchmark Lab
- Endpoints: POST /api/llm-router/benchmark, GET /api/providers/*/models
- Resultado: depende de modelo disponivel no catalog; funciona quando ha modelId valido.

4. Routing History
- Endpoint: GET /api/llm-router/decisions
- Resultado: OK (200)

### Rota OAuth Callback
- Tela: /oauth/callback
- Fluxo atual tenta criar provider e redireciona para /providers
- Resultado: problema de navegacao (rota /providers nao existe no roteamento atual).

---

## Achados Priorizados

## P0 - Critico
1. Autenticacao da change login-system nao implementada
- Evidencia:
  - POST /auth/login -> 404
  - GET /auth/session -> 404
  - POST /auth/logout -> 404
- Impacto:
  - Objetivo principal da change nao entregue.
  - Rotas protegidas e sessao autenticada inexistentes.
- Referencias:
  - openspec/changes/login-system/tasks.md
  - openspec/changes/login-system/specs/user-authentication/spec.md
  - core/kernel/src/server.ts

2. Router Intelligence quebra em estado inicial
- Evidencia:
  - GET /api/llm-router/rankings -> 500
  - POST /api/llm-router/infer -> 400
- Impacto:
  - Tela Router apresenta erro para usuario sem onboarding de modelos.
- Referencias:
  - frontend/src/pages/RouterIntelligence.tsx
  - core/kernel/src/modules/providers/routes/providerRoutes.ts

## P1 - Alto
3. Discover com comportamento inconsistente por caminho
- Evidencia:
  - rootPath=.../modules -> OK
  - rootPath=.../modules/channels -> 500
- Impacto:
  - Ferramenta de discovery nao confiavel para operacao seletiva.
- Referencias:
  - frontend/src/components/ModuleDiscover.tsx
  - core/kernel/src/api/moduleRoutes.ts
  - core/kernel/src/discovery/fsDiscovery.ts

4. Callback OAuth redireciona para rota inexistente
- Evidencia:
  - navigate('/providers') em app que usa tabs internas e wildcard route.
- Impacto:
  - Usuario conclui OAuth e cai em tela incorreta/sem fluxo esperado.
- Referencias:
  - frontend/src/pages/OAuthCallbackHandler.tsx
  - frontend/src/App.tsx

5. Path padrao de discover escrito com barras invertidas sem escape seguro
- Evidencia:
  - string literal com C:\... em frontend pode degradar o valor final no browser.
- Impacto:
  - Botao Discover pode enviar rootPath invalido por padrao.
- Referencia:
  - frontend/src/App.tsx

## P2 - Medio
6. LLMTestbed captura provider selecionado, mas nao usa no infer
- Evidencia:
  - estado providerId nao participa da chamada onInfer.
- Impacto:
  - UX confusa: selector parece funcional, mas nao altera decisao.
- Referencia:
  - frontend/src/components/LLMTestbed.tsx

7. Suite backend com 3 falhas em property tests de repository factory
- Evidencia:
  - TypeError: mock usado como construtor em provider.repository.factory.property.test.ts
- Impacto:
  - risco de regressao em estrategia de repositorio (postgres/memory)
- Referencias:
  - core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.factory.property.test.ts
  - core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.factory.ts

8. Logs recorrentes de lifecycle_events inexistente durante testes
- Evidencia:
  - relation lifecycle_events does not exist (multiplas ocorrencias)
- Impacto:
  - ruido operacional e possivel lacuna de migration em ambientes de teste.
- Referencias:
  - core/kernel (saida de testes)

---

## Recomendacoes de Correcao (ordem sugerida)
1. Implementar integralmente login-system (backend + frontend) conforme spec/tasks.
2. Proteger Router Intelligence com tratamento de estado vazio:
- nao chamar rankings/infer sem catalogo selecionado
- mostrar estado vazio orientativo
- retornar fallback coerente no backend em vez de 500
3. Corrigir Module Discover para subpastas:
- tratar erros sem 500 generico
- validar rootPath e retornar erro descritivo
4. Ajustar redirecionamento OAuth callback para rota existente (ou migrar para rotas reais por pagina).
5. Corrigir string de defaultRootPath usando escape seguro/forward slash.
6. Ajustar LLMTestbed para usar provider selecionado no algoritmo ou remover seletor.
7. Corrigir property tests de repository factory (mocks de classe construtora).
8. Revisar migrations/boot de teste para lifecycle_events.

## Critérios de Saida para Re-teste
- Auth endpoints existentes e retornando contratos esperados (200/401 corretos).
- Router rankings/infer sem erro 500/400 no estado inicial da UI.
- Discover funcionando para raiz e subpastas (sem 500).
- OAuth callback finalizando e levando usuario para area correta.
- Backend test suite sem as 3 falhas atuais.

## Evidencias de Teste Executado
- frontend: vitest run -> 5 arquivos, 56 testes, 100% pass
- backend: vitest run -> 42 arquivos, 251 testes, 3 falhas
- smoke API manual: status, modules, orchestrator, providers, router, auth
