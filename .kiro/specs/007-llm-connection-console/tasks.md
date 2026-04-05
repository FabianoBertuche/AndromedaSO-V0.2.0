# Plano de Implementação — 007-llm-connection-console

## Ordem obrigatória

Executar nesta sequência: **contratos → testes backend (falhando) → implementação backend → testes frontend (falhando) → implementação frontend → verificação final**.

## Tarefas

- [x] 1. Consolidar contratos da console LLM antes da implementação
  - Definir os schemas `provider-variant-catalog.contract.json`, `provider-connection-test.contract.json`, `provider-console-save.contract.json` e `provider-health.contract.json`
  - Garantir distinção explícita entre `openai-api`, `openai-oauth` e `ollama`
  - Representar group, variant, auth mode, required fields, optional fields, health e payloads de erro estruturado
  - _Rastreia: Req. 1, 3, 4, 7, 8_

- [x] 2. Escrever testes unitários backend para catálogo de variantes antes da implementação
  - Cobrir leitura baseada em manifest/registry
  - Cobrir filtro v1 apenas para `ollama`, `openai-api`, `openai-oauth`
  - Cobrir preservação dos nomes de variante do manifesto na resposta
  - _Rastreia: Req. 1; EC-01, EC-02_

- [x] 3. Escrever testes unitários backend para teste de conexão antes da implementação
  - Validar `openai-api` com `apiKey` obrigatório e `organization` opcional
  - Validar `openai-oauth` sem segredo bruto, usando metadados/inputs do fluxo manual
  - Validar `ollama` com `baseUrl` obrigatório
  - Garantir que falha de teste não persiste provider
  - _Rastreia: Req. 3, 4, 7; EC-03, EC-04, EC-05_

- [x] 4. Escrever testes HTTP backend para os endpoints novos antes da implementação
  - `GET /api/providers/variants` retorna catálogo orientado por manifest
  - `POST /api/providers/connection-test` retorna resultado estruturado
  - Casos 400 para payload inválido por variante
  - Casos 502/503 para falha operacional/upstream do teste
  - _Rastreia: Req. 1, 4, 7, 8; EC-06, EC-07_

- [x] 5. Escrever teste backend de não regressão para sync failure antes da implementação
  - Garantir que falha de sync mantém config salva existente
  - Garantir que falha de sync não limpa `selectedModelIds`
  - Garantir que erro estruturado é retornado ao chamador
  - _Rastreia: Req. 6; EC-08_

- [x] 6. Implementar serviço backend de catálogo de variantes
  - Criar `providerVariantCatalog.service.ts`
  - Resolver variantes do grupo `providers` a partir de manifest/registry
  - Aplicar filtro v1 sem hardcode no frontend
  - _Rastreia: Req. 1, 8_

- [x] 7. Implementar serviço backend de compat mapping interno por variante
  - Criar `providerVariantMapper.ts`
  - Encapsular mapeamentos temporários `openai-api -> openai` e `openai-oauth -> openai-codex` apenas no backend
  - Proteger a UI pública contra vazamento de nomes legados
  - _Rastreia: Req. 1, 3, 9; EC-02_

- [x] 8. Implementar serviço backend de teste de conexão
  - Criar `providerConnectionTest.service.ts`
  - Validar payload por variante/auth mode
  - Reutilizar adapters/serviços existentes sem persistir dados inválidos
  - Retornar health estruturado e mensagens utilizáveis pela UI
  - _Rastreia: Req. 3, 4, 7, 9; EC-03, EC-04, EC-05, EC-07_

- [x] 9. Implementar endpoints backend da console
  - Adicionar `GET /api/providers/variants` em `providerRoutes.ts`
  - Adicionar `POST /api/providers/connection-test` em `providerRoutes.ts`
  - Manter create/list/delete/sync/catalog/select/health/health-stream e rotas manuais existentes sem regressão contratual
  - _Rastreia: Req. 1, 4, 5, 8_

- [x] 10. Ajustar backend para política segura de sync/health
  - Garantir que sync failure preserve config salva e `selectedModelIds`
  - Garantir que health failure alimente estado estruturado degradado/erro
  - Garantir que permissão de save siga regras por variante declaradas no spec
  - _Rastreia: Req. 5, 6, 7; EC-08, EC-09_

- [x] 11. Escrever testes frontend para hooks/API da console antes da implementação
  - Cobrir `listProviderVariants` e `testProviderConnection` em `kernel.ts`
  - Cobrir hook agregado `useLlmConnectionConsole`
  - Cobrir invalidação/refetch após save/sync/select
  - _Rastreia: Req. 1, 2, 4, 5_

- [x] 12. Escrever testes frontend da página antes da implementação
  - Estado loading do catálogo
  - Estado vazio quando backend não retorna variantes suportadas
  - Estado de erro do catálogo
  - Fluxo `selecionar variante -> testar conexão -> salvar`
  - Exibição de erro estruturado de sync
  - Exibição de health degradado/erro
  - _Rastreia: Req. 2, 4, 6, 7; EC-01, EC-06, EC-08, EC-09_

- [x] 13. Escrever testes frontend dos componentes por variante antes da implementação
  - `openai-api` mostra `apiKey`, `baseUrl?`, `organization?`
  - `openai-oauth` não mostra segredo bruto e exibe metadados/inputs do fluxo manual
  - `ollama` exige `baseUrl`
  - Preferred model selector persiste payload compatível com `selectedModelIds`
  - _Rastreia: Req. 3, 5; EC-03, EC-04, EC-10_

- [x] 14. Implementar funções API frontend em `frontend/src/api/kernel.ts`
  - Adicionar chamadas para catálogo de variantes e teste de conexão
  - Tipar respostas estruturadas de health/erro
  - Manter compatibilidade com endpoints existentes de providers
  - _Rastreia: Req. 1, 4, 7, 8_

- [x] 15. Implementar hook agregado da nova console
  - Criar `frontend/src/hooks/useLlmConnectionConsole.ts`
  - Orquestrar providers salvos, variants catalog, test connection, save, sync, health e seleção de modelos
  - Evitar expandir `useProviders.ts` até virar novo orquestrador monolítico
  - _Rastreia: Req. 2, 4, 5, 9_

- [x] 16. Implementar a página `frontend/src/pages/LlmConnectionConsole.tsx`
  - Estruturar a tela por catálogo de variantes, formulário, teste, health, sync e seleção de modelo
  - Adotar nomenclatura módulo / grupo / variante / auth mode / health / capabilities / models synced
  - Tratar `ModelProviders.tsx` apenas como legado/referência, não como arquitetura alvo
  - _Rastreia: Req. 2, 9_

- [x] 17. Implementar componentes visuais da console
  - `VariantCatalogPanel`
  - `VariantConnectionForm`
  - `ConnectionTestPanel`
  - `PreferredModelSelector`
  - `VariantHealthSummary`
  - Reutilizar `HealthBadge` e `ToastNotification` onde fizer sentido
  - _Rastreia: Req. 2, 3, 5, 7_

- [x] 18. Implementar estados de loading, empty e error
  - Catálogo de variantes carregando/vazio
  - Falha de teste de conexão
  - Falha de save por validação de variante
  - Falha de sync com preservação da seleção anterior
  - Falha de health com sinalização degradada/erro
  - _Rastreia: Req. 2, 4, 6, 7; EC-06, EC-08, EC-09_

- [x] 19. Implementar affordance de modelo preferido compatível com contrato atual
  - UI exibe um modelo preferido/ativo
  - Persistência continua usando `selectedModelIds`
  - Garantir que nenhuma falha de sync limpe automaticamente a escolha anterior
  - _Rastreia: Req. 5; EC-10_

- [x] 20. Atualizar ou adicionar testes de integração backend/frontend
  - Backend: rotas existentes seguem funcionais após inclusão dos endpoints novos
  - Frontend: fluxo completo da console v1 passa com variantes suportadas
  - _Rastreia: Req. 5, 6, 7, 9_

- [x] 21. Verificação final obrigatória
  - Executar validação TypeScript do backend (`core/kernel && npx tsc --noEmit`)
  - Executar validação TypeScript do frontend (`frontend && npx tsc --noEmit`)
  - Executar suíte de testes backend relevante
  - Executar suíte de testes frontend relevante
  - Confirmar que o escopo não adicionou integração nova com router/channels/agents
  - _Rastreia: todos os requisitos_

---

## Edge cases rastreados

- **EC-01**: catálogo do backend não retorna variantes suportadas na v1
- **EC-02**: runtime precisa de compat mapping legado sem vazar `openai`/`openai-codex` para a UI
- **EC-03**: `openai-api` com `apiKey` ausente
- **EC-04**: `openai-oauth` tenta expor/coletar segredo bruto
- **EC-05**: `ollama` sem `baseUrl`
- **EC-06**: falha do endpoint de catálogo ou de teste antes do save
- **EC-07**: health/test retornam erro estruturado degradado/operacional
- **EC-08**: sync falha após provider já salvo
- **EC-09**: health falha, mas política por variante ainda permite save
- **EC-10**: UI usa seleção singular preferida, mas persistência continua em `selectedModelIds`
